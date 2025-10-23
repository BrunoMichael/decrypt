const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ECCrypto = require('./ec-crypto');
const FactorizationEngine = require('./factorization');

/**
 * Micro Decryptor - Ultra otimizado para usar menos de 50MB de RAM
 * Processa apenas pequenas amostras e usa técnicas de streaming
 */
class MicroDecryptor {
    constructor() {
        // Chaves essenciais conhecidas do WantToCry
        this.essentialKeys = [
            "WantToCry2017",
            "wcry@2ol7", 
            "WANACRY"
        ];
        
        this.algorithm = 'aes-256-cbc';
        
        // Inicializa módulo EC para suporte TeslaCrypt
        this.ecCrypto = new ECCrypto();
        this.factorization = new FactorizationEngine();
        
        // Estatísticas expandidas
        this.stats = {
            filesProcessed: 0,
            successfulDecryptions: 0,
            ecKeysGenerated: 0,
            factorizationAttempts: 0,
            memoryOptimizations: 0
        };
        
        console.log('[MicroDecryptor] Inicializado com suporte EC e Factorização');
        console.log('[MicroDecryptor] Chaves essenciais:', this.essentialKeys.length);
        console.log('[MicroDecryptor] Suporte EC ativo:', this.ecCrypto ? 'SIM' : 'NÃO');
        console.log('[MicroDecryptor] Factorização ativa');
    }

    /**
     * Método principal ultra-otimizado com verificação de chaves e suporte EC (baseado no TeslaDecrypter)
     */
    async decrypt(filePath) {
        try {
            console.log(`🔍 [MICRO] Iniciando análise micro de: ${path.basename(filePath)}`);
            
            this.stats.filesProcessed++;
            
            // Ler apenas 5KB para análise inicial
            const sampleSize = 5120; // 5KB apenas
            const buffer = await this.readSample(filePath, sampleSize);
            
            if (!buffer || buffer.length < 32) {
                console.log('❌ [MICRO] Arquivo muito pequeno ou ilegível');
                return [];
            }
            
            console.log(`📊 [MICRO] Processando amostra de ${buffer.length} bytes`);
            
            // Detecta versão do TeslaCrypt se aplicável
            const versionInfo = this.ecCrypto.detectTeslaCryptVersion(buffer);
            console.log(`🔍 [MICRO] Detecção TeslaCrypt:`, versionInfo);
            
            // Verificar entropia básica
            const entropy = this.calculateEntropy(buffer.slice(0, 1024));
            console.log(`📈 [MICRO] Entropia: ${entropy.toFixed(2)}`);
            
            if (entropy < 6.0) {
                console.log('⚠️ [MICRO] Arquivo pode não estar criptografado');
                return [];
            }
            
            // Gera chaves combinadas: essenciais + EC + factorização
            const allKeys = await this.generateAllKeys(versionInfo);
            console.log(`🔑 [MICRO] Total de chaves geradas: ${allKeys.length}`);
            
            // Se TeslaCrypt 2.x detectado, tenta factorização
            if (versionInfo.version === 'TeslaCrypt2x') {
                console.log('🔍 [MICRO] TeslaCrypt 2.x detectado - tentando factorização');
                const factorizedKeys = await this.attemptFactorization(buffer);
                if (factorizedKeys.length > 0) {
                    allKeys.push(...factorizedKeys);
                    console.log(`🔑 [MICRO] ${factorizedKeys.length} chaves de factorização adicionadas`);
                }
            }
            
            // Testar todas as chaves com verificação
            const results = [];
            for (let i = 0; i < allKeys.length; i++) {
                const keyInfo = allKeys[i];
                console.log(`🔑 [MICRO] Testando ${i + 1}/${allKeys.length}: ${keyInfo.source || 'essential'}`);
                
                const result = await this.testKey(buffer, keyInfo);
                if (result.success) {
                    console.log(`✅ [MICRO] Chave válida encontrada! Fonte: ${keyInfo.source || 'essential'}`);
                    results.push(result);
                    this.stats.successfulDecryptions++;
                    break; // Parar no primeiro sucesso
                }
                
                // Limpeza forçada após cada tentativa
                this.forceCleanup();
                
                // Pausa micro para evitar sobrecarga
                await this.microDelay(50);
            }
            
            if (results.length > 0) {
                console.log(`✅ [MICRO] ${results.length} resultado(s) encontrado(s)`);
                return results;
            } else {
                console.log('❌ [MICRO] Nenhuma chave válida encontrada');
                return [];
            }
            
        } catch (error) {
            console.error('❌ [MICRO] Erro:', error.message);
            return [];
        }
    }

