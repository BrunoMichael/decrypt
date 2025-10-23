# 🚀 Instruções de Deploy - SquareCloud

## 📋 Configurações Atualizadas

### 🔧 Memória Configurada
- **Memória SquareCloud**: 1500MB (1.5GB)
- **Limite Node.js**: 1400MB (margem de segurança)
- **Garbage Collection**: Habilitado
- **Threshold de limpeza**: 1200MB

### 📁 Arquivos Modificados
1. `squarecloud.config` - Memória ajustada para 1500MB
2. `package.json` - Scripts otimizados com 1400MB
3. `server.js` - Monitoramento e limpeza automática

### 🔄 Para Fazer Deploy

1. **Commit das alterações**:
   ```bash
   git add .
   git commit -m "Otimização de memória para SquareCloud - 1.5GB"
   ```

2. **Deploy no SquareCloud**:
   - Faça upload dos arquivos atualizados
   - A aplicação será reiniciada automaticamente
   - Verifique os logs para confirmar a nova configuração

### 📊 Monitoramento

O servidor agora inclui:
- ✅ Monitoramento detalhado de memória
- ✅ Limpeza automática a cada 30 segundos
- ✅ Alertas quando uso excede 1.2GB
- ✅ Limite de 1.5GB para evitar "LACK_OF_RAM"
- ✅ Margem de segurança de 100MB

### 🎯 Resultado Esperado

- **Sem mais interrupções** por falta de memória
- **Estabilidade garantida** para processamento de arquivos
- **Monitoramento em tempo real** do uso de recursos
- **Uso eficiente** dentro do limite de 1500MB

## ⚠️ Importante

Após o deploy, teste o upload de arquivos para confirmar que não há mais erros de "LACK_OF_RAM".