import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface ToothCondition {
  status: 'healthy' | 'cavity' | 'restoration' | 'extraction' | 'implant' | 'crown' | 'root_canal' | 'missing';
  surfaces?: string[];
  notes?: string;
  procedures?: ToothProcedure[];
}

interface ToothProcedure {
  id: string;
  date: string;
  type: string;
  description: string;
  professional: string;
}

interface OdontogramData {
  [toothNumber: string]: ToothCondition;
}

interface OdontogramProps {
  data: OdontogramData;
  onToothClick: (toothNumber: string, condition: ToothCondition | null) => void;
  readOnly?: boolean;
  type?: 'permanent' | 'deciduous';
}

const STATUS_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  healthy: { fill: '#10B981', stroke: '#059669', label: 'Saudável' },
  cavity: { fill: '#EF4444', stroke: '#DC2626', label: 'Cárie' },
  restoration: { fill: '#3B82F6', stroke: '#2563EB', label: 'Restauração' },
  extraction: { fill: '#6B7280', stroke: '#4B5563', label: 'Extração' },
  implant: { fill: '#8B5CF6', stroke: '#7C3AED', label: 'Implante' },
  crown: { fill: '#F59E0B', stroke: '#D97706', label: 'Coroa' },
  root_canal: { fill: '#EC4899', stroke: '#DB2777', label: 'Canal' },
  missing: { fill: '#D1D5DB', stroke: '#9CA3AF', label: 'Ausente' },
};

// Dentes permanentes (adulto)
const PERMANENT_TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

// Dentes decíduos (criança)
const DECIDUOUS_TEETH = {
  upper: ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'],
  lower: ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'],
};

const Tooth = ({ 
  number, 
  condition, 
  onClick, 
  isUpper,
  readOnly 
}: { 
  number: string; 
  condition: ToothCondition | null;
  onClick: () => void;
  isUpper: boolean;
  readOnly?: boolean;
}) => {
  const status = condition?.status || 'healthy';
  const colors = STATUS_COLORS[status];
  
  return (
    <motion.div
      whileHover={!readOnly ? { scale: 1.1 } : undefined}
      whileTap={!readOnly ? { scale: 0.95 } : undefined}
      onClick={!readOnly ? onClick : undefined}
      className={clsx(
        'relative flex flex-col items-center cursor-pointer group',
        readOnly && 'cursor-default'
      )}
    >
      {/* Número do dente */}
      <span className={clsx(
        'text-xs font-medium text-gray-600 dark:text-gray-400 mb-1',
        isUpper ? 'order-2 mt-1' : 'order-1 mb-1'
      )}>
        {number}
      </span>
      
      {/* Dente SVG */}
      <svg
        width="36"
        height="44"
        viewBox="0 0 36 44"
        className={clsx(isUpper ? 'order-1' : 'order-2', isUpper && 'rotate-180')}
      >
        {/* Coroa do dente */}
        <path
          d="M6 4 C6 2, 10 0, 18 0 C26 0, 30 2, 30 4 L30 20 C30 24, 26 26, 18 26 C10 26, 6 24, 6 20 Z"
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="2"
          className="transition-colors duration-200"
        />
        
        {/* Raízes */}
        <path
          d="M10 26 L8 42 M18 26 L18 44 M26 26 L28 42"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Superfícies (para restaurações parciais) */}
        {condition?.surfaces?.includes('O') && (
          <circle cx="18" cy="13" r="5" fill="#1E40AF" opacity="0.7" />
        )}
        {condition?.surfaces?.includes('M') && (
          <rect x="6" y="8" width="6" height="10" fill="#1E40AF" opacity="0.7" />
        )}
        {condition?.surfaces?.includes('D') && (
          <rect x="24" y="8" width="6" height="10" fill="#1E40AF" opacity="0.7" />
        )}
        {condition?.surfaces?.includes('V') && (
          <rect x="12" y="2" width="12" height="6" fill="#1E40AF" opacity="0.7" />
        )}
        {condition?.surfaces?.includes('L') && (
          <rect x="12" y="18" width="12" height="6" fill="#1E40AF" opacity="0.7" />
        )}
      </svg>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
        {colors.label}
        {condition?.notes && <span className="block text-gray-300">{condition.notes}</span>}
      </div>
    </motion.div>
  );
};

export function Odontogram({ data, onToothClick, readOnly = false, type = 'permanent' }: OdontogramProps) {
  const teeth = type === 'permanent' ? PERMANENT_TEETH : DECIDUOUS_TEETH;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        {Object.entries(STATUS_COLORS).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div 
              className="w-4 h-4 rounded-full border-2"
              style={{ backgroundColor: value.fill, borderColor: value.stroke }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{value.label}</span>
          </div>
        ))}
      </div>
      
      {/* Arcada Superior */}
      <div className="mb-8">
        <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Arcada Superior
        </div>
        <div className="flex justify-center gap-1">
          {teeth.upper.map((num) => (
            <Tooth
              key={num}
              number={num}
              condition={data[num] || null}
              onClick={() => onToothClick(num, data[num] || null)}
              isUpper={true}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
      
      {/* Linha divisória */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        <span className="text-xs text-gray-400">Linha Média</span>
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      </div>
      
      {/* Arcada Inferior */}
      <div>
        <div className="flex justify-center gap-1">
          {teeth.lower.map((num) => (
            <Tooth
              key={num}
              number={num}
              condition={data[num] || null}
              onClick={() => onToothClick(num, data[num] || null)}
              isUpper={false}
              readOnly={readOnly}
            />
          ))}
        </div>
        <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">
          Arcada Inferior
        </div>
      </div>
    </div>
  );
}

export { STATUS_COLORS, PERMANENT_TEETH, DECIDUOUS_TEETH };
export type { OdontogramData, ToothCondition, ToothProcedure };
