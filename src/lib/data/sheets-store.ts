/**
 * sheets-store.ts — Central Data Store
 *
 * Fetches data directly from public Google Sheets CSV endpoints.
 * Caches in memory for 6 hours. No authentication needed.
 */

import { parse } from 'csv-parse/sync';

// ============================================
// CONFIGURATION
// ============================================

const HISTORICAL_SPREADSHEET_ID = '1nZaUBP-7DhI1iXhAnDOJsQs8aJlkb9x_BGGfRfIinK8';
const SECONDARY_SPREADSHEET_ID = '198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const SHEET_CONFIG = {
    BD_MAG: { spreadsheetId: HISTORICAL_SPREADSHEET_ID, sheetName: 'BD Mag' },
    GA4: { spreadsheetId: HISTORICAL_SPREADSHEET_ID, sheetName: 'ga4' },
    GOOGLE_ADS: { spreadsheetId: HISTORICAL_SPREADSHEET_ID, sheetName: 'google_ads' },
    BD_TV: { spreadsheetId: SECONDARY_SPREADSHEET_ID, sheetName: 'bd tv' },
    METAS: { spreadsheetId: SECONDARY_SPREADSHEET_ID, sheetName: 'Meta 2026' },
    VENDA_POR_CANAL: { spreadsheetId: SECONDARY_SPREADSHEET_ID, sheetName: 'Venda por Canal' },
} as const;

// ============================================
// COLUMN NAME SANITIZATION (matches db-sync.ts)
// ============================================

function sanitizeColumnName(name: string): string {
    if (!name) return 'unknown_col';
    let sanitized = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]/g, '_') // non-alphanumeric to underscore
        .replace(/_+/g, '_') // dedupe underscores
        .replace(/^_|_$/g, ''); // trim underscores

    if (/^[0-9]/.test(sanitized)) {
        sanitized = 'col_' + sanitized;
    }

    return sanitized || 'unknown_col';
}

// ============================================
// GA4 ATTRIBUTION COMPUTATION
// ============================================

function computeGA4Attribution(sessionSourceMedium: string): string {
    const ssm = (sessionSourceMedium || '').toLowerCase();
    if (!ssm) return 'Outros';

    if (ssm.includes('google') && ssm.includes('cpc')) return 'Google_Ads';
    if (ssm.includes('google') && ssm.includes('organic')) return 'Google_Organic';
    if (ssm.includes('youtube')) return 'Google_Ads';
    if (/chatgpt|gemini|scholar\.google|docs\.google|mail\.google|tagassistant|googleads\.g\.doubleclick/.test(ssm)) return 'Google_Organic';
    if (/facebook|instagram|meta|\bff\b|\big\b|lm\.facebook|m\.facebook|l\.facebook|l\.instagram/.test(ssm)) return 'Meta Organico';
    if (ssm.includes('cpc') && ssm.includes('facebook')) return 'Meta Ads';
    if (ssm.includes('cpc') && ssm.includes('meta')) return 'Meta Ads';
    if (ssm.includes('blue')) return 'Blue';
    if (/activecampaign|email|yotpo|rdstation|edrone|btg360|allinmail|marketing|newsletter|3dactiv/.test(ssm)) return 'E-mail MKT';
    if (/vendedor|octadesk|11tvreceptivo|12tvsuporte|35posvenda|admin\.pedbot|aline|atendimento|recovery|vended/.test(ssm)) return 'Vendedor';
    if (ssm === '(direct) / (none)') return 'Direto';
    return 'Outros';
}

// ============================================
// CSV FETCH & PARSE
// ============================================

