# 🚀 Deploy Rápido - 5 Minutos

## ⚡ Opção Mais Rápida: Railway + Vercel

### 1️⃣ Backend (Railway)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up
```

**No painel do Railway:**
- Adicione variáveis:
  - `LLM_PROVIDER=ollama`
  - `OCR_ENGINE=tesseract`
  - `ALLOWED_ORIGINS=https://seu-frontend.vercel.app` (atualize depois)

### 2️⃣ Frontend (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Ir para pasta do client
cd client

# Deploy
vercel
```

**No painel da Vercel:**
- Adicione variável:
  - `REACT_APP_API_URL=https://seu-backend.railway.app`

### 3️⃣ Atualizar CORS

Volte ao Railway e atualize:
- `ALLOWED_ORIGINS=https://seu-app.vercel.app`

**Pronto! 🎉**

---

## 📚 Guias Completos

- **Deploy Automatizado:** `DEPLOY_AUTOMATICO.md`
- **Opções de Deploy:** `DEPLOY.md`

