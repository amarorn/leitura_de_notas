# Servidor Python - LlamaIndex + OCR

Servidor FastAPI que usa LlamaIndex para processar boletins escolares com OCR inteligente.

## 🚀 Instalação

### 1. Instalar dependências Python

```bash
cd server_python
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env e configure:
# - LLM_PROVIDER (openai ou ollama)
# - OPENAI_API_KEY (se usar OpenAI)
# - OCR_ENGINE (paddleocr ou tesseract)
```

### 3. Instalar OCR (escolha um)

#### Opção A: PaddleOCR (recomendado - mais preciso)
```bash
# Já incluído no requirements.txt
# PaddleOCR baixa modelos automaticamente na primeira execução
```

#### Opção B: Tesseract (alternativa)
```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-por

# Windows
# Baixe de: https://github.com/UB-Mannheim/tesseract/wiki
```

### 4. Configurar LLM (escolha um)

#### Opção A: OpenAI (recomendado - mais rápido e preciso)
```bash
# No .env:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-sua-chave-aqui
```

#### Opção B: Ollama (gratuito, local)
```bash
# Instalar Ollama: https://ollama.ai
ollama pull llama3.2

# No .env:
LLM_PROVIDER=ollama
```

## 🏃 Executar

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Rodar servidor
python main.py

# Ou com uvicorn diretamente
uvicorn main:app --reload --port 5001
```

## 📡 Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload de boletim (multipart/form-data)
- `POST /api/calculate` - Recalcular médias com média mínima customizada

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `5001` |
| `LLM_PROVIDER` | `openai` ou `ollama` | `openai` |
| `OPENAI_API_KEY` | Chave da API OpenAI | - |
| `OCR_ENGINE` | `paddleocr` ou `tesseract` | `paddleocr` |

## 🎯 Como Funciona

1. **Upload da imagem** → Salva temporariamente
2. **OCR** → PaddleOCR/Tesseract extrai texto da imagem
3. **LlamaIndex** → Processa texto com LLM e extrai dados estruturados
4. **Cálculo** → Calcula médias, status e notas necessárias
5. **Resposta JSON** → Retorna dados prontos para o front-end

## 🐛 Troubleshooting

### Erro: "No module named 'paddleocr'"
```bash
pip install paddleocr
```

### Erro: "tesseract is not installed"
```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu
sudo apt-get install tesseract-ocr
```

### Erro: "OPENAI_API_KEY not found"
- Configure no `.env` ou use Ollama (`LLM_PROVIDER=ollama`)

### Ollama muito lento
- Use OpenAI para melhor performance
- Ou use modelo menor: `ollama pull llama3.1:8b`

