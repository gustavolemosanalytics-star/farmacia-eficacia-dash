
import { parse, format, getWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper to convert raw sheet rows (array of arrays) to array of objects
export function rowsToObjects(rows: any[][], headerRowIndex: number = 0): Record<string, any>[] {
    if (!rows || rows.length <= headerRowIndex) return [];

    const headers = rows[headerRowIndex].map((h: string) => h?.toString().trim());
    const data = rows.slice(headerRowIndex + 1);

    return data.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header: string, index: number) => {
            if (header) {
                // Keep raw value
                let val = row[index];
                if (val === undefined) val = null;
                obj[header] = val;
            }
        });
        return obj;
    });
}

// Helper: Safe number parser
function parseNumber(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const str = val.toString().trim();
    // Handle Brazilian format (1.234,56) vs US (1,234.56)
    // Simple heuristic: if contains ',' assume BR decimal.
    let clean = str;
    if (str.includes(',')) {
        clean = str.replace(/\./g, '').replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

// Logic for BD Mag - Simplified as requested to pull direct from sheets
export function processBDMag(bdMagRaw: any[][]): any[] {
    return rowsToObjects(bdMagRaw, 0);
}

// Logic for GA4 - Simplified as requested to pull direct from sheets
export function processGA4(ga4Raw: any[][]): any[] {
    return rowsToObjects(ga4Raw, 0);
}
