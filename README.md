# WantToCry Decryptor - Ferramenta de Descriptografia

## ⚠️ AVISO IMPORTANTE
**NUNCA PAGUE RESGATES A CRIMINOSOS!** Esta ferramenta foi desenvolvida para tentar recuperar arquivos criptografados pelo ransomware WantToCry usando métodos legítimos de análise e descriptografia.

## 🎯 Sobre o Projeto

Esta é uma ferramenta web gratuita e de código aberto desenvolvida para ajudar vítimas do ransomware WantToCry a recuperar seus arquivos sem pagar o resgate. A ferramenta utiliza várias técnicas de análise criptográfica e tentativas de descriptografia.

## 🔍 Características do WantToCry Ransomware

- **Extensão dos arquivos:** `.want_to_cry`
- **Contato:** qTox Messenger (https://qtox.github.io/)
- **Tox ID:** `1D9E589C757304F688514280E3ADBE2E12C5F46DE25A01EBBAAB17896D0BAA59BFCEE0D493A6`
- **Valor do resgate:** $600 USD em Bitcoin
- **ID único mencionado:** `3C579D75CF2341758A9B984A0B943F18`

## 🛠️ Funcionalidades da Ferramenta

### 1. Análise de Arquivos
- **Cálculo de entropia:** Determina se o arquivo está realmente criptografado
- **Análise de assinatura:** Examina os primeiros bytes do arquivo
- **Detecção de padrões:** Procura por strings conhecidas e padrões suspeitos
- **Análise de blocos:** Identifica possíveis vulnerabilidades na criptografia

### 2. Métodos de Descriptografia

#### Força Bruta (Chaves Fracas)
- Testa chaves baseadas em anos (2015-2024)
- Chaves comuns como "123456", "password", "admin"
- Variações com números e padrões conhecidos
- Chaves específicas do WantToCry

#### Chaves Conhecidas
- Base de dados de chaves conhecidas do WantToCry
- Chaves vazadas ou descobertas pela comunidade
- Padrões identificados em outras variantes

#### Análise de Padrões Avançada
- Análise de correlação entre bytes
- Detecção de padrões ECB
- Análise de frequência de bytes
- Identificação de possíveis vulnerabilidades

## 🚀 Como Usar

1. **Abra a ferramenta** no seu navegador
2. **Faça upload** dos arquivos `.want_to_cry` criptografados
3. **Aguarde a análise** automática dos arquivos
4. **Escolha um método** de descriptografia:
   - Comece com "Chaves Conhecidas" (mais rápido)
   - Tente "Análise de Padrões" para identificar vulnerabilidades
   - Use "Força Bruta" como último recurso (mais demorado)
5. **Monitore os logs** para acompanhar o progresso
6. **Baixe os arquivos** se a descriptografia for bem-sucedida

## 📊 Interpretando os Resultados

### Entropia
- **Alta (>7.5):** Arquivo provavelmente criptografado corretamente
- **Baixa (<6.0):** Arquivo pode não estar criptografado ou usar criptografia fraca

### Padrões ECB
- Se detectados, indicam possível vulnerabilidade na implementação
- Podem permitir ataques de análise de padrões

### Correlação Adjacente
- Alta correlação pode indicar criptografia fraca
- Baixa correlação é esperada em criptografia forte

## ⚡ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Criptografia:** CryptoJS library
- **Interface:** Font Awesome icons, CSS Grid/Flexbox
- **Servidor:** Python HTTP Server (para desenvolvimento)

## 🔒 Segurança e Privacidade

- **Processamento local:** Todos os arquivos são processados no seu navegador
- **Sem upload:** Nenhum arquivo é enviado para servidores externos
- **Código aberto:** Todo o código pode ser auditado
- **Sem coleta de dados:** Nenhuma informação pessoal é coletada

## 📝 Limitações

- **Não é 100% garantido:** A descriptografia depende de vulnerabilidades ou chaves fracas
- **Experimental:** Esta é uma ferramenta de pesquisa e pode não funcionar em todos os casos
- **Sem suporte oficial:** Não há garantia de suporte ou atualizações regulares

## 🆘 Alternativas de Recuperação

Se esta ferramenta não funcionar, considere:

1. **Shadow Copies do Windows:** `vssadmin list shadows`
2. **Backups automáticos:** Verifique backups em nuvem ou locais
3. **Ferramentas especializadas:** Procure por outras ferramentas de descriptografia
4. **Ajuda profissional:** Consulte especialistas em segurança cibernética

## 🤝 Contribuições

Este projeto é de código aberto. Contribuições são bem-vindas:

- Melhorias na interface
- Novos métodos de descriptografia
- Otimizações de performance
- Correções de bugs
- Documentação

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs da ferramenta
- Consulte a documentação
- Procure ajuda em fóruns de segurança cibernética

## ⚖️ Aviso Legal

Esta ferramenta é fornecida "como está" sem garantias. O uso é por sua conta e risco. Os desenvolvedores não se responsabilizam por perda de dados ou outros danos. Sempre mantenha backups atualizados de seus arquivos importantes.

---

**Lembre-se: A melhor defesa contra ransomware é a prevenção através de backups regulares e práticas de segurança adequadas.**