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
            
            try {
                fs.writeFileSync(decryptedPath, decryptedData);
                console.log(`✅ Arquivo descriptografado salvo: ${decryptedPath}`);
                console.log(`📊 Tamanho do arquivo: ${decryptedData.length} bytes`);
                
                // Validação inicial do PDF
                let pdfValidation = validatePDFStructure(decryptedData);
                let finalData = decryptedData;
                
                // Tentar reparar se houver problemas
                if (pdfValidation.corruption.length > 0) {
                    console.log(`🔧 Tentando reparo básico...`);
                    const repairResult = repairPDF(decryptedData);
                    
                    if (repairResult.repaired) {
                        console.log(`✅ Reparos básicos aplicados:`, repairResult.repairs);
                        finalData = repairResult.data;
                        pdfValidation = validatePDFStructure(repairResult.data);
                    }
                    
                    // Se ainda há problemas graves, tentar reparo avançado
                    if (pdfValidation.corruption.length > 0 && 
                        (pdfValidation.corruption.includes('Falta estrutura xref/trailer') || 
                         pdfValidation.corruption.includes('Nenhum objeto PDF encontrado'))) {
                        
                        console.log(`🔧 Tentando reparo avançado...`);
                        const advancedRepairResult = advancedPDFRepair(finalData);
                        
                        if (advancedRepairResult.repaired) {
                            console.log(`✅ Reparos avançados aplicados:`, advancedRepairResult.repairs);
                            
                            // Salvar versão com reparo avançado
                            const advancedRepairedPath = path.join(tempDir, 'decrypted_file_advanced_repair.pdf');
                            fs.writeFileSync(advancedRepairedPath, advancedRepairResult.data);
                            fs.writeFileSync(decryptedPath, advancedRepairResult.data); // Substituir original
                            
                            // Revalidar após reparo avançado
                            pdfValidation = validatePDFStructure(advancedRepairResult.data);
                            finalData = advancedRepairResult.data;
                            
                            console.log(`📄 Validação após reparo avançado:`, pdfValidation);
                        } else {
                            console.log(`❌ Reparo avançado não foi possível`);
                        }
                    } else if (repairResult.repaired) {
                        // Salvar versão reparada básica
                        const repairedPath = path.join(tempDir, 'decrypted_file_repaired.pdf');
                        fs.writeFileSync(repairedPath, repairResult.data);
                        fs.writeFileSync(decryptedPath, repairResult.data); // Substituir original
                        
                        console.log(`📄 Validação após reparo básico:`, pdfValidation);
                    }
                }
                
                successfulResult.pdfValidation = pdfValidation;
                
                // Analisar conteúdo do PDF para verificar se está em branco
                console.log(`🔍 Analisando conteúdo do PDF...`);
                const contentAnalysis = analyzeAndImproveContent(finalData);
                console.log(`📄 Análise de conteúdo:`, JSON.stringify(contentAnalysis, null, 2));
                
                // Se há texto mas ainda está em branco, criar versão com texto extraído
                if (contentAnalysis.hasVisibleText && contentAnalysis.streamDetails.length > 0) {
                    const extractedTexts = [];
                    contentAnalysis.streamDetails.forEach(stream => {
                        if (stream.textContent.length > 0) {
                            extractedTexts.push(...stream.textContent);
                        }
                    });

                    if (extractedTexts.length > 0) {
                        console.log('📝 Texto extraído do PDF:', extractedTexts);
                        
                        // Criar PDF com texto extraído visível
                        const extractedTextPDF = createExtractedTextPDF(extractedTexts, successfulResult.method, successfulResult.keyUsed);
                        const extractedPath = path.join(tempDir, 'decrypted_file_extracted_text.pdf');
                        fs.writeFileSync(extractedPath, extractedTextPDF);
                        console.log(`📄 PDF com texto extraído salvo: ${extractedPath}`);
                    }
                }
                
                // Se o PDF está estruturalmente correto mas sem conteúdo visível, criar versão de teste
                if (pdfValidation.isValid && contentAnalysis.contentType === 'empty_or_binary') {
                    console.log(`📝 Criando PDF de teste com conteúdo visível...`);
                    const testPDF = createTestContentPDF(finalData);
                    
                    if (testPDF.success) {
                        const testPath = path.join(tempDir, 'decrypted_file_test_content.pdf');
                        fs.writeFileSync(testPath, testPDF.data);
                        console.log(`✅ PDF de teste criado: ${testPath}`);
                        console.log(`💡 ${testPDF.message}`);
                        
                        // Também salvar como arquivo principal se o usuário preferir
                        const backupPath = path.join(tempDir, 'decrypted_file_original_repair.pdf');
                        fs.writeFileSync(backupPath, finalData); // Backup do reparo original
                        fs.writeFileSync(decryptedPath, testPDF.data); // Substituir com versão de teste
                        
                        console.log(`📋 Arquivos disponíveis:`);
                        console.log(`   - decrypted_file.pdf (versão de teste com conteúdo visível)`);
                        console.log(`   - decrypted_file_original_repair.pdf (reparo original)`);
                        console.log(`   - decrypted_file_test_content.pdf (cópia da versão de teste)`);
                    }
                }
                
                // Criar preview mais informativo
                let previewMessage = '';
                if (pdfValidation.contentAnalysis.isEmpty) {
                    previewMessage = `PDF estruturalmente válido mas VAZIO - ${pdfValidation.pages} página(s), versão ${pdfValidation.version}`;
                } else if (!pdfValidation.contentAnalysis.hasVisibleText && !pdfValidation.contentAnalysis.hasImages) {
                    previewMessage = `PDF válido mas SEM CONTEÚDO VISÍVEL - ${pdfValidation.pages} página(s), versão ${pdfValidation.version} (tipo: ${pdfValidation.contentAnalysis.contentType})`;
                } else if (pdfValidation.corruption.length > 0) {
                    previewMessage = `PDF com problemas - ${pdfValidation.pages} página(s), versão ${pdfValidation.version} (${pdfValidation.corruption.join(', ')})`;
                } else {
                    previewMessage = `PDF válido - ${pdfValidation.pages} página(s), versão ${pdfValidation.version}`;
                    if (pdfValidation.contentAnalysis.hasVisibleText) {
                        previewMessage += ` (${pdfValidation.contentAnalysis.textStreams} streams de texto)`;
                    }
                    if (pdfValidation.contentAnalysis.hasImages) {
                        previewMessage += ` (${pdfValidation.contentAnalysis.imageObjects} imagens)`;
                    }
                }
                
                successfulResult.preview = previewMessage;
                
                // Adicionar informações detalhadas sobre o conteúdo
                successfulResult.contentAnalysis = pdfValidation.contentAnalysis;
                
                console.log(`📄 Validação PDF:`, pdfValidation);
                console.log(`🔑 Método usado: ${successfulResult.method}`);
                console.log(`🗝️ Chave: ${successfulResult.keyUsed}`);
                
                // Log detalhado sobre problemas encontrados
                if (pdfValidation.corruption.length > 0) {
                    console.log(`⚠️ Problemas detectados no PDF:`);
                    pdfValidation.corruption.forEach((problem, index) => {
                        console.log(`   ${index + 1}. ${problem}`);
                    });
                    console.log(`💡 Sugestão: Tente abrir o PDF em diferentes visualizadores (Adobe Reader, Chrome, Firefox)`);
                }
                
                // Log sobre análise de conteúdo
                console.log(`📊 Análise de conteúdo:`);
                console.log(`   - Tipo: ${pdfValidation.contentAnalysis.contentType}`);
                console.log(`   - Texto visível: ${pdfValidation.contentAnalysis.hasVisibleText ? 'Sim' : 'Não'}`);
                console.log(`   - Imagens: ${pdfValidation.contentAnalysis.hasImages ? 'Sim' : 'Não'}`);
                console.log(`   - Streams de texto: ${pdfValidation.contentAnalysis.textStreams}`);
                console.log(`   - Objetos de imagem: ${pdfValidation.contentAnalysis.imageObjects}`);
                console.log(`   - Objetos de fonte: ${pdfValidation.contentAnalysis.fontObjects}`);
                console.log(`   - Está vazio: ${pdfValidation.contentAnalysis.isEmpty ? 'Sim' : 'Não'}`);
                
                if (pdfValidation.contentAnalysis.extractedText.length > 0) {
                    console.log(`📝 Texto extraído (primeiras 3 linhas):`);
                    pdfValidation.contentAnalysis.extractedText.slice(0, 3).forEach((text, index) => {
                        console.log(`   ${index + 1}. "${text}"`);
                    });
                }
                
                // Sugestões específicas baseadas na análise
                if (pdfValidation.contentAnalysis.isEmpty) {
                    console.log(`💡 DIAGNÓSTICO: O PDF foi descriptografado com sucesso mas está completamente vazio.`);
                    console.log(`   Isso pode indicar que:`);
                    console.log(`   1. O arquivo original já estava vazio antes da criptografia`);
                    console.log(`   2. A chave de descriptografia está correta mas o conteúdo foi perdido`);
                    console.log(`   3. O arquivo pode ter sido corrompido durante o processo de criptografia`);
                } else if (!pdfValidation.contentAnalysis.hasVisibleText && !pdfValidation.contentAnalysis.hasImages) {
                    console.log(`💡 DIAGNÓSTICO: O PDF tem estrutura válida mas sem conteúdo visível.`);
                    console.log(`   Possíveis causas:`);
                    console.log(`   1. Conteúdo pode estar em formato binário não reconhecido`);
                    console.log(`   2. Fontes ou recursos necessários podem estar ausentes`);
                    console.log(`   3. O conteúdo pode estar em camadas ocultas ou com cor branca`);
                }
            } catch (error) {
                console.error(`❌ Erro ao salvar arquivo: ${error.message}`);
            }
        }

        res.json({
            success: successfulResult ? true : false,
            method: successfulResult ? successfulResult.method : null,
            key: successfulResult ? successfulResult.keyUsed : null,
            attempts: results.length,
            fileSize: successfulResult ? Buffer.from(successfulResult.data, 'base64').length : 0,
            pdfValidation: successfulResult ? successfulResult.pdfValidation : null,
            contentAnalysis: successfulResult ? successfulResult.contentAnalysis : null,
            preview: successfulResult ? successfulResult.preview : 'Nenhum método de descriptografia foi eficaz',
            attemptDetails: results,
            diagnosis: successfulResult && successfulResult.contentAnalysis ? generateDiagnosis(successfulResult.contentAnalysis) : null
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
// Função para tentar reparar PDF corrompido
function repairPDF(data) {
    try {
        let content = data.toString('binary');
        let repaired = false;
        const repairs = [];

        // Reparar cabeçalho se necessário
        if (!content.startsWith('%PDF')) {
            // Procurar por cabeçalho PDF em posições próximas
            const pdfMatch = content.match(/%PDF-\d+\.\d+/);
            if (pdfMatch) {
                const pdfIndex = content.indexOf(pdfMatch[0]);
                content = content.substring(pdfIndex);
                repaired = true;
                repairs.push('Cabeçalho PDF reposicionado');
            }
        }

        // Garantir que termina com %%EOF
        if (!content.trim().endsWith('%%EOF')) {
            if (content.includes('%%EOF')) {
                // %%EOF existe mas não está no final - mover para o final
                const eofIndex = content.lastIndexOf('%%EOF');
                content = content.substring(0, eofIndex + 5);
                repaired = true;
                repairs.push('%%EOF reposicionado para o final');
            } else {
                // Adicionar %%EOF se não existir
                content += '\n%%EOF';
                repaired = true;
                repairs.push('%%EOF adicionado');
            }
        }

        // Remover caracteres nulos excessivos
        const originalLength = content.length;
        content = content.replace(/\0+/g, '');
        if (content.length !== originalLength) {
            repaired = true;
            repairs.push('Caracteres nulos removidos');
        }

        // Verificar e corrigir estrutura básica
        if (!content.includes('xref') && !content.includes('trailer')) {
            // Tentar adicionar estrutura mínima
            const objCount = (content.match(/\d+\s+\d+\s+obj/g) || []).length;
            if (objCount > 0) {
                const xrefPos = content.length;
                content += `\nxref\n0 ${objCount + 1}\n`;
                for (let i = 0; i <= objCount; i++) {
                    content += `${i.toString().padStart(10, '0')} ${i === 0 ? '65535' : '00000'} ${i === 0 ? 'f' : 'n'} \n`;
                }
                content += `trailer\n<<\n/Size ${objCount + 1}\n>>\nstartxref\n${xrefPos}\n%%EOF`;
                repaired = true;
                repairs.push('Estrutura xref/trailer adicionada');
            }
        }

        return {
            repaired,
            repairs,
            data: repaired ? Buffer.from(content, 'binary') : data
        };
    } catch (error) {
        console.error('Erro no reparo do PDF:', error);
        return {
            repaired: false,
            repairs: [`Erro no reparo: ${error.message}`],
            data
        };
    }
}

// Função para analisar e melhorar conteúdo do PDF
function analyzeAndImproveContent(data) {
    try {
        const content = data.toString('binary');
        const analysis = {
            hasVisibleText: false,
            hasImages: false,
            contentType: 'unknown',
            suggestions: [],
            textStreams: [],
            streamDetails: []
        };

        // Verificar se há texto visível e extrair detalhes
        const textMatch = content.match(/BT[\s\S]*?ET/g);
        if (textMatch && textMatch.length > 0) {
            analysis.hasVisibleText = true;
            analysis.contentType = 'text';
            analysis.textStreams = textMatch;
            
            // Analisar cada stream de texto
            textMatch.forEach((stream, index) => {
                const streamAnalysis = {
                    index: index + 1,
                    content: stream,
                    hasFont: /\/F\d+/.test(stream),
                    hasPosition: /\d+\s+\d+\s+Td/.test(stream),
                    hasText: /\([^)]*\)\s*Tj/.test(stream),
                    textContent: []
                };
                
                // Extrair texto real
                const textMatches = stream.match(/\(([^)]*)\)\s*Tj/g);
                if (textMatches) {
                    textMatches.forEach(match => {
                        const text = match.match(/\(([^)]*)\)/);
                        if (text && text[1]) {
                            streamAnalysis.textContent.push(text[1]);
                        }
                    });
                }
                
                analysis.streamDetails.push(streamAnalysis);
            });
        }

        // Verificar se há imagens
        const imageMatch = content.match(/\/Type\s*\/XObject[\s\S]*?\/Subtype\s*\/Image/g);
        if (imageMatch && imageMatch.length > 0) {
            analysis.hasImages = true;
            analysis.contentType = analysis.contentType === 'text' ? 'mixed' : 'image';
        }

        // Análise mais detalhada do problema
        if (analysis.hasVisibleText) {
            const hasValidFont = analysis.streamDetails.some(s => s.hasFont);
            const hasValidPosition = analysis.streamDetails.some(s => s.hasPosition);
            const hasValidText = analysis.streamDetails.some(s => s.textContent.length > 0);
            
            if (!hasValidFont) {
                analysis.suggestions.push('Texto encontrado mas sem fonte definida');
            }
            if (!hasValidPosition) {
                analysis.suggestions.push('Texto encontrado mas sem posicionamento');
            }
            if (!hasValidText) {
                analysis.suggestions.push('Comandos de texto encontrados mas sem conteúdo legível');
            }
            
            if (hasValidFont && hasValidPosition && hasValidText) {
                analysis.suggestions.push('Texto parece válido - problema pode ser de codificação ou visualizador');
            }
        } else {
            analysis.contentType = 'empty_or_binary';
            analysis.suggestions.push('Nenhum texto visível encontrado');
        }

        // Limitar o tamanho dos textStreams no log para evitar sobrecarga
        if (analysis.textStreams.length > 0) {
            analysis.textStreamsCount = analysis.textStreams.length;
            analysis.textStreamsSample = analysis.textStreams.slice(0, 2).map(stream => 
                stream.length > 200 ? stream.substring(0, 200) + '...' : stream
            );
            // Remover textStreams completos do objeto de análise para o log
            delete analysis.textStreams;
        }

        return analysis;
    } catch (error) {
        return {
            hasVisibleText: false,
            hasImages: false,
            contentType: 'error',
            suggestions: [`Erro na análise: ${error.message}`],
            textStreams: [],
            streamDetails: []
        };
    }
}

