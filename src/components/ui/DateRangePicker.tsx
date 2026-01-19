"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, differenceInDays, subDays, subYears } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
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
        {
            label: "Este Mês",
            getValue: () => ({ from: startOfMonth(today), to: endOfMonth(today) })
        },
        {
            label: "Mês Passado",
            getValue: () => {
                const lastMonth = subMonths(today, 1);
                return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
            }
        },
        {
            label: "Este Trimestre",
            getValue: () => ({ from: startOfQuarter(today), to: endOfQuarter(today) })
        },
        {
            label: "Este Ano",
            getValue: () => ({ from: startOfYear(today), to: endOfYear(today) })
        }
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
    const [comparisonType, setComparisonType] = React.useState<ComparisonType>('previous_period');
    const ref = React.useRef<HTMLDivElement>(null);

    // Auto-update comparison date when main date changes
    React.useEffect(() => {
        if (!isComparing || !date?.from || !date.to || !setCompareDate || comparisonType === 'custom') return;

        if (comparisonType === 'previous_period') {
            const daysDiff = differenceInDays(date.to, date.from); // Difference in days (0 for same day)
            // Previous period should be same duration immediately before
            const rangeDuration = daysDiff + 1;
            const newFrom = subDays(date.from, rangeDuration);
            const newTo = subDays(date.to, rangeDuration);
            setCompareDate({ from: newFrom, to: newTo });
        } else if (comparisonType === 'previous_year') {
            setCompareDate({
                from: subYears(date.from, 1),
                to: subYears(date.to, 1),
            });
        }
    }, [date, isComparing, comparisonType, setCompareDate]);

    // Close on click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Período
                </label>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="
                        flex items-center gap-2 px-4 py-2.5 rounded-xl
                        bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm
                        hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md
                        border border-slate-200/60 dark:border-zinc-700
                        hover:border-primary/50
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                        text-sm font-medium text-slate-700 dark:text-slate-200
                        min-w-[240px] justify-start
                        transition-all duration-200
                        shadow-sm
                    "
                >
                    <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "dd/MM/yyyy")} -{" "}
                                {format(date.to, "dd/MM/yyyy")}
                            </>
                        ) : (
                            format(date.from, "dd/MM/yyyy")
                        )
                    ) : (
                        <span className="text-slate-400 dark:text-slate-500">Selecionar período</span>
                    )}
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-[100] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 text-white w-auto max-w-[95vw] overflow-y-auto max-h-[85vh]">
                    {/* Preset Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-700">
                        {getPresets().map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    setDate(preset.getValue());
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-violet-600 hover:text-white transition-all"
                            >
                                {preset.label}
                            </button>
                        ))}
                        {date?.from && (
                            <button
                                onClick={() => setDate(undefined)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-all flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Limpar
                            </button>
                        )}
                    </div>

                    <style>{`
                        .rdp { --rdp-cell-size: 32px; --rdp-accent-color: #8b5cf6; --rdp-background-color: #8b5cf6; margin: 0; background: transparent !important; }
                        .rdp-months { display: flex !important; flex-direction: row !important; gap: 1.5rem !important; background: transparent !important; }
                        .rdp-month { background: transparent !important; }
                        .rdp-table { background: transparent !important; border-collapse: collapse; }
                        .rdp-day_selected:not([disabled]) { font-weight: bold; background-color: #8b5cf6 !important; color: white !important; }
                        .rdp-day_selected:hover:not([disabled]) { background-color: #7c3aed !important; color: white !important; }
                        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(255,255,255,0.1) !important; }
                        .rdp-caption_label { color: white !important; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
                        .rdp-head_cell { color: #9CA3AF !important; font-size: 0.75rem; font-weight: 500; background: transparent !important; }
                        .rdp-day { color: white !important; font-size: 0.85rem; background: transparent !important; }
                        .rdp-day_outside { opacity: 0.3; }
                        .rdp-nav_button { color: white !important; background: transparent !important; }
                        .rdp-nav_button:hover { background: rgba(255,255,255,0.1) !important; }
                        .rdp-caption_dropdowns { display: flex; gap: 0.5rem; }
                        .rdp-day_range_middle { background-color: rgba(139, 92, 246, 0.3) !important; color: white !important; }
                        .rdp-dropdown { background: #1e293b !important; color: white !important; border: 1px solid #475569 !important; border-radius: 6px; padding: 4px 8px; }
                        .rdp-dropdown option { background: #1e293b !important; color: white !important; }
                        .rdp-vhidden { display: none; }
                        @media (max-width: 640px) {
                           .rdp-months { flex-direction: column !important; }
                        }
                    `}</style>

                    <div className="flex flex-col gap-6">
                        {/* Main Date Picker */}
                        <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase mb-2 tracking-wider">Período Principal</div>
                            <DayPicker
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={ptBR}
                                showOutsideDays={false}
                                captionLayout="dropdown"
                                fromYear={2020}
                                toYear={2030}
                            />
                        </div>

                        {/* Comparison Section */}
                        {setIsComparing && (
                            <div className="border-t border-slate-700 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isComparing}
                                                onChange={(e) => setIsComparing(e.target.checked)}
                                            />
                                            <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-200">Comparar</span>
                                    </label>

                                    {isComparing && (
                                        <select
                                            value={comparisonType}
                                            onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
                                            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none min-w-[140px]"
                                        >
                                            <option value="previous_period">Período Anterior</option>
                                            <option value="previous_year">Ano Anterior</option>
                                            <option value="custom">Personalizado</option>
                                        </select>
                                    )}
                                </div>

                                {isComparing && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <div className="text-xs font-semibold text-slate-400 uppercase mb-2 tracking-wider flex items-center justify-between">
                                            <span>Período de Comparação</span>
                                            {compareDate?.from && (
                                                <span className="font-mono text-slate-300 normal-case bg-slate-800 px-2 py-0.5 rounded">
                                                    {format(compareDate.from, "dd/MM/yyyy")} - {compareDate.to ? format(compareDate.to, "dd/MM/yyyy") : "..."}
                                                </span>
                                            )}
                                        </div>
                                        <DayPicker
                                            mode="range"
                                            defaultMonth={compareDate?.from || subMonths(date?.from || new Date(), 1)}
                                            selected={compareDate}
                                            onSelect={(range) => {
                                                setComparisonType('custom');
                                                setCompareDate?.(range);
                                            }}
                                            numberOfMonths={2}
                                            locale={ptBR}
                                            showOutsideDays={false}
                                            captionLayout="dropdown"
                                            fromYear={2010}
                                            toYear={2030}
                                            modifiers={{
                                                disabled: [] // Disable nothing, allowing selection
                                            }}
                                            modifiersStyles={{
                                                selected: { backgroundColor: '#475569' } // Different color for comparison
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
