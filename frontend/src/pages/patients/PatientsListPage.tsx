import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { patientService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { clsx } from 'clsx';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  age: number;
  status: string;
  last_visit_at: string;
  metrics: {
    attendance_score: number;
    risk_score: number;
  };
}

export function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, statusFilter, page],
    queryFn: async () => {
      const response = await patientService.list({
        q: search || undefined,
        status: statusFilter || undefined,
        limit,
        offset: page * limit,
      });
      return response.data;
    },
  });

  const patients = data?.data || [];
  const meta = data?.meta || { total: 0, has_more: false };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      blocked: 'Bloqueado',
    };

    return (
      <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRiskIndicator = (score: number) => {
    if (score < 0.3) return null;
    if (score < 0.6) {
      return (
        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
          Risco médio
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
        Alto risco
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pacientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {meta.total} pacientes cadastrados
          </p>
        </div>
        <Button onClick={() => navigate('/patients/new')}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter || ''}
              onChange={(e) => {
                setStatusFilter(e.target.value || null);
                setPage(0);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="blocked">Bloqueados</option>
            </select>

            <Button variant="outline">
              <FunnelIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Visita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risco
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full skeleton" />
                        <div className="space-y-2">
                          <div className="w-32 h-4 skeleton" />
                          <div className="w-20 h-3 skeleton" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-40 h-4 skeleton" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-4 skeleton" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-6 skeleton rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-20 h-6 skeleton rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 skeleton rounded" />
                    </td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum paciente encontrado
                    </p>
                  </td>
                </tr>
              ) : (
                patients.map((patient: Patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-primary-700 dark:text-primary-300 font-semibold">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {patient.name}
                          </p>
                          {patient.age && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {patient.age} anos
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">
                          {patient.phone}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {patient.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {patient.last_visit_at
                        ? format(new Date(patient.last_visit_at), 'dd/MM/yyyy')
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(patient.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getRiskIndicator(patient.metrics?.risk_score || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open menu
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > limit && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, meta.total)} de {meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.has_more}
                onClick={() => setPage(page + 1)}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
