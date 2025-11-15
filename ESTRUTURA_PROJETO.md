# 📁 Estrutura do Projeto

## Visão Geral

```
sistema-boletim/
├── 📄 README.md                    # Documentação principal
├── 📄 QUICK_START.md              # Guia rápido
├── 📄 INSTALACAO.md               # Guia de instalação detalhado
├── 📄 EXEMPLO_DADOS.md            # Exemplos de dados e fórmulas
├── 📄 ESTRUTURA_PROJETO.md        # Este arquivo
├── 📄 package.json                # Dependências e scripts raiz
├── 📄 .gitignore                  # Arquivos ignorados pelo Git
│
├── 📂 server/                     # Backend (Node.js + Express)
│   ├── 📄 index.js                # Servidor principal
│   ├── 📄 package.json            # Dependências do backend
│   ├── 📄 .gitignore              # Ignorar uploads
│   ├── 📄 .env.example            # Exemplo de variáveis de ambiente
│   └── 📂 uploads/                # Uploads temporários (criado automaticamente)
│
└── 📂 client/                     # Frontend (React + Tailwind)
    ├── 📄 package.json            # Dependências do frontend
    ├── 📄 tailwind.config.js      # Configuração do Tailwind
    ├── 📄 postcss.config.js       # Configuração do PostCSS
    │
    ├── 📂 public/                 # Arquivos públicos
    │   └── 📄 index.html          # HTML principal
    │
    └── 📂 src/                    # Código fonte React
        ├── 📄 index.js            # Ponto de entrada React
        ├── 📄 index.css           # Estilos globais (Tailwind)
        ├── 📄 App.js              # Componente raiz
        ├── 📄 App.css             # Estilos do App
        │
        └── 📂 components/         # Componentes React
            ├── 📄 UploadPage.js       # Página de upload
            ├── 📄 Dashboard.js        # Dashboard principal
            ├── 📄 DisciplinaCard.js   # Card de disciplina
            ├── 📄 PainelGeral.js      # Painel de estatísticas
            └── 📄 MediaConfig.js      # Configuração de média
```

## Descrição dos Arquivos

### Raiz do Projeto

- **README.md**: Documentação completa do projeto
- **QUICK_START.md**: Guia rápido de início
- **INSTALACAO.md**: Instruções detalhadas de instalação
- **EXEMPLO_DADOS.md**: Exemplos de dados JSON e fórmulas
- **ESTRUTURA_PROJETO.md**: Este arquivo - visão geral da estrutura
- **package.json**: Scripts para executar tudo junto
- **.gitignore**: Arquivos a ignorar no controle de versão

### Backend (`server/`)

#### `index.js`
Servidor Express principal com:
- Configuração do Express e CORS
- Configuração do Multer para upload
- Rotas da API:
  - `POST /api/upload`: Upload e processamento de imagem
  - `POST /api/calculate`: Recalcular médias
  - `GET /api/health`: Verificação de saúde
- Função `extractDataFromText()`: Extração de dados do OCR
- Função `calculateAverages()`: Cálculo de médias

#### `package.json`
Dependências:
- `express`: Framework web
- `cors`: Middleware CORS
- `multer`: Upload de arquivos
- `tesseract.js`: OCR
- `dotenv`: Variáveis de ambiente
- `nodemon`: Hot reload (dev)

### Frontend (`client/`)

#### `src/App.js`
Componente raiz com roteamento:
- `/`: Página de upload
- `/dashboard`: Dashboard de resultados

#### `src/components/UploadPage.js`
Página de upload com:
- Dropzone para arrastar e soltar
- Preview da imagem
- Feedback de loading
- Tratamento de erros

#### `src/components/Dashboard.js`
Dashboard principal com:
- Configuração de média mínima
- Painel geral de estatísticas
- Grid de cards de disciplinas

#### `src/components/DisciplinaCard.js`
Card individual de disciplina mostrando:
- Nome da disciplina
- Notas individuais
- Média parcial
- Barra de progresso
- Status (Aprovado/Recuperação/Reprovado)
- Nota necessária na próxima prova
- Pontos extras e faltas

