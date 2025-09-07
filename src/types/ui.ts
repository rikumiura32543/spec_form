// UI component type definitions
// T022: Define UI interfaces and accessibility types

import { ReactNode } from 'react';
import { QuestionDefinition, AnswerValue, ValidationError } from './wizard';

// Base component props
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Form component types
export interface FormFieldProps extends BaseComponentProps {
  id: string;
  name?: string;
  label?: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: ValidationError;
  'aria-invalid'?: boolean;
  'aria-errormessage'?: string;
}

// Question component props
export interface QuestionComponentProps extends BaseComponentProps {
  question: QuestionDefinition;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onBlur?: () => void;
  error?: ValidationError;
  disabled?: boolean;
}

// Wizard navigation props
export interface WizardNavigationProps extends BaseComponentProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSaveDraft: () => void;
  isLoading?: boolean;
  draftSaved?: boolean;
}

// Step indicator props
export interface StepIndicatorProps extends BaseComponentProps {
  currentStep: number;
  totalSteps: number;
  currentLayer: 1 | 2 | 3;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  showLabels?: boolean;
}

// Language switcher props
export interface LanguageSwitcherProps extends BaseComponentProps {
  currentLanguage: 'ja' | 'en';
  onLanguageChange: (language: 'ja' | 'en') => void;
  disabled?: boolean;
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number; // 0-100
}

// Toast notification types
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Modal dialog types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Accessibility types
export interface A11yLiveRegionProps {
  'aria-live': 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
  children: ReactNode;
}

export interface KeyboardNavigationProps {
  onKeyDown?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;
  role?: string;
  'aria-label'?: string;
  'aria-keyshortcuts'?: string;
}

// Focus management
export interface FocusManager {
  trapFocus(container: HTMLElement): () => void;
  restoreFocus(element?: HTMLElement): void;
  focusFirstTabbable(container: HTMLElement): boolean;
  focusLastTabbable(container: HTMLElement): boolean;
  getFocusableElements(container: HTMLElement): HTMLElement[];
}

// Responsive design types
export interface Breakpoints {
  xs: number; // 0px
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  '2xl': number; // 1536px
}

export interface ResponsiveProps<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

// Theme types
export interface ThemeColors {
  primary: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
    900: string;
  };
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: Record<string, string>;
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

// Animation preferences
export interface AnimationPreferences {
  reducedMotion: boolean;
  transitionDuration: number;
  enableParallax: boolean;
  enableAutoplay: boolean;
}

// High contrast mode
export interface ContrastPreferences {
  highContrast: boolean;
  forcedColors: boolean;
  customColors?: Partial<ThemeColors>;
}

// Voice control types (future feature)
export interface VoiceControlCommands {
  'next': () => void;
  'previous': () => void;
  'save': () => void;
  'help': () => void;
  'repeat': () => void;
}

// Screen reader support
export interface ScreenReaderAnnouncements {
  announceStepChange: (step: number, total: number, question: string) => void;
  announceValidationError: (errors: ValidationError[]) => void;
  announceSuccess: (message: string) => void;
  announceLoading: (isLoading: boolean, message?: string) => void;
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  'data-testid'?: string;
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  bundleSize?: number;
}

// Constitutional compliance UI types
export interface ConstitutionalComplianceIndicator {
  layerProgression: boolean;
  accessibilityCompliance: boolean;
  performanceCompliance: boolean;
  privacyCompliance: boolean;
  showDetails: boolean;
  onDetailsToggle: () => void;
}

// Skip link component
export interface SkipLinkProps extends BaseComponentProps {
  href: string;
  children: ReactNode;
  position?: 'top-left' | 'top-center' | 'top-right';
}

// Focus indicator styles
export interface FocusIndicatorProps {
  visible: boolean;
  highContrast?: boolean;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}