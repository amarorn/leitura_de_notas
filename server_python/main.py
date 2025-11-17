"""
Servidor FastAPI com LlamaIndex + OCR para processamento de boletins escolares
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings, Document
from llama_index.readers.file import ImageReader
from llama_index.llms.openai import OpenAI
from llama_index.llms.ollama import Ollama
import os
import shutil
import tempfile
import time
from pathlib import Path
from typing import Optional
import json
import unicodedata
from dotenv import load_dotenv

# OCR imports
try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

load_dotenv()

app = FastAPI(title="Sistema de Análise de Boletim Escolar")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Configurar LLM (OpenAI ou Ollama local)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # "openai" ou "ollama"

if LLM_PROVIDER == "openai":
    api_key = os.getenv("OPENAI_API_KEY")
    # Verificar se a chave é válida (não é a chave de exemplo)
    if not api_key or api_key.strip() == "" or "sua-chave" in api_key.lower() or "your-api-key" in api_key.lower():
        print("⚠️  OPENAI_API_KEY não configurada ou é uma chave de exemplo.")
        print("🔄 Usando Ollama como fallback (gratuito e local).")
        print("💡 Para usar OpenAI, configure uma chave válida em server_python/.env")
        LLM_PROVIDER = "ollama"
    else:
        Settings.llm = OpenAI(api_key=api_key, model="gpt-4o-mini", temperature=0)
        print("✅ Usando OpenAI GPT-4o-mini")
if LLM_PROVIDER == "ollama":
    try:
        # Timeout aumentado para 300 segundos (5 minutos) para processar textos grandes
        Settings.llm = Ollama(model="llama3.2", request_timeout=300.0)
        # Ollama não precisa de embeddings separados, usa os do modelo
        print("✅ Usando Ollama (llama3.2)")
        print("💡 Certifique-se de que o Ollama está rodando: ollama serve")
        print("⏱️  Timeout configurado: 300 segundos")
    except Exception as e:
        print(f"❌ Erro ao configurar Ollama: {e}")
        print("💡 Instale o Ollama: brew install ollama")
        print("💡 Ou configure uma chave OpenAI válida no arquivo .env")
        raise

# OCR Engine (paddleocr ou tesseract)
OCR_ENGINE = os.getenv("OCR_ENGINE", "paddleocr")  # "paddleocr" ou "tesseract"
print(f"✅ OCR Engine: {OCR_ENGINE}")

# Inicializar PaddleOCR de forma lazy (só quando necessário)
_paddleocr_instance = None

def get_paddleocr_instance():
    """Inicializa PaddleOCR de forma lazy"""
    global _paddleocr_instance
    if _paddleocr_instance is None:
        try:
            print("🔄 Inicializando PaddleOCR (pode demorar na primeira vez)...")
            _paddleocr_instance = PaddleOCR(lang='en')
            print("✅ PaddleOCR inicializado")
        except Exception as e:
            print(f"❌ Erro ao inicializar PaddleOCR: {e}")
            raise
    return _paddleocr_instance


def validate_and_sanitize_data(data: dict) -> dict:
    """
    Valida e sanitiza os dados extraídos do boletim
    """
    # Validar estrutura básica
    if not isinstance(data, dict):
        raise ValueError("Dados devem ser um dicionário")
    
    disciplinas = data.get("disciplinas", [])
    if not isinstance(disciplinas, list):
        disciplinas = []
    
    disciplinas_validas = []
    disciplinas_nomes = {}  # Para detectar duplicatas
    
    for disciplina in disciplinas:
        if not isinstance(disciplina, dict):
            continue
        
        # Normalizar nome da disciplina (remover espaços extras, manter case)
        nome = disciplina.get("nome", "").strip()
        if not nome:
            continue
        
        # Normalizar nome para comparação (lowercase, sem acentos, sem espaços extras)
        def normalize_string(s):
            # Remove acentos
            s = unicodedata.normalize('NFD', s)
            s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
            # Lowercase e remove espaços extras
            return s.lower().strip()
        
        nome_normalizado = normalize_string(nome)
        
        # Verificar duplicatas (mesma disciplina em maiúsculas/minúsculas)
        if nome_normalizado in disciplinas_nomes:
            # Se já existe, manter a que tem mais dados válidos
            disciplina_existente = disciplinas_nomes[nome_normalizado]
            notas_nova = [n for n in disciplina.get("notas", []) if n is not None]
            notas_existente = [n for n in disciplina_existente.get("notas", []) if n is not None]
            
            if len(notas_nova) > len(notas_existente):
                # Nova disciplina tem mais notas, substituir
                disciplinas_validas.remove(disciplina_existente)
            else:
                # Manter a existente, pular esta
                continue
        
        # Validar e sanitizar faltas
        faltas = disciplina.get("faltas")
        if isinstance(faltas, list):
            # Se faltas é um array, tentar extrair o primeiro valor válido
            faltas_validas = [f for f in faltas if isinstance(f, (int, float)) and f >= 0]
            faltas = sum(faltas_validas) if faltas_validas else 0
        elif isinstance(faltas, (int, float)):
            faltas = max(0, min(200, int(faltas)))  # Limitar entre 0 e 200
        else:
            faltas = 0
        
        # Validar e sanitizar notas
        notas = disciplina.get("notas", [])
        if not isinstance(notas, list):
            notas = []
        
        notas_validas = []
        for nota in notas[:3]:  # Máximo 3 notas
            if isinstance(nota, (int, float)):
                # Validar se a nota está em escala 0-10 ou 0-100
                if 0 <= nota <= 10:
                    # Já está na escala 0-10
                    notas_validas.append(round(nota, 2))
                elif 10 < nota <= 100:
                    # Está em escala 0-100, converter para 0-10
                    nota_convertida = nota / 10
                    if nota_convertida <= 10:
                        notas_validas.append(round(nota_convertida, 2))
                    else:
                        notas_validas.append(None)
                else:
                    # Valor fora do range válido (negativo ou > 100)
                    notas_validas.append(None)
            else:
                notas_validas.append(None)
        
        # Garantir que temos exatamente 3 notas
        while len(notas_validas) < 3:
            notas_validas.append(None)
        
        # Validar e sanitizar média provisória
        media_provisoria = disciplina.get("media_provisoria")
        if isinstance(media_provisoria, (int, float)):
            if 0 <= media_provisoria <= 10:
                # Já está na escala 0-10
                media_provisoria = round(media_provisoria, 2)
            elif 10 < media_provisoria <= 100:
                # Está em escala 0-100, converter para 0-10
                media_provisoria_convertida = media_provisoria / 10
                if media_provisoria_convertida <= 10:
                    media_provisoria = round(media_provisoria_convertida, 2)
                else:
                    # Valor inválido após conversão, recalcular das notas
                    media_provisoria = None
            else:
                # Valor inválido (negativo ou > 100), recalcular das notas
                media_provisoria = None
        else:
            media_provisoria = None
        
        # Validar e sanitizar média parcial
        media_parcial = disciplina.get("media_parcial")
        if isinstance(media_parcial, (int, float)):
            if 0 <= media_parcial <= 10:
                # Já está na escala 0-10
                media_parcial = round(media_parcial, 2)
            elif 10 < media_parcial <= 100:
                # Está em escala 0-100, converter para 0-10
                media_parcial_convertida = media_parcial / 10
                if media_parcial_convertida <= 10:
                    media_parcial = round(media_parcial_convertida, 2)
                else:
                    # Valor inválido após conversão, recalcular
                    media_parcial = None
            else:
                # Valor inválido (negativo ou > 100), recalcular
                media_parcial = None
        else:
            media_parcial = None
        
        # Validar e sanitizar pontos extras
        pontos_extras = disciplina.get("pontos_extras", 0)
        if isinstance(pontos_extras, (int, float)):
            pontos_extras = max(0, min(10, round(pontos_extras, 2)))
        else:
            pontos_extras = 0
        
        # Criar disciplina sanitizada
        disciplina_sanitizada = {
            "nome": nome,
            "faltas": faltas,
            "notas": notas_validas,
            "pontos_extras": pontos_extras,
        }
        
        # Adicionar médias apenas se forem válidas
        if media_provisoria is not None:
            disciplina_sanitizada["media_provisoria"] = media_provisoria
        if media_parcial is not None:
            disciplina_sanitizada["media_parcial"] = media_parcial
        
        disciplinas_validas.append(disciplina_sanitizada)
        disciplinas_nomes[nome_normalizado] = disciplina_sanitizada
    
    # Atualizar dados com disciplinas validadas
    data["disciplinas"] = disciplinas_validas
    
    return data


def calculate_averages(disciplina: dict, media_minima: float = 7.0) -> dict:
    """Calcula médias e status da disciplina"""
    notas = [n for n in disciplina.get("notas", []) if n is not None]
    qtd_notas = len(notas)
    
    # Média provisória
    media_provisoria = disciplina.get("media_provisoria")
    if media_provisoria is None and qtd_notas > 0:
        media_provisoria = sum(notas) / qtd_notas
    
    # Pontos extras
    pontos_extras = disciplina.get("pontos_extras", 0) or 0
    
    # Média parcial (com pontos extras, limitada a 10)
    media_parcial = disciplina.get("media_parcial")
    if media_parcial is None:
        media_parcial = min((media_provisoria or 0) + pontos_extras, 10)
    
    # Status e nota necessária
    todas_notas_lancadas = qtd_notas >= 3 and all(n is not None for n in disciplina.get("notas", [])[:3])
    
    nota_necessaria = None
    if not todas_notas_lancadas and qtd_notas > 0:
        faltam_notas = 3 - qtd_notas
        soma_atual = sum(notas) + pontos_extras
        total_necessario = media_minima * 3
        nota_faltante = (total_necessario - soma_atual) / faltam_notas if faltam_notas > 0 else 0
        
        if 0 < nota_faltante <= 10:
            nota_necessaria = round(nota_faltante, 2)
    
    # Status
    if qtd_notas == 0:
        status = "Sem Notas"
        nota_necessaria = media_minima
    elif media_parcial >= media_minima:
        status = "Aprovado"
    elif media_parcial >= media_minima * 0.6:
        status = "Em Recuperação"
    else:
        status = "Reprovado"
    
    return {
        "media_provisoria": round(media_provisoria or 0, 2),
        "media_parcial": round(media_parcial, 2),
        "qtd_notas": qtd_notas,
        "nota_necessaria": nota_necessaria,
        "status": status,
        "media_minima": media_minima
    }


def extract_text_with_ocr(image_path: str) -> str:
    """
    Extrai texto da imagem usando OCR (PaddleOCR ou Tesseract)
    """
    print(f"🔍 Iniciando OCR com {OCR_ENGINE}...")
    
    if OCR_ENGINE == "paddleocr":
        if not PADDLEOCR_AVAILABLE:
            raise HTTPException(status_code=500, detail="PaddleOCR não está instalado. Execute: pip install paddleocr")
        
        try:
            # Usar instância lazy do PaddleOCR
            try:
                ocr = get_paddleocr_instance()
            except Exception as e:
                print(f"⚠️  Erro ao inicializar PaddleOCR: {e}")
                # Se Tesseract estiver disponível, usar como fallback
                if TESSERACT_AVAILABLE:
                    print("🔄 Fallback automático para Tesseract...")
                    return extract_text_with_tesseract(image_path)
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"PaddleOCR falhou. Para usar Tesseract como alternativa, instale: brew install tesseract tesseract-lang (macOS) ou sudo apt-get install tesseract-ocr tesseract-ocr-por (Linux). Erro: {str(e)}"
                    )
            
            result = ocr.ocr(image_path, cls=True)
            
            # Extrair texto de todos os resultados
            text_lines = []
            if result and result[0]:
                for line in result[0]:
                    if line and len(line) >= 2:
                        text_lines.append(line[1][0])  # line[1][0] é o texto reconhecido
            
            text = "\n".join(text_lines)
            print(f"✅ OCR concluído. Texto extraído: {len(text)} caracteres")
            return text
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Erro no PaddleOCR durante processamento: {str(e)}")
            # Se Tesseract estiver disponível, usar como fallback
            if TESSERACT_AVAILABLE:
                print("🔄 Fallback automático para Tesseract devido a erro no PaddleOCR...")
                try:
                    return extract_text_with_tesseract(image_path)
                except Exception as e2:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Erro no OCR (PaddleOCR e Tesseract falharam). PaddleOCR: {str(e)}. Tesseract: {str(e2)}"
                    )
            else:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Erro no PaddleOCR: {str(e)}. Para usar Tesseract como alternativa, instale: brew install tesseract tesseract-lang (macOS)"
                )
    
    elif OCR_ENGINE == "tesseract":
        return extract_text_with_tesseract(image_path)
    else:
        raise HTTPException(status_code=500, detail=f"OCR engine '{OCR_ENGINE}' não suportado. Use 'paddleocr' ou 'tesseract'")


def extract_text_with_tesseract(image_path: str) -> str:
    """
    Extrai texto usando Tesseract OCR
    """
    if not TESSERACT_AVAILABLE:
        raise HTTPException(
            status_code=500, 
            detail="Tesseract não está instalado. Instale: brew install tesseract tesseract-lang (macOS) ou sudo apt-get install tesseract-ocr tesseract-ocr-por (Linux). Depois: pip install pytesseract pillow"
        )
    
    try:
        image = Image.open(image_path)
        # Tentar português primeiro, se falhar usar inglês
        try:
            text = pytesseract.image_to_string(image, lang='por')
        except Exception as e:
            print(f"⚠️  Erro ao usar Tesseract com 'por': {e}")
            print("🔄 Tentando com 'eng' (inglês)...")
            text = pytesseract.image_to_string(image, lang='eng')
        
        print(f"✅ OCR concluído. Texto extraído: {len(text)} caracteres")
        return text
    except Exception as e:
        print(f"❌ Erro no Tesseract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no OCR: {str(e)}")


def extract_boletim_data_with_llamaindex(image_path: str) -> dict:
    """
    Extrai dados do boletim usando LlamaIndex + OCR
    """
    print(f"📄 Processando imagem: {image_path}")
    
    # Prompt otimizado para extração estruturada
    extraction_prompt = """
