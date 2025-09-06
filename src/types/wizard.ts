// Core wizard type definitions
// T019: Define WizardState interface with Zod schema validation

import { z } from 'zod';

// UUID validation schema
const UUIDSchema = z.string().uuid();

// Layer constraint (1, 2, or 3)
const LayerSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

// Step constraint (1-15)
const StepSchema = z.number().int().min(1).max(15);

// Answer value schema - supports multiple data types
export const AnswerValueSchema = z.union([
  z.string(),
  z.number(), 
  z.boolean(),
  z.array(z.string()),
  z.record(z.string(), z.unknown()),
]);

// Answer data with metadata
export const AnswerDataSchema = z.object({
  questionId: z.string(),
  value: AnswerValueSchema,
  confidence: z.number().min(0).max(1).optional(),
  containsPII: z.boolean().default(false),
  lastModified: z.date(),
  validationErrors: z.array(z.string()).default([]),
});

// Validation error structure
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

// Main wizard state schema
export const WizardStateSchema = z.object({
  // Core identifiers
  id: UUIDSchema,
  currentStep: StepSchema,
  currentLayer: LayerSchema,
  
  // Answer storage
  answers: z.record(z.string(), AnswerValueSchema).default({}),
  
  // Timestamps
  startedAt: z.date(),
  lastModified: z.date(),
  
  // State flags
  isComplete: z.boolean().default(false),
  draftSaved: z.boolean().default(false),
  
  // Validation
  validationErrors: z.record(z.string(), z.array(z.string())).default({}),
});

// Export TypeScript types
export type WizardState = z.infer<typeof WizardStateSchema>;
export type AnswerData = z.infer<typeof AnswerDataSchema>;
export type AnswerValue = z.infer<typeof AnswerValueSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Question definition interface
export interface QuestionDefinition {
  id: string;
  layer: 1 | 2 | 3;
  step: number;
  type: 'short-text' | 'long-text' | 'single-choice' | 'multiple-choice' | 'numeric';
  required: boolean;
  
  // i18n keys
  titleKey: string;
  descriptionKey?: string;
  placeholderKey?: string;
  helpTextKey?: string;
  
  // Validation
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  
  // Choice options (for choice questions)
  options?: Array<{
    value: string;
    labelKey: string;
    descriptionKey?: string;
  }>;
  
  // Dependencies
  dependsOn?: string[];
  showIf?: (answers: Record<string, AnswerValue>) => boolean;
}

// Step navigation state
export interface StepNavigationState {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextStep: number | null;
  previousStep: number | null;
  progressPercentage: number;
}

// Draft metadata for storage
export interface DraftMetadata {
  wizardId: string;
  savedAt: Date;
  expiresAt: Date;
  currentStep: number;
  answersCount: number;
  containsPII: boolean;
  size?: number;
  checksum?: string;
}

// Output generation types
export interface OutputSpecification {
  summary: {
    text: string;
    keyTerms: string[];
    confidence: number;
  };
  structuredData: {
    purpose: {
      primary: string;
      secondary?: string[];
    };
    stakeholders: {
      primary: string[];
      secondary?: string[];
    };
    requirements: {
      functional: string[];
      nonFunctional: string[];
    };
    constraints: string[];
    success_criteria: string[];
  };
  markdownSpec: {
    content: string;
    wordCount: number;
    sections: string[];
  };
}

// Constitutional compliance types
export interface ConstitutionalCompliance {
  layerProgression: boolean;        // 3レイヤー15問構成
  draftRetention: boolean;          // 24時間自動削除
  autoSaveInterval: boolean;        // 2秒間隔保存
  outputGenerationTime: boolean;    // 5秒以内生成
  noExternalTransmission: boolean;  // コアワークフロー中外部送信なし
  accessibilityCompliance: boolean; // WCAG 2.1 AA準拠
  privacyCompliance: boolean;       // PII検出・暗号化
}

// Error types
export class WizardValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'WizardValidationError';
  }
}

export class ConstitutionalViolationError extends Error {
  constructor(
    message: string,
    public requirement: keyof ConstitutionalCompliance
  ) {
    super(message);
    this.name = 'ConstitutionalViolationError';
  }
}