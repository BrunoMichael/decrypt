const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Micro Decryptor - Ultra otimizado para usar menos de 50MB de RAM
 * Processa apenas pequenas amostras e usa técnicas de streaming
 */
class MicroDecryptor {
    constructor() {
        // Apenas 3 chaves mais prováveis para WantToCry
        this.essentialKeys = [
            'WantToCry2017',
            'wcry@2ol7', 
            'WANACRY'
        ];
        
        // Apenas AES-256-CBC (mais comum)
        this.algorithm = 'aes-256-cbc';
    }

    /**
     * Método principal ultra-otimizado
     */
    async decrypt(filePath) {
        try {
            console.log(`🔍 [MICRO] Iniciando análise micro de: ${path.basename(filePath)}`);
            
            // Ler apenas 5KB para análise inicial
            const sampleSize = 5120; // 5KB apenas
            const buffer = await this.readSample(filePath, sampleSize);
            
            if (!buffer || buffer.length < 32) {
                console.log('❌ [MICRO] Arquivo muito pequeno ou ilegível');
                return [];
            }
            
            console.log(`📊 [MICRO] Processando amostra de ${buffer.length} bytes`);
            
            // Verificar entropia básica
            const entropy = this.calculateEntropy(buffer.slice(0, 1024));
            console.log(`📈 [MICRO] Entropia: ${entropy.toFixed(2)}`);
            
            if (entropy < 6.0) {
                console.log('⚠️ [MICRO] Arquivo pode não estar criptografado');
                return [];
            }
            
            // Testar apenas as 3 chaves essenciais
            const results = [];
            for (let i = 0; i < this.essentialKeys.length; i++) {
                const key = this.essentialKeys[i];
                console.log(`🔑 [MICRO] Testando ${i + 1}/3: ${key}`);
                
                const result = await this.testKey(buffer, key);
                if (result.success) {
                    console.log(`✅ [MICRO] Chave válida encontrada: ${key}`);
                    results.push(result);
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
     * Testa uma chave específica com amostra mínima
     */
    async testKey(buffer, key) {
        try {
            // Usar apenas 512 bytes para teste
            const testSize = Math.min(buffer.length, 512);
            const testBuffer = buffer.slice(0, testSize);
            
            // Preparar chave SHA256
            const keyHash = crypto.createHash('sha256').update(key).digest();
            
            // Assumir IV nos primeiros 16 bytes
            if (testBuffer.length <= 16) {
                return { success: false };
            }
            
            const iv = testBuffer.slice(0, 16);
            const encrypted = testBuffer.slice(16);
            
            // Tentar descriptografar
            const decipher = crypto.createDecipheriv(this.algorithm, keyHash, iv);
            decipher.setAutoPadding(false);
            
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            // Validação simples
            const isValid = this.quickValidation(decrypted);
            
            if (isValid) {
                return {
                    success: true,
                    key: key,
                    algorithm: this.algorithm,
                    confidence: 0.8,
                    sampleData: decrypted.slice(0, 64) // Apenas 64 bytes de amostra
                };
            }
            
            return { success: false };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
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
    async processFullFile(filePath, validKey) {
        try {
            console.log(`🔄 [MICRO] Processando arquivo completo com chave: ${validKey}`);
            
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            // Processar em chunks pequenos para evitar sobrecarga de memória
            const chunkSize = 8192; // 8KB por chunk
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
            
            while (position < fileSize) {
                const remainingBytes = fileSize - position;
                const currentChunkSize = Math.min(chunkSize, remainingBytes);
                
                const chunk = Buffer.alloc(currentChunkSize);
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
}

module.exports = MicroDecryptor;