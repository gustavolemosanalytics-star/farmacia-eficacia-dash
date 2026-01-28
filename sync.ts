
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { fetchMagData, fetchGoogleAdsData, fetchGA4Data } from './src/lib/sheets/client';


const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL não definida.');
    process.exit(1);
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncSheetsToPostgres() {
    console.log('🔄 Iniciando sincronização direta do Google Sheets para PostgreSQL...');

    try {
        // 1. Transactions
        console.log('📦 Buscando dados do BD Mag...');
        const magData = await fetchMagData();
        console.log(`✅ ${magData.length} transações encontradas.`);

        await prisma.transactionData.deleteMany({});

        const batchSize = 100;
        for (let i = 0; i < magData.length; i += batchSize) {
            const batch = magData.slice(i, i + batchSize).map(item => {
                let dataTransacao: Date | null = null;
                if (item.dataTransacao) {
                    const parts = item.dataTransacao.split(' ');
                    if (parts[0]) {
                        const [d, m, y] = parts[0].split('/').map(Number);
                        dataTransacao = new Date(y, m - 1, d);
                        if (parts[1]) {
                            const [h, min, s] = parts[1].split(':').map(Number);
                            dataTransacao.setHours(h || 0, min || 0, s || 0);
                        }
                    }
                }
                return {
                    mpn: String(item.mpn || ''),
                    pedido: String(item.pedido || ''),
                    dataTransacao,
                    status: item.status || '',
                    nomeProduto: item.nomeProduto || '',
                    receitaProduto: item.receitaProduto || 0,
                    cidade: item.cidade || '',
                    estado: item.estado || '',
                    valorTotalSemFrete: item.valorTotalSemFrete || 0,
                    valorTotalComFrete: item.valorTotalComFrete || 0,
                    emailCliente: item.emailCliente || '',
                    cpfCliente: item.cpfCliente || '',
                    categoria: item.categoria || '',
                    vendedor: item.vendedor || '',
                    origem: item.origem || '',
                    midia: item.midia || '',
                    campanha: item.campanha || '',
                    cupom: item.cupom || '',
                    atribuicao: item.atribuicao || ''
                };
            });
            await prisma.transactionData.createMany({ data: batch });
            console.log(`   - Progresso BD Mag: ${Math.min(i + batchSize, magData.length)}/${magData.length}`);
        }

        // 2. Campaigns
        console.log('📈 Buscando dados do Google Ads...');
        const gadsData = await fetchGoogleAdsData();
        await prisma.campaignData.deleteMany({});
        for (let i = 0; i < gadsData.length; i += batchSize) {
            const batch = gadsData.slice(i, i + batchSize).map(item => {
                let day: Date | null = null;
                if (item.day) {
                    const [y, m, d] = item.day.split('-').map(Number);
                    day = new Date(y, m - 1, d);
                }
                return {
                    day,
                    account: item.account || '',
                    campaign: item.campaign || '',
                    cost: item.cost || 0,
                    conversions: item.conversions || 0,
                    clicks: item.clicks || 0,
                    ctr: item.ctr || 0,
                    campaignStatus: item.campaignStatus || ''
                };
            });
            await prisma.campaignData.createMany({ data: batch });
        }

        // 3. Sessions
        console.log('🌐 Buscando dados do GA4...');
        const ga4Data = await fetchGA4Data();
        await prisma.sessionData.deleteMany({});
        for (let i = 0; i < ga4Data.length; i += batchSize) {
            const batch = ga4Data.slice(i, i + batchSize).map(item => {
                let date: Date | null = null;
                if (item.transactionDate) {
                    const [d, m, y] = item.transactionDate.split('/').map(Number);
                    date = new Date(y, m - 1, d);
                }
                return {
                    date,
                    transactionId: String(item.transactionId || ''),
                    source: item.eventSourceMedium || '',
                    medium: '',
                    campaign: item.eventCampaign || '',
                    revenue: item.purchaseRevenue || 0,
                    status: item.status || ''
                };
            });
            await prisma.sessionData.createMany({ data: batch });
        }

        console.log('✨ Sincronização concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncSheetsToPostgres();
