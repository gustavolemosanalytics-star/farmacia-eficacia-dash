'use server';

import {
    getBdMagData,
    getGa4StoreData,
    getGoogleAdsStoreData,
    getTvSalesStoreData,
    getMetasStoreData,
} from '@/lib/data/sheets-store';

const TABLE_FETCHERS: Record<string, () => Promise<Record<string, any>[]>> = {
    bd_mag: getBdMagData,
    ga4: getGa4StoreData,
    google_ads: getGoogleAdsStoreData,
    tv_sales: getTvSalesStoreData,
    metas: getMetasStoreData,
};

export async function getTableNames() {
    return Object.keys(TABLE_FETCHERS);
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
    const fetcher = TABLE_FETCHERS[tableName];
    if (!fetcher) {
        throw new Error('Invalid table name');
    }

    let data = await fetcher();

    // Apply date filter
    if (dateColumn && startDate && endDate) {
        data = data.filter(row => {
            const val = row[dateColumn];
            if (!val) return false;
            return val >= startDate && val <= endDate;
        });
    }

    // Apply column filters
    if (columnFilters) {
        for (const [col, val] of Object.entries(columnFilters)) {
            if (val && val.trim()) {
                const lower = val.toLowerCase();
                data = data.filter(row =>
                    (row[col] || '').toString().toLowerCase().includes(lower)
                );
            }
        }
    }

    const totalCount = data.length;
    const offset = (page - 1) * pageSize;
    const pageData = data.slice(offset, offset + pageSize);

    return {
        data: pageData,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
    };
}

export async function getTableColumns(tableName: string): Promise<string[]> {
    const fetcher = TABLE_FETCHERS[tableName];
    if (!fetcher) {
        throw new Error('Invalid table name');
    }

    const data = await fetcher();
    if (data.length === 0) return [];
    return Object.keys(data[0]);
}
