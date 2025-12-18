import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'chat' | 'evolution' | 'diagnosis' | 'treatment';
}

const QUICK_ACTIONS = [
  { 
    id: 'evolution', 
    label: 'Gerar Evolução', 
    icon: DocumentTextIcon,
    description: 'Gere uma evolução clínica a partir de um resumo',
  },
  { 
    id: 'diagnosis', 
    label: 'Sugerir Diagnóstico', 
    icon: BeakerIcon,
    description: 'Obtenha sugestões de diagnóstico baseadas em sintomas',
  },
  { 
    id: 'treatment', 
    label: 'Plano de Tratamento', 
    icon: ClipboardDocumentListIcon,
    description: 'Sugira um plano de tratamento completo',
  },
  { 
    id: 'chat', 
    label: 'Chat Livre', 
    icon: ChatBubbleLeftRightIcon,
    description: 'Converse livremente sobre qualquer tema odontológico',
  },
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<string>('chat');
  const [patientId, setPatientId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mutation para chat
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post('/ai/chat', { message });
      return response.data.data;
    },
    onSuccess: (data) => {
      addMessage('assistant', data.response, 'chat');
    },
    onError: () => {
      addMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.', 'chat');
    },
  });

  // Mutation para evolução
  const evolutionMutation = useMutation({
    mutationFn: async (summary: string) => {
      const response = await api.post('/ai/evolution', { 
        patient_id: patientId || '00000000-0000-0000-0000-000000000000',
        summary,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      addMessage('assistant', data.evolution, 'evolution');
    },
  });

  // Mutation para diagnóstico
  const diagnosisMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      const response = await api.post('/ai/diagnosis', { 
        patient_id: patientId || '00000000-0000-0000-0000-000000000000',
        symptoms: symptoms.split(',').map(s => s.trim()),
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      const diagnosisText = data.diagnoses
        .map((d: any) => `• ${d.name} (${Math.round(d.probability * 100)}% probabilidade)`)
        .join('\n');
      
      let response = `**Diagnósticos Sugeridos:**\n${diagnosisText}`;
      
      if (data.recommendations?.length > 0) {
        response += `\n\n**Recomendações:**\n${data.recommendations.map((r: string) => `• ${r}`).join('\n')}`;
      }
      
      addMessage('assistant', response, 'diagnosis');
    },
  });

  // Mutation para tratamento
  const treatmentMutation = useMutation({
    mutationFn: async (diagnosis: string) => {
      const response = await api.post('/ai/treatment', { 
        patient_id: patientId || '00000000-0000-0000-0000-000000000000',
        diagnosis,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      const planText = data.treatment_plan
        .map((step: any) => `${step.step}. ${step.procedure} (Sessão ${step.session})`)
        .join('\n');
      
      let response = `**Plano de Tratamento:**\n${planText}`;
      response += `\n\n**Sessões estimadas:** ${data.estimated_sessions}`;
      response += `\n**Prioridade:** ${data.priority}`;
      if (data.estimated_cost) {
        response += `\n**Custo estimado:** R$ ${data.estimated_cost.toFixed(2)}`;
      }
      
      addMessage('assistant', response, 'treatment');
    },
  });

  const addMessage = (role: 'user' | 'assistant', content: string, type?: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type: type as any,
    }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    addMessage('user', input);
    
    switch (activeMode) {
      case 'evolution':
        evolutionMutation.mutate(input);
        break;
      case 'diagnosis':
        diagnosisMutation.mutate(input);
        break;
      case 'treatment':
        treatmentMutation.mutate(input);
        break;
      default:
        chatMutation.mutate(input);
    }
    
    setInput('');
  };

  const isLoading = chatMutation.isPending || evolutionMutation.isPending || 
                    diagnosisMutation.isPending || treatmentMutation.isPending;

  const getPlaceholder = () => {
    switch (activeMode) {
      case 'evolution':
        return 'Descreva o atendimento realizado...';
      case 'diagnosis':
        return 'Liste os sintomas separados por vírgula...';
      case 'treatment':
        return 'Informe o diagnóstico para sugerir tratamento...';
      default:
        return 'Digite sua pergunta...';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar com ações rápidas */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Modo de Assistência
          </h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => setActiveMode(action.id)}
                className={clsx(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                  activeMode === action.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}
              >
                <action.icon className={clsx(
                  'w-5 h-5 mt-0.5',
                  activeMode === action.id ? 'text-primary-600' : 'text-gray-400'
                )} />
                <div>
                  <p className={clsx(
                    'text-sm font-medium',
                    activeMode === action.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Contexto do paciente */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Contexto
          </h3>
          <Input
            label="ID do Paciente (opcional)"
            placeholder="UUID do paciente"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Informe o ID para respostas contextualizadas
          </p>
        </Card>

        {/* Dicas */}
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Dica
            </span>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {activeMode === 'evolution' && 'Descreva o atendimento de forma resumida. A IA formatará em evolução clínica profissional.'}
            {activeMode === 'diagnosis' && 'Liste sintomas como: dor ao mastigar, sensibilidade ao frio, inchaço gengival'}
            {activeMode === 'treatment' && 'Informe o diagnóstico confirmado para receber um plano de tratamento detalhado.'}
            {activeMode === 'chat' && 'Pergunte sobre protocolos, medicamentos, técnicas ou qualquer dúvida odontológica.'}
          </p>
        </Card>
      </div>

      {/* Área de chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Assistente IA - {QUICK_ACTIONS.find(a => a.id === activeMode)?.label}
            </h2>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <SparklesIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Olá! Como posso ajudar?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Selecione um modo de assistência ao lado e comece a conversar. 
                Posso ajudar com evoluções clínicas, diagnósticos, planos de tratamento e muito mais.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={clsx(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-[80%] rounded-lg p-4',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className={clsx(
                    'text-xs mt-2',
                    message.role === 'user' ? 'text-primary-200' : 'text-gray-400'
                  )}>
                    {format(message.timestamp, 'HH:mm')}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                  <span className="text-sm text-gray-500">Pensando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={getPlaceholder()}
              className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AIAssistantPage;
