// Wizard state management hook
// T031: Core wizard state management with constitutional compliance

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WizardState,
  AnswerValue,
  ValidationError,
  QuestionDefinition,
  StepNavigationState,
  ConstitutionalViolationError,
} from '../types';
import {
  ConstitutionalValidator,
  QuestionValidator,
  DraftStorageManager,
  UUIDGenerator,
  ErrorHandler,
  debounce,
} from '../utils';

interface UseWizardStateOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableDrafts?: boolean;
  questions: QuestionDefinition[];
}

interface UseWizardStateReturn {
  // State
  wizardState: WizardState;
  navigationState: StepNavigationState;
  validationErrors: Record<string, ValidationError[]>;
  isLoading: boolean;
  isDraftSaving: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  setAnswer: (questionId: string, value: AnswerValue) => void;
  nextStep: () => Promise<boolean>;
  previousStep: () => boolean;
  goToStep: (step: number) => boolean;
  saveDraft: () => Promise<boolean>;
  loadDraft: (wizardId: string) => Promise<boolean>;
  reset: () => void;
  complete: () => Promise<boolean>;
  
  // Validation
  validateCurrentStep: () => ValidationError[];
  validateAllSteps: () => Record<string, ValidationError[]>;
  
  // Draft management
  hasDraft: boolean;
  canContinueFromDraft: boolean;
}

