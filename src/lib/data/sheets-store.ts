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
    ATRIBUICAO: { spreadsheetId: SECONDARY_SPREADSHEET_ID, sheetName: 'Atribuição' },
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
// GA4 ATTRIBUTION — LOOKUP FROM "Atribuição" TAB
// ============================================

let _atribuicaoMapCache: Map<string, string> | null = null;
let _atribuicaoMapFetchedAt = 0;

async function getAtribuicaoMapInternal(): Promise<Map<string, string>> {
    const store = getStore();
    const now = Date.now();

    // Return cached map if sheets data hasn't changed
    if (_atribuicaoMapCache && _atribuicaoMapFetchedAt >= store.atribuicao.fetchedAt && _atribuicaoMapFetchedAt > 0) {
        return _atribuicaoMapCache;
    }

    const rows = await getStoreData(
        store.atribuicao,
        SHEET_CONFIG.ATRIBUICAO.spreadsheetId,
        SHEET_CONFIG.ATRIBUICAO.sheetName
    );

    const map = new Map<string, string>();
    for (const row of rows) {
        const origem = (row.origem || '').toString().trim().toLowerCase();
        const canal = (row.canal || '').toString().trim();
        if (origem && canal) {
            map.set(origem, canal);
        }
    }

    _atribuicaoMapCache = map;
    _atribuicaoMapFetchedAt = now;
    console.log(`[Sheets] Built Atribuição map with ${map.size} entries`);
    return map;
}

function lookupAttribution(ssm: string, map: Map<string, string>): string {
    const key = (ssm || '').trim().toLowerCase();
    if (!key) return 'Outros';
    return map.get(key) || 'Outros';
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
        atribuicao: SheetStore;
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
            atribuicao: empty(),
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

    // First, ensure the attribution map is loaded
    const attrMap = await getAtribuicaoMapInternal();

    return getStoreData(
        store.ga4,
        SHEET_CONFIG.GA4.spreadsheetId,
        SHEET_CONFIG.GA4.sheetName,
        // Post-process: compute atribuicao via lookup
        (rows) => rows.map(r => ({
            ...r,
            atribuicao: lookupAttribution(r.session_source_medium, attrMap),
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

export async function getAtribuicaoData(): Promise<Record<string, any>[]> {
    const store = getStore();
    return getStoreData(
        store.atribuicao,
        SHEET_CONFIG.ATRIBUICAO.spreadsheetId,
        SHEET_CONFIG.ATRIBUICAO.sheetName
    );
}

export async function getAtribuicaoMap(): Promise<Map<string, string>> {
    return getAtribuicaoMapInternal();
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
    store.atribuicao.fetchedAt = 0;
    _atribuicaoMapCache = null;
    _atribuicaoMapFetchedAt = 0;

    console.log('[Sheets] Refreshing all data...');
    await Promise.all([
        getAtribuicaoData(), // fetch attribution map first (needed by ga4)
        getBdMagData(),
        getGoogleAdsStoreData(),
        getTvSalesStoreData(),
        getMetasStoreData(),
        getVendaPorCanalData(),
    ]);
    // GA4 depends on atribuicao map being loaded
    await getGa4StoreData();
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
        atribuicao: { rows: store.atribuicao.data.length, ageMinutes: Math.round((now - store.atribuicao.fetchedAt) / 60000), loading: !!store.atribuicao.loading },
    };
}