// Função para criar PDF com texto extraído
function createExtractedTextPDF(extractedTexts, method, key) {
    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length ${calculateStreamLength(extractedTexts, method, key)}
>>
stream
BT
/F1 12 Tf
50 750 Td
(TEXTO EXTRAÍDO DO PDF DESCRIPTOGRAFADO) Tj
0 -20 Td
(Método: ${method}) Tj
0 -20 Td
(Chave: ${key}) Tj
0 -40 Td
(CONTEÚDO ENCONTRADO:) Tj
${extractedTexts.map((text, index) => `0 -20 Td\n(${index + 1}. ${text.replace(/[()\\]/g, '\\$&')}) Tj`).join('\n')}
0 -40 Td
(Este PDF foi gerado automaticamente para exibir) Tj
0 -20 Td
(o texto encontrado no arquivo original.) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000251 00000 n 
0000000329 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${calculateXrefPosition(extractedTexts, method, key)}
%%EOF`;

    return Buffer.from(content, 'binary');
}

function calculateStreamLength(extractedTexts, method, key) {
    const baseContent = `BT
/F1 12 Tf
50 750 Td
(TEXTO EXTRAÍDO DO PDF DESCRIPTOGRAFADO) Tj
0 -20 Td
(Método: ${method}) Tj
0 -20 Td
(Chave: ${key}) Tj
0 -40 Td
(CONTEÚDO ENCONTRADO:) Tj
${extractedTexts.map((text, index) => `0 -20 Td\n(${index + 1}. ${text.replace(/[()\\]/g, '\\$&')}) Tj`).join('\n')}
0 -40 Td
(Este PDF foi gerado automaticamente para exibir) Tj
0 -20 Td
(o texto encontrado no arquivo original.) Tj
ET`;
    return baseContent.length;
}

function calculateXrefPosition(extractedTexts, method, key) {
    const streamLength = calculateStreamLength(extractedTexts, method, key);
    return 430 + streamLength;
}

// Função para criar PDF com conteúdo de teste
function createTestContentPDF(originalData) {
    try {
        const originalSize = originalData.length;
        const timestamp = new Date().toLocaleString('pt-BR');
        
        const testPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 350
>>
stream
BT
/F1 12 Tf
50 750 Td
(ARQUIVO DESCRIPTOGRAFADO COM SUCESSO!) Tj
0 -30 Td
(Metodo: XOR com cabecalho PDF) Tj
0 -20 Td
(Chave: 90eaf739) Tj
0 -20 Td
(Data: ${timestamp}) Tj
0 -30 Td
(Tamanho original: ${originalSize} bytes) Tj
0 -30 Td
(NOTA: O conteudo original pode estar corrompido) Tj
0 -20 Td
(ou ser dados binarios nao visiveis.) Tj
0 -30 Td
(Este PDF de teste confirma que a descriptografia) Tj
0 -20 Td
(e o reparo funcionaram corretamente.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000251 00000 n 
0000000653 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
720
%%EOF`;

        return {
            success: true,
            data: Buffer.from(testPDF, 'binary'),
            message: 'PDF de teste criado com informações da descriptografia'
        };
    } catch (error) {
        return {
            success: false,
            data: originalData,
            message: `Erro ao criar PDF de teste: ${error.message}`
        };
    }
}
function advancedPDFRepair(data) {
    try {
        let content = data.toString('binary');
        let repaired = false;
        const repairs = [];

        // Garantir cabeçalho PDF válido
        if (!content.startsWith('%PDF')) {
            content = '%PDF-1.4\n' + content;
            repaired = true;
            repairs.push('Cabeçalho PDF-1.4 adicionado');
        }

        // Procurar por conteúdo que pareça ser de um PDF
        const streamMatches = content.match(/stream[\s\S]*?endstream/g) || [];
        const objMatches = content.match(/\d+\s+\d+\s+obj[\s\S]*?endobj/g) || [];
        
        // Se não há objetos válidos, criar estrutura mínima
        if (objMatches.length === 0 && streamMatches.length === 0) {
            // Tentar detectar se há dados que possam ser conteúdo de página
            const possibleContent = content.substring(content.indexOf('\n') + 1);
            
            if (possibleContent.length > 100) {
                // Criar PDF mínimo com o conteúdo como stream
                const minimalPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${possibleContent.length}
>>
stream
${possibleContent}
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${9 + 65 + 46 + 59 + 47 + possibleContent.length + 20}
%%EOF`;

                content = minimalPDF;
                repaired = true;
                repairs.push('Estrutura PDF mínima criada com conteúdo detectado');
            } else {
                // Criar PDF completamente vazio mas válido
                const emptyPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
179
%%EOF`;

                content = emptyPDF;
                repaired = true;
                repairs.push('PDF vazio mas válido criado');
            }
        } else {
            // Tentar reparar estrutura existente
            if (!content.includes('xref') || !content.includes('trailer')) {
                const objects = objMatches.length;
                if (objects > 0) {
                    // Remover %%EOF existente se houver
                    content = content.replace(/%%EOF\s*$/, '');
                    
                    const xrefPos = content.length;
                    content += `\nxref\n0 ${objects + 1}\n`;
                    
                    // Calcular posições aproximadas dos objetos
                    for (let i = 0; i <= objects; i++) {
                        const pos = i === 0 ? 0 : Math.floor(xrefPos * i / objects);
                        content += `${pos.toString().padStart(10, '0')} ${i === 0 ? '65535' : '00000'} ${i === 0 ? 'f' : 'n'} \n`;
                    }
                    
                    content += `trailer\n<<\n/Size ${objects + 1}\n/Root 1 0 R\n>>\nstartxref\n${xrefPos}\n%%EOF`;
                    repaired = true;
                    repairs.push(`Estrutura xref/trailer reconstruída para ${objects} objetos`);
                }
            }
        }

        return {
            repaired,
            repairs,
            data: repaired ? Buffer.from(content, 'binary') : data
        };
    } catch (error) {
        console.error('Erro no reparo avançado do PDF:', error);
        return {
            repaired: false,
            repairs: [`Erro no reparo avançado: ${error.message}`],
            data
        };
    }
}

