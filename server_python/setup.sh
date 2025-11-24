#!/bin/bash
# Script de instalação do servidor Python

set -e

echo "🐍 Configurando ambiente Python..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.8+ primeiro."
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"

# Criar ambiente virtual
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
else
    echo "✅ Ambiente virtual já existe"
fi

# Ativar ambiente virtual
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate

# Atualizar pip
echo "⬆️  Atualizando pip..."
pip install --upgrade pip

# Instalar dependências
echo "📥 Instalando dependências Python..."
pip install -r requirements.txt

# Criar .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Porta do servidor
PORT=5001

# LLM Provider: "openai" ou "ollama"
LLM_PROVIDER=openai

# Se usar OpenAI, configure sua API key
OPENAI_API_KEY=

# OCR Engine: "ollama-ocr", "paddleocr" ou "tesseract"
OCR_ENGINE=ollama-ocr

# Configuração do ollama-ocr
OLLAMA_OCR_MODEL=llama3.2-vision:11b
OLLAMA_BASE_URL=http://localhost:11434/api/generate
OLLAMA_OCR_LANGUAGE=pt
EOF
    echo "✅ Arquivo .env criado. Configure suas variáveis de ambiente."
else
    echo "✅ Arquivo .env já existe"
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite server_python/.env e configure:"
echo "   - LLM_PROVIDER (openai ou ollama)"
echo "   - OPENAI_API_KEY (se usar OpenAI)"
echo "   - OCR_ENGINE (ollama-ocr, paddleocr ou tesseract)"
echo "   - OLLAMA_OCR_MODEL (ex: llama3.2-vision:11b)"
echo "   - OLLAMA_BASE_URL (ex: http://localhost:11434/api/generate)"
echo "   - OLLAMA_OCR_LANGUAGE (ex: pt)"
echo ""
echo "2. Para rodar o servidor:"
echo "   cd server_python"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "   Ou use: npm run server"
