/**
 * Google Sheets functions for syncing data to PostgreSQL
 * This module is ONLY used by the db-sync service for initial data import
 * The main application uses PostgreSQL directly via client.ts
 */

import { google } from 'googleapis';
import path from 'path';

// Sheet names/GIDs
export const SHEETS = {
    BD_GADS: 'BD GAds',
    BD_GA4: 'BD GA4',
    GA4_SESSOES: 'GA4 sessões',
    BD_TV: 'bd tv',
    VENDA_DIARIA: 'Venda Diaria',
    META_2026: 'Meta 2026',
    BD_MAG: 'BD Mag',
} as const;

// Default Spreadsheet ID
const DEFAULT_SPREADSHEET_ID = '198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA';

// Initialize the Google Sheets client
const getAuthClient = async () => {
    // Priority 1: Check for Environment Variable (Vercel/Production)
    if (process.env.GOOGLE_CREDENTIALS) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: credentials.client_email,
                    private_key: credentials.private_key,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });

            return auth.getClient();
        } catch (error) {
            console.error('Error parsing GOOGLE_CREDENTIALS env var:', error);
            throw new Error('Failed to parse GOOGLE_CREDENTIALS environment variable');
        }
    }

    // Priority 2: Check for local file (Development)
    const credentialsPath = path.join(process.cwd(), 'credentials.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return auth.getClient();
};

// Create Sheets API instance
const getSheetsClient = async () => {
    const authClient = await getAuthClient();
    return google.sheets({ version: 'v4', auth: authClient as any });
};

// Generic function to fetch data from a specific spreadsheet
export const getSheetData = async (
    sheetName: string,
    range?: string,
    spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<any[][]> => {
    console.log(`[Sheets Sync] Fetching: ${sheetName} from ${spreadsheetId.slice(-8)}...`);

    try {
        const sheets = await getSheetsClient();
        const fullRange = range ? `${sheetName}!${range}` : sheetName;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: fullRange,
        });

        const data = response.data.values || [];
        console.log(`[Sheets Sync] Fetched: ${sheetName} (${data.length} rows)`);

        return data;
    } catch (error) {
        console.error(`[Sheets Sync] Error fetching ${sheetName}:`, error);
        throw error;
    }
};