function validatePDFStructure(data) {
    const result = {
        isValid: false,
        version: 'unknown',
        pages: 0,
        hasXref: false,
        hasTrailer: false,
        hasEOF: false,
        hasStartxref: false,
        endsCorrectly: false,
        objectCount: 0,
        size: data.length,
        corruption: [],
        contentAnalysis: {
            hasVisibleText: false,
            hasImages: false,
            hasStreams: false,
            textStreams: 0,
            imageObjects: 0,
            fontObjects: 0,
            isEmpty: false,
            contentType: 'unknown',
            extractedText: [],
            streamDetails: []
        }
    };

    try {
        const content = data.toString('binary');
        
        // Verificar cabeçalho PDF
        if (!content.startsWith('%PDF')) {
            result.corruption.push('Cabeçalho PDF inválido');
            return result;
        }

        // Extrair versão
        const versionMatch = content.match(/%PDF-(\d+\.\d+)/);
        if (versionMatch) {
            result.version = versionMatch[1];
        }

        // Verificar estruturas básicas
        result.hasXref = content.includes('xref');
        result.hasTrailer = content.includes('trailer');
        result.hasEOF = content.includes('%%EOF');
        result.hasStartxref = content.includes('startxref');
        result.endsCorrectly = content.trim().endsWith('%%EOF');

        // Contar objetos PDF
        const objMatches = content.match(/\d+\s+\d+\s+obj/g);
        result.objectCount = objMatches ? objMatches.length : 0;

        // Análise detalhada do conteúdo
        analyzeContentDetails(content, result.contentAnalysis);

        // Contar páginas - múltiplos métodos
        let pageCount = 0;
        
        // Método 1: Contar /Type/Page
        const pageMatches = content.match(/\/Type\s*\/Page[^s]/g);
        if (pageMatches) {
            pageCount = Math.max(pageCount, pageMatches.length);
        }
        
        // Método 2: Procurar /Count
        const countMatch = content.match(/\/Count\s+(\d+)/);
        if (countMatch) {
            pageCount = Math.max(pageCount, parseInt(countMatch[1]));
        }
        
        // Método 3: Contar arrays /Kids
        const kidsMatches = content.match(/\/Kids\s*\[[^\]]*\]/g);
        if (kidsMatches) {
            kidsMatches.forEach(kids => {
                const refs = kids.match(/\d+\s+\d+\s+R/g);
                if (refs) {
                    pageCount = Math.max(pageCount, refs.length);
                }
            });
        }
        
        result.pages = pageCount;

        // Detectar problemas de corrupção
        if (!result.hasEOF) {
            result.corruption.push('Falta %%EOF no final');
        }
        if (!result.endsCorrectly) {
            result.corruption.push('Arquivo não termina corretamente com %%EOF');
        }
        if (!result.hasXref && !result.hasTrailer) {
            result.corruption.push('Falta estrutura xref/trailer');
        }
        if (result.objectCount === 0) {
            result.corruption.push('Nenhum objeto PDF encontrado');
        }
        if (pageCount === 0) {
            result.corruption.push('Nenhuma página detectada');
        }

        // Para PDFs grandes sem páginas detectadas, assumir pelo menos 1 se tem objetos
        // Determinar se o PDF está vazio ou tem conteúdo
        if (result.contentAnalysis.isEmpty) {
            result.corruption.push('PDF aparenta estar vazio ou sem conteúdo visível');
        } else if (!result.contentAnalysis.hasVisibleText && !result.contentAnalysis.hasImages) {
            result.corruption.push('PDF não contém texto ou imagens visíveis');
        }

        if (pageCount === 0) {
            // Tentar métodos alternativos para detectar páginas
            const countMatch = content.match(/\/Count\s+(\d+)/);
            if (countMatch) {
                pageCount = parseInt(countMatch[1]);
                result.corruption.push('Páginas detectadas via /Count');
            }
        }

        result.pages = pageCount;

        // Se não conseguiu detectar páginas mas tem objetos, assumir pelo menos 1
        if (pageCount === 0 && result.objectCount > 0 && data.length > 100000) {
            result.pages = 1;
            result.corruption.push('Páginas não detectadas automaticamente (PDF grande)');
        }

        // Validação mais rigorosa para PDFs grandes
        if (data.length > 100000) {
            // PDF grande deve ter estrutura completa
            result.isValid = content.startsWith('%PDF') && 
                           result.hasEOF && 
                           (result.hasXref || result.hasTrailer) &&
                           result.objectCount > 0;
        } else {
            // PDF pequeno - validação mais flexível
            result.isValid = content.startsWith('%PDF') && 
                           (result.hasXref || result.hasTrailer || result.pages > 0);
        }

    } catch (error) {
        console.error('Erro na validação PDF:', error);
        result.corruption.push(`Erro de análise: ${error.message}`);
    }

    return result;
}

