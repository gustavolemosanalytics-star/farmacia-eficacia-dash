"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, differenceInDays, subDays, subYears, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    compareDate?: DateRange;
    setCompareDate?: (date: DateRange | undefined) => void;
    isComparing?: boolean;
    setIsComparing?: (enabled: boolean) => void;
    className?: string;
}

type ComparisonType = 'previous_period' | 'previous_year' | 'custom';

interface PresetOption {
    label: string;
    getValue: () => DateRange;
}

const getPresets = (): PresetOption[] => {
    const today = new Date();
    return [
        { label: "Hoje", getValue: () => ({ from: startOfDay(today), to: endOfDay(today) }) },
        { label: "7D", getValue: () => ({ from: subDays(today, 6), to: today }) },
        { label: "30D", getValue: () => ({ from: subDays(today, 29), to: today }) },
        { label: "Mês", getValue: () => ({ from: startOfMonth(today), to: endOfMonth(today) }) },
        { label: "Mês Ant.", getValue: () => { const lm = subMonths(today, 1); return { from: startOfMonth(lm), to: endOfMonth(lm) }; } },
        { label: "Ano", getValue: () => ({ from: startOfYear(today), to: endOfYear(today) }) },
    ];
};

export function DateRangePicker({
    date,
    setDate,
    compareDate,
    setCompareDate,
    isComparing = false,
    setIsComparing,
    className
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
    const [tempCompareDate, setTempCompareDate] = React.useState<DateRange | undefined>(compareDate); // Add local state
    const [tempIsComparing, setTempIsComparing] = React.useState(isComparing);
    const [comparisonType, setComparisonType] = React.useState<ComparisonType>('previous_period');
    const ref = React.useRef<HTMLDivElement>(null);

    // Sync from props when opening (or when props change while closed, though usually unmounted if conditional)
    // Actually, improved sync logic: only sync if !isOpen or if props changed meaningfully.
    // But simplest is: sync when opening.
    // Sync from props ONLY when opening to avoid interrupting user selection
    React.useEffect(() => {
        if (isOpen) {
            setTempDate(date);
            if (compareDate) setTempCompareDate(compareDate);
            setTempIsComparing(isComparing);
        }
    }, [isOpen]); // Only trigger on open state change

    // Auto-calculate comparison period
    // Auto-calculate comparison period (LOCALLY)
    React.useEffect(() => {
        if (!tempIsComparing || !tempDate?.from || !tempDate.to || comparisonType === 'custom') return;

        let newCompare: DateRange | undefined;
        if (comparisonType === 'previous_period') {
            const days = differenceInDays(tempDate.to, tempDate.from) + 1;
            newCompare = { from: subDays(tempDate.from, days), to: subDays(tempDate.to, days) };
        } else if (comparisonType === 'previous_year') {
            newCompare = { from: subYears(tempDate.from, 1), to: subYears(tempDate.to, 1) };
        }

        if (newCompare) {
            setTempCompareDate(newCompare);
        }
    }, [tempDate, tempIsComparing, comparisonType]);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const handleApply = () => {
        setDate(tempDate);
        if (setIsComparing) setIsComparing(tempIsComparing);
        if (setCompareDate && tempCompareDate) setCompareDate(tempCompareDate); // Commit compare date
        setIsOpen(false);
    };

    const presets = getPresets();

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-violet-400 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                {date?.from ? (
                    <span className="text-xs">
                        {format(date.from, "dd/MM/yy")} - {date.to ? format(date.to, "dd/MM/yy") : "..."}
                    </span>
                ) : (
                    <span className="text-slate-400 text-xs">Período</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 right-0 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 p-3 w-[280px]">

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => setTempDate(preset.getValue())}
                                className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Selected Range Display */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
                        <span>{tempDate?.from ? format(tempDate.from, "dd MMM yyyy", { locale: ptBR }) : "Início"}</span>
                        <span>→</span>
                        <span>{tempDate?.to ? format(tempDate.to, "dd MMM yyyy", { locale: ptBR }) : "Fim"}</span>
                    </div>

                    {/* Compact Calendar */}
                    <style>{`
                        .compact-rdp { --rdp-cell-size: 28px; margin: 0; font-size: 12px; }
                        .compact-rdp .rdp-months { gap: 0 !important; }
                        .compact-rdp .rdp-caption { padding: 0 0 4px 0; }
                        .compact-rdp .rdp-caption_label { font-size: 13px; font-weight: 600; }
                        .compact-rdp .rdp-nav { gap: 2px; }
                        .compact-rdp .rdp-nav_button { width: 24px; height: 24px; }
                        .compact-rdp .rdp-head_cell { font-size: 10px; font-weight: 500; color: #94a3b8; }
                        .compact-rdp .rdp-tbody { background: transparent !important; }
                        .compact-rdp .rdp-cell { background: transparent !important; }
                        .compact-rdp .rdp-day { font-size: 11px; background: transparent; }
                        .compact-rdp .rdp-day_selected { background-color: #7c3aed !important; color: white !important; font-weight: 600; }
                        .compact-rdp .rdp-day_range_middle { background-color: rgba(124, 58, 237, 0.15) !important; }
                        .compact-rdp .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(139, 92, 246, 0.1); }
                    `}</style>

                    <DayPicker
                        mode="range"
                        defaultMonth={tempDate?.from}
                        selected={tempDate}
                        onSelect={setTempDate}
                        numberOfMonths={1}
                        locale={ptBR}
                        showOutsideDays={false}
                        className="compact-rdp text-slate-900 dark:text-slate-100"
                    />

                    {/* Compare Toggle (optional) */}
                    {setIsComparing && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    className="w-3 h-3 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                    checked={tempIsComparing}
                                    onChange={(e) => setTempIsComparing(e.target.checked)}
                                />
                                <span className="text-slate-500 dark:text-slate-400">Comparar</span>
                            </label>
                            {tempIsComparing && (
                                <select
                                    value={comparisonType}
                                    onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
                                    className="text-xs bg-transparent text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer ml-auto"
                                >
                                    <option value="previous_period">Período Ant.</option>
                                    <option value="previous_year">Ano Ant.</option>
                                </select>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

