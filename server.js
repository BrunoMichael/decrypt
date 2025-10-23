const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const multer = require('multer');
const WantToCryDecryptor = require('./decryptor');

class WebServer {
    constructor(port = 3000) {
        this.port = port;
        this.decryptor = new WantToCryDecryptor();
        this.uploadsDir = path.join(__dirname, 'uploads');
        this.outputDir = path.join(__dirname, 'decrypted');
        
        // Criar diretórios se não existirem
        this.ensureDirectories();
        
        this.mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.zip': 'application/zip'
        };
    }

    ensureDirectories() {
        [this.uploadsDir, this.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    start() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log(`🚀 Servidor WantToCry Decryptor iniciado!`);
            console.log(`📱 Interface Web: http://localhost:${this.port}`);
            console.log(`🔓 Descriptografia: http://localhost:${this.port}/decrypt.html`);
            console.log(`🔧 Diretório: ${__dirname}`);
            console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Encerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor encerrado com sucesso!');
                process.exit(0);
            });
        });

        return server;
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        let pathname = parsedUrl.pathname;

        // Log da requisição
        console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

        try {
            if (req.method === 'POST' && pathname === '/decrypt') {
                await this.handleDecryptRequest(req, res);
            } else if (req.method === 'GET' && pathname.startsWith('/download/')) {
                await this.handleDownloadRequest(req, res, pathname);
            } else {
                await this.handleStaticRequest(req, res, pathname);
            }
        } catch (error) {
            console.error('Erro no servidor:', error);
            this.send500(res, error);
        }
    }

    async handleDecryptRequest(req, res) {
        const upload = multer({
            dest: this.uploadsDir,
            limits: { fileSize: 100 * 1024 * 1024 } // 100MB
        }).single('file');

        return new Promise((resolve, reject) => {
            upload(req, res, async (err) => {
                if (err) {
                    console.error('Erro no upload:', err);
                    this.sendJSON(res, 400, { success: false, error: 'Erro no upload: ' + err.message });
                    return resolve();
                }

                try {
                    const file = req.file;
                    const toxId = req.body.toxId || 'default';
                    const victimId = req.body.victimId || 'default';

                    if (!file) {
                        this.sendJSON(res, 400, { success: false, error: 'Nenhum arquivo enviado' });
                        return resolve();
                    }

                    console.log(`🔓 Iniciando descriptografia: ${file.originalname}`);
                    console.log(`🔑 Tox ID: ${toxId}, Victim ID: ${victimId}`);

                    // Configurar IDs no decryptor
                    this.decryptor.toxId = toxId;
                    this.decryptor.victimId = victimId;

                    // Descriptografar arquivo
                    const result = await this.decryptor.decryptFile(file.path);

                    if (result.success) {
                        // Mover arquivo descriptografado para diretório de saída
                        const outputFilename = `decrypted_${Date.now()}_${file.originalname.replace(/\.encrypted$/, '')}`;
                        const outputPath = path.join(this.outputDir, outputFilename);
                        
                        fs.writeFileSync(outputPath, result.data);

                        // Limpar arquivo temporário
                        fs.unlinkSync(file.path);

                        console.log(`✅ Descriptografia bem-sucedida: ${outputFilename}`);

                        this.sendJSON(res, 200, {
                            success: true,
                            filename: outputFilename,
                            method: result.method,
                            fileType: result.fileType,
                            corrected: result.corrected,
                            originalName: file.originalname
                        });
                    } else {
                        // Limpar arquivo temporário
                        fs.unlinkSync(file.path);

                        console.log(`❌ Falha na descriptografia: ${result.error}`);

                        this.sendJSON(res, 400, {
                            success: false,
                            error: result.error || 'Não foi possível descriptografar o arquivo'
                        });
                    }

                    resolve();
                } catch (error) {
                    console.error('Erro na descriptografia:', error);
                    
                    // Limpar arquivo temporário se existir
                    if (req.file && fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }

                    this.sendJSON(res, 500, {
                        success: false,
                        error: 'Erro interno na descriptografia: ' + error.message
                    });
                    resolve();
                }
            });
        });
    }

    async handleDownloadRequest(req, res, pathname) {
        const filename = pathname.replace('/download/', '');
        const filePath = path.join(this.outputDir, filename);

        if (!fs.existsSync(filePath)) {
            this.send404(res, pathname);
            return;
        }

        const stat = fs.statSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = this.mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': stat.size,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);

        console.log(`📥 Download iniciado: ${filename}`);
    }

    async handleStaticRequest(req, res, pathname) {
        // Redirecionar root para index.html
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(__dirname, pathname);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = this.mimeTypes[ext] || 'application/octet-stream';

        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            this.send404(res, pathname);
            return;
        }

        // Ler e servir o arquivo
        const data = fs.readFileSync(filePath);
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    }

    sendJSON(res, statusCode, data) {
        res.writeHead(statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(data));
    }

    send404(res, pathname) {
        const html404 = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Página Não Encontrada</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    color: white;
                }
                .error-container {
                    text-align: center;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .error-code {
                    font-size: 6rem;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .error-message {
                    font-size: 1.5rem;
                    margin-bottom: 30px;
                }
                .back-link {
                    display: inline-block;
                    padding: 12px 24px;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    transition: background 0.3s ease;
                }
                .back-link:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-code">404</div>
                <div class="error-message">Arquivo não encontrado: ${pathname}</div>
                <a href="/" class="back-link">← Voltar ao Início</a>
            </div>
        </body>
        </html>
        `;

        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html404);
    }

    send500(res, error) {
        const html500 = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>500 - Erro Interno do Servidor</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    color: white;
                }
                .error-container {
                    text-align: center;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .error-code {
                    font-size: 6rem;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #ff6b6b;
                }
                .error-message {
                    font-size: 1.5rem;
                    margin-bottom: 30px;
                }
                .back-link {
                    display: inline-block;
                    padding: 12px 24px;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    transition: background 0.3s ease;
                }
                .back-link:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-code">500</div>
                <div class="error-message">Erro interno do servidor</div>
                <a href="/" class="back-link">← Voltar ao Início</a>
            </div>
        </body>
        </html>
        `;

        console.error('Erro 500:', error);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html500);
    }
}

// Iniciar servidor se executado diretamente
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const server = new WebServer(port);
    server.start();
}

module.exports = WebServer;