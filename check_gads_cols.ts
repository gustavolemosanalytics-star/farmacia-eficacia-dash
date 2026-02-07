
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkColumns() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM google_ads LIMIT 1');
        if (res.rows.length > 0) {
            console.log('Columns in google_ads:', Object.keys(res.rows[0]));
            console.log('Sample row:', res.rows[0]);
        } else {
            console.log('Table google_ads is empty');
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkColumns();
