# 🚀 Guia de Deploy Gratuito

Este guia mostra como publicar o projeto gratuitamente usando serviços de hospedagem gratuitos.

## 📋 Opções de Deploy Gratuito

### Opção 1: Render (Recomendado - Mais Fácil) ⭐

**Vantagens:**
- ✅ Gratuito para projetos pessoais
- ✅ Suporta Python (FastAPI) e React
- ✅ Deploy automático via GitHub
- ✅ SSL/HTTPS gratuito
- ✅ Fácil configuração

#### Passo a Passo:

1. **Preparar o projeto para deploy:**

```bash
# Criar arquivo para o backend Python
cd server_python
```

Criar arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: boletim-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PORT
        value: 10000
      - key: LLM_PROVIDER
        value: ollama
      - key: OCR_ENGINE
        value: tesseract
```

2. **Criar arquivo `Procfile` para o backend:**

```bash
# Na raiz do projeto
echo "web: cd server_python && uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile
```

3. **Criar `runtime.txt` para especificar versão do Python:**

```bash
echo "python-3.9.18" > runtime.txt
```

4. **No Render:**
   - Acesse: https://render.com
   - Faça login com GitHub
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name:** boletim-backend
     - **Environment:** Python 3
     - **Build Command:** `cd server_python && pip install -r requirements.txt`
     - **Start Command:** `cd server_python && uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Environment Variables:**
       - `PORT` = `10000`
       - `LLM_PROVIDER` = `ollama`
       - `OCR_ENGINE` = `tesseract`

5. **Deploy do Frontend (React):**
   - No Render, crie outro serviço:
   - **Type:** Static Site
   - **Build Command:** `cd client && npm install && npm run build`
   - **Publish Directory:** `client/build`

**⚠️ Limitação:** Render free tier pode ter sleep após inatividade. Para evitar isso, considere Railway ou Fly.io.

---

### Opção 2: Railway (Recomendado - Sem Sleep) ⭐⭐

**Vantagens:**
- ✅ Sem sleep (sempre online)
- ✅ $5 crédito grátis/mês (suficiente para projetos pequenos)
- ✅ Deploy automático via GitHub
- ✅ SSL/HTTPS gratuito

#### Passo a Passo:

1. **Instalar Railway CLI:**

```bash
npm install -g @railway/cli
```

2. **Login:**

```bash
railway login
```

3. **Criar projeto:**

```bash
railway init
```

4. **Configurar variáveis de ambiente:**

```bash
railway variables set LLM_PROVIDER=ollama
railway variables set OCR_ENGINE=tesseract
railway variables set PORT=5001
```

5. **Deploy:**

```bash
railway up
```

6. **Para o frontend:**
   - Use Vercel (veja Opção 3)

---

### Opção 3: Vercel (Frontend) + Railway/Render (Backend) ⭐⭐⭐

**Melhor combinação para produção:**

#### Frontend no Vercel:

1. **Instalar Vercel CLI:**

```bash
npm install -g vercel
```

2. **Deploy:**

```bash
cd client
vercel
```

3. **Configurar variáveis de ambiente:**
   - No painel da Vercel, adicione:
   - `REACT_APP_API_URL` = URL do seu backend (ex: `https://seu-backend.railway.app`)

4. **Atualizar código do frontend:**

No arquivo `client/src/components/UploadPage.js` e `Dashboard.js`, substitua:

```javascript
// De:
const API_URL = 'http://localhost:5001';

// Para:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
```

#### Backend no Railway ou Render:

Siga os passos da Opção 1 ou 2 acima.

---

### Opção 4: Fly.io (Gratuito com Limites) ⭐

**Vantagens:**
- ✅ 3 VMs grátis compartilhadas
- ✅ Sem sleep
- ✅ Suporta Python e Node.js

#### Passo a Passo:

1. **Instalar Fly CLI:**

```bash
# macOS
brew install flyctl

# Ou via script
curl -L https://fly.io/install.sh | sh
```

2. **Login:**

```bash
fly auth login
```

3. **Criar app:**

```bash
cd server_python
fly launch
```

4. **Criar `fly.toml`:**

```toml
app = "seu-app-backend"
primary_region = "gru"  # São Paulo

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"
  LLM_PROVIDER = "ollama"
  OCR_ENGINE = "tesseract"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

5. **Deploy:**

```bash
fly deploy
```

---

## 🔧 Preparações Necessárias

### 1. Atualizar CORS no Backend

No arquivo `server_python/main.py`, atualize as origens permitidas:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://seu-frontend.vercel.app",  # Adicione sua URL do frontend
        "https://seu-frontend.netlify.app",  # Ou Netlify
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Criar arquivo `.env.example`

```bash
# server_python/.env.example
PORT=5001
LLM_PROVIDER=ollama
OCR_ENGINE=tesseract
OLLAMA_MODEL=gemma3:4b
OLLAMA_BASE_URL=http://localhost:11434/api/generate
```

### 3. Atualizar Frontend para usar variável de ambiente

Criar arquivo `client/.env`:

```bash
REACT_APP_API_URL=https://seu-backend.railway.app
```

E atualizar os componentes para usar:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
```

---

## 📝 Checklist de Deploy

- [ ] Backend configurado com CORS para produção
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend atualizado para usar URL do backend em produção
- [ ] Build do frontend testado localmente (`npm run build`)
- [ ] Repositório GitHub criado e código commitado
- [ ] Deploy do backend realizado
- [ ] Deploy do frontend realizado
- [ ] URLs testadas e funcionando

---

## 🆓 Comparação de Serviços Gratuitos

| Serviço | Backend | Frontend | Limites Gratuitos | Sleep |
|---------|---------|----------|-------------------|-------|
| **Render** | ✅ | ✅ | 750h/mês | ⚠️ Sim |
| **Railway** | ✅ | ⚠️ | $5 crédito/mês | ❌ Não |
| **Vercel** | ⚠️ | ✅ | Ilimitado | ❌ Não |
| **Netlify** | ⚠️ | ✅ | 100GB bandwidth | ❌ Não |
| **Fly.io** | ✅ | ⚠️ | 3 VMs compartilhadas | ❌ Não |
| **PythonAnywhere** | ✅ | ❌ | 1 app web | ⚠️ Sim |

---

## 🎯 Recomendação Final

**Para começar rápido:**
1. **Backend:** Railway (sem sleep, fácil)
2. **Frontend:** Vercel (deploy automático, rápido)

**Para máximo gratuito:**
1. **Backend:** Render (mais generoso no free tier)
2. **Frontend:** Vercel ou Netlify

---

## 📚 Recursos Adicionais

- [Documentação Render](https://render.com/docs)
- [Documentação Railway](https://docs.railway.app)
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Fly.io](https://fly.io/docs)

---

## ⚠️ Observações Importantes

1. **Ollama Local:** O Ollama precisa rodar localmente. Para produção, você precisará:
   - Usar OpenAI (pago) ou
   - Hospedar Ollama em um servidor separado (pago) ou
   - Usar apenas Tesseract OCR (gratuito)

2. **Upload de Arquivos:** Serviços gratuitos têm limites de tamanho de arquivo. Considere usar serviços de storage como:
   - Cloudinary (gratuito até 25GB)
   - AWS S3 (free tier)
   - Google Cloud Storage (free tier)

3. **Rate Limiting:** Adicione rate limiting no backend para evitar abusos.

4. **Variáveis Sensíveis:** Nunca commite arquivos `.env` com chaves reais. Use variáveis de ambiente do serviço de hospedagem.

