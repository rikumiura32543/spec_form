// Internationalization type definitions
// T023: Define i18n interfaces and translation structures

// Supported languages
export type SupportedLanguage = 'ja' | 'en';

// Translation namespace structure
export interface TranslationNamespaces {
  common: CommonTranslations;
  wizard: WizardTranslations;
  questions: QuestionTranslations;
  validation: ValidationTranslations;
  oauth: OAuthTranslations;
  accessibility: AccessibilityTranslations;
  errors: ErrorTranslations;
}

// Common translations (buttons, labels, etc.)
export interface CommonTranslations {
  // Navigation
  next: string;
  previous: string;
  save: string;
  cancel: string;
  close: string;
  continue: string;
  finish: string;
  
  // Actions
  saveDraft: string;
  loadDraft: string;
  deleteDraft: string;
  export: string;
  share: string;
  download: string;
  
  // Status
  loading: string;
  saving: string;
  saved: string;
  error: string;
  success: string;
  warning: string;
  
  // Time
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
}

// Wizard-specific translations
export interface WizardTranslations {
  title: string;
  subtitle: string;
  
  // Step indicators
  stepIndicator: string; // "Step {current} of {total}"
  layerIndicator: string; // "Layer {layer}: {layerName}"
  progressIndicator: string; // "{percentage}% complete"
  
  // Layer names
  layer1Name: string; // "Purpose & Goals"
  layer2Name: string; // "Process & Stakeholders"
  layer3Name: string; // "Technology & Integration"
  
  // Draft management
  continueFromDraft: string;
  draftSavedAt: string;
  draftExpiresIn: string;
  noDraftsFound: string;
  
  // Completion
  wizardComplete: string;
  generatingOutput: string;
  outputReady: string;
}

// Question translations
export interface QuestionTranslations {
  // Layer 1: Purpose & Goals
  layer1_purpose_label: string;
  layer1_purpose_description: string;
  layer1_purpose_placeholder: string;
  layer1_purpose_help: string;
  
  layer1_kpi_label: string;
  layer1_kpi_description: string;
  layer1_kpi_placeholder: string;
  
  layer1_constraints_label: string;
  layer1_constraints_description: string;
  layer1_constraints_placeholder: string;
  
  layer1_success_criteria_label: string;
  layer1_success_criteria_description: string;
  layer1_success_criteria_placeholder: string;
  
  layer1_target_label: string;
  layer1_target_description: string;
  layer1_target_options: {
    efficiency: string;
    automation: string;
    analysis: string;
    communication: string;
    other: string;
  };
  
  // Layer 2: Process & Stakeholders
  layer2_actors_label: string;
  layer2_actors_description: string;
  layer2_actors_placeholder: string;
  
  layer2_input_data_label: string;
  layer2_input_data_description: string;
  layer2_input_data_placeholder: string;
  
  layer2_output_data_label: string;
  layer2_output_data_description: string;
  layer2_output_data_placeholder: string;
  
  layer2_triggers_label: string;
  layer2_triggers_description: string;
  layer2_triggers_options: {
    scheduled: string;
    manual: string;
    event_driven: string;
    api_call: string;
  };
  
  layer2_as_is_label: string;
  layer2_as_is_description: string;
  layer2_as_is_placeholder: string;
  
  // Layer 3: Technology & Integration
  layer3_ui_label: string;
  layer3_ui_description: string;
  layer3_ui_placeholder: string;
  
  layer3_automation_label: string;
  layer3_automation_description: string;
  layer3_automation_placeholder: string;
  
  layer3_google_integration_label: string;
  layer3_google_integration_description: string;
  layer3_google_integration_options: {
    drive: string;
    gmail: string;
    calendar: string;
    sheets: string;
    none: string;
  };
  
  layer3_permissions_label: string;
  layer3_permissions_description: string;
  layer3_permissions_placeholder: string;
  
  layer3_exceptions_label: string;
  layer3_exceptions_description: string;
  layer3_exceptions_placeholder: string;
}

