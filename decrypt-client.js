class DecryptClient {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.toxIdInput = document.getElementById('toxId');
        this.victimIdInput = document.getElementById('victimId');
        this.decryptBtn = document.getElementById('decryptBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.statusText = document.getElementById('statusText');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');

        this.selectedFile = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Click to select file
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Decrypt button
        this.decryptBtn.addEventListener('click', () => {
            this.startDecryption();
        });
    }

    handleFileSelect(file) {
        this.selectedFile = file;
        
        // Update UI
        const fileInfo = this.uploadArea.querySelector('.file-info');
        if (fileInfo) {
            fileInfo.remove();
        }

        const fileInfoDiv = document.createElement('div');
        fileInfoDiv.className = 'file-info';
        fileInfoDiv.innerHTML = `
            <i class="fas fa-file"></i>
            <div>
                <strong>${file.name}</strong>
                <small>${this.formatFileSize(file.size)}</small>
            </div>
        `;

        this.uploadArea.appendChild(fileInfoDiv);
        this.uploadArea.classList.add('has-file');
        this.decryptBtn.disabled = false;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async startDecryption() {
        if (!this.selectedFile) {
            alert('Por favor, selecione um arquivo primeiro.');
            return;
        }

        this.decryptBtn.disabled = true;
        this.showProgress();
        this.hideResult();

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('toxId', this.toxIdInput.value || 'default');
        formData.append('victimId', this.victimIdInput.value || 'default');

        try {
            this.updateStatus('Enviando arquivo...', 20);
            
            const response = await fetch('/decrypt', {
                method: 'POST',
                body: formData
            });

            this.updateStatus('Processando descriptografia...', 60);

            const result = await response.json();

            this.updateStatus('Finalizando...', 90);

            setTimeout(() => {
                this.hideProgress();
                this.showResult(result);
                this.decryptBtn.disabled = false;
            }, 500);

        } catch (error) {
            console.error('Erro na descriptografia:', error);
            this.hideProgress();
            this.showResult({
                success: false,
                error: 'Erro de conexão: ' + error.message
            });
            this.decryptBtn.disabled = false;
        }
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.updateStatus('Iniciando...', 0);
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
    }

    updateStatus(message, progress) {
        this.statusText.textContent = message;
        this.progressFill.style.width = progress + '%';
    }

    showResult(result) {
        this.resultsSection.style.display = 'block';
        
        if (result.success) {
            let methodInfo = '';
            if (result.method && result.method.startsWith('alternative_')) {
                methodInfo = `
                    <p><strong>Método Usado:</strong> ${result.method} (Confiança: ${(result.confidence * 100).toFixed(1)}%)</p>
                    <p><strong>Tentativas Realizadas:</strong> ${result.totalAttempts}</p>
                `;
                if (result.headerAnalysis) {
                    methodInfo += `<p><strong>Entropia do Arquivo:</strong> ${result.headerAnalysis.entropy.toFixed(2)}</p>`;
                }
            } else {
                methodInfo = `<p><strong>Método Usado:</strong> ${result.method}</p>`;
            }
            
            this.resultsContent.innerHTML = `
                <div class="success-result">
                    <i class="fas fa-check-circle"></i>
                    <h3>Descriptografia Bem-sucedida!</h3>
                    <div class="result-details">
                        <p><strong>Arquivo Original:</strong> ${result.originalName}</p>
                        ${methodInfo}
                        <p><strong>Tipo de Arquivo:</strong> ${result.fileType || 'Detectado automaticamente'}</p>
                        ${result.corrected ? '<p><strong>Status:</strong> Cabeçalho corrigido automaticamente</p>' : ''}
                    </div>
                    <a href="/download/${result.filename}" class="download-btn" download>
                        <i class="fas fa-download"></i>
                        Baixar Arquivo Descriptografado
                    </a>
                </div>
            `;
        } else {
            let additionalInfo = '';
            if (result.headerAnalysis) {
                additionalInfo = `
                    <div class="analysis-info">
                        <h4>Análise do Arquivo:</h4>
                        <p><strong>Entropia:</strong> ${result.headerAnalysis.entropy.toFixed(2)}</p>
                        <p><strong>Tamanho:</strong> ${result.headerAnalysis.fileSize} bytes</p>
                        ${result.totalAttempts ? `<p><strong>Tentativas:</strong> ${result.totalAttempts}</p>` : ''}
                    </div>
                `;
            }
            
            this.resultsContent.innerHTML = `
                <div class="error-result">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Falha na Descriptografia</h3>
                    <p class="error-message">${result.error}</p>
                    ${additionalInfo}
                    <div class="error-suggestions">
                        <h4>Possíveis soluções:</h4>
                        <ul>
                            <li>Verifique se o arquivo está realmente criptografado pelo WantToCry</li>
                            <li>Tente diferentes valores para Tox ID e Victim ID</li>
                            <li>Certifique-se de que o arquivo não está corrompido</li>
                            <li>O sistema tentou métodos alternativos automaticamente</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }

    hideResult() {
        this.resultsSection.style.display = 'none';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new DecryptClient();
});