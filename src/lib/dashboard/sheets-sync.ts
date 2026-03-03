/**
 * sheets-sync.ts — Public Google Sheets CSV Fetcher
 *
 * No authentication needed. The spreadsheets are shared as read-only.
 * Data fetching and caching is handled by sheets-store.ts.
 * This file is kept for backward compatibility with any remaining imports.
 */

export const SHEETS = {
    BD_MAG: 'BD Mag',
    GA4: 'ga4',
    GOOGLE_ADS: 'google_ads',
    BD_TV: 'bd tv',
    METAS: 'Meta 2026',
} as const;

export function buildCSVUrl(spreadsheetId: string, sheetName: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

/**
 * @deprecated Use sheets-store.ts functions instead (getBdMagData, getGa4StoreData, etc.)
 */
export async function getSheetData(
    range: string,
    _unused?: unknown,
    spreadsheetId?: string
): Promise<any[][]> {
    if (!spreadsheetId) {
        throw new Error('spreadsheetId is required');
    }

    const sheetName = range.replace(/^'|'$/g, '');
    const url = buildCSVUrl(spreadsheetId, sheetName);

    console.log(`[Sheets] Fetching ${sheetName} from public CSV`);
    const response = await fetch(url, {
        signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${sheetName}: HTTP ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').map(line => {
        // Simple CSV line split (handles quoted fields)
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        fields.push(current);
        return fields;
    });

    console.log(`[Sheets] Got ${lines.length} rows for ${sheetName}`);
    return lines;
}
