import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick
}) => {
  const classes = [
    'card',
    `card-padding-${padding}`,
    hover && 'card-hover',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  action
}) => (
  <div className={`card-header ${className}`}>
    <div className="card-header-content">{children}</div>
    {action && <div className="card-header-action">{action}</div>}
  </div>
);

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
  subtitle
}) => (
  <div className={`card-title-wrapper ${className}`}>
    <h3 className="card-title">{children}</h3>
    {subtitle && <p className="card-subtitle">{subtitle}</p>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`card-content ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;
