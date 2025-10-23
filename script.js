class CryptoAnalyzer {
    constructor() {
        this.originalFile = null;
        this.encryptedFile = null;
        this.encryptedFileForDecrypt = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Upload de arquivos
        const originalInput = document.getElementById('originalFile');
        const encryptedInput = document.getElementById('encryptedFile');
        const encryptedDecryptInput = document.getElementById('encryptedFileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const decryptBtn = document.getElementById('decryptBtn');

        originalInput.addEventListener('change', (e) => this.handleFileUpload(e, 'original'));
        encryptedInput.addEventListener('change', (e) => this.handleFileUpload(e, 'encrypted'));
        encryptedDecryptInput.addEventListener('change', (e) => this.handleDecryptFileUpload(e));
        
        // Drag and drop
        this.setupDragAndDrop('originalDrop', originalInput, 'original');
        this.setupDragAndDrop('encryptedDrop', encryptedInput, 'encrypted');
        this.setupDragAndDrop('decryptDropZone', encryptedDecryptInput, 'decrypt');

        // Botões
        analyzeBtn.addEventListener('click', () => this.analyzeFiles());
        if (decryptBtn) {
            decryptBtn.addEventListener('click', () => this.decryptFile());
        }

        // Tabs do visualizador hex
        document.querySelectorAll('.hex-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchHexTab(e.target.dataset.target));
        });
    }

    setupDragAndDrop(dropZoneId, input, type) {
        const dropZone = document.getElementById(dropZoneId);
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                if (type === 'decrypt') {
                    this.handleDecryptFileUpload({ target: { files: [files[0]] } });
                } else {
                    input.files = files;
                    this.handleFileUpload({ target: { files: [files[0]] } }, type);
                }
            }
        });

        dropZone.addEventListener('click', () => {
            input.click();
        });
    }

    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        if (type === 'original') {
            this.originalFile = file;
            this.displayFileInfo(file, 'originalInfo');
        } else {
            this.encryptedFile = file;
            this.displayFileInfo(file, 'encryptedInfo');
        }

        // Habilitar botão de análise se ambos os arquivos estiverem carregados
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (this.originalFile && this.encryptedFile) {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Analisar Arquivos';
        }
    }

    handleDecryptFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.encryptedFileForDecrypt = file;
            this.displayDecryptFileInfo(file);
            document.getElementById('decryptBtn').style.display = 'block';
        }
    }

    displayDecryptFileInfo(file) {
        document.getElementById('encryptedFileName').textContent = file.name;
        document.getElementById('encryptedFileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('encryptedFileType').textContent = file.type || 'Desconhecido';
        document.getElementById('encryptedFileInfo').style.display = 'block';
    }

    async decryptFile() {
        if (!this.encryptedFileForDecrypt) {
            alert('Por favor, selecione um arquivo criptografado primeiro.');
            return;
        }

        const formData = new FormData();
        formData.append('encryptedFile', this.encryptedFileForDecrypt);

        try {
            document.getElementById('decryptBtn').textContent = '🔄 Descriptografando...';
            document.getElementById('decryptBtn').disabled = true;

            const response = await fetch('/decrypt', {
                method: 'POST',
                body: formData
            });

            const results = await response.json();
            this.displayDecryptResults(results);

        } catch (error) {
            console.error('Erro na descriptografia:', error);
            alert('Erro ao tentar descriptografar o arquivo.');
        } finally {
            document.getElementById('decryptBtn').textContent = '🔓 Tentar Descriptografar';
            document.getElementById('decryptBtn').disabled = false;
        }
    }

    displayDecryptResults(results) {
        const resultsDiv = document.getElementById('decryptResults');
        const summaryDiv = document.getElementById('decryptSummary');
        const attemptsDiv = document.getElementById('decryptAttempts');

        // Resumo
        summaryDiv.innerHTML = `
            <div class="summary-card ${results.success ? 'success' : 'failure'}">
                <h4>${results.success ? '✅ Descriptografia Bem-sucedida!' : '❌ Descriptografia Falhou'}</h4>
                <p><strong>Tentativas realizadas:</strong> ${results.attempts || 0}</p>
                ${results.success ? `
                    <p><strong>Método usado:</strong> ${results.method}</p>
                    <p><strong>Chave:</strong> ${results.keyUsed || results.key || 'N/A'}</p>
                    <button onclick="window.open('/download-decrypted', '_blank')" class="download-btn">
                        📥 Baixar Arquivo Descriptografado
                    </button>
                ` : `
                    <p><strong>Motivo:</strong> Nenhum método de descriptografia foi eficaz</p>
                `}
            </div>
        `;

        // Detalhes das tentativas
        if (results.attemptDetails && results.attemptDetails.length > 0) {
            attemptsDiv.innerHTML = `
                <h4>📋 Detalhes das Tentativas</h4>
                <div class="attempts-list">
                    ${results.attemptDetails.map((attempt, index) => `
                        <div class="attempt-item ${attempt.success ? 'success' : 'failed'}">
                            <div class="attempt-header">
                                <span class="attempt-number">#${index + 1}</span>
                                <span class="attempt-method">${attempt.method}</span>
                                <span class="attempt-status">${attempt.success ? '✅' : '❌'}</span>
                            </div>
                            <div class="attempt-details">
                                <p><strong>Chave:</strong> ${attempt.keyUsed || attempt.key || 'N/A'}</p>
                                ${attempt.preview ? `<p><strong>Preview:</strong> ${attempt.preview}</p>` : ''}
                                ${attempt.error ? `<p class="error"><strong>Erro:</strong> ${attempt.error}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    displayFileInfo(file, containerId) {
        const container = document.getElementById(containerId);
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        
        container.innerHTML = `
            <div class="file-details">
                <p><strong>📄 Nome:</strong> ${file.name}</p>
                <p><strong>📏 Tamanho:</strong> ${sizeInMB} MB (${file.size.toLocaleString()} bytes)</p>
                <p><strong>📅 Modificado:</strong> ${new Date(file.lastModified).toLocaleString()}</p>
                <p><strong>🏷️ Tipo:</strong> ${file.type || 'Desconhecido'}</p>
            </div>
        `;
    }

    async analyzeFiles() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const resultsSection = document.getElementById('results');
        
        // Mostrar loading
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '⏳ Analisando...';
        
        try {
            const formData = new FormData();
            formData.append('original', this.originalFile);
            formData.append('encrypted', this.encryptedFile);

            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const results = await response.json();
            this.displayResults(results);
            resultsSection.style.display = 'block';
            
        } catch (error) {
            console.error('Erro na análise:', error);
            alert('Erro ao analisar arquivos: ' + error.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Analisar Arquivos';
        }
    }

    displayResults(results) {
        // Análise de entropia
        const entropyResults = document.getElementById('entropyResults');
        entropyResults.innerHTML = `
            <div class="entropy-comparison">
                <div class="entropy-item">
                    <span class="label">Original:</span>
                    <span class="value">${results.original.entropy.toFixed(3)}</span>
                    <div class="entropy-bar">
                        <div class="entropy-fill" style="width: ${(results.original.entropy / 8) * 100}%"></div>
                    </div>
                </div>
                <div class="entropy-item">
                    <span class="label">Criptografado:</span>
                    <span class="value">${results.encrypted.entropy.toFixed(3)}</span>
                    <div class="entropy-bar">
                        <div class="entropy-fill encrypted" style="width: ${(results.encrypted.entropy / 8) * 100}%"></div>
                    </div>
                </div>
                <div class="entropy-diff">
                    <span class="label">Diferença:</span>
                    <span class="value ${results.comparison.entropyDifference > 0 ? 'positive' : 'negative'}">
                        ${results.comparison.entropyDifference > 0 ? '+' : ''}${results.comparison.entropyDifference.toFixed(3)}
                    </span>
                </div>
            </div>
        `;

        // Análise de bytes
        const byteResults = document.getElementById('byteResults');
        byteResults.innerHTML = `
            <div class="byte-analysis">
                <div class="size-comparison">
                    <p><strong>Tamanho Original:</strong> ${results.original.size.toLocaleString()} bytes</p>
                    <p><strong>Tamanho Criptografado:</strong> ${results.encrypted.size.toLocaleString()} bytes</p>
                    <p><strong>Diferença:</strong> 
                        <span class="${results.comparison.sizeDifference >= 0 ? 'positive' : 'negative'}">
                            ${results.comparison.sizeDifference >= 0 ? '+' : ''}${results.comparison.sizeDifference} bytes
                        </span>
                    </p>
                </div>
                <div class="header-analysis">
                    <p><strong>Cabeçalho Criptografado:</strong></p>
                    <code class="hex-preview">${results.encrypted.patterns.headerSignatures}</code>
                </div>
            </div>
        `;

        // Análise de padrões
        const patternResults = document.getElementById('patternResults');
        const xorPatterns = this.analyzeXorPatterns(results.comparison.xorAnalysis);
        patternResults.innerHTML = `
            <div class="pattern-analysis">
                <div class="xor-patterns">
                    <h4>🔀 Análise XOR</h4>
                    <p><strong>Padrões únicos:</strong> ${xorPatterns.uniquePatterns}</p>
                    <p><strong>Padrões repetidos:</strong> ${xorPatterns.repeatedPatterns}</p>
                    <p><strong>Bytes mais comuns:</strong> ${xorPatterns.mostCommon.join(', ')}</p>
                </div>
                <div class="block-analysis">
                    <h4>🧱 Análise de Blocos</h4>
                    <p><strong>Blocos analisados:</strong> ${Object.keys(results.comparison.blockAnalysis).length}</p>
                    <p><strong>Padrão de bloco:</strong> ${this.detectBlockPattern(results.comparison.blockAnalysis)}</p>
                </div>
            </div>
        `;

        // Possíveis chaves/parâmetros
        const keyResults = document.getElementById('keyResults');
        keyResults.innerHTML = `
            <div class="key-analysis">
                <h4>🔑 Possíveis Chaves Detectadas</h4>
                ${results.encrypted.patterns.possibleKeys.map(key => `
                    <div class="key-candidate">
                        <p><strong>Tamanho:</strong> ${key.size} bytes</p>
                        <p><strong>Hex:</strong> <code>${key.hex}</code></p>
                        <p><strong>ASCII:</strong> <code>${key.ascii}</code></p>
                    </div>
                `).join('')}
                
                <h4>💡 Recomendações</h4>
                <div class="recommendations">
                    ${results.recommendations.map(rec => `
                        <div class="recommendation ${rec.type}">
                            <span class="rec-type">${this.getRecommendationIcon(rec.type)}</span>
                            <span class="rec-message">${rec.message}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Atualizar visualizador hex
        document.getElementById('originalHex').innerHTML = `<pre>${results.hexDumps.original}</pre>`;
        document.getElementById('encryptedHex').innerHTML = `<pre>${results.hexDumps.encrypted}</pre>`;

        // Atualizar algoritmo suspeito
        document.getElementById('algorithmGuess').textContent = this.guessAlgorithm(results);
    }

    analyzeXorPatterns(xorArray) {
        const patterns = {};
        xorArray.forEach(xor => {
            patterns[xor] = (patterns[xor] || 0) + 1;
        });

        const uniquePatterns = Object.keys(patterns).length;
        const repeatedPatterns = Object.values(patterns).filter(count => count > 1).length;
        const mostCommon = Object.entries(patterns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([byte, count]) => `0x${parseInt(byte).toString(16).padStart(2, '0')} (${count}x)`);

        return { uniquePatterns, repeatedPatterns, mostCommon };
    }

    detectBlockPattern(blockAnalysis) {
        const blocks = Object.values(blockAnalysis);
        if (blocks.length === 0) return 'Nenhum bloco analisado';

        const avgEntropy = blocks.reduce((sum, block) => sum + block.encryptedEntropy, 0) / blocks.length;
        
        if (avgEntropy > 7.5) {
            return 'Blocos com alta entropia - Criptografia forte';
        } else if (avgEntropy > 6.0) {
            return 'Blocos com entropia média - Possível criptografia fraca';
        } else {
            return 'Blocos com baixa entropia - Possível codificação simples';
        }
    }

    guessAlgorithm(results) {
        const entropy = results.encrypted.entropy;
        const sizeDiff = results.comparison.sizeDifference;
        
        if (entropy > 7.8 && sizeDiff === 0) {
            return 'Provável: ChaCha20 ou AES-CTR';
        } else if (entropy > 7.5 && sizeDiff % 16 === 0) {
            return 'Provável: AES-CBC com padding PKCS7';
        } else if (entropy > 7.0 && sizeDiff > 0) {
            return 'Provável: AES-ECB ou CBC';
        } else if (entropy < 6.0) {
            return 'Provável: Codificação simples (Base64, XOR)';
        } else {
            return 'Algoritmo desconhecido - Análise mais profunda necessária';
        }
    }

    getRecommendationIcon(type) {
        const icons = {
            'encryption': '🔐',
            'cipher': '🔄',
            'weakness': '⚠️',
            'structure': '🏗️'
        };
        return icons[type] || '💡';
    }

    switchHexTab(target) {
        // Remover classe active de todas as tabs e displays
        document.querySelectorAll('.hex-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.hex-display').forEach(display => display.classList.remove('active'));
        
        // Adicionar classe active na tab e display selecionados
        document.querySelector(`[data-target="${target}"]`).classList.add('active');
        document.getElementById(target).classList.add('active');
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new CryptoAnalyzer();
});