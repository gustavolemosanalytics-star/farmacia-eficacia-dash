// Tipos principais do dashboard

export interface KPIData {
  id: string;
  titulo: string;
  valor: number;
  valorFormatado: string;
  variacao: number;
  meta?: number;
  tendencia: 'up' | 'down' | 'stable';
  sparklineData: number[];
  unidade?: string;
}

export interface FunnelStep {
  nome: string;
  valor: number;
  taxa: number;
  variacaoTaxa: number;
}

export interface AlertaData {
  id: string;
  tipo: 'critical' | 'warning' | 'info';
  titulo: string;
  descricao: string;
  timestamp: string;
  impacto?: string;
}

export interface AcaoIA {
  id: string;
  prioridade: 'P0' | 'P1' | 'P2';
  hipotese: string;
  evidencia: string;
  acao: string;
  responsavel: string;
  impactoEstimado: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
}

export interface ContribuicaoDriver {
  dimensao: string;
  valor: string;
  impacto: number; // -100 a +100
  variacao: number;
}

export interface HeatmapData {
  categoria: string;
  items: {
    nome: string;
    valor: number;
    variacao: number;
  }[];
}

export interface Comparacao {
  tipo: 'DoD' | 'WoW' | 'MoM' | 'YoY' | 'Rolling7' | 'Rolling30';
  label: string;
}

export interface FiltrosGlobais {
  periodoInicio: Date;
  periodoFim: Date;
  granularidade: 'day' | 'week' | 'month';
  canais: string[];
  dispositivos: string[];
  regioes: string[];
  categorias: string[];
  tipoCliente: 'all' | 'new' | 'returning';
  comparacao: Comparacao;
}

export interface NavItem {
  titulo: string;
  href: string;
  icone: string;
  grupo: 'ceo' | 'marketing' | 'cro' | 'crm' | 'operacao' | 'dados';
  badge?: string;
}

export interface TimeSeriesPoint {
  data: string;
  valor: number;
  comparativo?: number;
}
