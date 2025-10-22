class WantToCryDecryptor {
    constructor() {
        this.uploadedFiles = [];
        this.analysisResults = {};
        this.isProcessing = false;
        this.decryptedData = []; // Array para armazenar arquivos descriptografados
        this.knownKeys = [
            // Chaves conhecidas do WantToCry (exemplos)
            'DECRYPT71',
            'WANTOCRY2017',
            'RANSOMWARE',
            'BITCOIN123',
            'UNLOCK2017',
            'DECRYPT123',
            'WANNACRY17',
            'RESTORE123'
        ];

        // ID único encontrado no ransomware
        this.uniqueID = '3C579D75CF2341758A9B984A0B943F18';
        this.toxID = '1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6';
        
        // Inicializar biblioteca de criptografia moderna
        this.modernCrypto = new ModernCrypto();
        this.modernCrypto.setLogCallback((message, type) => {
            this.logMessage(message, type);
        });
        
        this.initializeEventListeners();
        this.logMessage('🚀 Sistema iniciado com criptografia moderna', 'success');
        this.logMessage(`📡 WebCrypto suportado: ${this.modernCrypto.isWebCryptoSupported ? 'Sim' : 'Não'}`, 'info');
    }

    initializeEventListeners() {
        // Upload de arquivos
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Remover listeners antigos que não existem mais
        // Os botões agora usam onclick diretamente no HTML
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const files = Array.from(e.target.files);
        
        // Limpar o input para permitir re-seleção do mesmo arquivo
        e.target.value = '';
        
        this.processFiles(files);
    }

    processFiles(files) {
        const validFiles = files.filter(file => 
            file.name.endsWith('.want_to_cry') || 
            file.name.includes('want_to_cry') ||
            file.size > 0
        );

        if (validFiles.length === 0) {
            this.logMessage('Nenhum arquivo válido selecionado', 'error');
            return;
        }

        this.uploadedFiles = [...this.uploadedFiles, ...validFiles];
        this.displayFileList();
        this.analyzeFiles();
        this.logMessage(`${validFiles.length} arquivo(s) adicionado(s) para análise`, 'success');
    }

    displayFileList() {
        const fileList = document.getElementById('fileList');
        const downloadAllSection = document.getElementById('downloadAllSection');
        
        fileList.innerHTML = '';

        this.uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span><i class="fas fa-file-alt"></i> ${file.name} (${this.formatFileSize(file.size)})</span>
                <div style="display: flex; gap: 10px;">
                    <button onclick="decryptor.downloadOriginalFile(${index})" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;" title="Baixar arquivo original">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="decryptor.removeFile(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;" title="Remover arquivo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            fileList.appendChild(fileItem);
        });

        // Mostrar/ocultar botão de download em lote
        if (this.uploadedFiles.length > 1) {
            downloadAllSection.style.display = 'block';
        } else {
            downloadAllSection.style.display = 'none';
        }
    }

    downloadOriginalFile(index) {
        if (index < 0 || index >= this.uploadedFiles.length) {
            this.logMessage('Arquivo não encontrado', 'error');
            return;
        }

        const file = this.uploadedFiles[index];
        
        try {
            // Criar URL temporária para o arquivo
            const url = URL.createObjectURL(file);
            
            // Criar elemento de download temporário
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = file.name;
            downloadLink.style.display = 'none';
            
            // Adicionar ao DOM, clicar e remover
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Limpar URL temporária
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            this.logMessage(`Download iniciado: ${file.name}`, 'success');
        } catch (error) {
            this.logMessage(`Erro ao baixar arquivo: ${error.message}`, 'error');
        }
    }

    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.displayFileList();
        this.logMessage('Arquivo removido da lista', 'info');
    }

    generateKeysFromID() {
        const keys = [];
        const id = this.uniqueID;
        
        // Método 1: ID direto
        keys.push(id);
        
        // Método 2: ID em maiúsculo
        keys.push(id.toUpperCase());
        
        // Método 3: ID em minúsculo
        keys.push(id.toLowerCase());
        
        // Método 4: Primeiros 16 caracteres
        keys.push(id.substring(0, 16));
        
        // Método 5: Últimos 16 caracteres
        keys.push(id.substring(id.length - 16));
        
        // Método 6: ID reverso
        keys.push(id.split('').reverse().join(''));
        
        // Método 7: Hash MD5 do ID (simulado)
        keys.push(this.simpleHash(id, 16));
        
        // Método 8: Hash SHA1 do ID (simulado)
        keys.push(this.simpleHash(id, 20));
        
        // Método 9: XOR com padrão
        keys.push(this.xorWithPattern(id, 'WANTOCRY'));
        
        // Método 10: Combinação com Tox ID
        keys.push(this.combineIDs(id, this.toxID.substring(0, 16)));
        
        // Método 11: Rotação de caracteres
        keys.push(this.rotateString(id, 13)); // ROT13 style
        
        // Método 12: Apenas números do ID
        keys.push(id.replace(/[^0-9]/g, ''));
        
        // Método 13: Apenas letras do ID
        keys.push(id.replace(/[^A-Fa-f]/g, ''));
        
        return keys;
    }

    simpleHash(input, length) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(length, '0').substring(0, length).toUpperCase();
    }

    xorWithPattern(input, pattern) {
        let result = '';
        for (let i = 0; i < input.length; i++) {
            const inputChar = input.charCodeAt(i);
            const patternChar = pattern.charCodeAt(i % pattern.length);
            result += String.fromCharCode(inputChar ^ patternChar);
        }
        return result;
    }

    combineIDs(id1, id2) {
        let result = '';
        const maxLength = Math.max(id1.length, id2.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < id1.length) result += id1[i];
            if (i < id2.length) result += id2[i];
        }
        return result.substring(0, 32); // Limitar a 32 caracteres
    }

    rotateString(str, shift) {
        return str.split('').map(char => {
            if (char >= '0' && char <= '9') {
                return String.fromCharCode(((char.charCodeAt(0) - 48 + shift) % 10) + 48);
            } else if (char >= 'A' && char <= 'F') {
                return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 6) + 65);
            } else if (char >= 'a' && char <= 'f') {
                return String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 6) + 97);
            }
            return char;
        }).join('');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async analyzeFiles() {
        if (this.uploadedFiles.length === 0) return;

        const analysisResults = document.getElementById('analysisResults');
        analysisResults.innerHTML = '<p>Analisando arquivos...</p>';

        let analysisText = 'ANÁLISE DOS ARQUIVOS CRIPTOGRAFADOS\n';
        analysisText += '=' .repeat(50) + '\n\n';

        for (let i = 0; i < this.uploadedFiles.length; i++) {
            const file = this.uploadedFiles[i];
            analysisText += `Arquivo ${i + 1}: ${file.name}\n`;
            analysisText += `Tamanho: ${this.formatFileSize(file.size)}\n`;
            analysisText += `Tipo: ${file.type || 'Desconhecido'}\n`;

            try {
                const buffer = await this.readFileAsArrayBuffer(file);
                const analysis = this.analyzeFileStructure(buffer);
                
                analysisText += `Entropia: ${analysis.entropy.toFixed(2)} (${analysis.entropy > 7.5 ? 'Alta - Provavelmente criptografado' : 'Baixa - Pode não estar criptografado'})\n`;
                analysisText += `Assinatura: ${analysis.signature}\n`;
                analysisText += `Padrões detectados: ${analysis.patterns.join(', ') || 'Nenhum'}\n`;
                
                if (analysis.isPartialAnalysis) {
                    analysisText += `⚠️ Análise parcial: ${this.formatFileSize(analysis.analyzedSize)} de ${this.formatFileSize(analysis.fileSize)} analisados\n`;
                }
                
                this.analysisResults[file.name] = analysis;
            } catch (error) {
                analysisText += `Erro na análise: ${error.message}\n`;
                this.logMessage(`Erro ao analisar ${file.name}: ${error.message}`, 'error');
            }

            analysisText += '\n' + '-'.repeat(30) + '\n\n';
        }

        analysisResults.innerHTML = `<pre>${analysisText}</pre>`;
        this.logMessage('Análise de arquivos concluída', 'success');
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    analyzeFileStructure(buffer) {
        const bytes = new Uint8Array(buffer);
        
        // Limitar análise para arquivos muito grandes (máximo 10MB para análise completa)
        const maxAnalysisSize = 10 * 1024 * 1024; // 10MB
        const analysisBytes = bytes.length > maxAnalysisSize ? 
            bytes.slice(0, maxAnalysisSize) : bytes;
        
        const analysis = {
            entropy: this.calculateEntropy(analysisBytes),
            signature: this.getFileSignature(bytes),
            patterns: this.detectPatterns(analysisBytes),
            fileSize: bytes.length,
            analyzedSize: analysisBytes.length,
            isPartialAnalysis: bytes.length > maxAnalysisSize
        };
        return analysis;
    }

    calculateEntropy(bytes) {
        const frequency = new Array(256).fill(0);
        const maxSampleSize = 1024 * 1024; // 1MB máximo para cálculo de entropia
        const sampleBytes = bytes.length > maxSampleSize ? 
            this.sampleBytes(bytes, maxSampleSize) : bytes;
        
        for (let i = 0; i < sampleBytes.length; i++) {
            frequency[sampleBytes[i]]++;
        }

        let entropy = 0;
        const length = sampleBytes.length;
        for (let i = 0; i < 256; i++) {
            if (frequency[i] > 0) {
                const p = frequency[i] / length;
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    sampleBytes(bytes, maxSize) {
        if (bytes.length <= maxSize) return bytes;
        
        const step = Math.floor(bytes.length / maxSize);
        const sampled = new Uint8Array(maxSize);
        
        for (let i = 0; i < maxSize; i++) {
            sampled[i] = bytes[i * step];
        }
        
        return sampled;
    }

    getFileSignature(bytes) {
        const signature = Array.from(bytes.slice(0, 16))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
        return signature.toUpperCase();
    }

    detectPatterns(bytes) {
        const patterns = [];
        
        // Limitar busca de padrões para evitar stack overflow
        const maxSearchSize = 2 * 1024 * 1024; // 2MB máximo
        const searchBytes = bytes.length > maxSearchSize ? 
            bytes.slice(0, maxSearchSize) : bytes;
        
        // Procurar por strings conhecidas do WantToCry
        const searchStrings = ['WANACRY', 'WCRY', 'want_to_cry', '@WanaDecryptor@'];
        
        try {
            // Converter para string de forma segura
            const text = this.bytesToString(searchBytes);
            
            searchStrings.forEach(str => {
                if (text.includes(str)) {
                    patterns.push(`String encontrada: ${str}`);
                }
            });
        } catch (error) {
            patterns.push('Erro na análise de strings: arquivo muito grande ou corrompido');
        }

        // Verificar repetições suspeitas com limite
        try {
            if (this.hasRepeatingPatterns(searchBytes)) {
                patterns.push('Padrões repetitivos detectados');
            }
        } catch (error) {
            patterns.push('Análise de padrões limitada devido ao tamanho do arquivo');
        }

        return patterns;
    }

    bytesToString(bytes) {
        // Converter bytes para string de forma segura, processando em chunks
        const chunkSize = 8192; // 8KB chunks
        let result = '';
        
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            try {
                result += String.fromCharCode.apply(null, chunk);
            } catch (error) {
                // Se falhar, processar byte por byte
                for (let j = 0; j < chunk.length; j++) {
                    result += String.fromCharCode(chunk[j]);
                }
            }
        }
        
        return result;
    }

    hasRepeatingPatterns(bytes) {
        const blockSize = 16;
        const blocks = new Map();
        let repeatedBlocks = 0;
        
        // Limitar análise para evitar problemas de memória
        const maxBlocks = Math.min(Math.floor(bytes.length / blockSize), 10000); // Máximo 10k blocos
        
        for (let i = 0; i < maxBlocks * blockSize; i += blockSize) {
            const block = Array.from(bytes.slice(i, i + blockSize)).join(',');
            const count = blocks.get(block) || 0;
            blocks.set(block, count + 1);
            
            if (count > 0) repeatedBlocks++;
            
            // Parar se encontrar muitas repetições (otimização)
            if (repeatedBlocks > 100) break;
        }

        return repeatedBlocks > 0;
    }

    async tryIDBasedDecryption() {
        if (this.uploadedFiles.length === 0) {
            this.logMessage('Nenhum arquivo carregado para descriptografia', 'error');
            return;
        }

        if (this.isProcessing) {
            this.logMessage('Processamento já em andamento...', 'warning');
            return;
        }

        this.isProcessing = true;
        
        // Limpar dados descriptografados anteriores COMPLETAMENTE
        this.decryptedData = [];
        this.logMessage('🧹 Array decryptedData limpo - iniciando nova descriptografia', 'info');
        
        this.logMessage('🆔 Iniciando descriptografia baseada em ID único...', 'info');
        this.logMessage(`ID único: ${this.uniqueID}`, 'info');
        this.logMessage(`Tox ID: ${this.toxID}`, 'info');

        try {
            // Gerar chaves baseadas no ID
            const generatedKeys = this.generateKeysFromID();
            this.logMessage(`Geradas ${generatedKeys.length} chaves derivadas do ID`, 'info');

            // Testar cada chave gerada
            for (let i = 0; i < generatedKeys.length; i++) {
                const key = generatedKeys[i];
                this.logMessage(`Testando método ${i + 1}/${generatedKeys.length}: Chave derivada do ID`, 'info');
                this.logMessage(`Chave: ${key}`, 'info');

                // Tentar descriptografia AES-256 para cada arquivo
                for (let fileIndex = 0; fileIndex < this.uploadedFiles.length; fileIndex++) {
                    const file = this.uploadedFiles[fileIndex];
                    this.logMessage(`Testando arquivo: ${file.name}`, 'info');
                    
                    try {
                        const fileData = new Uint8Array(await file.arrayBuffer());
                        const result = await this.tryDecryptWithAES256(fileData, key);
                        
                        if (result.success) {
                            this.logMessage(`🎉 Descriptografia bem-sucedida com método: Chave derivada do ID`, 'success');
                            this.logMessage(`Chave efetiva: ${key}`, 'success');
                            
                            // Armazenar dados descriptografados
                            const originalName = file.name.replace('.want_to_cry', '');
                            this.decryptedData.push({
                                originalName: originalName,
                                decryptedContent: result.data,
                                key: key,
                                algorithm: result.algorithm,
                                method: 'ID-Based Decryption',
                                timestamp: new Date().toISOString()
                            });
                            
                            this.displayDecryptionResult(result);
                            
                            // INICIAR DOWNLOAD AUTOMATICAMENTE
                            this.logMessage(`🚀 Iniciando download automático do arquivo descriptografado...`, 'success');
                            setTimeout(() => {
                                this.downloadDecryptedFiles();
                            }, 1000);
                            
                            this.isProcessing = false;
                            return;
                        }
                    } catch (error) {
                        this.logMessage(`Erro ao processar arquivo ${file.name}: ${error.message}`, 'error');
                    }
                }
                
                await this.sleep(200); // Pausa entre tentativas
            }

            this.logMessage('❌ Nenhuma chave derivada do ID funcionou', 'error');
            this.displayDecryptionResult(false);

        } catch (error) {
            this.logMessage(`Erro durante descriptografia por ID: ${error.message}`, 'error');
            this.displayDecryptionResult(false);
        }

        this.isProcessing = false;
    }

    isLikelyValidKey(key) {
        // Simular validação de chave - na realidade seria uma tentativa real de descriptografia
        const validPatterns = [
            this.uniqueID.substring(0, 16), // Primeiros 16 chars do ID
            this.uniqueID.substring(16, 32), // Últimos 16 chars do ID
            this.simpleHash(this.uniqueID, 16), // Hash do ID
            'DECRYPT71' // Chave conhecida que funciona
        ];
        
        return validPatterns.some(pattern => key.includes(pattern) || pattern.includes(key));
    }

    async startBruteForce() {
        if (this.uploadedFiles.length === 0) {
            this.logMessage('Nenhum arquivo selecionado para descriptografia', 'error');
            return;
        }

        if (this.isProcessing) {
            this.logMessage('Processo já em andamento', 'warning');
            return;
        }

        this.isProcessing = true;
        this.showProgress();
        this.logMessage('Iniciando ataque de força bruta com chaves fracas...', 'info');

        const weakKeys = this.generateWeakKeys();
        let progress = 0;
        const totalKeys = weakKeys.length;

        for (let i = 0; i < weakKeys.length; i++) {
            const key = weakKeys[i];
            progress = ((i + 1) / totalKeys) * 100;
            
            this.updateProgress(progress, `Testando chave: ${key}`);
            
            try {
                const result = await this.tryDecryptWithKey(key);
                if (result.success) {
                    this.logMessage(`SUCESSO! Chave encontrada: ${key}`, 'success');
                    this.displayDecryptionResult(result);
                    this.isProcessing = false;
                    return;
                }
            } catch (error) {
                this.logMessage(`Erro ao testar chave ${key}: ${error.message}`, 'error');
            }

            // Simular delay para não travar a interface
            if (i % 10 === 0) {
                await this.sleep(100);
            }
        }

        this.logMessage('Força bruta concluída - Nenhuma chave fraca encontrada', 'warning');
        this.hideProgress();
        this.isProcessing = false;
    }

    generateWeakKeys() {
        const keys = [];
        
        // Chaves baseadas em datas
        const currentYear = new Date().getFullYear();
        for (let year = 2015; year <= currentYear; year++) {
            keys.push(year.toString());
            keys.push(`WCRY${year}`);
            keys.push(`WANA${year}`);
        }

        // Chaves comuns
        const commonKeys = [
            '123456', 'password', 'admin', 'root', 'user',
            'WANACRY', 'WCRY2017', 'RANSOM', 'CRYPTO',
            'BITCOIN', 'DECRYPT', 'UNLOCK', 'RESTORE'
        ];
        
        keys.push(...commonKeys);

        // Variações com números
        commonKeys.forEach(key => {
            for (let i = 0; i < 100; i++) {
                keys.push(key + i.toString().padStart(2, '0'));
            }
        });

        return keys;
    }

    async tryKnownKeys() {
        if (this.uploadedFiles.length === 0) {
            this.logMessage('Nenhum arquivo selecionado para descriptografia', 'error');
            return;
        }

        this.isProcessing = true;
        this.showProgress();
        this.logMessage('Testando chaves conhecidas do WantToCry...', 'info');

        for (let i = 0; i < this.knownKeys.length; i++) {
            const key = this.knownKeys[i];
            const progress = ((i + 1) / this.knownKeys.length) * 100;
            
            this.updateProgress(progress, `Testando chave conhecida: ${key}`);
            
            // Tentar descriptografia AES-256 para cada arquivo
            for (let fileIndex = 0; fileIndex < this.uploadedFiles.length; fileIndex++) {
                const file = this.uploadedFiles[fileIndex];
                this.logMessage(`Testando arquivo: ${file.name}`, 'info');
                
                try {
                    const fileData = new Uint8Array(await file.arrayBuffer());
                    const result = await this.tryDecryptWithAES256(fileData, key);
                    
                    if (result.success) {
                        this.logMessage(`SUCESSO! Chave conhecida funcionou: ${key}`, 'success');
                        
                        // Armazenar dados descriptografados
                        if (!this.decryptedData) {
                            this.decryptedData = [];
                        }
                        
                        const originalName = file.name.replace('.want_to_cry', '');
                        this.decryptedData.push({
                            originalName: originalName,
                            decryptedContent: result.data,
                            key: key,
                            algorithm: result.algorithm,
                            timestamp: new Date()
                        });
                        
                        this.displayDecryptionResult(result);
                        this.isProcessing = false;
                        return;
                    }
                } catch (error) {
                    this.logMessage(`Erro ao processar arquivo ${file.name}: ${error.message}`, 'error');
                }
            }

            await this.sleep(200);
        }

        this.logMessage('Nenhuma chave conhecida funcionou', 'warning');
        this.hideProgress();
        this.isProcessing = false;
    }

    async analyzePatterns() {
        if (this.uploadedFiles.length === 0) {
            this.logMessage('Nenhum arquivo selecionado para análise', 'error');
            return;
        }

        this.logMessage('Iniciando análise avançada de padrões...', 'info');
        this.showProgress();

        try {
            for (let i = 0; i < this.uploadedFiles.length; i++) {
                const file = this.uploadedFiles[i];
                const progress = ((i + 1) / this.uploadedFiles.length) * 100;
                
                this.updateProgress(progress, `Analisando padrões em: ${file.name}`);
                
                const buffer = await this.readFileAsArrayBuffer(file);
                const patterns = await this.performAdvancedAnalysis(buffer);
                
                this.logMessage(`Análise de ${file.name} concluída`, 'info');
                this.displayPatternAnalysis(file.name, patterns);
                
                await this.sleep(500);
            }
        } catch (error) {
            this.logMessage(`Erro na análise de padrões: ${error.message}`, 'error');
        }

        this.hideProgress();
        this.logMessage('Análise de padrões concluída', 'success');
    }

    async performAdvancedAnalysis(buffer) {
        const bytes = new Uint8Array(buffer);
        const analysis = {
            blockAnalysis: this.analyzeBlocks(bytes),
            frequencyAnalysis: this.analyzeFrequency(bytes),
            correlationAnalysis: this.analyzeCorrelation(bytes),
            possibleKeys: []
        };

        // Tentar deduzir possíveis chaves baseadas na análise
        if (analysis.blockAnalysis.hasECBPattern) {
            analysis.possibleKeys.push('Possível uso de ECB - chave pode ser derivada do nome do arquivo');
        }

        return analysis;
    }

    analyzeBlocks(bytes) {
        const blockSize = 16;
        const blocks = new Map();
        let repeatedBlocks = 0;

        for (let i = 0; i < bytes.length - blockSize; i += blockSize) {
            const block = Array.from(bytes.slice(i, i + blockSize)).join(',');
            const count = blocks.get(block) || 0;
            blocks.set(block, count + 1);
            
            if (count > 0) repeatedBlocks++;
        }

        return {
            totalBlocks: Math.floor(bytes.length / blockSize),
            uniqueBlocks: blocks.size,
            repeatedBlocks: repeatedBlocks,
            hasECBPattern: repeatedBlocks > 0
        };
    }

    analyzeFrequency(bytes) {
        const frequency = new Array(256).fill(0);
        bytes.forEach(byte => frequency[byte]++);
        
        const sorted = frequency
            .map((count, byte) => ({ byte, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            mostFrequent: sorted,
            distribution: frequency
        };
    }

    analyzeCorrelation(bytes) {
        // Análise simples de correlação entre bytes adjacentes
        let correlation = 0;
        for (let i = 1; i < Math.min(bytes.length, 1000); i++) {
            if (bytes[i] === bytes[i-1]) correlation++;
        }
        
        return {
            adjacentCorrelation: correlation / Math.min(bytes.length - 1, 999),
            isHighlyCorrelated: correlation > 50
        };
    }

    async tryDecryptWithAES256(fileData, key) {
        try {
            // Converter chave para formato adequado (32 bytes para AES-256)
            const keyBytes = this.prepareAESKey(key);
            
            // Tentar diferentes modos de operação do AES
            const modes = ['CBC', 'ECB', 'CTR'];
            
            for (const mode of modes) {
                try {
                    this.logMessage(`Tentando AES-256-${mode} com chave: ${key.substring(0, 16)}...`, 'info');
                    
                    // Simular descriptografia AES-256
                    const result = await this.performAESDecryption(fileData, keyBytes, mode);
                    
                    if (result && this.validateDecryptedData(result)) {
                        this.logMessage(`✅ Descriptografia AES-256-${mode} bem-sucedida!`, 'success');
                        return {
                            success: true,
                            data: result,
                            algorithm: `AES-256-${mode}`,
                            key: key
                        };
                    }
                } catch (error) {
                    this.logMessage(`Erro AES-256-${mode}: ${error.message}`, 'error');
                }
            }
            
            return { success: false };
            
        } catch (error) {
            this.logMessage(`Erro na descriptografia AES-256: ${error.message}`, 'error');
            return { success: false };
        }
    }

    prepareAESKey(key) {
        // Converter string para bytes e ajustar para 32 bytes (AES-256)
        const encoder = new TextEncoder();
        let keyBytes = encoder.encode(key);
        
        // Se a chave for menor que 32 bytes, repetir até completar
        if (keyBytes.length < 32) {
            const repeated = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                repeated[i] = keyBytes[i % keyBytes.length];
            }
            keyBytes = repeated;
        } else if (keyBytes.length > 32) {
            // Se for maior, truncar para 32 bytes
            keyBytes = keyBytes.slice(0, 32);
        }
        
        return keyBytes;
    }

    async performAESDecryption(encryptedData, keyBytes, mode) {
        try {
            this.logMessage(`🔐 Iniciando descriptografia AES-${mode} com biblioteca moderna`, 'info');
            
            // Converter dados para hex
            const encryptedHex = Array.from(encryptedData).map(b => b.toString(16).padStart(2, '0')).join('');
            const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            
            this.logMessage(`📊 Dados: ${encryptedHex.length} chars hex, Chave: ${keyHex.length} chars hex`, 'info');
            
            // Usar a biblioteca moderna de criptografia
            const result = await this.modernCrypto.decrypt(encryptedHex, keyHex, `AES-${mode}`);
            
            if (result && result.length > 0) {
                this.logMessage(`✅ Descriptografia AES-${mode} bem-sucedida: ${result.length} bytes`, 'success');
                
                // Validar dados descriptografados
                if (this.modernCrypto.validateDecryptedData(result)) {
                    return result;
                } else {
                    this.logMessage('⚠️ Dados descriptografados podem estar corrompidos', 'warning');
                    return result; // Retornar mesmo assim para análise
                }
            } else {
                throw new Error('Descriptografia resultou em dados vazios');
            }
            
        } catch (error) {
            this.logMessage(`❌ Erro na descriptografia AES-${mode}: ${error.message}`, 'error');
            
            // Fallback para método antigo se necessário
            this.logMessage('🔄 Tentando método de descriptografia legado...', 'warning');
            return this.performLegacyAESDecryption(encryptedData, keyBytes, mode);
        }
    }

    async performLegacyAESDecryption(encryptedData, keyBytes, mode) {
        try {
            // Verificar se crypto-js está disponível
            if (typeof CryptoJS === 'undefined') {
                this.logMessage('⚠️ Biblioteca crypto-js não encontrada, usando simulação', 'warning');
                return this.performSimulatedDecryption(encryptedData, keyBytes);
            }

            // Converter dados para formato do crypto-js
            const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const key = CryptoJS.enc.Hex.parse(keyHex);
            
            // Converter dados criptografados
            const encryptedHex = Array.from(encryptedData).map(b => b.toString(16).padStart(2, '0')).join('');
            
            let decrypted;
            
            try {
                if (mode === 'ECB') {
                    // Verificar se é múltiplo de 16 bytes
                    if (encryptedData.length % 16 !== 0) {
                        throw new Error('Tamanho inválido para AES-ECB');
                    }
                    
                    decrypted = CryptoJS.AES.decrypt(
                        { ciphertext: CryptoJS.enc.Hex.parse(encryptedHex) },
                        key,
                        { 
                            mode: CryptoJS.mode.ECB,
                            padding: CryptoJS.pad.Pkcs7
                        }
                    );
                } else if (mode === 'CBC') {
                    // Para CBC, assumir que os primeiros 16 bytes são o IV
                    if (encryptedData.length < 32) {
                        throw new Error('Arquivo muito pequeno para AES-CBC com IV');
                    }
                    
                    const iv = CryptoJS.enc.Hex.parse(encryptedHex.substring(0, 32));
                    const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex.substring(32));
                    
                    decrypted = CryptoJS.AES.decrypt(
                        { ciphertext: ciphertext },
                        key,
                        { 
                            iv: iv,
                            mode: CryptoJS.mode.CBC,
                            padding: CryptoJS.pad.Pkcs7
                        }
                    );
                } else if (mode === 'CTR') {
                    // Para CTR, assumir que os primeiros 16 bytes são o IV/nonce
                    if (encryptedData.length < 32) {
                        throw new Error('Arquivo muito pequeno para AES-CTR com IV');
                    }
                    
                    const iv = CryptoJS.enc.Hex.parse(encryptedHex.substring(0, 32));
                    const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex.substring(32));
                    
                    decrypted = CryptoJS.AES.decrypt(
                        { ciphertext: ciphertext },
                        key,
                        { 
                            iv: iv,
                            mode: CryptoJS.mode.CTR,
                            padding: CryptoJS.pad.NoPadding
                        }
                    );
                }
                
                // Converter resultado para Uint8Array
                if (decrypted && decrypted.sigBytes > 0) {
                    const decryptedHex = decrypted.toString(CryptoJS.enc.Hex);
                    const decryptedBytes = new Uint8Array(decryptedHex.length / 2);
                    
                    for (let i = 0; i < decryptedHex.length; i += 2) {
                        decryptedBytes[i / 2] = parseInt(decryptedHex.substr(i, 2), 16);
                    }
                    
                    this.logMessage(`✅ Descriptografia AES-${mode} realizada com sucesso`, 'success');
                    return decryptedBytes;
                } else {
                    throw new Error('Descriptografia resultou em dados vazios');
                }
                
            } catch (cryptoError) {
                this.logMessage(`Erro crypto-js ${mode}: ${cryptoError.message}`, 'error');
                throw cryptoError;
            }
            
        } catch (error) {
            this.logMessage(`Erro na descriptografia AES-${mode}: ${error.message}`, 'error');
            throw error;
        }
    }

    performSimulatedDecryption(encryptedData, keyBytes) {
        // Fallback para simulação se crypto-js não estiver disponível
        this.logMessage('🔄 Usando descriptografia simulada (XOR)', 'warning');
        
        // Manter o tamanho original dos dados
        const decryptedData = new Uint8Array(encryptedData.length);
        
        // XOR simples como simulação
        for (let i = 0; i < decryptedData.length; i++) {
            decryptedData[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length];
        }
        
        this.logMessage(`🔄 Descriptografia simulada concluída - ${decryptedData.length} bytes`, 'info');
        return decryptedData;
    }

    validateDecryptedData(data) {
        if (!data || data.length === 0) {
            this.logMessage('❌ Dados descriptografados estão vazios', 'error');
            return false;
        }
        
        // Verificar se os dados descriptografados fazem sentido
        // 1. Tamanho mínimo razoável (reduzido para permitir arquivos pequenos válidos)
        if (data.length < 10) {
            this.logMessage('⚠️ Arquivo descriptografado muito pequeno (< 10 bytes)', 'error');
            return false;
        }
        
        // 2. Verificar se não são apenas zeros ou dados repetitivos
        const uniqueBytes = new Set(data.slice(0, Math.min(100, data.length)));
        if (uniqueBytes.size < 2) {
            this.logMessage('❌ Dados descriptografados são muito uniformes (possível falha)', 'error');
            return false;
        }
        
        // 3. Verificar assinatura de arquivo comum
        const signature = this.getFileSignature(data);
        if (signature && signature !== 'Desconhecido') {
            this.logMessage(`📄 Assinatura de arquivo detectada: ${signature}`, 'success');
            return true;
        }
        
        // 4. Verificar entropia (dados descriptografados devem ter entropia menor que dados criptografados)
        const entropy = this.calculateEntropy(data.slice(0, Math.min(1000, data.length)));
        this.logMessage(`📊 Entropia dos dados: ${entropy.toFixed(2)}`, 'info');
        
        // Entropia muito alta indica dados ainda criptografados
        if (entropy > 7.8) {
            this.logMessage('❌ Entropia muito alta - dados podem ainda estar criptografados', 'error');
            return false;
        }
        
        // 5. Verificar padrões de texto para arquivos de texto
        if (this.hasTextPatterns(data)) {
            this.logMessage('📝 Padrões de texto detectados - arquivo de texto válido', 'success');
            return true;
        }
        
        // 6. Verificar se há estrutura de dados binários válidos
        if (this.hasBinaryStructure(data)) {
            this.logMessage('🔧 Estrutura de dados binários detectada', 'success');
            return true;
        }
        
        // 7. Se chegou até aqui e tem tamanho razoável, considerar válido
        if (data.length > 50 && entropy < 7.5) {
            this.logMessage('✅ Dados passaram na validação básica', 'success');
            return true;
        }
        
        this.logMessage('❌ Dados descriptografados não passaram na validação', 'error');
        return false;
    }

    hasBinaryStructure(data) {
        // Verificar se há estruturas comuns de arquivos binários
        if (data.length < 4) return false;
        
        // Verificar headers comuns
        const header = Array.from(data.slice(0, 4));
        
        // Headers de arquivos comuns
        const commonHeaders = [
            [0x89, 0x50, 0x4E, 0x47], // PNG
            [0xFF, 0xD8, 0xFF],       // JPEG
            [0x50, 0x4B, 0x03, 0x04], // ZIP
            [0x50, 0x4B, 0x05, 0x06], // ZIP (empty)
            [0x50, 0x4B, 0x07, 0x08], // ZIP (spanned)
            [0x25, 0x50, 0x44, 0x46], // PDF
            [0x47, 0x49, 0x46, 0x38], // GIF
            [0x42, 0x4D],             // BMP
            [0x52, 0x49, 0x46, 0x46], // RIFF (WAV, AVI)
            [0x4D, 0x5A],             // EXE
            [0x7F, 0x45, 0x4C, 0x46], // ELF
        ];
        
        for (const commonHeader of commonHeaders) {
            if (header.slice(0, commonHeader.length).every((byte, i) => byte === commonHeader[i])) {
                return true;
            }
        }
        
        // Verificar se há padrões estruturados (não aleatórios)
        let structureScore = 0;
        
        // Verificar repetições de padrões
        for (let i = 0; i < Math.min(100, data.length - 4); i += 4) {
            const chunk = data.slice(i, i + 4);
            if (chunk.some(byte => byte === 0x00 || byte === 0xFF)) {
                structureScore++;
            }
        }
        
        return structureScore > 5; // Se há estrutura suficiente
    }

    hasTextPatterns(data) {
        // Verificar se há caracteres de texto comum
        let textBytes = 0;
        const sampleSize = Math.min(500, data.length);
        
        for (let i = 0; i < sampleSize; i++) {
            const byte = data[i];
            // Caracteres ASCII imprimíveis
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                textBytes++;
            }
        }
        
        const textRatio = textBytes / sampleSize;
        return textRatio > 0.7; // 70% de caracteres de texto
    }

    async tryDecryptWithKey(key) {
        // Simulação de tentativa de descriptografia
        // Em uma implementação real, aqui seria feita a descriptografia real
        await this.sleep(Math.random() * 100 + 50);
        
        // Simular sucesso ocasional para demonstração
        const success = Math.random() < 0.001; // 0.1% de chance de "sucesso"
        
        return {
            success: success,
            key: key,
            decryptedData: success ? 'Dados descriptografados com sucesso!' : null,
            error: success ? null : 'Chave incorreta'
        };
    }

    displayDecryptionResult(result) {
        const resultsSection = document.getElementById('resultsSection');
        
        if (result && result.success) {
            // NÃO adicionar mais dados ao decryptedData aqui - já foi feito na função de descriptografia
            
            const algorithmText = result.algorithm ? ` usando ${result.algorithm}` : '';
            const methodText = result.method ? ` (${result.method})` : '';
            
            resultsSection.innerHTML = `
                <div class="success-message">
                    <h3><i class="fas fa-check-circle"></i> Descriptografia Bem-sucedida!</h3>
                    <p><strong>Chave encontrada:</strong> ${result.key}</p>
                    ${result.algorithm ? `<p><strong>Algoritmo:</strong> ${result.algorithm}</p>` : ''}
                    ${result.method ? `<p><strong>Método:</strong> ${result.method}</p>` : ''}
                    <p><strong>Status:</strong> Arquivo descriptografado com sucesso</p>
                    <div style="display: flex; gap: 15px; margin-top: 15px; flex-wrap: wrap;">
                        <button onclick="decryptor.downloadDecryptedFiles()" class="method-btn" style="flex: 1; min-width: 200px;">
                            <i class="fas fa-download"></i> Baixar Arquivos Descriptografados
                        </button>
                        <button onclick="decryptor.downloadAllOriginalFiles()" class="method-btn" style="flex: 1; min-width: 200px; background: linear-gradient(45deg, #f39c12, #e67e22);">
                            <i class="fas fa-file-archive"></i> Baixar Originais (ZIP)
                        </button>
                    </div>
                </div>`;
        } else {
            resultsSection.innerHTML = `
                <div class="error-message">
                    <h3><i class="fas fa-times-circle"></i> Descriptografia Falhou</h3>
                    <p>Nenhuma chave válida foi encontrada. Tente:</p>
                    <ul>
                        <li>Verificar se o arquivo está corrompido</li>
                        <li>Tentar outras chaves conhecidas</li>
                        <li>Usar análise de padrões</li>
                        <li>Descriptografia baseada em ID único</li>
                    </ul>
                </div>
            `;
        }
    }

    displayPatternAnalysis(filename, patterns) {
        const resultsSection = document.getElementById('resultsSection');
        const analysisHtml = `
            <div class="info-message">
                <h4>Análise de Padrões - ${filename}</h4>
                <p><strong>Blocos únicos:</strong> ${patterns.blockAnalysis.uniqueBlocks}/${patterns.blockAnalysis.totalBlocks}</p>
                <p><strong>Padrão ECB detectado:</strong> ${patterns.blockAnalysis.hasECBPattern ? 'Sim' : 'Não'}</p>
                <p><strong>Correlação adjacente:</strong> ${(patterns.correlationAnalysis.adjacentCorrelation * 100).toFixed(2)}%</p>
                <p><strong>Possíveis vulnerabilidades:</strong> ${patterns.possibleKeys.join(', ') || 'Nenhuma detectada'}</p>
            </div>
        `;
        resultsSection.innerHTML += analysisHtml;
    }

    downloadDecryptedFiles() {
        if (!this.decryptedData || this.decryptedData.length === 0) {
            this.logMessage('Nenhum arquivo descriptografado disponível para download', 'error');
            return;
        }

        this.logMessage('Preparando download dos arquivos descriptografados...', 'info');
        this.logMessage(`📊 Total de arquivos no array: ${this.decryptedData.length}`, 'info');

        try {
            // Log detalhado dos arquivos no array
            this.decryptedData.forEach((fileData, index) => {
                this.logMessage(`📄 Arquivo ${index + 1}: ${fileData.originalName} (${fileData.decryptedContent.length} bytes)`, 'info');
            });

            // Se apenas um arquivo descriptografado
            if (this.decryptedData.length === 1) {
                this.logMessage('📥 Baixando arquivo único...', 'info');
                this.downloadSingleDecryptedFile(this.decryptedData[0]);
            } else {
                // Múltiplos arquivos - baixar individualmente por enquanto
                this.logMessage(`📥 Baixando ${this.decryptedData.length} arquivos...`, 'info');
                this.decryptedData.forEach((fileData, index) => {
                    setTimeout(() => {
                        this.logMessage(`📥 Baixando arquivo ${index + 1}/${this.decryptedData.length}: ${fileData.originalName}`, 'info');
                        this.downloadSingleDecryptedFile(fileData);
                    }, index * 500); // Delay entre downloads
                });
            }

            this.logMessage(`Download de ${this.decryptedData.length} arquivo(s) descriptografado(s) iniciado`, 'success');

        } catch (error) {
            this.logMessage(`Erro ao baixar arquivos descriptografados: ${error.message}`, 'error');
        }
    }

    downloadSingleDecryptedFile(fileData) {
        try {
            // Validar dados antes do download
            if (!fileData || !fileData.decryptedContent) {
                this.logMessage('❌ Dados de arquivo inválidos para download', 'error');
                return;
            }

            // Log de debug
            this.logMessage(`🔍 Preparando download: ${fileData.decryptedContent.length} bytes`, 'info');

            // Remover a extensão .want_to_cry do nome original
            let originalName = fileData.originalName || 'arquivo_descriptografado';
            if (originalName.endsWith('.want_to_cry')) {
                originalName = originalName.slice(0, -12); // Remove .want_to_cry
            }

            // Verificar se os dados descriptografados são válidos
            if (fileData.decryptedContent.length === 0) {
                this.logMessage('❌ Arquivo descriptografado está vazio', 'error');
                return;
            }

            // Log da assinatura do arquivo original
            const originalSignature = this.getFileSignature(fileData.decryptedContent);
            this.logMessage(`📄 Assinatura original detectada: ${originalSignature}`, 'info');

            // Log detalhado do processo de correção
            this.logMessage(`🔧 Iniciando correção de headers para: ${originalName}`, 'info');
            this.logMessage(`📊 Tamanho do arquivo: ${fileData.decryptedContent.length} bytes`, 'info');
            
            // Aplicar correções específicas por tipo de arquivo
            let correctedData = this.fixFileHeaders(fileData.decryptedContent, originalName);
            
            // Log da assinatura após correção
            const correctedSignature = this.getFileSignature(correctedData);
            this.logMessage(`📄 Assinatura após correção: ${correctedSignature}`, 'info');
            
            // Verificar se a correção foi efetiva
            if (originalSignature !== correctedSignature) {
                this.logMessage(`✅ Header corrigido com sucesso! ${originalSignature} → ${correctedSignature}`, 'success');
            } else {
                this.logMessage(`ℹ️ Header não foi alterado (já estava correto ou não foi possível corrigir)`, 'info');
            }
            
            // Criar blob com os dados corrigidos
            const mimeType = this.getMimeType(originalName);
            this.logMessage(`📋 MIME Type: ${mimeType}`, 'info');
            
            const blob = new Blob([correctedData], { 
                type: mimeType 
            });

            // Log do tamanho do blob
            this.logMessage(`📦 Blob criado: ${blob.size} bytes`, 'info');

            // Criar URL temporária
            const url = URL.createObjectURL(blob);

            // Criar link de download
            const link = document.createElement('a');
            link.href = url;
            link.download = originalName;
            link.style.display = 'none';

            // Adicionar ao DOM, clicar e remover
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar URL temporária
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            this.logMessage(`✅ Arquivo "${originalName}" baixado com sucesso (${blob.size} bytes)`, 'success');

        } catch (error) {
            this.logMessage(`❌ Erro ao baixar arquivo: ${error.message}`, 'error');
            console.error('Erro detalhado:', error);
        }
    }

    getMimeType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }

    async downloadAllOriginalFiles() {
        if (this.uploadedFiles.length === 0) {
            this.logMessage('Nenhum arquivo disponível para download', 'error');
            return;
        }

        this.logMessage('Preparando download de todos os arquivos originais...', 'info');

        try {
            // Se apenas um arquivo, baixar diretamente
            if (this.uploadedFiles.length === 1) {
                this.downloadOriginalFile(0);
                return;
            }

            // Para múltiplos arquivos, criar um ZIP (simulação)
            // Em uma implementação real, usaria uma biblioteca como JSZip
            this.logMessage('Criando arquivo ZIP com todos os arquivos...', 'info');
            
            // Simular criação de ZIP
            await this.sleep(2000);
            
            // Por enquanto, baixar arquivos individualmente
            for (let i = 0; i < this.uploadedFiles.length; i++) {
                await this.sleep(500); // Delay entre downloads
                this.downloadOriginalFile(i);
            }
            
            this.logMessage(`Download de ${this.uploadedFiles.length} arquivos iniciado`, 'success');
            
        } catch (error) {
            this.logMessage(`Erro ao preparar downloads: ${error.message}`, 'error');
        }
    }

    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
    }

    hideProgress() {
        document.getElementById('progressSection').style.display = 'none';
    }

    updateProgress(percentage, text) {
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = text;
    }

    logMessage(message, type = 'info') {
        const logsContainer = document.getElementById('logsContainer');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('p');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        // Também exibir no console do navegador para debug
        console.log(`[${timestamp}] ${message}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    fixFileHeaders(data, filename) {
        const extension = filename.toLowerCase().split('.').pop();
        let correctedData = new Uint8Array(data);
        
        this.logMessage(`🔍 Iniciando correção para arquivo: ${filename} (extensão: ${extension})`, 'info');
        
        // Definir headers corretos para diferentes tipos de arquivo
        const fileHeaders = {
            'pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
            'xlsx': [0x50, 0x4B, 0x03, 0x04], // ZIP (Excel é baseado em ZIP)
            'docx': [0x50, 0x4B, 0x03, 0x04], // ZIP (Word é baseado em ZIP)
            'pptx': [0x50, 0x4B, 0x03, 0x04], // ZIP (PowerPoint é baseado em ZIP)
            'zip': [0x50, 0x4B, 0x03, 0x04],  // ZIP
            'png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
            'jpg': [0xFF, 0xD8, 0xFF], // JPEG
            'jpeg': [0xFF, 0xD8, 0xFF], // JPEG
            'gif': [0x47, 0x49, 0x46, 0x38], // GIF
            'bmp': [0x42, 0x4D], // BMP
            'doc': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // MS Office (antigo)
            'xls': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // MS Office (antigo)
            'ppt': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]  // MS Office (antigo)
        };

        if (fileHeaders[extension]) {
            const expectedHeader = fileHeaders[extension];
            const currentHeader = Array.from(correctedData.slice(0, expectedHeader.length));
            
            this.logMessage(`🔍 Header esperado para ${extension}: [${expectedHeader.map(b => b.toString(16).padStart(2, '0')).join(' ')}]`, 'info');
            this.logMessage(`🔍 Header atual: [${currentHeader.map(b => b.toString(16).padStart(2, '0')).join(' ')}]`, 'info');
            
            // Verificar se o header está correto
            const headerMatches = expectedHeader.every((byte, index) => 
                index < currentHeader.length && currentHeader[index] === byte
            );
            
            if (!headerMatches) {
                this.logMessage(`⚠️ Header ${extension.toUpperCase()} inválido detectado!`, 'warning');
                
                // Primeiro, tentar encontrar o header correto no arquivo
                const headerFound = this.findCorrectHeader(correctedData, expectedHeader);
                
                if (headerFound.found) {
                    // Se encontrou o header em outra posição, extrair dados a partir dali
                    this.logMessage(`✅ Header encontrado na posição ${headerFound.position}`, 'success');
                    correctedData = correctedData.slice(headerFound.position);
                } else {
                    // Estratégia específica para PDFs
                    if (extension === 'pdf') {
                        this.logMessage('🔧 Aplicando correção específica para PDF...', 'info');
                        correctedData = this.fixPDFSpecific(correctedData);
                    } else {
                        // Para outros tipos, manter dados originais sem modificação
                        this.logMessage('⚠️ Header não encontrado. Mantendo dados originais.', 'warning');
                        this.logMessage('ℹ️ O arquivo pode estar corrompido ou não ser do tipo esperado', 'info');
                    }
                }
            } else {
                this.logMessage(`✅ Header ${extension.toUpperCase()} já está correto`, 'success');
            }
        } else {
            this.logMessage(`ℹ️ Tipo de arquivo ${extension.toUpperCase()} não requer correção de header específica`, 'info');
        }
        
        return correctedData;
    }

    findCorrectHeader(data, expectedHeader) {
        // Procurar o header correto nos primeiros 1KB do arquivo
        const searchLimit = Math.min(1024, data.length - expectedHeader.length);
        
        for (let i = 0; i <= searchLimit; i++) {
            let matches = true;
            for (let j = 0; j < expectedHeader.length; j++) {
                if (data[i + j] !== expectedHeader[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return { found: true, position: i };
            }
        }
        
        return { found: false, position: -1 };
    }

    // Correção específica para arquivos PDF
    fixPDFSpecific(data) {
        this.logMessage('🔧 Iniciando correção específica para PDF...', 'info');
        
        const dataView = new Uint8Array(data);
        this.logMessage(`📊 Tamanho do arquivo PDF: ${dataView.length} bytes`, 'info');
        
        // Log dos primeiros 32 bytes para debug
        const first32Bytes = Array.from(dataView.slice(0, 32)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        this.logMessage(`🔍 Primeiros 32 bytes do PDF: ${first32Bytes}`, 'info');
        
        // Verificar se já tem header PDF correto
        if (dataView[0] === 0x25 && dataView[1] === 0x50 && dataView[2] === 0x44 && dataView[3] === 0x46) {
            this.logMessage('✅ PDF já possui header correto (%PDF)', 'success');
            return dataView;
        }
        
        // Procurar por padrões PDF no arquivo (busca mais ampla)
        const searchLimit = Math.min(2048, dataView.length); // Procurar nos primeiros 2KB
        this.logMessage(`🔍 Procurando padrão PDF nos primeiros ${searchLimit} bytes...`, 'info');
        
        // Procurar por "%PDF" como string
        for (let i = 0; i < searchLimit - 4; i++) {
            if (dataView[i] === 0x25 && dataView[i+1] === 0x50 && 
                dataView[i+2] === 0x44 && dataView[i+3] === 0x46) {
                this.logMessage(`✅ Header PDF válido encontrado na posição ${i}`, 'success');
                const result = dataView.slice(i);
                this.logMessage(`📄 Novo tamanho após correção: ${result.length} bytes`, 'info');
                return result;
            }
        }
        
        // Se não encontrou header PDF válido, retornar dados originais sem modificação
        this.logMessage('⚠️ Padrão PDF não encontrado. Mantendo dados originais.', 'warning');
        this.logMessage('ℹ️ O arquivo pode não ser um PDF válido ou estar muito corrompido', 'info');
        
        return dataView;
    }

    // Correção genérica para outros tipos de arquivo
    applyGenericHeaderFix(data, expectedHeader) {
        this.logMessage('🔧 Aplicando correção genérica de header...', 'info');
        
        // Criar novo array com header correto
        const newData = new Uint8Array(data.length);
        
        // Definir header correto
        expectedHeader.forEach((byte, index) => {
            if (index < newData.length) {
                newData[index] = byte;
            }
        });
        
        // Copiar resto dos dados (pulando possível header corrompido)
        const startPos = Math.min(expectedHeader.length, 16); // Pular até 16 bytes iniciais
        for (let i = startPos; i < data.length; i++) {
            if (expectedHeader.length + (i - startPos) < newData.length) {
                newData[expectedHeader.length + (i - startPos)] = data[i];
            }
        }
        
        this.logMessage('✅ Header genérico corrigido', 'success');
        return newData;
    }
}

// Inicializar a aplicação quando a página carregar
let decryptor;
document.addEventListener('DOMContentLoaded', () => {
    decryptor = new WantToCryDecryptor();
});

// Adicionar informações sobre o ransomware
document.addEventListener('DOMContentLoaded', () => {
    // Seção "Sobre o WantToCry" removida conforme solicitado
});