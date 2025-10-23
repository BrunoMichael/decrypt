import CryptoJS from 'crypto-js';

/**
 * Simulador de arquivo criptografado real baseado no caso WantToCry
 */
export class WantToCryFileSimulator {
  
  /**
   * Cria um arquivo simulado criptografado pelo WantToCry
   */
  static createEncryptedFile(originalData: Uint8Array, fileName: string): {
    encryptedData: Uint8Array;
    metadata: {
      victimId: string;
      encryptionKey: string;
      ransomwareVariant: string;
      originalSize: number;
      encryptedSize: number;
    };
  } {
    // Usar informações do caso real
    const victimId = '3C579D75CF2341758A9B984A0B943F18';
    const encryptionKey = CryptoJS.MD5(victimId).toString();
    
    // Criar cabeçalho WantToCry
    const header = this.createWantToCryHeader(victimId, fileName, originalData.length);
    
    // Criptografar dados originais
    const encrypted = this.encryptWithAES(originalData, encryptionKey);
    
    // Combinar cabeçalho + dados criptografados
    const encryptedData = new Uint8Array(header.length + encrypted.length);
    encryptedData.set(header, 0);
    encryptedData.set(encrypted, header.length);
    
    return {
      encryptedData,
      metadata: {
        victimId,
        encryptionKey,
        ransomwareVariant: 'WantToCry',
        originalSize: originalData.length,
        encryptedSize: encryptedData.length
      }
    };
  }

  /**
   * Cria cabeçalho específico do WantToCry
   */
  private static createWantToCryHeader(victimId: string, fileName: string, fileSize: number): Uint8Array {
    const headerData = {
      signature: '--WantToCry--',
      version: '2.0',
      victimId: victimId,
      originalName: fileName,
      originalSize: fileSize,
      encryptionMethod: 'AES-128-CBC',
      timestamp: Date.now(),
      ransomNote: 'Seus arquivos foram criptografados! Para recuperá-los, entre em contato via Tox.',
      toxId: '1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6',
      ransomAmount: 600,
      reducedAmount: 200,
      testFileTypes: ['pdf', 'jpeg', 'mp3', 'mp4']
    };

    const headerString = JSON.stringify(headerData);
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(headerString);
    
    // Adicionar padding para alinhar com blocos de 16 bytes
    const paddingSize = 16 - (headerBytes.length % 16);
    const paddedHeader = new Uint8Array(headerBytes.length + paddingSize);
    paddedHeader.set(headerBytes, 0);
    
    // Preencher padding com zeros
    for (let i = headerBytes.length; i < paddedHeader.length; i++) {
      paddedHeader[i] = 0;
    }
    
    return paddedHeader;
  }

  /**
   * Criptografa dados usando AES
   */
  private static encryptWithAES(data: Uint8Array, key: string): Uint8Array {
    try {
      // Converter Uint8Array para WordArray
      const wordArray = CryptoJS.lib.WordArray.create(data);
      
      // Criptografar
      const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Converter resultado para Uint8Array
      const encryptedBytes = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
      const binaryString = atob(encryptedBytes);
      const result = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        result[i] = binaryString.charCodeAt(i);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Erro na criptografia: ${error}`);
    }
  }

  /**
   * Cria arquivo de teste PDF simulado
   */
  static createTestPDF(): Uint8Array {
    const pdfContent = `%PDF-1.4
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
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Arquivo de teste WantToCry) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

    return new TextEncoder().encode(pdfContent);
  }

  /**
   * Cria arquivo de teste JPEG simulado
   */
  static createTestJPEG(): Uint8Array {
    // Cabeçalho JPEG básico + dados simulados
    const jpegHeader = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
    ]);
    
    // Dados simulados (pequena imagem)
    const imageData = new Uint8Array(1000);
    for (let i = 0; i < imageData.length; i++) {
      imageData[i] = Math.floor(Math.random() * 256);
    }
    
    // Footer JPEG
    const jpegFooter = new Uint8Array([0xFF, 0xD9]);
    
    const result = new Uint8Array(jpegHeader.length + imageData.length + jpegFooter.length);
    result.set(jpegHeader, 0);
    result.set(imageData, jpegHeader.length);
    result.set(jpegFooter, jpegHeader.length + imageData.length);
    
    return result;
  }

  /**
   * Cria arquivo de teste MP3 simulado
   */
  static createTestMP3(): Uint8Array {
    // Cabeçalho MP3 ID3v2
    const mp3Header = new Uint8Array([
      0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    // Frame MP3 simulado
    const mp3Frame = new Uint8Array([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    // Dados de áudio simulados
    const audioData = new Uint8Array(2000);
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.floor(Math.random() * 256);
    }
    
    const result = new Uint8Array(mp3Header.length + mp3Frame.length + audioData.length);
    result.set(mp3Header, 0);
    result.set(mp3Frame, mp3Header.length);
    result.set(audioData, mp3Header.length + mp3Frame.length);
    
    return result;
  }

  /**
   * Cria conjunto completo de arquivos de teste
   */
  static createTestFileSet(): {
    files: Array<{
      name: string;
      originalData: Uint8Array;
      encryptedData: Uint8Array;
      metadata: any;
    }>;
  } {
    const files = [];
    
    // Arquivo PDF
    const pdfData = this.createTestPDF();
    const encryptedPDF = this.createEncryptedFile(pdfData, 'documento.pdf');
    files.push({
      name: 'documento.pdf.wncry',
      originalData: pdfData,
      encryptedData: encryptedPDF.encryptedData,
      metadata: encryptedPDF.metadata
    });
    
    // Arquivo JPEG
    const jpegData = this.createTestJPEG();
    const encryptedJPEG = this.createEncryptedFile(jpegData, 'foto.jpg');
    files.push({
      name: 'foto.jpg.wncry',
      originalData: jpegData,
      encryptedData: encryptedJPEG.encryptedData,
      metadata: encryptedJPEG.metadata
    });
    
    // Arquivo MP3
    const mp3Data = this.createTestMP3();
    const encryptedMP3 = this.createEncryptedFile(mp3Data, 'musica.mp3');
    files.push({
      name: 'musica.mp3.wncry',
      originalData: mp3Data,
      encryptedData: encryptedMP3.encryptedData,
      metadata: encryptedMP3.metadata
    });
    
    return { files };
  }
}