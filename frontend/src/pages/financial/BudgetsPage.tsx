import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  CheckIcon,
  PaperAirplaneIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

export function BudgetsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', statusFilter],
    queryFn: async () => {
      const response = await api.get('/financial/budgets', { 
        params: statusFilter ? { status: statusFilter } : {} 
      });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/financial/budgets/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento aprovado');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/financial/budgets/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento enviado ao paciente');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orçamentos
        </h1>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              statusFilter === status
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
            )}
          >
            {status === '' ? 'Todos' : 
             status === 'pending' ? 'Pendentes' :
             status === 'approved' ? 'Aprovados' : 'Rejeitados'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : budgets?.data?.length > 0 ? (
          budgets.data.map((budget: any) => (
            <Card key={budget.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {budget.patient?.name}
                    </h3>
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      STATUS_COLORS[budget.status]
                    )}>
                      {budget.status === 'pending' ? 'Pendente' : 
                       budget.status === 'approved' ? 'Aprovado' : 
                       budget.status === 'rejected' ? 'Rejeitado' : 'Expirado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Criado em {format(new Date(budget.created_at), 'dd/MM/yyyy')} • 
                    Válido até {format(new Date(budget.valid_until), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {parseFloat(budget.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {budget.discount > 0 && (
                    <p className="text-sm text-green-600">
                      Desconto: R$ {parseFloat(budget.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>

              {/* Itens */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Itens do orçamento:
                </p>
                <div className="space-y-1">
                  {budget.items?.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.procedure} {item.tooth && `(Dente ${item.tooth})`}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        R$ {parseFloat(item.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {budget.items?.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{budget.items.length - 3} itens
                    </p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <Button variant="ghost" size="sm">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Ver Detalhes
                </Button>
                {budget.status === 'pending' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => sendMutation.mutate(budget.id)}
                    >
                      <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                      Enviar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => approveMutation.mutate(budget.id)}
                    >
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum orçamento encontrado</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default BudgetsPage;
