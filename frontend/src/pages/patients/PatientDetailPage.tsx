import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  PhoneIcon, 
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['patient-transactions', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}/transactions`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Paciente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-primary-700 dark:text-primary-300 font-bold text-2xl">
              {patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {patient.name}
            </h1>
            <p className="text-gray-500">
              Paciente desde {format(new Date(patient.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/patients/${id}/odontogram`}>
            <Button variant="outline">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Odontograma
            </Button>
          </Link>
          <Link to={`/patients/${id}/edit`}>
            <Button variant="outline">
              <PencilIcon className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações */}
        <Card className="p-4 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Informações Pessoais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{patient.phone}</p>
                </div>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{patient.email}</p>
                </div>
              </div>
            )}
            {patient.birth_date && (
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Data de Nascimento</p>
                  <p className="font-medium">
                    {format(new Date(patient.birth_date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            )}
            {patient.address_city && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Cidade</p>
                  <p className="font-medium">
                    {patient.address_city} - {patient.address_state}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Métricas */}
        <Card className="p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Métricas
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Score de Comparecimento</span>
                <span className="font-medium">
                  {Math.round((patient.attendance_score || 1) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(patient.attendance_score || 1) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Engajamento</span>
                <span className="font-medium">
                  {Math.round((patient.engagement_score || 0.5) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(patient.engagement_score || 0.5) * 100}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">Última visita</p>
              <p className="font-medium">
                {patient.last_visit_at 
                  ? format(new Date(patient.last_visit_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Nunca'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Financeiro */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Financeiro
          </h2>
          <Link to={`/financial/transactions?patient_id=${id}`}>
            <Button variant="ghost" size="sm">Ver Todas</Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600">Pago</p>
            <p className="text-xl font-bold text-green-700">
              R$ {(transactions?.summary?.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-600">Pendente</p>
            <p className="text-xl font-bold text-yellow-700">
              R$ {(transactions?.summary?.total_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600">Em Atraso</p>
            <p className="text-xl font-bold text-red-700">
              R$ {(transactions?.summary?.overdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={`/schedule?patient_id=${id}`}>
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <CalendarDaysIcon className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium">Agendar Consulta</p>
          </Card>
        </Link>
        <Link to={`/patients/${id}/odontogram`}>
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <DocumentTextIcon className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium">Odontograma</p>
          </Card>
        </Link>
        <Link to={`/financial/budgets?patient_id=${id}`}>
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <CurrencyDollarIcon className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium">Novo Orçamento</p>
          </Card>
        </Link>
        <Link to={`/clinical?patient_id=${id}`}>
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <DocumentTextIcon className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium">Prontuário</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default PatientDetailPage;
