# Guia de Deploy Definitivo - Railway

Este guia contém todos os passos para migrar e hospedar seu dashboard no **Railway** de forma definitiva.

## 1. Preparação do Código (Já Realizado)

O código já foi otimizado para deploy em conteineres:
- **Next.js Standalone**: Configurado em `next.config.ts` para gerar uma build leve.
- **Scripts**: `json` configurado com `postinstall: prisma generate` para garantir que o cliente do banco de dados seja gerado automaticamente.
- **Dependências**: `.npmrc` configurado para evitar erros de dependência.

## 2. Configuração no Railway

### Opção A: Via Dashboard (Recomendado)

1. **Crie um Novo Projeto**:
   - Acesse [railway.app](https://railway.app) e clique em "New Project".
   - Selecione "Deploy from GitHub repo".
   - Escolha o repositório `farm-dash`.

2. **Adicione um Banco de Dados (PostgreSQL)**:
   - No painel do projeto, clique em "New" -> "Database" -> "PostgreSQL".
   - Aguarde a criação.
   - Clique no banco criado, vá em "Connect" e copie a **DATABASE_URL** (Full Connection String).

- **DATABASE_URL**: (Cole a string do banco de dados vinda do Railway).
- **GOOGLE_CREDENTIALS**: (JSON do Service Account do Google Cloud).
- **REDIS_URL**: (Opcional, mas recomendado para cache se criar um serviço Redis no Railway).
- **SEMRUSH_API_KEY**: Chave da API do SEMRush.
- **SEMRUSH_DOMAIN**: Domínio padrão (ex: `farmaciaeficacia.com.br`).
- **MAGENTO_BASE_URL**: URL da API do Magento (ex: `https://vendedor.farmaciaeficacia.com.br/rest/V1`).
- **MAGENTO_CONSUMER_KEY**: Chave do consumidor OAuth 1.0a.
- **MAGENTO_CONSUMER_SECRET**: Segredo do consumidor OAuth 1.0a.
- **MAGENTO_ACCESS_TOKEN**: Token de acesso OAuth 1.0a.
- **MAGENTO_ACCESS_TOKEN_SECRET**: Segredo do token de acesso OAuth 1.0a.
- **NPM_CONFIG_LEGACY_PEER_DEPS**: `true` (Importante para evitar conflitos de dependências no deploy).
- **NODE_ENV**: `production`.

4. **Configurações de Build**:
   - O Railway deve detectar automaticamente:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm run start`
   - Se houver problemas de memória durante o build, você pode aumentar o plano da máquina temporariamente em **Settings** > **Resources**.

### Opção B: Via CLI (Se tiver instalado)

Se você tiver o `railway` CLI instalado:

```bash
railway login
railway init
railway up
```

## 3. Migração do Banco de Dados

Após o deploy, você precisa enviar a estrutura do seu banco de dados para o PostgreSQL do Railway.

1. **Obtenha a URL de Conexão**:
   - Pegue a `DATABASE_URL` do Railway (Passo 2 acima).

2. **Rode a Migração no Terminal Local**:
   Substitua `<SUA_URL_DO_RAILWAY>` pela URL real:

   ```bash
   DATABASE_URL="<SUA_URL_DO_RAILWAY>" npx prisma db push
   ```

   Isso criará as tabelas no banco de produção.

## 4. Monitoramento

- Use a aba **Deployments** no Railway para ver os logs em tempo real.
- Se o build falhar, verifique se a variável `NPM_CONFIG_LEGACY_PEER_DEPS` foi configurada corretamente.
- Se a aplicação iniciar mas der erro de banco, verifique se rodou o comando do Passo 3.

---
**Status**: Pronto para Deploy 🚀
