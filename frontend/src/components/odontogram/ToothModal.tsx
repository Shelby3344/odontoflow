import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { STATUS_COLORS, ToothCondition, ToothProcedure } from './Odontogram';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ToothModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  condition: ToothCondition | null;
  onSave: (toothNumber: string, condition: ToothCondition) => void;
  aiSuggestions?: string[];
}

const SURFACES = [
  { id: 'O', label: 'Oclusal', position: 'center' },
  { id: 'M', label: 'Mesial', position: 'left' },
  { id: 'D', label: 'Distal', position: 'right' },
  { id: 'V', label: 'Vestibular', position: 'top' },
  { id: 'L', label: 'Lingual/Palatina', position: 'bottom' },
];

const PROCEDURE_TYPES = [
  'Restauração em Resina',
  'Restauração em Amálgama',
  'Extração',
  'Tratamento de Canal',
  'Coroa',
  'Implante',
  'Limpeza',
  'Clareamento',
  'Aplicação de Flúor',
  'Selante',
  'Raspagem',
  'Gengivectomia',
];

export function ToothModal({ 
  isOpen, 
  onClose, 
  toothNumber, 
  condition, 
  onSave,
  aiSuggestions = []
}: ToothModalProps) {
  const [status, setStatus] = useState<ToothCondition['status']>(condition?.status || 'healthy');
  const [surfaces, setSurfaces] = useState<string[]>(condition?.surfaces || []);
  const [notes, setNotes] = useState(condition?.notes || '');
  const [procedures, setProcedures] = useState<ToothProcedure[]>(condition?.procedures || []);
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const [newProcedure, setNewProcedure] = useState({ type: '', description: '' });

  const toggleSurface = (surfaceId: string) => {
    setSurfaces(prev => 
      prev.includes(surfaceId) 
        ? prev.filter(s => s !== surfaceId)
        : [...prev, surfaceId]
    );
  };

  const addProcedure = () => {
    if (!newProcedure.type) return;
    
    const procedure: ToothProcedure = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: newProcedure.type,
      description: newProcedure.description,
      professional: 'Dr. Carlos Silva', // TODO: pegar do contexto
    };
    
    setProcedures(prev => [procedure, ...prev]);
    setNewProcedure({ type: '', description: '' });
    setShowAddProcedure(false);
  };

  const removeProcedure = (id: string) => {
    setProcedures(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = () => {
    onSave(toothNumber, {
      status,
      surfaces: surfaces.length > 0 ? surfaces : undefined,
      notes: notes || undefined,
      procedures: procedures.length > 0 ? procedures : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dente {toothNumber}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status do Dente
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(STATUS_COLORS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setStatus(key as ToothCondition['status'])}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                      status === key 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full mb-1"
                      style={{ backgroundColor: value.fill }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{value.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Superfícies */}
            {['restoration', 'cavity'].includes(status) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Superfícies Afetadas
                </label>
                <div className="relative w-32 h-32 mx-auto">
                  {/* Representação visual do dente */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  </div>
                  
                  {SURFACES.map((surface) => {
                    const positions: Record<string, string> = {
                      center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                      left: 'top-1/2 left-0 -translate-y-1/2',
                      right: 'top-1/2 right-0 -translate-y-1/2',
                      top: 'top-0 left-1/2 -translate-x-1/2',
                      bottom: 'bottom-0 left-1/2 -translate-x-1/2',
                    };
                    
                    return (
                      <button
                        key={surface.id}
                        onClick={() => toggleSurface(surface.id)}
                        className={`absolute ${positions[surface.position]} w-8 h-8 rounded-full text-xs font-medium transition-all ${
                          surfaces.includes(surface.id)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                        }`}
                        title={surface.label}
                      >
                        {surface.id}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Clique para selecionar as superfícies
                </p>
              </div>
            )}
            
            {/* Sugestões da IA */}
            {aiSuggestions.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    💡 Sugestões da IA
                  </span>
                </div>
                <ul className="space-y-1">
                  {aiSuggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-purple-700 dark:text-purple-300">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Procedimentos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Procedimentos Realizados
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => setShowAddProcedure(true)}
                >
                  Adicionar
                </Button>
              </div>
              
              {showAddProcedure && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3 space-y-3">
                  <select
                    value={newProcedure.type}
                    onChange={(e) => setNewProcedure(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                  >
                    <option value="">Selecione o procedimento</option>
                    {PROCEDURE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Observações (opcional)"
                    value={newProcedure.description}
                    onChange={(e) => setNewProcedure(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addProcedure}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddProcedure(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              
              {procedures.length > 0 ? (
                <div className="space-y-2">
                  {procedures.map((proc) => (
                    <div 
                      key={proc.id}
                      className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {proc.type}
                        </p>
                        {proc.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {proc.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(proc.date), "dd/MM/yyyy", { locale: ptBR })} • {proc.professional}
                        </p>
                      </div>
                      <button
                        onClick={() => removeProcedure(proc.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum procedimento registrado
                </p>
              )}
            </div>
            
            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                placeholder="Anotações sobre este dente..."
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
