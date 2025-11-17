# 🚀 Como Iniciar o Servidor

## Opção 1: Usando npm (Recomendado)

```bash
# Na raiz do projeto
npm run server
```

## Opção 2: Manualmente

```bash
cd server_python
source venv/bin/activate
python main.py
```

## Opção 3: Usando o script

```bash
cd server_python
./run.sh
```

## ✅ Verificar se está funcionando

Abra outro terminal e teste:

```bash
curl http://localhost:5001/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "message": "Servidor rodando",
  "llm_provider": "ollama",
  "ocr_engine": "paddleocr"
}
```

## 🔧 Se usar Ollama

Certifique-se de que o Ollama está rodando:

```bash
# Verificar se está rodando
ollama list

# Se não estiver, iniciar:
ollama serve
```

Em outro terminal, baixe o modelo (se ainda não tiver):

```bash
ollama pull llama3.2
```

## 🔧 Se usar OpenAI

Configure no arquivo `server_python/.env`:

```env
PORT=5001
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-sua-chave-aqui
OCR_ENGINE=paddleocr
```

## 🐛 Problemas Comuns

### Porta 5001 em uso
```bash
lsof -ti:5001 | xargs kill
```

### Ollama não encontrado
```bash
brew install ollama
ollama pull llama3.2
```

### Erro de dependências
```bash
cd server_python
source venv/bin/activate
pip install -r requirements.txt
```

