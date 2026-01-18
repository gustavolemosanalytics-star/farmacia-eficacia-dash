'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';

interface FilterDropdownProps {
    label: string;
    options: string[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
}

export function FilterDropdown({ label, options, value, onChange, placeholder = 'Todos' }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                    flex items-center justify-between gap-2 px-3 py-2 rounded-lg
                    bg-white dark:bg-zinc-800 
                    border border-slate-200 dark:border-zinc-700
                    hover:border-primary/50
                    text-sm text-slate-700 dark:text-slate-200
                    min-w-[140px] w-full
                    transition-all duration-200
                "
            >
                <span className={value ? '' : 'text-slate-400 dark:text-slate-500'}>
                    {value || placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {value && (
                        <X
                            className="w-3 h-3 text-slate-400 hover:text-red-500 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                        />
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-[200px] overflow-auto">
                    <button
                        onClick={() => { onChange(null); setIsOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-zinc-700 ${!value ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                        {placeholder}
                    </button>
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => { onChange(option); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-zinc-700 ${value === option ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
