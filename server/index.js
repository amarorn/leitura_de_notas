const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Função para extrair dados do texto OCR (formatado para HIPÓCRATES)
function extractDataFromText(text) {
  const data = {
    aluno: '',
    matricula: '',
    turma: '',
    ano: new Date().getFullYear(),
    bimestre: '',
    disciplinas: []
  };

  // Dividir texto em linhas
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Lista de disciplinas conhecidas para evitar confusão
  const disciplinasConhecidas = [
    'LEITURA', 'ESCRITA', 'FILOSOFIA', 'GEOGRAFIA', 'HISTÓRIA', 'REDAÇÃO',
    'ÉTICA', 'CIDADANIA', 'CIÊNCIAS', 'EDUCAÇÃO', 'FÍSICA', 'ARTE',
    'ESPANHOL', 'INGLÊS', 'PORTUGUESA', 'MATEMÁTICA', 'SOCIOLOGIA',
    'BIOLOGIA', 'FÍSICA', 'QUÍMICA', 'EMPREENDEDORISMO', 'LITERATURA',
    'ANÁLISE', 'LINGUÍSTICA', 'PRODUÇÃO', 'TEXTO', 'PROJETO', 'VIDA',
    'TRAJETÓRIA', 'UNIDADE', 'CURRICULAR', 'HUMANAS', 'NATUREZA'
  ];

  // Função para verificar se um texto parece ser nome de disciplina
  const isDisciplina = (text) => {
    const upperText = text.toUpperCase();
    return disciplinasConhecidas.some(disc => upperText.includes(disc));
  };

  // Extrair informações do cabeçalho (primeiras 20 linhas)
  const headerLines = lines.slice(0, 20);
  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i];
    
    // Nome do aluno - padrões específicos primeiro
    if (!data.aluno) {
      // Padrão 1: Linha contém "Nome do Aluno(a)" - pegar a PRÓXIMA linha (formato tabela)
      if (line.match(/nome\s+do\s+aluno[\(a\)]*/i)) {
        if (i + 1 < headerLines.length) {
          const nextLine = headerLines[i + 1].trim();
          
          // Verificar se a linha contém múltiplos campos (nome, matrícula, turma, bimestre juntos)
          // Formato: "NOME COMPLETO MATRÍCULA TURMA BIMESTRE"
          // Estratégia: encontrar o primeiro número (matrícula) e pegar tudo antes como nome
          const matriculaMatch = nextLine.match(/\s+(\d{4,})\s+/);
          if (matriculaMatch) {
            const matriculaIndex = nextLine.indexOf(matriculaMatch[0].trim());
            // Tudo antes da matrícula é o nome
            const nomeCandidato = nextLine.substring(0, matriculaIndex).trim().replace(/\s+/g, ' ');
            
            if (nomeCandidato && /^[A-ZÁÉÍÓÚÇÃÊÔÕ\s]+$/.test(nomeCandidato) && 
                !isDisciplina(nomeCandidato) && nomeCandidato.length > 5) {
              data.aluno = nomeCandidato;
            }
            
            // Extrair matrícula
            if (!data.matricula) {
              data.matricula = matriculaMatch[1];
            }
            
            // Extrair turma e bimestre do restante da linha
            const restante = nextLine.substring(matriculaIndex + matriculaMatch[0].trim().length).trim();
            const turmaMatch = restante.match(/^([A-Z0-9\-]+)\s+(.+)$/);
            if (turmaMatch) {
              if (!data.turma) {
                data.turma = turmaMatch[1];
              }
              if (!data.bimestre) {
                const bimestreMatch = turmaMatch[2].match(/(\d+)[º°]\s*bimestre/i);
                if (bimestreMatch) {
                  data.bimestre = `${bimestreMatch[1]}º Bimestre`;
                }
              }
            }
          } else {
            // Tentar padrão alternativo: dividir por espaços múltiplos e identificar campos
            const partes = nextLine.split(/\s{2,}/); // Dividir por 2 ou mais espaços
            if (partes.length >= 4) {
              // Assumir ordem: Nome, Matrícula, Turma, Bimestre
              const nomeCandidato = partes[0].trim();
              if (/^[A-ZÁÉÍÓÚÇÃÊÔÕ\s]+$/.test(nomeCandidato) && !isDisciplina(nomeCandidato) && nomeCandidato.length > 5) {
                data.aluno = nomeCandidato;
              }
              if (!data.matricula && /^\d+$/.test(partes[1])) {
                data.matricula = partes[1].trim();
              }
              if (!data.turma && /^[A-Z0-9\-]+$/.test(partes[2])) {
                data.turma = partes[2].trim();
              }
              if (!data.bimestre) {
                const bimestreMatch = partes[3].match(/(\d+)[º°]\s*bimestre/i);
                if (bimestreMatch) {
                  data.bimestre = `${bimestreMatch[1]}º Bimestre`;
                }
              }
            } else {
              // Formato simples: apenas nome na linha (todas maiúsculas, sem números)
              if (nextLine && /^[A-ZÁÉÍÓÚÇÃÊÔÕ\s]+$/.test(nextLine) && !/\d/.test(nextLine) && 
                  !nextLine.includes('|') && !nextLine.includes('─') && !nextLine.includes(':') &&
                  nextLine.length > 5 && nextLine.length < 80) {
                const nomeCandidato = nextLine.replace(/\s+/g, ' ').trim();
                if (!isDisciplina(nomeCandidato)) {
                  data.aluno = nomeCandidato;
                }
              }
            }
          }
        }
      }
      
      // Padrão 2: "Nome do Aluno(a): NOME" (mesma linha)
      if (!data.aluno) {
        const nomeAlunoMatch = line.match(/(?:nome\s+do\s+aluno[\(a\)]*[:\s]+)([A-ZÁÉÍÓÚÇÃÊÔÕ][A-ZÁÉÍÓÚÇÃÊÔÕ\s]+?)(?:\s+\d|\s+matr|matr|turma|bimestre|$)/i);
        if (nomeAlunoMatch && nomeAlunoMatch[1]) {
          const nomeCandidato = nomeAlunoMatch[1].trim().replace(/\s+/g, ' ');
          if (!isDisciplina(nomeCandidato) && nomeCandidato.length > 3) {
            data.aluno = nomeCandidato;
          }
        }
      }
      
      // Padrão 3: "Aluno(a): NOME"
      if (!data.aluno) {
        const alunoMatch = line.match(/(?:aluno[\(a\)]*[:\s]+)([A-ZÁÉÍÓÚÇÃÊÔÕ][A-ZÁÉÍÓÚÇÃÊÔÕ\s]+?)(?:\s+\d|\s+matr|matr|turma|bimestre|$)/i);
        if (alunoMatch && alunoMatch[1]) {
          const nomeCandidato = alunoMatch[1].trim().replace(/\s+/g, ' ');
          if (!isDisciplina(nomeCandidato) && nomeCandidato.length > 3) {
            data.aluno = nomeCandidato;
          }
        }
      }
      
      // Padrão 4: Linha com "Matrícula" - buscar nome na linha anterior (formato tabela)
      if (!data.aluno && line.match(/matr[íi]cula/i)) {
        if (i > 0) {
          const prevLine = headerLines[i - 1].trim();
          // Verificar se a linha anterior parece um nome
          if (prevLine && /^[A-ZÁÉÍÓÚÇÃÊÔÕ\s]+$/.test(prevLine) && !/\d/.test(prevLine) && 
              !prevLine.includes('|') && !prevLine.includes('─') && !prevLine.includes(':') &&
              prevLine.length > 5 && prevLine.length < 80) {
            const nomeCandidato = prevLine.replace(/\s+/g, ' ').trim();
            if (!isDisciplina(nomeCandidato)) {
              data.aluno = nomeCandidato;
            }
          }
        }
      }
    }
    
    // Matrícula - formato tabela: label em uma linha, valor na próxima
    if (!data.matricula) {
      if (line.match(/matr[íi]cula/i)) {
        // Tentar próxima linha (formato tabela)
        if (i + 1 < headerLines.length) {
          const nextLine = headerLines[i + 1].trim();
          const matriculaMatch = nextLine.match(/^(\d+)$/);
          if (matriculaMatch) {
            data.matricula = matriculaMatch[1];
          }
        }
        // Tentar mesma linha (formato inline)
        const matriculaMatch = line.match(/(?:matr[íi]cula|matricula)[:\s]*(\d+)/i);
        if (matriculaMatch) {
          data.matricula = matriculaMatch[1];
        }
      }
    }
    
    // Turma - formato tabela: label em uma linha, valor na próxima
    if (!data.turma) {
      if (line.match(/turma/i)) {
        // Tentar próxima linha (formato tabela)
        if (i + 1 < headerLines.length) {
          const nextLine = headerLines[i + 1].trim();
          const turmaMatch = nextLine.match(/^([A-Z0-9\-]+)$/);
          if (turmaMatch) {
            data.turma = turmaMatch[1];
          }
        }
        // Tentar mesma linha (formato inline)
        const turmaMatch = line.match(/(?:turma)[:\s]*([A-Z0-9\-]+)/i);
        if (turmaMatch) {
          data.turma = turmaMatch[1];
        }
      }
    }
    
    // Bimestre/Módulo - formato tabela: label em uma linha, valor na próxima
    if (!data.bimestre) {
      if (line.match(/m[óo]dulo|bimestre/i)) {
        // Tentar próxima linha (formato tabela)
        if (i + 1 < headerLines.length) {
          const nextLine = headerLines[i + 1].trim();
          const bimestreMatch = nextLine.match(/(\d+)[º°]\s*bimestre/i);
          if (bimestreMatch) {
            data.bimestre = `${bimestreMatch[1]}º Bimestre`;
          }
        }
        // Tentar mesma linha (formato inline)
        const bimestreMatch = line.match(/(\d+)[º°]\s*bimestre/i);
        if (bimestreMatch) {
          data.bimestre = `${bimestreMatch[1]}º Bimestre`;
        }
      }
    }
  }
  
  // Fallback: Se ainda não encontrou o nome, buscar nas primeiras 10 linhas por padrão de nome próprio
  // (2-8 palavras em maiúsculas, não sendo disciplinas conhecidas)
  if (!data.aluno) {
    for (let i = 0; i < Math.min(10, headerLines.length); i++) {
      const line = headerLines[i].trim();
      // Pular linhas que claramente não são nomes (contêm palavras-chave de boletim)
      if (line.match(/hip[óo]crates|boletim|escolar|institui[çc][ãa]o|cnpj|endere[çc]o|ano\s+base|raz[ãa]o\s+social|alameda|mans[õo]es|bairro|cep|fone|inep|portaria|autoriza[çc][ãa]o|nome\s+do\s+aluno|matr[íi]cula|turma|m[óo]dulo|bimestre/i)) {
        continue;
      }
      
      // Verificar se é uma linha com apenas letras maiúsculas (nome completo)
      if (/^[A-ZÁÉÍÓÚÇÃÊÔÕ\s]+$/.test(line) && !/\d/.test(line) && 
          !line.includes('|') && !line.includes('─') && !line.includes(':') &&
          line.length > 8 && line.length < 80) {
        const palavras = line.split(/\s+/).filter(p => p.length > 0);
        // Aceitar nomes de 2 a 8 palavras (nomes completos brasileiros)
        if (palavras.length >= 2 && palavras.length <= 8) {
          const candidato = palavras.join(' ').trim();
          if (!isDisciplina(candidato)) {
            data.aluno = candidato;
            break;
          }
        }
      }
    }
  }

  // Lista de disciplinas válidas (nomes completos e normalizados)
  // 13 disciplinas do boletim do 7º ano
  const disciplinasValidas = [
    'EMPREENDEDORISMO',
    'FILOSOFIA',
    'GEOGRAFIA',
    'HISTÓRIA',
    'REDAÇÃO',
    'ÉTICA E CIDADANIA',
    'CIÊNCIAS',
    'EDUCAÇÃO FÍSICA',
    'ENSINO DA ARTE',
    'ESPANHOL',
    'INGLÊS',
    'LÍNGUA PORTUGUESA',
    'MATEMÁTICA'
  ];
  
  // Lista de palavras proibidas (não são disciplinas)
  const palavrasProibidas = [
    'FEMES', 'FALTAS', 'DISCIPLINA', 'MÉDIA', 'PROVISÓRIA', 'PARCIAL',
    'EXTRA', 'EXTRAS', 'BIMESTRE', 'BIMESTRAL', 'ANUAL', 'FINAL',
    'SITUAÇÃO', 'RESULTADO', 'SOMA', 'PROVA', 'AV', 'AVALIAÇÃO',
    'PONTOS', 'PAI', 'EPA', 'NOM', 'LAOPIM', 'L4ONI', 'BIM',
    'LO', 'VMEDIAS', 'PARCIAIS', 'BIMESTRAIS', 'RESULTADOANUVAL',
    'ANUVAL', 'MEDIAS', 'MEDIA', 'PROVA', 'FINAL', 'SITUACAO'
  ];
  
  // Função para normalizar nome de disciplina
  const normalizarNomeDisciplina = (nome) => {
    return nome.toUpperCase()
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/EDUCACAO FISICA/gi, 'EDUCAÇÃO FÍSICA')
      .replace(/EDUCAÇÃO FISICA/gi, 'EDUCAÇÃO FÍSICA');
  };
  
  // Função para validar se um nome é uma disciplina válida
  const isValidDisciplina = (nome) => {
    const nomeNormalizado = normalizarNomeDisciplina(nome);
    
    // Verificar se contém palavras proibidas (mas permitir se for parte de uma disciplina válida)
    const temPalavraProibida = palavrasProibidas.some(proibida => nomeNormalizado.includes(proibida));
    if (temPalavraProibida) {
      // Verificar se mesmo assim é uma disciplina válida (ex: "FILOSOFIA" pode conter "SOFIA" mas não é proibida)
      const aindaEhValida = disciplinasValidas.some(disc => {
        const discUpper = disc.toUpperCase();
        return nomeNormalizado === discUpper || 
               nomeNormalizado.includes(discUpper) || 
               discUpper.includes(nomeNormalizado);
      });
      if (!aindaEhValida) {
        return false;
      }
    }
    
    // Verificar se corresponde a uma disciplina válida
    return disciplinasValidas.some(disc => {
      const discUpper = disc.toUpperCase();
      return nomeNormalizado === discUpper || 
             nomeNormalizado.includes(discUpper) || 
             discUpper.includes(nomeNormalizado);
    });
  };
  
  // Função para encontrar o nome correto da disciplina
  const encontrarNomeDisciplina = (nomeCandidato) => {
    const nomeNormalizado = normalizarNomeDisciplina(nomeCandidato);
    const nomeUpper = nomeCandidato.toUpperCase();
    
    // Buscar correspondência exata ou parcial
    for (const disc of disciplinasValidas) {
      const discUpper = disc.toUpperCase();
      const discNormalizado = normalizarNomeDisciplina(disc);
      
      // Comparar nomes normalizados
      if (nomeNormalizado === discNormalizado || 
          nomeNormalizado === discUpper ||
          nomeNormalizado.includes(discNormalizado) || 
          discNormalizado.includes(nomeNormalizado) ||
          nomeNormalizado.includes(discUpper) || 
          discUpper.includes(nomeNormalizado)) {
        return disc; // Retornar nome normalizado da lista
      }
      
      // Busca mais flexível para erros de OCR (verificar se contém pelo menos 70% do nome)
      const minChars = Math.max(4, Math.floor(discUpper.length * 0.7));
      if (nomeUpper.includes(discUpper.substring(0, minChars)) || 
          discUpper.includes(nomeUpper.substring(0, Math.max(4, Math.floor(nomeUpper.length * 0.7))))) {
        return disc;
      }
    }
    
    return null; // Não é uma disciplina válida
  };
  
  // Função para verificar duplicata
  const isDuplicata = (nome, disciplinas) => {
    const nomeNormalizado = normalizarNomeDisciplina(nome);
    return disciplinas.some(d => {
      const dNomeNormalizado = normalizarNomeDisciplina(d.nome);
      return dNomeNormalizado === nomeNormalizado;
    });
  };

  // Extrair disciplinas e notas
  // Procura por linhas que contêm padrões de tabela
  const disciplinas = [];
  let currentDisciplina = null;
  let inTableSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detectar início da tabela (linhas com "Disciplina", "Faltas", "1ª AV", etc)
    if (/(?:disciplina|1ª\s*av|2ª\s*av|3ª\s*av|faltas)/i.test(line)) {
      inTableSection = true;
      continue;
    }
    
    if (!inTableSection) continue;
    
    // Função auxiliar para parsear número (trata traços, vazios, etc)
    const parseNumber = (str) => {
      if (!str || str.trim() === '' || str.trim() === '-' || str.trim() === '—') {
        return null;
      }
      const num = str.replace(',', '.').match(/(\d+\.?\d*)/);
      return num ? parseFloat(num[1]) : null;
    };
    
    // Tentar identificar linha de disciplina/sub-disciplina
    // Padrão mais flexível: linha que começa com maiúsculas seguida de números
    // Aceita vírgulas como separador decimal e espaços variáveis
    const disciplinaLinePattern = /^([A-ZÁÉÍÓÚÇÃÊÔÕ][A-ZÁÉÍÓÚÇÃÊÔÕ\s\-\w]+?)\s+(\d+|\-|—|\s*)\s*(\d+[,.]?\d*|\-|—|\s*)\s*(\d+[,.]?\d*|\-|—|\s*)\s*(\d+[,.]?\d*|\-|—|\s*)/;
    const match = line.match(disciplinaLinePattern);
    
    if (match) {
      const nomeDisciplinaRaw = match[1].trim();
      
      // Log de debug para FILOSOFIA especificamente
      if (nomeDisciplinaRaw.toUpperCase().includes('FILOS') || nomeDisciplinaRaw.toUpperCase().includes('FILO')) {
        console.log(`[DEBUG] Linha encontrada que pode ser FILOSOFIA: "${nomeDisciplinaRaw}"`);
      }
      
      // Log de debug para disciplinas que não passam na validação
      const isValid = isValidDisciplina(nomeDisciplinaRaw);
      if (!isValid && nomeDisciplinaRaw.length > 3) {
        // Tentar encontrar correspondência mesmo assim (pode ser erro de OCR)
        const nomeEncontrado = encontrarNomeDisciplina(nomeDisciplinaRaw);
        if (!nomeEncontrado) {
          // Log apenas se realmente não for uma disciplina conhecida
          const pareceDisciplina = disciplinasValidas.some(disc => {
            const discUpper = disc.toUpperCase();
            const nomeUpper = nomeDisciplinaRaw.toUpperCase();
            // Verificar similaridade (pelo menos 70% dos caracteres)
            return nomeUpper.includes(discUpper.substring(0, Math.max(4, discUpper.length * 0.7))) ||
                   discUpper.includes(nomeUpper.substring(0, Math.max(4, nomeUpper.length * 0.7)));
          });
          if (!pareceDisciplina) {
            continue; // Pular se não for uma disciplina válida
          }
        }
      }
      
      // Encontrar o nome correto da disciplina (normalizado)
      let nomeDisciplina = encontrarNomeDisciplina(nomeDisciplinaRaw);
      if (!nomeDisciplina) {
        // Tentar busca mais flexível para FILOSOFIA e outras disciplinas com erros de OCR
        const nomeUpper = nomeDisciplinaRaw.toUpperCase();
        if (nomeUpper.includes('FILOSOF') || nomeUpper.includes('FILOSO') || nomeUpper.includes('FILOS')) {
          nomeDisciplina = 'FILOSOFIA';
        } else if (nomeUpper.includes('GEOGRA')) {
          nomeDisciplina = 'GEOGRAFIA';
        } else if (nomeUpper.includes('HISTOR')) {
          nomeDisciplina = 'HISTÓRIA';
        } else if (nomeUpper.includes('REDACA')) {
          nomeDisciplina = 'REDAÇÃO';
        } else if (nomeUpper.includes('ETICA') || nomeUpper.includes('CIDADAN')) {
          nomeDisciplina = 'ÉTICA E CIDADANIA';
        } else if (nomeUpper.includes('CIENCI')) {
          nomeDisciplina = 'CIÊNCIAS';
        } else if (nomeUpper.includes('EDUCACAO') || nomeUpper.includes('FISICA')) {
          nomeDisciplina = 'EDUCAÇÃO FÍSICA';
        } else if (nomeUpper.includes('ARTE') || nomeUpper.includes('ENSINO')) {
          nomeDisciplina = 'ENSINO DA ARTE';
        } else if (nomeUpper.includes('ESPANH')) {
          nomeDisciplina = 'ESPANHOL';
        } else if (nomeUpper.includes('INGLES') || nomeUpper.includes('INGLÊS')) {
          nomeDisciplina = 'INGLÊS';
        } else if (nomeUpper.includes('PORTUGUES') || nomeUpper.includes('LINGUA')) {
          nomeDisciplina = 'LÍNGUA PORTUGUESA';
        } else if (nomeUpper.includes('MATEMAT')) {
          nomeDisciplina = 'MATEMÁTICA';
        } else if (nomeUpper.includes('EMPREENDEDOR')) {
          nomeDisciplina = 'EMPREENDEDORISMO';
        } else {
          continue; // Não encontrou correspondência válida
        }
      }
      
      // Verificar duplicata
      if (isDuplicata(nomeDisciplina, disciplinas)) {
        continue; // Já existe, pular
      }
      
      const faltas = parseNumber(match[2]) || 0;
      // Usar os valores do regex diretamente (preserva posição dos traços)
      let av1Final = parseNumber(match[3]);
      let av2Final = parseNumber(match[4]);
      let av3Final = parseNumber(match[5]);
      
      let pontosExtras = 0;
      let mediaProvisoria = null;
      let mediaParcial = null;
      
      // Extrair números adicionais da linha para médias (após as 3 notas)
      // Buscar todos os números, mas usar os do regex para as notas (preserva traços)
      const numbersInLine = line.match(/(\d+[,.]?\d*)/g);
      if (numbersInLine && numbersInLine.length >= 4) {
        // Ordem esperada na linha: Faltas, 1ª AV, 2ª AV, 3ª AV, Média Provisória, Pontos Extras, Média Parcial
        // Se temos pelo menos 5 números, o 5º pode ser média provisória
        if (numbersInLine.length >= 5) {
          // Verificar se o 5º número é realmente a média provisória (não uma nota)
          // Se av3Final é null (traço), então o 4º número é a média provisória
          if (av3Final === null && numbersInLine.length >= 4) {
            mediaProvisoria = parseNumber(numbersInLine[3]);
            if (numbersInLine.length >= 5) {
              pontosExtras = parseNumber(numbersInLine[4]) || 0;
            }
            if (numbersInLine.length >= 6) {
              mediaParcial = parseNumber(numbersInLine[5]);
            }
          } else if (numbersInLine.length >= 5) {
            // Todas as 3 notas existem, então o 5º número é média provisória
            mediaProvisoria = parseNumber(numbersInLine[4]);
            if (numbersInLine.length >= 6) {
              pontosExtras = parseNumber(numbersInLine[5]) || 0;
            }
            if (numbersInLine.length >= 7) {
              mediaParcial = parseNumber(numbersInLine[6]);
            }
          }
        }
      }
      
      // Se ainda não encontrou as médias, tentar buscar na próxima linha
      if (mediaProvisoria === null) {
        // Tentar buscar na próxima linha
        if (i + 1 < lines.length) {
          const nextLineNumbers = lines[i + 1].match(/(\d+[,.]?\d*)/g);
          if (nextLineNumbers && nextLineNumbers.length >= 3) {
            mediaProvisoria = parseNumber(nextLineNumbers[0]);
            pontosExtras = parseNumber(nextLineNumbers[1]) || 0;
            mediaParcial = parseNumber(nextLineNumbers[2]);
          }
        }
      }
      
      // Criar disciplina
      currentDisciplina = {
        nome: nomeDisciplina,
        notas: [],
        faltas: faltas || 0,
        pontosExtras: pontosExtras || 0
      };
      
      // Adicionar notas sempre nas 3 posições (pode ter null para traços)
      // Isso garante que mesmo quando há traços, as notas existentes são preservadas
      currentDisciplina.notas.push(av1Final); // Pode ser null se for traço
      currentDisciplina.notas.push(av2Final); // Pode ser null se for traço
      currentDisciplina.notas.push(av3Final); // Pode ser null se for traço
      
      // Garantir que temos exatamente 3 slots para notas
      while (currentDisciplina.notas.length < 3) {
        currentDisciplina.notas.push(null);
      }
      
      // Log de debug para disciplinas com notas
      if (nomeDisciplina === 'EMPREENDEDORISMO' || nomeDisciplina === 'FILOSOFIA') {
        console.log(`[DEBUG] ${nomeDisciplina}: Faltas=${faltas}, Notas=[${av1Final}, ${av2Final}, ${av3Final}], Média Provisória=${mediaProvisoria}, Pontos Extras=${pontosExtras}, Média Parcial=${mediaParcial}`);
      }
      
      // Se tiver média provisória calculada, usar ela
      if (mediaProvisoria !== null) {
        currentDisciplina.mediaProvisoriaExtraida = mediaProvisoria;
      }
      
      // Se tiver média parcial calculada, usar ela
      if (mediaParcial !== null) {
        currentDisciplina.mediaParcialExtraida = mediaParcial;
      }
      
      disciplinas.push(currentDisciplina);
      continue;
    }
    
    // Buscar padrões alternativos - linhas que mencionam disciplinas específicas
    // Esta é uma estratégia de fallback caso o padrão regex principal não funcione
    // Só usar se não encontrou disciplina no padrão principal
    for (const nome of disciplinasValidas) {
      // Verificar se a linha contém o nome da disciplina (case insensitive)
      const nomeUpper = nome.toUpperCase();
      const lineUpper = line.toUpperCase();
      
      // Verificar se o nome da disciplina aparece no início da linha
      // (não apenas em qualquer lugar, para evitar falsos positivos)
      if (lineUpper.startsWith(nomeUpper) || lineUpper.match(new RegExp(`^\\s*${nomeUpper}\\s+`))) {
        // Verificar se já existe disciplina com esse nome (duplicata)
        if (isDuplicata(nome, disciplinas)) {
          continue; // Já existe, pular
        }
        
        // Verificar se a linha contém palavras proibidas (não é cabeçalho)
        if (palavrasProibidas.some(proibida => lineUpper.includes(proibida))) {
          continue; // Contém palavra proibida, pular
        }
        
        // Verificar se não foi processada pelo padrão principal
        const jaProcessada = disciplinas.some(d => normalizarNomeDisciplina(d.nome) === nomeUpper);
        if (!jaProcessada) {
          // Extrair todos os números da linha (incluindo decimais com vírgula)
          const numbers = line.match(/(\d+[,.]?\d*)/g);
          // Validar que tem pelo menos faltas e uma nota (mínimo 2 números)
          if (numbers && numbers.length >= 2) {
            currentDisciplina = {
              nome: nome, // Usar nome normalizado da lista
              notas: [],
              faltas: 0,
              pontosExtras: 0
            };
            
            // Tentar identificar padrão: faltas, av1, av2, av3, média provisória, pontos extras, média parcial
            // Usar regex para capturar a linha completa e preservar traços
            const linhaMatch = line.match(/^([A-ZÁÉÍÓÚÇÃÊÔÕ][A-ZÁÉÍÓÚÇÃÊÔÕ\s\-\w]+?)\s+(\d+|\-|—|\s*)\s*(\d+[,.]?\d*|\-|—|\s*)\s*(\d+[,.]?\d*|\-|—|\s*)\s*(\d+[,.]?\d*|\-|—|\s*)/);
            if (linhaMatch) {
              // Usar regex para preservar posição dos traços
              currentDisciplina.faltas = parseInt(linhaMatch[2]) || 0;
              currentDisciplina.notas = [
                parseNumber(linhaMatch[3]),
                parseNumber(linhaMatch[4]),
                parseNumber(linhaMatch[5])
              ];
            } else if (numbers.length >= 4) {
              // Fallback: usar números sequenciais (menos preciso)
              currentDisciplina.faltas = parseInt(numbers[0]) || 0;
              currentDisciplina.notas = [
                parseNumber(numbers[1]),
                parseNumber(numbers[2]),
                parseNumber(numbers[3])
              ];
            }
            
            // Garantir 3 slots para notas (pode ter null para traços)
            while (currentDisciplina.notas.length < 3) {
              currentDisciplina.notas.push(null);
            }
            
            // Extrair médias se disponíveis
            if (numbers && numbers.length >= 5) {
              // Se usou regex, calcular índice correto considerando traços
              if (linhaMatch) {
                // Contar quantos números existem antes de cada campo
                const numbersBeforeMedia = numbers.length;
                // Se temos pelo menos 4 números e a 3ª nota é null, o 4º é média provisória
                if (currentDisciplina.notas[2] === null && numbers.length >= 4) {
                  currentDisciplina.mediaProvisoriaExtraida = parseNumber(numbers[3]);
                  if (numbers.length >= 5) {
                    currentDisciplina.pontosExtras = parseNumber(numbers[4]) || 0;
                  }
                  if (numbers.length >= 6) {
                    currentDisciplina.mediaParcialExtraida = parseNumber(numbers[5]);
                  }
                } else if (numbers.length >= 5) {
                  // Todas as 3 notas existem
                  currentDisciplina.mediaProvisoriaExtraida = parseNumber(numbers[4]);
                  if (numbers.length >= 6) {
                    currentDisciplina.pontosExtras = parseNumber(numbers[5]) || 0;
                  }
                  if (numbers.length >= 7) {
                    currentDisciplina.mediaParcialExtraida = parseNumber(numbers[6]);
                  }
                }
              } else {
                // Fallback: usar números sequenciais
                if (numbers.length >= 5) {
                  currentDisciplina.mediaProvisoriaExtraida = parseNumber(numbers[4]);
                }
                if (numbers.length >= 6) {
                  currentDisciplina.pontosExtras = parseNumber(numbers[5]) || 0;
                }
                if (numbers.length >= 7) {
                  currentDisciplina.mediaParcialExtraida = parseNumber(numbers[6]);
                }
              }
            }
            
            disciplinas.push(currentDisciplina);
            break; // Parar após encontrar a primeira disciplina correspondente
          }
        }
      }
    }
  }

  // Limpar notas nulas do final (mas manter nulas do meio)
  disciplinas.forEach(d => {
    // Se a última nota for null, remover apenas do final
    while (d.notas.length > 0 && d.notas[d.notas.length - 1] === null) {
      d.notas.pop();
    }
    // Garantir que temos exatamente 3 slots para notas (pode ter null no meio)
    while (d.notas.length < 3) {
      d.notas.push(null);
    }
  });

  // Remover duplicatas finais (por segurança)
  const disciplinasUnicas = [];
  const nomesProcessados = new Set();
  
  disciplinas.forEach(d => {
    const nomeNormalizado = normalizarNomeDisciplina(d.nome);
    if (!nomesProcessados.has(nomeNormalizado)) {
      nomesProcessados.add(nomeNormalizado);
      disciplinasUnicas.push(d);
    }
  });

  data.disciplinas = disciplinasUnicas;
  
  return data;
}

