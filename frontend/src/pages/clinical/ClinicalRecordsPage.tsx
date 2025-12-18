import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusIcon, 
  SparklesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ClinicalRecordsPage() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Prontuários Clínicos
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAIAssistant(true)}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            Gerar com IA
          </Button>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nova Evolução
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <SparklesIcon className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              Prontuário Inteligente com IA
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Descreva o atendimento de forma resumida e a IA irá gerar uma evolução clínica 
              completa e formatada profissionalmente. Você pode revisar e editar antes de salvar.
            </p>
            <Button onClick={() => setShowAIAssistant(true)}>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Começar com IA
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de prontuários recentes */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Evoluções Recentes
        </h3>
        <div className="space-y-4">
          {/* Placeholder - em produção, buscar do backend */}
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma evolução registrada ainda</p>
            <p className="text-sm mt-2">
              Selecione um paciente e crie a primeira evolução clínica
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
