
import { getSheetData, SHEETS } from '@/lib/sheets/client';
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

async function main() {
    try {
        console.log('🚀 Starting Sheets -> Postgres Sync');
        console.log(`Using spreadsheet: ${HISTORICAL_SPREADSHEET_ID}`);

        // 1. Fetch Raw Data from Historical Spreadsheet
        // Sheet names with spaces need single quotes in range notation
        console.log('Fetching BD Mag...');
        const rawBDMag = await getSheetData("'BD Mag'", undefined, HISTORICAL_SPREADSHEET_ID);

        console.log('Fetching ga4...');
        const rawGA4 = await getSheetData("'ga4'", undefined, HISTORICAL_SPREADSHEET_ID);

        console.log('Fetching google_ads...');
        const rawGoogleAds = await getSheetData("'google_ads'", undefined, HISTORICAL_SPREADSHEET_ID);

        // 1b. Fetch Attribution CSV
        console.log('Reading Attribution CSV...');
        const attributionData = getAttributionData();

        if (!rawBDMag || rawBDMag.length === 0) console.error("Warning: BD Mag empty");
        if (!rawGA4 || rawGA4.length === 0) console.error("Warning: ga4 empty");
        if (!rawGoogleAds || rawGoogleAds.length === 0) console.error("Warning: google_ads empty");

        // 2. Process
        console.log('Processing Data...');
        const processedMag = processBDMag(rawBDMag, rawGA4);
        const processedGA4 = processGA4(rawGA4, rawBDMag, attributionData, rawGoogleAds);

        // Google Ads: row 0 is header
        const googleAdsObjects = rowsToObjects(rawGoogleAds, 0);

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
        await syncTable('atribuicao', attributionData);
        await syncTable('google_ads', googleAdsObjects);

        console.log('🎉 DB Sync Done!');

        process.exit(0);
    } catch (e) {
        console.error('Fatal Error:', e);
        process.exit(1);
    }
}

main();
