#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { program } = require('commander');
const chalk = require('chalk');
const ProgressBar = require('progress');
const FileHandlers = require('./file-handlers');

class WantToCryDecryptor {
    constructor(toxId, victimId) {
        this.toxId = toxId;
        this.victimId = victimId;
        this.fileHandlers = new FileHandlers();
        
        // Estatísticas
        this.stats = {
            processed: 0,
            successful: 0,
            failed: 0,
            corrected: 0
        };
        
        // Configurações de criptografia
        this.algorithm = 'aes-256-cbc';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16;  // 128 bits
        
        // Extensões suportadas
        this.supportedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.txt', '.jpg', '.png'];
        
        console.log(chalk.blue('🔓 WantToCry Decryptor v1.0.0'));
        console.log(chalk.gray('Descriptografador para arquivos infectados pelo ransomware WantToCry\n'));
    }

    /**
     * Deriva chaves de descriptografia baseadas no Tox ID e ID da vítima
     */
    deriveDecryptionKeys() {
        const keys = [];
        
        // Gerar variações dos IDs para força bruta
        const idVariations = this.generateIdVariations();
        
        for (const variation of idVariations) {
            const { toxId, victimId, description } = variation;
            
            // Método 1: Hash direto do Tox ID + Victim ID
            const combined1 = toxId + victimId;
            const key1 = crypto.createHash('sha256').update(combined1).digest();
            keys.push({ method: `ToxID+VictimID SHA256 (${description})`, key: key1 });
            
            // Método 2: Hash do Victim ID + Tox ID (ordem inversa)
            const combined2 = victimId + toxId;
            const key2 = crypto.createHash('sha256').update(combined2).digest();
            keys.push({ method: `VictimID+ToxID SHA256 (${description})`, key: key2 });
            
            // Método 3: PBKDF2 usando Tox ID como senha e Victim ID como salt
            try {
                const key3 = crypto.pbkdf2Sync(toxId, victimId, 10000, 32, 'sha256');
                keys.push({ method: `PBKDF2 (ToxID, VictimID) (${description})`, key: key3 });
            } catch (e) {
                // Ignorar se falhar
            }
            
            // Método 4: PBKDF2 usando Victim ID como senha e Tox ID como salt
            try {
                const key4 = crypto.pbkdf2Sync(victimId, toxId, 10000, 32, 'sha256');
                keys.push({ method: `PBKDF2 (VictimID, ToxID) (${description})`, key: key4 });
            } catch (e) {
                // Ignorar se falhar
            }
            
            // Método 5: Hash MD5 + SHA256 (método comum em ransomware)
            const md5Hash = crypto.createHash('md5').update(combined1).digest('hex');
            const key5 = crypto.createHash('sha256').update(md5Hash).digest();
            keys.push({ method: `MD5+SHA256 (${description})`, key: key5 });
            
            // Método 6: Apenas os primeiros 32 bytes do Tox ID convertidos (se possível)
            if (toxId.length >= 64) {
                try {
                    const toxBuffer = Buffer.from(toxId.substring(0, 64), 'hex');
                    keys.push({ method: `ToxID Direct 32 bytes (${description})`, key: toxBuffer });
                } catch (e) {
                    // Ignorar se não for hex válido
                }
            }
            
            // Método 7: XOR entre hashes
            const hash1 = crypto.createHash('sha256').update(toxId).digest();
            const hash2 = crypto.createHash('sha256').update(victimId).digest();
            const key7 = Buffer.alloc(32);
            for (let i = 0; i < 32; i++) {
                key7[i] = hash1[i] ^ hash2[i];
            }
            keys.push({ method: `XOR Hashes (${description})`, key: key7 });
            
            // Método 8: SHA1 + SHA256 (variação comum)
            const sha1Hash = crypto.createHash('sha1').update(combined1).digest('hex');
            const key8 = crypto.createHash('sha256').update(sha1Hash).digest();
            keys.push({ method: `SHA1+SHA256 (${description})`, key: key8 });
            
            // Método 9: PBKDF2 com iterações baixas (1000)
            try {
                const key9 = crypto.pbkdf2Sync(toxId, victimId, 1000, 32, 'sha256');
                keys.push({ method: `PBKDF2 Low Iterations (${description})`, key: key9 });
            } catch (e) {
                // Ignorar se falhar
            }
            
            // Método 10: Hash duplo SHA256
            const firstHash = crypto.createHash('sha256').update(combined1).digest();
            const key10 = crypto.createHash('sha256').update(firstHash).digest();
            keys.push({ method: `Double SHA256 (${description})`, key: key10 });
        }
        
        return keys;
    }