Você é um especialista em análise de boletins escolares. Extraia TODOS os dados do boletim e retorne APENAS um JSON válido, sem texto adicional.

Estrutura esperada do JSON:
{
  "aluno": "NOME COMPLETO DO ALUNO",
  "matricula": "NÚMERO DA MATRÍCULA",
  "turma": "CÓDIGO DA TURMA (ex: 7A, 7B)",
  "ano": 2024,
  "bimestre": "1º Bimestre" ou "2º Bimestre" etc,
  "disciplinas": [
    {
      "nome": "NOME DA DISCIPLINA (exatamente como aparece)",
      "faltas": 0,
      "notas": [10.0, 9.5, null],  // Array com 3 notas (1ª AV, 2ª AV, 3ª AV), use null se não houver
      "pontos_extras": 0,
      "media_provisoria": 9.75,  // Se disponível no boletim
      "media_parcial": 10.0      // Se disponível no boletim
    }
  ]
}

REGRAS IMPORTANTES:
1. Extraia TODAS as disciplinas encontradas no boletim (pode variar de 13 a 25+ dependendo da série)
2. As notas devem ser números decimais ou null se não houver nota
3. Mantenha os nomes das disciplinas EXATAMENTE como aparecem (com acentos e maiúsculas)
4. Se houver subtabelas (ex: Biologia I / Biologia II, Física I / Física II, Literatura / Análise Linguística / Produção de Texto), trate cada uma como uma disciplina separada com seu nome completo
5. Valores vazios ou traços (-) devem ser null
6. Retorne APENAS o JSON, sem markdown, sem explicações, sem ```json
7. Para faltas, use 0 se não houver faltas ou o número exato de faltas

Disciplinas comuns (podem variar por série):
- EMPREENDEDORISMO
- FILOSOFIA
- GEOGRAFIA
- HISTÓRIA
- SOCIOLOGIA
- BIOLOGIA (pode ter subtabelas: Biologia I, Biologia II)
- FÍSICA (pode ter subtabelas: Física I, Física II)
- QUÍMICA
- REDAÇÃO
- ÉTICA E CIDADANIA
- CIÊNCIAS
- EDUCAÇÃO FÍSICA
- ENSINO DA ARTE
- ESPANHOL
- INGLÊS
- LÍNGUA PORTUGUESA (pode ter subtabelas: Literatura, Análise Linguística, Produção de Texto)
- MATEMÁTICA
- PROJETO DE VIDA
- UNIDADE CURRICULAR DE HUMANAS
- UNIDADE CURRICULAR DE NATUREZA
- TRAJETÓRIA DE LEITURA E ESCRITA

IMPORTANTE: 
- Se uma disciplina tiver subtabelas (ex: Biologia I / Biologia II), trate cada uma como uma disciplina separada
- Mantenha o nome completo da disciplina/subdisciplina exatamente como aparece
- Extraia TODAS as disciplinas encontradas, não apenas as listadas acima

Extraia todos os dados visíveis no boletim e retorne o JSON completo.
"""
    
    try:
        # Extrair texto usando OCR
        ocr_text = extract_text_with_ocr(image_path)
        
        # Criar documento do LlamaIndex com o texto extraído
        doc = Document(text=ocr_text)
        docs = [doc]
        
        print(f"📝 Texto OCR preparado para processamento com LLM")
        
        # Para Ollama, usar LLM diretamente sem VectorStoreIndex (mais simples e não precisa de embeddings)
        if LLM_PROVIDER == "ollama":
            print("🤖 Processando com Ollama (modo direto, sem embeddings)...")
            print(f"📊 Tamanho do texto OCR: {len(ocr_text)} caracteres")
            
            # Limitar tamanho do texto se for muito grande (evitar timeout)
            max_text_length = 8000  # Limite razoável para evitar timeout
            if len(ocr_text) > max_text_length:
                print(f"⚠️  Texto muito grande ({len(ocr_text)} chars), truncando para {max_text_length} chars...")
                ocr_text = ocr_text[:max_text_length] + "\n[... texto truncado ...]"
            
            # Verificar se o Ollama está respondendo (teste rápido)
            try:
                print("🔍 Verificando conexão com Ollama...")
                test_response = Settings.llm.complete("test")
                print("✅ Ollama está respondendo")
            except Exception as e:
                print(f"⚠️  Aviso: Ollama pode não estar respondendo corretamente: {e}")
                print("💡 Certifique-se de que o Ollama está rodando: ollama serve")
            
            # Tentar processar com retry
            max_retries = 3
            retry_delay = 2  # segundos
            response_text = None
            
            for attempt in range(max_retries):
                try:
                    # Usar o LLM diretamente com o texto completo
                    full_prompt = f"{extraction_prompt}\n\nTexto extraído do boletim:\n\n{ocr_text}"
                    print(f"🔄 Tentativa {attempt + 1}/{max_retries}...")
                    print(f"📤 Enviando prompt para Ollama (tamanho: {len(full_prompt)} chars)...")
                    
                    response = Settings.llm.complete(full_prompt)
                    response_text = str(response)
                    
                    if response_text and len(response_text) > 0:
                        print(f"✅ Resposta recebida do Ollama ({len(response_text)} chars)")
                        
                        # Verificar se o JSON parece estar completo
                        response_clean = response_text.strip()
                        # Remover markdown se houver
                        if "```json" in response_clean:
                            response_clean = response_clean.split("```json")[1].split("```")[0].strip()
                        elif "```" in response_clean:
                            response_clean = response_clean.split("```")[1].split("```")[0].strip()
                        
                        # Verificar se parece JSON completo (tem chaves de abertura e fechamento balanceadas)
                        open_braces = response_clean.count('{')
                        close_braces = response_clean.count('}')
                        
                        # Se tiver mais de 2 chaves abertas e estiver desbalanceado, pode estar incompleto
                        if open_braces > 2 and open_braces != close_braces:
                            print(f"⚠️  JSON pode estar incompleto (abertas: {open_braces}, fechadas: {close_braces})")
                            # Tentar validar rapidamente
                            try:
                                json.loads(response_clean)
                                print("✅ JSON válido apesar do desbalanceamento")
                                break  # JSON válido, sair do loop
                            except json.JSONDecodeError:
                                if attempt < max_retries - 1:
                                    print("🔄 JSON incompleto detectado, tentando novamente...")
                                    raise Exception("JSON incompleto na resposta")
                                else:
                                    print("⚠️  JSON incompleto, mas última tentativa. Tentando reparar depois...")
                                    break  # Continuar para tentar reparar depois
                        else:
                            break  # JSON parece completo, sair do loop
                    else:
                        raise Exception("Resposta vazia do Ollama")
                        
                except Exception as e:
                    error_msg = str(e)
                    error_type = type(e).__name__
                    print(f"⚠️  Erro na tentativa {attempt + 1}/{max_retries} ({error_type}): {error_msg}")
                    
                    # Verificar se é erro de conexão
                    if "disconnected" in error_msg.lower() or "connection" in error_msg.lower():
                        print("🔌 Erro de conexão detectado. O Ollama pode ter desconectado.")
                        if attempt < max_retries - 1:
                            print("💡 Tentando reconectar...")
                    
                    if attempt < max_retries - 1:
                        # Aguardar antes de tentar novamente
                        print(f"⏳ Aguardando {retry_delay} segundos antes de tentar novamente...")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Backoff exponencial
                    else:
                        # Última tentativa falhou
                        print(f"❌ Todas as tentativas falharam")
                        raise HTTPException(
                            status_code=500,
                            detail=f"Erro ao processar com Ollama após {max_retries} tentativas. Certifique-se de que o Ollama está rodando: ollama serve. Tipo de erro: {error_type}. Mensagem: {error_msg}"
                        )
            
            if not response_text:
                raise HTTPException(
                    status_code=500,
                    detail="Não foi possível obter resposta do Ollama após todas as tentativas"
                )
        else:
            # Para OpenAI, usar VectorStoreIndex (precisa de embeddings)
            print("🤖 Processando com OpenAI (usando VectorStoreIndex)...")
            try:
                # Criar índice vetorial
                index = VectorStoreIndex.from_documents(docs)
                query_engine = index.as_query_engine()
                response = query_engine.query(extraction_prompt)
                response_text = str(response)
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Erro ao processar com OpenAI: {error_msg}")
                raise
        
        # Parsear resposta JSON (response_text já foi definido acima)
        response_text = response_text.strip()
        
        # Remover markdown code blocks se houver
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Função para tentar reparar JSON incompleto
        def try_repair_json(text):
            """Tenta reparar JSON incompleto fechando estruturas abertas"""
            text = text.strip()
            original_text = text
            
            # Contar aberturas e fechamentos
            open_braces = text.count('{')
            close_braces = text.count('}')
            open_brackets = text.count('[')
            close_brackets = text.count(']')
            
            # Fechar estruturas abertas
            missing_braces = open_braces - close_braces
            missing_brackets = open_brackets - close_brackets
            
            # Se estiver no meio de uma string, tentar fechar
            quote_count = text.count('"')
            if quote_count % 2 != 0:
                # String não fechada, encontrar a última abertura de string
                last_open_quote = text.rfind('"')
                if last_open_quote > 0:
                    # Verificar o contexto antes da última aspas
                    before_quote = text[:last_open_quote]
                    # Se há um número par de aspas antes, então a última é uma abertura
                    if before_quote.count('"') % 2 == 0:
                        # Estamos no meio de uma string, fechar ela
                        # Encontrar onde a string deveria terminar (antes de : ou , ou })
                        remaining = text[last_open_quote+1:]
                        # Se não há mais nada ou só espaços, fechar a string
                        if not remaining.strip() or remaining.strip().startswith((':', ',', '}', ']')):
                            # Inserir aspas de fechamento antes do próximo caractere
                            if remaining.strip():
                                next_char_pos = len(text) - len(remaining.lstrip())
                                text = text[:next_char_pos] + '"' + text[next_char_pos:]
                            else:
                                text = text + '"'
            
            # Remover vírgulas finais antes de fechar estruturas
            text = text.rstrip()
            while text.endswith(','):
                text = text[:-1].rstrip()
            
            # Fechar arrays abertos
            if missing_brackets > 0:
                text += ']' * missing_brackets
            
            # Fechar objetos abertos
            if missing_braces > 0:
                text += '}' * missing_braces
            
            # Se ainda estiver quebrado, tentar uma abordagem mais agressiva
            # Remover a última disciplina incompleta se necessário
            if missing_braces > 0 or missing_brackets > 0:
                # Tentar encontrar o último objeto de disciplina completo
                last_complete_disciplina = original_text.rfind('},')
                if last_complete_disciplina > 0:
                    # Pegar tudo até o último objeto completo + fechar arrays/objetos
                    text = original_text[:last_complete_disciplina+1]
                    # Fechar o array de disciplinas
                    if text.count('[') > text.count(']'):
                        text += ']'
                    # Fechar o objeto principal
                    if text.count('{') > text.count('}'):
                        text += '}'
            
            return text
        
        # Parsear JSON
        data = None
        json_parse_attempts = 0
        max_json_attempts = 3
        
        while json_parse_attempts < max_json_attempts:
            try:
                data = json.loads(response_text)
                break  # Sucesso
            except json.JSONDecodeError as e:
                json_parse_attempts += 1
                print(f"⚠️  Erro ao parsear JSON (tentativa {json_parse_attempts}/{max_json_attempts}): {e}")
                
                if json_parse_attempts == 1:
                    # Primeira tentativa: tentar extrair JSON do texto
                    import re
                    json_match = re.search(r'\{.*', response_text, re.DOTALL)
                    if json_match:
                        response_text = json_match.group()
                        print("🔍 Tentando extrair JSON do texto...")
                        continue
                
                elif json_parse_attempts == 2:
                    # Segunda tentativa: tentar reparar JSON incompleto
                    print("🔧 Tentando reparar JSON incompleto...")
                    response_text = try_repair_json(response_text)
                    continue
                
                else:
                    # Última tentativa: mostrar erro detalhado
                    print(f"❌ Não foi possível parsear JSON após {max_json_attempts} tentativas")
                    print(f"📄 Resposta recebida (primeiros 1000 chars): {response_text[:1000]}")
                    print(f"📄 Resposta recebida (últimos 500 chars): {response_text[-500:]}")
                    
                    # Tentar extrair pelo menos algumas informações
                    import re
                    # Tentar extrair disciplinas mesmo com JSON quebrado
                    disciplina_matches = re.findall(r'"nome"\s*:\s*"([^"]+)"', response_text)
                    if disciplina_matches:
                        print(f"⚠️  Encontradas {len(disciplina_matches)} disciplinas mesmo com JSON quebrado")
                        print(f"📋 Disciplinas encontradas: {disciplina_matches[:5]}...")
                    
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Não foi possível extrair JSON válido da resposta do LLM. O JSON pode estar incompleto. Erro: {str(e)}"
                    )
        
        if data is None:
            raise HTTPException(status_code=500, detail="Não foi possível parsear JSON após todas as tentativas")
        
        print(f"✅ Dados extraídos: {len(data.get('disciplinas', []))} disciplinas")
        return data
        
    except Exception as e:
        print(f"❌ Erro na extração: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check"""
    return {
        "status": "OK",
        "message": "Servidor rodando",
        "llm_provider": LLM_PROVIDER,
        "ocr_engine": OCR_ENGINE
    }


@app.post("/api/upload")
async def upload_boletim(boletim: UploadFile = File(..., alias="boletim")):
    """
    Upload e processamento de boletim escolar
    """
    # Validar tipo de arquivo
    if not boletim.content_type or not boletim.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens são permitidas")
    
    # Salvar arquivo temporário
    temp_file = UPLOAD_DIR / f"{os.urandom(8).hex()}-{boletim.filename}"
    
    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(boletim.file, buffer)
        
        print(f"📤 Arquivo recebido: {boletim.filename} ({temp_file.stat().st_size} bytes)")
        
        # Extrair dados com LlamaIndex
        extracted_data = extract_boletim_data_with_llamaindex(str(temp_file))
        
        # Validar e sanitizar dados extraídos
        print("🔍 Validando e sanitizando dados extraídos...")
        extracted_data = validate_and_sanitize_data(extracted_data)
        print(f"✅ Dados validados: {len(extracted_data.get('disciplinas', []))} disciplinas")
        
        # Processar disciplinas (calcular médias)
        disciplinas_processadas = []
        for disciplina in extracted_data.get("disciplinas", []):
            calculos = calculate_averages(disciplina, 7.0)
            disciplina_completa = {
                **disciplina,
                **calculos
            }
            disciplinas_processadas.append(disciplina_completa)
        
        # Atualizar dados extraídos
        extracted_data["disciplinas"] = disciplinas_processadas
        
        # Limpar arquivo temporário
        temp_file.unlink()
        
        return JSONResponse({
            "success": True,
            "dados": extracted_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        # Limpar arquivo em caso de erro
        if temp_file.exists():
            temp_file.unlink()
        print(f"❌ Erro no upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")


@app.post("/api/calculate")
async def calculate_medias(data: dict):
    """
    Recalcula médias com média mínima customizada
    """
    disciplinas = data.get("disciplinas", [])
    media_minima = data.get("mediaMinima", 7.0)
    
    if not disciplinas:
        raise HTTPException(status_code=400, detail="Dados inválidos")
    
    disciplinas_processadas = []
    for disciplina in disciplinas:
        calculos = calculate_averages(disciplina, media_minima)
        disciplina_completa = {
            **disciplina,
            **calculos
        }
        disciplinas_processadas.append(disciplina_completa)
    
    return JSONResponse({
        "success": True,
        "disciplinas": disciplinas_processadas
    })


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5001))
    print(f"\n🚀 Iniciando servidor na porta {port}...")
    print(f"📡 API disponível em http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)

