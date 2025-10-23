# 🔓 Analisador de Criptografia WantToCry

Ferramenta web para análise de arquivos criptografados pelo ransomware WantToCry.

## 🚀 Deploy no SquareCloud

### Configurações Necessárias

O projeto está configurado para funcionar no SquareCloud com as seguintes especificações:

- **Porta**: 80 (configurada automaticamente via `process.env.PORT`)
- **Host**: 0.0.0.0 (requisito do SquareCloud)
- **Memória**: 1500MB
- **Comando de inicialização**: `npm start`

### Arquivos de Configuração

- `squarecloud.config`: Configurações do SquareCloud
- `.squareignore`: Arquivos ignorados no deploy
- `package.json`: Dependências e scripts

### URL de Acesso

🌐 **https://wanttocry-analyzer.squareweb.app/**

## 📋 Funcionalidades

### Análises Implementadas
- **Entropia de Shannon**: Mede a aleatoriedade dos dados
- **Análise de Padrões**: Compara arquivos originais vs criptografados
- **Análise XOR**: Detecta padrões de criptografia simples
- **Análise de Blocos**: Identifica possíveis algoritmos (AES, ChaCha20, etc.)
- **Detecção de Chaves**: Procura por possíveis chaves de 16, 24 e 32 bytes

### Interface
- Upload via drag & drop
- Visualizador hexadecimal
- Resultados em tempo real
- Design responsivo

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar servidor
npm start

# Acesso local
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
├── index.html          # Interface principal
├── script.js           # JavaScript frontend
├── style.css           # Estilos CSS
├── server.js           # Servidor Node.js
├── package.json        # Dependências
├── squarecloud.config  # Config SquareCloud
├── .squareignore       # Arquivos ignorados no deploy
└── .gitignore          # Arquivos ignorados no Git
```

## ⚠️ Aviso Legal

Esta ferramenta é destinada apenas para fins educacionais e de análise. Não garantimos a recuperação de arquivos criptografados pelo ransomware WantToCry.

## 🔒 Informações sobre WantToCry

- **ID Único**: 3C579D75CF2341758A9B984A0B943F18
- **Valor do Resgate**: $600 USD em Bitcoin
- **Extensão**: .want_to_cry

## 📞 Suporte

Para problemas técnicos, consulte a documentação do SquareCloud ou entre em contato através do Discord oficial.