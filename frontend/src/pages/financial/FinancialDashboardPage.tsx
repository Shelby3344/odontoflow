import { useQuery } from '@tanstack/react-query';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function FinancialDashboardPage() {
  // Dashboard financeiro
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: async () => {
      const response = await api.get('/financial/dashboard');
      return response.data.data;
    },
  });

  // Contas a receber
  const { data: receivables } = useQuery({
    queryKey: ['receivables'],
    queryFn: async () => {
      const response = await api.get('/financial/receivables');
      return response.data;
    },
  });

  // Fluxo de caixa
  const { data: cashFlow } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: async () => {
      const response = await api.get('/financial/cash-flow');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const revenueByProcedure = dashboard?.revenue_by_procedure || [];
  const receivablesSummary = receivables?.summary || {};

  // Preparar dados do fluxo de caixa para o gráfico
  const cashFlowData = cashFlow ? Object.entries(cashFlow).map(([date, values]: [string, any]) => ({
    date,
    receita: values.income || 0,
    despesa: values.expense || 0,
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financeiro
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visão geral do mês de {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/financial/transactions">
            <Button variant="outline">Ver Transações</Button>
          </Link>
          <Link to="/financial/budgets">
            <Button variant="outline">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Orçamentos
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {(summary.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">Receita Recebida</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {(summary.pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">A Receber</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {(summary.expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">Despesas</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-bold ${(summary.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(summary.profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">Lucro</p>
          </div>
        </Card>
      </div>

      {/* Alertas de inadimplência */}
      {(receivablesSummary.overdue || 0) > 0 && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                R$ {receivablesSummary.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Verifique as contas a receber vencidas
              </p>
            </div>
            <Link to="/financial/transactions?status=overdue" className="ml-auto">
              <Button variant="outline" size="sm">Ver Detalhes</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa */}
        <Card className="lg:col-span-2 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Fluxo de Caixa
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                  contentStyle={{ 
                    backgroundColor: 'var(--toast-bg)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Receita"
                />
                <Area 
                  type="monotone" 
                  dataKey="despesa" 
                  stackId="2"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Despesa"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Receita por Procedimento */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Receita por Procedimento
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByProcedure}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="procedure_type"
                >
                  {revenueByProcedure.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  contentStyle={{ 
                    backgroundColor: 'var(--toast-bg)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {revenueByProcedure.slice(0, 5).map((item: any, index: number) => (
              <div key={item.procedure_type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                    {item.procedure_type}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  R$ {item.total.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Contas a Receber */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Contas a Receber
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">Vencidas</p>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              R$ {(receivablesSummary.overdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Esta Semana</p>
            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
              R$ {(receivablesSummary.this_week || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Este Mês</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              R$ {(receivablesSummary.this_month || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Futuro</p>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
              R$ {(receivablesSummary.future || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </Card>

      {/* Orçamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Orçamentos Aprovados
            </h3>
            <span className="text-2xl font-bold text-green-600">
              R$ {(summary.approved_budgets || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Total de orçamentos aprovados no período
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Orçamentos Pendentes
            </h3>
            <span className="text-2xl font-bold text-yellow-600">
              R$ {(summary.pending_budgets || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Aguardando aprovação do paciente
          </p>
          <Link to="/financial/budgets?status=pending">
            <Button variant="ghost" size="sm" className="mt-2">
              Ver Orçamentos Pendentes
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default FinancialDashboardPage;
