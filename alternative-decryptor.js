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
            
            // Determinar tipo de arquivo mais provável
            let detectedFileType = 'unknown';
            if (detectedType && detectedType.length > 0) {
                detectedFileType = detectedType[0];
            } else if (magicType && magicType.length > 0) {
                detectedFileType = magicType[0];
            }
            
            // Verificar se é PDF baseado em padrões comuns
            if (buffer.includes(Buffer.from('%PDF')) || 
                buffer.includes(Buffer.from('PDF')) ||
                first64Bytes.includes(0x25) && first64Bytes.includes(0x50) && first64Bytes.includes(0x44) && first64Bytes.includes(0x46)) {
                detectedFileType = 'application/pdf';
            }
            
            return {
                originalType: detectedType,
                magicBytes: magicType,
                detectedType: detectedFileType,
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
     * Método principal de descriptografia alternativa (ultra-otimizado)
     */
    async decrypt(filePath) {
        try {
            console.log(`🔍 Iniciando análise alternativa de: ${path.basename(filePath)}`);
            
            // Ler apenas uma amostra do arquivo para análise
            const stats = fs.statSync(filePath);
            const sampleSize = Math.min(stats.size, 50000); // Máximo 50KB para análise
            
            const fd = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(sampleSize);
            fs.readSync(fd, buffer, 0, sampleSize, 0);
            fs.closeSync(fd);
            
            console.log(`📊 Analisando amostra de ${sampleSize} bytes de ${stats.size} bytes totais`);
            
            // Análise básica do header
            const headerAnalysis = this.analyzeHeader(buffer);
            console.log('📊 Análise do header:', JSON.stringify(headerAnalysis, null, 2));
            
            // Tentar apenas métodos mais leves
            const results = [];
            
            // 1. Verificar se é realmente criptografado
            if (headerAnalysis.entropy < 6.0) {
                console.log('⚠️ Arquivo pode não estar criptografado (entropia baixa)');
                return [];
            }
            
            // 2. Tentar apenas força bruta ultra-otimizada
            console.log('🔄 Tentando força bruta ultra-otimizada...');
            const bruteResults = await this.bruteForceDecrypt(buffer, headerAnalysis);
            results.push(...bruteResults);
            
            // 3. Salvar apenas o melhor resultado
            if (results.length > 0) {
                const bestResult = results.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                if (bestResult.confidence > 0.3) {
                    const outputPath = await this.saveResult(bestResult, filePath);
                    console.log(`✅ Resultado salvo: ${outputPath}`);
                    return [bestResult];
                }
            }
            
            console.log('❌ Nenhum método alternativo foi bem-sucedido');
            return [];
            
        } catch (error) {
            console.error('❌ Erro na descriptografia alternativa:', error.message);
            return [];
        }
    }

    /**
     * Tenta descriptografar usando força bruta com chaves comuns
     */
    async bruteForceDecrypt(buffer, headerAnalysis) {
        const results = [];
        
        // Chaves mais essenciais apenas (ultra reduzidas)
        const essentialKeys = [
            'WantToCry2017',
            'wcry@2ol7',
            'WANACRY',
            'wannacry',
            'PDF',
            '2017'
        ];
        
        console.log(`🔍 Iniciando força bruta ultra-otimizada com ${essentialKeys.length} chaves essenciais...`);
        
        // Processar apenas uma pequena amostra do arquivo
        const sampleSize = Math.min(buffer.length, 10000); // Apenas 10KB
        const sampleBuffer = buffer.slice(0, sampleSize);
        
        for (let i = 0; i < essentialKeys.length; i++) {
            const key = essentialKeys[i];
            
            try {
                console.log(`🔑 Testando chave ${i + 1}/${essentialKeys.length}: ${key}`);
                
                const result = await this.tryDecryptWithKey(sampleBuffer, key, 'aes-256-cbc');
                if (result.success) {
                    results.push({
                        key: key,
                        algorithm: 'aes-256-cbc',
                        confidence: result.confidence,
                        data: result.data
                    });
                    
                    // Se encontrou uma chave promissora, parar para economizar memória
                    console.log(`✅ Chave promissora encontrada: ${key} (confiança: ${result.confidence})`);
                    break;
                }
                
                // Forçar limpeza de memória após cada tentativa
                if (global.gc) {
                    global.gc();
                }
                
                // Pequena pausa para evitar sobrecarga
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`⚠️ Erro com chave ${key}: ${error.message}`);
                continue;
            }
        }
        
        console.log(`🔍 Força bruta concluída. ${results.length} resultados encontrados.`);
        return results;
    }

    /**
     * Gera variações de uma chave base (otimizado para memória)
     */
    generateKeyVariations(baseKey) {
        // Reduzir variações para economizar memória
        const variations = [
            baseKey,
            baseKey.toUpperCase(),
            baseKey.toLowerCase(),
            baseKey + '2017'
        ];
        
        // Apenas hash MD5 para economizar processamento
        try {
            variations.push(crypto.createHash('md5').update(baseKey).digest('hex').substring(0, 16));
        } catch (error) {
            // Ignorar erro de hash
        }
        
        return variations;
    }

    /**
     * Tenta descriptografar com uma chave específica (ultra-otimizado)
     */
    async tryDecryptWithKey(buffer, key, algorithm) {
        try {
            // Preparar chave para o algoritmo
            const keyBuffer = this.prepareKey(key, algorithm);
            
            // Processar apenas uma pequena amostra para teste
            const testSize = Math.min(buffer.length, 1024); // Apenas 1KB para teste
            const testBuffer = buffer.slice(0, testSize);
            
            // Usar apenas posição de IV mais comum (início)
            const ivSize = 16;
            if (testBuffer.length <= ivSize) {
                return { success: false };
            }
            
            const iv = testBuffer.slice(0, ivSize);
            const encryptedData = testBuffer.slice(ivSize);
            
            // Usar apenas CBC (mais comum no WantToCry)
            const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
            decipher.setAutoPadding(false);
            
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            const validation = this.validateDecryptedData(decrypted);
            if (validation.isValid) {
                return { success: true, data: decrypted, confidence: validation.confidence };
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
        
        // Tentar reparar headers PDF especificamente
        const pdfRepairs = this.repairPDFHeader(buffer);
        repairs.push(...pdfRepairs);
        
        return repairs;
    }

    /**
     * Repara headers PDF corrompidos
     */
    repairPDFHeader(data) {
        const results = [];
        
        // Assinaturas PDF conhecidas
        const pdfSignatures = [
            Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
            Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E]), // %PDF-1.
            Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]), // %PDF-1.4
            Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]), // %PDF-1.5
            Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x36]), // %PDF-1.6
            Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37])  // %PDF-1.7
        ];
        
        // Tentar diferentes offsets para encontrar o header PDF
        const maxOffset = Math.min(1024, data.length - 8);
        
        for (let offset = 0; offset < maxOffset; offset++) {
            for (const signature of pdfSignatures) {
                if (data.length >= offset + signature.length) {
                    const repairedData = Buffer.alloc(data.length);
                    data.copy(repairedData);
                    
                    // Inserir assinatura PDF no offset
                    signature.copy(repairedData, offset);
                    
                    // Verificar se parece um PDF válido
                    const confidence = this.calculatePDFConfidence(repairedData);
                    
                    if (confidence > 0.3) {
                        results.push({
                            method: `pdf_header_repair_offset_${offset}`,
                            data: repairedData,
                            confidence: confidence,
                            description: `PDF header repair at offset ${offset}`
                        });
                    }
                }
            }
        }
        
        // Tentar reparar estrutura PDF básica
        if (data.length > 1024) {
            const basicPDFStructure = this.createBasicPDFStructure(data);
            if (basicPDFStructure) {
                const confidence = this.calculatePDFConfidence(basicPDFStructure);
                if (confidence > 0.4) {
                    results.push({
                        method: 'pdf_structure_repair',
                        data: basicPDFStructure,
                        confidence: confidence,
                        description: 'Basic PDF structure repair'
                    });
                }
            }
        }
        
        return results;
    }
    
    calculatePDFConfidence(data) {
        let confidence = 0;
        
        // Verificar assinatura PDF
        if (data.slice(0, 4).toString() === '%PDF') {
            confidence += 0.4;
        }
        
        // Procurar por palavras-chave PDF
        const dataStr = data.toString('latin1');
        const pdfKeywords = ['obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref'];
        
        for (const keyword of pdfKeywords) {
            if (dataStr.includes(keyword)) {
                confidence += 0.1;
            }
        }
        
        // Verificar estrutura básica
        if (dataStr.includes('%%EOF')) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    createBasicPDFStructure(originalData) {
        try {
            // Criar estrutura PDF básica mínima
            const header = '%PDF-1.4\n';
            const catalog = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
            const pages = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
            const page = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n';
            
            // Tentar incorporar dados originais como stream
            const streamData = originalData.slice(0, Math.min(originalData.length, 50000)); // Limitar tamanho
            const stream = `4 0 obj\n<< /Length ${streamData.length} >>\nstream\n`;
            const streamEnd = '\nendstream\nendobj\n';
            
            const xref = 'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \n';
            const trailer = 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n';
            const startxref = (header + catalog + pages + page + stream).length + streamData.length + streamEnd.length;
            const eof = '\n%%EOF';
            
            // Montar PDF
            const pdfParts = [
                Buffer.from(header),
                Buffer.from(catalog),
                Buffer.from(pages),
                Buffer.from(page),
                Buffer.from(stream),
                streamData,
                Buffer.from(streamEnd),
                Buffer.from(xref),
                Buffer.from(trailer),
                Buffer.from(startxref.toString()),
                Buffer.from(eof)
            ];
            
            return Buffer.concat(pdfParts);
        } catch (error) {
            return null;
        }
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
                console.log(`💾 Resultado salvo: ${path.basename(outputPath)} (confiança: ${result.confidence.toFixed(2)})`);
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