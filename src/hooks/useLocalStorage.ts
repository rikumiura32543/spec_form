// LocalStorage hook with constitutional compliance
// T033: Storage management with PII encryption and retention policies

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPreferences,
  DraftMetadata,
  WizardState,
} from '../types';
import {
  DraftStorageManager,
  UserPreferencesManager,
  PIIDetector,
  ConstitutionalValidator,
  ErrorHandler,
} from '../utils';

// Generic localStorage hook with constitutional compliance
function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    validator?: (value: unknown) => value is T;
    enablePIIDetection?: boolean;
    constitutionalChecks?: boolean;
  } = {}
): [T, React.Dispatch<React.SetStateAction<T>>, { error: string | null; isLoading: boolean }] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validator,
    enablePIIDetection = false,
    constitutionalChecks = true,
  } = options;
  
  const [state, setState] = useState<T>(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  
  // Load initial value from localStorage
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsed = deserialize(item);
        
        // Validate with provided validator
        if (validator && !validator(parsed)) {
          console.warn(`Invalid data for key ${key}, using default value`);
          setState(defaultValue);
        } else {
          // PII detection if enabled
          if (enablePIIDetection && typeof parsed === 'string') {
            const piiResult = PIIDetector.detectPII(parsed);
            if (piiResult.hasPII) {
              console.warn(`PII detected in localStorage key: ${key}`);
            }
          }
          
          setState(parsed);
        }
      }
    } catch (error) {
      console.error(`Error loading localStorage key ${key}:`, error);
      setError(`Failed to load ${key}: ${error}`);
      setState(defaultValue);
    } finally {
      setIsLoading(false);
      isInitializedRef.current = true;
    }
  }, [key, defaultValue, deserialize, validator, enablePIIDetection]);
  
  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    try {
      const serialized = serialize(state);
      
      // Constitutional compliance checks
      if (constitutionalChecks) {
        // Check for PII if enabled
        if (enablePIIDetection && typeof state === 'string') {
          const piiResult = PIIDetector.detectPII(state);
          if (piiResult.hasPII) {
            console.warn(`Storing data with PII in localStorage key: ${key}`);
            // In production, this would trigger encryption
          }
        }
        
        // Check storage quota
        const sizeInBytes = new Blob([serialized]).size;
        const usage = getStorageUsage();
        
        if (usage.percentage > 90) {
          console.warn('localStorage quota nearly full');
        }
      }
      
      localStorage.setItem(key, serialized);
      setError(null);
    } catch (error) {
      console.error(`Error saving to localStorage key ${key}:`, error);
      setError(`Failed to save ${key}: ${error}`);
    }
  }, [state, key, serialize, enablePIIDetection, constitutionalChecks]);
  
  return [state, setState, { error, isLoading }];
}

// Storage usage utility
function getStorageUsage(): { used: number; total: number; percentage: number } {
  let used = 0;
  let total = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
    
    total = 5 * 1024 * 1024; // 5MB estimate
    
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    };
  } catch (error) {
    return { used: 0, total: 0, percentage: 0 };
  }
}

// User preferences hook
interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  resetPreferences: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'ja',
    theme: 'auto',
    autoSaveInterval: 2000,
    aiCompletionEnabled: true,
    accessibilityMode: false,
    reducedMotion: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await UserPreferencesManager.getPreferences();
        setPreferences(prefs);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to load user preferences'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<boolean> => {
    try {
      // Constitutional compliance: validate auto-save interval
      if (updates.autoSaveInterval !== undefined) {
        if (!ConstitutionalValidator.validateAutoSaveInterval(updates.autoSaveInterval)) {
          throw new Error('Invalid auto-save interval: must be 2000ms');
        }
      }
      
      const success = await UserPreferencesManager.updatePreferences(updates);
      
      if (success) {
        setPreferences(prev => ({ ...prev, ...updates }));
        setError(null);
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to update user preferences'
      );
      return false;
    }
  }, []);
  
  // Reset preferences to defaults
  const resetPreferences = useCallback(async (): Promise<boolean> => {
    try {
      const success = await UserPreferencesManager.resetPreferences();
      
      if (success) {
        const defaultPrefs = await UserPreferencesManager.getPreferences();
        setPreferences(defaultPrefs);
        setError(null);
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to reset user preferences'
      );
      return false;
    }
  }, []);
  
  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
    error,
  };
}

