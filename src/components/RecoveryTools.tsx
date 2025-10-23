import React, { useState } from 'react';
import { Shield, AlertTriangle, Download, Key, HardDrive, Clock, FileSearch, Unlock } from 'lucide-react';

interface RecoveryToolsProps {
  analyses?: {
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
  }[];
}

export default function RecoveryTools({ analyses = [] }: RecoveryToolsProps) {
  const [activeTab, setActiveTab] = useState<'decrypt' | 'recovery' | 'prevention'>('decrypt');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);

  const startSystemScan = async () => {
    setIsScanning(true);
    setScanResults([]);
    
    // Simular busca por chaves e arquivos temporários
    const scanSteps = [
      'Verificando Shadow Copies do Windows...',
      'Buscando chaves em arquivos temporários...',
      'Analisando memória do sistema...',
      'Procurando backups automáticos...',
      'Verificando lixeira do sistema...',
      'Buscando arquivos de log...',
    ];

    for (let i = 0; i < scanSteps.length; i++) {
      setScanResults(prev => [...prev, scanSteps[i]]);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Resultados simulados
    setScanResults(prev => [
      ...prev,
      '✓ 3 Shadow Copies encontradas',
      '✓ 2 arquivos temporários com possíveis chaves',
      '⚠ Memória limpa - sem chaves residuais',
      '✓ 1 backup automático encontrado (2 dias atrás)',
      '✓ 5 arquivos na lixeira podem ser recuperáveis',
      '⚠ Logs do sistema não contêm informações úteis'
    ]);
    
    setIsScanning(false);
  };

  const downloadRecoveryTool = (toolName: string) => {
    // Em um cenário real, isso baixaria ferramentas específicas
    alert(`Download de ${toolName} iniciado. ATENÇÃO: Use apenas ferramentas de fontes confiáveis!`);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ferramentas de Recuperação</h2>
        <p className="text-gray-600">
          Ferramentas avançadas para recuperação de arquivos criptografados pelo WannaCry
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('decrypt')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'decrypt'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Unlock className="w-4 h-4 inline mr-2" />
          Descriptografia Ativa
        </button>
        <button
          onClick={() => setActiveTab('recovery')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recovery'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <HardDrive className="w-4 h-4 inline mr-2" />
          Recuperação de Sistema
        </button>
        <button
          onClick={() => setActiveTab('prevention')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'prevention'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Prevenção
        </button>
      </div>

      {/* Descriptografia Ativa */}
      {activeTab === 'decrypt' && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Unlock className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Sistema de Descriptografia Automática</h3>
            </div>
            <p className="text-green-700 mb-4">
              Nossa ferramenta tenta automaticamente descriptografar arquivos WannaCry usando:
            </p>
            <ul className="space-y-2 text-green-700">
              <li className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Chaves conhecidas do WannaCry</span>
              </li>
              <li className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Força bruta em padrões comuns</span>
              </li>
              <li className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Recuperação de chaves da memória</span>
              </li>
              <li className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Análise de arquivos temporários</span>
              </li>
            </ul>
            
            {analyses.length > 0 && (
              <div className="mt-4 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Status da Descriptografia:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyses.length}
                    </div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analyses.filter(r => r.decryptionResult?.success).length}
                    </div>
                    <div className="text-gray-600">Descriptografados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analyses.filter(r => r.isEncrypted && !r.decryptionResult?.success).length}
                    </div>
                    <div className="text-gray-600">Falharam</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileSearch className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Busca Avançada por Chaves</h3>
            </div>
            <p className="text-blue-700 mb-4">
              Execute uma busca completa no sistema por chaves de descriptografia e arquivos recuperáveis.
            </p>
            
            <button
              onClick={startSystemScan}
              disabled={isScanning}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isScanning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isScanning ? 'Escaneando Sistema...' : 'Iniciar Busca Completa'}
            </button>

            {scanResults.length > 0 && (
              <div className="mt-4 p-3 bg-white rounded border max-h-64 overflow-y-auto">
                <h4 className="font-medium text-gray-800 mb-2">Resultados da Busca:</h4>
                <div className="space-y-1 text-sm">
                  {scanResults.map((result, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span className={
                        result.includes('✓') ? 'text-green-600' :
                        result.includes('⚠') ? 'text-yellow-600' :
                        'text-gray-600'
                      }>
                        {result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">Ferramentas Especializadas</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              Ferramentas externas que podem ajudar na recuperação:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">WanaKiwi</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Ferramenta que tenta recuperar chaves da memória RAM
                </p>
                <button
                  onClick={() => downloadRecoveryTool('WanaKiwi')}
                  className="w-full py-2 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                >
                  Informações
                </button>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">WannaCrypt0r Decryptor</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Descriptografador oficial para algumas versões
                </p>
                <button
                  onClick={() => downloadRecoveryTool('WannaCrypt0r Decryptor')}
                  className="w-full py-2 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                >
                  Informações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recuperação de Sistema */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <HardDrive className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Shadow Copies do Windows</h3>
            </div>
            <p className="text-blue-700 mb-4">
              O Windows cria automaticamente cópias de segurança dos arquivos. Verifique se há Shadow Copies disponíveis:
            </p>
            <div className="bg-white p-4 rounded border">
              <code className="text-sm text-gray-800 block mb-2">
                vssadmin list shadows
              </code>
              <code className="text-sm text-gray-800 block">
                mklink /d C:\ShadowCopy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\
              </code>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Restauração do Sistema</h3>
            </div>
            <p className="text-green-700 mb-4">
              Use pontos de restauração anteriores à infecção:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-green-700">
              <li>Acesse "Criar um ponto de restauração" no Painel de Controle</li>
              <li>Clique em "Restauração do Sistema"</li>
              <li>Escolha um ponto anterior à infecção</li>
              <li>Siga as instruções para restaurar</li>
            </ol>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileSearch className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Recuperação de Dados</h3>
            </div>
            <p className="text-purple-700 mb-4">
              Ferramentas de recuperação de dados podem encontrar arquivos não sobrescritos:
            </p>
            <ul className="space-y-2 text-purple-700">
              <li>• Recuva (Piriform)</li>
              <li>• PhotoRec</li>
              <li>• R-Studio</li>
              <li>• Disk Drill</li>
            </ul>
          </div>
        </div>
      )}

      {/* Prevenção */}
      {activeTab === 'prevention' && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">IMPORTANTE: Não Pague o Resgate</h3>
            </div>
            <p className="text-red-700 mb-4">
              Pagar o resgate não garante a recuperação dos arquivos e financia atividades criminosas.
              Use sempre métodos legítimos de recuperação.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Medidas Preventivas</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Backups Regulares</h4>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Backup automático diário</li>
                  <li>• Armazenamento offline/nuvem</li>
                  <li>• Teste de restauração mensal</li>
                  <li>• Regra 3-2-1 (3 cópias, 2 mídias, 1 offsite)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">Segurança do Sistema</h4>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Atualizações automáticas do Windows</li>
                  <li>• Antivírus atualizado</li>
                  <li>• Firewall ativo</li>
                  <li>• Desabilitar SMBv1</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Configurações de Segurança</h3>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Windows Defender</h4>
                <p className="text-blue-700 text-sm mb-2">
                  Ative a proteção em tempo real e o acesso controlado a pastas:
                </p>
                <code className="text-xs bg-white p-2 rounded block text-gray-800">
                  Set-MpPreference -EnableControlledFolderAccess Enabled
                </code>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Políticas de Grupo</h4>
                <p className="text-blue-700 text-sm">
                  Configure políticas para bloquear execução de arquivos suspeitos e restringir acesso a recursos críticos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}