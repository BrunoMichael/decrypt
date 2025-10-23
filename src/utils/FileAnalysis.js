class FileAnalysis {
  constructor() {
    this.wantToCrySignatures = [
      'want_to_cry',
      'WANTTOCRY',
      'WantToCry',
      '.want_to_cry'
    ];
    
    this.commonEncryptionPatterns = [
      /^[A-Fa-f0-9]{32,}$/, // Hex patterns
      /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64 patterns
    ];
  }

  async analyzeRansomware(encryptedFile, originalFile = null) {
    try {
      const result = {
        ransomwareType: 'WantToCry',
        extension: this.extractExtension(encryptedFile.name),
        fileSize: encryptedFile.size,
        patterns: [],
        recommendations: []
      };

      // Ler o arquivo criptografado
      const encryptedBuffer = await this.readFileAsArrayBuffer(encryptedFile);
      const encryptedBytes = new Uint8Array(encryptedBuffer);

      // Análise do cabeçalho
      result.headerSignature = this.bytesToHex(encryptedBytes.slice(0, 32));
      
      // Calcular entropia
      result.entropy = this.calculateEntropy(encryptedBytes);

      // Detectar padrões
      result.patterns = this.detectPatterns(encryptedBytes, encryptedFile.name);

      // Análise específica do WantToCry
      this.analyzeWantToCrySpecific(result, encryptedBytes, encryptedFile.name);

      // Se temos arquivo original, fazer comparação
      if (originalFile) {
        const originalBuffer = await this.readFileAsArrayBuffer(originalFile);
        const originalBytes = new Uint8Array(originalBuffer);
        result.comparison = this.compareFiles(originalBytes, encryptedBytes);
      }

      // Gerar recomendações
      result.recommendations = this.generateRecommendations(result);

      return result;

    } catch (error) {
      throw new Error(`Erro na análise: ${error.message}`);
    }
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  extractExtension(filename) {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return '.' + parts[parts.length - 1];
    }
    return 'Sem extensão';
  }

  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
  }

  calculateEntropy(bytes) {
    const frequency = new Array(256).fill(0);
    
    // Contar frequência de cada byte
    for (let i = 0; i < bytes.length; i++) {
      frequency[bytes[i]]++;
    }

    // Calcular entropia de Shannon
    let entropy = 0;
    const length = bytes.length;
    
    for (let i = 0; i < 256; i++) {
      if (frequency[i] > 0) {
        const probability = frequency[i] / length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  detectPatterns(bytes, filename) {
    const patterns = [];

    // Verificar assinatura WantToCry no nome do arquivo
    if (filename.toLowerCase().includes('want_to_cry')) {
      patterns.push('✅ Extensão WantToCry detectada no nome do arquivo');
    }

    // Verificar entropia alta (indicativo de criptografia)
    const entropy = this.calculateEntropy(bytes);
    if (entropy > 7.5) {
      patterns.push('🔒 Alta entropia detectada (dados provavelmente criptografados)');
    } else if (entropy < 6.0) {
      patterns.push('⚠️ Baixa entropia - arquivo pode não estar completamente criptografado');
    }

    // Verificar padrões no cabeçalho
    const header = bytes.slice(0, 64);
    const headerHex = this.bytesToHex(header);
    
    // Procurar por padrões conhecidos de criptografia
    if (this.hasRepeatingPatterns(header)) {
      patterns.push('🔍 Padrões repetitivos detectados no cabeçalho');
    }

    // Verificar se há strings legíveis no início (indicativo de não-criptografia)
    const headerString = String.fromCharCode(...header.filter(b => b >= 32 && b <= 126));
    if (headerString.length > 10) {
      patterns.push('📝 Texto legível encontrado no cabeçalho: ' + headerString.substring(0, 50));
    }

    // Análise de distribuição de bytes
    const distribution = this.analyzeByteDistribution(bytes);
    if (distribution.isUniform) {
      patterns.push('📊 Distribuição uniforme de bytes (característico de criptografia forte)');
    }

    return patterns;
  }

  hasRepeatingPatterns(bytes) {
    const patterns = new Map();
    
    // Procurar por padrões de 4 bytes
    for (let i = 0; i <= bytes.length - 4; i++) {
      const pattern = bytes.slice(i, i + 4).join(',');
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    // Se algum padrão se repete mais de 3 vezes, consideramos suspeito
    for (let count of patterns.values()) {
      if (count > 3) {
        return true;
      }
    }

    return false;
  }

  analyzeByteDistribution(bytes) {
    const frequency = new Array(256).fill(0);
    
    for (let i = 0; i < bytes.length; i++) {
      frequency[bytes[i]]++;
    }

    // Calcular desvio padrão da distribuição
    const mean = bytes.length / 256;
    let variance = 0;
    
    for (let i = 0; i < 256; i++) {
      variance += Math.pow(frequency[i] - mean, 2);
    }
    
    const stdDev = Math.sqrt(variance / 256);
    const coefficient = stdDev / mean;

    return {
      isUniform: coefficient < 0.3, // Distribuição considerada uniforme
      coefficient: coefficient,
      standardDeviation: stdDev
    };
  }

  analyzeWantToCrySpecific(result, bytes, filename) {
    // Verificar características específicas do WantToCry
    
    // 1. Verificar se o arquivo tem a extensão característica
    if (filename.toLowerCase().endsWith('.want_to_cry')) {
      result.patterns.push('🎯 Extensão .want_to_cry confirmada');
    }

    // 2. Procurar por possíveis marcadores no arquivo
    const fileString = String.fromCharCode(...bytes.slice(0, 1024));
    
    if (fileString.includes('WantToCry') || fileString.includes('want_to_cry')) {
      result.patterns.push('🔍 Marcador WantToCry encontrado no conteúdo');
    }

    // 3. Análise do tamanho do arquivo
    if (result.fileSize > 0) {
      if (result.fileSize % 16 === 0) {
        result.patterns.push('🔢 Tamanho do arquivo é múltiplo de 16 (compatível com AES)');
      }
    }

    // 4. Verificar possível estrutura de cabeçalho
    const header = bytes.slice(0, 16);
    const headerPattern = this.bytesToHex(header);
    
    // Alguns ransomwares adicionam cabeçalhos específicos
    if (this.looksLikeEncryptionHeader(header)) {
      result.patterns.push('🔐 Possível cabeçalho de criptografia detectado');
    }
  }

  looksLikeEncryptionHeader(header) {
    // Verificar se o cabeçalho tem características de dados criptografados
    const entropy = this.calculateEntropy(header);
    return entropy > 7.0;
  }

  compareFiles(originalBytes, encryptedBytes) {
    const comparison = {
      sizeDifference: `${encryptedBytes.length - originalBytes.length} bytes`,
      likelyAlgorithm: 'Desconhecido'
    };

    // Análise da diferença de tamanho
    const sizeDiff = encryptedBytes.length - originalBytes.length;
    
    if (sizeDiff === 0) {
      comparison.likelyAlgorithm = 'Stream cipher ou substituição simples';
    } else if (sizeDiff > 0 && sizeDiff < 100) {
      comparison.likelyAlgorithm = 'Possível AES com padding e cabeçalho';
    } else if (sizeDiff > 100) {
      comparison.likelyAlgorithm = 'Algoritmo com overhead significativo';
    }

    // Verificar se há alguma similaridade nos primeiros bytes
    let similarBytes = 0;
    const compareLength = Math.min(originalBytes.length, encryptedBytes.length, 100);
    
    for (let i = 0; i < compareLength; i++) {
      if (originalBytes[i] === encryptedBytes[i]) {
        similarBytes++;
      }
    }

    if (similarBytes > compareLength * 0.1) {
      comparison.likelyAlgorithm += ' (possível criptografia fraca ou parcial)';
    }

    return comparison;
  }

  generateRecommendations(result) {
    const recommendations = [];

    // Recomendações baseadas na entropia
    if (result.entropy > 7.5) {
      recommendations.push('O arquivo apresenta alta entropia, indicando criptografia forte');
      recommendations.push('Tentativas de força bruta serão provavelmente ineficazes');
    }

    // Recomendações baseadas nos padrões
    if (result.patterns.some(p => p.includes('texto legível'))) {
      recommendations.push('Presença de texto legível pode indicar criptografia parcial ou fraca');
      recommendations.push('Considere analisar as partes não criptografadas para obter pistas');
    }

    // Recomendações gerais para WantToCry
    recommendations.push('Mantenha backups seguros e desconectados da rede');
    recommendations.push('Não pague o resgate - não há garantia de recuperação');
    recommendations.push('Procure por ferramentas de descriptografia gratuitas online');
    recommendations.push('Considere restaurar arquivos de backups anteriores');

    // Recomendação sobre análise forense
    if (result.comparison) {
      recommendations.push('A comparação com arquivo original fornece insights valiosos');
      recommendations.push('Documente todos os achados para análise forense');
    }

    return recommendations;
  }
}

export default FileAnalysis;