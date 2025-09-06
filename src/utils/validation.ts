// Form validation utilities
// T025: Implement validation logic with constitutional compliance

import { z } from 'zod';
import { 
  AnswerValue, 
  QuestionDefinition, 
  ValidationError,
  WizardValidationError,
  ConstitutionalViolationError 
} from '../types';

// PII detection patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+81|0)\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}/g,
  phoneAlt: /\d{3}-\d{4}-\d{4}/g,
  address: /(〒|\u3012)\d{3}[-\s]?\d{4}/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  socialSecurityJP: /\d{4}-\d{2}-\d{4}/g,
  personalNumber: /\d{12}/g,
} as const;

// Constitutional compliance validator
export class ConstitutionalValidator {
  static validateLayerProgression(currentStep: number, currentLayer: number): boolean {
    // Validate 3-layer 15-question structure
    const layerRanges = {
      1: [1, 5],   // Layer 1: Steps 1-5
      2: [6, 10],  // Layer 2: Steps 6-10  
      3: [11, 15], // Layer 3: Steps 11-15
    };
    
    const [min, max] = layerRanges[currentLayer as keyof typeof layerRanges];
    return currentStep >= min && currentStep <= max;
  }
  
  static validateAutoSaveInterval(intervalMs: number): boolean {
    // Constitutional requirement: 2-second auto-save interval
    return intervalMs === 2000;
  }
  
  static validateOutputGenerationTime(startTime: Date, endTime: Date): boolean {
    // Constitutional requirement: 5-second maximum generation time
    const durationMs = endTime.getTime() - startTime.getTime();
    return durationMs <= 5000;
  }
  
  static validateDraftRetention(savedAt: Date, currentTime: Date = new Date()): boolean {
    // Constitutional requirement: 24-hour automatic deletion
    const hoursDiff = (currentTime.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  }
}

// PII detection utility
export class PIIDetector {
  static detectPII(text: string): {
    hasPII: boolean;
    types: Array<'email' | 'phone' | 'address' | 'creditCard' | 'personalId'>;
    confidence: number;
    locations: Array<{
      type: string;
      start: number;
      end: number;
      value: string;
    }>;
  } {
    const locations: Array<{
      type: string;
      start: number;
      end: number;
      value: string;
    }> = [];
    
    const types = new Set<'email' | 'phone' | 'address' | 'creditCard' | 'personalId'>();
    
    // Check for each PII type
    Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        locations.push({
          type,
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
        });
        
        if (type === 'email') types.add('email');
        else if (type.includes('phone')) types.add('phone');
        else if (type === 'address') types.add('address');
        else if (type === 'creditCard') types.add('creditCard');
        else types.add('personalId');
      }
    });
    
    const hasPII = locations.length > 0;
    const confidence = hasPII ? Math.min(locations.length * 0.3, 1) : 0;
    
    return {
      hasPII,
      types: Array.from(types),
      confidence,
      locations,
    };
  }
  
  static requiresEncryption(text: string): boolean {
    const { hasPII, confidence } = this.detectPII(text);
    return hasPII && confidence > 0.3;
  }
}

// Answer validation functions
export class AnswerValidator {
  static validateRequired(value: AnswerValue): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'boolean') return true;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  }
  
  static validateLength(value: string, min?: number, max?: number): boolean {
    const length = value.trim().length;
    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;
    return true;
  }
  
  static validatePattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }
  
  static validateNumeric(value: AnswerValue): boolean {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return !isNaN(num);
    }
    return false;
  }
  
  static validateEmail(value: string): boolean {
    return PII_PATTERNS.email.test(value);
  }
  
  static validateChoice(value: AnswerValue, options: string[]): boolean {
    if (typeof value === 'string') {
      return options.includes(value);
    }
    if (Array.isArray(value)) {
      return value.every(v => typeof v === 'string' && options.includes(v));
    }
    return false;
  }
}

