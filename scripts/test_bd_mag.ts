import { google } from 'googleapis';
import path from 'path';

// Spreadsheet ID extracted from the URL
const SPREADSHEET_ID = '198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA';
const BD_MAG = 'BD Mag';

async function testBDMag() {
    try {
        console.log('Authenticating...');
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'credentials.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client as any });

        console.log(`Fetching ${BD_MAG} data...`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: BD_MAG,
        });

        const data = response.data.values;

        if (!data || data.length === 0) {
            console.log('No data found in BD Mag');
            return;
        }

        console.log(`Found ${data.length} rows`);
        console.log('Headers:', data[0]);
        console.log('First Row:', data[1]);
        if (data.length > 2) console.log('Second Row:', data[2]);

    } catch (error) {
        console.error('Error testing BD Mag:', error);
    }
}

testBDMag();
