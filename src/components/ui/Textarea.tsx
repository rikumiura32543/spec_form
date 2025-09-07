// Accessible textarea component  
// T040: Multi-line text input with auto-resize and PII detection

import React, { forwardRef, TextareaHTMLAttributes, useState, useEffect, useCallback, useRef } from 'react';
import { FormFieldProps } from '../../types';
import { PIIDetector, debounce } from '../../utils';
import { useAccessibility } from '../../hooks';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name' | 'aria-invalid' | 'required' | 'disabled'>, FormFieldProps {
  variant?: 'default' | 'filled' | 'outline';
  helperText?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  autoResize?: boolean;
  showCharCount?: boolean;
  detectPII?: boolean;
  onPIIDetected?: (hasPII: boolean, types: string[]) => void;
  placeholder?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
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
  variant = 'default',
  placeholder,
  value,
  defaultValue,
  maxLength,
  minRows = 3,
  maxRows = 10,
  autoResize = true,
  showCharCount = true,
  detectPII = true,
  onPIIDetected,
  resize = 'vertical',
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
  const [rows, setRows] = useState(minRows);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  
  // Combine refs
  const combinedRef = useCallback((element: HTMLTextAreaElement | null) => {
    textareaRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  }, [ref]);
  
  // Update internal value when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value as string);
    }
  }, [value]);
  
  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current && measureRef.current) {
      const textarea = textareaRef.current;
      const measure = measureRef.current;
      
      // Copy styles to measure element
      const computedStyle = window.getComputedStyle(textarea);
      measure.style.width = computedStyle.width;
      measure.style.fontFamily = computedStyle.fontFamily;
      measure.style.fontSize = computedStyle.fontSize;
      measure.style.fontWeight = computedStyle.fontWeight;
      measure.style.lineHeight = computedStyle.lineHeight;
      measure.style.letterSpacing = computedStyle.letterSpacing;
      measure.style.padding = computedStyle.padding;
      measure.style.border = computedStyle.border;
      
      // Set content and measure
      measure.textContent = currentValue || placeholder || '';
      
      const measureHeight = measure.scrollHeight;
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
      
      const contentHeight = measureHeight - paddingTop - paddingBottom - borderTop - borderBottom;
      const calculatedRows = Math.max(minRows, Math.min(maxRows, Math.ceil(contentHeight / lineHeight)));
      
      setRows(calculatedRows);
    }
  }, [currentValue, autoResize, minRows, maxRows, placeholder]);
  
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
  
  // Calculate textarea classes
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
  
  // Size classes
  const sizeClasses = [
    'px-3',
    'py-2',
    'text-base',
    'sm:text-sm',
  ];
  
  // Resize classes
  const resizeClasses = {
    none: 'resize-none',
    both: 'resize',
    horizontal: 'resize-x',
    vertical: autoResize ? 'resize-none' : 'resize-y',
  };
  
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
  
  // Combine all classes
  const textareaClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses,
    resizeClasses[resize],
    ...errorClasses,
    ...contrastClasses,
    ...piiClasses,
    ...motionClasses,
    className,
  ].join(' ');
  
  // Handle textarea change
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    
    // Enforce max length
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    setCurrentValue(newValue);
    onChange?.(event);
  };
  
  // Handle focus
  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    onFocus?.(event);
  };
  
  // Handle blur
  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.(event);
  };
  
  // Calculate character count
  const charCount = currentValue.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;
  const isOverLimit = maxLength && charCount > maxLength;
  
  // Calculate word count
  const wordCount = currentValue.trim() ? currentValue.trim().split(/\s+/).length : 0;
  
  return (
    <div className="space-y-1">
      {/* Hidden measuring element for auto-resize */}
      {autoResize && (
        <div
          ref={measureRef}
          className="absolute invisible pointer-events-none whitespace-pre-wrap break-words"
          style={{
            top: '-9999px',
            left: '-9999px',
          }}
          aria-hidden="true"
        />
      )}
      
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
      
      {/* Textarea container */}
      <div className="relative">
        <textarea
          ref={combinedRef}
          id={id}
          name={name || id}
          className={textareaClasses}
          placeholder={placeholder}
          value={currentValue}
          rows={autoResize ? rows : (props.rows || minRows)}
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
        
        {/* PII warning indicator */}
        {piiDetected && (
          <div className="absolute top-2 right-2 flex items-center">
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
      
      {/* Footer with helper text and counters */}
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
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
              <svg
                className="inline h-4 w-4 mr-1"
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
        
        {/* Character and word count */}
        {(showCharCount || maxLength) && (
          <div className="text-right space-y-1 ml-4">
            {maxLength && (
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
            
            {showCharCount && !maxLength && (
              <p className="text-sm text-gray-500">
                {wordCount} {wordCount === 1 ? '語' : '語'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;