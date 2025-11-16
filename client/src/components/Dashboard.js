import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DisciplinaCard from './DisciplinaCard';
import PainelGeral from './PainelGeral';
import MediaConfig from './MediaConfig';

const Dashboard = ({ dadosBoletim, setDadosBoletim }) => {
  const [mediaMinima, setMediaMinima] = useState(7.0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await axios.post('http://localhost:5001/api/calculate', {
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
                <DisciplinaCard key={index} disciplina={disciplina} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

