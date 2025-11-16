import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const UploadPage = ({ setDadosBoletim }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validar tamanho do arquivo
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande! Tamanho máximo: 10MB');
      return;
    }

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Tipo de arquivo inválido! Use apenas imagens (JPG, PNG, GIF, WEBP)');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('boletim', file);

    try {
      console.log('Enviando arquivo:', file.name, file.size, 'bytes');
      
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutos de timeout (OCR pode demorar)
      });

      console.log('Resposta recebida:', response.data);
      
      if (response.data.success && response.data.dados) {
        setDadosBoletim(response.data.dados);
        navigate('/dashboard');
      } else {
        setError('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      
      let errorMessage = 'Erro ao processar a imagem.';
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage = 'Erro de conexão! Verifique se o servidor backend está rodando na porta 5001.';
      } else if (err.response) {
        // Erro da API
        errorMessage = err.response.data?.error || `Erro ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        // Requisição feita mas sem resposta
        errorMessage = 'Servidor não respondeu. Verifique se o backend está rodando.';
      } else {
        // Erro na configuração da requisição
        errorMessage = err.message || 'Erro desconhecido ao fazer upload.';
      }
      
      setError(errorMessage);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [navigate, setDadosBoletim]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.find(e => e.code === 'file-too-large')) {
          setError('Arquivo muito grande! Tamanho máximo: 10MB');
        } else if (rejection.errors.find(e => e.code === 'file-invalid-type')) {
          setError('Tipo de arquivo inválido! Use apenas imagens (JPG, PNG, GIF, WEBP)');
        } else {
          setError('Erro ao selecionar arquivo. Verifique o tipo e tamanho.');
        }
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            📊 Sistema de Análise de Boletim
          </h1>
          <p className="text-xl text-gray-600">
            Faça upload da foto do seu boletim e veja análises detalhadas
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} disabled={loading} />
          
          {preview ? (
            <div className="space-y-4">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded-lg shadow-lg"
              />
              {loading && (
                <div className="mt-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Processando imagem...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              
              {loading ? (
                <div>
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Processando imagem...</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-2xl font-semibold text-gray-700 mb-2">
                      {isDragActive ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                    </p>
                    <p className="text-gray-500">
                      Suporte para JPEG, PNG, GIF, WEBP (máx. 10MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 font-medium mb-1">Erro no upload</p>
                <p className="text-red-700 text-sm">{error}</p>
                {error.includes('backend') || error.includes('servidor') ? (
                  <div className="mt-3 text-xs text-red-600">
                    <p className="font-semibold mb-1">Verifique:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>O servidor backend está rodando? Execute: <code className="bg-red-100 px-1 rounded">cd server && npm run dev</code></li>
                      <li>A porta 5001 está livre?</li>
                      <li>Verifique o console do terminal do backend para mais detalhes</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-3xl mb-2">📷</div>
            <h3 className="font-semibold text-gray-800 mb-1">Upload Simples</h3>
            <p className="text-sm text-gray-600">Faça upload da foto do boletim</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-1">OCR Automático</h3>
            <p className="text-sm text-gray-600">Extração automática dos dados</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 mb-1">Análise Completa</h3>
            <p className="text-sm text-gray-600">Cálculos e projeções detalhadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;

