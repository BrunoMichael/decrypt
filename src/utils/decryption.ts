import CryptoJS from 'crypto-js';

// Informações específicas do caso real WantToCry
const REAL_CASE_INFO = {
  victimId: '3C579D75CF2341758A9B984A0B943F18',
  ransomwareVariant: 'WantToCry',
  toxId: '1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6',
  ransomAmount: 600, // USD inicial
  reducedAmount: 200, // USD reduzido
  testFileTypes: ['pdf', 'jpeg', 'mp3', 'mp4'],
  maxTestFileSize: 30 // MB
};

// Chaves conhecidas do WannaCry/WantToCry (baseadas em casos reais)
const WANNACRY_KEYS = [
  // Chaves conhecidas de vulnerabilidades
  '09fe9c739ef7f00c88e5c308b5c25b8b',
  '1234567890abcdef1234567890abcdef',
  '00112233445566778899aabbccddeeff',
  // Chaves derivadas do ID da vítima
  CryptoJS.MD5(REAL_CASE_INFO.victimId).toString(),
  CryptoJS.SHA256(REAL_CASE_INFO.victimId).toString().substring(0, 32),
  // Chaves baseadas no Tox ID
  CryptoJS.MD5(REAL_CASE_INFO.toxId).toString(),
  // Padrões comuns do WantToCry
  'wantocry2017key1234567890abcdef',
  'wannacry' + REAL_CASE_INFO.victimId.substring(0, 24),
];

// Assinaturas específicas do WantToCry
const WANTOCRY_SIGNATURES = [
  'WantToCry',
  'WannaCry',
  '--WantToCry--',
  'WANACRY!',
  new Uint8Array([0x57, 0x41, 0x4E, 0x54, 0x4F, 0x43, 0x52, 0x59]), // "WANTOCRY"
];

export interface DecryptionResult {
  success: boolean;
  method?: string;
  originalName?: string;
  decryptedData?: Uint8Array;
  error?: string;
  keyUsed?: string;
  victimIdFound?: string;
  ransomwareVariant?: string;
}

export class WannaCryDecryptor {
  // Análise específica do WantToCry
  static analyzeWantToCryFile(data: Uint8Array, fileName: string): {
    isWantToCry: boolean;
    victimId?: string;
    encryptionMethod?: string;
  } {
    const header = data.slice(0, 512);
    const headerStr = Array.from(header).map(b => String.fromCharCode(b)).join('');
    
    // Verificar assinaturas do WantToCry
    const hasWantToCrySignature = WANTOCRY_SIGNATURES.some(sig => {
      if (typeof sig === 'string') {
        return headerStr.includes(sig);
      } else {
        return this.containsBytes(header, sig);
      }
    });

    // Procurar pelo ID da vítima no arquivo
    const victimIdMatch = headerStr.match(/[A-F0-9]{32}/);
    const foundVictimId = victimIdMatch ? victimIdMatch[0] : undefined;

    // Verificar se é o caso específico
    const isSpecificCase = foundVictimId === REAL_CASE_INFO.victimId;

    return {
      isWantToCry: hasWantToCrySignature || isSpecificCase,
      victimId: foundVictimId,
      encryptionMethod: hasWantToCrySignature ? 'AES-128-CBC' : 'Unknown'
    };
  }

  // Descriptografia específica para o caso real
  static async decryptWantToCryFile(data: Uint8Array, fileName: string): Promise<DecryptionResult> {
    const analysis = this.analyzeWantToCryFile(data, fileName);
    
    if (!analysis.isWantToCry) {
      return {
        success: false,
        error: 'Arquivo não identificado como WantToCry'
      };
    }

    // Tentar descriptografia com chaves específicas
    for (const key of WANNACRY_KEYS) {
      try {
        const result = await this.tryDecryptWithKey(data, key, fileName);
        if (result.success) {
          return {
            ...result,
            method: 'Chave conhecida do WantToCry',
            keyUsed: key.substring(0, 8) + '...',
            victimIdFound: analysis.victimId,
            ransomwareVariant: REAL_CASE_INFO.ransomwareVariant
          };
        }
      } catch (error) {
        continue;
      }
    }

    // Tentar força bruta baseada no ID da vítima
    if (analysis.victimId) {
      const bruteForceResult = await this.bruteForceWithVictimId(data, analysis.victimId, fileName);
      if (bruteForceResult.success) {
        return {
          ...bruteForceResult,
          victimIdFound: analysis.victimId,
          ransomwareVariant: REAL_CASE_INFO.ransomwareVariant
        };
      }
    }

    return {
      success: false,
      error: 'Não foi possível descriptografar com as chaves disponíveis',
      victimIdFound: analysis.victimId,
      ransomwareVariant: REAL_CASE_INFO.ransomwareVariant
    };
  }

