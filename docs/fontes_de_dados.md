# Fontes de Dados por Página - War Room Dashboard

Documento técnico especificando as integrações e fontes de dados necessárias para cada página do dashboard.

---

## Legenda

| Ícone | Complexidade |
|-------|--------------|
| 🟢 | Fácil (API nativa) |
| 🟡 | Médio (requer connector) |
| 🔴 | Difícil (desenvolvimento custom) |

---

## 1. Home Executiva (CEO)

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| GMV, Receita, Pedidos, Ticket Médio | **Magento API** / **VTEX API** / **Shopify Admin API** | 🟢 |
| Taxa de Conversão, Sessões | **Google Analytics 4 Data API** | 🟢 |
| CAC, ROAS, MER | **Google Ads API** + **Meta Marketing API** + Backend | 🟡 |
| Funil Simplificado | **GA4 Data API** (eventos ecommerce) | 🟢 |
| Alertas Críticos | **Sistema customizado** (BigQuery + Cloud Functions) | 🔴 |
| Plano de Ação IA | **OpenAI API** ou **Anthropic Claude API** | 🟡 |

---

## 2. Aquisição & Tráfego

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Sessões, Novos Usuários, Engajamento | **Google Analytics 4 Data API** | 🟢 |
| Breakdown por Canal | **GA4 Data API** (sessionDefaultChannelGroup) | 🟢 |
| Top Landing Pages | **GA4 Data API** (landingPage dimension) | 🟢 |
| Atribuição Multi-Touch | **GA4 Attribution API** ou **Google Ads Attribution** | 🟡 |

---

## 3. Funil E-commerce (CRO)

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Eventos de Funil | **GA4 Data API** (view_item, add_to_cart, begin_checkout, purchase) | 🟢 |
| Taxa de Abandono | **GA4 Data API** (calculado) | 🟢 |
| Busca Interna | **Algolia Analytics API** ou **GA4** (view_search_results) | 🟡 |
| Erros de Checkout | **Sentry API** ou **Datadog API** ou **Logs do backend** | 🟡 |

---

## 4. Catálogo & Merchandising

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| SKUs Ativos, Estoque, Ruptura | **SAP API** / **Oracle ERP API** / **Bling API** / **Tiny API** | 🟡 |
| Top SKUs por Receita/Margem | **Magento API** / **VTEX API** / **Shopify API** | 🟢 |
| Quality Score de Produto | **Sistema interno** (validação de cadastro) | 🔴 |
| Merchant Center Status | **Google Merchant Center API** (Content API for Shopping) | 🟢 |

---

## 5. Mídia Paga (Ads)

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Spend, Impressões, Cliques, CTR, CPC (Google) | **Google Ads API** (reports endpoint) | 🟡 |
| Spend, Impressões, Cliques, CTR, CPC (Meta) | **Meta Marketing API** (insights endpoint) | 🟡 |
| Campanhas PMax/Shopping | **Google Ads API** (AssetGroupAsset reports) | 🟡 |
| Criativos com Thumbnails | **Meta Marketing API** (adcreatives endpoint) | 🟡 |
| Conversões/ROAS unificado | **Google Ads API** + **Meta API** + **GA4** (comparação) | 🔴 |

---

## 6. SEO & Demanda

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Cliques, Impressões, CTR, Posição | **Google Search Console API** | 🟢 |
| Páginas com Queda | **GSC API** (comparativo temporal) | 🟢 |
| Queries Afetadas | **GSC API** (query dimension) | 🟢 |
| Oportunidades de Keywords | **SEMrush API** ou **Ahrefs API** ou **Moz API** | 🟡 |

---

## 7. CRM & Retenção

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Clientes Ativos, Recompra | **Salesforce API** / **HubSpot API** / **RD Station API** | 🟡 |
| LTV Calculado | **BigQuery** / **Snowflake** (cálculo sobre transações) | 🔴 |
| Matriz de Cohort | **BigQuery** / **Snowflake** / **Amplitude Analytics API** | 🔴 |
| Segmentação RFM | **Segment CDP API** / **Amplitude API** / **Cálculo interno** | 🔴 |

---

## 8. E-mail Marketing

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Enviados, Open Rate, CTR | **Klaviyo API** / **ActiveCampaign API** / **Mailchimp API** | 🟢 |
| Receita por Email | **Klaviyo API** (native) ou **API email + Backend** | 🟡 |
| Performance de Fluxos | **Klaviyo API** (flows endpoint) / **ActiveCampaign API** | 🟡 |

---

## 9. Social & Marca

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Alcance, Engajamento (Instagram) | **Meta Graph API** (instagram_insights) | 🟡 |
| Métricas TikTok | **TikTok Business API** | 🟡 |
| Sentimento/NLP | **AWS Comprehend API** / **Google Cloud NLP API** | 🔴 |
| Comentários/Reviews | **Meta Graph API** + scraping ou **Trustpilot API** | 🔴 |

