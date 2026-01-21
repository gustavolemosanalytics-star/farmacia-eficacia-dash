# Configuração de Deploy (Vercel)

Para que a aplicação funcione corretamente na Vercel (Production), você precisa configurar as **Variáveis de Ambiente** no painel do projeto (Settings > Environment Variables).

## 1. Google Sheets (Credenciais)

A aplicação espera uma variável chamada `GOOGLE_CREDENTIALS` contendo o JSON completo das credenciais de serviço.

1. Abra o arquivo `credentials.json` na raiz do projeto.
2. Copie todo o conteúdo.
3. Adicione na Vercel:
    - **Key**: `GOOGLE_CREDENTIALS`
    - **Value**: (Cole o conteúdo do JSON aqui)

> **Dica**: A Vercel geralmente aceita o JSON com quebras de linha na interface web, mas se tiver problemas, remova as quebras de linha e deixe tudo em uma linha só.

## 2. Configurações de Build (Padrão)

Não é necessário alterar nada, a Vercel detecta Next.js automaticamente.
- **Framework Preset**: Next.js
- **Build Command**: `next build` (ou `npm run build`)
- **Install Command**: `npm install`

---
Apadrinhado por: **Antigravity Agent** 🚀
