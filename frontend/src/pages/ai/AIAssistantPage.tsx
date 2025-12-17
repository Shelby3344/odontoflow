import { AIAssistant } from '../../components/ai/AIAssistant';

export function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Assistente IA
      </h1>
      <AIAssistant />
    </div>
  );
}
