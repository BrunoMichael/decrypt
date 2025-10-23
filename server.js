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

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${port}`);
    console.log('📁 Acesse a interface web para analisar arquivos criptografados');
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Memória disponível: ${process.env.MEMORY || 'N/A'}MB`);
});