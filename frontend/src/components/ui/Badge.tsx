import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const classes = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    dot && 'badge-dot',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className="badge-dot-indicator" />}
      {children}
    </span>
  );
};

// Status Badge with predefined colors
export interface StatusBadgeProps {
  status: 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'pending' | 'paid' | 'overdue' | 'active' | 'inactive';
  className?: string;
}

const statusConfig: Record<StatusBadgeProps['status'], { label: string; variant: BadgeProps['variant'] }> = {
  scheduled: { label: 'Agendado', variant: 'info' },
  confirmed: { label: 'Confirmado', variant: 'primary' },
  waiting: { label: 'Aguardando', variant: 'warning' },
  in_progress: { label: 'Em atendimento', variant: 'secondary' },
  completed: { label: 'Concluído', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
  no_show: { label: 'Não compareceu', variant: 'danger' },
  pending: { label: 'Pendente', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  overdue: { label: 'Atrasado', variant: 'danger' },
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'default' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || { label: status, variant: 'default' };
  
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
};

export default Badge;
