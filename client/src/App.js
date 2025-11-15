import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [dadosBoletim, setDadosBoletim] = useState(null);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Routes>
          <Route 
            path="/" 
            element={<UploadPage setDadosBoletim={setDadosBoletim} />} 
          />
          <Route 
            path="/dashboard" 
            element={<Dashboard dadosBoletim={dadosBoletim} setDadosBoletim={setDadosBoletim} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

