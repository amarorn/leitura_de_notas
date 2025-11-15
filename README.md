# 📊 Sistema de Análise de Boletim Escolar

Sistema web completo para análise de boletins escolares com OCR automático, cálculo de médias e projeções de desempenho.

## 🚀 Funcionalidades

- **Upload de foto do boletim**: Interface intuitiva para envio de imagens
- **Extração automática de dados**: OCR usando Tesseract.js para ler informações do boletim
- **Cálculo inteligente de médias**: 
  - Média provisória = (N1 + N2 + N3) / quantidade de notas
  - Média parcial = média provisória + pontos extras
  - Limitação automática a 10.0
- **Projeção de desempenho**: Indica nota necessária na próxima prova para atingir a média mínima
- **Dashboard visual**: Cards coloridos com barras de progresso e status claro
- **Configuração de média mínima**: Permite ajustar a média exigida pela instituição (6.0, 7.0, etc.)

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- Tesseract.js (OCR)
- Multer (upload de arquivos)
- CORS

### Frontend
- React 18
- Tailwind CSS
- React Router
- Axios
- React Dropzone

## 📦 Instalação

### Pré-requisitos
- Node.js (v16 ou superior)
- npm ou yarn

### Passo a passo

1. **Clone ou baixe o projeto**

2. **Instale as dependências**
```bash
npm run install-all
```

Ou manualmente:
```bash
# Instalar dependências raiz
npm install

# Instalar dependências do backend
cd server
npm install

# Instalar dependências do frontend
cd ../client
npm install
```

3. **Configure o ambiente**
```bash
cd server
cp .env.example .env
```

4. **Inicie o servidor backend** (em um terminal)
```bash
cd server
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

5. **Inicie o frontend** (em outro terminal)
```bash
cd client
npm start
```

O frontend estará disponível em `http://localhost:3000`

### Executar tudo junto (recomendado)
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
sistema-boletim/
├── server/
│   ├── index.js           # Servidor Express
│   ├── package.json
│   ├── uploads/           # Diretório de uploads temporários
│   └── .env.example
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

### OCR (Tesseract.js)
- Idioma: Português (`por`)
- Processamento assíncrono
- Extração de padrões de boletim escolar

### Extração de Dados
O sistema tenta identificar:
- Nome do aluno
- Disciplinas
- Notas (1ª AV, 2ª AV, 3ª AV)
- Faltas
- Pontos extras

### Limitações
- A qualidade da extração depende da qualidade da imagem
- O OCR pode ter dificuldades com:
  - Imagens borradas ou de baixa resolução
  - Formatações muito complexas
  - Letras cursivas ou estilizadas

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