// Question-specific validation
export class QuestionValidator {
  static validateAnswer(
    question: QuestionDefinition,
    value: AnswerValue,
    allAnswers?: Record<string, AnswerValue>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Required field validation
    if (question.required && !AnswerValidator.validateRequired(value)) {
      errors.push({
        field: question.id,
        message: 'validation.required',
        code: 'REQUIRED',
      });
    }
    
    // Skip further validation if no value
    if (!AnswerValidator.validateRequired(value)) {
      return errors;
    }
    
    const stringValue = typeof value === 'string' ? value : String(value);
    
    // Length validation
    if (question.minLength || question.maxLength) {
      if (!AnswerValidator.validateLength(stringValue, question.minLength, question.maxLength)) {
        errors.push({
          field: question.id,
          message: question.minLength 
            ? `validation.minLength` 
            : `validation.maxLength`,
          code: 'LENGTH',
        });
      }
    }
    
    // Pattern validation
    if (question.pattern && typeof value === 'string') {
      if (!AnswerValidator.validatePattern(value, question.pattern)) {
        errors.push({
          field: question.id,
          message: 'validation.pattern',
          code: 'PATTERN',
        });
      }
    }
    
    // Type-specific validation
    switch (question.type) {
      case 'numeric':
        if (!AnswerValidator.validateNumeric(value)) {
          errors.push({
            field: question.id,
            message: 'validation.numeric',
            code: 'TYPE',
          });
        }
        break;
        
      case 'single-choice':
      case 'multiple-choice':
        if (question.options) {
          const optionValues = question.options.map(opt => opt.value);
          if (!AnswerValidator.validateChoice(value, optionValues)) {
            errors.push({
              field: question.id,
              message: 'validation.invalidChoice',
              code: 'CHOICE',
            });
          }
        }
        break;
    }
    
    // Dependency validation
    if (question.dependsOn && allAnswers) {
      const missingDependencies = question.dependsOn.filter(
        depId => !AnswerValidator.validateRequired(allAnswers[depId])
      );
      
      if (missingDependencies.length > 0) {
        errors.push({
          field: question.id,
          message: 'validation.dependencyNotMet',
          code: 'DEPENDENCY',
        });
      }
    }
    
    // Conditional display validation
    if (question.showIf && allAnswers) {
      if (!question.showIf(allAnswers)) {
        // Question should not be visible, so clear any validation errors
        return [];
      }
    }
    
    return errors;
  }
  
  static validateAllAnswers(
    questions: QuestionDefinition[],
    answers: Record<string, AnswerValue>
  ): Record<string, ValidationError[]> {
    const allErrors: Record<string, ValidationError[]> = {};
    
    questions.forEach(question => {
      const value = answers[question.id];
      const errors = this.validateAnswer(question, value, answers);
      
      if (errors.length > 0) {
        allErrors[question.id] = errors;
      }
    });
    
    return allErrors;
  }
}

// Form validation utilities
export class FormValidator {
  static createValidationSchema(questions: QuestionDefinition[]): z.ZodSchema<any> {
    const schemaShape: Record<string, z.ZodTypeAny> = {};
    
    questions.forEach(question => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (question.type) {
        case 'short-text':
        case 'long-text':
          fieldSchema = z.string();
          if (question.minLength) {
            fieldSchema = fieldSchema.min(question.minLength);
          }
          if (question.maxLength) {
            fieldSchema = fieldSchema.max(question.maxLength);
          }
          if (question.pattern) {
            fieldSchema = fieldSchema.regex(question.pattern);
          }
          break;
          
        case 'numeric':
          fieldSchema = z.number();
          break;
          
        case 'single-choice':
          if (question.options) {
            const values = question.options.map(opt => opt.value);
            fieldSchema = z.enum(values as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;
          
        case 'multiple-choice':
          if (question.options) {
            const values = question.options.map(opt => opt.value);
            fieldSchema = z.array(z.enum(values as [string, ...string[]]));
          } else {
            fieldSchema = z.array(z.string());
          }
          break;
          
        default:
          fieldSchema = z.unknown();
      }
      
      if (!question.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaShape[question.id] = fieldSchema;
    });
    
    return z.object(schemaShape);
  }
  
  static async validateForm(
    questions: QuestionDefinition[],
    answers: Record<string, AnswerValue>
  ): Promise<{
    isValid: boolean;
    errors: Record<string, ValidationError[]>;
    piiDetected: boolean;
    constitutionalCompliance: boolean;
  }> {
    // Standard validation
    const errors = QuestionValidator.validateAllAnswers(questions, answers);
    const isValid = Object.keys(errors).length === 0;
    
    // PII detection
    let piiDetected = false;
    Object.values(answers).forEach(value => {
      if (typeof value === 'string') {
        const piiResult = PIIDetector.detectPII(value);
        if (piiResult.hasPII) {
          piiDetected = true;
        }
      }
    });
    
    // Constitutional compliance check
    let constitutionalCompliance = true;
    
    // Check if we have exactly 15 questions across 3 layers
    const layerCounts = [0, 0, 0];
    questions.forEach(q => {
      layerCounts[q.layer - 1]++;
    });
    
    if (layerCounts[0] !== 5 || layerCounts[1] !== 5 || layerCounts[2] !== 5) {
      constitutionalCompliance = false;
      throw new ConstitutionalViolationError(
        '3レイヤー15問構成に違反しています',
        'layerProgression'
      );
    }
    
    return {
      isValid,
      errors,
      piiDetected,
      constitutionalCompliance,
    };
  }
}

// Sanitization utilities
export class DataSanitizer {
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }
  
  static sanitizeAnswerValue(value: AnswerValue): AnswerValue {
    if (typeof value === 'string') {
      return this.sanitizeText(value);
    }
    if (Array.isArray(value)) {
      return value.map(v => typeof v === 'string' ? this.sanitizeText(v) : v);
    }
    return value;
  }
  
  static sanitizeAllAnswers(answers: Record<string, AnswerValue>): Record<string, AnswerValue> {
    const sanitized: Record<string, AnswerValue> = {};
    
    Object.entries(answers).forEach(([key, value]) => {
      sanitized[key] = this.sanitizeAnswerValue(value);
    });
    
    return sanitized;
  }
}