    /**
     * Gera variações dos IDs para tentativas de força bruta
     */
    generateIdVariations() {
        const variations = [];
        
        // Variação 1: IDs originais
        variations.push({
            toxId: this.toxId,
            victimId: this.victimId,
            description: 'Original'
        });
        
        // Variação 2: IDs em minúsculas
        variations.push({
            toxId: this.toxId.toLowerCase(),
            victimId: this.victimId.toLowerCase(),
            description: 'Lowercase'
        });
        
        // Variação 3: IDs em maiúsculas
        variations.push({
            toxId: this.toxId.toUpperCase(),
            victimId: this.victimId.toUpperCase(),
            description: 'Uppercase'
        });
        
        // Variação 4: Apenas primeiros 32 caracteres de cada ID
        variations.push({
            toxId: this.toxId.substring(0, 32),
            victimId: this.victimId.substring(0, 16),
            description: 'Truncated'
        });
        
        // Variação 5: Apenas últimos 32 caracteres do Tox ID
        if (this.toxId.length > 32) {
            variations.push({
                toxId: this.toxId.substring(this.toxId.length - 32),
                victimId: this.victimId,
                description: 'ToxID Suffix'
            });
        }
        
        // Variação 6: Sem hífens ou separadores (se houver)
        variations.push({
            toxId: this.toxId.replace(/[-_]/g, ''),
            victimId: this.victimId.replace(/[-_]/g, ''),
            description: 'No Separators'
        });
        
        // Variação 7: Com hífens a cada 8 caracteres
        const addHyphens = (str) => str.replace(/(.{8})/g, '$1-').replace(/-$/, '');
        variations.push({
            toxId: addHyphens(this.toxId),
            victimId: addHyphens(this.victimId),
            description: 'With Hyphens'
        });
        
        // Variação 8: Apenas metade dos IDs
        variations.push({
            toxId: this.toxId.substring(0, Math.floor(this.toxId.length / 2)),
            victimId: this.victimId.substring(0, Math.floor(this.victimId.length / 2)),
            description: 'Half Length'
        });
        
        // Variação 9: IDs invertidos (string reversa)
        variations.push({
            toxId: this.toxId.split('').reverse().join(''),
            victimId: this.victimId.split('').reverse().join(''),
            description: 'Reversed'
        });
        
        // Variação 10: Apenas caracteres pares
        const getEvenChars = (str) => str.split('').filter((_, i) => i % 2 === 0).join('');
        variations.push({
            toxId: getEvenChars(this.toxId),
            victimId: getEvenChars(this.victimId),
            description: 'Even Chars Only'
        });
        
        // Variação 11: Apenas caracteres ímpares
        const getOddChars = (str) => str.split('').filter((_, i) => i % 2 === 1).join('');
        variations.push({
            toxId: getOddChars(this.toxId),
            victimId: getOddChars(this.victimId),
            description: 'Odd Chars Only'
        });
        
        // Variação 12: Primeiros 16 + últimos 16 caracteres do Tox ID
        if (this.toxId.length >= 32) {
            variations.push({
                toxId: this.toxId.substring(0, 16) + this.toxId.substring(this.toxId.length - 16),
                victimId: this.victimId,
                description: 'ToxID First+Last 16'
            });
        }
        
        return variations;
    }

    /**
     * Tenta descriptografar dados usando uma chave específica
     */
    tryDecrypt(encryptedData, key) {
        try {
            // Extrair IV (primeiros 16 bytes)
            const iv = encryptedData.slice(0, this.ivLength);
            const ciphertext = encryptedData.slice(this.ivLength);
            
            // Criar decipher
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            decipher.setAutoPadding(true);
            
            // Descriptografar
            let decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted;
        } catch (error) {
            return null;
        }
    }

