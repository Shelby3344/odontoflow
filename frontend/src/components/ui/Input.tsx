import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const wrapperClasses = [
    'input-wrapper',
    fullWidth && 'input-full',
    error && 'input-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`input ${leftIcon ? 'input-with-left-icon' : ''} ${rightIcon ? 'input-with-right-icon' : ''}`}
          {...props}
        />
        {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span className="input-error-message">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const wrapperClasses = [
    'input-wrapper',
    fullWidth && 'input-full',
    error && 'input-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className="input textarea"
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  fullWidth = false,
  className = '',
  id,
  placeholder,
  ...props
}, ref) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const wrapperClasses = [
    'input-wrapper',
    fullWidth && 'input-full',
    error && 'input-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="select-container">
        <select ref={ref} id={inputId} className="input select" {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="select-arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {error && <span className="input-error-message">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
