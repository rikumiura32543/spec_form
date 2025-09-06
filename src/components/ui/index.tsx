// UI component exports
// T043: Consolidate all UI components

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Core form components
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Textarea } from './Textarea';

// Layout components
export { default as Modal } from './Modal';

// Feedback components
export { default as ProgressBar } from './ProgressBar';

// Additional UI components for complete interface

// Loading Spinner
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };
  
  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
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
};

// Toast Notification
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [id, duration, onClose]);
  
  const typeStyles = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800', 
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800',
  };
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  
  const toastClasses = [
    'fixed',
    'top-4',
    'right-4',
    'max-w-sm',
    'w-full',
    'border-l-4',
    'p-4',
    'rounded-md',
    'shadow-lg',
    'transform',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'z-50',
    typeStyles[type],
    isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
  ].join(' ');
  
  const toastContent = (
    <div
      className={toastClasses}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <span className="text-lg" aria-hidden="true">
            {icons[type]}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 ml-3 opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
  
  return createPortal(toastContent, document.body);
};

// Skip Link for accessibility
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = '' }) => {
  return (
    <a
      href={href}
      className={`
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:top-0
        focus:left-0
        focus:z-50
        focus:px-4
        focus:py-2
        focus:bg-blue-600
        focus:text-white
        focus:text-sm
        focus:font-medium
        focus:rounded-md
        focus:shadow-lg
        ${className}
      `}
    >
      {children}
    </a>
  );
};

// Accessible Card component
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
}> = ({ 
  children, 
  className = '', 
  padding = 'medium',
  shadow = 'medium',
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };
  
  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
  };
  
  return (
    <div
      className={`
        bg-white
        rounded-lg
        border
        border-gray-200
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Accessible Badge component
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ 
  children, 
  variant = 'default', 
  size = 'medium',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800', 
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base',
  };
  
  return (
    <span
      className={`
        inline-flex
        items-center
        font-medium
        rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// Divider component
export const Divider: React.FC<{
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: React.ReactNode;
}> = ({ 
  orientation = 'horizontal', 
  className = '', 
  children,
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={`border-l border-gray-300 h-full ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }
  
  if (children) {
    return (
      <div
        className={`relative flex items-center ${className}`}
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="flex-grow border-t border-gray-300" />
        <span className="px-4 text-sm text-gray-500 bg-white">
          {children}
        </span>
        <div className="flex-grow border-t border-gray-300" />
      </div>
    );
  }
  
  return (
    <hr
      className={`border-gray-300 ${className}`}
      role="separator"
      aria-orientation="horizontal"
    />
  );
};

// Export types
export type { ToastProps };