// Validation error messages
export interface ValidationTranslations {
  required: string;
  minLength: string; // "Must be at least {min} characters"
  maxLength: string; // "Must be no more than {max} characters"
  pattern: string;
  email: string;
  url: string;
  numeric: string;
  integer: string;
  positive: string;
  
  // Custom validation
  containsPII: string;
  duplicateValue: string;
  invalidChoice: string;
  dependencyNotMet: string;
}

// OAuth-related translations
export interface OAuthTranslations {
  // Authentication
  signInWithGoogle: string;
  authenticationRequired: string;
  authenticationSuccess: string;
  authenticationFailed: string;
  
  // Permissions
  requestingPermissions: string;
  permissionsGranted: string;
  permissionsDenied: string;
  additionalPermissionsNeeded: string;
  
  // Services
  googleDrive: string;
  gmail: string;
  googleCalendar: string;
  googleSheets: string;
  
  // Actions
  grantPermission: string;
  denyPermission: string;
  revokePermission: string;
  managePermissions: string;
  
  // Consent
  consentExplanation: string;
  consentWithdrawal: string;
  consentHistory: string;
}

// Accessibility translations
export interface AccessibilityTranslations {
  // Screen reader announcements
  stepChanged: string; // "Moved to step {step} of {total}: {question}"
  validationErrors: string; // "Form has {count} errors"
  draftSaved: string;
  loadingContent: string;
  
  // Keyboard shortcuts
  keyboardShortcuts: string;
  keyboardHelp: {
    tab: string;
    shiftTab: string;
    enter: string;
    escape: string;
    ctrlS: string;
    altL: string;
  };
  
  // Skip links
  skipToMain: string;
  skipToNavigation: string;
  skipToHelp: string;
  
  // High contrast
  highContrastMode: string;
  normalContrastMode: string;
  
  // Reduced motion
  enableAnimations: string;
  disableAnimations: string;
}

// Error messages
export interface ErrorTranslations {
  // Network errors
  networkError: string;
  timeoutError: string;
  connectionLost: string;
  
  // OAuth errors
  authenticationError: string;
  permissionDenied: string;
  tokenExpired: string;
  
  // Storage errors
  storageQuotaExceeded: string;
  draftLoadFailed: string;
  draftSaveFailed: string;
  dataCorrupted: string;
  
  // Validation errors
  formValidationFailed: string;
  requiredFieldMissing: string;
  invalidInput: string;
  
  // Constitutional violations
  layerProgressionViolation: string;
  performanceViolation: string;
  accessibilityViolation: string;
  privacyViolation: string;
  
  // Generic
  unexpectedError: string;
  retryAction: string;
  reportIssue: string;
}

// Translation interpolation interface
export interface TranslationInterpolation {
  current?: number;
  total?: number;
  step?: number;
  layer?: number;
  count?: number;
  min?: number;
  max?: number;
  percentage?: number;
  value?: string | number;
  name?: string;
  time?: string | number;
}

// Translation function type
export type TranslationFunction = (
  key: string,
  options?: {
    ns?: keyof TranslationNamespaces;
    interpolation?: TranslationInterpolation;
    defaultValue?: string;
  }
) => string;

// Language detection result
export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  fallbackLanguage: SupportedLanguage;
  browserLanguages: string[];
}

// RTL language support (future)
export interface RTLSupport {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  marginStart: string;
  marginEnd: string;
}

// Translation loading state
export interface TranslationLoadingState {
  isLoading: boolean;
  loadedNamespaces: Set<keyof TranslationNamespaces>;
  failedNamespaces: Set<keyof TranslationNamespaces>;
  lastError?: Error;
}

// Constitutional compliance for i18n
export interface I18nConstitutionalCompliance {
  japanesePrimary: boolean; // 日本語が主言語
  englishSecondary: boolean; // 英語は補助
  noAutoTranslation: boolean; // 自動翻訳使用禁止
  contextualTranslation: boolean; // 文脈に応じた翻訳
}