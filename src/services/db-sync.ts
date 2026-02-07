
import { getSheetData, SHEETS } from '@/lib/sheets/sheets-sync';
import { processBDMag, processGA4, rowsToObjects } from './transformations';
import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';

dotenv.config();

// Historical Spreadsheet (has ga4, google_ads, BD Mag tabs)
const HISTORICAL_SPREADSHEET_ID = '1nZaUBP-7DhI1iXhAnDOJsQs8aJlkb9x_BGGfRfIinK8';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Helper: Sanitize column name for Postgres
function sanitizeColumnName(name: string): string {
    if (!name) return 'unknown_col';
    let sanitized = name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, '_') // non-alphanumeric to underscore
        .replace(/_+/g, '_') // dedupe underscores
        .replace(/^_|_$/g, ''); // trim underscores

    // Ensure column name doesn't start with a number
    if (/^[0-9]/.test(sanitized)) {
        sanitized = 'col_' + sanitized;
    }

    return sanitized || 'unknown_col';
}

async function syncTable(tableName: string, data: any[]) {
    if (data.length === 0) {
        console.log(`⚠️ No data for ${tableName}`);
        return;
    }

    const client = await pool.connect();
    try {
        console.log(`Phase: Syncing ${tableName} (${data.length} rows)...`);

        const firstRow = data[0];
        const columns = Object.keys(firstRow).map(k => ({
            original: k,
            sanitized: sanitizeColumnName(k),
        }));

        // 1. Drop Table
        await client.query(`DROP TABLE IF EXISTS ${tableName}`);

        // 2. Create Table
        const colDefs = columns.map(c => `${c.sanitized} TEXT`).join(',\n');
        const createQuery = `CREATE TABLE ${tableName} (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            ${colDefs}
        )`;
        await client.query(createQuery);

        // 3. Insert Data
        const batchSize = 500;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            const valueRows: string[] = [];
            const values: any[] = [];
            let paramIdx = 1;

            for (const row of batch) {
                const rowParams: string[] = [];
                for (const col of columns) {
                    rowParams.push(`$${paramIdx++}`);
                    let val = row[col.original];
                    if (val === undefined) val = null;
                    if (val !== null && typeof val === 'object') val = JSON.stringify(val);
                    values.push(val);
                }
                valueRows.push(`(${rowParams.join(',')})`);
            }

            const insertQuery = `INSERT INTO ${tableName} (${columns.map(c => c.sanitized).join(',')}) VALUES ${valueRows.join(',')}`;
            await client.query(insertQuery, values);
            process.stdout.write('.');
        }

        console.log(`\n✅ Synced ${tableName}`);

    } catch (e) {
        console.error(`Error syncing ${tableName}:`, e);
    } finally {
        client.release();
    }
}

import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - csv-parse types issue
import { parse } from 'csv-parse/sync';

