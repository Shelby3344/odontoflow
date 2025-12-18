import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Odontogram, OdontogramData, ToothCondition } from '../../components/odontogram/Odontogram';
import { ToothModal } from '../../components/odontogram/ToothModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export function OdontogramPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition | null>(null);

  // Buscar dados do odontograma
  const { data: odontogramData, isLoading } = useQuery({
    queryKey: ['odontogram', patientId],
    queryFn: async () => {
      const response = await api.get(`/patients/${patientId}/odontogram`);
      return response.data.data;
    },
    enabled: !!patientId,
  });

  // Buscar análise da IA
  const { data: aiAnalysis } = useQuery({
    queryKey: ['odontogram-analysis', patientId],
    queryFn: async () => {
      const response = await api.get(`/odontogram/${patientId}/analysis`);
      return response.data.data;
    },
    enabled: !!patientId,
  });

  // Buscar histórico
  const { data: history } = useQuery({
    queryKey: ['odontogram-history', patientId],
    queryFn: async () => {
      const response = await api.get(`/odontogram/${patientId}/history`);
      return response.data.data;
    },
    enabled: !!patientId,
  });

  // Mutation para atualizar dente
  const updateToothMutation = useMutation({
    mutationFn: async ({ toothNumber, condition }: { toothNumber: string; condition: ToothCondition }) => {
      const response = await api.put(`/odontogram/${patientId}/tooth/${toothNumber}`, condition);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram', patientId] });
      queryClient.invalidateQueries({ queryKey: ['odontogram-history', patientId] });
      toast.success('Dente atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar dente');
    },
  });

  const handleToothClick = (toothNumber: string, condition: ToothCondition | null) => {
    setSelectedTooth(toothNumber);
    setSelectedCondition(condition);
  };

  const handleSaveTooth = (toothNumber: string, condition: ToothCondition) => {
    updateToothMutation.mutate({ toothNumber, condition });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const teethData: OdontogramData = odontogramData?.teeth_data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Odontograma
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Clique em um dente para registrar procedimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ClockIcon className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Odontograma Principal */}
        <div className="lg:col-span-2">
          <Odontogram
            data={teethData}
            onToothClick={handleToothClick}
            type={odontogramData?.type || 'permanent'}
          />
        </div>

        {/* Painel Lateral */}
        <div className="space-y-4">
          {/* Análise da IA */}
          {aiAnalysis && (aiAnalysis.suggestions?.length > 0 || aiAnalysis.treatment_priority?.length > 0) && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Análise da IA
                </h3>
              </div>

              {aiAnalysis.treatment_priority?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridades de Tratamento
                  </h4>
                  <div className="space-y-2">
                    {aiAnalysis.treatment_priority.map((item: any, i: number) => (
                      <div 
                        key={i}
                        className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiAnalysis.suggestions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sugestões
                  </h4>
                  <ul className="space-y-1">
                    {aiAnalysis.suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.risk_areas?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    ⚠️ Áreas de Risco
                  </h4>
                  {aiAnalysis.risk_areas.map((risk: any, i: number) => (
                    <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                      {risk.message}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Histórico Recente */}
          {history && history.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Histórico Recente
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.slice(0, 10).map((item: any) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium">Dente {item.tooth_number}</span>
                      <span className="text-gray-500 ml-2">
                        {item.change_type === 'create' ? 'Criado' : 'Atualizado'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resumo */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Resumo
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Saudáveis', color: 'bg-green-500', count: Object.values(teethData).filter((t: any) => t.status === 'healthy').length },
                { label: 'Cáries', color: 'bg-red-500', count: Object.values(teethData).filter((t: any) => t.status === 'cavity').length },
                { label: 'Restaurações', color: 'bg-blue-500', count: Object.values(teethData).filter((t: any) => t.status === 'restoration').length },
                { label: 'Ausentes', color: 'bg-gray-400', count: Object.values(teethData).filter((t: any) => t.status === 'missing').length },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.label}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de edição do dente */}
      <ToothModal
        isOpen={selectedTooth !== null}
        onClose={() => {
          setSelectedTooth(null);
          setSelectedCondition(null);
        }}
        toothNumber={selectedTooth || ''}
        condition={selectedCondition}
        onSave={handleSaveTooth}
      />
    </div>
  );
}

export default OdontogramPage;
