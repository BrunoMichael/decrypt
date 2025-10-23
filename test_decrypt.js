const fs = require('fs');
const path = require('path');

// Simular dados descriptografados que começam com %PDF
const simulatedDecryptedData = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n181\n%%EOF');

console.log('Dados simulados:', simulatedDecryptedData.length, 'bytes');
console.log('Primeiros 20 bytes:', simulatedDecryptedData.slice(0, 20).toString());

// Função isPDF
function isPDF(data) {
    if (!data || data.length < 4) return false;
    return data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46;
}

console.log('É PDF?', isPDF(simulatedDecryptedData));

// Simular resultado de sucesso
const successfulResult = {
    method: 'XOR com cabeçalho PDF',
    keyUsed: '90eaf739',
    success: true,
    data: simulatedDecryptedData.toString('base64')
};

console.log('Resultado simulado:', {
    method: successfulResult.method,
    success: successfulResult.success,
    dataLength: successfulResult.data.length
});

// Tentar salvar
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const decryptedData = Buffer.from(successfulResult.data, 'base64');
const decryptedPath = path.join(tempDir, 'decrypted_file.pdf');

try {
    fs.writeFileSync(decryptedPath, decryptedData);
    console.log('✅ Arquivo salvo com sucesso:', decryptedPath);
    console.log('📊 Tamanho do arquivo salvo:', fs.statSync(decryptedPath).size, 'bytes');
} catch (error) {
    console.error('❌ Erro ao salvar:', error.message);
}