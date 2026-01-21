import { NextResponse } from 'next/server';

// Prefira usar Variáveis de Ambiente no Vercel: SEMRUSH_API_KEY e SEMRUSH_DOMAIN
const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY || '983cc1a7d26ef02cafcdcb443361bcde';
const DOMAIN = process.env.SEMRUSH_DOMAIN || 'farmaciaeficacia.com.br';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'domain_rank';
        const target = searchParams.get('target') || DOMAIN;
        const targets = searchParams.get('targets') || `${DOMAIN},ebay.com,walmart.com`;

        let url = '';
        let isJson = false;

        // Mapeamento de Endpoints SEMRush
        switch (type) {
            case 'domain_rank':
                url = `https://api.semrush.com/?type=domain_rank&key=${SEMRUSH_API_KEY}&export_columns=Or,Ot,Oc,Ad,At,Ac&domain=${target}&database=br`;
                break;
            case 'organic_keywords':
                url = `https://api.semrush.com/?type=domain_organic&key=${SEMRUSH_API_KEY}&display_limit=50&export_columns=Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co&domain=${target}&database=br`;
                break;
            case 'competitors':
                url = `https://api.semrush.com/?type=domain_organic_organic&key=${SEMRUSH_API_KEY}&display_limit=10&export_columns=Dn,Cr,Np,Ot,Oc,Ad&domain=${target}&database=br`;
                break;

            // Traffic Analytics (TA) v3 - Retornam JSON
            case 'ta_summary':
                url = `https://api.semrush.com/analytics/ta/api/v3/summary?targets=${targets}&export_columns=target,visits,users,time_on_site,pages_per_visit,bounce_rate&key=${SEMRUSH_API_KEY}`;
                isJson = true;
                break;
            case 'ta_sources':
                url = `https://api.semrush.com/analytics/ta/api/v3/traffic_sources?target=${target}&key=${SEMRUSH_API_KEY}`;
                isJson = true;
                break;
            case 'ta_geo':
                url = `https://api.semrush.com/analytics/ta/api/v3/geo_distribution?target=${target}&key=${SEMRUSH_API_KEY}`;
                isJson = true;
                break;
            case 'ta_demographics':
                url = `https://api.semrush.com/analytics/ta/api/v3/age_sex_distribution?target=${target}&key=${SEMRUSH_API_KEY}`;
                isJson = true;
                break;

            default:
                return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
        }

        console.log(`[SEMRush Fetch]: ${type} -> ${url.split('key=')[0]}key=HIDDEN`);

        const response = await fetch(url);

        if (isJson) {
            const data = await response.json();
            return NextResponse.json({ success: true, data });
        }

        const text = await response.text();
        const lines = text.trim().split('\n');

        if (lines.length < 2) {
            if (text.toLowerCase().includes('error')) {
                return NextResponse.json({ error: text }, { status: 500 });
            }
            return NextResponse.json({ data: [] });
        }

        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : (firstLine.includes(',') ? ',' : '\t');
        const headers = firstLine.split(separator);

        const data = lines.slice(1).map(line => {
            const values = line.split(separator);
            const obj: any = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('[SEMRush API Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
