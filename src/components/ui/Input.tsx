// Accessible input component
// T039: Form input with validation and PII detection

import React, { forwardRef, InputHTMLAttributes, useState, useEffect, useCallback } from 'react';
import { FormFieldProps } from '../../types';
import { PIIDetector, debounce } from '../../utils';
import { useAccessibility } from '../../hooks';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'aria-invalid' | 'required'>, FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  variant?: 'default' | 'filled' | 'outline';
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  detectPII?: boolean;
  onPIIDetected?: (hasPII: boolean, types: string[]) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  id,
  name,
  label,
  description,
  helpText,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  type = 'text',
  variant = 'default',
  placeholder,
  value,
  defaultValue,
  maxLength,
  showCharCount = false,
  detectPII = false,
  onPIIDetected,
  leftIcon,
  rightIcon,
  clearable = false,
  onClear,
  onChange,
  onBlur,
  onFocus,
  className = '',
  'data-testid': dataTestId,
  'aria-invalid': ariaInvalid,
  'aria-errormessage': ariaErrorMessage,
  ...props
}, ref) => {
  const { a11yState, announce } = useAccessibility();
  
  const [currentValue, setCurrentValue] = useState<string>(
    (value || defaultValue || '') as string
  );
  // Focus state removed - not used in current implementation
  const [piiDetected, setPiiDetected] = useState(false);
  const [piiTypes, setPiiTypes] = useState<string[]>([]);
  
  // Update internal value when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value as string);
    }
  }, [value]);
  
  // Debounced PII detection
  const debouncedPIIDetection = useCallback(
    debounce((text: string) => {
      if (!detectPII || !text) {
        setPiiDetected(false);
        setPiiTypes([]);
        onPIIDetected?.(false, []);
        return;
      }
      
      const piiResult = PIIDetector.detectPII(text);
      setPiiDetected(piiResult.hasPII);
      setPiiTypes(piiResult.types);
      
      if (piiResult.hasPII) {
        announce('個人情報が含まれています', 'assertive');
      }
      
      onPIIDetected?.(piiResult.hasPII, piiResult.types);
    }, 500),
    [detectPII, onPIIDetected, announce]
  );
  
  // Trigger PII detection when value changes
  useEffect(() => {
    debouncedPIIDetection(currentValue);
  }, [currentValue, debouncedPIIDetection]);
  
  // Generate unique IDs for ARIA relationships
  const errorId = error ? `${id}-error` : undefined;
  const helperId = (helpText || helperText) ? `${id}-helper` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  
  // Combine ARIA describedby
  const ariaDescribedBy = [descriptionId, helperId, errorId].filter(Boolean).join(' ') || undefined;
  
  // Calculate input classes
  const baseClasses = [
    'block',
    'w-full',
    'rounded-md',
    'border',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'read-only:bg-gray-50',
    'read-only:cursor-default',
  ];
  
  // Variant classes
  const variantClasses = {
    default: [
      'border-gray-300',
      'bg-white',
      'text-gray-900',
      'placeholder-gray-500',
      'focus:border-blue-500',
      'focus:ring-blue-500',
    ],
    filled: [
      'border-transparent',
      'bg-gray-100',
      'text-gray-900',
      'placeholder-gray-500',
      'focus:bg-white',
      'focus:border-blue-500',
      'focus:ring-blue-500',
    ],
    outline: [
      'border-gray-300',
      'bg-transparent',
      'text-gray-900',
      'placeholder-gray-400',
      'focus:border-blue-500',
      'focus:ring-blue-500',
    ],
  };
  
  // Size classes based on touch target requirements
  const sizeClasses = [
    'px-3',
    'py-2',
    'text-base',
    'min-h-[44px]', // WCAG AA minimum touch target size
    'sm:text-sm',
  ];
  
  // Error state classes
  const errorClasses = error ? [
    'border-red-300',
    'text-red-900',
    'placeholder-red-300',
    'focus:border-red-500',
    'focus:ring-red-500',
  ] : [];
  
  // High contrast classes
  const contrastClasses = a11yState.isHighContrast ? [
    'border-black',
    'bg-white',
    'text-black',
    'focus:border-black',
    'focus:ring-black',
  ] : [];
  
  // PII detected classes
  const piiClasses = piiDetected ? [
    'border-yellow-300',
    'bg-yellow-50',
    'focus:border-yellow-500',
    'focus:ring-yellow-500',
  ] : [];
  
  // Reduced motion classes
  const motionClasses = a11yState.isReducedMotion ? [
    'transition-none',
  ] : [
    'transition-all',
    'duration-200',
  ];
  
  // Icon padding classes
  const iconPaddingClasses = [];
  if (leftIcon) iconPaddingClasses.push('pl-10');
  if (rightIcon || clearable) iconPaddingClasses.push('pr-10');
  
  // Combine all classes
  const inputClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses,
    ...errorClasses,
    ...contrastClasses,
    ...piiClasses,
    ...motionClasses,
    ...iconPaddingClasses,
    className,
  ].join(' ');
  
  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCurrentValue(newValue);
    onChange?.(event);
  };
  
  // Handle focus
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
  };
  
  // Handle blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
  };
  
  // Handle clear
  const handleClear = () => {
    setCurrentValue('');
    onClear?.();
    
    // Create synthetic change event
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };
  
  // Calculate character count
  const charCount = currentValue.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;
  const isOverLimit = maxLength && charCount > maxLength;
  
  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${
            error ? 'text-red-700' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      
      {/* Description */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}
      
      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-400 sm:text-sm" aria-hidden="true">
              {leftIcon}
            </span>
          </div>
        )}
        
        {/* Input element */}
        <input
          ref={ref}
          id={id}
          name={name || id}
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={currentValue}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid={dataTestId}
          aria-invalid={ariaInvalid || !!error}
          aria-errormessage={ariaErrorMessage || errorId}
          aria-describedby={ariaDescribedBy}
          {...props}
        />
        
        {/* Right icon or clear button */}
        {(rightIcon || (clearable && currentValue)) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {clearable && currentValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                aria-label="クリア"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : rightIcon ? (
              <span className="text-gray-400 sm:text-sm" aria-hidden="true">
                {rightIcon}
              </span>
            ) : null}
          </div>
        )}
        
        {/* PII warning indicator */}
        {piiDetected && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-8">
            <svg
              className="h-4 w-4 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">
              個人情報が含まれています
            </span>
          </div>
        )}
      </div>
      
      {/* Helper text and character count */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          {/* Helper text */}
          {(helpText || helperText) && (
            <p
              id={helperId}
              className={`text-sm ${
                error ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {helpText || helperText}
            </p>
          )}
          
          {/* PII warning */}
          {piiDetected && (
            <p className="text-sm text-yellow-600">
              個人情報が含まれています ({piiTypes.join(', ')})
            </p>
          )}
          
          {/* Error message */}
          {error && (
            <p
              id={errorId}
              className="text-sm text-red-600"
              role="alert"
              aria-live="assertive"
            >
              {error.message}
            </p>
          )}
        </div>
        
        {/* Character count */}
        {showCharCount && maxLength && (
          <p
            className={`text-sm ${
              isOverLimit ? 'text-red-600' : 
              isNearLimit ? 'text-yellow-600' : 
              'text-gray-500'
            }`}
            aria-live="polite"
          >
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;