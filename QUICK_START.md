# ⚡ Quick Start

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
OPENAI_API_KEY=sk-...        # sua chave OpenAI (se usar OpenAI)
OCR_ENGINE=ollama-ocr        # ou "paddleocr" / "tesseract"
OLLAMA_OCR_MODEL=llama3.2-vision:11b
OLLAMA_BASE_URL=http://localhost:11434/api/generate
OLLAMA_OCR_LANGUAGE=pt
```

> Para usar o OCR multimodal com Ollama, instale `ollama-ocr` (`pip install ollama-ocr`) e mantenha `ollama serve` rodando antes de iniciar o backend.

**Escolha seu LLM:**

- **OpenAI** (recomendado): Configure `OPENAI_API_KEY` no `.env`
- **Ollama** (gratuito): `LLM_PROVIDER=ollama` e instale: `ollama pull llama3.2`

### 3. Instalar dependências do front-end

```bash
npm install
cd client && npm install
```

### 4. Executar projeto

```bash
npm run dev
```

Isso inicia:
- **Backend Python** (porta 5001) - LlamaIndex + OCR
- **Frontend React** (porta 3000)

## 📖 Uso Rápido

1. **Acesse** http://localhost:3000
2. **Arraste** uma imagem do boletim escolar
3. **Aguarde** o processamento (10-30 segundos)
4. **Visualize** os resultados no dashboard

## 🔗 URLs Importantes

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 📋 Requisitos

- **Python 3.8+**
- **Node.js 16+**
- **npm ou yarn**
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

### Opcional (dependendo da configuração):

- **OpenAI API Key** (se usar `LLM_PROVIDER=openai`)
- **Ollama** (se usar `LLM_PROVIDER=ollama`): https://ollama.ai
- **ollama-ocr** (para usar OCR multimodal com Ollama): `pip install ollama-ocr` e mantenha `ollama serve`
- **Tesseract** (se usar `OCR_ENGINE=tesseract`):
  - macOS: `brew install tesseract tesseract-lang`
  - Ubuntu: `sudo apt-get install tesseract-ocr tesseract-ocr-por`

## 🆘 Problemas?

Veja [MIGRACAO_LLAMAINDEX.md](./MIGRACAO_LLAMAINDEX.md) para troubleshooting completo.

---

**Pronto!** 🎉 Você está pronto para usar o sistema de análise de boletim com **LlamaIndex + AI**.
