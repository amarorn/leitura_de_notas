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
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional
import json
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
        # Usar modelo de embeddings mais recente e disponível
        try:
            Settings.embed_model = OpenAIEmbedding(
                api_key=api_key,
                model="text-embedding-3-small"  # Modelo mais recente e disponível
            )
            print("✅ Usando OpenAI GPT-4o-mini com embeddings text-embedding-3-small")
        except Exception as e:
            print(f"⚠️  Erro ao configurar embeddings: {e}")
            print("🔄 Tentando com modelo alternativo...")
            try:
                Settings.embed_model = OpenAIEmbedding(
                    api_key=api_key,
                    model="text-embedding-ada-002"
                )
                print("✅ Usando OpenAI GPT-4o-mini com embeddings text-embedding-ada-002")
            except Exception as e2:
                print(f"❌ Erro ao configurar embeddings alternativo: {e2}")
                print("💡 Usando embeddings locais (HuggingFace) como fallback...")
                try:
                    # Usar embeddings locais do HuggingFace
                    Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
                    print("✅ Usando embeddings locais (HuggingFace)")
                except Exception as e3:
                    print(f"⚠️  Erro ao configurar embeddings locais: {e3}")
                    print("💡 Continuando sem embeddings customizados (usando padrão do LlamaIndex)")
                    # Não configurar embed_model, deixar LlamaIndex usar o padrão
if LLM_PROVIDER == "ollama":
    try:
        Settings.llm = Ollama(model="llama3.2", request_timeout=120.0)
        # Ollama não precisa de embeddings separados, usa os do modelo
        print("✅ Usando Ollama (llama3.2)")
        print("💡 Certifique-se de que o Ollama está rodando: ollama serve")
    except Exception as e:
        print(f"❌ Erro ao configurar Ollama: {e}")
        print("💡 Instale o Ollama: brew install ollama")
        print("💡 Ou configure uma chave OpenAI válida no arquivo .env")
        raise

# OCR Engine (paddleocr ou tesseract)
OCR_ENGINE = os.getenv("OCR_ENGINE", "paddleocr")  # "paddleocr" ou "tesseract"
print(f"✅ OCR Engine: {OCR_ENGINE}")


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
            # Tentar inicializar PaddleOCR com português
            # Se falhar, tentar inglês como fallback
            ocr = None
            try:
                ocr = PaddleOCR(use_angle_cls=True, lang='por')
                print("✅ PaddleOCR inicializado com português")
            except Exception as e:
                print(f"⚠️  Erro ao inicializar PaddleOCR com 'por': {e}")
                try:
                    print("🔄 Tentando com 'en' (inglês) como fallback...")
                    ocr = PaddleOCR(use_angle_cls=True, lang='en')
                    print("✅ PaddleOCR inicializado com inglês")
                except Exception as e2:
                    print(f"❌ Erro ao inicializar PaddleOCR com 'en': {e2}")
                    # Se Tesseract estiver disponível, usar como fallback
                    if TESSERACT_AVAILABLE:
                        print("🔄 Fallback automático para Tesseract...")
                        return extract_text_with_tesseract(image_path)
                    else:
                        raise HTTPException(
                            status_code=500, 
                            detail=f"PaddleOCR falhou e Tesseract não está disponível. Erro: {str(e2)}"
                        )
            
            if ocr is None:
                raise HTTPException(status_code=500, detail="Não foi possível inicializar PaddleOCR")
            
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
            print(f"❌ Erro no PaddleOCR: {str(e)}")
            # Se Tesseract estiver disponível, usar como fallback
            if TESSERACT_AVAILABLE:
                print("🔄 Fallback automático para Tesseract devido a erro no PaddleOCR...")
                try:
                    return extract_text_with_tesseract(image_path)
                except Exception as e2:
                    raise HTTPException(status_code=500, detail=f"Erro no OCR (PaddleOCR e Tesseract falharam): {str(e2)}")
            else:
                raise HTTPException(status_code=500, detail=f"Erro no OCR: {str(e)}")
    
    elif OCR_ENGINE == "tesseract":
        return extract_text_with_tesseract(image_path)
    else:
        raise HTTPException(status_code=500, detail=f"OCR engine '{OCR_ENGINE}' não suportado. Use 'paddleocr' ou 'tesseract'")


def extract_text_with_tesseract(image_path: str) -> str:
    """
    Extrai texto usando Tesseract OCR
    """
    if not TESSERACT_AVAILABLE:
        raise HTTPException(status_code=500, detail="Tesseract não está instalado. Execute: pip install pytesseract pillow")
    
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
        
        # Criar índice vetorial
        index = VectorStoreIndex.from_documents(docs)
        query_engine = index.as_query_engine()
        
        # Extrair dados estruturados
        print("🤖 Processando com LLM para extração estruturada...")
        try:
            response = query_engine.query(extraction_prompt)
        except Exception as e:
            error_msg = str(e)
            if "invalid_api_key" in error_msg.lower() or "incorrect api key" in error_msg.lower() or "401" in error_msg:
                raise HTTPException(
                    status_code=401,
                    detail="Chave da API OpenAI inválida. Configure uma chave válida em server_python/.env ou use Ollama (gratuito). Veja CONFIGURACAO_LLM.md para mais detalhes."
                )
            elif "model_not_found" in error_msg.lower() or "does not have access" in error_msg.lower() or "403" in error_msg or "text-embedding" in error_msg.lower():
                raise HTTPException(
                    status_code=403,
                    detail="Modelo de embeddings não disponível no seu projeto OpenAI. Reinicie o servidor para usar embeddings locais como fallback."
                )
            raise
        
        # Parsear resposta JSON
        response_text = str(response).strip()
        
        # Remover markdown code blocks se houver
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parsear JSON
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"⚠️  Erro ao parsear JSON: {e}")
            print(f"Resposta recebida: {response_text[:500]}")
            # Tentar extrair JSON do texto
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise HTTPException(status_code=500, detail="Não foi possível extrair JSON válido da resposta do LLM")
        
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

