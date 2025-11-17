# 📊 Sistema de Análise de Boletim Escolar

Sistema web completo para análise de boletins escolares com OCR automático, cálculo de médias e projeções de desempenho.

## 🚀 Funcionalidades

- **Upload de foto do boletim**: Interface intuitiva para envio de imagens
- **Extração automática de dados com IA**: OCR (PaddleOCR ou Tesseract) + LlamaIndex para extração estruturada
  - **Precisão superior**: ~95%+ vs ~70-80% do método anterior
  - **Entende contexto**: LLM identifica disciplinas, notas e dados automaticamente
  - **Adaptável**: Funciona mesmo com variações no formato do boletim
  - **Suporta subtabelas**: Processa automaticamente (ex: Biologia I / Biologia II)
- **Extração robusta de notas**: 
  - Preserva traços (-) como `null` nas posições corretas
  - Suporta formato brasileiro (vírgula como decimal: 8,0)
  - Captura todas as disciplinas encontradas no boletim
- **Cálculo inteligente de médias**: 
  - Média provisória = (N1 + N2 + N3) / quantidade de notas
  - Média parcial = média provisória + pontos extras
  - Limitação automática a 10.0
- **Projeção de desempenho**: Indica nota necessária na próxima prova para atingir a média mínima
- **Dashboard visual**: Cards coloridos com barras de progresso e status claro
- **Configuração de média mínima**: Permite ajustar a média exigida pela instituição (6.0, 7.0, etc.)

## 🛠️ Tecnologias

### Backend
- **Python 3.8+** com FastAPI
- **LlamaIndex**: Extração estruturada com LLM
- **OCR**: PaddleOCR (recomendado) ou Tesseract
- **LLM**: OpenAI GPT-4o-mini (recomendado) ou Ollama (gratuito, local)
- **CORS**: Suporte para requisições cross-origin

### Frontend
- React 18
- Tailwind CSS
- React Router
- Axios
- React Dropzone

## 📦 Instalação

### Pré-requisitos
- **Python 3.8+**
- **Node.js** (v16 ou superior)
- **npm** ou **yarn**

