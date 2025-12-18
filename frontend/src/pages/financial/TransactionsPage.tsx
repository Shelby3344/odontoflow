import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  CheckIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const response = await api.get('/financial/transactions', { params: filters });
      return response.data;
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (id: string) => api.post(`/financial/transactions/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Pagamento registrado');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transações
        </h1>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </Card>

      {/* Lista */}
      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" />
                </td>
              </tr>
            ) : transactions?.data?.length > 0 ? (
              transactions.data.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                      <p className="text-xs text-gray-500">{tx.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {tx.patient?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(tx.due_date), 'dd/MM/yyyy')}
                  </td>
                  <td className={clsx(
                    'px-4 py-3 text-sm font-medium',
                    tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {tx.type === 'income' ? '+' : '-'} R$ {parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      STATUS_COLORS[tx.status]
                    )}>
                      {tx.status === 'pending' ? 'Pendente' : tx.status === 'paid' ? 'Pago' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tx.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsPaidMutation.mutate(tx.id)}
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default TransactionsPage;