    /**
     * Tenta descriptografar com um algoritmo específico
     */
    tryDecryptWithAlgorithm(encryptedData, key, algorithm) {
        try {
            let adjustedKey = key;
            let iv = null;
            let ciphertext = encryptedData;

            // Ajustar tamanho da chave se necessário
            if (key.length !== algorithm.keySize) {
                if (key.length > algorithm.keySize) {
                    adjustedKey = key.slice(0, algorithm.keySize);
                } else {
                    // Expandir chave se for menor
                    adjustedKey = Buffer.alloc(algorithm.keySize);
                    key.copy(adjustedKey);
                    // Preencher o resto com repetição da chave original
                    for (let i = key.length; i < algorithm.keySize; i++) {
                        adjustedKey[i] = key[i % key.length];
                    }
                }
            }

            // Extrair IV se necessário
            if (algorithm.needsIV) {
                if (encryptedData.length < 16) {
                    return null; // Dados muito pequenos para ter IV
                }
                iv = encryptedData.slice(0, 16);
                ciphertext = encryptedData.slice(16);
            }

            // Criar decipher
            const decipher = algorithm.needsIV 
                ? crypto.createDecipheriv(algorithm.name, adjustedKey, iv)
                : crypto.createDecipheriv(algorithm.name, adjustedKey, null);
            
            decipher.setAutoPadding(true);

            // Descriptografar
            let decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted;
        } catch (error) {
            // Tentar sem padding automático
            try {
                let adjustedKey = key;
                let iv = null;
                let ciphertext = encryptedData;

                // Ajustar tamanho da chave
                if (key.length !== algorithm.keySize) {
                    if (key.length > algorithm.keySize) {
                        adjustedKey = key.slice(0, algorithm.keySize);
                    } else {
                        adjustedKey = Buffer.alloc(algorithm.keySize);
                        key.copy(adjustedKey);
                        for (let i = key.length; i < algorithm.keySize; i++) {
                            adjustedKey[i] = key[i % key.length];
                        }
                    }
                }

                // Extrair IV se necessário
                if (algorithm.needsIV) {
                    if (encryptedData.length < 16) {
                        return null;
                    }
                    iv = encryptedData.slice(0, 16);
                    ciphertext = encryptedData.slice(16);
                }

                const decipher = algorithm.needsIV 
                    ? crypto.createDecipheriv(algorithm.name, adjustedKey, iv)
                    : crypto.createDecipheriv(algorithm.name, adjustedKey, null);
                
                decipher.setAutoPadding(false);

                let decrypted = decipher.update(ciphertext);
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                // Remover padding PKCS7 manualmente se necessário
                if (decrypted.length > 0) {
                    const lastByte = decrypted[decrypted.length - 1];
                    if (lastByte > 0 && lastByte <= 16) {
                        let validPadding = true;
                        for (let i = 1; i <= lastByte; i++) {
                            if (decrypted[decrypted.length - i] !== lastByte) {
                                validPadding = false;
                                break;
                            }
                        }
                        if (validPadding) {
                            decrypted = decrypted.slice(0, decrypted.length - lastByte);
                        }
                    }
                }

                return decrypted;
            } catch (error2) {
                return null;
            }
        }
    }

    /**
     * Tenta descriptografar com ChaCha20 (se disponível)
     */
    tryDecryptChaCha20(encryptedData, key) {
        try {
            // ChaCha20 precisa de chave de 32 bytes e nonce de 12 bytes
            let adjustedKey = key;
            if (key.length !== 32) {
                if (key.length > 32) {
                    adjustedKey = key.slice(0, 32);
                } else {
                    adjustedKey = Buffer.alloc(32);
                    key.copy(adjustedKey);
                    for (let i = key.length; i < 32; i++) {
                        adjustedKey[i] = key[i % key.length];
                    }
                }
            }

            if (encryptedData.length < 12) {
                return null; // Muito pequeno para ter nonce
            }

            const nonce = encryptedData.slice(0, 12);
            const ciphertext = encryptedData.slice(12);

            // Tentar ChaCha20 se disponível
            const decipher = crypto.createDecipheriv('chacha20', adjustedKey, nonce);
            let decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted;
        } catch (error) {
            return null;
        }
    }

    /**
     * Tenta descriptografar dados usando uma chave específica
     */
    tryDecrypt(encryptedData, key) {
        // Primeiro, analisar a estrutura do arquivo
        const analysis = this.analyzeFileStructure(encryptedData);
        
        // Detectar padrões específicos do WantToCry
        const patterns = this.detectWantToCryPatterns(encryptedData);
        
        // Lista de algoritmos para tentar baseada na análise
        const algorithms = [
            { name: 'aes-256-cbc', needsIV: true, keySize: 32 },
            { name: 'aes-256-ecb', needsIV: false, keySize: 32 },
            { name: 'aes-128-cbc', needsIV: true, keySize: 16 },
            { name: 'aes-128-ecb', needsIV: false, keySize: 16 },
            { name: 'aes-192-cbc', needsIV: true, keySize: 24 },
            { name: 'aes-192-ecb', needsIV: false, keySize: 24 }
        ];

        // Tentar cada algoritmo
        for (const algo of algorithms) {
            const result = this.tryDecryptWithAlgorithm(encryptedData, key, algo);
            if (result && this.isValidDecryption(result)) {
                return result;
            }
        }

        // Tentar ChaCha20 se disponível
        const chachaResult = this.tryDecryptChaCha20(encryptedData, key);
        if (chachaResult && this.isValidDecryption(chachaResult)) {
            return chachaResult;
        }

        // Tentar diferentes posições de IV
        const ivResult = this.tryDecryptWithDifferentIVPositions(encryptedData, key);
        if (ivResult && this.isValidDecryption(ivResult)) {
            return ivResult;
        }

        return null;
    }

    /**
     * Análise avançada de estrutura do arquivo para detectar diferentes algoritmos
     */
    analyzeFileStructure(data) {
        const analysis = {
            entropy: this.calculateEntropy(data.slice(0, Math.min(1024, data.length))),
            hasHeader: false,
            possibleAlgorithm: 'unknown',
            ivDetected: false,
            paddingDetected: false,
            blockStructure: {},
            encryptionIndicators: {}
        };
        
        // Verificar se os primeiros 16 bytes podem ser um IV
        if (data.length > 16) {
            const possibleIV = data.slice(0, 16);
            const ivEntropy = this.calculateEntropy(possibleIV);
            
            // IVs geralmente têm alta entropia (são aleatórios)
            if (ivEntropy > 3.5) {
                analysis.ivDetected = true;
            }
        }
        
        // Verificar padding PKCS7 nos últimos bytes
        if (data.length > 16) {
            const lastByte = data[data.length - 1];
            if (lastByte > 0 && lastByte <= 16) {
                let validPadding = true;
                for (let i = 1; i <= lastByte; i++) {
                    if (data[data.length - i] !== lastByte) {
                        validPadding = false;
                        break;
                    }
                }
                if (validPadding) {
                    analysis.paddingDetected = true;
                }
            }
        }

        // Analisar estrutura de blocos
        analysis.blockStructure = {
            mod16: data.length % 16 === 0,
            mod8: data.length % 8 === 0,
            hasIV: data.length > 16,
            possiblePadding: this.detectPadding(data)
        };

        // Indicadores de criptografia
        analysis.encryptionIndicators = {
            highEntropy: analysis.entropy > 7.0,
            uniformDistribution: this.checkUniformDistribution(data),
            noRepeatingPatterns: !this.hasExcessiveRepeatingPatterns(data)
        };
        
        // Detectar possível algoritmo baseado na estrutura
        if (analysis.ivDetected && analysis.paddingDetected) {
            analysis.possibleAlgorithm = 'AES-CBC';
        } else if (analysis.entropy > 7.5) {
            analysis.possibleAlgorithm = 'encrypted';
        } else if (analysis.entropy < 3.0) {
            analysis.possibleAlgorithm = 'plaintext_or_compressed';
        }
        
        return analysis;
    }

    /**
     * Processa um arquivo criptografado
     */
    async decryptFile(filePath) {
        console.log(chalk.yellow(`\n🔍 Processando: ${path.basename(filePath)}`));
        
        if (!fs.existsSync(filePath)) {
            console.log(chalk.red('❌ Arquivo não encontrado!'));
            return false;
        }
        
        // Ler arquivo criptografado
        const encryptedData = fs.readFileSync(filePath);
        console.log(chalk.gray(`📊 Tamanho do arquivo: ${encryptedData.length} bytes`));
        
        // Calcular entropia inicial
        const initialEntropy = this.calculateEntropy(encryptedData.slice(0, Math.min(1024, encryptedData.length)));
        console.log(chalk.gray(`📈 Entropia inicial: ${initialEntropy.toFixed(2)}`));
        
        // Determinar nome do arquivo original
        let originalName = path.basename(filePath);
        if (originalName.endsWith('.want_to_cry')) {
            originalName = originalName.slice(0, -12); // Remove .want_to_cry
        }
        
        // Gerar chaves de descriptografia
        const keys = this.deriveDecryptionKeys();
        console.log(chalk.blue(`🔑 Testando ${keys.length} métodos de derivação de chave...\n`));
        
        // Criar barra de progresso
        const progressBar = new ProgressBar(
            chalk.cyan('[:bar] :percent :etas ') + chalk.gray(':method'),
            {
                complete: '█',
                incomplete: '░',
                width: 30,
                total: keys.length
            }
        );
        
        // Tentar cada chave
        for (let i = 0; i < keys.length; i++) {
            const keyInfo = keys[i];
            
            progressBar.tick({
                method: keyInfo.method.padEnd(25)
            });
            
            const decryptedData = this.tryDecrypt(encryptedData, keyInfo.key);
            
            if (decryptedData) {
                const validation = this.validateDecryptedData(originalName, decryptedData);
                if (validation.valid) {
                    console.log(chalk.green(`\n✅ Descriptografia bem-sucedida!`));
                    console.log(chalk.green(`🔑 Método usado: ${keyInfo.method}`));
                    console.log(chalk.green(`📄 Arquivo original: ${originalName}`));
                    console.log(chalk.green(`✅ ${validation.message}`));
                    
                    if (validation.corrected) {
                        console.log(chalk.yellow(`🔧 Arquivo foi corrigido automaticamente`));
                    }
                    
                    // Calcular entropia final
                    const finalEntropy = this.calculateEntropy(validation.data.slice(0, Math.min(1024, validation.data.length)));
                    console.log(chalk.green(`📉 Entropia final: ${finalEntropy.toFixed(2)}`));
                    
                    // Determinar nome de saída
                    const outputName = validation.suggestedName || `recovered_${originalName}`;
                    const outputPath = path.join(path.dirname(filePath), outputName);
                    
                    // Salvar arquivo descriptografado
                    fs.writeFileSync(outputPath, validation.data);
                    
                    console.log(chalk.green(`💾 Arquivo salvo: ${outputPath}`));
                    console.log(chalk.green(`📊 Tamanho recuperado: ${validation.data.length} bytes\n`));
                    
                    return true;
                }
            }
        }
        
        console.log(chalk.red('\n❌ Falha na descriptografia com todos os métodos testados'));
        console.log(chalk.yellow('💡 Possíveis causas:'));
        console.log(chalk.yellow('   • Arquivo não foi criptografado pelo WantToCry'));
        console.log(chalk.yellow('   • Arquivo está corrompido'));
        console.log(chalk.yellow('   • Método de criptografia diferente do esperado\n'));
        
        return false;
    }

    /**
     * Exibe estatísticas finais
     */
    displayStats() {
        console.log(chalk.cyan('\n📊 ESTATÍSTICAS FINAIS:'));
        console.log(chalk.white(`  📁 Arquivos processados: ${this.stats.processed}`));
        console.log(chalk.green(`  ✅ Sucessos: ${this.stats.successful}`));
        console.log(chalk.red(`  ❌ Falhas: ${this.stats.failed}`));
        console.log(chalk.yellow(`  🔧 Arquivos corrigidos: ${this.stats.corrected}`));
        
        if (this.stats.processed > 0) {
            const successRate = ((this.stats.successful / this.stats.processed) * 100).toFixed(1);
            console.log(chalk.cyan(`  📈 Taxa de sucesso: ${successRate}%`));
        }
        
        console.log('');
    }