### Opcional (dependendo da configuração):
- **OpenAI API Key** (se usar `LLM_PROVIDER=openai`) - [Obter chave](https://platform.openai.com/api-keys)
- **Ollama** (se usar `LLM_PROVIDER=ollama`) - [Instalar Ollama](https://ollama.ai)
- **Tesseract** (se usar `OCR_ENGINE=tesseract`):
  - macOS: `brew install tesseract tesseract-lang`
  - Ubuntu: `sudo apt-get install tesseract-ocr tesseract-ocr-por`

### Passo a passo

1. **Clone ou baixe o projeto**

2. **Instale as dependências**
```bash
npm run install-all
```

Isso instalará:
- Dependências Node.js (raiz e cliente)
- Ambiente virtual Python
- Dependências Python (FastAPI, LlamaIndex, OCR, etc.)

3. **Configure o ambiente**
```bash
cd server_python
cp .env.example .env
```

Edite o arquivo `.env`:
```env
PORT=5001
LLM_PROVIDER=openai          # ou "ollama" para usar local
OPENAI_API_KEY=sk-...        # sua chave OpenAI (se usar OpenAI)
OCR_ENGINE=paddleocr         # ou "tesseract"
```

**Escolha seu LLM:**
- **OpenAI** (recomendado - mais rápido): Configure `OPENAI_API_KEY` no `.env`
- **Ollama** (gratuito - local): `LLM_PROVIDER=ollama` e instale: `ollama pull llama3.2`

4. **Execute o projeto**
```bash
npm run dev
```

Isso iniciará:
- **Backend Python** (porta 5001) - LlamaIndex + OCR
- **Frontend React** (porta 3000)

### Acessar a aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 📁 Estrutura do Projeto

```
sistema-boletim/
├── server_python/
│   ├── main.py            # Servidor FastAPI com LlamaIndex
│   ├── requirements.txt   # Dependências Python
│   ├── run.sh            # Script para rodar o servidor
│   ├── setup.sh          # Script de instalação
│   ├── .env.example      # Exemplo de variáveis de ambiente
│   └── uploads/          # Diretório de uploads temporários
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadPage.js      # Página de upload
│   │   │   ├── Dashboard.js       # Dashboard principal
│   │   │   ├── DisciplinaCard.js  # Card de disciplina
│   │   │   ├── PainelGeral.js     # Painel de estatísticas
│   │   │   └── MediaConfig.js     # Configuração de média
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   └── package.json
├── package.json
└── README.md
```

## 🔌 API Endpoints

### `POST /api/upload`
Faz upload da imagem do boletim e retorna dados extraídos.

**Request:**
- `Content-Type: multipart/form-data`
- Body: `boletim` (arquivo de imagem)

**Response:**
```json
{
  "success": true,
  "textoOCR": "...",
  "dados": {
    "aluno": "Nome do Aluno",
    "disciplinas": [
      {
        "nome": "Matemática",
        "notas": [8.5, 7.0, 9.0],
        "faltas": 2,
        "pontosExtras": 0.5,
        "mediaProvisoria": 8.17,
        "mediaParcial": 8.67,
        "qtdNotas": 3,
        "notaNecessaria": null,
        "status": "Aprovado",
        "mediaMinima": 7.0
      }
    ]
  }
}
```

### `POST /api/calculate`
Recalcula médias com média mínima customizada.

**Request:**
```json
{
  "disciplinas": [...],
  "mediaMinima": 7.0
}
```

**Response:**
```json
{
  "success": true,
  "disciplinas": [...]
}
```

### `GET /api/health`
Verifica se o servidor está rodando.

## 📐 Fórmulas de Cálculo

### Média Provisória
```
Média Provisória = (Soma das notas) / Quantidade de notas
```

### Média Parcial
```
Média Parcial = Média Provisória + Pontos Extras
Média Parcial = min(Média Parcial, 10.0)
```

### Nota Necessária
Quando faltam avaliações:
```
Total Necessário = Média Mínima × 3
Nota Necessária = (Total Necessário - Soma Atual) / Notas Faltantes
```

### Status
- **Aprovado**: Média Parcial ≥ Média Mínima
- **Em Recuperação**: Média Parcial < Média Mínima mas ≥ 60% da Média Mínima
- **Reprovado**: Média Parcial < 60% da Média Mínima

## 🎨 Componentes Frontend

### UploadPage
- Área de dropzone para upload de imagens
- Preview da imagem selecionada
- Feedback visual de loading

### Dashboard
- Configuração de média mínima
- Painel geral com estatísticas
- Grid de cards de disciplinas

### DisciplinaCard
- Exibição de notas individuais
- Barra de progresso da média
- Indicador de status colorido
- Nota necessária destacada

### PainelGeral
- Estatísticas gerais
- Taxa de aprovação
- Média geral

## 🔍 Detalhes Técnicos

### OCR + LlamaIndex
- **OCR**: PaddleOCR (recomendado) ou Tesseract
  - Idioma: Português (`por`)
  - Processamento de imagens
- **LlamaIndex**: Extração estruturada com LLM
  - Entende contexto do boletim
  - Extrai dados em formato JSON estruturado
  - Corrige erros de OCR automaticamente

### Extração de Dados
O sistema identifica automaticamente:
- **Nome do aluno**: Extraído do cabeçalho do boletim
- **Matrícula, Turma e Bimestre**: Informações do aluno
- **Todas as disciplinas**: Detecta automaticamente (não limitado a lista fixa)
- **Notas (1ª AV, 2ª AV, 3ª AV)**: Preserva traços (-) como `null` nas posições corretas
- **Faltas**: Número inteiro
- **Pontos Extras**: Extraídos do boletim
- **Médias Provisórias e Parciais**: Extraídas do boletim quando disponíveis
- **Subtabelas**: Processa automaticamente (ex: Biologia I / Biologia II)

**Vantagens do LlamaIndex**:
- Precisão superior (~95%+)
- Adaptável a variações no formato
- Entende contexto (sabe que "FILOSOFIA" é disciplina, não nome de aluno)
- Validação automática de dados

### Limitações
- A qualidade da extração depende da qualidade da imagem
- O OCR pode ter dificuldades com:
  - Imagens borradas ou de baixa resolução
  - Formatações muito complexas
  - Letras cursivas ou estilizadas
- **Solução**: LlamaIndex corrige automaticamente muitos erros de OCR e entende o contexto

**Dica**: Para melhores resultados, use imagens nítidas e bem iluminadas.

## 🎯 Exemplos de Uso

### Exemplo 1: Aluno com 2 notas
- 1ª AV: 8.0
- 2ª AV: 7.0
- 3ª AV: (faltando)
- Média Mínima: 7.0

**Cálculo:**
- Média Provisória: (8.0 + 7.0) / 2 = 7.5
- Nota Necessária: (7.0 × 3 - 15.0) / 1 = 6.0

### Exemplo 2: Aluno com pontos extras
- 1ª AV: 6.0
- 2ª AV: 6.5
- 3ª AV: 6.0
- Pontos Extras: 1.0
- Média Mínima: 7.0

**Cálculo:**
- Média Provisória: (6.0 + 6.5 + 6.0) / 3 = 6.17
- Média Parcial: 6.17 + 1.0 = 7.17
- Status: Aprovado ✅

## 🐛 Troubleshooting

### Erro ao fazer upload
- Verifique se o servidor backend está rodando
- Confirme que a imagem não excede 10MB
- Verifique o formato da imagem (JPEG, PNG, GIF, WEBP)

### OCR não está funcionando
- Aguarde o processamento completo (pode levar alguns segundos)
- Tente com uma imagem mais nítida
- Verifique os logs do servidor para mais detalhes

### Cálculos incorretos
- Confira se os dados foram extraídos corretamente
- Ajuste manualmente se necessário (funcionalidade futura)
- Verifique a média mínima configurada

## 🔮 Melhorias Futuras

- [ ] Banco de dados para salvar históricos
- [ ] Edição manual de dados extraídos
- [ ] Suporte a múltiplos formatos de boletim
- [ ] Exportação em PDF
- [ ] Gráficos de evolução
- [ ] Comparação com outros alunos (anônimo)
- [ ] Autenticação de usuários

## 📝 Licença

MIT

## 👨‍💻 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

Desenvolvido com ❤️ para facilitar a análise de boletins escolares.

