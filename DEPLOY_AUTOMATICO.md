# 🚀 Deploy Automatizado - Passo a Passo

Este guia vai te ajudar a fazer o deploy completo do projeto em menos de 10 minutos.

## 📋 Pré-requisitos

- Conta no GitHub
- Conta no Railway (https://railway.app) - Gratuito com $5 crédito/mês
- Conta no Vercel (https://vercel.com) - Gratuito

## 🎯 Opção Rápida: Railway + Vercel (Recomendado)

### Passo 1: Preparar o Repositório

```bash
# 1. Adicionar todos os arquivos
git add .

# 2. Fazer commit
git commit -m "Preparar projeto para deploy em produção"

# 3. Enviar para GitHub
git push origin main
```

### Passo 2: Deploy do Backend (Railway)

1. **Acesse:** https://railway.app
2. **Faça login** com GitHub
3. **Clique em:** "New Project" → "Deploy from GitHub repo"
4. **Selecione** seu repositório `leitura_de_notas`
5. **Configure:**
   - **Root Directory:** `/server_python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

6. **Adicione Variáveis de Ambiente:**
   - Clique em "Variables"
   - Adicione:
     ```
     LLM_PROVIDER=ollama
     OCR_ENGINE=tesseract
     PORT=5001
     ALLOWED_ORIGINS=https://seu-frontend.vercel.app
     ```
   - ⚠️ **IMPORTANTE:** Substitua `seu-frontend.vercel.app` pela URL real depois do deploy do frontend

7. **Aguarde o deploy** (pode levar 2-5 minutos)

8. **Copie a URL** do backend (ex: `https://seu-backend.railway.app`)

### Passo 3: Deploy do Frontend (Vercel)

1. **Acesse:** https://vercel.com
2. **Faça login** com GitHub
3. **Clique em:** "Add New Project"
4. **Importe** seu repositório `leitura_de_notas`
5. **Configure:**
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

6. **Adicione Variável de Ambiente:**
   - Clique em "Environment Variables"
   - Adicione:
     ```
     REACT_APP_API_URL=https://seu-backend.railway.app
     ```
   - ⚠️ **Substitua** pela URL real do Railway que você copiou no Passo 2

7. **Clique em:** "Deploy"

8. **Aguarde o deploy** (pode levar 2-3 minutos)

9. **Copie a URL** do frontend (ex: `https://seu-app.vercel.app`)

### Passo 4: Atualizar CORS no Backend

1. **Volte ao Railway**
2. **Edite a variável** `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://seu-app.vercel.app
   ```
3. **Salve** e aguarde o redeploy automático

### Passo 5: Testar

1. Acesse a URL do Vercel
2. Faça upload de uma imagem de boletim
3. Verifique se está funcionando!

---

## 🔄 Alternativa: Render (Tudo em um lugar)

### Passo 1: Preparar Repositório (mesmo do acima)

### Passo 2: Deploy no Render

1. **Acesse:** https://render.com
2. **Faça login** com GitHub
3. **Criar Web Service (Backend):**
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório
   - Configure:
     - **Name:** `boletim-backend`
     - **Environment:** `Python 3`
     - **Build Command:** `cd server_python && pip install -r requirements.txt`
     - **Start Command:** `cd server_python && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:**
     ```
     LLM_PROVIDER=ollama
     OCR_ENGINE=tesseract
     PORT=10000
     ```
   - Clique em "Create Web Service"

4. **Criar Static Site (Frontend):**
   - Clique em "New +" → "Static Site"
   - Conecte seu repositório
   - Configure:
     - **Name:** `boletim-frontend`
     - **Build Command:** `cd client && npm install && npm run build`
     - **Publish Directory:** `client/build`
   - **Environment Variables:**
     ```
     REACT_APP_API_URL=https://boletim-backend.onrender.com
     ```
   - Clique em "Create Static Site"

5. **Atualizar CORS:**
   - No Web Service, adicione variável:
     ```
     ALLOWED_ORIGINS=https://boletim-frontend.onrender.com
     ```

---

## 🐛 Troubleshooting

### Erro: "CORS policy"
- Verifique se `ALLOWED_ORIGINS` no backend inclui a URL do frontend
- Certifique-se de usar `https://` nas URLs

### Erro: "Connection refused"
- Verifique se `REACT_APP_API_URL` no frontend está correto
- Certifique-se de que o backend está rodando

### Erro: "Module not found"
- Verifique se todas as dependências estão no `requirements.txt` (backend)
- Verifique se todas as dependências estão no `package.json` (frontend)

### Build falha
- Verifique os logs no Railway/Render/Vercel
- Certifique-se de que o Python está na versão correta (3.9+)
- Certifique-se de que o Node.js está na versão correta (16+)

---

## 📝 Checklist Final

- [ ] Repositório no GitHub atualizado
- [ ] Backend deployado e funcionando
- [ ] Frontend deployado e funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Teste de upload funcionando
- [ ] URLs funcionando em produção

---

## 🎉 Pronto!

Seu projeto está no ar! Compartilhe a URL do frontend com quem precisar usar.

