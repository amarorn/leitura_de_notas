import React from 'react';

const PainelGeral = ({ stats }) => {
  const percentualAprovados = stats.total > 0 
    ? ((stats.aprovados / stats.total) * 100).toFixed(1)
    : 0;

  const cards = [
    {
      title: 'Total de Disciplinas',
      value: stats.total,
      icon: '📚',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800'
    },
    {
      title: 'Aprovados',
      value: stats.aprovados,
      icon: '✅',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    {
      title: 'Em Recuperação',
      value: stats.recuperacao,
      icon: '⚠️',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    {
      title: 'Reprovados',
      value: stats.reprovados,
      icon: '❌',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800'
    },
    {
      title: 'Média Geral',
      value: stats.mediaGeral.toFixed(2),
      icon: '📊',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${percentualAprovados}%`,
      icon: '🎯',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">{card.icon}</div>
            <div className={`w-12 h-12 ${card.color} rounded-full opacity-20`}></div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{card.title}</h3>
          <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default PainelGeral;