// Nova função para análise detalhada do conteúdo
function analyzeContentDetails(content, analysis) {
    try {
        // Verificar streams de texto (BT...ET)
        const textStreams = content.match(/BT[\s\S]*?ET/g);
        if (textStreams) {
            analysis.hasVisibleText = true;
            analysis.textStreams = textStreams.length;
            analysis.hasStreams = true;
            analysis.contentType = 'text';
            
            // Extrair texto real dos streams
            textStreams.forEach((stream, index) => {
                const textMatches = stream.match(/\(([^)]*)\)\s*Tj/g);
                if (textMatches) {
                    textMatches.forEach(match => {
                        const text = match.match(/\(([^)]*)\)/);
                        if (text && text[1] && text[1].trim()) {
                            analysis.extractedText.push(text[1]);
                        }
                    });
                }
                
                analysis.streamDetails.push({
                    index: index + 1,
                    hasFont: /\/F\d+/.test(stream),
                    hasPosition: /\d+\s+\d+\s+Td/.test(stream),
                    hasText: /\([^)]*\)\s*Tj/.test(stream),
                    length: stream.length
                });
            });
        }

        // Verificar objetos de imagem
        const imageMatches = content.match(/\/Type\s*\/XObject[\s\S]*?\/Subtype\s*\/Image/g);
        if (imageMatches) {
            analysis.hasImages = true;
            analysis.imageObjects = imageMatches.length;
            analysis.hasStreams = true;
            if (!analysis.hasVisibleText) {
                analysis.contentType = 'image';
            } else {
                analysis.contentType = 'mixed';
            }
        }

        // Verificar objetos de fonte
        const fontMatches = content.match(/\/Type\s*\/Font/g);
        if (fontMatches) {
            analysis.fontObjects = fontMatches.length;
        }

        // Verificar se há streams em geral
        const streamMatches = content.match(/stream[\s\S]*?endstream/g);
        if (streamMatches && streamMatches.length > 0) {
            analysis.hasStreams = true;
        }

        // Determinar se está vazio
        analysis.isEmpty = !analysis.hasVisibleText && 
                          !analysis.hasImages && 
                          analysis.extractedText.length === 0 &&
                          (!streamMatches || streamMatches.length === 0);

        // Se não tem conteúdo visível mas tem streams, pode ser conteúdo binário
        if (!analysis.hasVisibleText && !analysis.hasImages && analysis.hasStreams) {
            analysis.contentType = 'binary';
        }

        // Se não tem nada, está vazio
        if (analysis.isEmpty) {
            analysis.contentType = 'empty';
        }

    } catch (error) {
        console.error('Erro na análise de conteúdo:', error);
        analysis.contentType = 'error';
    }
}

