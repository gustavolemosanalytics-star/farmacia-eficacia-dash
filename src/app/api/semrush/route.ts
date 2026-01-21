import { NextResponse } from 'next/server';

const SEMRUSH_API_KEY = '983cc1a7d26ef02cafcdcb443361bcde';
const DOMAIN = 'farmaciaeficacia.com.br';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'domain_rank';

        let url = '';

        if (type === 'domain_rank') {
            // Domain Overview
            url = `https://api.semrush.com/?type=domain_rank&key=${SEMRUSH_API_KEY}&export_columns=Or,Ot,Oc,Ad,At,Ac&domain=${DOMAIN}&database=br`;
        } else if (type === 'organic_keywords') {
            // Organic Keywords
            url = `https://api.semrush.com/?type=domain_organic&key=${SEMRUSH_API_KEY}&display_limit=50&export_columns=Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co&domain=${DOMAIN}&database=br`;
        } else if (type === 'competitors') {
            // Organic Competitors
            url = `https://api.semrush.com/?type=domain_organic_organic&key=${SEMRUSH_API_KEY}&display_limit=10&export_columns=Dn,Cr,Np,Ot,Oc,Ad&domain=${DOMAIN}&database=br`;
        } else {
            return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
        }

        const response = await fetch(url);
        const text = await response.text();

        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            if (text.toLowerCase().includes('error')) {
                return NextResponse.json({ error: text }, { status: 500 });
            }
            return NextResponse.json({ data: [] });
        }

        // Determine separator: SEMRush usually uses semicolon if specified or default
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : (firstLine.includes(',') ? ',' : '\t');

        const headers = lines[0].split(separator);
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
