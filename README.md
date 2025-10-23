# WantToCry Decryptor

Descriptografador para arquivos infectados pelo ransomware **WantToCry** que utiliza criptografia **AES-256-CBC**.

## 🚀 Características

- ✅ Descriptografia de arquivos AES-256-CBC
- 🔑 Múltiplos métodos de derivação de chave
- 📁 Suporte para tipos de arquivo: PDF, Word, Excel, ZIP, imagens
- 🔧 Correção automática de headers de arquivo
- 📊 Validação inteligente de dados descriptografados
- 🎯 Interface de linha de comando intuitiva
- 📈 Estatísticas detalhadas de processamento

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Tornar executável (opcional)
chmod +x decryptor.js
```

## 🔧 Uso

### Descriptografar arquivo único

```bash
# Usando valores padrão do atacante
node decryptor.js decrypt -f arquivo_criptografado.pdf

# Especificando IDs customizados
node decryptor.js decrypt -f arquivo.docx -t "SEU_TOX_ID" -v "SEU_VICTIM_ID"

# Com diretório de saída específico
node decryptor.js decrypt -f documento.xlsx -o ./recuperados/
```

### Descriptografar diretório

```bash
# Diretório simples
node decryptor.js decrypt -d ./arquivos_infectados/

# Busca recursiva em subdiretórios
node decryptor.js decrypt -d ./documentos/ -r

# Com diretório de saída
node decryptor.js decrypt -d ./infectados/ -o ./limpos/ -r
```

### Analisar arquivo

```bash
# Verificar informações de um arquivo
node decryptor.js info arquivo_suspeito.pdf
```

## 🔑 Parâmetros

### Comando `decrypt`

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `-f, --file` | Arquivo único para descriptografar | `-f documento.pdf` |
| `-d, --directory` | Diretório com arquivos infectados | `-d ./infectados/` |
| `-o, --output` | Diretório de saída (opcional) | `-o ./recuperados/` |
| `-t, --tox-id` | Tox ID do atacante | `-t "1D9E589C..."` |
| `-v, --victim-id` | ID da vítima | `-v "3C579D75..."` |
| `-r, --recursive` | Buscar em subdiretórios | `-r` |

### Valores Padrão

- **Tox ID**: `1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6`
- **Victim ID**: `3C579D75CF2341758A9B984A0B943F18`

## 🎯 Tipos de Arquivo Suportados

### Documentos
- **PDF** - Adobe PDF Documents
- **DOC/DOCX** - Microsoft Word
- **XLS/XLSX** - Microsoft Excel  
- **PPT/PPTX** - Microsoft PowerPoint

### Arquivos Compactados
- **ZIP** - Arquivos ZIP padrão
- **Office 2007+** - Formatos baseados em ZIP

### Imagens
- **JPEG/JPG** - Imagens JPEG
- **PNG** - Imagens PNG
- **GIF** - Imagens GIF

### Outros
- **TXT** - Arquivos de texto
- **RTF** - Rich Text Format

## 🔍 Métodos de Descriptografia

O descriptografador tenta múltiplos métodos de derivação de chave:

1. **SHA256** - Hash direto dos IDs
2. **PBKDF2** - Derivação com salt
3. **MD5** - Hash MD5 (compatibilidade)
4. **XOR** - Operação XOR entre IDs
5. **Combinações** - Diferentes ordens e concatenações

## 📊 Validação de Arquivos

### Verificações Automáticas
- ✅ Assinaturas de arquivo (magic numbers)
- ✅ Análise de entropia
- ✅ Estrutura específica por tipo
- ✅ Correção automática de headers

### Correções Aplicadas
- 🔧 Remoção de padding incorreto
- 🔧 Reconstrução de headers PDF
- 🔧 Validação de estruturas ZIP/Office
- 🔧 Verificação de integridade de imagens

## 📈 Exemplo de Saída

```
🔓 WantToCry Decryptor v1.0.0

🔓 Descriptografando: documento.pdf
  📊 Tamanho do arquivo: 245760 bytes
  🔑 Testando chaves [████████████████████████████████] 100% SHA256+PBKDF2
  
  ✅ Sucesso com método: SHA256+PBKDF2
  ✅ Arquivo PDF válido detectado
  🔧 Arquivo foi corrigido automaticamente
  💾 Salvo como: recovered_documento.pdf
  📈 Método usado: SHA256+PBKDF2

🎉 Descriptografia concluída com sucesso!

📊 ESTATÍSTICAS FINAIS:
  📁 Arquivos processados: 1
  ✅ Sucessos: 1
  ❌ Falhas: 0
  🔧 Arquivos corrigidos: 1
  📈 Taxa de sucesso: 100.0%
```

## 🛠️ Estrutura do Projeto

```
decrpt/
├── decryptor.js        # Classe principal do descriptografador
├── file-handlers.js    # Handlers específicos por tipo de arquivo
├── package.json        # Configuração do projeto
└── README.md          # Esta documentação
```

## 🔒 Segurança

- ⚠️ **Use apenas em arquivos próprios ou com autorização**
- 🔐 Os IDs fornecidos são específicos para esta infecção
- 🛡️ O software não armazena chaves ou dados sensíveis
- 📝 Logs detalhados para auditoria

## 🐛 Solução de Problemas

### Erro: "Nenhum método de descriptografia funcionou"
- Verifique se os IDs estão corretos
- Confirme que o arquivo está realmente criptografado
- Tente com diferentes combinações de IDs

### Erro: "Alta entropia detectada"
- O arquivo pode ainda estar criptografado
- Verifique se não há corrupção no arquivo original

### Arquivos corrompidos após descriptografia
- Alguns arquivos podem ter headers danificados
- O sistema tenta correção automática
- Verifique os logs para detalhes da correção

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs detalhados
2. Use o comando `info` para analisar arquivos
3. Confirme que os IDs estão corretos

## ⚖️ Aviso Legal

Este software é fornecido apenas para fins educacionais e de recuperação de dados próprios. O uso inadequado pode violar leis locais. Use por sua própria conta e risco.