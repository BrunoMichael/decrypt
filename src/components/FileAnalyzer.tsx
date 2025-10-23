import React, { useState, useCallback, useEffect } from 'react';
import { FileText, AlertTriangle, Shield, Download, CheckCircle, XCircle, Info, Unlock, Key } from 'lucide-react';
import { WannaCryDecryptor, DecryptionResult } from '../utils/decryption';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface AnalysisResult {
  fileName: string;
  fileSize: number;
  isEncrypted: boolean;
  ransomwareType: string;
  entropy: number;
  originalExtension: string;
  recoveryMethods: string[];
  riskLevel: 'low' | 'medium' | 'high';
  analysisDate: string;
  decryptionResult?: DecryptionResult;
  decryptedFile?: Uint8Array;
}

interface FileAnalyzerProps {
  files: File[];
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

export default function FileAnalyzer({ files, onAnalysisComplete }: FileAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [decrypting, setDecrypting] = useState(false);

  const analyzeAndDecryptFile = useCallback(async (file: File): Promise<AnalysisResult> => {
    const fileData = new Uint8Array(await file.arrayBuffer());
    
    // Análise básica
    const entropy = calculateEntropy(fileData);
    const isEncrypted = entropy > 7.5 || isWannaCryFile(file.name, fileData);
    const ransomwareType = detectRansomwareType(file.name, fileData);
    
    let result: AnalysisResult = {
      fileName: file.name,
      fileSize: file.size,
      isEncrypted,
      ransomwareType,
      entropy,
      originalExtension: extractOriginalExtension(file.name),
      recoveryMethods: getRecoveryMethods(ransomwareType),
      riskLevel: entropy > 7.8 ? 'high' : entropy > 7.0 ? 'medium' : 'low',
      analysisDate: new Date().toISOString(),
    };

    // Tentar descriptografia se for WannaCry
    if (isEncrypted && ransomwareType === 'WannaCry') {
      try {
        const decryptionResult = await WannaCryDecryptor.decryptFile(fileData, file.name);
        result.decryptionResult = decryptionResult;
        
        if (decryptionResult.success && decryptionResult.decryptedData) {
          result.decryptedFile = decryptionResult.decryptedData;
          result.recoveryMethods = ['Descriptografia bem-sucedida!'];
          result.riskLevel = 'low';
        }
      } catch (error) {
        result.decryptionResult = {
          success: false,
          error: `Erro na descriptografia: ${error}`
        };
      }
    }

    return result;
  }, []);

  const startAnalysis = useCallback(async () => {
    if (files.length === 0) return;

    setAnalyzing(true);
    setDecrypting(true);
    setResults([]);
    setProgress(0);

    const analysisResults: AnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      
      try {
        const result = await analyzeAndDecryptFile(file);
        analysisResults.push(result);
      } catch (error) {
        analysisResults.push({
          fileName: file.name,
          fileSize: file.size,
          isEncrypted: false,
          ransomwareType: 'Erro na análise',
          entropy: 0,
          originalExtension: '',
          recoveryMethods: [`Erro: ${error}`],
          riskLevel: 'high',
          analysisDate: new Date().toISOString(),
          decryptionResult: {
            success: false,
            error: `Erro na análise: ${error}`
          }
        });
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setResults(analysisResults);
    setAnalyzing(false);
    setDecrypting(false);
    setCurrentFile('');
    onAnalysisComplete(analysisResults);
  }, [files, analyzeAndDecryptFile, onAnalysisComplete]);

  const downloadDecryptedFile = (result: AnalysisResult) => {
    if (result.decryptedFile) {
      const blob = new Blob([result.decryptedFile], { type: 'application/octet-stream' });
      const originalName = result.fileName.replace(/\.wncry$|\.wcry$|\.locked$/i, '');
      saveAs(blob, `decrypted_${originalName}`);
      
      // Notificar sucesso
      alert(`Arquivo ${originalName} descriptografado e baixado com sucesso!`);
    }
  };

  const downloadAllDecrypted = async () => {
    const decryptedFiles = results.filter(r => r.decryptedFile);
    if (decryptedFiles.length === 0) {
      alert('Nenhum arquivo descriptografado disponível para download.');
      return;
    }

    try {
      const zip = new JSZip();
      decryptedFiles.forEach((result, index) => {
        const originalName = result.fileName.replace(/\.wncry$|\.wcry$|\.locked$/i, '');
        zip.file(`decrypted_${originalName}`, result.decryptedFile!);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `decrypted_files_${new Date().toISOString().split('T')[0]}.zip`);
      
      // Notificar sucesso
      alert(`${decryptedFiles.length} arquivos descriptografados baixados em um ZIP!`);
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      alert('Erro ao criar arquivo ZIP. Tente baixar os arquivos individualmente.');
    }
  };

  const autoDownloadDecrypted = (result: AnalysisResult) => {
    // Download automático após descriptografia bem-sucedida
    if (result.decryptionResult?.success && result.decryptedFile) {
      setTimeout(() => {
        downloadDecryptedFile(result);
      }, 1000); // Pequeno delay para melhor UX
    }
  };

  const downloadDecryptedFiles = async () => {
    const decryptedFiles = results.filter(r => r.decryptedFile);
    
    if (decryptedFiles.length === 0) {
      alert('Nenhum arquivo foi descriptografado com sucesso.');
      return;
    }

    if (decryptedFiles.length === 1) {
      // Download único
      const file = decryptedFiles[0];
      const originalName = file.decryptionResult?.originalName || 
                          file.originalExtension || 
                          file.fileName.replace(/\.(wncry|wcry|want_to_cry|wncryt)$/, '');
      
      const blob = new Blob([file.decryptedFile!]);
      saveAs(blob, originalName);
    } else {
      // Download múltiplo em ZIP
      const zip = new JSZip();
      
      decryptedFiles.forEach((file, index) => {
        const originalName = file.decryptionResult?.originalName || 
                            file.originalExtension || 
                            `arquivo_${index + 1}_descriptografado`;
        zip.file(originalName, file.decryptedFile!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'arquivos_descriptografados.zip');
    }
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: results.length,
      encryptedFiles: results.filter(r => r.isEncrypted).length,
      decryptedFiles: results.filter(r => r.decryptionResult?.success).length,
      results: results.map(r => ({
        ...r,
        decryptedFile: undefined // Não incluir dados binários no relatório
      })),
      decryptionReport: WannaCryDecryptor.generateDecryptionReport(
        results.map(r => r.decryptionResult).filter(Boolean) as DecryptionResult[]
      )
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    saveAs(blob, `relatorio_descriptografia_${new Date().toISOString().split('T')[0]}.json`);
  };

  const isWannaCryFile = (fileName: string, data: Uint8Array): boolean => {
    // Verificar extensões conhecidas do WannaCry
    const wannaCryExtensions = ['.wncry', '.wcry', '.want_to_cry', '.wncryt'];
    const hasWannaCryExtension = wannaCryExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    
    // Verificar assinaturas no cabeçalho
    const header = Array.from(data.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const hasWannaCrySignature = header.includes('57616e6e61437279') || // "WannaCry" em hex
                                (data[0] === 0x57 && data[1] === 0x4e && data[2] === 0x43);
    
    return hasWannaCryExtension || hasWannaCrySignature;
  };

  const detectRansomwareType = (fileName: string, data: Uint8Array): string => {
    if (isWannaCryFile(fileName, data)) {
      return 'WannaCry';
    }
    
    // Outros tipos de ransomware podem ser detectados aqui
    const entropy = calculateEntropy(data.slice(0, 1024));
    if (entropy > 7.5) {
      return 'Ransomware Desconhecido';
    }
    
    return 'Não Detectado';
  };

  const extractOriginalExtension = (fileName: string): string => {
    const wannaCryExtensions = ['.wncry', '.wcry', '.want_to_cry', '.wncryt'];
    
    for (const ext of wannaCryExtensions) {
      if (fileName.toLowerCase().endsWith(ext)) {
        const originalName = fileName.slice(0, -ext.length);
        const lastDot = originalName.lastIndexOf('.');
        return lastDot > 0 ? originalName.substring(lastDot) : '';
      }
    }
    
    return '';
  };

  const getRecoveryMethods = (ransomwareType: string): string[] => {
    const methods = [];
    
    if (ransomwareType === 'WannaCry') {
      methods.push('Tentativa de descriptografia automática');
      methods.push('Verificar Shadow Copies do Windows');
      methods.push('Usar ferramentas especializadas (WanaKiwi, WannaCrypt0r)');
    }
    
    methods.push('Restaurar backup mais recente');
    methods.push('Ferramentas de recuperação de dados');
    
    return methods;
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



  useEffect(() => {
    if (files.length > 0) {
      const processFiles = async () => {
        const newResults: AnalysisResult[] = [];
        
        for (const file of files) {
          const result = await analyzeAndDecryptFile(file);
          newResults.push(result);
          
          // Download automático se descriptografado com sucesso
          autoDownloadDecrypted(result);
        }
        
        setResults(newResults);
        onAnalysisComplete?.(newResults);
      };
      
      processFiles();
    }
  }, [files, analyzeAndDecryptFile, onAnalysisComplete]);



  return (
    <div className="w-full">
      {analyzing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-800">
                {decrypting ? 'Analisando e descriptografando arquivos...' : 'Analisando arquivos...'}
              </p>
              {currentFile && (
                <p className="text-sm text-blue-600">Processando: {currentFile}</p>
              )}
              <div className="mt-2 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">{Math.round(progress)}% concluído</p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Relatório de Análise ({results.length} arquivos)
              </h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{results.filter(r => r.isEncrypted).length} criptografados</span>
                </span>
                <span className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{results.filter(r => r.decryptionResult?.success).length} descriptografados</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Relatório</span>
              </button>
              
              {results.some(r => r.decryptedFile) && (
                <button
                  onClick={downloadAllDecrypted}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Todos Descriptografados</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <FileText className={`w-8 h-8 ${
                        result.decryptionResult?.success ? 'text-green-500' : 
                        result.isEncrypted ? 'text-red-500' : 'text-gray-500'
                      }`} />
                      {result.decryptionResult?.success && (
                        <Unlock className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{result.fileName}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(result.fileSize)} • {result.ransomwareType}
                      </p>
                      {result.originalExtension && (
                        <p className="text-xs text-gray-400">
                          Extensão original: {result.originalExtension}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      result.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Risco {result.riskLevel === 'high' ? 'Alto' : result.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                </div>

                {result.decryptionResult && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    result.decryptionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {result.decryptionResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        result.decryptionResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.decryptionResult.success ? 'Descriptografia Bem-sucedida!' : 'Falha na Descriptografia'}
                      </span>
                    </div>
                    {result.decryptionResult.originalName && (
                      <p className="text-sm text-green-700">
                        Nome original: {result.decryptionResult.originalName}
                      </p>
                    )}
                    {result.decryptionResult.error && (
                      <p className="text-sm text-red-700">
                        Erro: {result.decryptionResult.error}
                      </p>
                    )}
                    {result.decryptionResult.method && (
                      <p className="text-sm text-gray-600">
                        Método: {result.decryptionResult.method}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1">
                      <Info className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Entropia: {result.entropy.toFixed(2)}</span>
                    </span>
                    {result.isEncrypted && (
                      <span className="flex items-center space-x-1">
                        <Key className="w-4 h-4 text-red-400" />
                        <span className="text-red-600">Criptografado</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Métodos de Recuperação:</h5>
                    <ul className="space-y-1">
                      {result.recoveryMethods.map((method, methodIndex) => (
                        <li key={methodIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{method}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Analisado em: {new Date(result.analysisDate).toLocaleString('pt-BR')}</span>
                    </div>
                    
                    {result.decryptedFile && (
                      <button
                        onClick={() => downloadDecryptedFile(result)}
                        className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar Descriptografado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}