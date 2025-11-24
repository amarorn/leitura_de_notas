# ⚡ Início Rápido - Deploy em 5 Minutos

## 🎯 Escolha sua Plataforma

### Opção 1: Railway + Vercel (Recomendado) ⭐

**Por quê?**
- ✅ Sem sleep (sempre online)
- ✅ Deploy automático via GitHub
- ✅ SSL/HTTPS gratuito
- ✅ $5 crédito grátis/mês (Railway)

#### Passos:

1. **Fazer push para GitHub:**
```bash
git push origin main
```

2. **Deploy Backend (Railway):**
   - Acesse: https://railway.app
   - Login com GitHub
   - "New Project" → "Deploy from GitHub repo"
   - Selecione seu repositório
   - **Root Directory:** `/server_python`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Variáveis:**
     - `LLM_PROVIDER=ollama`
     - `OCR_ENGINE=tesseract`
     - `ALLOWED_ORIGINS=https://seu-frontend.vercel.app` (atualize depois)

3. **Deploy Frontend (Vercel):**
   - Acesse: https://vercel.com
   - Login com GitHub
   - "Add New Project" → Importe repositório
   - **Root Directory:** `client`
   - **Variável:**
     - `REACT_APP_API_URL=https://seu-backend.railway.app`

4. **Atualizar CORS:**
   - Volte ao Railway
   - Atualize `ALLOWED_ORIGINS` com a URL do Vercel

**Pronto! 🎉**

---

### Opção 2: Render (Tudo em um lugar)

1. **Fazer push para GitHub:**
```bash
git push origin main
```

2. **Acesse:** https://render.com
3. **Login** com GitHub
4. **Criar 2 serviços:**
   - **Web Service** (backend) - use `render.yaml`
   - **Static Site** (frontend) - configure manualmente

**Veja:** `DEPLOY_AUTOMATICO.md` para detalhes completos

---

## 📚 Documentação Completa

- **Guia Automatizado:** `DEPLOY_AUTOMATICO.md`
- **Todas as Opções:** `DEPLOY.md`
- **Início Rápido:** Este arquivo

---

## 🆘 Precisa de Ajuda?

Consulte `DEPLOY_AUTOMATICO.md` para troubleshooting e soluções de problemas comuns.

