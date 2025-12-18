import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, Column, Pagination } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import api from '../../services/api';
import './PatientsPage.css';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  age: number;
  status: 'active' | 'inactive';
  last_visit_at: string | null;
  metrics: {
    attendance_score: number;
    risk_score: number;
  };
}

export const PatientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadPatients();
  }, [currentPage, search]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((currentPage - 1) * 20),
        ...(search && { q: search })
      });
      const response = await api.get(`/patients?${params}`);
      setPatients(response.data.data);
      setTotal(response.data.meta.total);
      setTotalPages(Math.ceil(response.data.meta.total / 20));
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Paciente',
      render: (_, patient) => (
        <div className="patient-cell">
          <div className="patient-avatar">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="patient-info">
            <span className="patient-name">{patient.name}</span>
            <span className="patient-email">{patient.email || '-'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (value) => value || '-'
    },
    {
      key: 'age',
      header: 'Idade',
      width: '80px',
      render: (value) => value ? `${value} anos` : '-'
    },
    {
      key: 'last_visit_at',
      header: 'Última Visita',
      render: (value) => formatDate(value)
    },
    {
      key: 'metrics',
      header: 'Score',
      width: '100px',
      render: (_, patient) => {
        const score = patient.metrics.attendance_score;
        const color = score >= 0.8 ? 'var(--success-500)' : score >= 0.6 ? 'var(--warning-500)' : 'var(--danger-500)';
        return (
          <div className="score-indicator">
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${score * 100}%`, background: color }} />
            </div>
            <span style={{ color }}>{Math.round(score * 100)}%</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (_, patient) => (
        <button
          className="table-action-btn"
          onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )
    }
  ];

  return (
    <div className="patients-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">{total} pacientes cadastrados</p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" onClick={() => navigate('/patients/new')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-row">
          <div className="search-wrapper">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              leftIcon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
          </div>
          <div className="filter-buttons">
            <Button variant="ghost" size="sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              Filtros
            </Button>
            <Button variant="ghost" size="sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={patients}
          loading={loading}
          onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
          emptyMessage="Nenhum paciente encontrado"
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
};

export default PatientsListPage;