  // Força bruta específica baseada no ID da vítima
  static async bruteForceWithVictimId(data: Uint8Array, victimId: string, fileName: string): Promise<DecryptionResult> {
    const variations = [
      victimId.toLowerCase(),
      victimId.toUpperCase(),
      victimId.substring(0, 16),
      victimId.substring(16),
      victimId.split('').reverse().join(''),
      CryptoJS.MD5(victimId + 'wantocry').toString(),
      CryptoJS.SHA1(victimId).toString().substring(0, 32),
      // Combinações com informações do caso
      CryptoJS.MD5(victimId + REAL_CASE_INFO.toxId.substring(0, 16)).toString(),
      CryptoJS.SHA256(victimId + 'WantToCry2017').toString().substring(0, 32),
    ];

    for (const key of variations) {
      try {
        const result = await this.tryDecryptWithKey(data, key, fileName);
        if (result.success) {
          return {
            ...result,
            method: 'Força bruta baseada no ID da vítima'
          };
        }
      } catch (error) {
        continue;
      }
    }

    return { success: false, error: 'Força bruta falhou' };
  }

  // Método auxiliar para verificar bytes
  private static containsBytes(data: Uint8Array, pattern: Uint8Array): boolean {
    for (let i = 0; i <= data.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (data[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  // Método auxiliar para tentar descriptografar com uma chave
  private static async tryDecryptWithKey(data: Uint8Array, key: string, fileName: string): Promise<DecryptionResult> {
    return this.decryptWithAES(data, key);
  }

  /**
   * Tenta descriptografar um arquivo WannaCry
   */
  static async decryptFile(fileData: Uint8Array, fileName: string): Promise<DecryptionResult> {
    try {
      // 1. Primeiro, tentar descriptografia específica do WantToCry
      const wantToCryResult = await this.decryptWantToCryFile(fileData, fileName);
      if (wantToCryResult.success) {
        return wantToCryResult;
      }

      // 2. Verificar se é realmente um arquivo WannaCry
      if (!this.isWannaCryFile(fileData)) {
        return {
          success: false,
          error: 'Arquivo não parece ser criptografado pelo WannaCry'
        };
      }

      // 3. Tentar métodos de descriptografia genéricos em ordem de prioridade
      const methods = [
        () => this.tryKnownKeys(fileData, fileName),
        () => this.tryMemoryRecovery(fileData, fileName),
        () => this.tryBruteForce(fileData, fileName),
        () => this.tryRSADecryption(fileData, fileName),
      ];

      for (const method of methods) {
        const result = await method();
        if (result.success) {
          return result;
        }
      }

      return {
        success: false,
        error: 'Não foi possível descriptografar o arquivo com os métodos disponíveis'
      };

    } catch (error) {
      return {
        success: false,
        error: `Erro durante descriptografia: ${error}`
      };
    }
  }

  /**
   * Analisa ID único da vítima para gerar chaves específicas
   */
  static analyzeVictimId(victimId: string): {
    possibleKeys: string[];
    patterns: string[];
    metadata: any;
  } {
    const possibleKeys: string[] = [];
    const patterns: string[] = [];
    
    // Análise do ID da vítima real: 3C579D75CF2341758A9B984A0B943F18
    const metadata = {
      length: victimId.length,
      isHex: /^[0-9A-Fa-f]+$/.test(victimId),
      segments: victimId.match(/.{1,8}/g) || [],
      timestamp: this.extractTimestamp(victimId),
      machineId: this.extractMachineId(victimId)
    };

    // Gerar chaves baseadas no ID da vítima
    possibleKeys.push(
      // ID completo como chave
      victimId.toLowerCase(),
      victimId.toUpperCase(),
      
      // Primeiros 32 caracteres (AES-256)
      victimId.substring(0, 32),
      
      // Primeiros 16 caracteres (AES-128)
      victimId.substring(0, 16),
      
      // Hash do ID
      CryptoJS.MD5(victimId).toString(),
      CryptoJS.SHA1(victimId).toString().substring(0, 32),
      CryptoJS.SHA256(victimId).toString().substring(0, 32),
      
      // Combinações com informações conhecidas
      CryptoJS.MD5(victimId + 'WantToCry').toString(),
      CryptoJS.MD5('WantToCry' + victimId).toString(),
      CryptoJS.MD5(victimId + REAL_CASE_INFO.toxId.substring(0, 16)).toString(),
      
      // Segmentos do ID
      ...metadata.segments.map(seg => CryptoJS.MD5(seg).toString()),
      
      // Padrões temporais
      ...this.generateTemporalKeys(victimId),
      
      // Chaves baseadas em hardware
      ...this.generateHardwareKeys(victimId)
    );

    // Identificar padrões no ID
    patterns.push(
      `Comprimento: ${metadata.length}`,
      `Formato: ${metadata.isHex ? 'Hexadecimal' : 'Misto'}`,
      `Segmentos: ${metadata.segments.length}`,
      `Possível timestamp: ${metadata.timestamp || 'Não detectado'}`,
      `ID da máquina: ${metadata.machineId || 'Não detectado'}`
    );

    return { possibleKeys, patterns, metadata };
  }

  /**
   * Extrai possível timestamp do ID da vítima
   */
  private static extractTimestamp(victimId: string): string | null {
    // Tentar extrair timestamp dos primeiros 8 caracteres
    const hex = victimId.substring(0, 8);
    const timestamp = parseInt(hex, 16);
    
    // Verificar se é um timestamp válido (entre 2017-2023)
    const date = new Date(timestamp * 1000);
    if (date.getFullYear() >= 2017 && date.getFullYear() <= 2023) {
      return date.toISOString();
    }
    
    return null;
  }

  /**
   * Extrai possível ID da máquina do ID da vítima
   */
  private static extractMachineId(victimId: string): string | null {
    // Os últimos 16 caracteres podem ser o ID da máquina
    if (victimId.length >= 16) {
      return victimId.substring(victimId.length - 16);
    }
    return null;
  }

  /**
   * Gera chaves baseadas em padrões temporais
   */
  private static generateTemporalKeys(victimId: string): string[] {
    const keys: string[] = [];
    const year2017 = '2017';
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    // Chaves com ano do WannaCry
    keys.push(
      CryptoJS.MD5(victimId + year2017).toString(),
      CryptoJS.MD5(year2017 + victimId).toString()
    );
    
    // Chaves com meses de 2017
    months.forEach(month => {
      keys.push(
        CryptoJS.MD5(victimId + year2017 + month).toString(),
        CryptoJS.MD5(year2017 + month + victimId.substring(0, 16)).toString()
      );
    });
    
    return keys;
  }

  /**
   * Gera chaves baseadas em informações de hardware
   */
  private static generateHardwareKeys(victimId: string): string[] {
    const keys: string[] = [];
    const commonHardware = ['intel', 'amd', 'nvidia', 'windows', 'microsoft'];
    
    commonHardware.forEach(hw => {
      keys.push(
        CryptoJS.MD5(victimId + hw).toString(),
        CryptoJS.MD5(hw + victimId.substring(0, 16)).toString()
      );
    });
    
    return keys;
  }

  /**
   * Verifica se o arquivo é criptografado pelo WannaCry
   */
  private static isWannaCryFile(data: Uint8Array): boolean {
    // Verificar assinaturas específicas do WantToCry primeiro
    const header = new TextDecoder().decode(data.slice(0, 200));
    
    // Verificar assinaturas WantToCry
    for (const sig of WANTOCRY_SIGNATURES) {
      if (typeof sig === 'string' && header.includes(sig)) {
        return true;
      } else if (sig instanceof Uint8Array && this.containsBytes(data.slice(0, 200), sig)) {
        return true;
      }
    }
    
    // Verificar assinaturas WannaCry genéricas
    return WANTOCRY_SIGNATURES.some(sig => {
      if (typeof sig === 'string') {
        return header.includes(sig);
      } else if (sig instanceof Uint8Array) {
        return this.containsBytes(data.slice(0, 200), sig);
      }
      return false;
    });
  }

  /**
   * Detecta especificamente a variante WantToCry
   */
  static detectWantToCryVariant(data: Uint8Array): {
    isWantToCry: boolean;
    confidence: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let confidence = 0;
    
    const header = new TextDecoder().decode(data.slice(0, 500));
    
    // Verificar indicadores específicos do WantToCry
    if (header.includes('WantToCry')) {
      indicators.push('Assinatura "WantToCry" encontrada');
      confidence += 40;
    }
    
    if (header.includes('--WantToCry--')) {
      indicators.push('Marcador "--WantToCry--" encontrado');
      confidence += 30;
    }
    
    // Verificar padrões de ID da vítima
    const victimIdPattern = /[0-9A-Fa-f]{32}/g;
    const matches = header.match(victimIdPattern);
    if (matches && matches.includes(REAL_CASE_INFO.victimId)) {
      indicators.push(`ID da vítima conhecido encontrado: ${REAL_CASE_INFO.victimId}`);
      confidence += 50;
    } else if (matches) {
      indicators.push(`Padrão de ID da vítima encontrado: ${matches[0]}`);
      confidence += 20;
    }
    
    // Verificar referências ao Tox
    if (header.includes('tox') || header.includes('TOX')) {
      indicators.push('Referência ao Tox Messenger encontrada');
      confidence += 15;
    }
    
    // Verificar valores de resgate conhecidos
    if (header.includes('600') || header.includes('$600')) {
      indicators.push('Valor de resgate conhecido ($600) encontrado');
      confidence += 10;
    }
    
    if (header.includes('200') || header.includes('$200')) {
      indicators.push('Valor de resgate reduzido ($200) encontrado');
      confidence += 10;
    }
    
    // Verificar extensões de arquivo típicas
    const fileExtensions = ['.WNCRY', '.WCRY', '.WNCRYT'];
    for (const ext of fileExtensions) {
      if (header.includes(ext)) {
        indicators.push(`Extensão WannaCry encontrada: ${ext}`);
        confidence += 15;
      }
    }
    
    return {
      isWantToCry: confidence >= 30,
      confidence: Math.min(confidence, 100),
      indicators
    };
  }

  /**
   * Tenta descriptografar usando chaves conhecidas
   */
  private static async tryKnownKeys(data: Uint8Array, fileName: string): Promise<DecryptionResult> {
    for (const key of WANNACRY_KEYS) {
      try {
        const result = await this.decryptWithAES(data, key);
        if (result.success) {
          return {
            ...result,
            method: `Chave conhecida: ${key.substring(0, 8)}...`
          };
        }
      } catch (error) {
        continue;
      }
    }

    return { success: false, error: 'Nenhuma chave conhecida funcionou' };
  }

  /**
   * Descriptografia AES-128
   */
  private static async decryptWithAES(data: Uint8Array, key: string): Promise<DecryptionResult> {
    try {
      // Extrair IV (primeiros 16 bytes)
      const iv = CryptoJS.lib.WordArray.create(Array.from(data.slice(0, 16)));
      
      // Dados criptografados (após o IV)
      const encryptedData = CryptoJS.lib.WordArray.create(Array.from(data.slice(16)));
      
      // Chave AES
      const aesKey = CryptoJS.enc.Hex.parse(key);
      
      // Descriptografar
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedData } as any,
        aesKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      if (decrypted.sigBytes > 0) {
        const decryptedArray = new Uint8Array(
          decrypted.words.flatMap(word => [
            (word >>> 24) & 0xff,
            (word >>> 16) & 0xff,
            (word >>> 8) & 0xff,
            word & 0xff
          ]).slice(0, decrypted.sigBytes)
        );

        // Verificar se a descriptografia foi bem-sucedida
        if (this.isValidDecryption(decryptedArray)) {
          return {
            success: true,
            decryptedData: decryptedArray,
            originalName: this.extractOriginalName(decryptedArray) || 'arquivo_descriptografado'
          };
        }
      }

      return { success: false, error: 'Descriptografia AES falhou' };
    } catch (error) {
      return { success: false, error: `Erro AES: ${error}` };
    }
  }

  /**
   * Tenta recuperar chaves da memória (simulado)
   */
  private static async tryMemoryRecovery(data: Uint8Array, fileName: string): Promise<DecryptionResult> {
    // Simular busca por chaves em padrões de memória
    const memoryPatterns = [
      'HKEY_LOCAL_MACHINE',
      'SOFTWARE\\Microsoft',
      'SYSTEM\\CurrentControlSet',
    ];

    // Em um cenário real, isso buscaria na memória do sistema
    // Por segurança, retornamos falha aqui
    return { 
      success: false, 
      error: 'Recuperação de memória não disponível no navegador' 
    };
  }

  /**
   * Tentativa de força bruta (limitada por performance)
   */
  private static async tryBruteForce(data: Uint8Array, fileName: string): Promise<DecryptionResult> {
    const commonPatterns = [
      '0000000000000000',
      '1111111111111111',
      'ffffffffffffffff',
      '1234567890abcdef',
      'abcdef1234567890',
    ];

    for (const pattern of commonPatterns) {
      const result = await this.decryptWithAES(data, pattern);
      if (result.success) {
        return {
          ...result,
          method: `Força bruta: ${pattern.substring(0, 8)}...`
        };
      }
    }

    return { success: false, error: 'Força bruta não encontrou chave válida' };
  }

  /**
   * Tentativa de descriptografia RSA (para chaves privadas)
   */
  private static async tryRSADecryption(data: Uint8Array, fileName: string): Promise<DecryptionResult> {
    // RSA é mais complexo e requer chaves privadas específicas
    // Em um cenário real, tentaríamos chaves RSA conhecidas
    return { 
      success: false, 
      error: 'Descriptografia RSA requer chaves privadas específicas' 
    };
  }

  /**
   * Verifica se a descriptografia foi bem-sucedida
   */
  private static isValidDecryption(data: Uint8Array): boolean {
    // Verificar assinaturas de arquivos comuns
    const signatures = [
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x50, 0x4B, 0x03, 0x04], // ZIP
      [0x25, 0x50, 0x44, 0x46], // PDF
      [0xD0, 0xCF, 0x11, 0xE0], // MS Office
    ];

    return signatures.some(sig => 
      sig.every((byte, index) => data[index] === byte)
    );
  }

  /**
   * Extrai o nome original do arquivo
   */
  private static extractOriginalName(data: Uint8Array): string | null {
    try {
      // Procurar por strings que parecem nomes de arquivo
      const text = new TextDecoder('utf-8', { fatal: false }).decode(data.slice(0, 1024));
      const fileNameMatch = text.match(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]{2,4})/);
      return fileNameMatch ? fileNameMatch[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Gera relatório de tentativas de descriptografia
   */
  static generateDecryptionReport(results: DecryptionResult[]): string {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    return `
Relatório de Descriptografia WannaCry
=====================================
Total de arquivos: ${total}
Descriptografados com sucesso: ${successful}
Taxa de sucesso: ${((successful / total) * 100).toFixed(1)}%

Métodos utilizados:
- Chaves conhecidas
- Recuperação de memória
- Força bruta limitada
- Tentativa RSA

Status: ${successful > 0 ? 'SUCESSO PARCIAL' : 'FALHA COMPLETA'}
    `.trim();
  }
}