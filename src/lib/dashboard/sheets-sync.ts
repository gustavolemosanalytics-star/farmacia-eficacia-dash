import { google } from 'googleapis';
import { getCachedSheetData, setCachedSheetData } from '@/lib/cache';

function getAuth() {
  const raw = process.env.GOOGLE_CREDENTIALS;
  if (!raw) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is required');
  }
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export const SHEETS = {
  BD_MAG: "'BD Mag'",
  GA4: "'ga4'",
  GOOGLE_ADS: "'google_ads'",
  BD_TV: "'bd tv'",
  METAS: "'Meta 2026'",
} as const;

export async function getSheetData(
  range: string,
  _unused?: unknown,
  spreadsheetId?: string
): Promise<any[][]> {
  if (!spreadsheetId) {
    throw new Error('spreadsheetId is required');
  }

  // Check cache first
  const cacheKey = `${spreadsheetId}:${range}`;
  const cached = await getCachedSheetData(cacheKey);
  if (cached) {
    console.log(`[Sheets] Cache hit for ${range}`);
    return cached;
  }

  console.log(`[Sheets] Fetching ${range} from spreadsheet ${spreadsheetId}`);
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const values = response.data.values || [];
  console.log(`[Sheets] Got ${values.length} rows for ${range}`);

  // Cache the result
  await setCachedSheetData(cacheKey, values);

  return values;
}