// Helper: Read Attribution CSV
function getAttributionData() {
    const csvPath = path.join(process.cwd(), 'src/services/atribuicao.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });
    return records;
}

async function computeGA4Attribution() {
    const client = await pool.connect();
    try {
        console.log('Computing atribuicao for ga4...');

        // Add column if it doesn't already exist (sheet may no longer include it)
        await client.query(`ALTER TABLE ga4 ADD COLUMN IF NOT EXISTS atribuicao TEXT`);

        // Replicate the Google Sheets attribution formula based on session_source_medium
        await client.query(`
            UPDATE ga4 SET atribuicao =
              CASE
                WHEN LOWER(session_source_medium) LIKE '%google%' AND LOWER(session_source_medium) LIKE '%cpc%' THEN 'Google_Ads'
                WHEN LOWER(session_source_medium) LIKE '%google%' AND LOWER(session_source_medium) LIKE '%organic%' THEN 'Google_Organic'
                WHEN LOWER(session_source_medium) LIKE '%youtube%' THEN 'Google_Ads'
                WHEN LOWER(session_source_medium) ~* 'chatgpt|gemini|scholar\\.google|docs\\.google|mail\\.google|tagassistant|googleads\\.g\\.doubleclick' THEN 'Google_Organic'
                WHEN LOWER(session_source_medium) ~* 'facebook|instagram|meta|\\yff\\y|\\yig\\y|lm\\.facebook|m\\.facebook|l\\.facebook|l\\.instagram' THEN 'Meta Organico'
                WHEN LOWER(session_source_medium) LIKE '%cpc%' AND LOWER(session_source_medium) LIKE '%facebook%' THEN 'Meta Ads'
                WHEN LOWER(session_source_medium) LIKE '%cpc%' AND LOWER(session_source_medium) LIKE '%meta%' THEN 'Meta Ads'
                WHEN LOWER(session_source_medium) LIKE '%blue%' THEN 'Blue'
                WHEN LOWER(session_source_medium) ~* 'activecampaign|email|yotpo|rdstation|edrone|btg360|allinmail|marketing|newsletter|3dactiv' THEN 'E-mail MKT'
                WHEN LOWER(session_source_medium) ~* 'vendedor|octadesk|11tvreceptivo|12tvsuporte|35posvenda|admin\\.pedbot|aline|atendimento|recovery|vended' THEN 'Vendedor'
                WHEN session_source_medium = '(direct) / (none)' THEN 'Direto'
                ELSE 'Outros'
              END
            WHERE session_source_medium IS NOT NULL AND session_source_medium != ''
        `);

        console.log('✅ atribuicao computed for ga4');
    } catch (e) {
        console.error('Error computing ga4 attribution:', e);
    } finally {
        client.release();
    }
}

async function main() {
    try {
        console.log('🚀 Starting Sheets -> Postgres Sync');
        console.log(`Using spreadsheet: ${HISTORICAL_SPREADSHEET_ID}`);

        // Clear any cached sheet data to force fresh fetch
        console.log('🗑️ Clearing sheet cache...');
        const { invalidateCache } = await import('@/lib/cache');
        await invalidateCache('farm:raw:*');
        console.log('✅ Cache cleared');

        // 1. Fetch Raw Data from Historical Spreadsheet
        // Sheet names with spaces need single quotes in range notation
        console.log('Fetching BD Mag...');
        const rawBDMag = await getSheetData("'BD Mag'", undefined, HISTORICAL_SPREADSHEET_ID);

        console.log('Fetching ga4...');
        const rawGA4 = await getSheetData("'ga4'", undefined, HISTORICAL_SPREADSHEET_ID);

        console.log('Fetching google_ads...');
        const rawGoogleAds = await getSheetData("'google_ads'", undefined, HISTORICAL_SPREADSHEET_ID);

        console.log('Fetching Televendas...');
        const rawTV = await getSheetData("'bd tv'", undefined, "198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA");

        console.log('Fetching Metas...');
        const rawMetas = await getSheetData("'Meta 2026'", undefined, "198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA");

        // 1b. Fetch Attribution CSV
        console.log('Reading Attribution CSV...');
        const attributionData = getAttributionData();

        if (!rawBDMag || rawBDMag.length === 0) console.error("Warning: BD Mag empty");
        if (!rawGA4 || rawGA4.length === 0) console.error("Warning: ga4 empty");
        if (!rawGoogleAds || rawGoogleAds.length === 0) console.error("Warning: google_ads empty");

        // 2. Process
        console.log('Processing Data...');
        const processedMag = processBDMag(rawBDMag);
        const processedGA4 = processGA4(rawGA4);

        // Google Ads: row 0 is header
        const googleAdsObjects = rowsToObjects(rawGoogleAds, 0);
        const tvObjects = rowsToObjects(rawTV, 0);
        const metasObjects = rowsToObjects(rawMetas, 0);

        // 3. Sync to DB
        console.log('🔌 Connecting to DB...');

        // Drop old integration_* tables first
        const client = await pool.connect();
        await client.query('DROP TABLE IF EXISTS integration_ga4_temp');
        await client.query('DROP TABLE IF EXISTS integration_bd_mag');
        await client.query('DROP TABLE IF EXISTS integration_ga4');
        await client.query('DROP TABLE IF EXISTS integration_google_ads');
        await client.query('DROP TABLE IF EXISTS integration_ga4_sessions');
        await client.query('DROP TABLE IF EXISTS integration_atribuicao');
        await client.query('DROP TABLE IF EXISTS ga4_sessions'); // Remove this table too
        client.release();

        await syncTable('bd_mag', processedMag);
        await syncTable('ga4', processedGA4);
        await computeGA4Attribution();
        await syncTable('atribuicao', attributionData);
        await syncTable('google_ads', googleAdsObjects);
        await syncTable('tv_sales', tvObjects);
        await syncTable('metas', metasObjects);

        // 4. Create indexes for query performance
        console.log('📊 Creating indexes...');
        const idxClient = await pool.connect();
        try {
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_bd_mag_data ON bd_mag (data)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_bd_mag_status ON bd_mag (status)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_bd_mag_atribuicao ON bd_mag (atribuicao)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_ga4_date ON ga4 (date)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_ga4_atribuicao ON ga4 (atribuicao)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_ga4_session_source ON ga4 (session_source_medium)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_google_ads_date ON google_ads (date)`);
            await idxClient.query(`CREATE INDEX IF NOT EXISTS idx_google_ads_campaign ON google_ads (campaign)`);
            console.log('✅ Indexes created');
        } catch (e) {
            console.error('Warning: Index creation error (non-fatal):', e);
        } finally {
            idxClient.release();
        }

        console.log('🎉 DB Sync Done!');

        // Final cache clear to ensure dashboard sees fresh data
        console.log('🗑️ Final cache clear...');
        await invalidateCache('*');
        console.log('✅ All caches cleared');

        process.exit(0);
    } catch (e) {
        console.error('Fatal Error:', e);
        process.exit(1);
    }
}

main();
