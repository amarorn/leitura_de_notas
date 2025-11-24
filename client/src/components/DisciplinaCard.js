import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DisciplinaCard = ({ disciplina, onUpdate, mediaMinima = 7.0 }) => {
  const pontosExtrasInicial = disciplina.pontosExtras || disciplina.pontos_extras || 0;
  const [pontosExtras, setPontosExtras] = useState(pontosExtrasInicial);
  const [isEditingPontos, setIsEditingPontos] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sincronizar pontos extras quando disciplina mudar
  useEffect(() => {
    const novosPontos = disciplina.pontosExtras || disciplina.pontos_extras || 0;
    setPontosExtras(novosPontos);
  }, [disciplina.pontosExtras, disciplina.pontos_extras]);
  const getStatusColor = (status) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Em Recuperação':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Reprovado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Sem Notas':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado':
        return '✅';
      case 'Em Recuperação':
        return '⚠️';
      case 'Reprovado':
        return '❌';
      case 'Sem Notas':
        return '📝';
      default:
        return '📝';
    }
  };

  const getProgressColor = (media) => {
    if (media >= 7.0) return 'bg-green-500';
    if (media >= 5.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handlePontosExtrasChange = async (novosPontos) => {
    const pontos = parseFloat(novosPontos) || 0;
    if (pontos < 0 || pontos > 10) {
      alert('Pontos extras devem estar entre 0 e 10');
      return;
    }
    
    setLoading(true);
    try {
      const disciplinaAtualizada = {
        ...disciplina,
        pontosExtras: pontos,
        pontos_extras: pontos
      };
      
      const response = await axios.post('http://localhost:5001/api/calculate', {
        disciplinas: [disciplinaAtualizada],
        mediaMinima: mediaMinima
      });
      
      if (response.data.disciplinas && response.data.disciplinas.length > 0) {
        const disciplinaRecalculada = response.data.disciplinas[0];
        setPontosExtras(pontos);
        setIsEditingPontos(false);
        if (onUpdate) {
          onUpdate(disciplinaRecalculada);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar pontos extras:', error);
      alert('Erro ao atualizar pontos extras. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const notasExibidas = disciplina.notas || [];
  const mediaParcial = disciplina.mediaParcial || disciplina.media_parcial || 0;
  const notaNecessaria = disciplina.notaNecessaria || disciplina.nota_necessaria;
  const qtdNotas = disciplina.qtdNotas || disciplina.qtd_notas || 0;
  const status = disciplina.status || 'Sem Notas';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {disciplina.nome || 'Disciplina'}
        </h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status)}`}>
          <span className="mr-2">{getStatusIcon(status)}</span>
          {status}
        </div>
      </div>

      {/* Médias Parciais Bimestrais */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Médias Parciais Bimestrais:</h4>
        <div className="grid grid-cols-2 gap-3">
          {["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"].map((label, index) => {
            // Tentar obter valor das médias bimestrais primeiro, depois das notas
            const mediasBimestrais = disciplina.mediasParciaisBimestrais || disciplina.medias_bimestrais || [];
            let valor = null;
            
            // Procurar nas médias bimestrais estruturadas
            if (Array.isArray(mediasBimestrais)) {
              const bimestre = mediasBimestrais.find(b => b.bimestre === label || b.bimestre === label.replace("º", "o"));
              valor = bimestre?.mediaParcial ?? bimestre?.media_parcial;
            } else if (typeof mediasBimestrais === 'object' && mediasBimestrais !== null) {
              // Se for objeto direto
              valor = mediasBimestrais[label] || mediasBimestrais[label.replace("º", "o")];
            }
            
            // Fallback: usar notas se não tiver nas médias bimestrais
            if (valor === null || valor === undefined) {
              if (index < 3) {
                valor = notasExibidas[index];
              }
            }
            
            const temValor = valor !== null && valor !== undefined && !isNaN(valor);
            const labelCurto = label.replace(" Bimestre", "º Bim.");
            
            if (temValor) {
              return (
                <div key={label} className="bg-purple-50 rounded-lg p-2 text-center border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1 font-medium">{labelCurto}</div>
                  <div className="text-lg font-bold text-purple-800">
                    {parseFloat(valor).toFixed(1)}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={label} className="bg-gray-100 rounded-lg p-2 text-center border-2 border-dashed border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">{labelCurto}</div>
                  <div className="text-lg font-bold text-gray-400">-</div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Pontos Extras */}
      <div className="mb-4">
        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
          <span className="text-sm font-medium text-blue-800">Pontos Extras:</span>
          {isEditingPontos ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={pontosExtras}
                onChange={(e) => setPontosExtras(e.target.value)}
                onBlur={(e) => handlePontosExtrasChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePontosExtrasChange(e.target.value);
                  }
                }}
                className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                disabled={loading}
              />
              <button
                onClick={() => {
                  handlePontosExtrasChange(pontosExtras);
                }}
                disabled={loading}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '...' : '✓'}
              </button>
              <button
                onClick={() => {
                  const pontosOriginais = disciplina.pontosExtras || disciplina.pontos_extras || 0;
                  setPontosExtras(pontosOriginais);
                  setIsEditingPontos(false);
                }}
                disabled={loading}
                className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
                title="Cancelar"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-900">
                +{pontosExtras.toFixed(1)}
              </span>
              <button
                onClick={() => setIsEditingPontos(true)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Editar pontos extras"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Faltas */}
      {disciplina.faltas > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
            <span className="text-sm font-medium text-orange-800">Faltas:</span>
            <span className="text-sm font-bold text-orange-900">{disciplina.faltas}</span>
          </div>
        </div>
      )}

      {/* Média Parcial */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Média Parcial:</span>
          <span className="text-xl font-bold text-gray-800">
            {mediaParcial.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(mediaParcial)}`}
            style={{ width: `${Math.min((mediaParcial / 10) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.0</span>
          <span className="font-semibold">Mínima: {mediaMinima.toFixed(1)}</span>
          <span>10.0</span>
        </div>
      </div>

      {/* Nota Necessária na Recuperação */}
      {status === 'Em Recuperação' && notaNecessaria && notaNecessaria <= 10 && (
        <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-2">⚠️</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-yellow-800 mb-1">
                Em Recuperação - Nota necessária para passar:
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {notaNecessaria.toFixed(2)}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Fórmula: (Média Parcial {mediaParcial.toFixed(2)} + Nota Recuperação) ÷ 2 ≥ {mediaMinima.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nota Necessária quando não está em recuperação ainda */}
      {status !== 'Em Recuperação' && notaNecessaria && notaNecessaria <= 10 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-2">🎯</div>
            <div>
              <div className="text-sm font-medium text-blue-800">
                {qtdNotas < 3 
                  ? 'Nota necessária na próxima avaliação para não ficar em recuperação:'
                  : 'Nota necessária para manter aprovação:'
                }
              </div>
              <div className="text-xl font-bold text-blue-900">
                {notaNecessaria.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quando mesmo tirando 10 não passa */}
      {notaNecessaria && notaNecessaria > 10 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800 font-semibold">
            ⚠️ Mesmo tirando 10.0 na recuperação, o aluno não conseguirá passar
          </div>
        </div>
      )}

      {/* Detalhes */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Média Provisória:</span>{' '}
            {disciplina.mediaProvisoria?.toFixed(2) || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Qtd. Notas:</span>{' '}
            {qtdNotas}/3
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisciplinaCard;

