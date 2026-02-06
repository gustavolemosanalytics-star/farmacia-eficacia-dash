'use server';

import prisma from '@/lib/prisma';

export async function getTableNames() {
    // Return the list of tables we care about
    return ['bd_mag', 'ga4', 'google_ads', 'atribuicao', 'tv_sales', 'metas'];
}

export async function getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    dateColumn?: string,
    startDate?: string,
    endDate?: string,
    columnFilters?: Record<string, string>
) {
    // Whitelist table names to prevent SQL injection
    const allowedTables = ['bd_mag', 'ga4', 'google_ads', 'atribuicao', 'tv_sales', 'metas'];
    if (!allowedTables.includes(tableName)) {
        throw new Error('Invalid table name');
    }

    const offset = (page - 1) * pageSize;

    // Build WHERE clauses
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Date filter
    if (dateColumn && startDate && endDate) {
        whereClauses.push(`${dateColumn} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        params.push(startDate, endDate);
        paramIndex += 2;
    }

    // Column filters
    if (columnFilters) {
        for (const [col, val] of Object.entries(columnFilters)) {
            if (val && val.trim()) {
                // Use ILIKE for case-insensitive partial match
                whereClauses.push(`${col}::text ILIKE $${paramIndex}`);
                params.push(`%${val}%`);
                paramIndex++;
            }
        }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(countQuery, ...params);
    const totalCount = Number(countResult[0]?.count || 0);

    // Get Data
    const dataQuery = `
        SELECT * FROM "${tableName}" 
        ${whereClause}
        ORDER BY id ASC 
        LIMIT ${pageSize} OFFSET ${offset}
    `;
    const data = await prisma.$queryRawUnsafe<any[]>(dataQuery, ...params);

    // Convert BigInt to string for JSON serialization
    const serializedData = data.map(row => {
        const newRow: any = { ...row };
        for (const key in newRow) {
            if (typeof newRow[key] === 'bigint') {
                newRow[key] = newRow[key].toString();
            }
        }
        return newRow;
    });

    return {
        data: serializedData,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
    };
}

export async function getTableColumns(tableName: string): Promise<string[]> {
    const allowedTables = ['bd_mag', 'ga4', 'google_ads', 'atribuicao', 'tv_sales', 'metas'];
    if (!allowedTables.includes(tableName)) {
        throw new Error('Invalid table name');
    }

    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
    `, tableName);

    return result.map(r => r.column_name);
}