---

## 10. Preço & Concorrência

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Preço Médio Próprio | **Magento API** / **VTEX API** / **Shopify API** | 🟢 |
| Preços de Mercado | **Precifica API** / **Sieve API** / **Crawler customizado** | 🔴 |
| Índice de Competitividade | **Cálculo interno** sobre dados acima | 🔴 |

---

## 11. Operação & CX

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Prazo Prometido vs Real | **Intelipost API** / **Melhor Envio API** / **TMS interno** | 🟡 |
| Taxa de Atraso/Devolução | **Backend E-commerce** + **Correios API** | 🟡 |
| NPS | **Delighted API** / **Typeform API** / **Hotjar API** | 🟡 |
| Tickets/Reclamações | **Zendesk API** / **Freshdesk API** / **ReclameAqui API** | 🟡 |

---

## 12. Sala de Diagnóstico IA

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Timeline de Incidentes | **Sistema interno** (BigQuery + alertas) | 🔴 |
| Chat Interface LLM | **OpenAI API (GPT-4)** ou **Anthropic Claude API** | 🟡 |
| Contexto para IA | **Agregação de todas as fontes** via Data Warehouse | 🔴 |

---

## 13. Data Quality & Governança

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Discrepância GA4 vs Backend | **GA4 Data API** + **Backend API** (comparação scheduled) | 🔴 |
| Cobertura UTM | **GA4 Data API** (source/medium analysis) | 🟡 |
| Status de Eventos | **GA4 Debug View** + **Google Tag Manager API** | 🔴 |

---

## 14. Growth Radar (Tendências)

| Dado | Fonte Real para Conectar | Complexidade |
|------|--------------------------|--------------|
| Matriz de Oportunidades | **Agregação interna** + scoring algorithm | 🔴 |
| Trending Products | **GA4 Data API** (view_item) + cálculo de momentum | 🟡 |
| Scale Candidates | **Google Ads API** + **Meta API** + SOV calculation | 🔴 |

---

## Resumo de Integrações Necessárias

### Essenciais (Prioridade 1)
| Integração | APIs Necessárias |
|------------|------------------|
| **Google Analytics 4** | GA4 Data API, GA4 Admin API |
| **E-commerce Backend** | Magento REST API / VTEX API / Shopify Admin API |
| **Google Ads** | Google Ads API (v14+) |
| **Meta Ads** | Meta Marketing API |
| **Google Search Console** | Search Console API |
| **Google Merchant Center** | Content API for Shopping |

### Importantes (Prioridade 2)
| Integração | APIs Necessárias |
|------------|------------------|
| **Email Marketing** | Klaviyo API / ActiveCampaign API |
| **CRM** | Salesforce API / HubSpot API |
| **Logística** | Intelipost API / Melhor Envio API |
| **Atendimento** | Zendesk API / Freshdesk API |

### Avançadas (Prioridade 3)
| Integração | APIs Necessárias |
|------------|------------------|
| **Data Warehouse** | BigQuery API / Snowflake Connector |
| **LLM/IA** | OpenAI API / Anthropic API |
| **SEO Tools** | SEMrush API / Ahrefs API |
| **Price Monitoring** | Precifica API / Crawler customizado |

---

## Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────────┐
│                     FONTES REAIS DE DADOS                       │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│   GA4 API   │ Google Ads  │   Meta Ads  │   GSC API   │Shopify │
│             │    API      │     API     │             │  API   │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴───┬────┘
       │             │             │             │          │
       ▼             ▼             ▼             ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ETL LAYER (Airbyte/Fivetran)                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATA WAREHOUSE (BigQuery/Snowflake)                │
│  - Tabelas unificadas    - Cálculos de LTV/RFM/Cohort          │
│  - Histórico             - Alertas e anomalias                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API LAYER (Next.js API Routes)                 │
│  - Endpoints RESTful     - Caching (Redis)                      │
│  - Autenticação          - Rate limiting                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WAR ROOM DASHBOARD                           │
│                    (Next.js + React)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Credenciais Necessárias

| Serviço | Tipo de Credencial | Onde Obter |
|---------|-------------------|------------|
| Google Analytics 4 | Service Account JSON | Google Cloud Console |
| Google Ads | OAuth 2.0 + Developer Token | Google Ads API Center |
| Google Search Console | Service Account JSON | Google Cloud Console |
| Google Merchant Center | Service Account JSON | Google Cloud Console |
| Meta Marketing API | Access Token + App ID | Meta Business Suite |
| Shopify | Admin API Access Token | Shopify Partners |
| Klaviyo | Private API Key | Klaviyo Account Settings |
| OpenAI | API Key | OpenAI Platform |
