# Documentação de Fontes de Dados e Cálculos

Este documento detalha as origens dos dados e as lógicas de cálculo utilizadas no Dashboard Farmácia Eficácia.

## Fontes de Dados (Google Sheets)
Todas as informações são extraídas de uma planilha Google Sheets principal (`198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA`) através da API `src/lib/sheets/client.ts`.

| Aba da Planilha | Referência no Código | Descrição |
| :--- | :--- | :--- |
| **BD GAds** | `SHEETS.BD_GADS` | Dados brutos de campanhas do Google Ads (Custo, Conversões, Clicks, etc). |
| **BD GA4** | `SHEETS.BD_GA4` | Dados de transações do Google Analytics 4 (Receita, Origem/Mídia). |
| **BD Mag** | `SHEETS.BD_MAG` | Dados transacionais do Magento (Pedidos, Produtos, Clientes). Base para Catálogo e CRM. |
| **bd tv** | `SHEETS.BD_TV` | Vendas de Televendas (uso específico). |

---

## Cálculos por Página/Módulo

### 1. Visão Geral (Home Executiva)
**Principais KPIs:**
- **Receita Magento:** Soma de `Receita do Produto` da aba **BD Mag**.
    - *Filtro:* Status deve conter "complete", "completo", "pago", "enviado" ou vazio.
- **Pedidos:** Contagem de IDs únicos de `Pedido` na aba **BD Mag**.
- **Ticket Médio:** `Receita Total / Quantidade de Pedidos`.
- **ROAS (Ecommerce):** `Receita Google Ads (Atribuição)` / `Investimento Ads (Ecommerce)`.

**Investimento Ads (Leads vs Ecommerce):**
- **Logica de Segmentação:**
    - **Leads:** Campanhas que contêm "Lead" no nome.
    - **Ecommerce:** Todo o restante (Shopping, PMax, etc).
- **Meta Leads:** Fixada em 28.000.
- **Meta Ecommerce:** Fixada em 66.000.

### 2. Mídia Paga (Google Ads)
**Fonte:** Aba **BD GAds**.
- **Investimento Total:** Soma da coluna `Cost`.
- **Conversões:** Soma da coluna `Conversions`.
- **CTR Médio:** Média da coluna `CTR`.
- **CPC Médio:** `Investimento Total / Total de Cliques`.
- **CPA (Custo por Aquisição):** `Investimento Total / Total de Conversões`.

### 3. CRM & Clientes
**Fonte:** Aba **BD Mag**.
- **Clientes Únicos:** Contagem única de `CPF Cliente` ou `E-mail cliente`.
- **Top Clientes:** Agrupamento por CPF/Email, ordenado por `Receita Total`.
- **RFM (Recência, Frequência, Monetização):**
    - *Recência:* Dias desde a última compra (`Data`).
    - *Frequência:* Quantidade total de pedidos do cliente.
    - *Monetização:* Soma da receita total do cliente.

### 4. Catálogo (Produtos)
**Fonte:** Aba **BD Mag**.
- **Top Produtos (Curva ABC):** Agrupamento por `Nome do Produto`, ordenado por Receita.
- **Receita por Categoria:** Agrupamento pela coluna `Categoria`.
- **Receita por Estado:** Agrupamento pela coluna `Estado`.

---

## Observações Técnicas
- **Cache:** Os dados são cacheados em memória (node-cache) para performance (`src/lib/cache.ts`).
- **Datas:** Filtros de data (`periodoInicio`, `periodoFim`) são aplicados no backend (`client.ts`) comparando com colunas de data (`Day`, `Date`, `Data Transação`).
