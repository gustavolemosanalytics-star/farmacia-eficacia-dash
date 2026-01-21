import { NextResponse } from 'next/server';

const SEMRUSH_API_KEY = '983cc1a7d26ef02cafcdcb443361bcde';
const DOMAIN = 'farmaciaeficacia.com.br';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'domain_rank'; // Default to overview

        let url = '';

        if (type === 'domain_rank') {
            // Domain Overview
            url = `https://api.semrush.com/?type=domain_rank&key=${SEMRUSH_API_KEY}&export_columns=Or,Ot,Oc,Ad,At,Ac,Or,Ot,Oc&domain=${DOMAIN}&database=br`;
        } else if (type === 'organic_keywords') {
            // Organic Keywords
            url = `https://api.semrush.com/?type=domain_organic&key=${SEMRUSH_API_KEY}&display_limit=20&export_columns=Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co&domain=${DOMAIN}&database=br`;
        } else {
            return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
        }

        const response = await fetch(url);
        const text = await response.text();

        // SEMRush returns CSV-like text or raw text results.
        // We need to parse it into JSON.
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            // Check if it's an error message
            if (text.toLowerCase().includes('error')) {
                return NextResponse.json({ error: text }, { status: 500 });
            }
            return NextResponse.json({ data: [] });
        }

        const headers = lines[0].split(';');
        const data = lines.slice(1).map(line => {
            const values = line.split(';');
            const obj: any = {};
            headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('[SEMRush API Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
