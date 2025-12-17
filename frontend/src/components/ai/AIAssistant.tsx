import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { aiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  interactionId?: string;
  confidence?: number;
}

interface AIAssistantProps {
  context?: Record<string, unknown>;
  placeholder?: string;
  suggestions?: string[];
}

export function AIAssistant({ 
  context, 
  placeholder = 'Digite sua pergunta...',
  suggestions = [
    'Quais são os sintomas de pulpite irreversível?',
    'Como tratar sensibilidade dentária?',
    'Protocolo para extração de terceiro molar',
    'Indicações para tratamento endodôntico',
  ],
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (message: string) => 
      aiService.chat(message, conversationId || undefined, context),
    onSuccess: (response) => {
      const data = response.data;
      
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        timestamp: new Date(),
        interactionId: data.metadata?.interaction_id,
        confidence: data.confidence,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: () => {
      toast.error('Erro ao processar sua mensagem. Tente novamente.');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ interactionId, feedback }: { interactionId: string; feedback: Record<string, unknown> }) =>
      aiService.sendFeedback(interactionId, feedback),
    onSuccess: () => {
      toast.success('Feedback registrado!');
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleFeedback = (message: Message, isPositive: boolean) => {
    if (message.interactionId) {
      feedbackMutation.mutate({
        interactionId: message.interactionId,
        feedback: {
          was_accepted: isPositive,
          feedback: isPositive ? 'helpful' : 'not_helpful',
        },
      });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <SparklesIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Assistente IA
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Apoio clínico inteligente
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Como posso ajudar você hoje?
            </p>
            
            {/* Suggestions */}
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 
                           bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                           transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Confidence indicator */}
                  {message.confidence !== undefined && (
                    <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                      <span>Confiança: {Math.round(message.confidence * 100)}%</span>
                    </div>
                  )}

                  {/* Actions for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleFeedback(message, true)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Útil"
                      >
                        <HandThumbUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message, false)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Não útil"
                      >
                        <HandThumbDownIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(message.content)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copiar"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator */}
        {chatMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            isLoading={chatMutation.isPending}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          A IA fornece sugestões como apoio. Sempre valide clinicamente.
        </p>
      </div>
    </Card>
  );
}
