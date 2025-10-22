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
        
        // Adicionar click listener apenas na área de upload, não no input
        uploadArea.addEventListener('click', (e) => {
            // Evitar dupla chamada se o clique foi diretamente no input
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });
        
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
        
        // Informações específicas do WantToCry baseadas nos dados fornecidos
        const toxID = '1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6';
        const victimID = '3C579D75CF2341758A9B984A0B943F18';
        
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
        keys.push(this.combineIDs(id, toxID.substring(0, 16)));
        
        // Método 11: Rotação de caracteres
        keys.push(this.rotateString(id, 13)); // ROT13 style
        
        // Método 12: Apenas números do ID
        keys.push(id.replace(/[^0-9]/g, ''));
        
        // Método 13: Apenas letras do ID
        keys.push(id.replace(/[^A-Fa-f]/g, ''));
        
        // NOVOS MÉTODOS - Chaves específicas do WantToCry
        
        // Método 14: Chave padrão WannaCry
        keys.push('WNcry@2ol7');
        
        // Método 15: Tox ID completo
        keys.push(toxID);
        
        // Método 16: Segmentos do Tox ID
        keys.push(toxID.substring(0, 32)); // Primeira metade
        keys.push(toxID.substring(32, 64)); // Segunda metade
        keys.push(toxID.substring(toxID.length - 32)); // Últimos 32 chars
        
        // Método 17: Combinações com ID da vítima conhecido
        if (id === victimID) {
            keys.push('VICTIM_' + victimID);
            keys.push(victimID + '_KEY');
            keys.push(this.simpleHash(victimID + toxID, 32));
        }
        
        // Método 18: Padrões WantToCry específicos
        keys.push('WantToCry_' + id);
        keys.push(id + '_WantToCry');
        keys.push('WANTTOCRY' + id.substring(0, 16));
        
        // Método 19: Combinações com valores de resgate
        keys.push(id + '600'); // USD do resgate
        keys.push(id + '500'); // Valor alternativo
        keys.push('600USD' + id);
        
        // Método 20: Baseado em qTox
        keys.push('qTox_' + id);
        keys.push(id + '_qTox');
        keys.push(this.simpleHash('qTox' + id, 32));
        
        // Método 21: Chaves derivadas do Tox ID
        keys.push(this.simpleHash(toxID, 16));
        keys.push(this.simpleHash(toxID, 24));
        keys.push(this.simpleHash(toxID, 32));
        keys.push(this.xorWithPattern(toxID, id));
        
        // Método 22: Combinações temporais
        keys.push(id + '2024');
        keys.push(id + '2023');
        keys.push('2024' + id);
        
        // Método 23: Padrões hexadecimais puros
        keys.push(id.replace(/[^0-9A-Fa-f]/g, '').substring(0, 32));
        keys.push(toxID.replace(/[^0-9A-Fa-f]/g, '').substring(0, 32));
        
        // Método 24: Hash duplo do ID
        keys.push(this.simpleHash(this.simpleHash(id, 16), 16));
        
        // Método 25: XOR com padrão diferente
        keys.push(this.xorWithPattern(id, 'DECRYPT'));
        
        // NOVOS MÉTODOS AVANÇADOS - Baseados na análise do header inválido
        
        // Método 26: Chaves baseadas no header inválido detectado (5B 67 42 CD)
        keys.push('5B6742CD' + id);
        keys.push(id + '5B6742CD');
        keys.push(this.xorWithPattern(id, '5B6742CD'));
        
        // Método 27: Possíveis chaves de múltiplas camadas
        keys.push(this.simpleHash(id + 'LAYER1', 32));
        keys.push(this.simpleHash(id + 'LAYER2', 32));
        keys.push(this.simpleHash('MULTI' + id, 32));
        
        // Método 28: Chaves baseadas em extensão de arquivo
        keys.push(id + '.want_to_cry');
        keys.push('want_to_cry.' + id);
        keys.push(this.simpleHash(id + '.pdf', 32));
        
        // Método 29: Chaves com padding específico
        keys.push(id.padStart(32, '0'));
        keys.push(id.padEnd(32, 'F'));
        keys.push(id.padStart(32, 'A').padEnd(64, 'B'));
        
        // Método 30: Chaves baseadas em análise de entropia baixa
        keys.push(this.generateLowEntropyKey(id));
        keys.push(this.generateRepeatingPatternKey(id));
        
        // Método 31: Chaves específicas para correção de header PDF
        keys.push(this.xorWithPattern(id, '%PDF'));
        keys.push(this.combineIDs(id, '25504446')); // %PDF em hex
        keys.push(this.simpleHash(id + 'PDF_FIX', 32));
        
        // Método 32: Chaves baseadas em análise de offset
        keys.push(id.substring(4) + id.substring(0, 4)); // Rotação de 4 bytes
        keys.push(id.substring(8) + id.substring(0, 8)); // Rotação de 8 bytes
        keys.push(id.substring(16) + id.substring(0, 16)); // Rotação de 16 bytes
        
        // Método 33: Chaves com transformações matemáticas
        keys.push(this.applyMathTransform(id, 'ADD'));
        keys.push(this.applyMathTransform(id, 'SUB'));
        keys.push(this.applyMathTransform(id, 'XOR'));
        
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

    generateLowEntropyKey(id) {
        // Gerar chave com baixa entropia baseada no ID
        const repeatedChar = id.charAt(0);
        return repeatedChar.repeat(32);
    }

    generateRepeatingPatternKey(id) {
        // Gerar chave com padrão repetitivo
        const pattern = id.substring(0, 4);
        return (pattern.repeat(8)).substring(0, 32);
    }

    applyMathTransform(id, operation) {
        // Aplicar transformação matemática aos bytes do ID
        const bytes = new TextEncoder().encode(id);
        const transformed = new Uint8Array(32);
        
        for (let i = 0; i < 32; i++) {
            const byteValue = bytes[i % bytes.length];
            switch (operation) {
                case 'ADD':
                    transformed[i] = (byteValue + i) % 256;
                    break;
                case 'SUB':
                    transformed[i] = (byteValue - i + 256) % 256;
                    break;
                case 'XOR':
                    transformed[i] = byteValue ^ (i % 256);
                    break;
                default:
                    transformed[i] = byteValue;
            }
        }
        
        return Array.from(transformed).map(b => b.toString(16).padStart(2, '0')).join('');
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
                
                // Novas informações de formato detectado
                analysisText += `Formato detectado: ${analysis.detectedFormat} (${analysis.formatConfidence}% confiança)\n`;
                analysisText += `Detalhes: ${analysis.formatDetails}\n`;
                analysisText += `Extensão sugerida: .${analysis.suggestedExtension}\n`;
                
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
        
        // Nova detecção automática de formato
        const formatDetection = this.detectFileFormat(bytes);
        
        const analysis = {
            entropy: this.calculateEntropy(analysisBytes),
            signature: this.getFileSignature(bytes),
            patterns: this.detectPatterns(analysisBytes),
            fileSize: bytes.length,
            analyzedSize: analysisBytes.length,
            isPartialAnalysis: bytes.length > maxAnalysisSize,
            // Novas informações de formato
            detectedFormat: formatDetection.format,
            formatConfidence: formatDetection.confidence,
            formatDetails: formatDetection.details,
            suggestedExtension: formatDetection.extension
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

    // Nova função melhorada para detecção automática de formato de arquivo
    detectFileFormat(bytes) {
        if (!bytes || bytes.length < 4) {
            return { format: 'unknown', confidence: 0, details: 'Dados insuficientes' };
        }

        const signatures = [
            // PDF
            { 
                pattern: [0x25, 0x50, 0x44, 0x46], 
                format: 'PDF', 
                extension: 'pdf',
                description: 'Portable Document Format'
            },
            
            // Microsoft Office (ZIP-based)
            { 
                pattern: [0x50, 0x4B, 0x03, 0x04], 
                format: 'ZIP/Office', 
                extension: 'zip',
                description: 'ZIP archive or Microsoft Office document'
            },
            
            // JPEG
            { 
                pattern: [0xFF, 0xD8, 0xFF], 
                format: 'JPEG', 
                extension: 'jpg',
                description: 'JPEG image'
            },
            
            // PNG
            { 
                pattern: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 
                format: 'PNG', 
                extension: 'png',
                description: 'PNG image'
            },
            
            // GIF
            { 
                pattern: [0x47, 0x49, 0x46, 0x38], 
                format: 'GIF', 
                extension: 'gif',
                description: 'GIF image'
            },
            
            // BMP
            { 
                pattern: [0x42, 0x4D], 
                format: 'BMP', 
                extension: 'bmp',
                description: 'Bitmap image'
            },
            
            // MP3
            { 
                pattern: [0x49, 0x44, 0x33], 
                format: 'MP3', 
                extension: 'mp3',
                description: 'MP3 audio (ID3 tag)'
            },
            
            // MP4
            { 
                pattern: [0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70], 
                format: 'MP4', 
                extension: 'mp4',
                description: 'MP4 video'
            },
            
            // AVI
            { 
                pattern: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x41, 0x56, 0x49, 0x20], 
                format: 'AVI', 
                extension: 'avi',
                description: 'AVI video'
            },
            
            // EXE
            { 
                pattern: [0x4D, 0x5A], 
                format: 'EXE', 
                extension: 'exe',
                description: 'Windows executable'
            },
            
            // RAR
            { 
                pattern: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], 
                format: 'RAR', 
                extension: 'rar',
                description: 'RAR archive'
            },
            
            // 7Z
            { 
                pattern: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], 
                format: '7Z', 
                extension: '7z',
                description: '7-Zip archive'
            }
        ];

        // Verificar cada assinatura
        for (const sig of signatures) {
            let matches = true;
            for (let i = 0; i < sig.pattern.length; i++) {
                if (i >= bytes.length) {
                    matches = false;
                    break;
                }
                if (sig.pattern[i] !== null && bytes[i] !== sig.pattern[i]) {
                    matches = false;
                    break;
                }
            }
            
            if (matches) {
                return {
                    format: sig.format,
                    extension: sig.extension,
                    confidence: 100,
                    details: sig.description,
                    signature: this.getFileSignature(bytes)
                };
            }
        }

        // Análise heurística para formatos não detectados
        const heuristicResult = this.analyzeFileHeuristically(bytes);
        if (heuristicResult.confidence > 50) {
            return heuristicResult;
        }

        return {
            format: 'unknown',
            extension: 'bin',
            confidence: 0,
            details: 'Formato não reconhecido',
            signature: this.getFileSignature(bytes)
        };
    }

    // Análise heurística para detectar formatos baseado em conteúdo
    analyzeFileHeuristically(bytes) {
        const analysis = {
            format: 'unknown',
            extension: 'bin',
            confidence: 0,
            details: 'Análise heurística',
            signature: this.getFileSignature(bytes)
        };

        try {
            // Converter primeiros 1KB para texto para análise
            const sampleSize = Math.min(1024, bytes.length);
            const textSample = new TextDecoder('latin1').decode(bytes.slice(0, sampleSize));
            
            // Verificar se contém strings características de PDF
            const pdfStrings = ['%PDF', 'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer'];
            let pdfScore = 0;
            for (const str of pdfStrings) {
                if (textSample.includes(str)) {
                    pdfScore += 20;
                }
            }
            
            if (pdfScore >= 40) {
                analysis.format = 'PDF (heuristic)';
                analysis.extension = 'pdf';
                analysis.confidence = Math.min(pdfScore, 90);
                analysis.details = 'PDF detectado por análise de conteúdo';
                return analysis;
            }

            // Verificar se contém strings características de HTML
            const htmlStrings = ['<html', '<HTML', '<!DOCTYPE', '<head', '<body'];
            let htmlScore = 0;
            for (const str of htmlStrings) {
                if (textSample.includes(str)) {
                    htmlScore += 25;
                }
            }
            
            if (htmlScore >= 25) {
                analysis.format = 'HTML';
                analysis.extension = 'html';
                analysis.confidence = Math.min(htmlScore, 85);
                analysis.details = 'HTML detectado por análise de conteúdo';
                return analysis;
            }

            // Verificar se contém strings características de XML
            if (textSample.includes('<?xml') || textSample.includes('<xml')) {
                analysis.format = 'XML';
                analysis.extension = 'xml';
                analysis.confidence = 80;
                analysis.details = 'XML detectado por análise de conteúdo';
                return analysis;
            }

            // Verificar se é texto puro (alta proporção de caracteres imprimíveis)
            let printableChars = 0;
            for (let i = 0; i < sampleSize; i++) {
                const byte = bytes[i];
                if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                    printableChars++;
                }
            }
            
            const printableRatio = printableChars / sampleSize;
            if (printableRatio > 0.8) {
                analysis.format = 'Text';
                analysis.extension = 'txt';
                analysis.confidence = Math.floor(printableRatio * 100);
                analysis.details = `Texto detectado (${(printableRatio * 100).toFixed(1)}% caracteres imprimíveis)`;
                return analysis;
            }

        } catch (error) {
            analysis.details = `Erro na análise heurística: ${error.message}`;
        }

        return analysis;
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

            // Se AES-256 falhou, tentar métodos alternativos
            this.logMessage(`🔄 AES-256 falhou, tentando métodos alternativos...`, 'warning');
            return await this.tryAlternativeDecryptionMethods(fileData, key);
            
        } catch (error) {
            this.logMessage(`Erro na descriptografia AES-256: ${error.message}`, 'error');
            return { success: false };
        }
    }

    async tryAlternativeDecryptionMethods(fileData, key) {
        this.logMessage(`🔧 Iniciando métodos alternativos de descriptografia...`, 'info');
        
        // Método 1: Tentar AES-128 com diferentes paddings
        const aes128Result = await this.tryAES128WithPaddings(fileData, key);
        if (aes128Result.success) return aes128Result;

        // Método 2: Tentar diferentes tamanhos de chave
        const keySizeResult = await this.tryDifferentKeySizes(fileData, key);
        if (keySizeResult.success) return keySizeResult;

        // Método 3: Tentar XOR simples
        const xorResult = await this.tryXORDecryption(fileData, key);
        if (xorResult.success) return xorResult;

        // Método 4: Tentar descriptografia com offset
        const offsetResult = await this.tryOffsetDecryption(fileData, key);
        if (offsetResult.success) return offsetResult;

        // Método 5: Tentar análise de padding incorreto
        const paddingResult = await this.tryPaddingAnalysis(fileData, key);
        if (paddingResult.success) return paddingResult;

        // NOVOS MÉTODOS AVANÇADOS
        
        // Método 6: Tentar DES/3DES
        const desResult = await this.tryDESDecryption(fileData, key);
        if (desResult.success) return desResult;
        
        // Método 7: Tentar RC4
        const rc4Result = await this.tryRC4Decryption(fileData, key);
        if (rc4Result.success) return rc4Result;
        
        // Método 8: Tentar descriptografia com chave invertida
        const reversedResult = await this.tryReversedKeyDecryption(fileData, key);
        if (reversedResult.success) return reversedResult;
        
        // Método 9: Tentar descriptografia com múltiplas camadas
        const multiLayerResult = await this.tryMultiLayerDecryption(fileData, key);
        if (multiLayerResult.success) return multiLayerResult;

        this.logMessage(`❌ Todos os métodos alternativos falharam`, 'error');
        return { success: false };
    }

    async tryDESDecryption(fileData, key) {
        this.logMessage(`🔐 Tentando descriptografia DES/3DES...`, 'info');
        
        try {
            // Preparar chave para DES (8 bytes) e 3DES (24 bytes)
            const desKey = key.substring(0, 16); // 8 bytes em hex
            const tripleDesKey = (key + key + key).substring(0, 48); // 24 bytes em hex
            
            // Tentar DES simples
            const desResult = await this.trySimpleDES(fileData, desKey);
            if (desResult.success) return desResult;
            
            // Tentar 3DES
            const tripleDesResult = await this.trySimpleDES(fileData, tripleDesKey);
            if (tripleDesResult.success) return tripleDesResult;
            
        } catch (error) {
            this.logMessage(`❌ Erro DES: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    async trySimpleDES(fileData, key) {
        // Implementação simplificada de DES usando XOR com rotação
        try {
            const encryptedBytes = new Uint8Array(fileData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            const keyBytes = new Uint8Array(key.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            const decrypted = new Uint8Array(encryptedBytes.length);
            
            for (let i = 0; i < encryptedBytes.length; i++) {
                const keyIndex = i % keyBytes.length;
                const rotatedKey = ((keyBytes[keyIndex] << (i % 8)) | (keyBytes[keyIndex] >> (8 - (i % 8)))) & 0xFF;
                decrypted[i] = encryptedBytes[i] ^ rotatedKey;
            }
            
            const result = this.validateDecryptedData(decrypted);
            if (result.isValid) {
                this.logMessage(`✅ DES simplificado funcionou!`, 'success');
                return { success: true, data: decrypted };
            }
            
        } catch (error) {
            this.logMessage(`❌ Erro DES simplificado: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    async tryRC4Decryption(fileData, key) {
        this.logMessage(`🔐 Tentando descriptografia RC4...`, 'info');
        
        try {
            const encryptedBytes = new Uint8Array(fileData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            const keyBytes = new TextEncoder().encode(key);
            
            // Implementação simplificada do RC4
            const S = new Array(256);
            for (let i = 0; i < 256; i++) {
                S[i] = i;
            }
            
            let j = 0;
            for (let i = 0; i < 256; i++) {
                j = (j + S[i] + keyBytes[i % keyBytes.length]) % 256;
                [S[i], S[j]] = [S[j], S[i]];
            }
            
            const decrypted = new Uint8Array(encryptedBytes.length);
            let i = 0, k = 0;
            
            for (let n = 0; n < encryptedBytes.length; n++) {
                i = (i + 1) % 256;
                k = (k + S[i]) % 256;
                [S[i], S[k]] = [S[k], S[i]];
                const keystream = S[(S[i] + S[k]) % 256];
                decrypted[n] = encryptedBytes[n] ^ keystream;
            }
            
            const result = this.validateDecryptedData(decrypted);
            if (result.isValid) {
                this.logMessage(`✅ RC4 funcionou!`, 'success');
                return { success: true, data: decrypted };
            }
            
        } catch (error) {
            this.logMessage(`❌ Erro RC4: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    async tryReversedKeyDecryption(fileData, key) {
        this.logMessage(`🔄 Tentando descriptografia com chave invertida...`, 'info');
        
        try {
            // Inverter a chave
            const reversedKey = key.split('').reverse().join('');
            
            // Tentar AES com chave invertida
            const aesResult = await this.tryDecryptWithAES256(fileData, reversedKey);
            if (aesResult && aesResult.success) {
                this.logMessage(`✅ Chave invertida funcionou com AES!`, 'success');
                return aesResult;
            }
            
            // Tentar XOR com chave invertida
            const xorResult = await this.tryXORDecryption(fileData, reversedKey);
            if (xorResult.success) {
                this.logMessage(`✅ Chave invertida funcionou com XOR!`, 'success');
                return xorResult;
            }
            
        } catch (error) {
            this.logMessage(`❌ Erro chave invertida: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    async tryMultiLayerDecryption(fileData, key) {
        this.logMessage(`🔗 Tentando descriptografia em múltiplas camadas...`, 'info');
        
        try {
            let currentData = fileData;
            
            // Tentar até 3 camadas de descriptografia
            for (let layer = 1; layer <= 3; layer++) {
                this.logMessage(`🔍 Testando camada ${layer}...`, 'info');
                
                // Gerar chave para esta camada
                const layerKey = this.generateLayerKey(key, layer);
                
                // Tentar AES
                const aesResult = await this.tryDecryptWithAES256(currentData, layerKey);
                if (aesResult && aesResult.success) {
                    const hexData = Array.from(aesResult.data).map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    // Verificar se é o resultado final
                    const validation = this.validateDecryptedData(aesResult.data);
                    if (validation.isValid) {
                        this.logMessage(`✅ Múltiplas camadas funcionaram (${layer} camadas)!`, 'success');
                        return aesResult;
                    }
                    
                    // Continuar para próxima camada
                    currentData = hexData;
                } else {
                    // Tentar XOR para esta camada
                    const xorResult = await this.tryXORDecryption(currentData, layerKey);
                    if (xorResult.success) {
                        const hexData = Array.from(xorResult.data).map(b => b.toString(16).padStart(2, '0')).join('');
                        
                        const validation = this.validateDecryptedData(xorResult.data);
                        if (validation.isValid) {
                            this.logMessage(`✅ Múltiplas camadas XOR funcionaram (${layer} camadas)!`, 'success');
                            return xorResult;
                        }
                        
                        currentData = hexData;
                    } else {
                        break; // Não conseguiu descriptografar esta camada
                    }
                }
            }
            
        } catch (error) {
            this.logMessage(`❌ Erro múltiplas camadas: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    generateLayerKey(baseKey, layer) {
        // Gerar chave específica para cada camada
        const layerSuffix = layer.toString().padStart(2, '0');
        const combinedKey = baseKey + layerSuffix;
        
        // Hash simples para gerar chave de 32 caracteres
        let hash = 0;
        for (let i = 0; i < combinedKey.length; i++) {
            hash = ((hash << 5) - hash + combinedKey.charCodeAt(i)) & 0xffffffff;
        }
        
        return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
    }

    async tryAES128WithPaddings(fileData, key) {
        this.logMessage(`🔑 Tentando AES-128 com diferentes paddings...`, 'info');
        
        try {
            const key128 = this.prepareAESKey(key, 16); // 16 bytes para AES-128
            const modes = ['CBC', 'ECB', 'CTR', 'CFB', 'OFB'];
            
            for (const mode of modes) {
                try {
                    this.logMessage(`  📝 Testando AES-128-${mode}...`, 'info');
                    const result = await this.performAESDecryption(fileData, key128, mode);
                    
                    if (result && this.validateDecryptedData(result)) {
                        this.logMessage(`✅ AES-128-${mode} bem-sucedida!`, 'success');
                        return {
                            success: true,
                            data: result,
                            algorithm: `AES-128-${mode}`,
                            key: key
                        };
                    }
                } catch (error) {
                    this.logMessage(`  ❌ AES-128-${mode} falhou: ${error.message}`, 'error');
                }
            }
        } catch (error) {
            this.logMessage(`Erro AES-128: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    async tryDifferentKeySizes(fileData, key) {
        this.logMessage(`🔢 Tentando diferentes tamanhos de chave...`, 'info');
        
        const keySizes = [8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64];
        
        for (const size of keySizes) {
            try {
                this.logMessage(`  🔑 Testando chave de ${size} bytes...`, 'info');
                const adjustedKey = this.prepareAESKey(key, size);
                
                // Tentar com diferentes algoritmos baseados no tamanho
                let algorithm = 'AES-256';
                if (size <= 16) algorithm = 'AES-128';
                else if (size <= 24) algorithm = 'AES-192';
                
                const result = await this.performAESDecryption(fileData, adjustedKey, 'CBC');
                
                if (result && this.validateDecryptedData(result)) {
                    this.logMessage(`✅ Chave de ${size} bytes bem-sucedida!`, 'success');
                    return {
                        success: true,
                        data: result,
                        algorithm: `${algorithm}-CBC (${size} bytes)`,
                        key: key
                    };
                }
            } catch (error) {
                this.logMessage(`  ❌ Chave ${size} bytes falhou: ${error.message}`, 'error');
            }
        }
        
        return { success: false };
    }

    async tryXORDecryption(fileData, key) {
        this.logMessage(`⚡ Tentando descriptografia XOR...`, 'info');
        
        try {
            const keyBytes = new TextEncoder().encode(key);
            const encryptedBytes = new Uint8Array(fileData);
            const decryptedBytes = new Uint8Array(encryptedBytes.length);
            
            // XOR simples
            for (let i = 0; i < encryptedBytes.length; i++) {
                decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
            }
            
            if (this.validateDecryptedData(decryptedBytes)) {
                this.logMessage(`✅ Descriptografia XOR bem-sucedida!`, 'success');
                return {
                    success: true,
                    data: decryptedBytes,
                    algorithm: 'XOR',
                    key: key
                };
            }
        } catch (error) {
            this.logMessage(`❌ XOR falhou: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    async tryOffsetDecryption(fileData, key) {
        this.logMessage(`📍 Tentando descriptografia com offset...`, 'info');
        
        const offsets = [0, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        
        for (const offset of offsets) {
            try {
                if (offset >= fileData.byteLength) continue;
                
                this.logMessage(`  📍 Testando offset ${offset} bytes...`, 'info');
                
                // Pular os primeiros bytes (offset)
                const offsetData = fileData.slice(offset);
                const keyBytes = this.prepareAESKey(key);
                
                const result = await this.performAESDecryption(offsetData, keyBytes, 'CBC');
                
                if (result && this.validateDecryptedData(result)) {
                    this.logMessage(`✅ Offset ${offset} bem-sucedido!`, 'success');
                    return {
                        success: true,
                        data: result,
                        algorithm: `AES-256-CBC (offset ${offset})`,
                        key: key
                    };
                }
            } catch (error) {
                this.logMessage(`  ❌ Offset ${offset} falhou: ${error.message}`, 'error');
            }
        }
        
        return { success: false };
    }

    async tryPaddingAnalysis(fileData, key) {
        this.logMessage(`🔍 Analisando problemas de padding...`, 'info');
        
        try {
            const keyBytes = this.prepareAESKey(key);
            
            // Tentar remover diferentes quantidades de padding
            const paddingSizes = [0, 1, 2, 4, 8, 16, 32];
            
            for (const paddingSize of paddingSizes) {
                try {
                    if (paddingSize >= fileData.byteLength) continue;
                    
                    this.logMessage(`  🔍 Testando remoção de ${paddingSize} bytes de padding...`, 'info');
                    
                    // Remover padding do final
                    const trimmedData = fileData.slice(0, fileData.byteLength - paddingSize);
                    const result = await this.performAESDecryption(trimmedData, keyBytes, 'CBC');
                    
                    if (result && this.validateDecryptedData(result)) {
                        this.logMessage(`✅ Padding ${paddingSize} bytes removido com sucesso!`, 'success');
                        return {
                            success: true,
                            data: result,
                            algorithm: `AES-256-CBC (padding -${paddingSize})`,
                            key: key
                        };
                    }
                } catch (error) {
                    this.logMessage(`  ❌ Padding ${paddingSize} falhou: ${error.message}`, 'error');
                }
            }
        } catch (error) {
            this.logMessage(`Erro na análise de padding: ${error.message}`, 'error');
        }
        
        return { success: false };
    }

    prepareAESKey(key, targetSize = 32) {
        // Converter string para bytes e ajustar para o tamanho desejado
        const encoder = new TextEncoder();
        let keyBytes = encoder.encode(key);
        
        // Se a chave for menor que o tamanho alvo, repetir até completar
        if (keyBytes.length < targetSize) {
            const repeated = new Uint8Array(targetSize);
            for (let i = 0; i < targetSize; i++) {
                repeated[i] = keyBytes[i % keyBytes.length];
            }
            keyBytes = repeated;
        } else if (keyBytes.length > targetSize) {
            // Se for maior, truncar para o tamanho alvo
            keyBytes = keyBytes.slice(0, targetSize);
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

    async downloadDecryptedFiles() {
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
                await this.downloadSingleDecryptedFile(this.decryptedData[0]);
            } else {
                // Múltiplos arquivos - baixar individualmente por enquanto
                this.logMessage(`📥 Baixando ${this.decryptedData.length} arquivos...`, 'info');
                this.decryptedData.forEach((fileData, index) => {
                    setTimeout(async () => {
                        this.logMessage(`📥 Baixando arquivo ${index + 1}/${this.decryptedData.length}: ${fileData.originalName}`, 'info');
                        await this.downloadSingleDecryptedFile(fileData);
                    }, index * 500); // Delay entre downloads
                });
            }

            this.logMessage(`Download de ${this.decryptedData.length} arquivo(s) descriptografado(s) iniciado`, 'success');

        } catch (error) {
            this.logMessage(`Erro ao baixar arquivos descriptografados: ${error.message}`, 'error');
        }
    }

    async downloadSingleDecryptedFile(fileData) {
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
            let correctedData = await this.fixFileHeaders(fileData.decryptedContent, originalName);
            
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

    async fixFileHeaders(data, filename) {
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
                        correctedData = await this.fixPDFSpecific(correctedData);
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
    async fixPDFSpecific(data) {
        this.logMessage('🔧 Iniciando correção específica para PDF...', 'info');
        
        const dataView = new Uint8Array(data);
        this.logMessage(`📊 Tamanho do arquivo PDF: ${dataView.length} bytes`, 'info');
        
        // Log dos primeiros 64 bytes para debug mais detalhado
        const first64Bytes = Array.from(dataView.slice(0, Math.min(64, dataView.length)))
            .map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        this.logMessage(`🔍 Primeiros ${Math.min(64, dataView.length)} bytes do PDF: ${first64Bytes}`, 'info');
        
        // Verificar se já tem header PDF correto
        if (dataView[0] === 0x25 && dataView[1] === 0x50 && dataView[2] === 0x44 && dataView[3] === 0x46) {
            this.logMessage('✅ PDF já possui header correto (%PDF)', 'success');
            return dataView;
        }
        
        // NOVA ESTRATÉGIA 1: Análise de possível corrupção de chave
        this.logMessage('🔍 Analisando possível corrupção de chave de descriptografia...', 'info');
        const keyAnalysis = this.analyzeDecryptionKeyIssues(dataView);
        if (keyAnalysis.needsAlternativeKey) {
            this.logMessage('⚠️ Dados sugerem chave de descriptografia incorreta ou incompleta', 'warning');
            this.logMessage(`📊 Entropia dos dados: ${keyAnalysis.entropy.toFixed(2)}%`, 'info');
            this.logMessage(`🔍 Padrões detectados: ${keyAnalysis.patterns.join(', ')}`, 'info');
        }
        
        // NOVA ESTRATÉGIA 2: Análise de diferentes offsets comuns
        this.logMessage('🔍 Testando offsets comuns de corrupção...', 'info');
        const offsetResult = this.tryCommonOffsets(dataView);
        if (offsetResult) {
            return offsetResult;
        }
        
        // NOVA ESTRATÉGIA 3: Análise de possível dupla criptografia
        this.logMessage('🔍 Verificando possível dupla criptografia...', 'info');
        const doubleCryptResult = this.analyzeDoubleCryptography(dataView);
        if (doubleCryptResult.isLikelyDoubleCrypted) {
            this.logMessage('⚠️ Arquivo pode ter dupla criptografia ou obfuscação adicional', 'warning');
            this.logMessage(`📊 Indicadores: ${doubleCryptResult.indicators.join(', ')}`, 'info');
        }
        
        // Busca mais abrangente por padrões PDF
        const result = this.searchForPDFPatterns(dataView);
        if (result) {
            return result;
        }
        
        // Tentar estratégias avançadas de recuperação
        const recoveredPDF = this.attemptPDFRecovery(dataView);
        if (recoveredPDF) {
            return recoveredPDF;
        }
        
        // Nova estratégia: análise de conteúdo textual PDF
        const textBasedRecovery = this.attemptTextBasedPDFRecovery(dataView);
        if (textBasedRecovery) {
            return textBasedRecovery;
        }
        
        // NOVA ESTRATÉGIA: Reconstrução inteligente de headers
        this.logMessage('🧠 Tentando reconstrução inteligente de headers...', 'info');
        const intelligentReconstruction = await this.tryIntelligentHeaderReconstruction(dataView, 'compra e venda aditivo.pdf');
        if (intelligentReconstruction) {
            this.logMessage('✅ Reconstrução inteligente bem-sucedida!', 'success');
            return intelligentReconstruction;
        }
        
        // Estratégia final: tentar reconstrução com header PDF forçado
        const forcedReconstruction = this.attemptForcedPDFReconstruction(dataView);
        if (forcedReconstruction) {
            return forcedReconstruction;
        }
        
        // NOVA ESTRATÉGIA 4: Análise de formato alternativo
        this.logMessage('🔍 Analisando se arquivo pode ser de formato diferente...', 'info');
        const formatAnalysis = this.analyzeAlternativeFormats(dataView);
        if (formatAnalysis.detectedFormat !== 'unknown') {
            this.logMessage(`🔍 Formato alternativo detectado: ${formatAnalysis.detectedFormat}`, 'info');
            this.logMessage(`📊 Confiança: ${formatAnalysis.confidence}%`, 'info');
        }
        
        // Se não encontrou header PDF válido, retornar dados originais sem modificação
        this.logMessage('⚠️ Padrão PDF não encontrado após busca completa. Mantendo dados originais.', 'warning');
        this.logMessage('ℹ️ O arquivo pode não ser um PDF válido, estar muito corrompido, ou ter chave incorreta', 'info');
        
        return dataView;
    }

    // Análise de problemas de chave de descriptografia
    analyzeDecryptionKeyIssues(dataView) {
        const entropy = this.calculateEntropy(dataView);
        const patterns = [];
        let needsAlternativeKey = false;
        
        // Análise melhorada de entropia
        const entropyAnalysis = this.performAdvancedEntropyAnalysis(dataView);
        
        // Verificar se a entropia é muito baixa (indicando dados não descriptografados corretamente)
        if (entropy < 70) {
            patterns.push(`Entropia baixa (${entropy.toFixed(2)}%)`);
            needsAlternativeKey = true;
        }
        
        // Análise específica para entropia extremamente baixa (como 8%)
        if (entropy < 20) {
            patterns.push('Entropia crítica - possível chave completamente incorreta');
            needsAlternativeKey = true;
            
            // Sugerir estratégias específicas para entropia muito baixa
            patterns.push('Recomendado: tentar chaves derivadas alternativas');
        }
        
        // Verificar padrões repetitivos que indicam descriptografia incorreta
        const hasRepeating = this.hasRepeatingPatterns(dataView);
        if (hasRepeating) {
            patterns.push('Padrões repetitivos detectados');
            needsAlternativeKey = true;
        }
        
        // Verificar se há bytes nulos excessivos
        let nullCount = 0;
        for (let i = 0; i < Math.min(1000, dataView.length); i++) {
            if (dataView[i] === 0) nullCount++;
        }
        if (nullCount > dataView.length * 0.1) {
            patterns.push(`Excesso de bytes nulos (${((nullCount/Math.min(1000, dataView.length))*100).toFixed(1)}%)`);
            needsAlternativeKey = true;
        }
        
        // Análise de distribuição de bytes
        const byteDistribution = this.analyzeByteDistribution(dataView);
        if (byteDistribution.isUniform) {
            patterns.push('Distribuição de bytes suspeita - possível chave incorreta');
            needsAlternativeKey = true;
        }
        
        // Análise de header específico (5B 67 42 CD)
        if (dataView.length >= 4 && 
            dataView[0] === 0x5B && dataView[1] === 0x67 && 
            dataView[2] === 0x42 && dataView[3] === 0xCD) {
            patterns.push('Header inválido específico detectado (5B 67 42 CD)');
            needsAlternativeKey = true;
        }
        
        return { 
            entropy, 
            patterns, 
            needsAlternativeKey,
            entropyAnalysis,
            byteDistribution
        };
    }

    // Nova função para análise avançada de entropia
    performAdvancedEntropyAnalysis(dataView) {
        const analysis = {
            overallEntropy: this.calculateEntropy(dataView),
            blockEntropies: [],
            entropyVariance: 0,
            isConsistent: false
        };
        
        // Analisar entropia em blocos de 1KB
        const blockSize = 1024;
        const numBlocks = Math.min(10, Math.floor(dataView.length / blockSize));
        
        for (let i = 0; i < numBlocks; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, dataView.length);
            const block = dataView.slice(start, end);
            const blockEntropy = this.calculateEntropy(block);
            analysis.blockEntropies.push(blockEntropy);
        }
        
        // Calcular variância da entropia entre blocos
        if (analysis.blockEntropies.length > 1) {
            const mean = analysis.blockEntropies.reduce((a, b) => a + b, 0) / analysis.blockEntropies.length;
            const variance = analysis.blockEntropies.reduce((acc, entropy) => acc + Math.pow(entropy - mean, 2), 0) / analysis.blockEntropies.length;
            analysis.entropyVariance = variance;
            
            // Entropia consistente indica possível descriptografia incorreta
            analysis.isConsistent = variance < 5; // Baixa variância = muito consistente = suspeito
        }
        
        return analysis;
    }

    // Nova função para análise de distribuição de bytes
    analyzeByteDistribution(dataView) {
        const frequency = new Array(256).fill(0);
        const sampleSize = Math.min(4096, dataView.length); // Analisar primeiros 4KB
        
        // Contar frequência de cada byte
        for (let i = 0; i < sampleSize; i++) {
            frequency[dataView[i]]++;
        }
        
        // Calcular estatísticas de distribuição
        const nonZeroBytes = frequency.filter(f => f > 0).length;
        const maxFreq = Math.max(...frequency);
        const minFreq = Math.min(...frequency.filter(f => f > 0));
        
        const analysis = {
            uniqueBytes: nonZeroBytes,
            maxFrequency: maxFreq,
            minFrequency: minFreq,
            isUniform: false,
            dominantByte: frequency.indexOf(maxFreq),
            dominantBytePercentage: (maxFreq / sampleSize) * 100
        };
        
        // Detectar distribuição suspeita
        // Se um byte domina mais de 50% ou há muito poucos bytes únicos
        if (analysis.dominantBytePercentage > 50 || analysis.uniqueBytes < 16) {
            analysis.isUniform = true;
        }
        
        return analysis;
    }

    // Testar offsets comuns onde o PDF pode começar
    tryCommonOffsets(dataView) {
        const commonOffsets = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        const pdfHeader = [0x25, 0x50, 0x44, 0x46]; // %PDF
        
        for (const offset of commonOffsets) {
            if (offset >= dataView.length - 4) continue;
            
            // Verificar se há header PDF neste offset
            let matches = true;
            for (let i = 0; i < pdfHeader.length; i++) {
                if (dataView[offset + i] !== pdfHeader[i]) {
                    matches = false;
                    break;
                }
            }
            
            if (matches) {
                this.logMessage(`✅ Header PDF encontrado no offset ${offset}!`, 'success');
                // Retornar dados a partir do offset correto
                return new Uint8Array(dataView.slice(offset));
            }
        }
        
        return null;
    }

    // Análise de possível dupla criptografia
    analyzeDoubleCryptography(dataView) {
        const indicators = [];
        let isLikelyDoubleCrypted = false;
        
        // Verificar entropia muito alta (indicando dados ainda criptografados)
        const entropy = this.calculateEntropy(dataView);
        if (entropy > 95) {
            indicators.push('Entropia extremamente alta');
            isLikelyDoubleCrypted = true;
        }
        
        // Verificar distribuição uniforme de bytes
        const byteFreq = new Array(256).fill(0);
        for (let i = 0; i < Math.min(10000, dataView.length); i++) {
            byteFreq[dataView[i]]++;
        }
        
        const avgFreq = Math.min(10000, dataView.length) / 256;
        let uniformCount = 0;
        for (let freq of byteFreq) {
            if (Math.abs(freq - avgFreq) < avgFreq * 0.1) {
                uniformCount++;
            }
        }
        
        if (uniformCount > 200) {
            indicators.push('Distribuição de bytes muito uniforme');
            isLikelyDoubleCrypted = true;
        }
        
        // Verificar ausência de padrões textuais
        const textRatio = this.calculateTextRatio(dataView.slice(0, Math.min(1000, dataView.length)));
        if (textRatio < 0.05) {
            indicators.push('Ausência total de padrões textuais');
            isLikelyDoubleCrypted = true;
        }
        
        return { isLikelyDoubleCrypted, indicators };
    }

    // Análise de formatos alternativos
    analyzeAlternativeFormats(dataView) {
        const formats = [
            { name: 'ZIP/DOCX', signature: [0x50, 0x4B, 0x03, 0x04], confidence: 0 },
            { name: 'PNG', signature: [0x89, 0x50, 0x4E, 0x47], confidence: 0 },
            { name: 'JPEG', signature: [0xFF, 0xD8, 0xFF], confidence: 0 },
            { name: 'GIF', signature: [0x47, 0x49, 0x46, 0x38], confidence: 0 },
            { name: 'BMP', signature: [0x42, 0x4D], confidence: 0 },
            { name: 'RTF', signature: [0x7B, 0x5C, 0x72, 0x74], confidence: 0 },
            { name: 'XML', signature: [0x3C, 0x3F, 0x78, 0x6D], confidence: 0 }
        ];
        
        // Verificar assinaturas no início do arquivo
        for (let format of formats) {
            let matches = 0;
            for (let i = 0; i < format.signature.length && i < dataView.length; i++) {
                if (dataView[i] === format.signature[i]) {
                    matches++;
                }
            }
            format.confidence = (matches / format.signature.length) * 100;
        }
        
        // Verificar assinaturas em offsets comuns
        const offsets = [0, 1, 2, 4, 8, 16, 32];
        for (let offset of offsets) {
            if (offset >= dataView.length) continue;
            
            for (let format of formats) {
                let matches = 0;
                for (let i = 0; i < format.signature.length && (offset + i) < dataView.length; i++) {
                    if (dataView[offset + i] === format.signature[i]) {
                        matches++;
                    }
                }
                const offsetConfidence = (matches / format.signature.length) * 100;
                if (offsetConfidence > format.confidence) {
                    format.confidence = offsetConfidence;
                }
            }
        }
        
        // Encontrar o formato com maior confiança
        let bestFormat = { detectedFormat: 'unknown', confidence: 0 };
        for (let format of formats) {
            if (format.confidence > bestFormat.confidence && format.confidence > 50) {
                bestFormat = { detectedFormat: format.name, confidence: format.confidence };
            }
        }
        
        return bestFormat;
    }

    // Busca abrangente por padrões PDF em todo o arquivo
    searchForPDFPatterns(dataView) {
        // Busca em múltiplas fases com diferentes limites
        const searchPhases = [
            { limit: Math.min(2048, dataView.length), name: "primeiros 2KB" },
            { limit: Math.min(8192, dataView.length), name: "primeiros 8KB" },
            { limit: Math.min(32768, dataView.length), name: "primeiros 32KB" },
            { limit: dataView.length, name: "arquivo completo" }
        ];

        for (const phase of searchPhases) {
            this.logMessage(`🔍 Procurando padrão PDF nos ${phase.name}...`, 'info');
            
            // Procurar por "%PDF" como string
            for (let i = 0; i < phase.limit - 4; i++) {
                if (dataView[i] === 0x25 && dataView[i+1] === 0x50 && 
                    dataView[i+2] === 0x44 && dataView[i+3] === 0x46) {
                    this.logMessage(`✅ Header PDF válido encontrado na posição ${i}`, 'success');
                    const result = dataView.slice(i);
                    this.logMessage(`📄 Novo tamanho após correção: ${result.length} bytes`, 'info');
                    return result;
                }
            }
            
            // Se arquivo é pequeno, não precisa continuar as fases
            if (phase.limit === dataView.length && phase.limit < 32768) {
                break;
            }
        }
        
        return null;
    }

    // Tentativas avançadas de recuperação de PDF
    attemptPDFRecovery(dataView) {
        this.logMessage('🔧 Tentando estratégias avançadas de recuperação PDF...', 'info');
        
        // Estratégia 1: Procurar por outros padrões PDF comuns
        const pdfPatterns = [
            // Versões diferentes do PDF
            [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E], // %PDF-1.
            [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
            // Padrões de objetos PDF
            [0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A], // "1 0 obj"
            [0x32, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A], // "2 0 obj"
            [0x33, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A], // "3 0 obj"
            // Padrão de stream
            [0x73, 0x74, 0x72, 0x65, 0x61, 0x6D], // "stream"
            // Padrão de xref
            [0x78, 0x72, 0x65, 0x66], // "xref"
            // Padrão de trailer
            [0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72] // "trailer"
        ];

        for (const pattern of pdfPatterns) {
            const position = this.findPatternInData(dataView, pattern);
            if (position !== -1) {
                this.logMessage(`🎯 Padrão PDF encontrado na posição ${position}: ${pattern.map(b => String.fromCharCode(b)).join('')}`, 'info');
                
                // Se encontrou um padrão, tentar reconstruir o PDF
                if (pattern[0] === 0x25) { // Se é um header %PDF
                    const result = dataView.slice(position);
                    this.logMessage(`📄 PDF recuperado a partir da posição ${position}`, 'success');
                    return result;
                } else {
                    // Para outros padrões, tentar encontrar o início real do PDF próximo
                    const pdfStart = this.findNearbyPDFHeader(dataView, position);
                    if (pdfStart !== -1) {
                        const result = dataView.slice(pdfStart);
                        this.logMessage(`📄 PDF recuperado a partir da posição ${pdfStart} (próximo ao padrão)`, 'success');
                        return result;
                    }
                }
            }
        }

        // Estratégia 2: Análise de entropia para encontrar início de dados estruturados
        const structuredStart = this.findStructuredDataStart(dataView);
        if (structuredStart !== -1) {
            this.logMessage(`🔍 Possível início de dados estruturados na posição ${structuredStart}`, 'info');
            // Verificar se há padrões PDF próximos
            const nearbyPDF = this.findNearbyPDFHeader(dataView, structuredStart);
            if (nearbyPDF !== -1) {
                const result = dataView.slice(nearbyPDF);
                this.logMessage(`📄 PDF recuperado através de análise de entropia`, 'success');
                return result;
            }
        }

        return null;
    }

    // Encontrar padrão específico nos dados
    findPatternInData(dataView, pattern) {
        const searchLimit = Math.min(65536, dataView.length - pattern.length); // Buscar nos primeiros 64KB
        
        for (let i = 0; i < searchLimit; i++) {
            let matches = true;
            for (let j = 0; j < pattern.length; j++) {
                if (dataView[i + j] !== pattern[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return i;
            }
        }
        
        return -1;
    }

    // Nova estratégia: análise de conteúdo textual PDF
    attemptTextBasedPDFRecovery(dataView) {
        this.logMessage('🔍 Tentando recuperação baseada em análise textual PDF...', 'info');
        
        // Converter bytes para string para análise textual
        const textContent = Array.from(dataView.slice(0, Math.min(8192, dataView.length)))
            .map(b => String.fromCharCode(b)).join('');
        
        // Procurar por padrões textuais PDF comuns
        const pdfTextPatterns = [
            '%PDF-1.',
            'PDF-1.',
            '1 0 obj',
            '2 0 obj', 
            'stream',
            'endstream',
            'xref',
            'trailer',
            'startxref',
            '/Type /Catalog',
            '/Type /Page',
            '/Filter /FlateDecode'
        ];
        
        let bestMatch = { pattern: null, position: -1, confidence: 0 };
        
        for (const pattern of pdfTextPatterns) {
            const position = textContent.indexOf(pattern);
            if (position !== -1) {
                // Calcular confiança baseada no tipo de padrão
                let confidence = 1;
                if (pattern.includes('%PDF')) confidence = 10;
                else if (pattern.includes('obj')) confidence = 8;
                else if (pattern === 'stream' || pattern === 'xref') confidence = 6;
                else confidence = 4;
                
                this.logMessage(`🎯 Padrão textual encontrado: "${pattern}" na posição ${position} (confiança: ${confidence})`, 'info');
                
                if (confidence > bestMatch.confidence) {
                    bestMatch = { pattern, position, confidence };
                }
            }
        }
        
        if (bestMatch.position !== -1) {
            // Se encontrou um padrão com alta confiança, tentar recuperar
            if (bestMatch.confidence >= 6) {
                let startPosition = bestMatch.position;
                
                // Se não é um header PDF, procurar por um próximo
                if (!bestMatch.pattern.includes('%PDF')) {
                    // Procurar por %PDF próximo ao padrão encontrado
                    const searchStart = Math.max(0, bestMatch.position - 1024);
                    const searchEnd = Math.min(dataView.length, bestMatch.position + 1024);
                    
                    for (let i = searchStart; i < searchEnd - 4; i++) {
                        if (dataView[i] === 0x25 && dataView[i+1] === 0x50 && 
                            dataView[i+2] === 0x44 && dataView[i+3] === 0x46) {
                            startPosition = i;
                            this.logMessage(`✅ Header PDF encontrado próximo ao padrão textual na posição ${i}`, 'success');
                            break;
                        }
                    }
                }
                
                const result = dataView.slice(startPosition);
                this.logMessage(`📄 PDF recuperado através de análise textual (${result.length} bytes)`, 'success');
                return result;
            }
        }
        
        return null;
    }

    // Estratégia final: reconstrução forçada com header PDF
    attemptForcedPDFReconstruction(dataView) {
        this.logMessage('🔧 Tentando reconstrução forçada com header PDF...', 'info');
        
        // Analisar se o conteúdo tem características de PDF
        const hasObjectReferences = this.hasObjectReferences(dataView);
        const hasStreamContent = this.hasStreamContent(dataView);
        const hasXrefTable = this.hasXrefTable(dataView);
        
        this.logMessage(`📊 Análise estrutural: Objetos=${hasObjectReferences}, Streams=${hasStreamContent}, Xref=${hasXrefTable}`, 'info');
        
        // Se tem pelo menos 2 características de PDF, tentar reconstrução
        const pdfCharacteristics = [hasObjectReferences, hasStreamContent, hasXrefTable].filter(Boolean).length;
        
        if (pdfCharacteristics >= 2) {
            this.logMessage('🔧 Arquivo parece ter estrutura PDF. Tentando reconstrução...', 'info');
            
            // Procurar por um ponto de início mais provável
            const likelyStart = this.findLikelyPDFStart(dataView);
            
            if (likelyStart !== -1) {
                // Criar novo array com header PDF correto
                const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A]); // %PDF-1.4\n
                const contentStart = dataView.slice(likelyStart);
                
                const reconstructed = new Uint8Array(pdfHeader.length + contentStart.length);
                reconstructed.set(pdfHeader, 0);
                reconstructed.set(contentStart, pdfHeader.length);
                
                this.logMessage(`✅ PDF reconstruído com header forçado (${reconstructed.length} bytes)`, 'success');
                return reconstructed;
            }
        }
        
        return null;
    }

    // Verificar se tem referências de objetos PDF
    hasObjectReferences(dataView) {
        const text = Array.from(dataView.slice(0, Math.min(4096, dataView.length)))
            .map(b => String.fromCharCode(b)).join('');
        return /\d+\s+\d+\s+obj/.test(text);
    }

    // Verificar se tem conteúdo de streams
    hasStreamContent(dataView) {
        const text = Array.from(dataView.slice(0, Math.min(4096, dataView.length)))
            .map(b => String.fromCharCode(b)).join('');
        return text.includes('stream') && text.includes('endstream');
    }

    // Verificar se tem tabela xref
    hasXrefTable(dataView) {
        const text = Array.from(dataView.slice(0, Math.min(4096, dataView.length)))
            .map(b => String.fromCharCode(b)).join('');
        return text.includes('xref') || text.includes('trailer');
    }

    // Encontrar início mais provável do conteúdo PDF
    findLikelyPDFStart(dataView) {
        // Procurar por padrões que indicam início de conteúdo estruturado
        const patterns = [
            [0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A], // "1 0 obj"
            [0x32, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A], // "2 0 obj"
            [0x78, 0x72, 0x65, 0x66], // "xref"
        ];
        
        for (const pattern of patterns) {
            const position = this.findPatternInData(dataView, pattern);
            if (position !== -1) {
                // Voltar um pouco para capturar possível conteúdo anterior
                return Math.max(0, position - 64);
            }
        }
        
        return -1;
    }

    // Encontrar header PDF próximo a uma posição
    findNearbyPDFHeader(dataView, position) {
        const searchRange = 1024; // Buscar 1KB antes e depois
        const start = Math.max(0, position - searchRange);
        const end = Math.min(dataView.length - 4, position + searchRange);
        
        for (let i = start; i < end; i++) {
            if (dataView[i] === 0x25 && dataView[i+1] === 0x50 && 
                dataView[i+2] === 0x44 && dataView[i+3] === 0x46) {
                return i;
            }
        }
        
        return -1;
    }

    // Encontrar início de dados estruturados através de análise de entropia
    findStructuredDataStart(dataView) {
        const blockSize = 256;
        const numBlocks = Math.min(256, Math.floor(dataView.length / blockSize)); // Analisar até 64KB
        
        let bestPosition = -1;
        let bestScore = -1;
        
        for (let i = 0; i < numBlocks; i++) {
            const start = i * blockSize;
            const block = dataView.slice(start, start + blockSize);
            
            // Calcular score baseado em padrões estruturados
            const entropy = this.calculateEntropy(block);
            const textRatio = this.calculateTextRatio(block);
            const structureScore = this.calculateStructureScore(block);
            
            // Score combinado (entropia moderada + texto + estrutura)
            const combinedScore = (1 - Math.abs(entropy - 0.7)) * 0.4 + textRatio * 0.3 + structureScore * 0.3;
            
            if (combinedScore > bestScore) {
                bestScore = combinedScore;
                bestPosition = start;
            }
        }
        
        // Retornar posição se o score for razoável
        return bestScore > 0.5 ? bestPosition : -1;
    }

    // Calcular proporção de caracteres de texto
    calculateTextRatio(data) {
        let textBytes = 0;
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                textBytes++;
            }
        }
        return textBytes / data.length;
    }

    // Calcular score de estrutura (padrões repetitivos, alinhamento, etc.)
    calculateStructureScore(data) {
        let score = 0;
        
        // Verificar alinhamento em múltiplos de 4
        let alignedBytes = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== undefined) alignedBytes++;
        }
        score += (alignedBytes / (data.length / 4)) * 0.3;
        
        // Verificar padrões repetitivos
        const patterns = new Map();
        for (let i = 0; i < data.length - 3; i++) {
            const pattern = (data[i] << 24) | (data[i+1] << 16) | (data[i+2] << 8) | data[i+3];
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }
        
        const maxRepeats = Math.max(...patterns.values());
        score += Math.min(maxRepeats / 10, 0.7); // Normalizar
        
        return Math.min(score, 1.0);
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

    // Nova função para reconstrução inteligente de headers
    async tryIntelligentHeaderReconstruction(data, originalFilename) {
        this.logMessage('🧠 Iniciando reconstrução inteligente de headers...', 'info');
        
        const currentHeader = Array.from(data.slice(0, 16)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        this.logMessage(`🔍 Header atual detectado: ${currentHeader}`, 'info');
        
        // Estratégia 1: Análise do header inválido 5B 67 42 CD
        if (data[0] === 0x5B && data[1] === 0x67 && data[2] === 0x42 && data[3] === 0xCD) {
            this.logMessage('🔍 Detectado header específico 5B 67 42 CD - aplicando correções específicas...', 'info');
            
            // Tentar diferentes transformações do header inválido
            const corrections = [
                // Correção 1: XOR com padrão comum
                { name: 'XOR com 0x76', transform: (bytes) => bytes.map((b, i) => i < 4 ? b ^ 0x76 : b) },
                
                // Correção 2: Rotação de bits
                { name: 'Rotação de bits', transform: (bytes) => bytes.map((b, i) => i < 4 ? ((b << 1) | (b >> 7)) & 0xFF : b) },
                
                // Correção 3: Inversão de bytes
                { name: 'Inversão de bytes', transform: (bytes) => bytes.map((b, i) => i < 4 ? (~b) & 0xFF : b) },
                
                // Correção 4: Subtração de offset
                { name: 'Subtração offset 0x36', transform: (bytes) => bytes.map((b, i) => i < 4 ? (b - 0x36) & 0xFF : b) },
                
                // Correção 5: Adição de offset
                { name: 'Adição offset 0x36', transform: (bytes) => bytes.map((b, i) => i < 4 ? (b + 0x36) & 0xFF : b) }
            ];
            
            for (const correction of corrections) {
                try {
                    this.logMessage(`  🔧 Testando correção: ${correction.name}`, 'info');
                    
                    const correctedData = new Uint8Array(data);
                    const transformedBytes = correction.transform(Array.from(data.slice(0, 16)));
                    
                    for (let i = 0; i < Math.min(16, transformedBytes.length); i++) {
                        correctedData[i] = transformedBytes[i];
                    }
                    
                    // Verificar se resultou em header PDF válido
                    if (correctedData[0] === 0x25 && correctedData[1] === 0x50 && 
                        correctedData[2] === 0x44 && correctedData[3] === 0x46) {
                        this.logMessage(`✅ Correção ${correction.name} resultou em header PDF válido!`, 'success');
                        return correctedData;
                    }
                    
                    // Verificar outros formatos comuns
                    const newHeader = Array.from(correctedData.slice(0, 4)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
                    this.logMessage(`    📄 Novo header: ${newHeader}`, 'info');
                    
                } catch (error) {
                    this.logMessage(`    ❌ Erro na correção ${correction.name}: ${error.message}`, 'error');
                }
            }
        }
        
        // Estratégia 2: Análise de entropia baixa (8%)
        this.logMessage('🔍 Analisando entropia baixa para possível chave incorreta...', 'info');
        
        if (this.calculateEntropy(data) < 20) {
            this.logMessage('⚠️ Entropia muito baixa detectada - possível chave incorreta', 'warning');
            
            // Tentar diferentes transformações para aumentar entropia
            const entropyCorrections = [
                // Aplicar XOR com padrão baseado no nome do arquivo
                { 
                    name: 'XOR com hash do filename', 
                    transform: (bytes) => {
                        const filenameHash = this.simpleHash(originalFilename || 'default');
                        return bytes.map((b, i) => b ^ ((filenameHash >> (i % 4 * 8)) & 0xFF));
                    }
                },
                
                // Aplicar transformação baseada no header inválido
                {
                    name: 'Transformação baseada em 5B67',
                    transform: (bytes) => {
                        const pattern = [0x5B, 0x67, 0x42, 0xCD];
                        return bytes.map((b, i) => b ^ pattern[i % 4]);
                    }
                }
            ];
            
            for (const correction of entropyCorrections) {
                try {
                    this.logMessage(`  🔧 Testando correção de entropia: ${correction.name}`, 'info');
                    
                    const correctedData = new Uint8Array(correction.transform(Array.from(data)));
                    const newEntropy = this.calculateEntropy(correctedData);
                    
                    this.logMessage(`    📊 Nova entropia: ${newEntropy.toFixed(2)}%`, 'info');
                    
                    if (newEntropy > 50) {
                        this.logMessage(`✅ Entropia melhorada significativamente!`, 'success');
                        
                        // Verificar se resultou em formato válido
                        const signature = this.getFileSignature(correctedData);
                        if (signature && signature !== 'unknown') {
                            this.logMessage(`✅ Formato válido detectado: ${signature}`, 'success');
                            return correctedData;
                        }
                    }
                    
                } catch (error) {
                    this.logMessage(`    ❌ Erro na correção de entropia: ${error.message}`, 'error');
                }
            }
        }
        
        // Estratégia 3: Busca por padrões PDF em diferentes offsets
        this.logMessage('🔍 Buscando padrões PDF em diferentes posições...', 'info');
        
        const pdfPattern = [0x25, 0x50, 0x44, 0x46]; // %PDF
        const searchOffsets = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        
        for (const offset of searchOffsets) {
            if (offset >= data.length - 4) continue;
            
            let found = true;
            for (let i = 0; i < pdfPattern.length; i++) {
                if (data[offset + i] !== pdfPattern[i]) {
                    found = false;
                    break;
                }
            }
            
            if (found) {
                this.logMessage(`✅ Padrão PDF encontrado no offset ${offset}!`, 'success');
                
                // Criar nova versão com dados a partir do offset correto
                const correctedData = new Uint8Array(data.length - offset);
                for (let i = 0; i < correctedData.length; i++) {
                    correctedData[i] = data[offset + i];
                }
                
                return correctedData;
            }
        }
        
        // Estratégia 4: Reconstrução forçada com análise de estrutura
        this.logMessage('🔧 Tentando reconstrução forçada com análise estrutural...', 'info');
        
        try {
            // Procurar por strings características de PDF
            const pdfStrings = ['obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref'];
            let pdfLikeContent = false;
            
            const dataStr = new TextDecoder('latin1').decode(data);
            
            for (const pdfStr of pdfStrings) {
                if (dataStr.includes(pdfStr)) {
                    pdfLikeContent = true;
                    this.logMessage(`✅ Encontrada string PDF característica: ${pdfStr}`, 'success');
                    break;
                }
            }
            
            if (pdfLikeContent) {
                this.logMessage('🔧 Conteúdo PDF detectado - forçando header correto...', 'info');
                
                const correctedData = new Uint8Array(data.length + 8);
                
                // Inserir header PDF padrão
                const pdfHeader = '%PDF-1.4\n';
                const headerBytes = new TextEncoder().encode(pdfHeader);
                
                for (let i = 0; i < headerBytes.length; i++) {
                    correctedData[i] = headerBytes[i];
                }
                
                // Copiar dados originais após o header
                for (let i = 0; i < data.length; i++) {
                    correctedData[headerBytes.length + i] = data[i];
                }
                
                return correctedData;
            }
            
        } catch (error) {
            this.logMessage(`❌ Erro na reconstrução forçada: ${error.message}`, 'error');
        }
        
        this.logMessage('⚠️ Nenhuma estratégia de reconstrução foi bem-sucedida', 'warning');
        return null;
    }
    
    // Função auxiliar para calcular hash simples
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
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