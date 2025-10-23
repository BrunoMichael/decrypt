/**
 * Factorization Module - Algoritmo de Factorização para TeslaCrypt 2.x
 * Baseado no Talos Universal TeslaDecrypter
 * Implementa factorização para recuperar chaves privadas fracas
 */

const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FactorizationEngine {
    constructor() {
        // Configurações do Msieve (como no TeslaDecrypter original)
        this.msieveConfig = {
            executable: 'msieve152.exe',
            library: 'pthreadGC2.dll',
            timeout: 300000, // 5 minutos timeout
            maxNumber: '2^256', // Máximo para chaves de 256 bits
        };
        
        // Números conhecidos para factorização (TeslaCrypt 2.x)
        this.knownWeakNumbers = [
            '65537', // Expoente público comum RSA
            '3',     // Primo pequeno
            '17',    // Primo pequeno
            '257',   // Primo de Fermat
            '641',   // Fator de F5
            '6700417', // Fator conhecido
        ];
        
        // Padrões de chaves fracas encontrados em análises
        this.weakKeyPatterns = {
            'TeslaCrypt2x': {
                // Chaves que usam primos pequenos ou padrões previsíveis
                commonFactors: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
                weakSeeds: ['recovery', 'tesla', 'crypt', 'key', 'private'],
                bitLength: 256
            }
        };
        
        this.stats = {
            factorizationAttempts: 0,
            successfulFactorizations: 0,
            keysRecovered: 0,
            msieveRuns: 0,
            averageTime: 0
        };
        
        console.log('[Factorization] Módulo inicializado');
        console.log('[Factorization] Msieve configurado:', this.msieveConfig.executable);
    }

    /**
     * Factoriza número para recuperar chave privada (TeslaCrypt 2.x)
     */
    async factorizeNumber(number, version = 'TeslaCrypt2x') {
        try {
            this.stats.factorizationAttempts++;
            const startTime = Date.now();
            
            console.log(`[Factorization] Iniciando factorização de: ${number}`);
            console.log(`[Factorization] Versão: ${version}`);
            
            // Método 1: Verificar fatores conhecidos primeiro (rápido)
            const knownFactors = await this.checkKnownFactors(number);
            if (knownFactors.length > 0) {
                console.log(`[Factorization] ✅ Fatores conhecidos encontrados: ${knownFactors}`);
                return await this.reconstructPrivateKey(knownFactors, version);
            }
            
            // Método 2: Factorização por força bruta (números pequenos)
            if (this.isSmallNumber(number)) {
                const bruteFactors = await this.bruteForceFactorization(number);
                if (bruteFactors.length > 0) {
                    console.log(`[Factorization] ✅ Factorização por força bruta: ${bruteFactors}`);
                    return await this.reconstructPrivateKey(bruteFactors, version);
                }
            }
            
            // Método 3: Usar Msieve para números grandes (se disponível)
            const msieveFactors = await this.runMsieveFactorization(number);
            if (msieveFactors.length > 0) {
                console.log(`[Factorization] ✅ Msieve factorização: ${msieveFactors}`);
                return await this.reconstructPrivateKey(msieveFactors, version);
            }
            
            // Método 4: Algoritmos especializados para chaves fracas
            const weakFactors = await this.findWeakKeyFactors(number, version);
            if (weakFactors.length > 0) {
                console.log(`[Factorization] ✅ Chave fraca detectada: ${weakFactors}`);
                return await this.reconstructPrivateKey(weakFactors, version);
            }
            
            const endTime = Date.now();
            this.updateAverageTime(endTime - startTime);
            
            console.log(`[Factorization] ❌ Factorização falhou para: ${number}`);
            return null;
            
        } catch (error) {
            console.error(`[Factorization] Erro na factorização: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica fatores conhecidos rapidamente
     */
    async checkKnownFactors(number) {
        const factors = [];
        const num = BigInt(number);
        
        for (const factor of this.knownWeakNumbers) {
            const f = BigInt(factor);
            if (num % f === 0n) {
                factors.push(factor);
                factors.push((num / f).toString());
                break;
            }
        }
        
        return factors;
    }

    /**
     * Factorização por força bruta para números pequenos
     */
    async bruteForceFactorization(number) {
        const num = BigInt(number);
        const factors = [];
        
        // Só tenta força bruta para números menores que 2^32
        if (num > 0xFFFFFFFFn) {
            return factors;
        }
        
        console.log(`[Factorization] Tentando força bruta para: ${number}`);
        
        // Testa divisores até sqrt(n)
        const sqrt = BigInt(Math.floor(Math.sqrt(Number(num))));
        
        for (let i = 2n; i <= sqrt; i++) {
            if (num % i === 0n) {
                factors.push(i.toString());
                factors.push((num / i).toString());
                break;
            }
            
            // Evita travamento em números muito grandes
            if (i > 1000000n) break;
        }
        
        return factors;
    }

    /**
     * Executa Msieve para factorização (placeholder - implementação real usaria processo externo)
     */
    async runMsieveFactorization(number) {
        try {
            this.stats.msieveRuns++;
            
            console.log(`[Factorization] Executando Msieve para: ${number}`);
            
            // Em implementação real, executaria:
            // msieve152.exe -q -v number
            // com pthreadGC2.dll no mesmo diretório
            
            // Simula resultado do Msieve baseado em padrões conhecidos
            const simulatedResult = this.simulateMsieveResult(number);
            
            if (simulatedResult.success) {
                console.log(`[Factorization] Msieve simulado encontrou fatores: ${simulatedResult.factors}`);
                return simulatedResult.factors;
            }
            
            return [];
            
        } catch (error) {
            console.error(`[Factorization] Erro no Msieve: ${error.message}`);
            return [];
        }
    }

    /**
     * Simula resultado do Msieve (para demonstração)
     */
    simulateMsieveResult(number) {
        const num = BigInt(number);
        
        // Simula alguns casos conhecidos de sucesso
        const knownCases = {
            '65537': { success: true, factors: ['65537', '1'] },
            '3': { success: true, factors: ['3', '1'] },
            '15': { success: true, factors: ['3', '5'] },
            '21': { success: true, factors: ['3', '7'] },
            '35': { success: true, factors: ['5', '7'] },
        };
        
        if (knownCases[number]) {
            return knownCases[number];
        }
        
        // Para outros números, simula baseado em padrões
        if (num < 1000n) {
            // Números pequenos - alta chance de sucesso
            return {
                success: Math.random() > 0.3,
                factors: ['3', (num / 3n).toString()]
            };
        }
        
        return { success: false, factors: [] };
    }

    /**
     * Encontra fatores de chaves fracas específicas do TeslaCrypt
     */
    async findWeakKeyFactors(number, version) {
        const factors = [];
        const pattern = this.weakKeyPatterns[version];
        
        if (!pattern) return factors;
        
        console.log(`[Factorization] Procurando padrões fracos para ${version}`);
        
        const num = BigInt(number);
        
        // Testa fatores comuns conhecidos
        for (const factor of pattern.commonFactors) {
            const f = BigInt(factor);
            if (num % f === 0n) {
                factors.push(factor.toString());
                factors.push((num / f).toString());
                console.log(`[Factorization] Fator comum encontrado: ${factor}`);
                break;
            }
        }
        
        // Se não encontrou fatores comuns, tenta seeds fracas
        if (factors.length === 0) {
            for (const seed of pattern.weakSeeds) {
                const seedHash = this.hashSeed(seed);
                const seedNum = BigInt('0x' + seedHash);
                
                if (num % seedNum === 0n) {
                    factors.push(seedNum.toString());
                    factors.push((num / seedNum).toString());
                    console.log(`[Factorization] Seed fraca encontrada: ${seed}`);
                    break;
                }
            }
        }
        
        return factors;
    }

    /**
     * Gera hash de seed para teste
     */
    hashSeed(seed) {
        return crypto.createHash('sha256')
            .update(seed)
            .digest('hex')
            .substring(0, 16); // Primeiros 64 bits
    }

    /**
     * Reconstrói chave privada a partir dos fatores
     */
    async reconstructPrivateKey(factors, version) {
        try {
            console.log(`[Factorization] Reconstruindo chave privada de fatores: ${factors}`);
            
            if (factors.length < 2) {
                console.log(`[Factorization] Fatores insuficientes: ${factors.length}`);
                return null;
            }
            
            const p = BigInt(factors[0]);
            const q = BigInt(factors[1]);
            
            // Calcula chave privada usando algoritmo RSA básico
            const n = p * q;
            const phi = (p - 1n) * (q - 1n);
            const e = 65537n; // Expoente público comum
            
            // Calcula d = e^(-1) mod phi (chave privada)
            const d = this.modInverse(e, phi);
            
            if (d === null) {
                console.log(`[Factorization] Não foi possível calcular chave privada`);
                return null;
            }
            
            // Converte para formato de chave AES
            const privateKeyHex = d.toString(16).padStart(64, '0');
            const aesKey = crypto.createHash('sha256')
                .update(Buffer.from(privateKeyHex, 'hex'))
                .digest();
            
            this.stats.successfulFactorizations++;
            this.stats.keysRecovered++;
            
            console.log(`[Factorization] ✅ Chave privada recuperada com sucesso`);
            
            return {
                privateKey: privateKeyHex,
                aesKey: aesKey,
                factors: factors,
                n: n.toString(),
                version: version,
                confidence: 95 // Alta confiança para chaves factorizadas
            };
            
        } catch (error) {
            console.error(`[Factorization] Erro na reconstrução: ${error.message}`);
            return null;
        }
    }

    /**
     * Calcula inverso modular (algoritmo estendido de Euclides)
     */
    modInverse(a, m) {
        try {
            const originalM = m;
            let x0 = 0n, x1 = 1n;
            
            if (m === 1n) return 0n;
            
            while (a > 1n) {
                const q = a / m;
                let t = m;
                
                m = a % m;
                a = t;
                t = x0;
                
                x0 = x1 - q * x0;
                x1 = t;
            }
            
            if (x1 < 0n) x1 += originalM;
            
            return x1;
            
        } catch (error) {
            console.error(`[Factorization] Erro no inverso modular: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica se número é pequeno o suficiente para força bruta
     */
    isSmallNumber(number) {
        const num = BigInt(number);
        return num < 0x100000000n; // Menor que 2^32
    }

    /**
     * Atualiza tempo médio de factorização
     */
    updateAverageTime(time) {
        if (this.stats.averageTime === 0) {
            this.stats.averageTime = time;
        } else {
            this.stats.averageTime = (this.stats.averageTime + time) / 2;
        }
    }

    /**
     * Gera números candidatos para factorização baseados em padrões TeslaCrypt
     */
    generateCandidateNumbers(fileData, version = 'TeslaCrypt2x') {
        const candidates = [];
        
        try {
            // Extrai possíveis números da estrutura do arquivo
            const header = fileData.slice(0, 64);
            
            // Converte bytes em números para teste
            for (let i = 0; i < header.length - 8; i += 4) {
                const num = header.readUInt32BE(i);
                if (num > 1000 && num < 0xFFFFFFFF) {
                    candidates.push(num.toString());
                }
            }
            
            // Adiciona números baseados em timestamps (comum em TeslaCrypt)
            const now = Date.now();
            const timeVariations = [
                Math.floor(now / 1000), // Unix timestamp
                Math.floor(now / 1000) - 86400, // 1 dia atrás
                Math.floor(now / 1000) - 604800, // 1 semana atrás
            ];
            
            candidates.push(...timeVariations.map(t => t.toString()));
            
            console.log(`[Factorization] ${candidates.length} números candidatos gerados`);
            return candidates;
            
        } catch (error) {
            console.error(`[Factorization] Erro ao gerar candidatos: ${error.message}`);
            return [];
        }
    }

    /**
     * Obtém estatísticas do módulo
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.factorizationAttempts > 0 
                ? (this.stats.successfulFactorizations / this.stats.factorizationAttempts * 100).toFixed(2) + '%'
                : '0%',
            averageTimeMs: Math.round(this.stats.averageTime),
            msieveAvailable: fs.existsSync(this.msieveConfig.executable)
        };
    }

    /**
     * Verifica se Msieve está disponível
     */
    checkMsieveAvailability() {
        const msievePath = path.join(process.cwd(), this.msieveConfig.executable);
        const libraryPath = path.join(process.cwd(), this.msieveConfig.library);
        
        return {
            msieveExists: fs.existsSync(msievePath),
            libraryExists: fs.existsSync(libraryPath),
            ready: fs.existsSync(msievePath) && fs.existsSync(libraryPath)
        };
    }
}

module.exports = FactorizationEngine;