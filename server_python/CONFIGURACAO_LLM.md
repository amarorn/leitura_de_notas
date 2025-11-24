# 🔧 Configuração do LLM

O sistema precisa de um LLM (Large Language Model) para processar os boletins. Você tem duas opções:

## Opção 1: OpenAI (Recomendado - Mais rápido)

### Passos:

1. **Obtenha uma chave da API OpenAI:**
   - Acesse: https://platform.openai.com/account/api-keys
   - Faça login ou crie uma conta
   - Clique em "Create new secret key"
   - Copie a chave (ela começa com `sk-`)

2. **Configure no arquivo `.env`:**
   ```bash
   cd server_python
   nano .env  # ou use seu editor preferido
   ```

3. **Edite o arquivo:**
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-sua-chave-real-aqui
   ```

4. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

### Custos:
- OpenAI cobra por uso (aproximadamente $0.15 por 1M tokens)
- Para processar boletins, o custo é muito baixo (centavos por boletim)

---

## Opção 2: Ollama (Gratuito - Local)

### Passos:

1. **Instale o Ollama:**
   ```bash
   # macOS
   brew install ollama
   
   # Ou baixe em: https://ollama.ai
   ```

2. **Inicie o Ollama:**
   ```bash
   ollama serve
   ```

3. **Baixe um modelo (em outro terminal):**
   ```bash
   ollama pull llama3.2
   # ou
   ollama pull llama3.1:8b  # Versão menor, mais rápida
   ```

4. **Configure no arquivo `.env`:**
   ```bash
   cd server_python
   nano .env
   ```

5. **Edite o arquivo:**
   ```env
   LLM_PROVIDER=ollama
   # OPENAI_API_KEY não é necessária
   ```

6. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

### Vantagens:
- ✅ Gratuito
- ✅ Funciona offline
- ✅ Dados não saem do seu computador

### Desvantagens:
- ⚠️ Mais lento que OpenAI
- ⚠️ Requer mais recursos do computador
- ⚠️ Precisão pode ser um pouco menor

---

## Verificação

Após configurar, verifique se está funcionando:

```bash
curl http://localhost:5001/api/health
```

Você deve ver:
```json
{
  "status": "OK",
  "message": "Servidor rodando",
  "llm_provider": "openai" ou "ollama",
  "ocr_engine": "ollama-ocr"
}
```

---

## Troubleshooting

### Erro: "Incorrect API key provided"
- Verifique se a chave no `.env` está correta
- Certifique-se de que não há espaços extras
- A chave deve começar com `sk-`

### Erro: "Ollama connection refused"
- Certifique-se de que o Ollama está rodando: `ollama serve`
- Verifique se o modelo foi baixado: `ollama list`

### Erro: "Model not found"
- Baixe o modelo: `ollama pull llama3.2`

### Erro: "Erro ao usar ollama-ocr"
- Instale o cliente `ollama-ocr` (`pip install ollama-ocr`)
- Certifique-se de que `ollama serve` está ativo
- Verifique se o modelo apontado em `OLLAMA_OCR_MODEL` aparece em `ollama list`
