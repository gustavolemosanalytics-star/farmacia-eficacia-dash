import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subDays } from 'date-fns';

export type Granularidade = 'day' | 'week' | 'month';
export type TipoComparacao = 'DoD' | 'WoW' | 'MoM' | 'YoY' | 'Rolling7' | 'Rolling30';
export type TipoCliente = 'all' | 'new' | 'returning';

interface FilterState {
    // Período
    periodoInicio: Date;
    periodoFim: Date;
    granularidade: Granularidade;

    // Dimensões
    canais: string[];
    dispositivos: string[];
    regioes: string[];
    categorias: string[];
    tipoCliente: TipoCliente;

    // Comparação
    comparacao: TipoComparacao;

    // Ações
    setPeriodo: (inicio: Date, fim: Date) => void;
    setGranularidade: (granularidade: Granularidade) => void;
    setCanais: (canais: string[]) => void;
    setDispositivos: (dispositivos: string[]) => void;
    setRegioes: (regioes: string[]) => void;
    setCategorias: (categorias: string[]) => void;
    setTipoCliente: (tipo: TipoCliente) => void;
    setComparacao: (comparacao: TipoComparacao) => void;
    resetFilters: () => void;
}

// Use fixed dates to avoid hydration mismatch (server vs client time difference)
const getInitialDates = () => {
    const now = new Date();
    // Set to start of today to avoid time component causing hydration issues
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { inicio: thirtyDaysAgo, fim: today };
};

const dates = getInitialDates();

const initialState = {
    periodoInicio: dates.inicio,
    periodoFim: dates.fim,
    granularidade: 'day' as Granularidade,
    canais: [],
    dispositivos: [],
    regioes: [],
    categorias: [],
    tipoCliente: 'all' as TipoCliente,
    comparacao: 'MoM' as TipoComparacao,
};

export const useFilterStore = create<FilterState>()(
    persist(
        (set) => ({
            ...initialState,

            setPeriodo: (inicio, fim) => set({ periodoInicio: inicio, periodoFim: fim }),
            setGranularidade: (granularidade) => set({ granularidade }),
            setCanais: (canais) => set({ canais }),
            setDispositivos: (dispositivos) => set({ dispositivos }),
            setRegioes: (regioes) => set({ regioes }),
            setCategorias: (categorias) => set({ categorias }),
            setTipoCliente: (tipoCliente) => set({ tipoCliente }),
            setComparacao: (comparacao) => set({ comparacao }),
            resetFilters: () => set(initialState),
        }),
        {
            name: 'war-room-filters',
            partialize: (state) => ({
                granularidade: state.granularidade,
                canais: state.canais,
                dispositivos: state.dispositivos,
                comparacao: state.comparacao,
            }),
        }
    )
);

// Labels em português
export const comparacaoLabels: Record<TipoComparacao, string> = {
    DoD: 'Dia anterior',
    WoW: 'Semana anterior',
    MoM: 'Mês anterior',
    YoY: 'Ano anterior',
    Rolling7: 'Média 7 dias',
    Rolling30: 'Média 30 dias',
};

export const granularidadeLabels: Record<Granularidade, string> = {
    day: 'Diário',
    week: 'Semanal',
    month: 'Mensal',
};

export const tipoClienteLabels: Record<TipoCliente, string> = {
    all: 'Todos',
    new: 'Novos',
    returning: 'Recorrentes',
};
