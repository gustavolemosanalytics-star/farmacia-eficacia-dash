'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTableNames, getTableData, getTableColumns } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Filter, X, Calendar } from 'lucide-react';

export default function DebugPage() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [columns, setColumns] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [dateColumn, setDateColumn] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        getTableNames().then(names => {
            setTables(names);
            if (names.length > 0) setSelectedTable(names[0]);
        });
    }, []);

    useEffect(() => {
        if (selectedTable) {
            // Reset filters when table changes
            setColumnFilters({});
            setDateColumn('');
            setStartDate('');
            setEndDate('');
            setPage(1);

            // Fetch columns
            getTableColumns(selectedTable).then(cols => {
                setColumns(cols);
                // Auto-detect date column
                const dateCol = cols.find(c => c.includes('date') || c.includes('data') || c === 'day');
                if (dateCol) setDateColumn(dateCol);
            });
        }
    }, [selectedTable]);

    useEffect(() => {
        if (selectedTable) {
            fetchData();
        }
    }, [selectedTable, page]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTableData(
                selectedTable,
                page,
                50,
                dateColumn || undefined,
                startDate || undefined,
                endDate || undefined,
                Object.keys(columnFilters).length > 0 ? columnFilters : undefined
            );
            setData(res.data);
            setTotalPages(res.totalPages);
            setTotalCount(res.totalCount);
        } catch (e) {
            console.error(e);
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [selectedTable, page, dateColumn, startDate, endDate, columnFilters]);

    const applyFilters = () => {
        setPage(1);
        fetchData();
    };

    const clearFilters = () => {
        setColumnFilters({});
        setStartDate('');
        setEndDate('');
        setPage(1);
        fetchData();
    };

    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="container mx-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Database Debugger</h1>
                <div className="flex gap-4 items-center">
                    <Select value={selectedTable} onValueChange={(val) => { setSelectedTable(val); setPage(1); }}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Table" />
                        </SelectTrigger>
                        <SelectContent>
                            {tables.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? "secondary" : "outline"} size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button onClick={fetchData} disabled={loading} size="icon" variant="outline">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-4">
                        {/* Date Filter */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Date:</span>
                            </div>
                            <Select value={dateColumn} onValueChange={setDateColumn}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Date Column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.filter(c => c.includes('date') || c.includes('data') || c === 'day').map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder="Start"
                                value={startDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                                className="w-[150px]"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                                type="date"
                                placeholder="End"
                                value={endDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>

                        {/* Column Filters */}
                        <div className="flex items-start gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Columns:</span>
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {columns.slice(0, 12).map(col => (
                                    <Input
                                        key={col}
                                        placeholder={col}
                                        value={columnFilters[col] || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColumnFilters(prev => ({ ...prev, [col]: e.target.value }))}
                                        className="text-xs h-8"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={applyFilters} size="sm">Apply Filters</Button>
                            <Button onClick={clearFilters} size="sm" variant="ghost">
                                <X className="h-4 w-4 mr-1" /> Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {selectedTable} ({totalCount.toLocaleString()} rows)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto border-t" style={{ maxHeight: '65vh' }}>
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b sticky top-0 bg-background z-10">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    {headers.map(h => (
                                        <th key={h} className="h-10 px-3 text-left align-middle font-medium text-muted-foreground bg-muted/30 text-xs whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                                {/* Sums Row */}
                                {!loading && data.length > 0 && (
                                    <tr className="border-b bg-emerald-50 dark:bg-emerald-900/20 font-semibold">
                                        {headers.map(h => {
                                            // Try to sum numeric values
                                            const values = data.map(row => {
                                                const val = row[h];
                                                if (val === null || val === undefined || val === '') return 0;
                                                // Parse BR format (comma decimal)
                                                const str = String(val).replace(/\./g, '').replace(',', '.');
                                                const num = parseFloat(str);
                                                return isNaN(num) ? 0 : num;
                                            });
                                            const sum = values.reduce((a, b) => a + b, 0);
                                            const isNumeric = values.some(v => v !== 0);
                                            return (
                                                <td key={h} className="p-3 align-middle whitespace-nowrap text-xs text-emerald-700 dark:text-emerald-300">
                                                    {isNumeric ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )}
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loading && (
                                    <tr>
                                        <td colSpan={headers.length || 1} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                )}
                                {!loading && data.length === 0 && (
                                    <tr>
                                        <td colSpan={headers.length || 1} className="h-24 text-center text-muted-foreground">
                                            No data found.
                                        </td>
                                    </tr>
                                )}
                                {!loading && data.map((row, i) => (
                                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                        {headers.map(h => (
                                            <td key={h} className="p-3 align-middle whitespace-nowrap text-xs max-w-[200px] truncate" title={String(row[h] ?? '')}>
                                                {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages || totalPages === 0 || loading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
