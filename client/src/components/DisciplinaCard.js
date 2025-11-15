import React from 'react';

const DisciplinaCard = ({ disciplina }) => {
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

  const notasExibidas = disciplina.notas || [];
  const mediaParcial = disciplina.mediaParcial || 0;
  const mediaMinima = disciplina.mediaMinima || 7.0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {disciplina.nome || 'Disciplina'}
        </h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(disciplina.status)}`}>
          <span className="mr-2">{getStatusIcon(disciplina.status)}</span>
          {disciplina.status}
        </div>
      </div>

      {/* Notas */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Notas:</h4>
        <div className="flex gap-3">
          {[0, 1, 2].map((index) => {
            const nota = notasExibidas[index];
            const temNota = nota !== null && nota !== undefined && !isNaN(nota);
            
            if (temNota) {
              return (
                <div key={index} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500 mb-1">{index + 1}ª AV</div>
                  <div className="text-lg font-bold text-gray-800">
                    {nota.toFixed(1)}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={index} className="flex-1 bg-gray-100 rounded-lg p-2 text-center border-2 border-dashed border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">{index + 1}ª AV</div>
                  <div className="text-lg font-bold text-gray-400">-</div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Pontos Extras */}
      {disciplina.pontosExtras > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
            <span className="text-sm font-medium text-blue-800">Pontos Extras:</span>
            <span className="text-sm font-bold text-blue-900">+{disciplina.pontosExtras.toFixed(1)}</span>
          </div>
        </div>
      )}

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

      {/* Nota Necessária */}
      {disciplina.notaNecessaria && disciplina.notaNecessaria <= 10 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-2">🎯</div>
            <div>
              <div className="text-sm font-medium text-blue-800">
                Nota necessária na próxima prova:
              </div>
              <div className="text-xl font-bold text-blue-900">
                {disciplina.notaNecessaria.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {disciplina.notaNecessaria && disciplina.notaNecessaria > 10 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            ⚠️ Mesmo tirando 10.0, o aluno ficará em recuperação
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
            {disciplina.qtdNotas || 0}/3
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisciplinaCard;

