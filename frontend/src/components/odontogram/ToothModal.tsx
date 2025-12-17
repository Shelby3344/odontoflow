import { useState } from 'react';
import { Button } from '../ui/Button';
import type { ToothData } from './Odontogram';

interface ToothModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  data: ToothData;
  onSave: (data: ToothData) => void;
  aiSuggestion?: string;
}

export function ToothModal({
  isOpen,
  onClose,
  toothNumber,
  data,
  onSave,
  aiSuggestion,
}: ToothModalProps) {
  const [formData, setFormData] = useState<ToothData>(data);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dente {toothNumber}
        </h3>

        {aiSuggestion && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Sugestão IA:</strong> {aiSuggestion}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ToothData['status'] })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="healthy">Saudável</option>
              <option value="decayed">Cárie</option>
              <option value="restored">Restaurado</option>
              <option value="missing">Ausente</option>
              <option value="implant">Implante</option>
              <option value="crown">Coroa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
