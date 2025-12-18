import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { AppointmentsList, Appointment } from '../../components/dashboard/AppointmentsList';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import './DashboardPage.css';

interface DashboardData {
  stats: {
    patients: { total: number; new_month: number; growth: number };
    appointments: { today: number; pending: number; month: number; completed_month: number; no_show_rate: number };
    financial: { revenue_month: number; revenue_growth: number; pending: number; overdue: number };
  };
  appointments_today: Appointment[];
  charts: {
    revenue: { date: string; total: number }[];
    appointments: { date: string; total: number; completed: number; no_show: number }[];
    top_procedures: { procedure_type: string; count: number; revenue: number }[];
  };
  alerts: { type: string; title: string; message: string; action: string }[];
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">{getGreeting()}! 👋</h1>
          <p className="page-subtitle">Aqui está o resumo da sua clínica hoje</p>
        </div>
        <div className="page-header-actions">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Ver Relatórios
          </Button>
          <Button variant="primary" onClick={() => navigate('/schedule/new')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Consultas Hoje"
          value={data?.stats.appointments.today ?? 0}
          change={data?.stats.appointments.no_show_rate ? -data.stats.appointments.no_show_rate : undefined}
          changeLabel={`${data?.stats.appointments.pending ?? 0} pendentes`}
          trend={data?.stats.appointments.no_show_rate && data.stats.appointments.no_show_rate > 10 ? 'down' : 'neutral'}
          iconColor="primary"
          loading={loading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
        />
        <StatsCard
          title="Pacientes Ativos"
          value={data?.stats.patients.total ?? 0}
          change={data?.stats.patients.growth}
          changeLabel={`${data?.stats.patients.new_month ?? 0} novos este mês`}
          trend={data?.stats.patients.growth && data.stats.patients.growth > 0 ? 'up' : 'neutral'}
          iconColor="secondary"
          loading={loading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatsCard
          title="Receita do Mês"
          value={formatCurrency(data?.stats.financial.revenue_month ?? 0)}
          change={data?.stats.financial.revenue_growth}
          changeLabel="vs. mês anterior"
          trend={data?.stats.financial.revenue_growth && data.stats.financial.revenue_growth > 0 ? 'up' : 'down'}
          iconColor="success"
          loading={loading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatsCard
          title="A Receber"
          value={formatCurrency(data?.stats.financial.pending ?? 0)}
          changeLabel={data?.stats.financial.overdue ? `${formatCurrency(data.stats.financial.overdue)} em atraso` : undefined}
          iconColor={data?.stats.financial.overdue && data.stats.financial.overdue > 0 ? 'danger' : 'warning'}
          loading={loading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <Card className="appointments-card" padding="none">
          <CardHeader action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
              Ver agenda completa
            </Button>
          }>
            <CardTitle subtitle={`${data?.appointments_today.length ?? 0} agendamentos`}>
              Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentsList
              appointments={data?.appointments_today ?? []}
              loading={loading}
              onAppointmentClick={(apt) => navigate(`/schedule/${apt.id}`)}
            />
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="alerts-card" padding="none">
          <CardHeader>
            <CardTitle subtitle="Ações recomendadas">
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="alerts-loading">
                {[1, 2, 3].map(i => (
                  <div key={i} className="alert-skeleton">
                    <div className="skeleton skeleton-alert-icon" />
                    <div className="skeleton-content">
                      <div className="skeleton skeleton-alert-title" />
                      <div className="skeleton skeleton-alert-message" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.alerts && data.alerts.length > 0 ? (
              <div className="alerts-list">
                {data.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`alert-item alert-${alert.type}`}
                    onClick={() => navigate(alert.action)}
                  >
                    <div className="alert-icon">
                      {alert.type === 'danger' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4M12 16h.01" />
                        </svg>
                      )}
                      {alert.type === 'warning' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <path d="M12 9v4M12 17h.01" />
                        </svg>
                      )}
                      {alert.type === 'info' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                      )}
                      {alert.type === 'success' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                      )}
                    </div>
                    <div className="alert-content">
                      <span className="alert-title">{alert.title}</span>
                      <span className="alert-message">{alert.message}</span>
                    </div>
                    <svg className="alert-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alerts-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <p>Tudo em ordem! Nenhum alerta no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Procedures */}
        <Card className="procedures-card" padding="none">
          <CardHeader action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports/procedures')}>
              Ver todos
            </Button>
          }>
            <CardTitle subtitle="Mais realizados este mês">
              Procedimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="procedures-loading">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="procedure-skeleton">
                    <div className="skeleton skeleton-procedure-name" />
                    <div className="skeleton skeleton-procedure-bar" />
                  </div>
                ))}
              </div>
            ) : data?.charts.top_procedures && data.charts.top_procedures.length > 0 ? (
              <div className="procedures-list">
                {data.charts.top_procedures.map((proc, index) => {
                  const maxRevenue = Math.max(...data.charts.top_procedures.map(p => p.revenue));
                  const percentage = (proc.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="procedure-item">
                      <div className="procedure-info">
                        <span className="procedure-name">{proc.procedure_type}</span>
                        <span className="procedure-stats">
                          {proc.count}x • {formatCurrency(proc.revenue)}
                        </span>
                      </div>
                      <div className="procedure-bar">
                        <div
                          className="procedure-bar-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="procedures-empty">
                <p>Nenhum procedimento registrado este mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="quick-actions-card">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="quick-actions-grid">
              <button className="quick-action" onClick={() => navigate('/patients/new')}>
                <div className="quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <path d="M20 8v6M23 11h-6" />
                  </svg>
                </div>
                <span>Novo Paciente</span>
              </button>
              <button className="quick-action" onClick={() => navigate('/financial/transactions/new')}>
                <div className="quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <path d="M1 10h22" />
                  </svg>
                </div>
                <span>Registrar Pagamento</span>
              </button>
              <button className="quick-action" onClick={() => navigate('/financial/budgets/new')}>
                <div className="quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </div>
                <span>Criar Orçamento</span>
              </button>
              <button className="quick-action" onClick={() => navigate('/ai')}>
                <div className="quick-action-icon quick-action-icon-ai">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                    <circle cx="7.5" cy="14.5" r="1.5" />
                    <circle cx="16.5" cy="14.5" r="1.5" />
                  </svg>
                </div>
                <span>Assistente IA</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
