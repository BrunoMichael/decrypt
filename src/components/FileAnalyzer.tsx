import React, { useState, useEffect } from 'react';
import { Search, FileText, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import CryptoJS from 'crypto-js';

interface FileAnalysis {
  fileName: string;
  fileSize: number;
  isEncrypted: boolean;
  encryptionType: string;
  originalExtension?: string;
  analysisDate: Date;
  recoveryPossible: boolean;
  notes: string[];
}

interface FileAnalyzerProps {
  files: File[];
  onAnalysisComplete: (analyses: FileAnalysis[]) => void;
}

const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ files, onAnalysisComplete }) => {
  const [analyses, setAnalyses] = useState<FileAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');

  const analyzeFile = async (file: File): Promise<FileAnalysis> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Análise básica do arquivo
        const analysis: FileAnalysis = {
          fileName: file.name,
          fileSize: file.size,
          isEncrypted: true,
          encryptionType: 'WannaCry Ransomware',
          analysisDate: new Date(),
          recoveryPossible: false,
          notes: []
        };

        // Detectar extensão original
        if (file.name.includes('.want_to_cry')) {
          const originalName = file.name.replace('.want_to_cry', '');
          const lastDot = originalName.lastIndexOf('.');
          if (lastDot > 0) {
            analysis.originalExtension = originalName.substring(lastDot);
          }
        }

        // Análise de cabeçalho do arquivo
        const header = Array.from(uint8Array.slice(0, 16))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Verificar assinaturas conhecidas do WannaCry
        if (header.includes('57616e6e61437279') || // "WannaCry" em hex
            uint8Array[0] === 0x57 && uint8Array[1] === 0x4e && uint8Array[2] === 0x43) {
          analysis.notes.push('Assinatura WannaCry detectada no cabeçalho');
          analysis.encryptionType = 'WannaCry v2.0';
        }

        // Verificar se há padrões de criptografia AES
        const entropy = calculateEntropy(uint8Array.slice(0, 1024));
        if (entropy > 7.5) {
          analysis.notes.push(`Alta entropia detectada (${entropy.toFixed(2)}) - indica criptografia forte`);
        }

        // Verificar tamanho do arquivo
        if (file.size > 0) {
          analysis.notes.push(`Arquivo de ${formatFileSize(file.size)}`);
          
          // Arquivos muito pequenos podem ter chance de recuperação
          if (file.size < 1024) {
            analysis.recoveryPossible = true;
            analysis.notes.push('Arquivo pequeno - possível recuperação por força bruta');
          }
        }

        // Verificar se há backup shadow copies
        analysis.notes.push('Verificar Shadow Copies do Windows para possível recuperação');
        analysis.notes.push('Considerar ferramentas de recuperação de dados especializadas');

        resolve(analysis);
      };

      reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, 10240))); // Ler primeiros 10KB
    });
  };

  const calculateEntropy = (data: Uint8Array): number => {
    const frequency: { [key: number]: number } = {};
    
    for (let i = 0; i < data.length; i++) {
      frequency[data[i]] = (frequency[data[i]] || 0) + 1;
    }

    let entropy = 0;
    const length = data.length;

    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startAnalysis = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    const results: FileAnalysis[] = [];

    for (const file of files) {
      setCurrentFile(file.name);
      const analysis = await analyzeFile(file);
      results.push(analysis);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setAnalyses(results);
    setIsAnalyzing(false);
    setCurrentFile('');
    onAnalysisComplete(results);
  };

  useEffect(() => {
    if (files.length > 0) {
      startAnalysis();
    }
  }, [files]);

  const exportAnalysis = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: analyses.length,
      analyses: analyses
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wannacry-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {isAnalyzing && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <Search className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-primary-800">Analisando arquivos...</p>
              {currentFile && (
                <p className="text-sm text-primary-600">Processando: {currentFile}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {analyses.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Relatório de Análise ({analyses.length} arquivos)
            </h3>
            <button
              onClick={exportAnalysis}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Relatório</span>
            </button>
          </div>

          <div className="grid gap-4">
            {analyses.map((analysis, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-danger-500" />
                    <div>
                      <h4 className="font-medium text-gray-800">{analysis.fileName}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(analysis.fileSize)} • {analysis.encryptionType}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {analysis.recoveryPossible ? (
                      <div className="flex items-center space-x-1 text-success-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Recuperação Possível</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-danger-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Recuperação Difícil</span>
                      </div>
                    )}
                  </div>
                </div>

                {analysis.originalExtension && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      Extensão Original: {analysis.originalExtension}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="font-medium text-gray-700">Notas da Análise:</h5>
                  <ul className="space-y-1">
                    {analysis.notes.map((note, noteIndex) => (
                      <li key={noteIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Analisado em: {analysis.analysisDate.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileAnalyzer;