'use client';

import * as React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker'; // Keep type for compatibility

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';

// Register locale for react-datepicker
registerLocale('pt-BR', ptBR);

interface DatePickerWithRangeProps {
    className?: string;
    date?: DateRange;
    setDate?: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    // Local state to manage the inputs of react-datepicker
    const [startDate, setStartDate] = React.useState<Date | undefined>(date?.from);
    const [endDate, setEndDate] = React.useState<Date | undefined>(date?.to);

    // Sync external props with local state
    React.useEffect(() => {
        setStartDate(date?.from);
        setEndDate(date?.to);
    }, [date]);

    const onChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start || undefined);
        setEndDate(end || undefined);

        if (setDate) {
            setDate({
                from: start || undefined,
                to: end || undefined,
            });
        }
    };

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                            'w-[300px] justify-start text-left font-normal bg-background border-input hover:bg-accent hover:text-accent-foreground',
                            !startDate && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                            endDate ? (
                                <>
                                    {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                                    {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
                                </>
                            ) : (
                                format(startDate, 'dd/MM/yyyy', { locale: ptBR })
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="end">
                    <div className="p-2 bg-popover rounded-md border text-popover-foreground shadow-md">
                        <style>{`
                            .react-datepicker {
                                font-family: inherit;
                                background-color: transparent;
                                border: none;
                            }
                            .react-datepicker__header {
                                background-color: transparent;
                                border-bottom: none;
                            }
                            .react-datepicker__day-name {
                                color: var(--muted-foreground);
                            }
                            .react-datepicker__current-month {
                                color: var(--foreground);
                                font-weight: 600;
                            }
                            .react-datepicker__day {
                                color: var(--foreground);
                            }
                            .react-datepicker__day:hover {
                                background-color: var(--accent);
                                color: var(--accent-foreground);
                            }
                            .react-datepicker__day--selected, .react-datepicker__day--in-range {
                                background-color: var(--primary) !important;
                                color: var(--primary-foreground) !important;
                            }
                            .react-datepicker__day--keyboard-selected {
                                background-color: var(--accent);
                                color: var(--accent-foreground);
                            }
                            .react-datepicker__triangle {
                                display: none;
                            }
                        `}</style>
                        <DatePicker
                            selected={startDate}
                            onChange={onChange}
                            startDate={startDate}
                            endDate={endDate}
                            selectsRange
                            inline
                            locale="pt-BR"
                            monthsShown={2}
                            calendarClassName="flex gap-4"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
