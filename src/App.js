import React, { useState } from 'react';
import RansomwareAnalyzer from './components/RansomwareAnalyzer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🔒 WantToCry Analyzer</h1>
        <p>Ferramenta de Análise para Arquivos Criptografados</p>
      </header>
      <main className="App-main">
        <RansomwareAnalyzer />
      </main>
      <footer className="App-footer">
        <p>⚠️ Esta ferramenta é apenas para análise educacional e forense</p>
      </footer>
    </div>
  );
}

export default App;