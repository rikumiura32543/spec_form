// Accessible button component
// T038: Core UI component with WCAG 2.1 AA compliance

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { BaseComponentProps } from '../../types';
import { useAccessibility } from '../../hooks';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>, BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  highContrast?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  highContrast = false,
  disabled = false,
  className = '',
  onClick,
  onKeyDown,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const { handleKeyboardNavigation } = useAccessibility();
  
  // Apply high contrast automatically if detected
  // const shouldUseHighContrast = highContrast || a11yState.isHighContrast;
  
  // ミニマルフラットデザイン - 基本クラス
  const baseClasses = [
    'btn',
  ];
  
  // サイズは最小タッチサイズ44px確保済み（CSSで定義）
  const sizeClasses = {
    small: [],
    medium: [],
    large: ['text-lg', 'px-6', 'py-3'],
  };
  
  // ミニマルフラットデザイン - バリアント
  const variantClasses = {
    primary: ['btn-primary'],
    secondary: [], // デフォルトボタンスタイル使用
    tertiary: [], // デフォルトボタンスタイル使用
    danger: ['btn-danger'],
  };
  
  // 動作軽減対応（CSSで既に対応済み）
  const motionClasses: string[] = [];
  
  // 横長ボタン（文字が多いボタン用）
  const widthClasses = fullWidth ? ['btn-full-width'] : [];
  
  // フォーカス表示（CSSで既に対応済み）
  const focusClasses: string[] = [];
  
  // Combine all classes
  const buttonClasses = [
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    ...motionClasses,
    ...widthClasses,
    ...focusClasses,
    className,
  ].join(' ');
  
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    handleKeyboardNavigation(event, 'button');
    onKeyDown?.(event);
  };
  
  // Handle click with loading state
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    
    onClick?.(event);
  };
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  // Determine button text
  const buttonText = loading && loadingText ? loadingText : children;
  
  // Calculate ARIA attributes
  const ariaAttributes = {
    'aria-label': ariaLabel || (typeof buttonText === 'string' ? buttonText : undefined),
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
  };
  
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={dataTestId}
      {...ariaAttributes}
      {...props}
    >
      {/* Loading state */}
      {loading && (
        <span className="mr-2" aria-hidden="true">
          <LoadingSpinner />
        </span>
      )}
      
      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className={`${buttonText ? 'mr-2' : ''}`} aria-hidden="true">
          {icon}
        </span>
      )}
      
      {/* Button text */}
      {buttonText && (
        <span>
          {buttonText}
        </span>
      )}
      
      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className={`${buttonText ? 'ml-2' : ''}`} aria-hidden="true">
          {icon}
        </span>
      )}
      
      {/* Screen reader text for loading state */}
      {loading && (
        <span className="sr-only">
          {loadingText || '読み込み中'}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;