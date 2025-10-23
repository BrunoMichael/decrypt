import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, Settings } from 'lucide-react';
import FileUpload from './components/FileUpload';
import FileAnalyzer from './components/FileAnalyzer';
import RecoveryTools from './components/RecoveryTools';

interface FileAnalysis {
  fileName: string;
  fileSize: number;
  isEncrypted: boolean;
  ransomwareType: string;
  entropy: number;
  originalExtension: string;
  recoveryMethods: string[];
  riskLevel: 'low' | 'medium' | 'high';
  analysisDate: string;
  decryptionResult?: {
    success: boolean;
    method?: string;
    originalName?: string;
    error?: string;
  };
  decryptedFile?: Uint8Array;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<FileAnalysis[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'recovery'>('upload');

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length > 0) {
      setCurrentStep('analysis');
    }
  };

  const handleAnalysisComplete = (analysisResults: FileAnalysis[]) => {
    setAnalyses(analysisResults);
    setCurrentStep('recovery');
  };

  const resetApplication = () => {
    setSelectedFiles([]);
    setAnalyses([]);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WannaCry Recovery Tool</h1>
                <p className="text-sm text-gray-500">Ferramenta de Análise e Recuperação</p>
              </div>
            </div>
            
            <button
              onClick={resetApplication}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-danger-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">
              <strong>AVISO:</strong> Esta ferramenta é para fins educacionais e de análise. 
              NÃO pague resgate aos criminosos. Procure ajuda profissional especializada.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-8">
            <div className={`flex items-center space-x-2 ${
              currentStep === 'upload' ? 'text-primary-600' : 
              analyses.length > 0 ? 'text-success-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'upload' ? 'bg-primary-100 text-primary-600' :
                analyses.length > 0 ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="font-medium">Upload de Arquivos</span>
            </div>

            <div className={`flex items-center space-x-2 ${
              currentStep === 'analysis' ? 'text-primary-600' :
              analyses.length > 0 ? 'text-success-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'analysis' ? 'bg-primary-100 text-primary-600' :
                analyses.length > 0 ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="font-medium">Análise</span>
            </div>

            <div className={`flex items-center space-x-2 ${
              currentStep === 'recovery' ? 'text-primary-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'recovery' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <span className="font-medium">Recuperação</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Selecione os Arquivos Criptografados
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Faça upload dos arquivos afetados pelo ransomware WannaCry para análise. 
                A ferramenta irá examinar os arquivos e fornecer informações sobre possíveis métodos de recuperação.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <FileUpload onFilesSelected={handleFilesSelected} />
            </div>

            {selectedFiles.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-primary-800 text-center">
                    {selectedFiles.length} arquivo(s) selecionado(s). A análise será iniciada automaticamente.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Análise dos Arquivos
              </h2>
              <p className="text-gray-600">
                Analisando os arquivos criptografados para determinar o tipo de criptografia e possíveis métodos de recuperação.
              </p>
            </div>

            <FileAnalyzer 
              files={selectedFiles} 
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        )}

        {currentStep === 'recovery' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Opções de Recuperação
              </h2>
              <p className="text-gray-600">
                Com base na análise, aqui estão as opções disponíveis para tentar recuperar seus arquivos.
              </p>
            </div>

            <RecoveryTools analyses={analyses} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Esta ferramenta foi desenvolvida para fins educacionais e de pesquisa em segurança cibernética.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Para casos reais de ransomware, procure sempre ajuda de profissionais especializados em segurança digital.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;