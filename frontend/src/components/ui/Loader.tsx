import React from 'react';
import './Loader.css';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'current';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  return (
    <div className={`loader loader-${size} loader-${color} ${className}`}>
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// Page Loader
export const PageLoader: React.FC = () => (
  <div className="page-loader">
    <div className="page-loader-content">
      <div className="page-loader-logo">
        <svg viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="url(#loader-gradient)" />
          <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 21c-4.95 0-9-4.05-9-9s4.05-9 9-9 9 4.05 9 9-4.05 9-9 9z" fill="white" />
          <circle cx="24" cy="24" r="4.5" fill="white" />
          <defs>
            <linearGradient id="loader-gradient" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <Loader size="lg" />
    </div>
  </div>
);

// Skeleton Loader
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = ''
}) => (
  <div
    className={`skeleton ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius
    }}
  />
);

export default Loader;
