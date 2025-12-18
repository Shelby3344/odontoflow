import React from 'react';
import './StatsCard.css';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'primary',
  trend,
  loading = false
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 6l-9.5 9.5-5-5L1 18" />
          <path d="M17 6h6v6" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 18l-9.5-9.5-5 5L1 6" />
          <path d="M17 18h6v-6" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="stats-card stats-card-loading">
        <div className="stats-card-skeleton">
          <div className="skeleton skeleton-icon" />
          <div className="skeleton-content">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-value" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-card">
      <div className={`stats-icon stats-icon-${iconColor}`}>
        {icon}
      </div>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <div className="stats-value-row">
          <span className="stats-value">{value}</span>
          {change !== undefined && (
            <span className={`stats-change ${trend === 'up' ? 'stats-change-up' : trend === 'down' ? 'stats-change-down' : ''}`}>
              {getTrendIcon()}
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
        {changeLabel && <span className="stats-label">{changeLabel}</span>}
      </div>
    </div>
  );
};

// Quick Stats Row Component
export interface QuickStatsProps {
  stats: {
    label: string;
    value: string | number;
    color?: string;
  }[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => (
  <div className="quick-stats">
    {stats.map((stat, index) => (
      <div key={index} className="quick-stat-item">
        <span className="quick-stat-value" style={{ color: stat.color }}>{stat.value}</span>
        <span className="quick-stat-label">{stat.label}</span>
      </div>
    ))}
  </div>
);

export default StatsCard;