function buildCSVUrl(spreadsheetId: string, sheetName: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

async function fetchAndParseCSV(
    spreadsheetId: string,
    sheetName: string,
    postProcess?: (rows: Record<string, any>[]) => Record<string, any>[]
): Promise<Record<string, any>[]> {
    const url = buildCSVUrl(spreadsheetId, sheetName);
    console.log(`[Sheets] Fetching CSV: ${sheetName} ...`);
    const startTime = Date.now();

    const response = await fetch(url, {
        signal: AbortSignal.timeout(120_000), // 2 min timeout for large sheets
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${sheetName}: HTTP ${response.status}`);
    }

    const csvText = await response.text();
    const elapsed = Date.now() - startTime;
    console.log(`[Sheets] Downloaded ${sheetName} (${(csvText.length / 1024 / 1024).toFixed(1)} MB) in ${elapsed}ms`);

    // Parse CSV
    const records: Record<string, any>[] = parse(csvText, {
        columns: (headers: string[]) => headers.map(sanitizeColumnName),
        skip_empty_lines: true,
        relax_column_count: true,
    });

    console.log(`[Sheets] Parsed ${records.length} rows for ${sheetName}`);

    if (postProcess) {
        return postProcess(records);
    }

    return records;
}

// ============================================
// IN-MEMORY STORE WITH 6H TTL
// ============================================

interface SheetStore {
    data: Record<string, any>[];
    fetchedAt: number;
    loading: Promise<Record<string, any>[]> | null;
}

// Use globalThis to survive Next.js hot reloads in dev
declare global {
    var __sheetsStore: {
        bdMag: SheetStore;
        ga4: SheetStore;
        googleAds: SheetStore;
        tvSales: SheetStore;
        metas: SheetStore;
        vendaPorCanal: SheetStore;
    } | undefined;
}

function getStore() {
    if (!globalThis.__sheetsStore) {
        const empty = (): SheetStore => ({ data: [], fetchedAt: 0, loading: null });
        globalThis.__sheetsStore = {
            bdMag: empty(),
            ga4: empty(),
            googleAds: empty(),
            tvSales: empty(),
            metas: empty(),
            vendaPorCanal: empty(),
        };
    }
    return globalThis.__sheetsStore;
}

async function getStoreData(
    store: SheetStore,
    spreadsheetId: string,
    sheetName: string,
    postProcess?: (rows: Record<string, any>[]) => Record<string, any>[]
): Promise<Record<string, any>[]> {
    // Return cached data if still fresh
    if (store.data.length > 0 && Date.now() - store.fetchedAt < SIX_HOURS_MS) {
        return store.data;
    }

    // If a fetch is already in progress, wait for it
    if (store.loading) {
        return store.loading;
    }

    // Start new fetch
    store.loading = fetchAndParseCSV(spreadsheetId, sheetName, postProcess)
        .then(data => {
            store.data = data;
            store.fetchedAt = Date.now();
            store.loading = null;
            return data;
        })
        .catch(err => {
            console.error(`[Sheets] Error fetching ${sheetName}:`, err);
            store.loading = null;
            // Return stale data if available
            if (store.data.length > 0) {
                console.log(`[Sheets] Returning stale data for ${sheetName}`);
                return store.data;
            }
            throw err;
        });

    return store.loading;
}

// ============================================
// PUBLIC API — Data Access Functions
// ============================================

export async function getBdMagData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.bdMag,
        SHEET_CONFIG.BD_MAG.spreadsheetId,
        SHEET_CONFIG.BD_MAG.sheetName
    );
}

export async function getGa4StoreData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.ga4,
        SHEET_CONFIG.GA4.spreadsheetId,
        SHEET_CONFIG.GA4.sheetName,
        // Post-process: compute atribuicao
        (rows) => rows.map(r => ({
            ...r,
            atribuicao: computeGA4Attribution(r.session_source_medium),
        }))
    );
}

export async function getGoogleAdsStoreData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.googleAds,
        SHEET_CONFIG.GOOGLE_ADS.spreadsheetId,
        SHEET_CONFIG.GOOGLE_ADS.sheetName
    );
}

export async function getTvSalesStoreData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.tvSales,
        SHEET_CONFIG.BD_TV.spreadsheetId,
        SHEET_CONFIG.BD_TV.sheetName
    );
}

export async function getMetasStoreData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.metas,
        SHEET_CONFIG.METAS.spreadsheetId,
        SHEET_CONFIG.METAS.sheetName
    );
}

export async function getVendaPorCanalData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.vendaPorCanal,
        SHEET_CONFIG.VENDA_POR_CANAL.spreadsheetId,
        SHEET_CONFIG.VENDA_POR_CANAL.sheetName
    );
}

// Force refresh all data (bypasses cache)
export async function refreshAllData(): Promise<void> {
    const store = getStore();
    // Reset fetchedAt to force re-fetch
    store.bdMag.fetchedAt = 0;
    store.ga4.fetchedAt = 0;
    store.googleAds.fetchedAt = 0;
    store.tvSales.fetchedAt = 0;
    store.metas.fetchedAt = 0;
    store.vendaPorCanal.fetchedAt = 0;

    console.log('[Sheets] Refreshing all data...');
    await Promise.all([
        getBdMagData(),
        getGa4StoreData(),
        getGoogleAdsStoreData(),
        getTvSalesStoreData(),
        getMetasStoreData(),
        getVendaPorCanalData(),
    ]);
    console.log('[Sheets] All data refreshed');
}

// Get cache status info
export function getCacheStatus() {
    const store = getStore();
    const now = Date.now();
    return {
        bdMag: { rows: store.bdMag.data.length, ageMinutes: Math.round((now - store.bdMag.fetchedAt) / 60000), loading: !!store.bdMag.loading },
        ga4: { rows: store.ga4.data.length, ageMinutes: Math.round((now - store.ga4.fetchedAt) / 60000), loading: !!store.ga4.loading },
        googleAds: { rows: store.googleAds.data.length, ageMinutes: Math.round((now - store.googleAds.fetchedAt) / 60000), loading: !!store.googleAds.loading },
        tvSales: { rows: store.tvSales.data.length, ageMinutes: Math.round((now - store.tvSales.fetchedAt) / 60000), loading: !!store.tvSales.loading },
        metas: { rows: store.metas.data.length, ageMinutes: Math.round((now - store.metas.fetchedAt) / 60000), loading: !!store.metas.loading },
        vendaPorCanal: { rows: store.vendaPorCanal.data.length, ageMinutes: Math.round((now - store.vendaPorCanal.fetchedAt) / 60000), loading: !!store.vendaPorCanal.loading },
    };
}
