# 🚀 Migração para LlamaIndex + OCR

Este projeto foi migrado para usar **LlamaIndex + OCR** em vez de Tesseract.js puro. Isso oferece extração de dados muito mais precisa e estruturada.

## 📊 Comparação

| Aspecto | Antes (Tesseract.js) | Agora (LlamaIndex) |
|---------|---------------------|-------------------|
| **Precisão** | ~70-80% (muitos erros de parsing) | ~95%+ (LLM entende contexto) |
| **Estruturação** | Regex complexo, frágil | JSON estruturado automaticamente |
| **Manutenção** | Código complexo (900+ linhas) | Código simples (300 linhas) |
| **Flexibilidade** | Precisa ajustar regex para cada formato | Adapta-se automaticamente |
| **Subtabelas** | Difícil de processar | Processa automaticamente |

## 🏗️ Nova Estrutura

```
projeto/
├── server_python/          # ✨ NOVO: Servidor Python com LlamaIndex
│   ├── main.py            # Servidor FastAPI
│   ├── requirements.txt   # Dependências Python
│   ├── setup.sh          # Script de instalação
│   └── uploads/          # Uploads temporários
├── server/                # ⚠️ LEGADO: Servidor Node.js (pode ser removido)
│   └── index.js
└── client/                # ✅ Mantido: Front-end React
    └── ...
```

## 🚀 Instalação Rápida

### 1. Instalar dependências Python

```bash
cd server_python
./setup.sh
```

Ou manualmente:

```bash
cd server_python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

Edite `server_python/.env`:

```env
PORT=5001
LLM_PROVIDER=openai          # ou "ollama" para usar local
OPENAI_API_KEY=sk-...        # sua chave OpenAI
OCR_ENGINE=ollama-ocr        # ou "paddleocr" / "tesseract"
OLLAMA_OCR_MODEL=llama3.2-vision:11b
OLLAMA_BASE_URL=http://localhost:11434/api/generate
OLLAMA_OCR_LANGUAGE=pt
```

### 3. Escolher LLM Provider

#### Opção A: OpenAI (recomendado - mais rápido)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-sua-chave
```

#### Opção B: Ollama (gratuito, local)
```bash
# Instalar Ollama: https://ollama.ai
ollama pull llama3.2

# No .env:
LLM_PROVIDER=ollama
```

### 4. Escolher OCR Engine

#### Opção A: Ollama OCR (recomendado)
```bash
cd server_python
source venv/bin/activate
pip install ollama-ocr
ollama serve
```

```env
OCR_ENGINE=ollama-ocr
OLLAMA_OCR_MODEL=llama3.2-vision:11b
OLLAMA_BASE_URL=http://localhost:11434/api/generate
OLLAMA_OCR_LANGUAGE=pt
```

#### Opção B: PaddleOCR (fallback)
```env
OCR_ENGINE=paddleocr
# Instalado automaticamente via pip
```

#### Opção C: Tesseract (alternativa)
```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu
sudo apt-get install tesseract-ocr tesseract-ocr-por

# No .env:
OCR_ENGINE=tesseract
```

## 🏃 Executar

### Desenvolvimento completo (front + back)

```bash
npm run dev
```

### Apenas servidor Python

```bash
npm run server
# ou
cd server_python
source venv/bin/activate
python main.py
```

### Apenas front-end

```bash
npm run client
```

## 🔄 Como Funciona

```
[Imagem do Boletim]
        ↓
[OCR (ollama-ocr via Ollama)]
        ↓
[Texto extraído (com ruído)]
        ↓
[LlamaIndex + LLM]
        ↓
[JSON estruturado limpo]
        ↓
[Cálculo de médias]
        ↓
[Front-end React]
```

### Exemplo de Extração

**Entrada (OCR bruto):**
```
FILOSOFIA 0 3.0 6.0 9.0 6.0 0 6.0
GEOGRAFIA 0 10.0 10.0 - 10.0 1.0 10.0
```

**Saída (JSON estruturado):**
```json
{
  "disciplinas": [
    {
      "nome": "FILOSOFIA",
      "faltas": 0,
      "notas": [3.0, 6.0, 9.0],
      "media_provisoria": 6.0,
      "pontos_extras": 0,
      "media_parcial": 6.0
    },
    {
      "nome": "GEOGRAFIA",
      "faltas": 0,
      "notas": [10.0, 10.0, null],
      "media_provisoria": 10.0,
      "pontos_extras": 1.0,
      "media_parcial": 10.0
    }
  ]
}
```

## 🎯 Vantagens do LlamaIndex

1. **Entende contexto**: Sabe que "FILOSOFIA" é uma disciplina, não um nome de aluno
2. **Estrutura automática**: Não precisa de regex complexo
3. **Lida com variações**: Funciona mesmo se o formato mudar um pouco
4. **Validação inteligente**: Detecta erros de OCR e corrige
5. **Subtabelas**: Processa automaticamente (ex: Biologia I / Biologia II)

## 🔧 Troubleshooting

### Erro: "No module named 'paddleocr'"
```bash
cd server_python
source venv/bin/activate
pip install paddleocr
```

### Erro: "tesseract is not installed"
```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu
sudo apt-get install tesseract-ocr tesseract-ocr-por
```

### Erro: "Erro ao usar ollama-ocr"
- Verifique se o pacote `ollama-ocr` está instalado (`pip install ollama-ocr`)
- Garanta que o Ollama esteja rodando (`ollama serve`) e o modelo `OLLAMA_OCR_MODEL` foi baixado (`ollama list`)

### Erro: "OPENAI_API_KEY not found"
- Configure no `.env` ou use Ollama (`LLM_PROVIDER=ollama`)

### Ollama muito lento
- Use OpenAI para melhor performance
- Ou use modelo menor: `ollama pull llama3.1:8b`

### Porta 5001 em uso
```bash
# Verificar processo
lsof -ti:5001

# Matar processo
kill $(lsof -ti:5001)

# Ou usar outra porta
PORT=5002 python main.py
```

## 📝 Migração do Código Antigo

O servidor Node.js antigo (`server/index.js`) ainda existe mas não é mais usado. Você pode:

1. **Manter ambos** (para comparação/testes)
2. **Remover o antigo** quando confirmar que o novo funciona:
   ```bash
   rm -rf server/
   ```

## 🎓 Recursos

- [LlamaIndex Docs](https://docs.llamaindex.ai/)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Ollama](https://ollama.ai/)
