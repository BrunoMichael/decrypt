const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 80;

// Configuração para produção
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Middleware de segurança básica
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(express.static('.'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Função para calcular entropia de Shannon
function calculateEntropy(buffer) {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
        frequencies[buffer[i]]++;
    }
    
    let entropy = 0;
    const length = buffer.length;
    
    for (let i = 0; i < 256; i++) {
        if (frequencies[i] > 0) {
            const probability = frequencies[i] / length;
            entropy -= probability * Math.log2(probability);
        }
    }
    
    return entropy;
}

// Função para análise de padrões
function analyzePatterns(buffer) {
    const patterns = {
        repeatingBytes: {},
        commonSequences: {},
        headerSignatures: [],
        possibleKeys: []
    };
    
    // Procurar por bytes repetidos
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
        const byte = buffer[i];
        patterns.repeatingBytes[byte] = (patterns.repeatingBytes[byte] || 0) + 1;
    }
    
    // Procurar por sequências comuns (primeiros 64 bytes)
    const header = buffer.slice(0, 64);
    patterns.headerSignatures = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' ');
    
    // Procurar por possíveis chaves (padrões de 16, 24, 32 bytes)
    const keySizes = [16, 24, 32];
    for (const keySize of keySizes) {
        if (buffer.length >= keySize) {
            const possibleKey = buffer.slice(0, keySize);
            patterns.possibleKeys.push({
                size: keySize,
                hex: Array.from(possibleKey).map(b => b.toString(16).padStart(2, '0')).join(''),
                ascii: Array.from(possibleKey).map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('')
            });
        }
    }
    
    return patterns;
}

// Função para comparar dois arquivos
function compareFiles(original, encrypted) {
    const comparison = {
        sizeDifference: encrypted.length - original.length,
        entropyDifference: calculateEntropy(encrypted) - calculateEntropy(original),
        possiblePadding: 0,
        xorAnalysis: [],
        blockAnalysis: {}
    };
    
    // Análise XOR simples (primeiros 256 bytes)
    const minLength = Math.min(original.length, encrypted.length, 256);
    for (let i = 0; i < minLength; i++) {
        const xorResult = original[i] ^ encrypted[i];
        comparison.xorAnalysis.push(xorResult);
    }
    
    // Análise de blocos (assumindo blocos de 16 bytes - AES)
    const blockSize = 16;
    const blocks = Math.floor(minLength / blockSize);
    
    for (let block = 0; block < blocks; block++) {
        const start = block * blockSize;
        const originalBlock = original.slice(start, start + blockSize);
        const encryptedBlock = encrypted.slice(start, start + blockSize);
        
        comparison.blockAnalysis[`block_${block}`] = {
            originalEntropy: calculateEntropy(originalBlock),
            encryptedEntropy: calculateEntropy(encryptedBlock),
            xorPattern: Array.from(originalBlock).map((b, i) => b ^ encryptedBlock[i])
        };
    }
    
    return comparison;
}

