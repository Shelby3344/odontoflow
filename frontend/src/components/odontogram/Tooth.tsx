import { memo } from 'react';
import { clsx } from 'clsx';
import type { ToothData } from './Odontogram';

interface ToothProps {
  number: string;
  data: ToothData;
  position: 'upper' | 'lower';
  onClick: () => void;
  isSelected: boolean;
  hasSuggestion?: boolean;
}

const STATUS_COLORS = {
  healthy: 'fill-green-100 stroke-green-400',
  decayed: 'fill-red-100 stroke-red-400',
  restored: 'fill-blue-100 stroke-blue-400',
  missing: 'fill-gray-200 stroke-gray-400',
  implant: 'fill-purple-100 stroke-purple-400',
  crown: 'fill-yellow-100 stroke-yellow-400',
};

const SURFACE_COLORS = {
  healthy: '#dcfce7',
  decayed: '#fee2e2',
  restored: '#dbeafe',
  missing: '#e5e7eb',
  implant: '#f3e8ff',
  crown: '#fef9c3',
};

export const Tooth = memo(function Tooth({
  number,
  data,
  position,
  onClick,
  isSelected,
  hasSuggestion,
}: ToothProps) {
  const isMolar = ['6', '7', '8'].includes(number.slice(-1));
  const isPremolar = ['4', '5'].includes(number.slice(-1));
  const isIncisor = ['1', '2'].includes(number.slice(-1));
  const isCanine = number.slice(-1) === '3';

  // Tamanho do dente baseado no tipo
  const width = isMolar ? 44 : isPremolar ? 38 : isCanine ? 34 : 32;
  const height = 56;

  const getSurfaceColor = (surface: keyof typeof data.surfaces) => {
    const status = data.surfaces[surface] as keyof typeof SURFACE_COLORS;
    return SURFACE_COLORS[status] || SURFACE_COLORS.healthy;
  };

  return (
    <div
      className={clsx(
        'relative cursor-pointer transition-transform duration-150',
        'hover:scale-105',
        isSelected && 'scale-110 z-10'
      )}
      onClick={onClick}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 44 56"
        className={clsx(
          'transition-all duration-200',
          isSelected && 'drop-shadow-lg'
        )}
      >
        {/* Contorno do dente */}
        <rect
          x="2"
          y="2"
          width="40"
          height="52"
          rx="4"
          className={clsx(
            'stroke-2 transition-colors',
            STATUS_COLORS[data.status],
            isSelected && 'stroke-primary-500 stroke-[3]'
          )}
        />

        {/* Faces do dente (representação simplificada) */}
        {data.status !== 'missing' && (
          <>
            {/* Oclusal/Incisal (centro) */}
            <rect
              x="12"
              y="16"
              width="20"
              height="20"
              rx="2"
              fill={getSurfaceColor('occlusal')}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />

            {/* Mesial (esquerda) */}
            <rect
              x="4"
              y="16"
              width="8"
              height="20"
              rx="1"
              fill={getSurfaceColor('mesial')}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />

            {/* Distal (direita) */}
            <rect
              x="32"
              y="16"
              width="8"
              height="20"
              rx="1"
              fill={getSurfaceColor('distal')}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />

            {/* Vestibular (superior ou inferior dependendo da arcada) */}
            <rect
              x="12"
              y={position === 'upper' ? '4' : '36'}
              width="20"
              height="12"
              rx="1"
              fill={getSurfaceColor('vestibular')}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />

            {/* Lingual/Palatina */}
            <rect
              x="12"
              y={position === 'upper' ? '36' : '4'}
              width="20"
              height="12"
              rx="1"
              fill={getSurfaceColor('lingual')}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />
          </>
        )}

        {/* X para dente ausente */}
        {data.status === 'missing' && (
          <>
            <line
              x1="8"
              y1="12"
              x2="36"
              y2="44"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            <line
              x1="36"
              y1="12"
              x2="8"
              y2="44"
              stroke="#9ca3af"
              strokeWidth="2"
            />
          </>
        )}

        {/* Símbolo de implante */}
        {data.status === 'implant' && (
          <circle
            cx="22"
            cy="28"
            r="8"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}

        {/* Símbolo de coroa */}
        {data.status === 'crown' && (
          <path
            d="M14 20 L22 12 L30 20 L30 36 L14 36 Z"
            fill="none"
            stroke="#ca8a04"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Número do dente */}
      <div
        className={clsx(
          'absolute -bottom-5 left-1/2 -translate-x-1/2',
          'text-xs font-medium',
          isSelected
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-400'
        )}
      >
        {number}
      </div>

      {/* Indicador de procedimentos */}
      {data.procedures.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">
            {data.procedures.length}
          </span>
        </div>
      )}

      {/* Indicador de sugestão IA */}
      {hasSuggestion && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </div>
  );
});
