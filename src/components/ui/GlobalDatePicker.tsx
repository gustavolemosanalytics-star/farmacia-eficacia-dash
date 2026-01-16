'use client';

import { useFilterStore } from '@/stores/filterStore';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';

export function GlobalDatePicker() {
    const { periodoInicio, periodoFim, setPeriodo } = useFilterStore();

    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from) {
            setPeriodo(range.from, range.to || range.from);
        } else {
            // If cleared, reset to default (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            setPeriodo(thirtyDaysAgo, today);
        }
    };

    return (
        <DateRangePicker
            date={{ from: periodoInicio, to: periodoFim }}
            setDate={handleDateChange}
        />
    );
}
