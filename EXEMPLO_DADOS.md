# 📋 Exemplos de Dados

## Exemplo de JSON de Entrada (após OCR)

```json
{
  "aluno": "João Silva",
  "disciplina": "",
  "ano": 2024,
  "bimestres": [],
  "faltas": [],
  "disciplinas": [
    {
      "nome": "Matemática",
      "notas": [8.5, 7.0, 9.0],
      "faltas": 2,
      "pontosExtras": 0.5
    },
    {
      "nome": "Português",
      "notas": [6.0, 7.5, 8.0],
      "faltas": 1,
      "pontosExtras": 0
    },
    {
      "nome": "História",
      "notas": [9.0, 8.5],
      "faltas": 0,
      "pontosExtras": 0
    }
  ]
}
```

## Exemplo de JSON de Saída (após processamento)

```json
{
  "success": true,
  "textoOCR": "Boletim Escolar\nAluno: João Silva\n...",
  "dados": {
    "aluno": "João Silva",
    "disciplina": "",
    "ano": 2024,
    "bimestres": [],
    "faltas": [],
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
      },
      {
        "nome": "Português",
        "notas": [6.0, 7.5, 8.0],
        "faltas": 1,
        "pontosExtras": 0,
        "mediaProvisoria": 7.17,
        "mediaParcial": 7.17,
        "qtdNotas": 3,
        "notaNecessaria": null,
        "status": "Aprovado",
        "mediaMinima": 7.0
      },
      {
        "nome": "História",
        "notas": [9.0, 8.5],
        "faltas": 0,
        "pontosExtras": 0,
        "mediaProvisoria": 8.75,
        "mediaParcial": 8.75,
        "qtdNotas": 2,
        "notaNecessaria": 5.25,
        "status": "Aprovado",
        "mediaMinima": 7.0
      }
    ]
  }
}
```

## Fórmulas Matemáticas Implementadas

### 1. Média Provisória
```
Média Provisória = (N1 + N2 + N3) / Quantidade de Notas Lançadas
```

**Exemplo:**
- Notas: [8.5, 7.0, 9.0]
- Média Provisória = (8.5 + 7.0 + 9.0) / 3 = 8.17

### 2. Média Parcial
```
Média Parcial = Média Provisória + Pontos Extras
Média Parcial = min(Média Parcial, 10.0)
```

**Exemplo:**
- Média Provisória: 8.17
- Pontos Extras: 0.5
- Média Parcial = 8.17 + 0.5 = 8.67

### 3. Nota Necessária para Próxima Prova

Quando faltam avaliações:
```
Total Necessário = Média Mínima × 3
Soma Atual = Soma das Notas + Pontos Extras
Notas Faltantes = 3 - Quantidade de Notas
Nota Necessária = (Total Necessário - Soma Atual) / Notas Faltantes
```

**Exemplo:**
- Notas: [9.0, 8.5] (faltando a 3ª AV)
- Pontos Extras: 0
- Média Mínima: 7.0
- Total Necessário = 7.0 × 3 = 21.0
- Soma Atual = 9.0 + 8.5 = 17.5
- Notas Faltantes = 3 - 2 = 1
- Nota Necessária = (21.0 - 17.5) / 1 = 3.5

**Observação:** Se a nota necessária for maior que 10.0, significa que mesmo tirando 10.0 na próxima prova, o aluno ficará em recuperação.

### 4. Status do Aluno

```
SE Média Parcial >= Média Mínima:
    Status = "Aprovado" ✅
SENÃO SE Média Parcial >= (Média Mínima × 0.6):
    Status = "Em Recuperação" ⚠️
SENÃO:
    Status = "Reprovado" ❌
```

**Exemplos:**
- Média Parcial: 8.67, Média Mínima: 7.0 → **Aprovado** ✅
- Média Parcial: 6.5, Média Mínima: 7.0 → **Em Recuperação** ⚠️
- Média Parcial: 3.5, Média Mínima: 7.0 → **Reprovado** ❌

