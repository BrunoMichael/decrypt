const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const filetype = require('magic-bytes.js');
const Mimetics = require('mimetics');

class AlternativeDecryptor {
    constructor() {
        this.mimetics = new Mimetics();
        
        // Chaves comuns usadas por ransomware
        this.commonKeys = [
            'password', '123456', 'admin', 'root', 'user', 'test',
            'default', 'secret', 'key', 'crypto', 'encrypt', 'decrypt',
            'ransomware', 'wantocry', 'wannacry', 'malware', 'virus'
        ];
        
        // Padrões conhecidos de ransomware
        this.knownPatterns = {
            wantToCry: {
                extension: '.want_to_cry',
                magicBytes: [0x57, 0x41, 0x4E, 0x54], // "WANT"
                headerSize: 16,
                algorithms: ['aes-128-cbc', 'aes-192-cbc', 'aes-256-cbc']
            },
            wannaCry: {
                extension: '.WNCRY',
                magicBytes: [0x57, 0x4E, 0x43, 0x52], // "WNCR"
                headerSize: 8,
                algorithms: ['aes-128-cbc', 'aes-256-cbc']
            }
        };
    }

    /**
     * Analisa o header do arquivo para detectar tipo e estrutura
     */
    async analyzeFileHeader(filePath) {
        try {
            const buffer = fs.readFileSync(filePath);
            const first64Bytes = buffer.slice(0, 64);
            
            // Detectar tipo original usando magic bytes
            const detectedType = this.mimetics.parse(first64Bytes);
            const magicType = filetype.filetypeinfo(Array.from(first64Bytes));
            
            // Analisar entropia dos primeiros bytes
            const entropy = this.calculateEntropy(first64Bytes);
            
            // Procurar por padrões conhecidos de ransomware
            const ransomwarePattern = this.detectRansomwarePattern(buffer);
            
            return {
                originalType: detectedType,
                magicBytes: magicType,
                entropy: entropy,
                ransomwarePattern: ransomwarePattern,
                fileSize: buffer.length,
                header: Array.from(first64Bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
            };
        } catch (error) {
            console.error('Erro ao analisar header:', error);
            return null;
        }
    }

    /**
     * Detecta padrões conhecidos de ransomware
     */
    detectRansomwarePattern(buffer) {
        for (const [name, pattern] of Object.entries(this.knownPatterns)) {
            // Verificar magic bytes
            if (pattern.magicBytes) {
                const headerMatch = pattern.magicBytes.every((byte, index) => 
                    buffer[index] === byte
                );
                if (headerMatch) {
                    return { type: name, confidence: 0.9 };
                }
            }
            
            // Verificar por padrões no meio do arquivo
            for (let i = 0; i < Math.min(buffer.length - pattern.magicBytes.length, 1024); i++) {
                const match = pattern.magicBytes.every((byte, index) => 
                    buffer[i + index] === byte
                );
                if (match) {
                    return { type: name, confidence: 0.7, offset: i };
                }
            }
        }
        
        return null;
    }

    /**
     * Tenta descriptografar usando força bruta com chaves comuns
     */
    async bruteForceDecrypt(filePath, outputPath) {
        const buffer = fs.readFileSync(filePath);
        const results = [];
        
        console.log(`🔍 Iniciando força bruta com ${this.commonKeys.length} chaves comuns...`);
        
        for (const baseKey of this.commonKeys) {
            // Testar diferentes variações da chave
            const keyVariations = this.generateKeyVariations(baseKey);
            
            for (const key of keyVariations) {
                for (const algorithm of ['aes-128-cbc', 'aes-192-cbc', 'aes-256-cbc', 'aes-128-ecb', 'aes-256-ecb']) {
                    try {
                        const result = await this.tryDecryptWithKey(buffer, key, algorithm);
                        if (result.success) {
                            results.push({
                                key: key,
                                algorithm: algorithm,
                                confidence: result.confidence,
                                data: result.data
                            });
                            
                            console.log(`✅ Possível descriptografia encontrada com chave: ${key}, algoritmo: ${algorithm}`);
                        }
                    } catch (error) {
                        // Continuar tentando outras combinações
                    }
                }
            }
        }
        
        return results;
    }

    /**
     * Gera variações de uma chave base
     */
    generateKeyVariations(baseKey) {
        const variations = [baseKey];
        
        // Adicionar variações comuns
        variations.push(baseKey.toUpperCase());
        variations.push(baseKey.toLowerCase());
        variations.push(baseKey + '123');
        variations.push(baseKey + '2024');
        variations.push('123' + baseKey);
        variations.push(baseKey.split('').reverse().join(''));
        
        // Hash variations
        variations.push(crypto.createHash('md5').update(baseKey).digest('hex').substring(0, 16));
        variations.push(crypto.createHash('sha1').update(baseKey).digest('hex').substring(0, 16));
        variations.push(crypto.createHash('sha256').update(baseKey).digest('hex').substring(0, 32));
        
        return variations;
    }

    /**
     * Tenta descriptografar com uma chave específica
     */
    async tryDecryptWithKey(buffer, key, algorithm) {
        try {
            // Preparar chave para o algoritmo
            const keyBuffer = this.prepareKey(key, algorithm);
            
            // Tentar diferentes posições de IV
            const ivPositions = [
                { start: 0, length: 16 }, // IV no início
                { start: buffer.length - 16, length: 16 }, // IV no final
                { start: 16, length: 16 } // IV após possível header
            ];
            
            for (const ivPos of ivPositions) {
                if (ivPos.start + ivPos.length > buffer.length) continue;
                
                const iv = buffer.slice(ivPos.start, ivPos.start + ivPos.length);
                const encryptedData = this.extractEncryptedData(buffer, ivPos);
                
                if (algorithm.includes('ecb')) {
                    // ECB não usa IV
                    const decipher = crypto.createDecipher(algorithm.replace('-ecb', ''), keyBuffer);
                    let decrypted = decipher.update(encryptedData);
                    decrypted = Buffer.concat([decrypted, decipher.final()]);
                    
                    const validation = this.validateDecryptedData(decrypted);
                    if (validation.isValid) {
                        return { success: true, data: decrypted, confidence: validation.confidence };
                    }
                } else {
                    // CBC usa IV
                    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
                    let decrypted = decipher.update(encryptedData);
                    decrypted = Buffer.concat([decrypted, decipher.final()]);
                    
                    const validation = this.validateDecryptedData(decrypted);
                    if (validation.isValid) {
                        return { success: true, data: decrypted, confidence: validation.confidence };
                    }
                }
            }
            
            return { success: false };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Prepara a chave para o algoritmo específico
     */
    prepareKey(key, algorithm) {
        const keyString = typeof key === 'string' ? key : key.toString();
        
        if (algorithm.includes('128')) {
            return crypto.createHash('md5').update(keyString).digest();
        } else if (algorithm.includes('192')) {
            const hash = crypto.createHash('sha256').update(keyString).digest();
            return hash.slice(0, 24);
        } else if (algorithm.includes('256')) {
            return crypto.createHash('sha256').update(keyString).digest();
        }
        
        return Buffer.from(keyString.padEnd(16, '\0'), 'utf8').slice(0, 16);
    }

    /**
     * Extrai dados criptografados removendo IV e headers
     */
    extractEncryptedData(buffer, ivPosition) {
        if (ivPosition.start === 0) {
            // IV no início
            return buffer.slice(ivPosition.length);
        } else if (ivPosition.start === buffer.length - 16) {
            // IV no final
            return buffer.slice(0, -ivPosition.length);
        } else {
            // IV no meio, assumir header antes do IV
            return buffer.slice(ivPosition.start + ivPosition.length);
        }
    }

    /**
     * Valida se os dados descriptografados são válidos
     */
    validateDecryptedData(data) {
        if (!data || data.length === 0) {
            return { isValid: false, confidence: 0 };
        }

        let confidence = 0;
        
        // Verificar entropia (dados válidos têm entropia menor que dados criptografados)
        const entropy = this.calculateEntropy(data.slice(0, Math.min(1024, data.length)));
        if (entropy < 7.5) confidence += 0.3;
        
        // Verificar por magic bytes conhecidos
        const magicBytes = this.mimetics.parse(data.slice(0, 64));
        if (magicBytes) confidence += 0.4;
        
        // Verificar padrões de texto
        const textRatio = this.calculateTextRatio(data.slice(0, Math.min(1024, data.length)));
        if (textRatio > 0.7) confidence += 0.2;
        
        // Verificar padding válido
        if (this.hasValidPadding(data)) confidence += 0.1;
        
        return {
            isValid: confidence > 0.5,
            confidence: confidence,
            entropy: entropy,
            detectedType: magicBytes,
            textRatio: textRatio
        };
    }

    /**
     * Calcula a entropia dos dados
     */
    calculateEntropy(data) {
        const freq = new Array(256).fill(0);
        for (let i = 0; i < data.length; i++) {
            freq[data[i]]++;
        }
        
        let entropy = 0;
        for (let i = 0; i < 256; i++) {
            if (freq[i] > 0) {
                const p = freq[i] / data.length;
                entropy -= p * Math.log2(p);
            }
        }
        
        return entropy;
    }

    /**
     * Calcula a proporção de caracteres de texto
     */
    calculateTextRatio(data) {
        let textChars = 0;
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                textChars++;
            }
        }
        return textChars / data.length;
    }

    /**
     * Verifica se há padding válido
     */
    hasValidPadding(data) {
        if (data.length === 0) return false;
        
        const lastByte = data[data.length - 1];
        if (lastByte === 0 || lastByte > 16) return false;
        
        // Verificar PKCS7 padding
        for (let i = 1; i <= lastByte; i++) {
            if (data[data.length - i] !== lastByte) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Tenta reparar headers corrompidos
     */
    async repairCorruptedHeader(filePath) {
        const buffer = fs.readFileSync(filePath);
        const repairs = [];
        
        // Tentar diferentes offsets para encontrar dados válidos
        const offsets = [0, 8, 16, 32, 64, 128, 256];
        
        for (const offset of offsets) {
            if (offset >= buffer.length) continue;
            
            const repairedData = buffer.slice(offset);
            const analysis = this.mimetics.parse(repairedData.slice(0, 64));
            
            if (analysis) {
                repairs.push({
                    offset: offset,
                    detectedType: analysis,
                    confidence: 0.8,
                    data: repairedData
                });
            }
        }
        
        return repairs;
    }

    /**
     * Método principal para descriptografia alternativa
     */
    async decryptAlternative(filePath, outputDir) {
        console.log(`🔍 Iniciando análise alternativa de: ${path.basename(filePath)}`);
        
        // 1. Analisar header
        const headerAnalysis = await this.analyzeFileHeader(filePath);
        console.log('📊 Análise do header:', headerAnalysis);
        
        // 2. Tentar força bruta
        const bruteForceResults = await this.bruteForceDecrypt(filePath);
        
        // 3. Tentar reparar header
        const repairResults = await this.repairCorruptedHeader(filePath);
        
        // 4. Compilar resultados
        const allResults = [
            ...bruteForceResults.map(r => ({ ...r, method: 'brute_force' })),
            ...repairResults.map(r => ({ ...r, method: 'header_repair' }))
        ];
        
        // 5. Ordenar por confiança
        allResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        
        // 6. Salvar os melhores resultados
        const savedResults = [];
        for (let i = 0; i < Math.min(3, allResults.length); i++) {
            const result = allResults[i];
            if (result.data && result.confidence > 0.5) {
                const outputPath = path.join(outputDir, `decrypted_${i + 1}_${result.method}.bin`);
                fs.writeFileSync(outputPath, result.data);
                savedResults.push({
                    ...result,
                    outputPath: outputPath
                });
                console.log(`💾 Resultado salvo: ${outputPath} (confiança: ${result.confidence.toFixed(2)})`);
            }
        }
        
        return {
            headerAnalysis: headerAnalysis,
            results: savedResults,
            totalAttempts: allResults.length
        };
    }
}

module.exports = AlternativeDecryptor;

// Teste se executado diretamente
if (require.main === module) {
    const decryptor = new AlternativeDecryptor();
    
    if (process.argv.length < 3) {
        console.log('Uso: node alternative-decryptor.js <arquivo_criptografado> [diretorio_saida]');
        process.exit(1);
    }
    
    const filePath = process.argv[2];
    const outputDir = process.argv[3] || './decrypted_output';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    decryptor.decryptAlternative(filePath, outputDir)
        .then(results => {
            console.log('\n📋 Resumo dos resultados:');
            console.log(`Total de tentativas: ${results.totalAttempts}`);
            console.log(`Resultados salvos: ${results.results.length}`);
            
            if (results.results.length > 0) {
                console.log('\n🎯 Melhores resultados:');
                results.results.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.method} - Confiança: ${result.confidence.toFixed(2)} - ${result.outputPath}`);
                });
            } else {
                console.log('❌ Nenhum resultado válido encontrado');
            }
        })
        .catch(error => {
            console.error('❌ Erro durante a descriptografia:', error);
        });
}