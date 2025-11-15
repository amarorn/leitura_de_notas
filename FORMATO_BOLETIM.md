# 📋 Formato de Boletim HIPÓCRATES

## Estrutura do Boletim

O sistema foi otimizado para processar boletins no formato da instituição **HIPÓCRATES** com as seguintes características:

### Cabeçalho

- **Instituição**: HIPÓCRATES / HIPÓCRATES
- **CNPJ**: 03.006.414/0001-16
- **Endereço**: Alameda das Mansões, 2110, Candelária, Natal/RN
- **ANO BASE**: 2025

### Informações do Aluno

- **Nome do Aluno(a)**: Nome completo em maiúsculas
- **Matrícula**: Número de matrícula
- **Turma**: Formato (ex: 7AMB-2025, 1SMA-2025)
- **Módulo/Bimestre**: 1º, 2º, 3º ou 4º Bimestre

### Estrutura da Tabela

A tabela principal contém as seguintes colunas:

1. **Disciplina** - Nome da disciplina/sub-disciplina
2. **Faltas** - Quantidade de faltas
3. **1ª AV** - Primeira Avaliação
4. **2ª AV** - Segunda Avaliação
5. **3ª AV** - Terceira Avaliação
6. **Média Provisória** - Calculada automaticamente pelo boletim
7. **Pontos Extras** - Pontos adicionais (geralmente 1.0)
8. **Média Parcial** - Média Provisória + Pontos Extras (limitada a 10.0)
9. **1º Bim.** - Média do primeiro bimestre
10. **2º Bim.** - Média do segundo bimestre
11. **3º Bim.** - Média do terceiro bimestre
12. **4º Bim.** - Média do quarto bimestre
13. **Soma de Médias** - Soma das médias bimestrais (para cálculo anual)
14. **Média Anual** - Média anual calculada
15. **Prova Final** - Nota da prova final (se houver)
16. **Média Final** - Média final considerando prova final
17. **Situação** - Status final (Aprovado/Reprovado)

## Disciplinas Suportadas

### Disciplinas Regulares
- EMPREENDEDORISMO
- FILOSOFIA
- GEOGRAFIA
- HISTÓRIA
- REDAÇÃO
- ÉTICA E CIDADANIA
- CIÊNCIAS
- EDUCAÇÃO FÍSICA
- ENSINO DA ARTE
- ESPANHOL
- INGLÊS
- LÍNGUA PORTUGUESA
- MATEMÁTICA

### Disciplinas do Ensino Médio
- SOCIOLOGIA
- BIOLOGIA (pode ter sub-disciplinas: Biologia I, Biologia II)
- FÍSICA (pode ter sub-disciplinas: Física I, Física II)
- QUÍMICA

### Sub-disciplinas de Língua Portuguesa
- LITERATURA
- ANÁLISE LINGUÍSTICA
- PRODUÇÃO DE TEXTO

### Itinerários Formativos / Eletivas
- PROJETO DE VIDA
- UNIDADE CURRICULAR DE HUMANAS - HISTÓRIA
- UNIDADE CURRICULAR DE NATUREZA - BIOLOGIA
- UNIDADE CURRICULAR DE NATUREZA - FÍSICA
- TRAJETÓRIA DE LEITURA E ESCRITA

## Padrões de Dados

### Valores Vazios

O boletim pode conter células vazias representadas por:
- Traço (`-`)
- Hífen longo (`—`)
- Célula vazia (sem conteúdo)

Esses valores são tratados como `null` no sistema.

### Notas

- **Formato**: Decimal com ponto ou vírgula (ex: 8.5, 8,5)
- **Faixa**: 0.0 a 10.0
- **Vazias**: Representadas por `-` ou célula vazia

### Faltas

- **Formato**: Número inteiro
- **Vazias**: Quando não há faltas ou não foi informado

### Pontos Extras

- **Valor padrão**: 1.0 (na maioria dos casos)
- **Máximo**: Limitado para que Média Parcial não exceda 10.0

## Exemplo de Linha de Dados

```
EMPREENDEDORISMO    0    8.0    8.0    -    8.0    1.0    9.0    8.0    8.1    9.0    -
```

**Significado:**
- Disciplina: EMPREENDEDORISMO
- Faltas: 0
- 1ª AV: 8.0
- 2ª AV: 8.0
- 3ª AV: - (não lançada)
- Média Provisória: 8.0
- Pontos Extras: 1.0
- Média Parcial: 9.0
- 1º Bim.: 8.0
- 2º Bim.: 8.1
- 3º Bim.: 9.0
- 4º Bim.: - (não lançado)

## Processamento pelo Sistema

### Extração de Dados (OCR)

1. **Reconhecimento de texto**: Tesseract.js processa a imagem
2. **Identificação de padrões**: Sistema busca:
   - Nome do aluno (vários formatos possíveis)
   - Matrícula e turma
   - Bimestre atual
   - Linhas de disciplinas e notas
3. **Parsing de valores**: Converte strings em números, tratando:
   - Vírgulas em decimais
   - Traços e células vazias
   - Múltiplos formatos de dados

### Cálculos

1. **Média Provisória**: Se não estiver no boletim, calcula: `(N1 + N2 + N3) / quantidade`
2. **Média Parcial**: `Média Provisória + Pontos Extras` (máx. 10.0)
3. **Status**: Baseado na Média Parcial e Média Mínima
4. **Nota Necessária**: Calculada quando faltam avaliações

### Validações

- Notas entre 0.0 e 10.0
- Média parcial limitada a 10.0
- Tratamento de células vazias
- Suporte a notas em falta

## Limitações do OCR

### Dependências de Qualidade

1. **Resolução da imagem**: Recomenda-se pelo menos 300 DPI
2. **Iluminação**: Evitar sombras e reflexos
3. **Enquadramento**: Boletim centralizado e reto
4. **Contraste**: Texto bem visível

### Dificuldades Comuns

1. **Sub-disciplinas**: Podem ser identificadas como disciplinas separadas
2. **Formatação complexa**: Tabelas muito compactas podem ter problemas
3. **Tipografia**: Letras estilizadas ou pequenas podem ser mal interpretadas
4. **Células mescladas**: Podem causar erros na extração

### Dicas para Melhor Extração

1. Use imagens nítidas e bem iluminadas
2. Certifique-se de que todo o boletim está visível
3. Evite cortes ou partes faltando
4. Prefira formatos PNG ou JPG de alta qualidade
5. Se possível, digitalize em vez de fotografar

## Melhorias Futuras

- [ ] Reconhecimento de sub-disciplinas como agrupadas
- [ ] Extração de médias bimestrais completas
- [ ] Cálculo de média anual
- [ ] Suporte a prova final
- [ ] Edição manual de dados extraídos

