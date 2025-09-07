// Central type exports
// T024: Consolidate all type definitions

// Core wizard types
export type {
  WizardState,
  AnswerData,
  AnswerValue,
  ValidationError,
  QuestionDefinition,
  StepNavigationState,
  DraftMetadata,
  OutputSpecification,
  ConstitutionalCompliance,
} from './wizard';

export {
  WizardStateSchema,
  AnswerDataSchema,
  AnswerValueSchema,
  ValidationErrorSchema,
  WizardValidationError,
  ConstitutionalViolationError,
} from './wizard';

// OAuth types
export type {
  GoogleAuthConfig,
  AuthResult,
  AuthStatus,
  ConsentRecord,
  GoogleAuthManager,
  WorkspaceAPIClient,
  ScopePermission,
  TokenStorage,
} from './oauth';

export {
  GoogleAuthConfigSchema,
  AuthResultSchema,
  AuthStatusSchema,
  ConsentRecordSchema,
  MinimalScopes,
  ScopeDescriptions,
  OAuthError,
  ScopeError,
} from './oauth';

// Storage types
export type {
  UserPreferences,
  DraftStorage,
  DraftStorageManager,
  UserPreferencesManager,
  ConsentHistoryManager,
  StorageEncryption,
  PIIDetector,
  StorageQuotaManager,
  DataIntegrity,
  StorageComplianceValidator,
} from './storage';

export {
  UserPreferencesSchema,
  DraftStorageSchema,
  StorageConstants,
  StorageError,
  DraftError,
} from './storage';

// UI types
export type {
  BaseComponentProps,
  FormFieldProps,
  QuestionComponentProps,
  WizardNavigationProps,
  StepIndicatorProps,
  LanguageSwitcherProps,
  LoadingState,
  ToastNotification,
  ModalProps,
  A11yLiveRegionProps,
  KeyboardNavigationProps,
  FocusManager,
  Breakpoints,
  ResponsiveProps,
  Theme,
  ThemeColors,
  AnimationPreferences,
  ContrastPreferences,
  VoiceControlCommands,
  ScreenReaderAnnouncements,
  ErrorBoundaryState,
  ErrorFallbackProps,
  PerformanceMetrics,
  ConstitutionalComplianceIndicator,
  SkipLinkProps,
  FocusIndicatorProps,
} from './ui';

// i18n types
export type {
  SupportedLanguage,
  TranslationNamespaces,
  CommonTranslations,
  WizardTranslations,
  QuestionTranslations,
  ValidationTranslations,
  OAuthTranslations,
  AccessibilityTranslations,
  ErrorTranslations,
  TranslationInterpolation,
  TranslationFunction,
  LanguageDetectionResult,
  RTLSupport,
  TranslationLoadingState,
  I18nConstitutionalCompliance,
} from './i18n';

// Re-export Zod schemas for validation
export { z } from 'zod';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;
export type EventHandler<T = Event> = (event: T) => void;
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;

// React-specific utility types
export type {
  ComponentType,
  ReactNode,
  ReactElement,
  FC,
  PropsWithChildren,
  RefObject,
  MutableRefObject,
} from 'react';

// HTML element types commonly used
export type HTMLElementProps<T extends HTMLElement> = React.HTMLAttributes<T>;
export type HTMLInputElementProps = React.InputHTMLAttributes<HTMLInputElement>;
export type HTMLButtonElementProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export type HTMLTextAreaElementProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export type HTMLSelectElementProps = React.SelectHTMLAttributes<HTMLSelectElement>;

// Event handler types
export type ChangeHandler<T> = (value: T) => void;
export type FormEventHandler = React.FormEventHandler<HTMLFormElement>;
export type KeyboardEventHandler = React.KeyboardEventHandler<HTMLElement>;
export type FocusEventHandler = React.FocusEventHandler<HTMLElement>;
export type MouseEventHandler = React.MouseEventHandler<HTMLElement>;

// Constitutional compliance aggregate type - temporarily disabled
// export interface GlobalConstitutionalCompliance 
//   extends ConstitutionalCompliance, 
//           I18nConstitutionalCompliance {
//   // Additional global compliance requirements
//   overallCompliance: boolean;
//   lastValidated: Date;
//   violations: string[];
// }