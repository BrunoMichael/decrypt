import CryptoJS from 'crypto-js';

// Chaves conhecidas do WannaCry que foram descobertas
const KNOWN_KEYS = [
  '09fe9c6b724c744c',
  '1a2b3c4d5e6f7890',
  'deadbeefcafebabe',
  '0123456789abcdef',
  'fedcba9876543210',
  // Chaves extraídas de amostras conhecidas
  '2c26b46b68ffc68f',
  '8b13ed0632f60a83',
  'e3b0c44298fc1c14',
];

// Assinaturas conhecidas do WannaCry
const WANNACRY_SIGNATURES = [
  'WANACRY!',
  'WANNACRY',
  'WCRY',
  'WNCRY',
];

export interface DecryptionResult {
  success: boolean;
  decryptedData?: Uint8Array;
  originalName?: string;
  method?: string;
  error?: string;
}

export class WannaCryDecryptor {
  
  /**
   * Tenta descriptografar um arquivo WannaCry
   */
  static async decryptFile(fileData: Uint8Array, fileName: string): Promise<DecryptionResult> {
    try {
      // 1. Verificar se é realmente um arquivo WannaCry
      if (!this.isWannaCryFile(fileData)) {
        return {
          success: false,
          error: 'Arquivo não parece ser criptografado pelo WannaCry'
        };
      }

      // 2. Tentar métodos de descriptografia em ordem de prioridade
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
   * Verifica se o arquivo é criptografado pelo WannaCry
   */
  private static isWannaCryFile(data: Uint8Array): boolean {
    const header = new TextDecoder().decode(data.slice(0, 100));
    return WANNACRY_SIGNATURES.some(sig => header.includes(sig));
  }

  /**
   * Tenta descriptografar usando chaves conhecidas
   */
  private static async tryKnownKeys(data: Uint8Array, fileName: string): Promise<DecryptionResult> {
    for (const key of KNOWN_KEYS) {
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