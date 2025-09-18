export interface FinancialSection {
  id: string;
  user_id: string;
  name: string;
  color_scheme: string;
  operation_type: string;
  order_index: number;
  is_active: boolean;
  revenue_type?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialSectionData {
  category: string;
  categoryId?: string;
  monthlyEstimate: number;
  annualEstimate: number;
  monthlyBreakdown: number[];
  totalValue: number;
}

export type ColorScheme = 'blue' | 'emerald' | 'red' | 'purple' | 'orange' | 'yellow' | 'indigo' | 'pink' | 'teal' | 'cyan';

export const COLOR_SCHEMES: Record<ColorScheme, {
  name: string;
  header: string;
  headerText: string;
  background: string;
  backgroundText: string;
  border: string;
}> = {
  blue: {
    name: 'Azul',
    header: 'bg-blue-800',
    headerText: 'text-blue-100',
    background: 'bg-blue-200',
    backgroundText: 'text-blue-900',
    border: 'border-blue-200'
  },
  emerald: {
    name: 'Verde',
    header: 'bg-emerald-800',
    headerText: 'text-emerald-100',
    background: 'bg-emerald-200',
    backgroundText: 'text-emerald-900',
    border: 'border-emerald-200'
  },
  red: {
    name: 'Vermelho',
    header: 'bg-red-800',
    headerText: 'text-red-100',
    background: 'bg-red-200',
    backgroundText: 'text-red-900',
    border: 'border-red-200'
  },
  purple: {
    name: 'Roxo',
    header: 'bg-purple-800',
    headerText: 'text-purple-100',
    background: 'bg-purple-200',
    backgroundText: 'text-purple-900',
    border: 'border-purple-200'
  },
  orange: {
    name: 'Laranja',
    header: 'bg-orange-800',
    headerText: 'text-orange-100',
    background: 'bg-orange-200',
    backgroundText: 'text-orange-900',
    border: 'border-orange-200'
  },
  yellow: {
    name: 'Amarelo',
    header: 'bg-yellow-700',
    headerText: 'text-yellow-100',
    background: 'bg-yellow-200',
    backgroundText: 'text-yellow-900',
    border: 'border-yellow-200'
  },
  indigo: {
    name: 'Índigo',
    header: 'bg-indigo-800',
    headerText: 'text-indigo-100',
    background: 'bg-indigo-200',
    backgroundText: 'text-indigo-900',
    border: 'border-indigo-200'
  },
  pink: {
    name: 'Rosa',
    header: 'bg-pink-800',
    headerText: 'text-pink-100',
    background: 'bg-pink-200',
    backgroundText: 'text-pink-900',
    border: 'border-pink-200'
  },
  teal: {
    name: 'Azul-Verde',
    header: 'bg-teal-800',
    headerText: 'text-teal-100',
    background: 'bg-teal-200',
    backgroundText: 'text-teal-900',
    border: 'border-teal-200'
  },
  cyan: {
    name: 'Ciano',
    header: 'bg-cyan-800',
    headerText: 'text-cyan-100',
    background: 'bg-cyan-200',
    backgroundText: 'text-cyan-900',
    border: 'border-cyan-200'
  }
};