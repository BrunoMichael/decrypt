/**
 * Biblioteca de Criptografia Moderna
 * Usa WebCrypto API com fallback para crypto-js
 * Muito mais eficaz e confiável para descriptografia
 */
class ModernCrypto {
    constructor() {
        this.isWebCryptoSupported = this.checkWebCryptoSupport();
        this.logCallback = null;
    }

    setLogCallback(callback) {
        this.logCallback = callback;
    }

    log(message, type = 'info') {
        if (this.logCallback) {
            this.logCallback(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    checkWebCryptoSupport() {
        return typeof window !== 'undefined' && 
               window.crypto && 
               window.crypto.subtle &&
               typeof window.crypto.subtle.decrypt === 'function';
    }

    /**
     * Converte hex string para ArrayBuffer
     */
    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    /**
     * Converte ArrayBuffer para hex string
     */
    arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Converte ArrayBuffer para Uint8Array
     */
    arrayBufferToBytes(buffer) {
        return new Uint8Array(buffer);
    }

    /**
     * Descriptografia AES usando WebCrypto API
     */
    async decryptWithWebCrypto(encryptedHex, keyHex, mode = 'AES-CBC') {
        try {
            this.log(`🔐 Tentando descriptografia WebCrypto ${mode}`, 'info');
            
            const keyBuffer = this.hexToArrayBuffer(keyHex);
            const encryptedBuffer = this.hexToArrayBuffer(encryptedHex);

            // Importar a chave
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: mode.split('-')[0] },
                false,
                ['decrypt']
            );

            let decryptedBuffer;
            
            if (mode === 'AES-CBC') {
                // Para CBC, os primeiros 16 bytes são o IV
                const iv = encryptedBuffer.slice(0, 16);
                const ciphertext = encryptedBuffer.slice(16);
                
                decryptedBuffer = await window.crypto.subtle.decrypt(
                    {
                        name: 'AES-CBC',
                        iv: iv
                    },
                    cryptoKey,
                    ciphertext
                );
            } else if (mode === 'AES-ECB') {
                // ECB não é suportado nativamente no WebCrypto
                // Usar fallback para crypto-js
                return this.decryptWithCryptoJS(encryptedHex, keyHex, 'ECB');
            } else if (mode === 'AES-CTR') {
                // Para CTR, os primeiros 16 bytes são o counter
                const counter = encryptedBuffer.slice(0, 16);
                const ciphertext = encryptedBuffer.slice(16);
                
                decryptedBuffer = await window.crypto.subtle.decrypt(
                    {
                        name: 'AES-CTR',
                        counter: counter,
                        length: 128
                    },
                    cryptoKey,
                    ciphertext
                );
            }

            const decryptedBytes = this.arrayBufferToBytes(decryptedBuffer);
            this.log(`✅ WebCrypto descriptografia ${mode} bem-sucedida`, 'success');
            return decryptedBytes;

        } catch (error) {
            this.log(`❌ Erro WebCrypto ${mode}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Fallback para crypto-js
     */
    decryptWithCryptoJS(encryptedHex, keyHex, mode = 'CBC') {
        try {
            this.log(`🔄 Fallback para crypto-js ${mode}`, 'warning');
            
            if (typeof CryptoJS === 'undefined') {
                throw new Error('CryptoJS não está disponível');
            }

            const key = CryptoJS.enc.Hex.parse(keyHex);
            let decrypted;

            if (mode === 'ECB') {
                decrypted = CryptoJS.AES.decrypt(
                    { ciphertext: CryptoJS.enc.Hex.parse(encryptedHex) },
                    key,
                    {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );
            } else if (mode === 'CBC') {
                const iv = CryptoJS.enc.Hex.parse(encryptedHex.substring(0, 32));
                const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex.substring(32));
                
                decrypted = CryptoJS.AES.decrypt(
                    { ciphertext: ciphertext },
                    key,
                    {
                        iv: iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );
            } else if (mode === 'CTR') {
                const iv = CryptoJS.enc.Hex.parse(encryptedHex.substring(0, 32));
                const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex.substring(32));
                
                decrypted = CryptoJS.AES.decrypt(
                    { ciphertext: ciphertext },
                    key,
                    {
                        iv: iv,
                        mode: CryptoJS.mode.CTR,
                        padding: CryptoJS.pad.NoPadding
                    }
                );
            }

            const decryptedHex = decrypted.toString(CryptoJS.enc.Hex);
            if (!decryptedHex) {
                throw new Error('Descriptografia resultou em dados vazios');
            }

            // Converter hex para bytes
            const bytes = new Uint8Array(decryptedHex.length / 2);
            for (let i = 0; i < decryptedHex.length; i += 2) {
                bytes[i / 2] = parseInt(decryptedHex.substr(i, 2), 16);
            }

            this.log(`✅ CryptoJS descriptografia ${mode} bem-sucedida`, 'success');
            return bytes;

        } catch (error) {
            this.log(`❌ Erro CryptoJS ${mode}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Método principal de descriptografia
     * Tenta WebCrypto primeiro, depois fallback para crypto-js
     */
    async decrypt(encryptedHex, keyHex, mode = 'AES-CBC') {
        this.log(`🚀 Iniciando descriptografia moderna - Modo: ${mode}`, 'info');
        this.log(`📊 Dados: ${encryptedHex.length} chars, Chave: ${keyHex.length} chars`, 'info');

        // Validação básica
        if (!encryptedHex || !keyHex) {
            throw new Error('Dados criptografados ou chave não fornecidos');
        }

        if (keyHex.length !== 64) { // 32 bytes = 64 hex chars
            throw new Error(`Chave deve ter 64 caracteres hex (32 bytes), recebido: ${keyHex.length}`);
        }

        try {
            // Tentar WebCrypto primeiro (mais rápido e seguro)
            if (this.isWebCryptoSupported && mode !== 'AES-ECB') {
                return await this.decryptWithWebCrypto(encryptedHex, keyHex, mode);
            } else {
                // Fallback para crypto-js
                const cryptoJSMode = mode.replace('AES-', '');
                return this.decryptWithCryptoJS(encryptedHex, keyHex, cryptoJSMode);
            }
        } catch (error) {
            this.log(`💥 Falha na descriptografia ${mode}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Tenta múltiplos modos de descriptografia
     */
    async tryAllModes(encryptedHex, keyHex) {
        const modes = ['AES-CBC', 'AES-ECB', 'AES-CTR'];
        
        for (const mode of modes) {
            try {
                this.log(`🔄 Tentando modo ${mode}...`, 'info');
                const result = await this.decrypt(encryptedHex, keyHex, mode);
                
                // Verificar se o resultado parece válido
                if (result && result.length > 0) {
                    this.log(`✅ Sucesso com modo ${mode}!`, 'success');
                    return { data: result, mode: mode };
                }
            } catch (error) {
                this.log(`❌ Modo ${mode} falhou: ${error.message}`, 'warning');
                continue;
            }
        }
        
        throw new Error('Nenhum modo de descriptografia funcionou');
    }

    /**
     * Verifica se os dados descriptografados são válidos
     */
    validateDecryptedData(data) {
        if (!data || data.length === 0) {
            return false;
        }

        // Verificar se não são apenas zeros ou dados aleatórios
        const zeros = data.filter(byte => byte === 0).length;
        const zerosPercentage = (zeros / data.length) * 100;
        
        if (zerosPercentage > 90) {
            this.log('⚠️ Dados descriptografados contêm muitos zeros', 'warning');
            return false;
        }

        // Verificar assinatura de arquivo comum
        const signature = Array.from(data.slice(0, 8))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('').toUpperCase();

        const knownSignatures = [
            '25504446', // PDF
            '504B0304', // ZIP/Office
            '89504E47', // PNG
            'FFD8FFE0', // JPEG
            '474946383', // GIF
        ];

        const hasValidSignature = knownSignatures.some(sig => 
            signature.startsWith(sig)
        );

        if (hasValidSignature) {
            this.log(`✅ Assinatura de arquivo válida detectada: ${signature}`, 'success');
        }

        return true;
    }
}

// Exportar para uso global
window.ModernCrypto = ModernCrypto;