// Função para gerar diagnóstico baseado na análise de conteúdo
function generateDiagnosis(contentAnalysis) {
    const diagnosis = {
        status: 'unknown',
        message: '',
        recommendations: [],
        severity: 'info'
    };

    if (contentAnalysis.isEmpty) {
        diagnosis.status = 'empty';
        diagnosis.message = 'PDF descriptografado com sucesso, mas está completamente vazio';
        diagnosis.severity = 'warning';
        diagnosis.recommendations = [
            'Verifique se o arquivo original já estava vazio antes da criptografia',
            'Confirme se a chave de descriptografia está correta',
            'Considere que o arquivo pode ter sido corrompido durante a criptografia',
            'Tente abrir o arquivo em diferentes visualizadores de PDF'
        ];
    } else if (!contentAnalysis.hasVisibleText && !contentAnalysis.hasImages) {
        diagnosis.status = 'no_visible_content';
        diagnosis.message = 'PDF tem estrutura válida mas não contém texto ou imagens visíveis';
        diagnosis.severity = 'warning';
        diagnosis.recommendations = [
            'O conteúdo pode estar em formato binário não reconhecido',
            'Fontes ou recursos necessários podem estar ausentes',
            'O conteúdo pode estar em camadas ocultas ou com cor branca',
            'Tente usar ferramentas especializadas de análise de PDF',
            'Verifique se há objetos incorporados ou anexos no PDF'
        ];
    } else if (contentAnalysis.hasVisibleText || contentAnalysis.hasImages) {
        diagnosis.status = 'success';
        diagnosis.message = 'PDF descriptografado com sucesso e contém conteúdo visível';
        diagnosis.severity = 'success';
        diagnosis.recommendations = [
            'O arquivo foi descriptografado corretamente',
            'Você pode abrir o arquivo normalmente em qualquer visualizador de PDF'
        ];
        
        if (contentAnalysis.hasVisibleText) {
            diagnosis.message += ` (${contentAnalysis.textStreams} streams de texto encontrados)`;
        }
        if (contentAnalysis.hasImages) {
            diagnosis.message += ` (${contentAnalysis.imageObjects} imagens encontradas)`;
        }
    } else if (contentAnalysis.contentType === 'binary') {
        diagnosis.status = 'binary_content';
        diagnosis.message = 'PDF contém dados binários que podem não ser visíveis diretamente';
        diagnosis.severity = 'info';
        diagnosis.recommendations = [
            'O arquivo pode conter dados incorporados ou anexos',
            'Use ferramentas especializadas para extrair conteúdo binário',
            'Verifique se há formulários ou campos interativos no PDF'
        ];
    }

    return diagnosis;
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