    /**
     * Lê apenas uma pequena amostra do arquivo
     */
    async readSample(filePath, maxSize) {
        try {
            const fd = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(maxSize);
            const bytesRead = fs.readSync(fd, buffer, 0, maxSize, 0);
            fs.closeSync(fd);
            
            return buffer.slice(0, bytesRead);
        } catch (error) {
            console.error('❌ [MICRO] Erro ao ler arquivo:', error.message);
            return null;
        }
    }

    /**
     * Teste de chave com verificação avançada (inspirado no TeslaDecrypter)
     */
    async testKey(buffer, key) {
        try {
            // Preparar chave para AES-256
            const keyBuffer = Buffer.alloc(32);
            const keyStr = key.toString();
            keyBuffer.write(keyStr, 0, Math.min(keyStr.length, 32));
            
            // Tentar diferentes posições de IV (como no TeslaDecrypter)
            const ivPositions = [0, 16, buffer.length - 16];
            
            for (const ivPos of ivPositions) {
                if (ivPos + 16 > buffer.length) continue;
                
                const iv = buffer.slice(ivPos, ivPos + 16);
                const encryptedData = buffer.slice(ivPos + 16, Math.min(ivPos + 16 + 1024, buffer.length));
                
                if (encryptedData.length < 16) continue;
                
                try {
                    const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
                    decipher.setAutoPadding(false);
                    
                    let decrypted = decipher.update(encryptedData);
                    decrypted = Buffer.concat([decrypted, decipher.final()]);
                    
                    // Verificação de chave avançada (baseada no TeslaDecrypter)
                    const isValid = this.verifyKeyValidity(decrypted, key);
                    
                    if (isValid && this.quickValidation(decrypted)) {
                        console.log(`✅ [MICRO] Chave válida encontrada: ${key} (IV pos: ${ivPos})`);
                        return { 
                            success: true, 
                            key: key, 
                            data: decrypted, 
                            ivPosition: ivPos,
                            confidence: this.calculateConfidence(decrypted)
                        };
                    }
                } catch (err) {
                    // Continuar testando outras posições
                    continue;
                }
            }
            
            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Verificação de validade da chave (inspirado no TeslaDecrypter)
     */
    verifyKeyValidity(decryptedData, key) {
        try {
            // 1. Verificar se não há padrões repetitivos excessivos
            if (this.hasExcessiveRepeatingPatterns(decryptedData)) {
                return false;
            }
            
            // 2. Verificar entropia dos dados descriptografados
            const entropy = this.calculateEntropy(decryptedData.slice(0, 256));
            if (entropy < 3.0 || entropy > 7.5) {
                return false;
            }
            
            // 3. Verificar se há bytes nulos excessivos
            const nullBytes = decryptedData.filter(byte => byte === 0).length;
            const nullRatio = nullBytes / decryptedData.length;
            if (nullRatio > 0.7) {
                return false;
            }
            
            // 4. Verificar padrões de arquivo válidos
            return this.hasValidFilePatterns(decryptedData);
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Calcular confiança na descriptografia (baseado no TeslaDecrypter)
     */
    calculateConfidence(data) {
        let confidence = 0;
        
        // Verificar magic bytes conhecidos
        if (this.hasValidMagicBytes(data)) confidence += 30;
        
        // Verificar entropia adequada
        const entropy = this.calculateEntropy(data.slice(0, 256));
        if (entropy >= 4.0 && entropy <= 7.0) confidence += 25;
        
        // Verificar distribuição de bytes
        if (this.hasGoodByteDistribution(data)) confidence += 20;
        
        // Verificar padrões de texto/estrutura
        if (this.hasValidFilePatterns(data)) confidence += 25;
        
        return confidence;
    }

    /**
     * Verificar padrões excessivos de repetição
     */
    hasExcessiveRepeatingPatterns(data) {
        const chunkSize = 16;
        const chunks = new Map();
        
        for (let i = 0; i <= data.length - chunkSize; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize).toString('hex');
            chunks.set(chunk, (chunks.get(chunk) || 0) + 1);
        }
        
        // Se mais de 50% dos chunks são idênticos, provavelmente é inválido
        const maxRepeats = Math.max(...chunks.values());
        const totalChunks = Math.ceil(data.length / chunkSize);
        
        return (maxRepeats / totalChunks) > 0.5;
    }

    /**
     * Verificar magic bytes conhecidos
     */
    hasValidMagicBytes(data) {
        if (data.length < 4) return false;
        
        const magicBytes = [
            [0x25, 0x50, 0x44, 0x46], // PDF
            [0x50, 0x4B, 0x03, 0x04], // ZIP/Office
            [0xFF, 0xD8, 0xFF],       // JPEG
            [0x89, 0x50, 0x4E, 0x47], // PNG
            [0xD0, 0xCF, 0x11, 0xE0], // MS Office
        ];
        
        return magicBytes.some(magic => {
            return magic.every((byte, i) => i < data.length && data[i] === byte);
        });
    }

    /**
     * Verificar boa distribuição de bytes
     */
    hasGoodByteDistribution(data) {
        const freq = new Array(256).fill(0);
        for (let i = 0; i < Math.min(data.length, 1024); i++) {
            freq[data[i]]++;
        }
        
        const nonZero = freq.filter(f => f > 0).length;
        return nonZero > 16; // Pelo menos 16 valores diferentes
    }

    /**
     * Verificar padrões válidos de arquivo
     */
    hasValidFilePatterns(data) {
        // Verificar se há estrutura de texto ou binário válido
        const sample = data.slice(0, 256);
        
        // Contar caracteres imprimíveis
        let printable = 0;
        for (let i = 0; i < sample.length; i++) {
            const byte = sample[i];
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                printable++;
            }
        }
        
        const printableRatio = printable / sample.length;
        
        // Se é muito texto (>70%) ou tem magic bytes, é válido
        return printableRatio > 0.7 || this.hasValidMagicBytes(data);
    }

    /**
     * Validação rápida e simples
     */
    quickValidation(data) {
        if (!data || data.length === 0) return false;
        
        // Verificar se não é apenas zeros ou dados aleatórios
        const firstBytes = data.slice(0, Math.min(64, data.length));
        
        // Contar bytes únicos
        const uniqueBytes = new Set(firstBytes).size;
        if (uniqueBytes < 3) return false; // Muito uniforme
        
        // Verificar entropia (deve ser menor que dados criptografados)
        const entropy = this.calculateEntropy(firstBytes);
        if (entropy > 7.0) return false; // Ainda muito aleatório
        
        // Verificar por alguns padrões comuns de PDF
        const dataStr = firstBytes.toString('latin1');
        if (dataStr.includes('PDF') || dataStr.includes('%') || dataStr.includes('obj')) {
            return true;
        }
        
        // Verificar proporção de caracteres imprimíveis
        let printable = 0;
        for (let i = 0; i < firstBytes.length; i++) {
            const byte = firstBytes[i];
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                printable++;
            }
        }
        
        const printableRatio = printable / firstBytes.length;
        return printableRatio > 0.3; // Pelo menos 30% imprimível
    }

    /**
     * Calcula entropia de forma otimizada
     */
    calculateEntropy(data) {
        const freq = new Array(256).fill(0);
        for (let i = 0; i < data.length; i++) {
            freq[data[i]]++;
        }
        
        let entropy = 0;
        const len = data.length;
        for (let i = 0; i < 256; i++) {
            if (freq[i] > 0) {
                const p = freq[i] / len;
                entropy -= p * Math.log2(p);
            }
        }
        
        return entropy;
    }

    /**
     * Força limpeza de memória
     */
    forceCleanup() {
        if (global.gc) {
            global.gc();
        }
        
        // Limpar variáveis locais explicitamente
        if (this.tempBuffer) {
            this.tempBuffer = null;
        }
    }

    /**
     * Pausa micro para evitar sobrecarga
     */
    async microDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Processa arquivo completo apenas se a chave for válida
     */
    /**
     * Processamento otimizado para arquivos grandes (inspirado no TeslaDecrypter)
     * Usa streaming e chunks pequenos para minimizar uso de memória
     */
    async processFullFile(filePath, validKey) {
        try {
            console.log(`🔄 [MICRO] Processando arquivo completo com chave: ${validKey}`);
            
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            // Chunks adaptativos baseados no tamanho do arquivo (como TeslaDecrypter)
            let chunkSize = 8192; // 8KB padrão
            if (fileSize > 50 * 1024 * 1024) { // > 50MB
                chunkSize = 16384; // 16KB para arquivos grandes
            } else if (fileSize > 10 * 1024 * 1024) { // > 10MB
                chunkSize = 12288; // 12KB para arquivos médios
            }
            
            console.log(`📊 [MICRO] Arquivo: ${(fileSize / 1024 / 1024).toFixed(2)}MB, Chunk: ${chunkSize} bytes`);
            
            const keyHash = crypto.createHash('sha256').update(validKey).digest();
            
            const inputFd = fs.openSync(filePath, 'r');
            
            // Criar nome de arquivo de saída - FORÇAR uso dos diretórios corretos do servidor
            const originalName = path.basename(filePath).replace('.want_to_cry', '');
            
            // DEBUG: Log dos caminhos
            console.log(`🔍 [DEBUG] filePath recebido: ${filePath}`);
            console.log(`🔍 [DEBUG] originalName extraído: ${originalName}`);
            console.log(`🔍 [DEBUG] __filename: ${__filename}`);
            console.log(`🔍 [DEBUG] __dirname: ${__dirname}`);
            console.log(`🔍 [DEBUG] process.cwd(): ${process.cwd()}`);
            
            // CORREÇÃO DEFINITIVA: Usar process.cwd() que é o diretório de trabalho atual
            const serverRoot = process.cwd(); // Diretório onde o servidor está rodando
            const outputDir = path.join(serverRoot, 'decrypted');
            
            console.log(`🔍 [DEBUG] serverRoot (process.cwd): ${serverRoot}`);
            console.log(`🔍 [DEBUG] outputDir final: ${outputDir}`);
            
            // Garantir que o diretório de saída existe
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`📁 [DEBUG] Diretório criado: ${outputDir}`);
            } else {
                console.log(`📁 [DEBUG] Diretório já existe: ${outputDir}`);
            }
            
            const outputFileName = `micro_decrypted_${Date.now()}_${originalName}`;
            const outputPath = path.join(outputDir, outputFileName);
            console.log(`🔍 [DEBUG] outputPath final: ${outputPath}`);
            console.log(`🔍 [DEBUG] outputFileName: ${outputFileName}`);
            const outputFd = fs.openSync(outputPath, 'w');
            
            // Ler IV dos primeiros 16 bytes
            const ivBuffer = Buffer.alloc(16);
            fs.readSync(inputFd, ivBuffer, 0, 16, 0);
            
            let position = 16; // Começar após o IV
            let totalProcessed = 0;
            let totalDecrypted = 0;
            let lastProgressReport = 0;
            
            // Buffer reutilizável para reduzir alocações (como TeslaDecrypter)
            const reusableBuffer = Buffer.alloc(chunkSize);
            
            while (position < fileSize) {
                const remainingBytes = fileSize - position;
                const currentChunkSize = Math.min(chunkSize, remainingBytes);
                
                // Reutilizar buffer em vez de criar novo
                const chunk = reusableBuffer.slice(0, currentChunkSize);
                const bytesRead = fs.readSync(inputFd, chunk, 0, currentChunkSize, position);
                
                if (bytesRead === 0) break;
                
                try {
                    // Descriptografar chunk
                    const decipher = crypto.createDecipheriv(this.algorithm, keyHash, ivBuffer);
                    decipher.setAutoPadding(false);
                    
                    let decrypted = decipher.update(chunk.slice(0, bytesRead));
                    
                    // Para o último chunk, tentar aplicar padding
                    if (position + bytesRead >= fileSize) {
                        try {
                            const final = decipher.final();
                            decrypted = Buffer.concat([decrypted, final]);
                        } catch (paddingError) {
                            // Se falhar no padding, usar apenas o que foi descriptografado
                            console.log(`⚠️ [MICRO] Aviso de padding no final do arquivo`);
                        }
                    }
                    
                    // Escrever chunk descriptografado
                    if (decrypted.length > 0) {
                        fs.writeSync(outputFd, decrypted);
                        totalDecrypted += decrypted.length;
                    }
                    
                } catch (chunkError) {
                    console.error(`❌ [MICRO] Erro no chunk ${position}: ${chunkError.message}`);
                    // Continuar com próximo chunk
                }
                
                position += bytesRead;
                totalProcessed += bytesRead;
                
                // Limpeza a cada chunk
                this.forceCleanup();
                
                // Progresso
                if (totalProcessed % (chunkSize * 10) === 0) {
                    const progress = ((totalProcessed / fileSize) * 100).toFixed(1);
                    console.log(`📊 [MICRO] Progresso: ${progress}% (${totalDecrypted} bytes descriptografados)`);
                }
            }
            
            fs.closeSync(inputFd);
            fs.closeSync(outputFd);
            
            // Verificar se o arquivo foi criado com sucesso
            const finalStats = fs.statSync(outputPath);
            console.log(`✅ [MICRO] Arquivo processado: ${outputPath} (${finalStats.size} bytes)`);
            
            if (finalStats.size === 0) {
                console.error(`❌ [MICRO] Arquivo de saída vazio! Tentando método alternativo...`);
                fs.unlinkSync(outputPath); // Remover arquivo vazio
                return null;
            }
            
            // Retornar objeto com caminho completo e nome do arquivo
            return {
                fullPath: outputPath,
                fileName: outputFileName,
                size: finalStats.size
            };
            
        } catch (error) {
            console.error('❌ [MICRO] Erro no processamento completo:', error.message);
            return null;
        }
    }

    /**
     * Gera todas as chaves disponíveis: essenciais + EC
     */
    async generateAllKeys(versionInfo) {
        const allKeys = [];
        
        // Adiciona chaves essenciais do WantToCry
        for (const key of this.essentialKeys) {
            allKeys.push({
                key: this.deriveKey(key),
                source: 'essential',
                original: key,
                strength: 'medium'
            });
        }
        
        // Adiciona chaves EC se TeslaCrypt foi detectado
        if (versionInfo.usesEC) {
            console.log(`[MicroDecryptor] Gerando chaves EC para ${versionInfo.version}`);
            
            const ecKeys = this.ecCrypto.generateECKeys(versionInfo.version);
            this.stats.ecKeysGenerated += ecKeys.length;
            
            allKeys.push(...ecKeys);
            console.log(`[MicroDecryptor] ${ecKeys.length} chaves EC geradas`);
        }
        
        // Adiciona chaves de factorização se aplicável
        if (versionInfo.version === 'TeslaCrypt2x') {
            console.log('[MicroDecryptor] Tentando factorização para TeslaCrypt 2.x');
            this.stats.factorizationAttempts++;
            
            // Usa o módulo de factorização dedicado
            const factorKeys = await this.generateFactorizationKeys(versionInfo.buffer);
            allKeys.push(...factorKeys);
            console.log(`[MicroDecryptor] ${factorKeys.length} chaves de factorização geradas`);
        }
        
        return allKeys;
    }

    /**
     * Deriva chave AES a partir de string
     */
    deriveKey(keyString) {
        return crypto.createHash('sha256').update(keyString).digest();
    }

    /**
     * Gera chaves através de factorização (TeslaCrypt 2.x)
     */
    async generateFactorizationKeys(buffer) {
        const keys = [];
        
        try {
            // Gera números candidatos do arquivo
            const candidates = this.factorization.generateCandidateNumbers(buffer, 'TeslaCrypt2x');
            console.log(`[Factorization] ${candidates.length} números candidatos para factorização`);
            
            // Tenta factorizar cada candidato
            for (const candidate of candidates.slice(0, 5)) { // Limita a 5 para performance
                const result = await this.factorization.factorizeNumber(candidate, 'TeslaCrypt2x');
                
                if (result && result.aesKey) {
                    keys.push({
                        key: result.aesKey,
                        source: 'factorization',
                        original: candidate,
                        strength: 'high',
                        confidence: result.confidence,
                        factors: result.factors
                    });
                    
                    console.log(`[Factorization] ✅ Chave recuperada de: ${candidate}`);
                }
            }
            
            return keys;
            
        } catch (error) {
            console.error(`[Factorization] Erro na geração de chaves: ${error.message}`);
            return keys;
        }
    }

    /**
     * Tenta factorização direta em arquivo TeslaCrypt 2.x
     */
    async attemptFactorization(buffer) {
        const keys = [];
        
        try {
            console.log('[Factorization] Iniciando tentativa de factorização direta');
            
            // Extrai possíveis chaves da estrutura do arquivo
            const candidates = this.factorization.generateCandidateNumbers(buffer, 'TeslaCrypt2x');
            
            // Tenta factorização nos candidatos mais promissores
            for (const candidate of candidates.slice(0, 3)) {
                const result = await this.factorization.factorizeNumber(candidate, 'TeslaCrypt2x');
                
                if (result) {
                    keys.push({
                        key: result.aesKey,
                        source: 'direct_factorization',
                        original: candidate,
                        strength: 'very_high',
                        confidence: result.confidence,
                        method: 'factorization'
                    });
                }
            }
            
            return keys;
            
        } catch (error) {
            console.error(`[Factorization] Erro na factorização direta: ${error.message}`);
            return keys;
        }
    }
}

module.exports = MicroDecryptor;