export function useWizardState({
  autoSave = true,
  autoSaveInterval = 2000, // Constitutional requirement: 2 seconds
  enableDrafts = true,
  questions,
}: UseWizardStateOptions): UseWizardStateReturn {
  const [wizardState, setWizardState] = useState<WizardState>(() => ({
    id: UUIDGenerator.generate(),
    currentStep: 1,
    currentLayer: 1,
    answers: {},
    startedAt: new Date(),
    lastModified: new Date(),
    isComplete: false,
    draftSaved: false,
    validationErrors: {},
  }));
  
  const [validationErrors, setValidationErrors] = useState<Record<string, ValidationError[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const stateRef = useRef(wizardState);
  
  // Keep ref updated for auto-save
  useEffect(() => {
    stateRef.current = wizardState;
  }, [wizardState]);
  
  // Constitutional compliance validation
  const validateConstitutionalCompliance = useCallback((state: WizardState): void => {
    // Validate layer progression
    if (!ConstitutionalValidator.validateLayerProgression(state.currentStep, state.currentLayer)) {
      throw new ConstitutionalViolationError(
        `Invalid layer progression: Step ${state.currentStep} in Layer ${state.currentLayer}`,
        'layerProgression'
      );
    }
    
    // Validate auto-save interval
    if (autoSave && !ConstitutionalValidator.validateAutoSaveInterval(autoSaveInterval)) {
      throw new ConstitutionalViolationError(
        `Invalid auto-save interval: ${autoSaveInterval}ms (must be 2000ms)`,
        'autoSaveInterval'
      );
    }
  }, [autoSave, autoSaveInterval]);
  
  // Calculate navigation state
  const calculateNavigationState = useCallback((state: WizardState): StepNavigationState => {
    const currentQuestion = questions.find(q => q.step === state.currentStep);
    const currentErrors = validationErrors[currentQuestion?.id || ''] || [];
    
    // Can go next if current step is valid (or not required)
    const canGoNext = state.currentStep < 15 && (
      !currentQuestion?.required || 
      (currentQuestion.required && currentErrors.length === 0)
    );
    
    const canGoPrevious = state.currentStep > 1;
    
    const nextStep = canGoNext ? state.currentStep + 1 : null;
    const previousStep = canGoPrevious ? state.currentStep - 1 : null;
    const progressPercentage = Math.round((state.currentStep / 15) * 100);
    
    return {
      canGoNext,
      canGoPrevious,
      nextStep,
      previousStep,
      progressPercentage,
    };
  }, [questions, validationErrors]);
  
  const navigationState = calculateNavigationState(wizardState);
  
  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    debounce(async () => {
      if (!enableDrafts || !autoSave) return;
      
      try {
        setIsDraftSaving(true);
        const success = await DraftStorageManager.saveDraft(
          stateRef.current.id,
          stateRef.current
        );
        
        if (success) {
          setLastSavedAt(new Date());
          setWizardState(prev => ({ ...prev, draftSaved: true }));
        }
      } catch (error) {
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Auto-save failed'
        );
      } finally {
        setIsDraftSaving(false);
      }
    }, autoSaveInterval),
    [enableDrafts, autoSave, autoSaveInterval]
  );
  
  // Trigger auto-save when state changes
  useEffect(() => {
    if (autoSave && !wizardState.isComplete) {
      debouncedAutoSave();
    }
  }, [wizardState, autoSave, debouncedAutoSave]);
  
  // Layer calculation based on step
  const getLayerFromStep = useCallback((step: number): 1 | 2 | 3 => {
    if (step <= 5) return 1;
    if (step <= 10) return 2;
    return 3;
  }, []);
  
  // Set answer for a question
  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setWizardState(prev => {
      const newState = {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: value,
        },
        lastModified: new Date(),
        draftSaved: false,
      };
      
      // Validate constitutional compliance
      validateConstitutionalCompliance(newState);
      
      return newState;
    });
    
    // Validate the specific answer
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const errors = QuestionValidator.validateAnswer(question, value, wizardState.answers);
      setValidationErrors(prev => ({
        ...prev,
        [questionId]: errors,
      }));
    }
  }, [questions, wizardState.answers, validateConstitutionalCompliance]);
  
  // Navigate to next step
  const nextStep = useCallback(async (): Promise<boolean> => {
    const currentQuestion = questions.find(q => q.step === wizardState.currentStep);
    
    if (!currentQuestion) return false;
    
    // Validate current step
    const errors = QuestionValidator.validateAnswer(
      currentQuestion,
      wizardState.answers[currentQuestion.id],
      wizardState.answers
    );
    
    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [currentQuestion.id]: errors,
      }));
      return false;
    }
    
    if (wizardState.currentStep >= 15) return false;
    
    const newStep = wizardState.currentStep + 1;
    const newLayer = getLayerFromStep(newStep);
    
    setWizardState(prev => {
      const newState = {
        ...prev,
        currentStep: newStep,
        currentLayer: newLayer,
        lastModified: new Date(),
        draftSaved: false,
      };
      
      validateConstitutionalCompliance(newState);
      return newState;
    });
    
    return true;
  }, [wizardState, questions, getLayerFromStep, validateConstitutionalCompliance]);
  
  // Navigate to previous step
  const previousStep = useCallback((): boolean => {
    if (wizardState.currentStep <= 1) return false;
    
    const newStep = wizardState.currentStep - 1;
    const newLayer = getLayerFromStep(newStep);
    
    setWizardState(prev => ({
      ...prev,
      currentStep: newStep,
      currentLayer: newLayer,
      lastModified: new Date(),
      draftSaved: false,
    }));
    
    return true;
  }, [wizardState.currentStep, getLayerFromStep]);
  
  // Go to specific step
  const goToStep = useCallback((step: number): boolean => {
    if (step < 1 || step > 15) return false;
    
    const newLayer = getLayerFromStep(step);
    
    setWizardState(prev => {
      const newState = {
        ...prev,
        currentStep: step,
        currentLayer: newLayer,
        lastModified: new Date(),
        draftSaved: false,
      };
      
      validateConstitutionalCompliance(newState);
      return newState;
    });
    
    return true;
  }, [getLayerFromStep, validateConstitutionalCompliance]);
  
  // Manually save draft
  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!enableDrafts) return false;
    
    try {
      setIsDraftSaving(true);
      const success = await DraftStorageManager.saveDraft(wizardState.id, wizardState);
      
      if (success) {
        setLastSavedAt(new Date());
        setWizardState(prev => ({ ...prev, draftSaved: true }));
      }
      
      return success;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Manual save draft failed'
      );
      return false;
    } finally {
      setIsDraftSaving(false);
    }
  }, [wizardState, enableDrafts]);
  
  // Load draft
  const loadDraft = useCallback(async (wizardId: string): Promise<boolean> => {
    if (!enableDrafts) return false;
    
    try {
      setIsLoading(true);
      const draftState = await DraftStorageManager.loadDraft(wizardId);
      
      if (draftState) {
        // Validate constitutional compliance of loaded state
        validateConstitutionalCompliance(draftState);
        
        setWizardState(draftState);
        setLastSavedAt(draftState.lastModified);
        setHasDraft(true);
        return true;
      }
      
      return false;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Load draft failed'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableDrafts, validateConstitutionalCompliance]);
  
  // Reset wizard to initial state
  const reset = useCallback(() => {
    setWizardState({
      id: UUIDGenerator.generate(),
      currentStep: 1,
      currentLayer: 1,
      answers: {},
      startedAt: new Date(),
      lastModified: new Date(),
      isComplete: false,
      draftSaved: false,
      validationErrors: {},
    });
    
    setValidationErrors({});
    setLastSavedAt(null);
    setHasDraft(false);
  }, []);
  
  // Complete wizard
  const complete = useCallback(async (): Promise<boolean> => {
    // Validate all steps
    const allErrors = QuestionValidator.validateAllAnswers(questions, wizardState.answers);
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      return false;
    }
    
    // Mark as complete
    setWizardState(prev => ({
      ...prev,
      isComplete: true,
      lastModified: new Date(),
    }));
    
    // Clean up auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    return true;
  }, [questions, wizardState.answers]);
  
  // Validation functions
  const validateCurrentStep = useCallback((): ValidationError[] => {
    const currentQuestion = questions.find(q => q.step === wizardState.currentStep);
    
    if (!currentQuestion) return [];
    
    return QuestionValidator.validateAnswer(
      currentQuestion,
      wizardState.answers[currentQuestion.id],
      wizardState.answers
    );
  }, [questions, wizardState]);
  
  const validateAllSteps = useCallback((): Record<string, ValidationError[]> => {
    return QuestionValidator.validateAllAnswers(questions, wizardState.answers);
  }, [questions, wizardState.answers]);
  
  // Check for existing draft on mount
  useEffect(() => {
    if (enableDrafts) {
      const checkForDraft = async () => {
        const hasDraftResult = await DraftStorageManager.hasDraft(wizardState.id);
        setHasDraft(hasDraftResult);
      };
      
      ErrorHandler.safeAsyncCall(
        checkForDraft,
        undefined,
        'Check for existing draft'
      );
    }
  }, [wizardState.id, enableDrafts]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  
  const canContinueFromDraft = hasDraft && !wizardState.isComplete;
  
  return {
    // State
    wizardState,
    navigationState,
    validationErrors,
    isLoading,
    isDraftSaving,
    lastSavedAt,
    
    // Actions
    setAnswer,
    nextStep,
    previousStep,
    goToStep,
    saveDraft,
    loadDraft,
    reset,
    complete,
    
    // Validation
    validateCurrentStep,
    validateAllSteps,
    
    // Draft management
    hasDraft,
    canContinueFromDraft,
  };
}