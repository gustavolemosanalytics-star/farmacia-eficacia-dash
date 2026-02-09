import prisma from '@/lib/prisma';
import { fetchMagData, fetchGoogleAdsData, fetchGA4Data } from '@/lib/dashboard/client';

export async function GET() {
    try {
        console.log('🔄 Iniciando sincronização via API...');

        // 1. Transactions
        const magData = await fetchMagData();
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
                    status: item.status,
                    nomeProduto: item.nomeProduto,
                    receitaProduto: item.receitaProduto,
                    cidade: item.cidade,
                    estado: item.estado,
                    valorTotalSemFrete: item.valorTotalSemFrete,
                    valorTotalComFrete: item.valorTotalComFrete,
                    emailCliente: item.emailCliente,
                    cpfCliente: item.cpfCliente,
                    categoria: item.categoria,
                    vendedor: item.vendedor,
                    origem: item.origem,
                    midia: item.midia,
                    campanha: item.campanha,
                    cupom: item.cupom,
                    atribuicao: item.atribuicao
                };
            });
            await prisma.transactionData.createMany({ data: batch });
        }

        // 2. Campaigns
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
                    account: item.account,
                    campaign: item.campaign,
                    cost: item.cost,
                    conversions: item.conversions,
                    clicks: item.clicks,
                    ctr: item.ctr,
                    campaignStatus: item.campaignCategory || ''
                };
            });
            await prisma.campaignData.createMany({ data: batch });
        }

        // 3. Sessions
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
                    source: item.eventSourceMedium,
                    campaign: item.eventCampaign,
                    revenue: item.purchaseRevenue,
                    status: item.status
                };
            });
            await prisma.sessionData.createMany({ data: batch });
        }

        return Response.json({ success: true, message: 'Sync completed' });
    } catch (error: any) {
        console.error('❌ Sync error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
