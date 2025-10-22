#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Função para incrementar versão
function bumpVersion(type = 'patch') {
    const packagePath = path.join(__dirname, 'package.json');
    const indexPath = path.join(__dirname, 'index.html');
    
    // Ler package.json
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Calcular nova versão
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    let newVersion;
    
    switch (type) {
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'patch':
        default:
            newVersion = `${major}.${minor}.${patch + 1}`;
            break;
    }
    
    // Atualizar package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    
    // Atualizar index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    indexContent = indexContent.replace(
        /WantToCry Decryptor v[\d.]+/g,
        `WantToCry Decryptor v${newVersion}`
    );
    fs.writeFileSync(indexPath, indexContent);
    
    console.log(`✅ Versão atualizada: ${currentVersion} → ${newVersion}`);
    return newVersion;
}

// Executar se chamado diretamente
if (require.main === module) {
    const type = process.argv[2] || 'patch';
    bumpVersion(type);
}

module.exports = { bumpVersion };