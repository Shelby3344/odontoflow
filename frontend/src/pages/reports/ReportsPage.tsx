import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CalendarDaysIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const REPORT_TYPES = [
  { id: 'appointments', label: 'Agendamentos', icon: CalendarDaysIcon },
  { id: 'financial', label: 'Financeiro', icon: CurrencyDollarIcon },
  { id: 'patients', label: 'Pacientes', icon: UserGroupIcon },
  { id: 'professionals', label: 'Profissionais', icon: DocumentChartBarIcon },
];

const PERIODS = [
  { id: 'week', label: 'Última Semana' },
  { id: 'month', label: 'Este Mês' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Este Ano' },
];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('appointments');
  const [period, setPeriod] = useState('month');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: subDays(now, 7), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
      case 'year':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();

  // Buscar dados do relatório
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', activeReport, period],
    queryFn: async () => {
      const response = await api.get(`/reports/${activeReport}`, {
        params: {
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
        },
      });
      return response.data.data;
    },
  });

  const handleExport = async () => {
    try {
      const response = await api.get(`/reports/export/${activeReport}`, {
        params: {
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
        },
        responseType: 'blob',
      });
      
      // Download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${activeReport}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const renderAppointmentsReport = () => {
    const summary = reportData?.summary || {};
    const byStatus = reportData?.by_status || {};
    const byDayOfWeek = reportData?.by_day_of_week || {};
    const byHour = reportData?.by_hour || {};

    const statusData = Object.entries(byStatus).map(([status, count]) => ({
      name: status === 'completed' ? 'Concluídos' :
            status === 'cancelled' ? 'Cancelados' :
            status === 'no_show' ? 'Não Compareceu' :
            status === 'scheduled' ? 'Agendados' : status,
      value: count as number,
    }));

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayData = Object.entries(byDayOfWeek).map(([day, count]) => ({
      name: dayNames[parseInt(day)],
      agendamentos: count as number,
    }));

    const hourData = Object.entries(byHour).map(([hour, count]) => ({
      hora: `${hour}h`,
      agendamentos: count as number,
    }));

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{summary.total || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Concluídos</p>
            <p className="text-2xl font-bold text-green-600">{summary.completed || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Taxa de Conclusão</p>
            <p className="text-2xl font-bold">{summary.completion_rate || 0}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Taxa de No-Show</p>
            <p className="text-2xl font-bold text-red-600">{summary.no_show_rate || 0}%</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por Status */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Por Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Por Dia da Semana */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Por Dia da Semana</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="agendamentos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Por Horário */}
          <Card className="p-4 lg:col-span-2">
            <h3 className="font-semibold mb-4">Por Horário</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="agendamentos" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderFinancialReport = () => {
    const summary = reportData?.summary || {};
    const byCategory = reportData?.by_category || {};
    const byPaymentMethod = reportData?.by_payment_method || {};

    const categoryData = Object.entries(byCategory).map(([category, values]: [string, any]) => ({
      name: category,
      receita: values.income || 0,
      despesa: values.expense || 0,
    }));

    const paymentData = Object.entries(byPaymentMethod).map(([method, value]) => ({
      name: method || 'Não informado',
      value: value as number,
    }));

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Receita Total</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {(summary.total_income || 0).toLocaleString('pt-BR')}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Despesas</p>
            <p className="text-2xl font-bold text-red-600">
              R$ {(summary.total_expenses || 0).toLocaleString('pt-BR')}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Lucro</p>
            <p className={`text-2xl font-bold ${(summary.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(summary.profit || 0).toLocaleString('pt-BR')}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Ticket Médio</p>
            <p className="text-2xl font-bold">
              R$ {(summary.average_ticket || 0).toLocaleString('pt-BR')}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por Categoria */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="receita" fill="#10b981" name="Receita" />
                  <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Por Forma de Pagamento */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Por Forma de Pagamento</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {paymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderPatientsReport = () => {
    const summary = reportData?.summary || {};
    const byGender = reportData?.by_gender || [];
    const byAge = reportData?.by_age || {};

    const ageData = Object.entries(byAge).map(([range, count]) => ({
      faixa: range,
      pacientes: count as number,
    }));

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Novos Pacientes</p>
            <p className="text-2xl font-bold text-green-600">{summary.new_patients || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Ativos</p>
            <p className="text-2xl font-bold">{summary.active_patients || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Inativos</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.inactive_patients || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Em Risco</p>
            <p className="text-2xl font-bold text-red-600">{summary.at_risk || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Aniversariantes</p>
            <p className="text-2xl font-bold text-purple-600">{summary.birthdays_this_month || 0}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por Faixa Etária */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Por Faixa Etária</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="faixa" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pacientes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Por Gênero */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Por Gênero</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byGender.map((g: any) => ({ name: g.gender === 'M' ? 'Masculino' : 'Feminino', value: g.count }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderProfessionalsReport = () => {
    const professionals = reportData || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {professionals.map((prof: any) => (
            <Card key={prof.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{prof.name}</h3>
                  <p className="text-sm text-gray-500">{prof.specialty || 'Clínico Geral'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(prof.revenue || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-500">Receita gerada</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Agendamentos</p>
                  <p className="font-semibold">{prof.appointments?.total || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Concluídos</p>
                  <p className="font-semibold text-green-600">{prof.appointments?.completed || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No-Shows</p>
                  <p className="font-semibold text-red-600">{prof.appointments?.no_shows || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ticket Médio</p>
                  <p className="font-semibold">R$ {(prof.average_per_appointment || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {format(dateRange.start, "dd/MM/yyyy")} - {format(dateRange.end, "dd/MM/yyyy")}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        {/* Tipo de Relatório */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveReport(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeReport === type.id
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>

        {/* Período */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
        >
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Conteúdo do Relatório */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {activeReport === 'appointments' && renderAppointmentsReport()}
          {activeReport === 'financial' && renderFinancialReport()}
          {activeReport === 'patients' && renderPatientsReport()}
          {activeReport === 'professionals' && renderProfessionalsReport()}
        </>
      )}
    </div>
  );
}

export default ReportsPage;

