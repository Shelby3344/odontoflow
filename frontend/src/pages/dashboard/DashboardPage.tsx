import { useQuery } from '@tanstack/react-query';
import { 
  UsersIcon, 
  CalendarDaysIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { reportService, patientService, aiService } from '../../services/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardData {
  stats: {
    patients_total: number;
    patients_new_month: number;
    appointments_today: number;
    appointments_pending: number;
    revenue_month: number;
    revenue_growth: number;
    no_show_rate: number;
  };
  appointments_today: Array<{
    id: string;
    time: string;
    patient_name: string;
    type: string;
    status: string;
  }>;
  revenue_chart: Array<{
    date: string;
    value: number;
  }>;
  procedures_chart: Array<{
    name: string;
    count: number;
  }>;
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await reportService.getDashboard();
      return response.data as DashboardData;
    },
  });

  const { data: atRiskPatients } = useQuery({
    queryKey: ['patients-at-risk'],
    queryFn: async () => {
      const response = await patientService.atRisk();
      return response.data.data;
    },
  });

  const { data: aiInsights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const response = await aiService.getFinancialInsights('month');
      return response.data;
    },
  });

  const stats = [
    {
      name: 'Pacientes',
      value: dashboard?.stats.patients_total || 0,
      change: `+${dashboard?.stats.patients_new_month || 0} este mês`,
      changeType: 'positive',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Consultas Hoje',
      value: dashboard?.stats.appointments_today || 0,
      change: `${dashboard?.stats.appointments_pending || 0} pendentes`,
      changeType: 'neutral',
      icon: CalendarDaysIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Receita do Mês',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(dashboard?.stats.revenue_month || 0),
      change: `${dashboard?.stats.revenue_growth || 0}% vs mês anterior`,
      changeType: (dashboard?.stats.revenue_growth || 0) >= 0 ? 'positive' : 'negative',
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Taxa de Faltas',
      value: `${((dashboard?.stats.no_show_rate || 0) * 100).toFixed(1)}%`,
      change: 'últimos 30 dias',
      changeType: (dashboard?.stats.no_show_rate || 0) > 0.15 ? 'negative' : 'positive',
      icon: ClockIcon,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={() => navigate('/schedule')}>
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Ver Agenda
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p
                  className={`mt-1 text-sm flex items-center gap-1 ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {stat.changeType === 'positive' && (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  )}
                  {stat.changeType === 'negative' && (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
                  )}
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader title="Receita" subtitle="Últimos 30 dias" />
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard?.revenue_chart || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-gray-500"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                    className="text-gray-500"
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(value)
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Procedures Chart */}
        <Card>
          <CardHeader title="Procedimentos" subtitle="Mais realizados" />
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.procedures_chart || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Agenda de Hoje"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
                Ver tudo
              </Button>
            }
          />
          <CardContent>
            <div className="space-y-3">
              {dashboard?.appointments_today?.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhuma consulta agendada para hoje
                </p>
              ) : (
                dashboard?.appointments_today?.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white w-16">
                        {apt.time}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {apt.patient_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {apt.type}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : apt.status === 'waiting'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {apt.status === 'confirmed'
                        ? 'Confirmado'
                        : apt.status === 'waiting'
                        ? 'Aguardando'
                        : 'Agendado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights & Alerts */}
        <Card>
          <CardHeader
            title="Insights IA"
            action={<SparklesIcon className="w-5 h-5 text-primary-500" />}
          />
          <CardContent>
            <div className="space-y-4">
              {/* At Risk Patients Alert */}
              {atRiskPatients && atRiskPatients.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {atRiskPatients.length} pacientes em risco
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Pacientes com alto risco de abandono de tratamento
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Generated Insights */}
              {aiInsights?.insights?.slice(0, 3).map((insight: any, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {insight.description}
                  </p>
                  {insight.potential_value > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Potencial: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(insight.potential_value)}
                    </p>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/ai-assistant')}
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Ver mais insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
