// Accessible modal component
// T041: Modal dialog with focus trap and WCAG compliance

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from '../../types';
import { useAccessibility } from '../../hooks';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  'data-testid': dataTestId,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) => {
  const { trapFocus, restoreFocus, handleKeyboardNavigation, a11yState } = useAccessibility();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const focusTrapCleanupRef = useRef<(() => void) | null>(null);
  
  // Generate unique ID for title if not provided
  const titleId = ariaLabelledBy || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  
  // Size classes
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };
  
  // Modal classes
  const modalClasses = [
    'relative',
    'bg-white',
    'rounded-lg',
    'shadow-xl',
    'transform',
    'transition-all',
    'sm:my-8',
    'sm:w-full',
    sizeClasses[size],
    'mx-4',
    'my-auto',
    className,
  ].join(' ');
  
  // Overlay classes with reduced motion support
  const overlayClasses = [
    'fixed',
    'inset-0',
    'bg-gray-500',
    'bg-opacity-75',
    'backdrop-blur-sm',
    a11yState.isReducedMotion ? 'transition-none' : 'transition-opacity',
    'z-50',
  ].join(' ');
  
  // Container classes
  const containerClasses = [
    'fixed',
    'inset-0',
    'z-50',
    'overflow-y-auto',
    'flex',
    'items-center',
    'justify-center',
    'p-4',
  ].join(' ');
  
  // High contrast adjustments
  const highContrastClasses = a11yState.isHighContrast ? [
    'border-4',
    'border-black',
    'bg-white',
    'text-black',
  ] : [];
  
  // Handle escape key
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape && isOpen) {
      event.preventDefault();
      onClose();
    }
  }, [closeOnEscape, isOpen, onClose]);
  
  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    handleKeyboardNavigation(event, 'modal');
    
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onClose();
    }
  }, [handleKeyboardNavigation, closeOnEscape, onClose]);
  
  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Set up focus trap when modal opens
      const setupFocusTrap = () => {
        if (modalRef.current) {
          focusTrapCleanupRef.current = trapFocus(modalRef.current);
        }
      };
      
      // Delay to ensure modal is fully rendered
      const timeoutId = setTimeout(setupFocusTrap, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else if (focusTrapCleanupRef.current) {
      // Clean up focus trap when modal closes
      focusTrapCleanupRef.current();
      focusTrapCleanupRef.current = null;
      
      // Restore focus to previously focused element
      if (previousActiveElementRef.current) {
        restoreFocus();
      }
    }
  }, [isOpen, trapFocus, restoreFocus]);
  
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
  
  // Keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleEscape]);
  
  // Don't render if not open
  if (!isOpen) {
    return null;
  }
  
  const modalContent = (
    <div
      className={containerClasses}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
      data-testid={dataTestId}
    >
      {/* Overlay */}
      <div className={overlayClasses} aria-hidden="true" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={[modalClasses, ...highContrastClasses].join(' ')}
        onKeyDown={handleKeyDown}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2
            id={titleId}
            className="text-lg font-medium text-gray-900"
          >
            {title}
          </h2>
          
          {/* Close button */}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className={[
                'rounded-md',
                'text-gray-400',
                'hover:text-gray-600',
                'focus:outline-none',
                'focus:ring-2',
                'focus:ring-blue-500',
                'focus:ring-offset-2',
                'p-1',
                a11yState.isHighContrast ? 'text-black hover:text-gray-700' : '',
              ].filter(Boolean).join(' ')}
              aria-label="閉じる"
            >
              <svg
                className="h-6 w-6"
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
          )}
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
  
  // Render modal in portal
  return createPortal(modalContent, document.body);
};

export default Modal;