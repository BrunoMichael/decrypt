#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para incrementar versão
function bumpVersion(type = 'patch', autoPush = false) {
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
    
    // Se autoPush estiver habilitado, fazer commit e push
    if (autoPush) {
        try {
            console.log('🔄 Fazendo commit e push automático...');
            
            // Adicionar todos os arquivos modificados
            execSync('git add .', { stdio: 'inherit' });
            
            // Fazer commit com mensagem de versão
            execSync(`git commit -m "v${newVersion}: Atualização automática de versão"`, { stdio: 'inherit' });
            
            // Push para GitHub
            execSync('git push origin main', { stdio: 'inherit' });
            
            console.log('✅ Push para GitHub realizado com sucesso!');
        } catch (error) {
            console.error('❌ Erro durante commit/push:', error.message);
            console.log('⚠️ Versão foi atualizada, mas não foi enviada para GitHub');
        }
    }
    
    return newVersion;
}

// Executar se chamado diretamente
if (require.main === module) {
    const type = process.argv[2] || 'patch';
    const autoPush = process.argv.includes('--push') || process.argv.includes('-p');
    bumpVersion(type, autoPush);
}

module.exports = { bumpVersion };