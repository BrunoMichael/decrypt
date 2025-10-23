import React, { useState } from 'react';
import { Shield, Download, ExternalLink, AlertTriangle, Info, MessageCircle, Key, HardDrive } from 'lucide-react';

interface RecoveryToolsProps {
  analyses: any[];
}

const RecoveryTools: React.FC<RecoveryToolsProps> = ({ analyses }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'communication' | 'prevention'>('tools');

  const recoveryMethods = [
    {
      title: 'Shadow Volume Copies',
      description: 'Verificar cópias de sombra do Windows que podem não ter sido afetadas',
      command: 'vssadmin list shadows',
      risk: 'low',
      effectiveness: 'medium'
    },
    {
      title: 'Recuperação de Dados',
      description: 'Usar ferramentas especializadas para recuperar versões anteriores',
      tools: ['Recuva', 'PhotoRec', 'TestDisk'],
      risk: 'low',
      effectiveness: 'medium'
    },
    {
      title: 'Backup Restoration',
      description: 'Restaurar a partir de backups externos não conectados durante o ataque',
      risk: 'low',
      effectiveness: 'high'
    }
  ];

  const communicationInfo = {
    toxId: '1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6',
    uniqueId: '3C579D75CF2341758A9B984A0B943F18',
    qtoxUrl: 'https://qtox.github.io/',
    bitcoinWallet: 'Será fornecido após contato inicial'
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Ferramentas de Recuperação
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'communication'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Comunicação Segura
          </button>
          <button
            onClick={() => setActiveTab('prevention')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'prevention'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Prevenção
          </button>
        </div>
      </div>

      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-warning-500" />
              <h3 className="text-lg font-semibold text-gray-800">Aviso Importante</h3>
            </div>
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <p className="text-warning-800">
                <strong>NÃO PAGUE O RESGATE!</strong> Não há garantia de que os criminosos fornecerão a chave de descriptografia, 
                e o pagamento financia atividades criminosas. Tente primeiro os métodos de recuperação alternativos.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {recoveryMethods.map((method, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{method.title}</h4>
                    <p className="text-gray-600">{method.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      method.risk === 'low' ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
                    }`}>
                      Risco: {method.risk === 'low' ? 'Baixo' : 'Médio'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      method.effectiveness === 'high' ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
                    }`}>
                      Eficácia: {method.effectiveness === 'high' ? 'Alta' : 'Média'}
                    </span>
                  </div>
                </div>

                {method.command && (
                  <div className="bg-gray-100 rounded-lg p-3 mb-3">
                    <code className="text-sm text-gray-800">{method.command}</code>
                  </div>
                )}

                {method.tools && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Ferramentas recomendadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {method.tools.map((tool, toolIndex) => (
                        <span key={toolIndex} className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageCircle className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-800">Informações de Contato dos Atacantes</h3>
            </div>
            
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
              <p className="text-danger-800 text-sm">
                <strong>Atenção:</strong> Estas informações são fornecidas apenas para fins educacionais e de análise. 
                Recomendamos fortemente NÃO entrar em contato com os criminosos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">qTox Messenger</p>
                  <p className="text-sm text-gray-600">Aplicativo de comunicação segura requerido</p>
                </div>
                <a
                  href={communicationInfo.qtoxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Download qTox</span>
                </a>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Tox ID dos Atacantes:</p>
                <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                  {communicationInfo.toxId}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">ID Único da Vítima:</p>
                <div className="bg-white p-3 rounded border font-mono text-sm">
                  {communicationInfo.uniqueId}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Instruções dos Atacantes:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Enviar mensagem com o ID único</li>
                  <li>• Incluir 3 arquivos de teste (máximo 20-30 MB cada)</li>
                  <li>• Não aceitar links de terceiros</li>
                  <li>• Não enviar arquivos de banco de dados grandes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prevention' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-success-500" />
              <h3 className="text-lg font-semibold text-gray-800">Medidas de Prevenção</h3>
            </div>

            <div className="grid gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <HardDrive className="w-5 h-5 text-primary-500" />
                  <h4 className="font-medium text-gray-800">Backups Regulares</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Mantenha backups offline e em locais seguros. Use a regra 3-2-1: 3 cópias, 2 mídias diferentes, 1 offsite.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <h4 className="font-medium text-gray-800">Atualizações de Segurança</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Mantenha o sistema operacional e softwares sempre atualizados com os patches de segurança mais recentes.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Key className="w-5 h-5 text-primary-500" />
                  <h4 className="font-medium text-gray-800">Antivírus e Firewall</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Use soluções de segurança robustas com proteção em tempo real e detecção comportamental.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Info className="w-5 h-5 text-primary-500" />
                  <h4 className="font-medium text-gray-800">Educação em Segurança</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Treine usuários para identificar emails suspeitos, links maliciosos e práticas de segurança digital.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Comandos Úteis para Verificação</h4>
            <div className="space-y-3">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Verificar Shadow Copies:</p>
                <code className="text-sm text-gray-800">vssadmin list shadows</code>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Verificar serviços em execução:</p>
                <code className="text-sm text-gray-800">net start</code>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Verificar conexões de rede:</p>
                <code className="text-sm text-gray-800">netstat -an</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryTools;