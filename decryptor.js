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
        
        // Método 1: Hash direto do Tox ID + Victim ID
        const combined1 = this.toxId + this.victimId;
        const key1 = crypto.createHash('sha256').update(combined1).digest();
        keys.push({ method: 'ToxID+VictimID SHA256', key: key1 });
        
        // Método 2: Hash do Victim ID + Tox ID (ordem inversa)
        const combined2 = this.victimId + this.toxId;
        const key2 = crypto.createHash('sha256').update(combined2).digest();
        keys.push({ method: 'VictimID+ToxID SHA256', key: key2 });
        
        // Método 3: PBKDF2 usando Tox ID como senha e Victim ID como salt
        const key3 = crypto.pbkdf2Sync(this.toxId, this.victimId, 10000, 32, 'sha256');
        keys.push({ method: 'PBKDF2 (ToxID, VictimID)', key: key3 });
        
        // Método 4: PBKDF2 usando Victim ID como senha e Tox ID como salt
        const key4 = crypto.pbkdf2Sync(this.victimId, this.toxId, 10000, 32, 'sha256');
        keys.push({ method: 'PBKDF2 (VictimID, ToxID)', key: key4 });
        
        // Método 5: Hash MD5 + SHA256 (método comum em ransomware)
        const md5Hash = crypto.createHash('md5').update(combined1).digest('hex');
        const key5 = crypto.createHash('sha256').update(md5Hash).digest();
        keys.push({ method: 'MD5+SHA256', key: key5 });
        
        // Método 6: Apenas os primeiros 32 bytes do Tox ID convertidos
        const toxBuffer = Buffer.from(this.toxId.substring(0, 64), 'hex');
        keys.push({ method: 'ToxID Direct (32 bytes)', key: toxBuffer });
        
        // Método 7: XOR entre hashes
        const hash1 = crypto.createHash('sha256').update(this.toxId).digest();
        const hash2 = crypto.createHash('sha256').update(this.victimId).digest();
        const key7 = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
            key7[i] = hash1[i] ^ hash2[i];
        }
        keys.push({ method: 'XOR Hashes', key: key7 });
        
        return keys;
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
}

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

module.exports = WantToCryDecryptor;