// Função para calcular médias
function calculateAverages(disciplina, mediaMinima = 7.0) {
  // Filtrar notas válidas (remover null, 0 pode ser válido em alguns casos)
  const notas = disciplina.notas.filter(n => n !== null && n !== undefined && !isNaN(n));
  const qtdNotas = notas.length;
  
  // Se já temos média provisória extraída do boletim, usar ela (mais preciso)
  let mediaProvisoria;
  if (disciplina.mediaProvisoriaExtraida !== null && disciplina.mediaProvisoriaExtraida !== undefined) {
    mediaProvisoria = disciplina.mediaProvisoriaExtraida;
  } else {
    // Calcular média provisória
    const somaNotas = notas.reduce((sum, nota) => sum + nota, 0);
    mediaProvisoria = qtdNotas > 0 ? somaNotas / qtdNotas : 0;
  }
  
  // Se já temos média parcial extraída do boletim, usar ela
  let mediaParcialLimitada;
  if (disciplina.mediaParcialExtraida !== null && disciplina.mediaParcialExtraida !== undefined) {
    mediaParcialLimitada = disciplina.mediaParcialExtraida;
  } else {
    // Calcular média parcial (com pontos extras)
    const mediaParcial = mediaProvisoria + (disciplina.pontosExtras || 0);
    // Limitar média parcial a 10
    mediaParcialLimitada = Math.min(mediaParcial, 10);
  }
  
  // Calcular nota necessária para atingir média mínima
  let notaNecessaria = null;
  let status = 'Aprovado';
  
  // Verificar se todas as 3 avaliações foram lançadas
  const todasNotasLancadas = qtdNotas >= 3 && disciplina.notas.every(n => n !== null && n !== undefined);
  
  if (!todasNotasLancadas && qtdNotas > 0) {
    // Se ainda faltam avaliações
    const faltamNotas = 3 - qtdNotas;
    const somaAtual = notas.reduce((sum, nota) => sum + nota, 0) + (disciplina.pontosExtras || 0);
    const totalNecessario = mediaMinima * 3;
    const notaFaltante = (totalNecessario - somaAtual) / faltamNotas;
    
    if (notaFaltante > 0 && notaFaltante <= 10) {
      notaNecessaria = parseFloat(notaFaltante.toFixed(2));
    }
    
    if (notaFaltante > 10) {
      status = 'Em Recuperação';
    } else if (mediaParcialLimitada >= mediaMinima) {
      status = 'Aprovado';
    } else if (mediaParcialLimitada >= mediaMinima * 0.6) {
      status = 'Em Recuperação';
    } else {
      status = 'Reprovado';
    }
  } else {
    // Todas as notas já foram lançadas (ou nenhuma nota ainda)
    if (qtdNotas === 0) {
      status = 'Sem Notas';
      notaNecessaria = mediaMinima;
    } else if (mediaParcialLimitada >= mediaMinima) {
      status = 'Aprovado';
    } else if (mediaParcialLimitada >= mediaMinima * 0.6) {
      status = 'Em Recuperação';
    } else {
      status = 'Reprovado';
    }
  }
  
  return {
    mediaProvisoria: parseFloat(mediaProvisoria.toFixed(2)),
    mediaParcial: parseFloat(mediaParcialLimitada.toFixed(2)),
    qtdNotas,
    notaNecessaria,
    status,
    mediaMinima
  };
}

