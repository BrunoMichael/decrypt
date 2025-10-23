const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileHandlers {
    constructor() {
        // Assinaturas de arquivo para validação
        this.fileSignatures = {
            // Documentos PDF
            'pdf': {
                signature: [0x25, 0x50, 0x44, 0x46], // %PDF
                description: 'Adobe PDF Document',
                validator: this.validatePDF.bind(this)
            },
            
            // Arquivos ZIP (inclui Office 2007+)
            'zip': {
                signature: [0x50, 0x4B, 0x03, 0x04], // PK..
                description: 'ZIP Archive',
                validator: this.validateZIP.bind(this)
            },
            
            // Microsoft Office (formato antigo)
            'ole': {
                signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
                description: 'Microsoft Office Document (Legacy)',
                validator: this.validateOLE.bind(this)
            },
            
            // Imagens
            'jpeg': {
                signature: [0xFF, 0xD8, 0xFF],
                description: 'JPEG Image',
                validator: this.validateJPEG.bind(this)
            },
            
            'png': {
                signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
                description: 'PNG Image',
                validator: this.validatePNG.bind(this)
            },
            
            'gif': {
                signature: [0x47, 0x49, 0x46, 0x38],
                description: 'GIF Image',
                validator: this.validateGIF.bind(this)
            },
            
            // Texto
            'txt': {
                signature: null, // Texto não tem assinatura específica
                description: 'Text File',
                validator: this.validateText.bind(this)
            }
        };
        
        // Mapeamento de extensões para tipos
        this.extensionMap = {
            '.pdf': 'pdf',
            '.doc': 'ole',
            '.xls': 'ole',
            '.ppt': 'ole',
            '.docx': 'zip',
            '.xlsx': 'zip',
            '.pptx': 'zip',
            '.zip': 'zip',
            '.rar': 'rar',
            '.jpg': 'jpeg',
            '.jpeg': 'jpeg',
            '.png': 'png',
            '.gif': 'gif',
            '.txt': 'txt',
            '.rtf': 'txt'
        };
    }

    /**
     * Detecta o tipo de arquivo baseado na extensão e conteúdo
     */
    detectFileType(filename, data) {
        const ext = path.extname(filename).toLowerCase();
        const expectedType = this.extensionMap[ext];
        
        if (!expectedType) {
            return this.detectBySignature(data);
        }
        
        // Verificar se a assinatura corresponde ao tipo esperado
        const typeInfo = this.fileSignatures[expectedType];
        if (typeInfo && typeInfo.signature) {
            const matches = this.checkSignature(data, typeInfo.signature);
            if (matches) {
                return { type: expectedType, confidence: 'high', ...typeInfo };
            }
        }
        
        // Se não corresponder, tentar detectar por assinatura
        const detected = this.detectBySignature(data);
        return detected || { type: expectedType, confidence: 'low', ...typeInfo };
    }

    /**
     * Detecta tipo de arquivo apenas pela assinatura
     */
    detectBySignature(data) {
        for (const [type, info] of Object.entries(this.fileSignatures)) {
            if (info.signature && this.checkSignature(data, info.signature)) {
                return { type, confidence: 'high', ...info };
            }
        }
        
        return null;
    }

    /**
     * Verifica se os dados começam com a assinatura esperada
     */
    checkSignature(data, signature) {
        if (!data || data.length < signature.length) return false;
        
        return signature.every((byte, index) => data[index] === byte);
    }

    /**
     * Valida e corrige arquivo PDF
     */
    validatePDF(data) {
        // Verificar assinatura PDF
        if (!this.checkSignature(data, [0x25, 0x50, 0x44, 0x46])) {
            // Tentar encontrar %PDF em outras posições
            const pdfPattern = Buffer.from('%PDF');
            const index = data.indexOf(pdfPattern);
            
            if (index > 0 && index < 1024) {
                // PDF encontrado em offset, extrair a partir dali
                return {
                    valid: true,
                    corrected: true,
                    data: data.slice(index),
                    message: `PDF header encontrado no offset ${index}`
                };
            }
            
            return {
                valid: false,
                message: 'Assinatura PDF não encontrada'
            };
        }
        
        // Verificar estrutura básica do PDF
        const content = data.toString('latin1', 0, Math.min(1024, data.length));
        
        if (!content.includes('PDF-')) {
            return {
                valid: false,
                message: 'Estrutura PDF inválida'
            };
        }
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: 'PDF válido'
        };
    }

    /**
     * Valida arquivo ZIP (inclui Office 2007+)
     */
    validateZIP(data) {
        if (!this.checkSignature(data, [0x50, 0x4B, 0x03, 0x04])) {
            return {
                valid: false,
                message: 'Assinatura ZIP não encontrada'
            };
        }
        
        // Verificar se é um arquivo Office baseado em ZIP
        const isOffice = this.detectOfficeType(data);
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: isOffice ? `Arquivo Office (${isOffice})` : 'Arquivo ZIP válido',
            subtype: isOffice
        };
    }

    /**
     * Detecta tipo específico de arquivo Office
     */
    detectOfficeType(data) {
        // Procurar por strings características no ZIP
        const content = data.toString('latin1', 0, Math.min(2048, data.length));
        
        if (content.includes('word/')) return 'Word Document (.docx)';
        if (content.includes('xl/')) return 'Excel Spreadsheet (.xlsx)';
        if (content.includes('ppt/')) return 'PowerPoint Presentation (.pptx)';
        
        return null;
    }

    /**
     * Valida arquivo OLE (Office antigo)
     */
    validateOLE(data) {
        const oleSignature = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
        
        if (!this.checkSignature(data, oleSignature)) {
            return {
                valid: false,
                message: 'Assinatura OLE não encontrada'
            };
        }
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: 'Arquivo Office (formato antigo) válido'
        };
    }

    /**
     * Valida imagem JPEG
     */
    validateJPEG(data) {
        if (!this.checkSignature(data, [0xFF, 0xD8, 0xFF])) {
            return {
                valid: false,
                message: 'Assinatura JPEG não encontrada'
            };
        }
        
        // Verificar se termina com marcador de fim JPEG
        const end = data.slice(-2);
        if (end[0] !== 0xFF || end[1] !== 0xD9) {
            return {
                valid: false,
                message: 'Arquivo JPEG incompleto ou corrompido'
            };
        }
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: 'Imagem JPEG válida'
        };
    }

    /**
     * Valida imagem PNG
     */
    validatePNG(data) {
        const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        
        if (!this.checkSignature(data, pngSignature)) {
            return {
                valid: false,
                message: 'Assinatura PNG não encontrada'
            };
        }
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: 'Imagem PNG válida'
        };
    }

    /**
     * Valida imagem GIF
     */
    validateGIF(data) {
        if (!this.checkSignature(data, [0x47, 0x49, 0x46, 0x38])) {
            return {
                valid: false,
                message: 'Assinatura GIF não encontrada'
            };
        }
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: 'Imagem GIF válida'
        };
    }

    /**
     * Valida arquivo de texto
     */
    validateText(data) {
        // Verificar se contém principalmente caracteres imprimíveis
        let printableCount = 0;
        const sampleSize = Math.min(1024, data.length);
        
        for (let i = 0; i < sampleSize; i++) {
            const byte = data[i];
            // Caracteres imprimíveis ASCII + quebras de linha
            if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
                printableCount++;
            }
        }
        
        const printableRatio = printableCount / sampleSize;
        
        if (printableRatio < 0.7) {
            return {
                valid: false,
                message: `Muitos caracteres não-imprimíveis (${(printableRatio * 100).toFixed(1)}% imprimíveis)`
            };
        }
        
        return {
            valid: true,
            corrected: false,
            data: data,
            message: `Arquivo de texto válido (${(printableRatio * 100).toFixed(1)}% imprimíveis)`
        };
    }

    /**
     * Processa e valida um arquivo descriptografado
     */
    processDecryptedFile(filename, data) {
        const detection = this.detectFileType(filename, data);
        
        if (!detection) {
            return {
                success: false,
                message: 'Tipo de arquivo não reconhecido',
                data: data
            };
        }
        
        // Executar validação específica do tipo
        const validation = detection.validator(data);
        
        return {
            success: validation.valid,
            message: validation.message,
            data: validation.corrected ? validation.data : data,
            fileType: detection.type,
            description: detection.description,
            confidence: detection.confidence,
            subtype: validation.subtype || detection.subtype,
            corrected: validation.corrected || false
        };
    }

    /**
     * Gera nome de arquivo apropriado baseado no tipo detectado
     */
    generateFilename(originalName, detectedType, subtype) {
        let baseName = path.parse(originalName).name;
        
        // Remover extensão .want_to_cry se presente
        if (baseName.endsWith('.want_to_cry')) {
            baseName = baseName.slice(0, -12);
        }
        
        // Determinar extensão apropriada
        let extension = path.extname(originalName);
        
        if (!extension || extension === '.want_to_cry') {
            // Sugerir extensão baseada no tipo detectado
            const extensionMap = {
                'pdf': '.pdf',
                'zip': '.zip',
                'ole': '.doc', // Padrão para OLE
                'jpeg': '.jpg',
                'png': '.png',
                'gif': '.gif',
                'txt': '.txt'
            };
            
            extension = extensionMap[detectedType] || '.bin';
            
            // Ajustar para subtipos Office
            if (subtype) {
                if (subtype.includes('Word')) extension = '.docx';
                else if (subtype.includes('Excel')) extension = '.xlsx';
                else if (subtype.includes('PowerPoint')) extension = '.pptx';
            }
        }
        
        return `recovered_${baseName}${extension}`;
    }
}

module.exports = FileHandlers;