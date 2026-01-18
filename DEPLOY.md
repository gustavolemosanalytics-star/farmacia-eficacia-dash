# Configuração de Deploy (Vercel)

Para que a aplicação funcione corretamente na Vercel (Production), você precisa configurar as **Variáveis de Ambiente** no painel do projeto (Settings > Environment Variables).

## 1. Redis (Cache)

Adicione a variável `REDIS_URL` com o valor de conexão (o mesmo configurado localmente):

- **Key**: `REDIS_URL`
- **Value**: `redis://default:90SXFSWHE7Tx6k2HqYu4N3KZURfqjMQh@redis-13698.c98.us-east-1-4.ec2.cloud.redislabs.com:13698`

## 2. Google Sheets (Credenciais)

A aplicação espera uma variável chamada `GOOGLE_CREDENTIALS` contendo o JSON completo das credenciais de serviço.

1. Abra o arquivo `credentials.json` na raiz do projeto.
2. Copie todo o conteúdo.
3. Adicione na Vercel:
    - **Key**: `GOOGLE_CREDENTIALS`
    - **Value**: (Cole o conteúdo do JSON aqui)

> **Dica**: A Vercel geralmente aceita o JSON com quebras de linha na interface web, mas se tiver problemas, remova as quebras de linha e deixe tudo em uma linha só.

## 3. Configurações de Build (Padrão)

Não é necessário alterar nada, a Vercel detecta Next.js automaticamente.
- **Framework Preset**: Next.js
- **Build Command**: `next build` (ou `npm run build`)
- **Install Command**: `npm install`

---
Apadrinhado por: **Antigravity Agent** 🚀
