import { useState, useCallback } from 'react';
import { Tooth } from './Tooth';
import { ToothModal } from './ToothModal';
import { clsx } from 'clsx';

export interface ToothData {
  status: 'healthy' | 'decayed' | 'restored' | 'missing' | 'implant' | 'crown';
  surfaces: {
    mesial: string;
    distal: string;
    vestibular: string;
    lingual: string;
    occlusal: string;
  };
  procedures: string[];
  notes?: string;
}

export interface OdontogramData {
  [toothNumber: string]: ToothData;
}

interface OdontogramProps {
  data: OdontogramData;
  onChange?: (data: OdontogramData) => void;
  readOnly?: boolean;
  showAISuggestions?: boolean;
  aiSuggestions?: { tooth: string; suggestion: string }[];
}

// Numeração FDI
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'];
const LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];

const DEFAULT_TOOTH: ToothData = {
  status: 'healthy',
  surfaces: {
    mesial: 'healthy',
    distal: 'healthy',
    vestibular: 'healthy',
    lingual: 'healthy',
    occlusal: 'healthy',
  },
  procedures: [],
};

export function Odontogram({
  data,
  onChange,
  readOnly = false,
  showAISuggestions = false,
  aiSuggestions = [],
}: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);

  const getToothData = useCallback(
    (number: string): ToothData => {
      return data[number] || DEFAULT_TOOTH;
    },
    [data]
  );

  const handleToothClick = (number: string) => {
    if (!readOnly) {
      setSelectedTooth(number);
    }
  };

  const handleToothUpdate = (number: string, toothData: ToothData) => {
    if (onChange) {
      onChange({
        ...data,
        [number]: toothData,
      });
    }
    setSelectedTooth(null);
  };

  const getAISuggestion = (number: string) => {
    return aiSuggestions.find((s) => s.tooth === number);
  };

  const renderQuadrant = (teeth: string[], position: 'upper' | 'lower') => (
    <div className="flex gap-1">
      {teeth.map((number) => {
        const toothData = getToothData(number);
        const suggestion = showAISuggestions ? getAISuggestion(number) : undefined;

        return (
          <div key={number} className="relative">
            <Tooth
              number={number}
              data={toothData}
              position={position}
              onClick={() => handleToothClick(number)}
              isSelected={selectedTooth === number}
              hasSuggestion={!!suggestion}
            />
            {suggestion && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full">
      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span className="text-gray-600 dark:text-gray-400">Saudável</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span className="text-gray-600 dark:text-gray-400">Cárie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span className="text-gray-600 dark:text-gray-400">Restaurado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-300 border border-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Ausente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300" />
          <span className="text-gray-600 dark:text-gray-400">Implante</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span className="text-gray-600 dark:text-gray-400">Coroa</span>
        </div>
      </div>

      {/* Odontograma */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
        {/* Arcada Superior */}
        <div className="flex justify-center gap-8 mb-2">
          <div className="text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
              Superior Direito
            </span>
            {renderQuadrant(UPPER_RIGHT, 'upper')}
          </div>
          <div className="w-px bg-gray-300 dark:bg-gray-600" />
          <div className="text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
              Superior Esquerdo
            </span>
            {renderQuadrant(UPPER_LEFT, 'upper')}
          </div>
        </div>

        {/* Linha divisória */}
        <div className="h-px bg-gray-300 dark:bg-gray-600 my-4" />

        {/* Arcada Inferior */}
        <div className="flex justify-center gap-8 mt-2">
          <div className="text-center">
            {renderQuadrant(LOWER_RIGHT, 'lower')}
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
              Inferior Direito
            </span>
          </div>
          <div className="w-px bg-gray-300 dark:bg-gray-600" />
          <div className="text-center">
            {renderQuadrant(LOWER_LEFT, 'lower')}
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
              Inferior Esquerdo
            </span>
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      {selectedTooth && (
        <ToothModal
          isOpen={!!selectedTooth}
          onClose={() => setSelectedTooth(null)}
          toothNumber={selectedTooth}
          data={getToothData(selectedTooth)}
          onSave={(toothData) => handleToothUpdate(selectedTooth, toothData)}
          aiSuggestion={getAISuggestion(selectedTooth)?.suggestion}
        />
      )}
    </div>
  );
}
