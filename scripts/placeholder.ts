import { google } from 'googleapis';
import path from 'path';

async function testBDMag() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'credentials.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1Y2tYFf-Vn1XWc1gA66Y4nZ98M2-iV4Yk_rW6zN_rW6zN'; // I need to get the real ID.
        // Wait, I don't have the ID handy from previous context. I used one in `scripts/test_sheets.ts` presumably. 
        // I should check `scripts/test_sheets.ts` or similar first.
        // But for this tool call, I'll assume I need to find the ID or use the one I found before.
        // Let's first READ the existing script to get the ID.
    } catch (error) {
        console.error('Error:', error);
    }
}
