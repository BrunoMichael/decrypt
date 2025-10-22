const express = require('express');
const path = require('path');
const app = express();

// Configurar porta (Square Cloud usa a variável de ambiente PORT)
const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal - servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para servir arquivos específicos
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/crypto-js.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'crypto-js.min.js'));
});

// Middleware para logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 WantToCry Decryptor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});