### 5. Média Geral

```
Média Geral = Soma de todas as Médias Parciais / Quantidade de Disciplinas
```

**Exemplo:**
- Matemática: 8.67
- Português: 7.17
- História: 8.75
- Média Geral = (8.67 + 7.17 + 8.75) / 3 = 8.20

### 6. Taxa de Aprovação

```
Taxa de Aprovação = (Quantidade de Disciplinas Aprovadas / Total de Disciplinas) × 100
```

**Exemplo:**
- Total de Disciplinas: 10
- Disciplinas Aprovadas: 8
- Taxa de Aprovação = (8 / 10) × 100 = 80%

## Casos de Uso

### Caso 1: Aluno com todas as notas
**Entrada:**
- Matemática: [8.0, 7.5, 9.0], Extras: 0.5

**Cálculo:**
- Média Provisória: (8.0 + 7.5 + 9.0) / 3 = 8.17
- Média Parcial: 8.17 + 0.5 = 8.67
- Status: Aprovado ✅

### Caso 2: Aluno faltando uma nota
**Entrada:**
- História: [9.0, 8.5], Extras: 0, Média Mínima: 7.0

**Cálculo:**
- Média Provisória: (9.0 + 8.5) / 2 = 8.75
- Média Parcial: 8.75 + 0 = 8.75
- Nota Necessária: (7.0 × 3 - 17.5) / 1 = 3.5
- Status: Aprovado ✅

### Caso 3: Aluno em recuperação
**Entrada:**
- Física: [5.0, 6.0, 7.0], Extras: 0, Média Mínima: 7.0

**Cálculo:**
- Média Provisória: (5.0 + 6.0 + 7.0) / 3 = 6.0
- Média Parcial: 6.0 + 0 = 6.0
- Status: Em Recuperação ⚠️

### Caso 4: Aluno reprovado
**Entrada:**
- Química: [3.0, 4.0, 5.0], Extras: 0, Média Mínima: 7.0

**Cálculo:**
- Média Provisória: (3.0 + 4.0 + 5.0) / 3 = 4.0
- Média Parcial: 4.0 + 0 = 4.0
- Status: Reprovado ❌

### Caso 5: Média parcial acima de 10
**Entrada:**
- Arte: [9.5, 9.8, 9.9], Extras: 2.0

**Cálculo:**
- Média Provisória: (9.5 + 9.8 + 9.9) / 3 = 9.73
- Média Parcial Bruta: 9.73 + 2.0 = 11.73
- Média Parcial Limitada: min(11.73, 10.0) = 10.0
- Status: Aprovado ✅

## Formato de Imagem Esperado

O sistema espera boletins com o seguinte formato típico:

```
┌─────────────────────────────────┐
│       BOLETIM ESCOLAR           │
├─────────────────────────────────┤
│ Aluno: João Silva               │
│ Ano: 2024                       │
├─────────────────────────────────┤
│ Disciplina | 1ª AV | 2ª AV | 3ª │
├─────────────────────────────────┤
│ Matemática | 8.5   | 7.0   | 9.0│
│ Português  | 6.0   | 7.5   | 8.0│
│ História   | 9.0   | 8.5   | -  │
└─────────────────────────────────┘
```

## Limitações do OCR

1. **Qualidade da Imagem**: Imagens borradas ou de baixa resolução podem gerar erros
2. **Formatação**: Formatos muito complexos ou não padronizados podem dificultar a extração
3. **Tipografia**: Letras cursivas ou estilizadas podem ser mal interpretadas
4. **Estrutura**: O sistema funciona melhor com boletins que seguem um padrão similar

## Dicas para Melhor Extração

1. **Use imagens nítidas**: Resolução mínima de 300 DPI
2. **Boa iluminação**: Evite sombras e reflexos
3. **Enquadramento**: Mantenha o boletim centralizado e reto
4. **Contraste**: Certifique-se de que o texto está bem visível
5. **Formato**: Prefira formatos JPG ou PNG

