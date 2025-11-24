import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import DisciplinaCard from './DisciplinaCard';
import PainelGeral from './PainelGeral';
import MediaConfig from './MediaConfig';

const Dashboard = ({ dadosBoletim, setDadosBoletim }) => {
  const [mediaMinima, setMediaMinima] = useState(7.0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const resumoMaterias = dadosBoletim?.resumoMaterias || [];

  const formatNotaLabel = (key) => {
    if (key === '1a_av') return '1ª AV';
    if (key === '2a_av') return '2ª AV';
    if (key === '3a_av') return '3ª AV';
    if (key === '4a_av') return '4ª AV';
    return key.replace('_', ' ');
  };

  if (!dadosBoletim || !dadosBoletim.disciplinas) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nenhum dado disponível</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Upload
          </button>
        </div>
      </div>
    );
  }

  const handleMediaChange = async (novaMedia) => {
    setMediaMinima(novaMedia);
    setLoading(true);

          try {
            const response = await axios.post(`${API_URL}/api/calculate`, {
        disciplinas: dadosBoletim.disciplinas,
        mediaMinima: novaMedia
      });

      setDadosBoletim({
        ...dadosBoletim,
        disciplinas: response.data.disciplinas
      });
    } catch (error) {
      console.error('Erro ao recalcular:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = () => {
    const disciplinas = dadosBoletim.disciplinas;
    const total = disciplinas.length;
    const aprovados = disciplinas.filter(d => d.status === 'Aprovado').length;
    const recuperacao = disciplinas.filter(d => d.status === 'Em Recuperação').length;
    const reprovados = disciplinas.filter(d => d.status === 'Reprovado').length;
    
    const mediaGeral = disciplinas.length > 0
      ? disciplinas.reduce((sum, d) => sum + d.mediaParcial, 0) / disciplinas.length
      : 0;

    return {
      total,
      aprovados,
      recuperacao,
      reprovados,
      mediaGeral: parseFloat(mediaGeral.toFixed(2))
    };
  };

  const stats = calcularEstatisticas();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                📊 Painel de Desempenho
              </h1>
              {(dadosBoletim.aluno || dadosBoletim.matricula || dadosBoletim.turma) && (
                <div className="text-lg text-gray-600 space-y-1">
                  {dadosBoletim.aluno && (
                    <p>
                      Aluno: <span className="font-semibold">{dadosBoletim.aluno}</span>
                    </p>
                  )}
                  <div className="flex gap-4 text-sm">
                    {dadosBoletim.matricula && (
                      <span>Matrícula: <span className="font-semibold">{dadosBoletim.matricula}</span></span>
                    )}
                    {dadosBoletim.turma && (
                      <span>Turma: <span className="font-semibold">{dadosBoletim.turma}</span></span>
                    )}
                    {dadosBoletim.bimestre && (
                      <span>Bimestre: <span className="font-semibold">{dadosBoletim.bimestre}</span></span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setDadosBoletim(null);
                navigate('/');
              }}
              className="mt-4 md:mt-0 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              📤 Novo Upload
            </button>
          </div>

          {/* Configuração de Média Mínima */}
          <MediaConfig
            mediaMinima={mediaMinima}
            onMediaChange={handleMediaChange}
            loading={loading}
          />
        </div>

        {/* Painel Geral */}
        <PainelGeral stats={stats} />

        {/* Resumo detalhado por disciplina */}
        {resumoMaterias.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📚 Resumo detalhado por disciplina
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumoMaterias.map((materia, index) => (
                <article
                  key={index}
                  className="relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {materia.nome}
                    </h3>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      Média parcial: {materia.mediaParcial?.toFixed(1) ?? '-'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {Object.entries(materia.notas || {}).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-gray-100 rounded-full"
                      >
                        {formatNotaLabel(key)}: {value ?? '-'}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <p>
                      Média provisória:{' '}
                      <span className="font-semibold">
                        {materia.mediaProvisoria ?? '-'}
                      </span>
                    </p>
                    <p>
                      Pontos extras:{' '}
                      <span className="font-semibold">{materia.pontosExtras}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {materia.mediasParciaisBimestrais?.map((bimestre) => (
                      <div
                        key={bimestre.bimestre}
                        className="rounded-xl border border-dashed border-gray-300 px-3 py-2 bg-gray-50"
                      >
                        <p className="text-gray-500">{bimestre.bimestre}</p>
                        <p className="text-base font-semibold text-gray-800">
                          {bimestre.mediaParcial ?? '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Cards de Disciplinas */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Disciplinas ({dadosBoletim.disciplinas.length})
          </h2>
          
          {dadosBoletim.disciplinas.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                Nenhuma disciplina foi detectada. Tente fazer upload de uma imagem mais nítida.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dadosBoletim.disciplinas.map((disciplina, index) => (
                <DisciplinaCard 
                  key={index} 
                  disciplina={disciplina}
                  mediaMinima={mediaMinima}
                  onUpdate={(disciplinaAtualizada) => {
                    const novasDisciplinas = [...dadosBoletim.disciplinas];
                    novasDisciplinas[index] = disciplinaAtualizada;
                    setDadosBoletim({
                      ...dadosBoletim,
                      disciplinas: novasDisciplinas
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