// Rota de upload
app.post('/api/upload', upload.single('boletim'), async (req, res) => {
  try {
    console.log('Upload recebido:', req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'Nenhum arquivo');
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imagePath = req.file.path;
    console.log('Processando OCR...');
    
    // OCR com Tesseract.js
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'por',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('OCR concluído. Texto extraído:', text.substring(0, 500) + '...');
    console.log('Primeiras 10 linhas do OCR:', text.split('\n').slice(0, 10).join('\n'));

    // Extrair dados do texto
    const extractedData = extractDataFromText(text);
    
    console.log('Dados extraídos:', {
      aluno: extractedData.aluno,
      matricula: extractedData.matricula,
      turma: extractedData.turma,
      bimestre: extractedData.bimestre,
      qtdDisciplinas: extractedData.disciplinas.length
    });
    
    // Log detalhado das disciplinas extraídas
    console.log(`\n📚 Total de disciplinas extraídas: ${extractedData.disciplinas.length} de 13 esperadas`);
    console.log('Disciplinas extraídas:');
    extractedData.disciplinas.forEach((disc, idx) => {
      console.log(`  ${idx + 1}. ${disc.nome}: Faltas=${disc.faltas}, Notas=[${disc.notas.join(', ')}], Média Provisória=${disc.mediaProvisoriaExtraida || 'N/A'}, Pontos Extras=${disc.pontosExtras}, Média Parcial=${disc.mediaParcialExtraida || 'N/A'}`);
    });
    
    // Verificar se todas as 13 disciplinas foram encontradas
    const disciplinasEsperadas = [
      'EMPREENDEDORISMO', 'FILOSOFIA', 'GEOGRAFIA', 'HISTÓRIA', 'REDAÇÃO',
      'ÉTICA E CIDADANIA', 'CIÊNCIAS', 'EDUCAÇÃO FÍSICA', 'ENSINO DA ARTE',
      'ESPANHOL', 'INGLÊS', 'LÍNGUA PORTUGUESA', 'MATEMÁTICA'
    ];
    
    if (extractedData.disciplinas.length < 13) {
      console.log(`\n⚠️  ATENÇÃO: Faltam ${13 - extractedData.disciplinas.length} disciplina(s)!`);
      const disciplinasEncontradas = extractedData.disciplinas.map(d => d.nome.toUpperCase());
      const disciplinasFaltantes = disciplinasEsperadas.filter(d => 
        !disciplinasEncontradas.some(e => e.includes(d) || d.includes(e))
      );
      if (disciplinasFaltantes.length > 0) {
        console.log('Disciplinas não encontradas:', disciplinasFaltantes.join(', '));
      }
    } else if (extractedData.disciplinas.length === 13) {
      console.log('\n✅ Todas as 13 disciplinas foram encontradas!');
    }

    // Processar cada disciplina
    const disciplinasProcessadas = extractedData.disciplinas.map(disciplina => {
      const calculos = calculateAverages(disciplina, 7.0); // Média padrão 7.0
      return {
        ...disciplina,
        ...calculos
      };
    });

    // Limpar arquivo temporário
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      textoOCR: text,
      dados: {
        ...extractedData,
        disciplinas: disciplinasProcessadas
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar a imagem: ' + error.message });
  }
});

// Rota para recalcular com média mínima customizada
app.post('/api/calculate', (req, res) => {
  try {
    const { disciplinas, mediaMinima } = req.body;
    
    if (!disciplinas || !Array.isArray(disciplinas)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const disciplinasProcessadas = disciplinas.map(disciplina => {
      const calculos = calculateAverages(disciplina, mediaMinima || 7.0);
      return {
        ...disciplina,
        ...calculos
      };
    });

    res.json({
      success: true,
      disciplinas: disciplinasProcessadas
    });
  } catch (error) {
    console.error('Erro no cálculo:', error);
    res.status(500).json({ error: 'Erro ao calcular médias: ' + error.message });
  }
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor rodando' });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Erro: A porta ${PORT} já está em uso.`);
    console.error(`💡 Tente usar outra porta definindo a variável PORT, por exemplo: PORT=5002 npm start`);
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
});