#### `src/components/PainelGeral.js`
Painel com estatísticas gerais:
- Total de disciplinas
- Quantidade aprovados/recuperação/reprovados
- Média geral
- Taxa de aprovação

#### `src/components/MediaConfig.js`
Componente para configurar média mínima:
- Botões de valores pré-definidos (6.0, 6.5, 7.0, 7.5, 8.0)
- Input para valor customizado
- Recalcular automaticamente

## Fluxo de Dados

```
1. Usuário faz upload da imagem
   ↓
2. Frontend envia para POST /api/upload
   ↓
3. Backend salva imagem temporariamente
   ↓
4. Tesseract.js faz OCR
   ↓
5. extractDataFromText() extrai dados
   ↓
6. calculateAverages() calcula médias
   ↓
7. Backend retorna dados processados
   ↓
8. Frontend exibe no Dashboard
   ↓
9. Usuário pode ajustar média mínima
   ↓
10. Frontend chama POST /api/calculate
    ↓
11. Backend recalcula e retorna
    ↓
12. Frontend atualiza exibição
```

## Rotas da API

### `POST /api/upload`
- **Entrada**: Multipart form data com arquivo de imagem
- **Processamento**: OCR → Extração → Cálculo
- **Saída**: Dados processados do boletim

### `POST /api/calculate`
- **Entrada**: JSON com disciplinas e média mínima
- **Processamento**: Recalcular médias
- **Saída**: Disciplinas com novos cálculos

### `GET /api/health`
- **Entrada**: Nenhuma
- **Processamento**: Verificar status
- **Saída**: `{ status: 'OK', message: 'Servidor rodando' }`

## Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web
- **Tesseract.js**: OCR em JavaScript
- **Multer**: Upload de arquivos
- **CORS**: Permitir requisições cross-origin

### Frontend
- **React 18**: Biblioteca UI
- **React Router**: Roteamento
- **Tailwind CSS**: Framework CSS utility-first
- **Axios**: Cliente HTTP
- **React Dropzone**: Upload com drag & drop

## Convenções de Código

### Nomenclatura
- Componentes: PascalCase (`DisciplinaCard.js`)
- Arquivos: PascalCase para componentes, camelCase para utils
- Variáveis: camelCase
- Constantes: UPPER_SNAKE_CASE

### Estrutura de Componentes
```javascript
1. Imports
2. Componente principal
3. Estados (useState)
4. Funções auxiliares
5. Efeitos (useEffect)
6. Render
7. Export
```

### Estilos
- Uso de Tailwind CSS classes
- Responsividade mobile-first
- Cores consistentes (blue, green, yellow, red)

## Arquivos Gerados Automaticamente

- `server/uploads/`: Criado automaticamente ao fazer upload
- `client/build/`: Criado ao executar `npm run build`
- `node_modules/`: Criado ao instalar dependências
- `client/node_modules/`: Criado ao instalar dependências do frontend
- `server/node_modules/`: Criado ao instalar dependências do backend

## Scripts NPM

### Raiz
- `npm run dev`: Executa backend e frontend juntos
- `npm run install-all`: Instala todas as dependências

### Backend
- `npm start`: Inicia servidor
- `npm run dev`: Inicia com nodemon (hot reload)

### Frontend
- `npm start`: Inicia servidor de desenvolvimento
- `npm run build`: Cria build de produção
- `npm test`: Executa testes

## Próximos Passos de Desenvolvimento

### Melhorias Sugeridas
1. Banco de dados para salvar histórico
2. Edição manual de dados extraídos
3. Suporte a múltiplos formatos de boletim
4. Exportação em PDF
5. Gráficos de evolução
6. Autenticação de usuários
7. API REST completa com CRUD

### Estrutura Sugerida para Expansão

```
server/
├── routes/          # Rotas da API
├── controllers/     # Lógica de negócio
├── models/          # Modelos de dados
├── services/        # Serviços (OCR, cálculos)
├── middleware/      # Middlewares customizados
└── utils/           # Funções utilitárias
```

---

**Nota**: Esta estrutura é uma base sólida para um sistema completo de análise de boletim escolar.