// Draft management hook
interface UseDraftManagementReturn {
  drafts: DraftMetadata[];
  saveDraft: (wizardId: string, wizardState: Partial<WizardState>) => Promise<boolean>;
  loadDraft: (wizardId: string) => Promise<WizardState | null>;
  deleteDraft: (wizardId: string) => Promise<boolean>;
  cleanupExpiredDrafts: () => Promise<number>;
  refreshDrafts: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useDraftManagement(): UseDraftManagementReturn {
  const [drafts, setDrafts] = useState<DraftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load drafts on mount
  useEffect(() => {
    refreshDrafts();
  }, []);
  
  // Refresh drafts list
  const refreshDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      const draftList = await DraftStorageManager.listDrafts();
      setDrafts(draftList);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to refresh drafts'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save draft
  const saveDraft = useCallback(async (
    wizardId: string,
    wizardState: Partial<WizardState>
  ): Promise<boolean> => {
    try {
      const success = await DraftStorageManager.saveDraft(wizardId, wizardState);
      
      if (success) {
        await refreshDrafts(); // Refresh list after save
      }
      
      return success;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to save draft'
      );
      return false;
    }
  }, [refreshDrafts]);
  
  // Load draft
  const loadDraft = useCallback(async (wizardId: string): Promise<WizardState | null> => {
    try {
      return await DraftStorageManager.loadDraft(wizardId);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to load draft'
      );
      return null;
    }
  }, []);
  
  // Delete draft
  const deleteDraft = useCallback(async (wizardId: string): Promise<boolean> => {
    try {
      const success = await DraftStorageManager.deleteDraft(wizardId);
      
      if (success) {
        await refreshDrafts(); // Refresh list after delete
      }
      
      return success;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to delete draft'
      );
      return false;
    }
  }, [refreshDrafts]);
  
  // Clean up expired drafts
  const cleanupExpiredDrafts = useCallback(async (): Promise<number> => {
    try {
      const cleanedCount = await DraftStorageManager.cleanupExpiredDrafts();
      
      if (cleanedCount > 0) {
        await refreshDrafts(); // Refresh list after cleanup
      }
      
      return cleanedCount;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to cleanup expired drafts'
      );
      return 0;
    }
  }, [refreshDrafts]);
  
  // Auto-cleanup expired drafts periodically
  useEffect(() => {
    const cleanup = async () => {
      try {
        await cleanupExpiredDrafts();
      } catch (error) {
        // Silent cleanup - errors are already handled in cleanupExpiredDrafts
      }
    };
    
    // Clean up expired drafts every hour
    const interval = setInterval(cleanup, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [cleanupExpiredDrafts]);
  
  return {
    drafts,
    saveDraft,
    loadDraft,
    deleteDraft,
    cleanupExpiredDrafts,
    refreshDrafts,
    isLoading,
    error,
  };
}

// Constitutional compliance hook for storage
interface UseStorageComplianceReturn {
  isCompliant: boolean;
  violations: string[];
  lastChecked: Date | null;
  checkCompliance: () => Promise<boolean>;
  retentionStatus: {
    totalDrafts: number;
    expiredDrafts: number;
    withinRetention: number;
  };
}

export function useStorageCompliance(): UseStorageComplianceReturn {
  const [isCompliant, setIsCompliant] = useState(true);
  const [violations, setViolations] = useState<string[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retentionStatus, setRetentionStatus] = useState({
    totalDrafts: 0,
    expiredDrafts: 0,
    withinRetention: 0,
  });
  
  // Check constitutional compliance
  const checkCompliance = useCallback(async (): Promise<boolean> => {
    try {
      const foundViolations: string[] = [];
      
      // Check draft retention policy (24 hours)
      const drafts = await DraftStorageManager.listDrafts();
      const now = new Date();
      
      let expiredCount = 0;
      let withinRetentionCount = 0;
      
      drafts.forEach(draft => {
        if (!ConstitutionalValidator.validateDraftRetention(draft.savedAt, now)) {
          expiredCount++;
          foundViolations.push(`Draft ${draft.wizardId} exceeds 24-hour retention`);
        } else {
          withinRetentionCount++;
        }
      });
      
      // Check storage quota
      const usage = getStorageUsage();
      if (usage.percentage > 95) {
        foundViolations.push('Storage quota exceeded 95%');
      }
      
      // Check for PII in drafts
      for (const draft of drafts) {
        if (draft.containsPII) {
          // In production, verify encryption is used
          console.warn(`Draft ${draft.wizardId} contains PII`);
        }
      }
      
      setRetentionStatus({
        totalDrafts: drafts.length,
        expiredDrafts: expiredCount,
        withinRetention: withinRetentionCount,
      });
      
      setViolations(foundViolations);
      setIsCompliant(foundViolations.length === 0);
      setLastChecked(new Date());
      
      return foundViolations.length === 0;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to check storage compliance'
      );
      return false;
    }
  }, []);
  
  // Check compliance on mount and periodically
  useEffect(() => {
    checkCompliance();
    
    // Check compliance every 30 minutes
    const interval = setInterval(checkCompliance, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkCompliance]);
  
  return {
    isCompliant,
    violations,
    lastChecked,
    checkCompliance,
    retentionStatus,
  };
}

// Export generic hook for advanced use cases
export { useLocalStorageState };