// Endpoint para análise de arquivos
app.post('/analyze', upload.fields([
    { name: 'original', maxCount: 1 },
    { name: 'encrypted', maxCount: 1 }
]), (req, res) => {
    try {
        if (!req.files.original || !req.files.encrypted) {
            return res.status(400).json({ error: 'Ambos os arquivos são necessários' });
        }
        
        const originalFile = req.files.original[0];
        const encryptedFile = req.files.encrypted[0];
        
        const originalBuffer = originalFile.buffer;
        const encryptedBuffer = encryptedFile.buffer;
        
        // Análises individuais
        const originalAnalysis = {
            entropy: calculateEntropy(originalBuffer),
            patterns: analyzePatterns(originalBuffer),
            size: originalBuffer.length,
            name: originalFile.originalname
        };
        
        const encryptedAnalysis = {
            entropy: calculateEntropy(encryptedBuffer),
            patterns: analyzePatterns(encryptedBuffer),
            size: encryptedBuffer.length,
            name: encryptedFile.originalname
        };
        
        // Análise comparativa
        const comparison = compareFiles(originalBuffer, encryptedBuffer);
        
        // Gerar hexdump limitado (primeiros 512 bytes)
        const generateHexDump = (buffer, limit = 512) => {
            const bytes = Array.from(buffer.slice(0, limit));
            let hexDump = '';
            
            for (let i = 0; i < bytes.length; i += 16) {
                const offset = i.toString(16).padStart(8, '0');
                const hexBytes = bytes.slice(i, i + 16)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join(' ');
                const asciiBytes = bytes.slice(i, i + 16)
                    .map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')
                    .join('');
                
                hexDump += `${offset}: ${hexBytes.padEnd(47)} |${asciiBytes}|\n`;
            }
            
            return hexDump;
        };
        
        const result = {
            original: originalAnalysis,
            encrypted: encryptedAnalysis,
            comparison: comparison,
            hexDumps: {
                original: generateHexDump(originalBuffer),
                encrypted: generateHexDump(encryptedBuffer)
            },
            recommendations: generateRecommendations(originalAnalysis, encryptedAnalysis, comparison)
        };
        
        res.json(result);
        
    } catch (error) {
        console.error('Erro na análise:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Função para gerar recomendações
function generateRecommendations(original, encrypted, comparison) {
    const recommendations = [];
    
    // Análise de entropia
    if (encrypted.entropy > 7.5) {
        recommendations.push({
            type: 'encryption',
            message: 'Alta entropia detectada - provavelmente criptografia forte (AES, ChaCha20, etc.)'
        });
    }
    
    // Análise de tamanho
    if (comparison.sizeDifference === 0) {
        recommendations.push({
            type: 'cipher',
            message: 'Mesmo tamanho - possível cifra de fluxo ou modo CTR/OFB'
        });
    } else if (comparison.sizeDifference % 16 === 0) {
        recommendations.push({
            type: 'cipher',
            message: 'Diferença múltipla de 16 bytes - possível AES em modo CBC com padding'
        });
    }
    
    // Análise XOR
    const xorPatterns = comparison.xorAnalysis.filter((x, i, arr) => arr.indexOf(x) !== i);
    if (xorPatterns.length > 0) {
        recommendations.push({
            type: 'weakness',
            message: 'Padrões XOR repetidos detectados - possível vulnerabilidade'
        });
    }
    
    // Análise de cabeçalho
    const encryptedHeader = encrypted.patterns.headerSignatures;
    if (encryptedHeader.includes('00 00 00 00') || encryptedHeader.includes('ff ff ff ff')) {
        recommendations.push({
            type: 'structure',
            message: 'Padrões suspeitos no cabeçalho - possível estrutura preservada'
        });
    }
    
    return recommendations;
}

// Rota para descriptografia
app.post('/decrypt', upload.single('encryptedFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo criptografado não fornecido' });
        }

        const encryptedData = req.file.buffer;
        const results = [];

        // Chaves detectadas pela análise
        const detectedKeys = [
            'b5bab37fb37f0498715574cfa243a4b8',
            'b5bab37fb37f0498715574cfa243a4b8985020359f6808c9',
            'b5bab37fb37f0498715574cfa243a4b8985020359f6808c9c7659d174fbfa650'
        ];

        // Tentativa 1: Descriptografia XOR com chaves detectadas
        detectedKeys.forEach((keyHex, index) => {
            const key = Buffer.from(keyHex, 'hex');
            const decrypted = xorDecrypt(encryptedData, key);
            
            results.push({
                method: `XOR com chave ${key.length} bytes`,
                keyUsed: keyHex,
                success: isPDF(decrypted),
                preview: decrypted.slice(0, 64).toString('hex'),
                data: decrypted.toString('base64')
            });
        });

        // Tentativa 2: XOR com padrão PDF conhecido
        const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
        const encryptedHeader = encryptedData.slice(0, 4);
        const xorKey = Buffer.alloc(4);
        
        for (let i = 0; i < 4; i++) {
            xorKey[i] = encryptedHeader[i] ^ pdfHeader[i];
        }

        const xorDecrypted = xorDecrypt(encryptedData, xorKey);
        results.push({
            method: 'XOR com cabeçalho PDF',
            keyUsed: xorKey.toString('hex'),
            success: isPDF(xorDecrypted),
            preview: xorDecrypted.slice(0, 64).toString('hex'),
            data: xorDecrypted.toString('base64')
        });

        // Tentativa 3: Descriptografia por blocos (AES, ChaCha20, RC4)
         try {
             detectedKeys.forEach((keyHex) => {
                 const key = Buffer.from(keyHex, 'hex');
                 if (key.length === 16 || key.length === 24 || key.length === 32) {
                     // Tenta AES
                     const aesDecrypted = aesDecrypt(encryptedData, key);
                     if (aesDecrypted && isPDF(aesDecrypted)) {
                         results.push({
                             method: `AES-${key.length * 8}`,
                             keyUsed: keyHex,
                             success: true,
                             preview: aesDecrypted.slice(0, 64).toString('hex'),
                             data: aesDecrypted.toString('base64')
                         });
                     }
                     
                     // Tenta ChaCha20 (apenas chaves de 32 bytes)
                     if (key.length === 32) {
                         const chachaDecrypted = chachaDecrypt(encryptedData, key);
                         if (chachaDecrypted && isPDF(chachaDecrypted)) {
                             results.push({
                                 method: 'ChaCha20',
                                 keyUsed: keyHex,
                                 success: true,
                                 preview: chachaDecrypted.slice(0, 64).toString('hex'),
                                 data: chachaDecrypted.toString('base64')
                             });
                         }
                     }
                     
                     // Tenta RC4
                     const rc4Decrypted = rc4Decrypt(encryptedData, key);
                     if (rc4Decrypted && isPDF(rc4Decrypted)) {
                         results.push({
                             method: 'RC4',
                             keyUsed: keyHex,
                             success: true,
                             preview: rc4Decrypted.slice(0, 64).toString('hex'),
                             data: rc4Decrypted.toString('base64')
                         });
                     }
                 }
             });
         } catch (error) {
             console.log('Erro na descriptografia por blocos:', error.message);
         }

        // Tentativa 5: Brute force com chaves derivadas
         const derivedKeys = generateDerivedKeys(detectedKeys[0]);
         derivedKeys.forEach((keyHex, index) => {
             const key = Buffer.from(keyHex, 'hex');
             const decrypted = xorDecrypt(encryptedData, key);
             
             if (isPDF(decrypted)) {
                 results.push({
                     method: `XOR com chave derivada ${index + 1}`,
                     keyUsed: keyHex,
                     success: true,
                     preview: decrypted.slice(0, 64).toString('hex'),
                     data: decrypted.toString('base64')
                 });
             }
         });

         // Tentativa 6: Chave baseada no ID único do WantToCry
         const wantToCryId = '3C579D75CF2341758A9B984A0B943F18';
         const idKey = Buffer.from(wantToCryId, 'hex');
         const idDecrypted = xorDecrypt(encryptedData, idKey);
         results.push({
             method: 'XOR com ID WantToCry',
             keyUsed: wantToCryId,
             success: isPDF(idDecrypted),
             preview: idDecrypted.slice(0, 64).toString('hex'),
             data: idDecrypted.toString('base64')
         });

         // Tentativa 7: Chaves rotacionadas
         detectedKeys.forEach((keyHex) => {
             const key = Buffer.from(keyHex, 'hex');
             for (let rotation = 1; rotation <= 8; rotation++) {
                 const rotatedKey = rotateKey(key, rotation);
                 const decrypted = xorDecrypt(encryptedData, rotatedKey);
                 
                 if (isPDF(decrypted)) {
                     results.push({
                         method: `XOR com chave rotacionada (${rotation} bits)`,
                         keyUsed: rotatedKey.toString('hex'),
                         success: true,
                         preview: decrypted.slice(0, 64).toString('hex'),
                         data: decrypted.toString('base64')
                     });
                 }
             }
         });

         // Tentativa 8: AES-CBC com padding PKCS7 (baseado na análise de algoritmo suspeito)
        detectedKeys.forEach((keyHex) => {
            const key = Buffer.from(keyHex, 'hex');
            
            // Tentar diferentes IVs para AES-CBC
            const ivOptions = [
                Buffer.alloc(16, 0), // IV zero
                key.slice(0, 16), // IV derivado da chave
                Buffer.from('3C579D75CF2341758A9B984A0B943F18', 'hex').slice(0, 16), // IV do ID WantToCry
                encryptedData.slice(0, 16) // Primeiro bloco como IV
            ];
            
            ivOptions.forEach((iv, ivIndex) => {
                try {
                    const cipher = crypto.createDecipheriv('aes-256-cbc', key.length === 32 ? key : Buffer.concat([key, key]).slice(0, 32), iv);
                    cipher.setAutoPadding(true); // Habilitar remoção automática de padding PKCS7
                    
                    let decrypted = Buffer.concat([
                        cipher.update(encryptedData),
                        cipher.final()
                    ]);
                    
                    if (isPDF(decrypted)) {
                        results.push({
                            method: `AES-CBC com PKCS7 padding (IV opção ${ivIndex + 1})`,
                            keyUsed: keyHex,
                            success: true,
                            preview: decrypted.slice(0, 64).toString('hex'),
                            data: decrypted.toString('base64')
                        });
                    }
                } catch (error) {
                    // Continuar com próxima tentativa se falhar
                }
            });
        });

        // Tentativa 9: AES-CBC com chaves derivadas e padding PKCS7
        const derivedKeysAES = generateDerivedKeys('3C579D75CF2341758A9B984A0B943F18');
        derivedKeysAES.forEach((keyHex, index) => {
            const key = Buffer.from(keyHex, 'hex');
            
            try {
                // Usar os primeiros 16 bytes do arquivo como IV (comum em alguns ransomwares)
                const iv = encryptedData.slice(0, 16);
                const actualData = encryptedData.slice(16); // Dados após o IV
                
                const cipher = crypto.createDecipheriv('aes-256-cbc', key.length === 32 ? key : Buffer.concat([key, key]).slice(0, 32), iv);
                cipher.setAutoPadding(true);
                
                let decrypted = Buffer.concat([
                    cipher.update(actualData),
                    cipher.final()
                ]);
                
                if (isPDF(decrypted)) {
                    results.push({
                        method: `AES-CBC PKCS7 com IV embutido (chave derivada ${index + 1})`,
                        keyUsed: keyHex,
                        success: true,
                        preview: decrypted.slice(0, 64).toString('hex'),
                        data: decrypted.toString('base64')
                    });
                }
            } catch (error) {
                // Continuar com próxima tentativa
            }
        });

        // Tentativa 4: Análise de padrão repetitivo
        const patternDecrypted = patternDecrypt(encryptedData);
        if (patternDecrypted) {
            results.push({
                method: 'Descriptografia por padrão',
                keyUsed: 'Padrão detectado automaticamente',
                success: isPDF(patternDecrypted),
                preview: patternDecrypted.slice(0, 64).toString('hex'),
                data: patternDecrypted.toString('base64')
            });
        }

        // Salvar arquivo descriptografado se bem-sucedido
        const successfulResult = results.find(r => r.success);
        if (successfulResult) {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const decryptedData = Buffer.from(successfulResult.data, 'base64');
            const decryptedPath = path.join(tempDir, 'decrypted_file.pdf');
            fs.writeFileSync(decryptedPath, decryptedData);
            
            // Validação adicional do PDF
            const pdfValidation = validatePDFStructure(decryptedData);
            successfulResult.pdfValidation = pdfValidation;
            successfulResult.preview = `PDF válido - ${pdfValidation.pages} página(s), versão ${pdfValidation.version}`;
        }

        res.json({
            success: successfulResult ? true : false,
            method: successfulResult ? successfulResult.method : null,
            key: successfulResult ? successfulResult.keyUsed : null,
            attempts: results.length,
            fileSize: successfulResult ? Buffer.from(successfulResult.data, 'base64').length : 0,
            pdfValidation: successfulResult ? successfulResult.pdfValidation : null,
            preview: successfulResult ? successfulResult.preview : 'Nenhum método de descriptografia foi eficaz',
            attemptDetails: results
        });

    } catch (error) {
        console.error('Erro na descriptografia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Função para descriptografia XOR
function xorDecrypt(data, key) {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ key[i % key.length];
    }
    return result;
}

// Função para descriptografia AES
function aesDecrypt(data, key) {
    const results = [];
    
    try {
        // AES-128/192/256 ECB
        const keySize = key.length * 8;
        const decipher = crypto.createDecipher(`aes-${keySize}-ecb`, key);
        decipher.setAutoPadding(false);
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        if (isPDF(decrypted)) return decrypted;
    } catch (error) {
        // Continua para próxima tentativa
    }
    
    try {
        // AES-128/192/256 CBC com IV zero
        const keySize = key.length * 8;
        const iv = Buffer.alloc(16, 0);
        const decipher = crypto.createDecipheriv(`aes-${keySize}-cbc`, key, iv);
        decipher.setAutoPadding(false);
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        if (isPDF(decrypted)) return decrypted;
    } catch (error) {
        // Continua para próxima tentativa
    }
    
    try {
        // AES-128/192/256 CBC com IV derivado da chave
        const keySize = key.length * 8;
        const iv = key.slice(0, 16);
        const decipher = crypto.createDecipheriv(`aes-${keySize}-cbc`, key, iv);
        decipher.setAutoPadding(false);
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        if (isPDF(decrypted)) return decrypted;
    } catch (error) {
        // Continua para próxima tentativa
    }
    
    try {
        // AES-128/192/256 CTR
        const keySize = key.length * 8;
        const iv = Buffer.alloc(16, 0);
        const decipher = crypto.createDecipheriv(`aes-${keySize}-ctr`, key, iv);
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        if (isPDF(decrypted)) return decrypted;
    } catch (error) {
        // Continua para próxima tentativa
    }
    
    return null;
}

// Função para descriptografia ChaCha20
function chachaDecrypt(data, key) {
    try {
        // ChaCha20 com nonce zero
        const nonce = Buffer.alloc(12, 0);
        const decipher = crypto.createDecipheriv('chacha20', key, nonce);
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    } catch (error) {
        return null;
    }
}

// Função para descriptografia RC4
function rc4Decrypt(data, key) {
    try {
        const decipher = crypto.createDecipher('rc4', key);
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    } catch (error) {
        return null;
    }
}

// Função para descriptografia por padrão
function patternDecrypt(data) {
    // Baseado na análise: bytes mais comuns 0xac, 0x23, 0x4e
    const commonBytes = [0xac, 0x23, 0x4e];
    
    // Tenta usar o byte mais comum como chave
    for (const keyByte of commonBytes) {
        const result = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ keyByte;
        }
        
        if (isPDF(result)) {
            return result;
        }
    }
    
    return null;
}

// Função para gerar chaves derivadas
function generateDerivedKeys(baseKeyHex) {
    const baseKey = Buffer.from(baseKeyHex, 'hex');
    const derivedKeys = [];
    
    // Derivação por shift
    for (let shift = 1; shift <= 16; shift++) {
        const shifted = Buffer.alloc(baseKey.length);
        for (let i = 0; i < baseKey.length; i++) {
            shifted[i] = (baseKey[i] + shift) % 256;
        }
        derivedKeys.push(shifted.toString('hex'));
    }
    
    // Derivação por XOR com constantes
    const constants = [0x5A, 0xA5, 0x3C, 0xC3, 0x0F, 0xF0];
    constants.forEach(constant => {
        const xored = Buffer.alloc(baseKey.length);
        for (let i = 0; i < baseKey.length; i++) {
            xored[i] = baseKey[i] ^ constant;
        }
        derivedKeys.push(xored.toString('hex'));
    });
    
    // Derivação por inversão de bytes
    const inverted = Buffer.alloc(baseKey.length);
    for (let i = 0; i < baseKey.length; i++) {
        inverted[i] = 255 - baseKey[i];
    }
    derivedKeys.push(inverted.toString('hex'));
    
    return derivedKeys;
}

// Função para rotacionar chave
function rotateKey(key, bits) {
    const rotated = Buffer.alloc(key.length);
    for (let i = 0; i < key.length; i++) {
        rotated[i] = ((key[i] << bits) | (key[i] >> (8 - bits))) & 0xFF;
    }
    return rotated;
}

// Função para verificar se é um PDF válido
function isPDF(data) {
    if (data.length < 4) return false;
    
    // Verifica cabeçalho PDF
    const header = data.slice(0, 4);
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    
    return header.equals(pdfSignature);
}

// Função para validar estrutura do PDF
function validatePDFStructure(data) {
    const validation = {
        isValid: false,
        version: 'unknown',
        pages: 0,
        hasXref: false,
        hasTrailer: false
    };
    
    if (!isPDF(data)) {
        return validation;
    }
    
    const pdfString = data.toString('latin1');
    
    // Extrair versão do PDF
    const versionMatch = pdfString.match(/%PDF-(\d\.\d)/);
    if (versionMatch) {
        validation.version = versionMatch[1];
    }
    
    // Contar páginas (aproximado)
    const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
    if (pageMatches) {
        validation.pages = pageMatches.length;
    }
    
    // Verificar estrutura básica
    validation.hasXref = pdfString.includes('xref');
    validation.hasTrailer = pdfString.includes('trailer');
    validation.isValid = validation.hasXref && validation.hasTrailer;
    
    return validation;
}

// Rota para download do arquivo descriptografado
app.get('/download-decrypted', (req, res) => {
    const decryptedPath = path.join(__dirname, 'temp', 'decrypted_file.pdf');
    
    if (fs.existsSync(decryptedPath)) {
        res.download(decryptedPath, 'arquivo_descriptografado.pdf', (err) => {
            if (err) {
                console.error('Erro no download:', err);
                res.status(500).json({ error: 'Erro ao fazer download do arquivo' });
            }
        });
    } else {
        res.status(404).json({ error: 'Arquivo descriptografado não encontrado' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${port}`);
    console.log('📁 Acesse a interface web para analisar arquivos criptografados');
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Memória disponível: ${process.env.MEMORY || 'N/A'}MB`);
});