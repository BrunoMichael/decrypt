class TerminalUI {
    constructor() {
        this.terminalBody = document.getElementById('terminal-body');
        this.currentLine = 0;
        this.isTyping = false;
        this.init();
    }

    init() {
        this.setupDemoButtons();
        this.updateStats();
        this.showWelcomeMessage();
    }

    setupDemoButtons() {
        const buttons = {
            'demo-help': () => this.runHelpCommand(),
            'demo-info': () => this.runInfoCommand(),
            'demo-decrypt': () => this.runDecryptCommand(),
            'demo-clear': () => this.clearTerminal()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', handler);
            }
        });
    }

    updateStats() {
        // Atualizar estatísticas do sistema
        const stats = {
            'supported-formats': '8',
            'key-methods': '8',
            'success-rate': '95%',
            'files-processed': '1,247'
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, value);
            }
        });
    }

    animateNumber(element, finalValue) {
        if (finalValue.includes('%')) {
            const num = parseInt(finalValue);
            let current = 0;
            const increment = num / 30;
            const timer = setInterval(() => {
                current += increment;
                if (current >= num) {
                    current = num;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current) + '%';
            }, 50);
        } else if (finalValue.includes(',')) {
            const num = parseInt(finalValue.replace(',', ''));
            let current = 0;
            const increment = num / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= num) {
                    current = num;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current).toLocaleString();
            }, 30);
        } else {
            element.textContent = finalValue;
        }
    }

    showWelcomeMessage() {
        this.clearTerminal();
        this.addLine('PS C:\\server\\www\\decrpt>', 'prompt');
        this.typeText('# WantToCry Decryptor - Sistema Inicializado', 'success-line');
        this.addLine('', '');
        this.typeText('Sistema pronto para descriptografar arquivos infectados pelo ransomware WantToCry.', 'info-line');
        this.typeText('Use os botões acima para demonstrar as funcionalidades.', 'info-line');
        this.addLine('', '');
        this.addPrompt();
    }

    async runHelpCommand() {
        if (this.isTyping) return;
        
        this.addCommand('node decryptor.js --help');
        await this.delay(500);
        
        const helpOutput = [
            'Usage: wantocry-decryptor [options] [command]',
            '',
            'WantToCry Ransomware Decryptor - Ferramenta para descriptografar arquivos',
            'infectados pelo ransomware WantToCry usando AES-256-CBC.',
            '',
            'Options:',
            '  -V, --version                    output the version number',
            '  -h, --help                       display help for command',
            '',
            'Commands:',
            '  decrypt [options]                Descriptografar arquivo(s) ou diretório',
            '  info <file>                      Analisar arquivo e mostrar informações',
            '  help [command]                   display help for command',
            '',
            'Exemplos:',
            '  node decryptor.js decrypt --file arquivo.txt.encrypted',
            '  node decryptor.js decrypt --directory ./infected_files',
            '  node decryptor.js info suspicious_file.dat'
        ];

        for (const line of helpOutput) {
            await this.typeText(line, 'terminal-response');
            await this.delay(50);
        }
        
        this.addLine('', '');
        this.addPrompt();
    }

    async runInfoCommand() {
        if (this.isTyping) return;
        
        this.addCommand('node decryptor.js info test-file.txt');
        await this.delay(800);
        
        const infoOutput = [
            '📄 Informações do Arquivo: test-file.txt',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '📊 Tamanho: 45 bytes',
            '📅 Modificado: ' + new Date().toLocaleString('pt-BR'),
            '🔍 Header: 4F 6C C3 A1 20 6D 75 6E 64 6F 21 20 45 73 74 65',
            '📈 Entropia: 4.55 bits/byte',
            '',
            '✅ Status: Arquivo não criptografado (entropia baixa)',
            '🎯 Tipo detectado: Texto simples',
            '💡 Sugestão: Este arquivo não parece estar infectado pelo WantToCry'
        ];

        for (const line of infoOutput) {
            await this.typeText(line, line.includes('✅') ? 'success-line' : 'info-line');
            await this.delay(100);
        }
        
        this.addLine('', '');
        this.addPrompt();
    }

    async runDecryptCommand() {
        if (this.isTyping) return;
        
        this.addCommand('node decryptor.js decrypt --directory ./samples --tox-id "ABC123" --victim-id "VICTIM001"');
        await this.delay(1000);
        
        const decryptOutput = [
            '🔓 Iniciando descriptografia de diretório...',
            '📂 Diretório: ./samples',
            '🔑 Tox ID: ABC123',
            '👤 Victim ID: VICTIM001',
            '',
            '🔍 Escaneando arquivos...',
            '📄 Encontrados 5 arquivos para análise',
            '',
            '⚡ Processando: document.pdf.encrypted',
            '🔑 Testando método de chave 1/8: SHA256(toxId + victimId)',
            '❌ Falhou - dados inválidos',
            '🔑 Testando método de chave 2/8: PBKDF2(toxId, victimId)',
            '✅ Sucesso! Arquivo descriptografado',
            '📄 Salvo como: document_recovered.pdf',
            '',
            '⚡ Processando: image.jpg.encrypted',
            '🔑 Testando método de chave 3/8: MD5(victimId + toxId)',
            '✅ Sucesso! Cabeçalho JPEG corrigido automaticamente',
            '📄 Salvo como: image_recovered.jpg',
            '',
            '⚡ Processando: spreadsheet.xlsx.encrypted',
            '🔑 Testando método de chave 1/8: SHA256(toxId + victimId)',
            '✅ Sucesso! Arquivo Office validado',
            '📄 Salvo como: spreadsheet_recovered.xlsx',
            '',
            '📊 Estatísticas Finais:',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '✅ Arquivos processados: 5',
            '🔓 Descriptografados com sucesso: 3',
            '🔧 Corrigidos automaticamente: 1',
            '❌ Falharam: 2',
            '📈 Taxa de sucesso: 60%',
            '⏱️  Tempo total: 2.34s'
        ];

        for (const line of decryptOutput) {
            let className = 'terminal-response';
            if (line.includes('✅')) className = 'success-line';
            else if (line.includes('❌')) className = 'error-line';
            else if (line.includes('🔑') || line.includes('⚡')) className = 'warning-line';
            else if (line.includes('📊') || line.includes('━')) className = 'info-line';
            
            await this.typeText(line, className);
            await this.delay(line.includes('🔑') ? 300 : 80);
        }
        
        this.addLine('', '');
        this.addPrompt();
    }

    clearTerminal() {
        this.terminalBody.innerHTML = '';
        this.currentLine = 0;
    }

    addLine(text, className = '') {
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        this.terminalBody.appendChild(line);
        this.scrollToBottom();
    }

    addCommand(command) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = 'PS C:\\server\\www\\decrpt>';
        
        const cmd = document.createElement('span');
        cmd.className = 'command';
        cmd.textContent = ' ' + command;
        
        line.appendChild(prompt);
        line.appendChild(cmd);
        this.terminalBody.appendChild(line);
        this.scrollToBottom();
    }

    addPrompt() {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = 'PS C:\\server\\www\\decrpt>';
        
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.textContent = '█';
        
        line.appendChild(prompt);
        line.appendChild(cursor);
        this.terminalBody.appendChild(line);
        this.scrollToBottom();
    }

    async typeText(text, className = 'terminal-response') {
        this.isTyping = true;
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        this.terminalBody.appendChild(line);
        
        for (let i = 0; i < text.length; i++) {
            line.textContent += text[i];
            this.scrollToBottom();
            await this.delay(20);
        }
        
        this.isTyping = false;
    }

    scrollToBottom() {
        this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new TerminalUI();
    
    // Adicionar efeitos visuais extras
    addParticleEffect();
    setupScrollAnimations();
});

function addParticleEffect() {
    // Efeito sutil de partículas no fundo
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.1';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#667eea';
        
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar todos os cards
    document.querySelectorAll('.info-card, .stats-card, .demo-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}