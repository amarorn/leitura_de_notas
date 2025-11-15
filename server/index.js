const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

  // Extrair informações do cabeçalho
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Nome do aluno - vários padrões possíveis
    const alunoPatterns = [
      /(?:nome\s+do\s+aluno[\(a\)]*[:\s]+)([A-Z][A-Z\s]+?)(?:\s+\d|\s+matr|matr|turma|$)/i,
      /(?:aluno[\(a\)]*[:\s]+)([A-Z][A-Z\s]+?)(?:\s+\d|\s+matr|matr|turma|$)/i,
      /([A-Z][A-Z][A-Z][A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)+)/  // Padrão ALL CAPS
    ];
    
    for (const pattern of alunoPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        data.aluno = match[1].trim().replace(/\s+/g, ' ');
        break;
      }
    }
    
    // Matrícula
    const matriculaMatch = line.match(/(?:matr[íi]cula|matricula)[:\s]*(\d+)/i);
    if (matriculaMatch) {
      data.matricula = matriculaMatch[1];
    }
    
    // Turma
    const turmaMatch = line.match(/(?:turma)[:\s]*([A-Z0-9\-]+)/i);
    if (turmaMatch) {
      data.turma = turmaMatch[1];
    }
    
    // Bimestre
    const bimestreMatch = line.match(/(\d+)[º°]\s*bimestre/i);
    if (bimestreMatch) {
      data.bimestre = `${bimestreMatch[1]}º Bimestre`;
    }
  }

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
    // Padrão: linha que começa com maiúsculas seguida de números (faltas e notas)
    const disciplinaLinePattern = /^([A-ZÁÉÍÓÚÇÃÊÔÕ][A-ZÁÉÍÓÚÇÃÊÔÕ\s\-\w]+?)\s+(\d+|\-|—|\s+)\s+(\d+\.?\d*|\-|—|\s+)\s+(\d+\.?\d*|\-|—|\s+)\s+(\d+\.?\d*|\-|—|\s+)/;
    const match = line.match(disciplinaLinePattern);
    
    if (match) {
      const nomeDisciplina = match[1].trim();
      const faltas = parseNumber(match[2]) || 0;
      const av1 = parseNumber(match[3]);
      const av2 = parseNumber(match[4]);
      const av3 = parseNumber(match[5]);
      
      // Se a linha seguinte contém mais números (média provisória, pontos extras, etc)
      let av1Final = av1, av2Final = av2, av3Final = av3;
      let pontosExtras = 0;
      let mediaProvisoria = null;
      let mediaParcial = null;
      
      // Tentar extrair da mesma linha ou próxima linha
      const numbersInLine = line.match(/(\d+[,.]?\d*)/g);
      if (numbersInLine && numbersInLine.length >= 6) {
        // Assumir ordem: Faltas, 1ª AV, 2ª AV, 3ª AV, Média Provisória, Pontos Extras, Média Parcial
        av1Final = parseNumber(numbersInLine[1]);
        av2Final = parseNumber(numbersInLine[2]);
        av3Final = parseNumber(numbersInLine[3]);
        mediaProvisoria = parseNumber(numbersInLine[4]);
        pontosExtras = parseNumber(numbersInLine[5]) || 0;
        mediaParcial = parseNumber(numbersInLine[6]);
      } else {
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
      
      // Adicionar notas (apenas as que existem)
      if (av1Final !== null) currentDisciplina.notas.push(av1Final);
      if (av2Final !== null) currentDisciplina.notas.push(av2Final);
      if (av3Final !== null) currentDisciplina.notas.push(av3Final);
      
      // Garantir que temos pelo menos 3 slots para notas
      while (currentDisciplina.notas.length < 3) {
        currentDisciplina.notas.push(null);
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
    const disciplinaNames = [
      'EMPREENDEDORISMO', 'FILOSOFIA', 'GEOGRAFIA', 'HISTÓRIA', 'REDAÇÃO',
      'ÉTICA E CIDADANIA', 'CIÊNCIAS', 'EDUCAÇÃO FISICA', 'EDUCAÇÃO FÍSICA',
      'ENSINO DA ARTE', 'ESPANHOL', 'INGLÊS', 'LÍNGUA PORTUGUESA', 'MATEMÁTICA',
      'SOCIOLOGIA', 'BIOLOGIA', 'FÍSICA', 'QUÍMICA', 'PROJETO DE VIDA',
      'LITERATURA', 'ANÁLISE LINGUÍSTICA', 'PRODUÇÃO DE TEXTO'
    ];
    
    for (const nome of disciplinaNames) {
      if (line.toUpperCase().includes(nome)) {
        // Verificar se já existe disciplina com esse nome
        let disciplinaExistente = disciplinas.find(d => 
          d.nome.toUpperCase().includes(nome) || nome.includes(d.nome.toUpperCase())
        );
        
        if (!disciplinaExistente) {
          // Extrair números da linha
          const numbers = line.match(/(\d+[,.]?\d*)/g);
          if (numbers && numbers.length >= 2) {
            currentDisciplina = {
              nome: nome,
              notas: [],
              faltas: 0,
              pontosExtras: 0
            };
            
            // Tentar identificar padrão: faltas, av1, av2, av3, média, extras
            if (numbers.length >= 4) {
              currentDisciplina.faltas = parseInt(numbers[0]) || 0;
              currentDisciplina.notas = [
                parseNumber(numbers[1]),
                parseNumber(numbers[2]),
                parseNumber(numbers[3])
              ].filter(n => n !== null);
              
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
            
            // Garantir 3 slots para notas
            while (currentDisciplina.notas.length < 3) {
              currentDisciplina.notas.push(null);
            }
            
            disciplinas.push(currentDisciplina);
          }
        }
        break;
      }
    }
  }

  // Limpar notas nulas do final
  disciplinas.forEach(d => {
    // Se a última nota for null, remover
    while (d.notas.length > 0 && d.notas[d.notas.length - 1] === null) {
      d.notas.pop();
    }
  });

  data.disciplinas = disciplinas;
  
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
    
    console.log('OCR concluído. Texto extraído:', text.substring(0, 200) + '...');

    // Extrair dados do texto
    const extractedData = extractDataFromText(text);

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
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}`);
});


