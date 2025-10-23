# WannaCry Recovery Tool

Ferramenta moderna para análise e recuperação de arquivos afetados pelo ransomware WannaCry.

## 🚀 Deploy no SquareCloud

### Configuração Atual

O projeto está configurado para deploy automático no SquareCloud com as seguintes configurações:

- **MAIN**: `package.json`
- **MEMORY**: 1500MB
- **VERSION**: recommended
- **SUBDOMAIN**: wanttocry-decryptor
- **START**: `npm run web`

### Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run web` - Build + serve para produção (usado no deploy)
- `npm test` - Executa testes

### Arquivos de Deploy

- `squarecloud.config` - Configuração do SquareCloud
- `.squareignore` - Arquivos ignorados no deploy
- `package.json` - Dependências e scripts

### Como Fazer Deploy

1. Certifique-se de que todos os arquivos estão commitados
2. Faça upload do projeto para o SquareCloud
3. O deploy será feito automaticamente usando `npm run web`

### URL de Acesso

Após o deploy, a aplicação estará disponível em:
`https://wanttocry-decryptor.squareweb.app`

## ⚠️ Aviso Importante

Esta ferramenta é para fins educacionais e de análise. NÃO pague resgate aos criminosos. Procure sempre ajuda profissional especializada em casos reais de ransomware.

## 🛠️ Tecnologias

- React 18 + TypeScript
- Tailwind CSS
- Lucide React (ícones)
- React Dropzone
- Crypto-JS

## 📋 Funcionalidades

- Upload de arquivos criptografados
- Análise de arquivos WannaCry
- Ferramentas de recuperação
- Orientações de segurança
- Interface moderna e responsiva