    /**
     * Processa múltiplos arquivos
     */
    async decryptMultipleFiles(filePaths) {
        console.log(chalk.blue(`\n🚀 Iniciando descriptografia de ${filePaths.length} arquivo(s)...\n`));
        
        let successCount = 0;
        let failCount = 0;
        
        for (const filePath of filePaths) {
            const success = await this.decryptFile(filePath);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        console.log(chalk.blue('\n📊 RESUMO DA OPERAÇÃO:'));
        console.log(chalk.green(`✅ Sucessos: ${successCount}`));
        console.log(chalk.red(`❌ Falhas: ${failCount}`));
        console.log(chalk.blue(`📁 Total processado: ${filePaths.length}\n`));
        
        return { success: successCount, failed: failCount };
    }

    /**
     * Processa um diretório recursivamente
     */
    async decryptDirectory(dirPath, recursive = false) {
        if (!fs.existsSync(dirPath)) {
            console.log(chalk.red('❌ Diretório não encontrado!'));
            return;
        }
        
        const files = [];
        
        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && recursive) {
                    scanDirectory(fullPath);
                } else if (stat.isFile()) {
                    // Verificar se é um arquivo criptografado
                    if (item.endsWith('.want_to_cry') || 
                        this.supportedExtensions.some(ext => item.toLowerCase().endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
        };
        
        scanDirectory(dirPath);
        
        if (files.length === 0) {
            console.log(chalk.yellow('⚠️ Nenhum arquivo criptografado encontrado no diretório'));
            return;
        }
        
        console.log(chalk.blue(`📁 Encontrados ${files.length} arquivo(s) para descriptografia`));
        
        return await this.decryptMultipleFiles(files);
    }

    /**
     * Verifica se a descriptografia é válida (verificação rápida)
     */
    isValidDecryption(data) {
        if (!data || data.length === 0) return false;
        
        // Verificar entropia - dados descriptografados devem ter entropia menor
        const entropy = this.calculateEntropy(data.slice(0, Math.min(512, data.length)));
        if (entropy > 7.0) return false;
        
        // Verificar se não há muitos bytes nulos consecutivos
        let nullCount = 0;
        let maxNulls = 0;
        for (let i = 0; i < Math.min(data.length, 1000); i++) {
            if (data[i] === 0) {
                nullCount++;
                maxNulls = Math.max(maxNulls, nullCount);
            } else {
                nullCount = 0;
            }
        }
        
        // Se mais de 100 bytes nulos consecutivos, provavelmente inválido
        if (maxNulls > 100) return false;
        
        return true;
    }

    /**
     * Detecta padrões específicos do WantToCry
     */
    detectWantToCryPatterns(data) {
        const patterns = {
            hasWantToCrySignature: false,
            hasEncryptionHeader: false,
            possibleKeyDerivation: 'unknown',
            structureAnalysis: {}
        };

        // Verificar assinatura WantToCry nos primeiros bytes
        const header = data.slice(0, 64).toString('hex').toLowerCase();
        
        // Padrões comuns em arquivos WantToCry
        const wantToCryPatterns = [
            'want_to_cry',
            'wantocry',
            '77616e745f746f5f637279', // 'want_to_cry' em hex
            'deadbeef',
            'cafebabe'
        ];

        for (const pattern of wantToCryPatterns) {
            if (header.includes(pattern)) {
                patterns.hasWantToCrySignature = true;
                break;
            }
        }

        // Analisar estrutura de blocos (AES usa blocos de 16 bytes)
        if (data.length % 16 === 0) {
            patterns.structureAnalysis.blockAligned = true;
            patterns.structureAnalysis.possibleBlockCipher = 'AES';
        }

        // Verificar se há header de criptografia
        if (data.length > 32) {
            const possibleHeader = data.slice(0, 32);
            const headerEntropy = this.calculateEntropy(possibleHeader);
            
            if (headerEntropy > 6.0) {
                patterns.hasEncryptionHeader = true;
            }
        }

        // Detectar possível método de derivação de chave baseado na estrutura
        if (patterns.hasWantToCrySignature) {
            patterns.possibleKeyDerivation = 'tox_victim_combination';
        } else if (patterns.hasEncryptionHeader) {
            patterns.possibleKeyDerivation = 'pbkdf2_or_hash';
        }

        return patterns;
    }

    /**
     * Detecta padding nos dados
     */
    detectPadding(data) {
        if (data.length < 16) return { detected: false };

        const lastByte = data[data.length - 1];
        
        // Verificar PKCS7 padding
        if (lastByte > 0 && lastByte <= 16) {
            let validPKCS7 = true;
            for (let i = 1; i <= lastByte; i++) {
                if (data[data.length - i] !== lastByte) {
                    validPKCS7 = false;
                    break;
                }
            }
            
            if (validPKCS7) {
                return { detected: true, type: 'PKCS7', size: lastByte };
            }
        }

        // Verificar zero padding
        let zeroCount = 0;
        for (let i = data.length - 1; i >= 0 && data[i] === 0; i--) {
            zeroCount++;
        }
        
        if (zeroCount > 0 && zeroCount < 16) {
            return { detected: true, type: 'Zero', size: zeroCount };
        }

        return { detected: false };
    }

    /**
     * Verifica distribuição uniforme dos bytes
     */
    checkUniformDistribution(data) {
        const freq = new Array(256).fill(0);
        const sampleSize = Math.min(data.length, 2048);
        
        for (let i = 0; i < sampleSize; i++) {
            freq[data[i]]++;
        }
        
        // Calcular chi-quadrado para uniformidade
        const expected = sampleSize / 256;
        let chiSquare = 0;
        
        for (let i = 0; i < 256; i++) {
            const diff = freq[i] - expected;
            chiSquare += (diff * diff) / expected;
        }
        
        // Valor crítico para 255 graus de liberdade (aproximado)
        return chiSquare < 300; // Ajustado para ser menos restritivo
    }

    /**
     * Tenta descriptografar usando diferentes posições de IV
     */
    tryDecryptWithDifferentIVPositions(encryptedData, key) {
        const results = [];
        
        // IV no início (padrão)
        const result1 = this.tryDecryptWithAlgorithm(encryptedData, key, { name: 'aes-256-cbc', needsIV: true, keySize: 32 });
        if (result1) results.push(result1);

        // IV no final
        if (encryptedData.length > 16) {
            try {
                const iv = encryptedData.slice(-16);
                const ciphertext = encryptedData.slice(0, -16);
                
                const decipher = crypto.createDecipheriv('aes-256-cbc', key.slice(0, 32), iv);
                decipher.setAutoPadding(true);
                
                let decrypted = decipher.update(ciphertext);
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                results.push(decrypted);
            } catch (e) {
                // Ignorar erro
            }
        }

        // IV no meio
        if (encryptedData.length > 32) {
            try {
                const midPoint = Math.floor(encryptedData.length / 2);
                const iv = encryptedData.slice(midPoint - 8, midPoint + 8);
                const ciphertext = Buffer.concat([
                    encryptedData.slice(0, midPoint - 8),
                    encryptedData.slice(midPoint + 8)
                ]);
                
                const decipher = crypto.createDecipheriv('aes-256-cbc', key.slice(0, 32), iv);
                decipher.setAutoPadding(true);
                
                let decrypted = decipher.update(ciphertext);
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                results.push(decrypted);
            } catch (e) {
                // Ignorar erro
            }
        }

        return results.length > 0 ? results[0] : null;
    }

    /**
     * Valida se os dados descriptografados são válidos
     */
    validateDecryptedData(filename, data) {
        if (!data || data.length === 0) {
            return { valid: false, message: 'Dados vazios' };
        }
        
        // Usar o FileHandlers para validação específica por tipo
        const result = this.fileHandlers.processDecryptedFile(filename, data);
        
        if (result.success) {
            if (result.corrected) {
                this.stats.corrected++;
                console.log(chalk.yellow(`  ✓ Arquivo corrigido: ${result.message}`));
            }
            
            return {
                valid: true,
                data: result.data,
                message: result.message,
                fileType: result.fileType,
                corrected: result.corrected,
                suggestedName: this.fileHandlers.generateFilename(filename, result.fileType, result.subtype)
            };
        }
        
        // Fallback para validação básica se o handler específico falhar
        return this.basicValidation(data);
    }
    
    /**
     * Validação básica como fallback
     */
    basicValidation(data) {
        // Verificar entropia dos dados (dados criptografados têm alta entropia)
        const entropy = this.calculateEntropy(data.slice(0, Math.min(1024, data.length)));
        
        if (entropy > 7.5) {
            return {
                valid: false,
                message: `Alta entropia detectada (${entropy.toFixed(2)}) - possivelmente ainda criptografado`
            };
        }
        
        // Verificar padrões suspeitos
        const hasRepeatingPatterns = this.hasExcessiveRepeatingPatterns(data);
        if (hasRepeatingPatterns) {
            return {
                valid: false,
                message: 'Padrões repetitivos excessivos detectados'
            };
        }
        
        return {
            valid: true,
            data: data,
            message: `Dados válidos (entropia: ${entropy.toFixed(2)})`
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
     * Verifica se há padrões repetitivos excessivos nos dados
     */
    hasExcessiveRepeatingPatterns(data) {
        if (data.length < 100) return false;
        
        // Verificar sequências de bytes repetidos
        let maxRepeatingSequence = 0;
        let currentSequence = 1;
        
        for (let i = 1; i < Math.min(data.length, 1000); i++) {
            if (data[i] === data[i - 1]) {
                currentSequence++;
            } else {
                maxRepeatingSequence = Math.max(maxRepeatingSequence, currentSequence);
                currentSequence = 1;
            }
        }
        
        // Se mais de 50 bytes consecutivos são iguais, é suspeito
        if (maxRepeatingSequence > 50) {
            return true;
        }
        
        // Verificar padrões de 4 bytes repetidos
        const patterns = new Map();
        for (let i = 0; i <= data.length - 4; i += 4) {
            const pattern = data.slice(i, i + 4).toString('hex');
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }
        
        // Se um padrão de 4 bytes se repete mais de 25% das vezes, é suspeito
        const totalPatterns = Math.floor(data.length / 4);
        for (const count of patterns.values()) {
            if (count / totalPatterns > 0.25) {
                return true;
            }
        }
        
        return false;
    }
}

module.exports = WantToCryDecryptor;

// Configuração da CLI
program
    .name('wantocry-decryptor')
    .description('Descriptografador para arquivos infectados pelo WantToCry ransomware')
    .version('1.0.0');

program
    .command('decrypt')
    .description('Descriptografar arquivo(s) criptografado(s)')
    .option('-f, --file <path>', 'Arquivo único para descriptografar')
    .option('-d, --directory <path>', 'Diretório com arquivos para descriptografar')
    .option('-o, --output <path>', 'Diretório de saída (opcional)')
    .option('-t, --tox-id <id>', 'Tox ID do atacante', '1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6')
    .option('-v, --victim-id <id>', 'ID da vítima', '3C579D75CF2341758A9B984A0B943F18')
    .option('-r, --recursive', 'Buscar recursivamente em subdiretórios')
    .action(async (options) => {
        console.log(chalk.cyan('🔓 WantToCry Decryptor v1.0.0\n'));
        
        const decryptor = new WantToCryDecryptor(options.toxId, options.victimId);
        
        try {
            if (options.file) {
                // Descriptografar arquivo único
                const result = await decryptor.decryptFile(options.file, options.output);
                if (result.success) {
                    console.log(chalk.green('\n🎉 Descriptografia concluída com sucesso!'));
                } else {
                    console.log(chalk.red('\n💥 Falha na descriptografia!'));
                    process.exit(1);
                }
            } else if (options.directory) {
                // Descriptografar diretório
                const results = await decryptor.decryptDirectory(
                    options.directory, 
                    options.output, 
                    options.recursive
                );
                
                console.log(chalk.green('\n🎉 Processamento concluído!'));
                decryptor.displayStats();
                
                if (decryptor.stats.failed > 0) {
                    process.exit(1);
                }
            } else {
                console.log(chalk.red('❌ Especifique um arquivo (-f) ou diretório (-d) para descriptografar'));
                process.exit(1);
            }
        } catch (error) {
            console.log(chalk.red(`💥 Erro fatal: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('info')
    .description('Exibir informações sobre um arquivo criptografado')
    .argument('<file>', 'Caminho para o arquivo')
    .action((file) => {
        console.log(chalk.cyan('📋 Informações do Arquivo\n'));
        
        try {
            const stats = fs.statSync(file);
            const data = fs.readFileSync(file);
            
            console.log(chalk.white(`📁 Arquivo: ${path.basename(file)}`));
            console.log(chalk.white(`📊 Tamanho: ${stats.size} bytes`));
            console.log(chalk.white(`📅 Modificado: ${stats.mtime.toLocaleString()}`));
            
            // Analisar primeiros bytes
            const header = Array.from(data.slice(0, 16))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ');
            console.log(chalk.white(`🔍 Header (16 bytes): ${header}`));
            
            // Calcular entropia
            const entropy = new WantToCryDecryptor().calculateEntropy(data.slice(0, Math.min(1024, data.length)));
            console.log(chalk.white(`📈 Entropia: ${entropy.toFixed(2)}`));
            
            if (entropy > 7.5) {
                console.log(chalk.yellow('⚠️  Alta entropia - provavelmente criptografado'));
            } else {
                console.log(chalk.green('✅ Baixa entropia - possivelmente não criptografado'));
            }
            
        } catch (error) {
            console.log(chalk.red(`❌ Erro ao analisar arquivo: ${error.message}`));
            process.exit(1);
        }
    });

// Executar CLI
if (require.main === module) {
    program.parse();
}