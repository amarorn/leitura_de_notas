import React, { useState } from 'react';

const MediaConfig = ({ mediaMinima, onMediaChange, loading }) => {
  const [localMedia, setLocalMedia] = useState(mediaMinima);
  const [showInput, setShowInput] = useState(false);

  const handleApply = () => {
    onMediaChange(parseFloat(localMedia));
    setShowInput(false);
  };

  const presets = [6.0, 6.5, 7.0, 7.5, 8.0];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Média Mínima da Instituição
          </h3>
          <p className="text-sm text-gray-600">
            Atual: <span className="font-bold text-blue-600">{mediaMinima.toFixed(1)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => onMediaChange(preset)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mediaMinima === preset
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.toFixed(1)}
            </button>
          ))}

          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Customizar
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={localMedia}
                onChange={(e) => setLocalMedia(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="7.0"
              />
              <button
                onClick={handleApply}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Aplicar
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setLocalMedia(mediaMinima);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Recalculando...</span>
        </div>
      )}
    </div>
  );
};

export default MediaConfig;

