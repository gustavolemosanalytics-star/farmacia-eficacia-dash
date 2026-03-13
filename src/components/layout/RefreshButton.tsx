'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RefreshButton() {
    const [loading, setLoading] = useState(false);

    async function handleRefresh() {
        setLoading(true);
        try {
            const res = await fetch('/api/refresh', { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                window.location.reload();
            } else {
                console.error('Refresh failed:', json.error);
                setLoading(false);
            }
        } catch (err) {
            console.error('Refresh error:', err);
            setLoading(false);
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            title="Atualizar dados do Google Sheets"
            className="h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
    );
}
