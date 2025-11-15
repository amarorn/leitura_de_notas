# 🚀 Guia Rápido de Instalação

## Pré-requisitos

- **Node.js**: Versão 16 ou superior
- **npm** ou **yarn**: Gerenciador de pacotes
- **Git** (opcional): Para clonar o repositório

## Instalação Passo a Passo

### 1. Instalar Dependências

Execute na raiz do projeto:

```bash
npm run install-all
```

Isso instalará as dependências de:
- Raiz do projeto
- Backend (`server/`)
- Frontend (`client/`)

### 2. Configurar Ambiente

Crie o arquivo `.env` no diretório `server/`:

```bash
cd server
cp .env.example .env
```

Edite o arquivo `.env` se necessário:

```env
PORT=5000
NODE_ENV=development
```

### 3. Executar o Projeto

#### Opção A: Executar tudo junto (Recomendado)

Na raiz do projeto:

```bash
npm run dev
```

Isso iniciará:
- Backend na porta 5000
- Frontend na porta 3000

#### Opção B: Executar separadamente

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 4. Acessar a Aplicação

Abra seu navegador em:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health

## Verificação

Para verificar se tudo está funcionando:

1. Acesse http://localhost:3000
2. Você deve ver a tela de upload
3. Verifique o backend acessando http://localhost:5000/api/health

## Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
npm run install-all
```

### Erro: "Port already in use"
```bash
# Backend: Altere a porta no server/.env
PORT=5001

# Frontend: Use outra porta ao iniciar
PORT=3001 npm start
```

### Erro: "EACCES permission denied"
```bash
# No Linux/Mac, pode ser necessário usar sudo
# Ou altere as permissões do diretório
chmod -R 755 .
```

### Tesseract.js não está funcionando
```bash
# Reinstale o pacote
cd server
npm uninstall tesseract.js
npm install tesseract.js
```

## Estrutura de Pastas após Instalação

```
sistema-boletim/
├── node_modules/          # Dependências raiz
├── server/
│   ├── node_modules/      # Dependências backend
│   ├── uploads/           # Uploads temporários (criado automaticamente)
│   ├── index.js
│   ├── package.json
│   └── .env
├── client/
│   ├── node_modules/      # Dependências frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── package.json
```

## Scripts Disponíveis

### Raiz do Projeto
- `npm run dev`: Inicia backend e frontend juntos
- `npm run install-all`: Instala todas as dependências

### Backend (`server/`)
- `npm start`: Inicia o servidor
- `npm run dev`: Inicia com nodemon (hot reload)

### Frontend (`client/`)
- `npm start`: Inicia o servidor de desenvolvimento
- `npm run build`: Cria build de produção
- `npm test`: Executa testes

## Próximos Passos

1. ✅ Instalação completa
2. 📸 Fazer upload de uma imagem de boletim
3. 🔍 Verificar a extração dos dados
4. 📊 Analisar os resultados no dashboard

## Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Verifique os logs do terminal
3. Confirme que todas as dependências foram instaladas
4. Verifique se as portas estão livres

---

**Dica**: Para melhor experiência, use uma imagem de boletim nítida e bem iluminada! 📸

