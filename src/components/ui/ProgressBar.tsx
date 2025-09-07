// Accessible progress bar component
// T042: Progress indicator with WCAG compliance

import React from 'react';
import { BaseComponentProps } from '../../types';
import { useAccessibility } from '../../hooks';

interface ProgressBarProps extends BaseComponentProps {
  value: number; // 0-100
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  description?: string;
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'medium',
  showLabel = false,
  showPercentage = true,
  label,
  description,
  animated = false,
  striped = false,
  indeterminate = false,
  className = '',
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const { a11yState } = useAccessibility();
  
  // Normalize value
  const normalizedValue = Math.min(Math.max(0, value), max);
  const percentage = (normalizedValue / max) * 100;
  
  // Generate unique IDs
  const progressId = `progress-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = showLabel && label ? `${progressId}-label` : undefined;
  const descriptionId = description ? `${progressId}-description` : undefined;
  
  // Size classes
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-4',
    large: 'h-6',
  };
  
  // Variant classes
  const variantClasses = {
    default: a11yState.isHighContrast ? 'bg-black' : 'bg-blue-600',
    success: a11yState.isHighContrast ? 'bg-black' : 'bg-green-600',
    warning: a11yState.isHighContrast ? 'bg-black' : 'bg-yellow-600',
    danger: a11yState.isHighContrast ? 'bg-black' : 'bg-red-600',
  };
  
  // Background classes
  const backgroundClasses = a11yState.isHighContrast
    ? 'bg-gray-300 border border-black'
    : 'bg-gray-200';
  
  // Container classes
  const containerClasses = [
    'w-full',
    backgroundClasses,
    'rounded-full',
    'overflow-hidden',
    sizeClasses[size],
    className,
  ].join(' ');
  
  // Progress bar classes
  const progressClasses = [
    sizeClasses[size],
    variantClasses[variant],
    'rounded-full',
    'flex',
    'items-center',
    'justify-center',
    'text-white',
    'text-xs',
    'font-medium',
  ];
  
  // Animation classes
  if (animated && !a11yState.isReducedMotion) {
    progressClasses.push('transition-all', 'duration-500', 'ease-out');
  }
  
  // Striped classes
  if (striped) {
    progressClasses.push(
      'bg-gradient-to-r',
      'from-transparent',
      'via-white',
      'to-transparent',
      'bg-[length:20px_20px]'
    );
    
    if (animated && !a11yState.isReducedMotion) {
      progressClasses.push('animate-pulse');
    }
  }
  
  // Indeterminate animation
  const indeterminateClasses = indeterminate && !a11yState.isReducedMotion
    ? 'animate-pulse'
    : '';
  
  const finalProgressClasses = [...progressClasses, indeterminateClasses]
    .filter(Boolean)
    .join(' ');
  
  // Calculate progress bar width
  const progressWidth = indeterminate ? '100%' : `${percentage}%`;
  
  // Format percentage for display
  const formattedPercentage = Math.round(percentage);
  
  // ARIA attributes
  const ariaValueNow = indeterminate ? undefined : normalizedValue;
  const ariaValueMin = 0;
  const ariaValueMax = max;
  const progressAriaLabel = ariaLabel || 
    (label ? `${label}: ${formattedPercentage}%` : `Progress: ${formattedPercentage}%`);
  
  const combinedAriaDescribedBy = [ariaDescribedBy, descriptionId]
    .filter(Boolean)
    .join(' ') || undefined;
  
  return (
    <div className="w-full">
      {/* Label and percentage */}
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && label && (
            <span
              id={labelId}
              className="text-sm font-medium text-gray-700"
            >
              {label}
            </span>
          )}
          
          {showPercentage && !indeterminate && (
            <span className="text-sm text-gray-600" aria-live="polite">
              {formattedPercentage}%
            </span>
          )}
          
          {indeterminate && (
            <span className="text-sm text-gray-600">
              読み込み中
            </span>
          )}
        </div>
      )}
      
      {/* Description */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600 mb-2"
        >
          {description}
        </p>
      )}
      
      {/* Progress bar container */}
      <div
        className={containerClasses}
        data-testid={dataTestId}
        role="progressbar"
        aria-valuenow={ariaValueNow}
        aria-valuemin={ariaValueMin}
        aria-valuemax={ariaValueMax}
        aria-label={progressAriaLabel}
        aria-describedby={combinedAriaDescribedBy}
        aria-live="polite"
      >
        {/* Progress bar fill */}
        <div
          className={finalProgressClasses}
          style={{
            width: progressWidth,
          }}
        >
          {/* Show percentage inside bar for large size */}
          {size === 'large' && showPercentage && !indeterminate && (
            <span className="text-xs font-medium text-white px-2">
              {formattedPercentage}%
            </span>
          )}
          
          {/* Show loading text for indeterminate large size */}
          {size === 'large' && indeterminate && (
            <span className="text-xs font-medium text-white px-2">
              読み込み中
            </span>
          )}
        </div>
      </div>
      
      {/* Screen reader text for progress updates */}
      <div className="sr-only" aria-live="assertive">
        {indeterminate ? (
          '読み込み中'
        ) : (
          `進捗状況: ${normalizedValue}/${max} (${formattedPercentage}%)`
        )}
      </div>
      
      {/* Additional status text */}
      {variant === 'success' && percentage >= 100 && (
        <div className="mt-2 text-sm text-green-600" role="status">
          ✓ 完了
        </div>
      )}
      
      {variant === 'danger' && percentage < 25 && (
        <div className="mt-2 text-sm text-red-600" role="status">
          ⚠ 進捗が低い状況です
        </div>
      )}
      
      {variant === 'warning' && percentage >= 80 && percentage < 100 && (
        <div className="mt-2 text-sm text-yellow-600" role="status">
          ⚡ もうすぐ完了です
        </div>
      )}
    </div>
  );
};

export default ProgressBar;