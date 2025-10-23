import React, { useState, useRef } from 'react';
import FileAnalysis from '../utils/FileAnalysis';

const RansomwareAnalyzer = () => {
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState({ encrypted: false, original: false });
  
  const encryptedFileRef = useRef();
  const originalFileRef = useRef();

  const handleFileSelect = (file, type) => {
    if (type === 'encrypted') {
      setEncryptedFile(file);
    } else {
      setOriginalFile(file);
    }
    setAnalysisResult(null);
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  const analyzeFiles = async () => {
    if (!encryptedFile) {
      alert('Por favor, selecione pelo menos o arquivo criptografado.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const analysis = new FileAnalysis();
      const result = await analysis.analyzeRansomware(encryptedFile, originalFile);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setAnalysisResult(result);
        setIsAnalyzing(false);
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Erro na análise:', error);
      setAnalysisResult({
        error: true,
        message: 'Erro durante a análise: ' + error.message
      });
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const clearFiles = () => {
    setEncryptedFile(null);
    setOriginalFile(null);
    setAnalysisResult(null);
    setProgress(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card" style={{ maxWidth: '800px', width: '100%' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#74b9ff' }}>
        🔍 Análise de Ransomware WantToCry
      </h2>

      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Upload do arquivo criptografado */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#ff6b6b' }}>
            📁 Arquivo Criptografado (Obrigatório)
          </h3>
          <div
            className={`file-upload-area ${dragOver.encrypted ? 'dragover' : ''}`}
            onClick={() => encryptedFileRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, 'encrypted')}
            onDragLeave={(e) => handleDragLeave(e, 'encrypted')}
            onDrop={(e) => handleDrop(e, 'encrypted')}
          >
            <input
              ref={encryptedFileRef}
              type="file"
              className="input-file"
              onChange={(e) => handleFileSelect(e.target.files[0], 'encrypted')}
              accept="*"
            />
            {encryptedFile ? (
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#00b894' }}>
                  ✅ {encryptedFile.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                  Tamanho: {formatFileSize(encryptedFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  🔒 Clique ou arraste o arquivo criptografado aqui
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                  Exemplo: DOC CINTIA.pdf.want_to_cry
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload do arquivo original */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#74b9ff' }}>
            📄 Arquivo Original (Opcional - para comparação)
          </h3>
          <div
            className={`file-upload-area ${dragOver.original ? 'dragover' : ''}`}
            onClick={() => originalFileRef.current?.click()}
            onDragOver={(e) => handleDragOver(e, 'original')}
            onDragLeave={(e) => handleDragLeave(e, 'original')}
            onDrop={(e) => handleDrop(e, 'original')}
          >
            <input
              ref={originalFileRef}
              type="file"
              className="input-file"
              onChange={(e) => handleFileSelect(e.target.files[0], 'original')}
              accept="*"
            />
            {originalFile ? (
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#00b894' }}>
                  ✅ {originalFile.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                  Tamanho: {formatFileSize(originalFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  📄 Clique ou arraste o arquivo original aqui
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                  Para análise comparativa (se disponível)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          className="btn"
          onClick={analyzeFiles}
          disabled={!encryptedFile || isAnalyzing}
        >
          {isAnalyzing ? '🔄 Analisando...' : '🔍 Analisar Arquivos'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={clearFiles}
          disabled={isAnalyzing}
        >
          🗑️ Limpar
        </button>
      </div>

      {/* Barra de progresso */}
      {isAnalyzing && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Resultados da análise */}
      {analysisResult && (
        <div className={`analysis-result ${analysisResult.error ? 'error' : ''}`}>
          {analysisResult.error ? (
            <div>
              <h3>❌ Erro na Análise</h3>
              <p>{analysisResult.message}</p>
            </div>
          ) : (
            <div>
              <h3>📊 Resultados da Análise</h3>
              
              {/* Informações básicas */}
              <div className="info-grid">
                <div className="info-item">
                  <h4>Tipo de Ransomware</h4>
                  <p>{analysisResult.ransomwareType}</p>
                </div>
                <div className="info-item">
                  <h4>Extensão Detectada</h4>
                  <p>{analysisResult.extension}</p>
                </div>
                <div className="info-item">
                  <h4>Tamanho do Arquivo</h4>
                  <p>{formatFileSize(analysisResult.fileSize)}</p>
                </div>
                <div className="info-item">
                  <h4>Entropia</h4>
                  <p>{analysisResult.entropy?.toFixed(4) || 'N/A'}</p>
                </div>
              </div>

              {/* Assinatura de cabeçalho */}
              {analysisResult.headerSignature && (
                <div className="info-item" style={{ marginTop: '1rem' }}>
                  <h4>Assinatura do Cabeçalho (primeiros 32 bytes)</h4>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {analysisResult.headerSignature}
                  </p>
                </div>
              )}

              {/* Padrões encontrados */}
              {analysisResult.patterns && analysisResult.patterns.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#fdcb6e' }}>🔍 Padrões Detectados</h4>
                  <ul style={{ marginLeft: '1rem' }}>
                    {analysisResult.patterns.map((pattern, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comparação com arquivo original */}
              {analysisResult.comparison && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#00b894' }}>📈 Análise Comparativa</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <h4>Diferença de Tamanho</h4>
                      <p>{analysisResult.comparison.sizeDifference}</p>
                    </div>
                    <div className="info-item">
                      <h4>Algoritmo Provável</h4>
                      <p>{analysisResult.comparison.likelyAlgorithm}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {analysisResult.recommendations && (
                <div className="analysis-result warning" style={{ marginTop: '1rem' }}>
                  <h4>💡 Recomendações</h4>
                  <ul style={{ marginLeft: '1rem' }}>
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Informações sobre o WantToCry */}
      <div className="analysis-result warning" style={{ marginTop: '2rem' }}>
        <h4>⚠️ Informações sobre o WantToCry</h4>
        <p><strong>ID Tox detectado:</strong> 1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6</p>
        <p><strong>ID único:</strong> 3C579D75CF2341758A9B984A0B943F18</p>
        <p><strong>Valor do resgate:</strong> 600 USD em Bitcoin</p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
          <strong>Aviso:</strong> Esta ferramenta é apenas para análise forense e educacional. 
          Não recomendamos o pagamento de resgates a criminosos.
        </p>
      </div>
    </div>
  );
};

export default RansomwareAnalyzer;