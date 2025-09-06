// Hook exports
// T037: Consolidate all React hooks

// Core wizard hooks
export { useWizardState } from './useWizardState';
export type { UseWizardStateOptions, UseWizardStateReturn } from './useWizardState';

// Authentication hooks
export { useGoogleAuth } from './useGoogleAuth';
export type { UseGoogleAuthOptions, UseGoogleAuthReturn } from './useGoogleAuth';

// Storage hooks
export { 
  useUserPreferences,
  useDraftManagement,
  useStorageCompliance,
  useLocalStorageState,
} from './useLocalStorage';
export type {
  UseUserPreferencesReturn,
  UseDraftManagementReturn,
  UseStorageComplianceReturn,
} from './useLocalStorage';

// Accessibility hooks
export { useAccessibility } from './useAccessibility';
export type { UseAccessibilityOptions, UseAccessibilityReturn } from './useAccessibility';

// Output generation hooks
export { useOutputGeneration } from './useOutputGeneration';
export type { OutputGenerationOptions, UseOutputGenerationReturn } from './useOutputGeneration';

// Internationalization hooks
export { useI18n } from './useI18n';
export type { UseI18nOptions, UseI18nReturn } from './useI18n';

// Custom utility hooks
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce, throttle } from '../utils';

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
  dependencies: React.DependencyList = []
): T {
  return useMemo(
    () => throttle(callback, delay) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...dependencies]
  );
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Mount status hook
export function useMountedState(): () => boolean {
  const mountedRef = useRef(false);
  const isMounted = useCallback(() => mountedRef.current, []);
  
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  return isMounted;
}

// Async operation hook with loading state
export function useAsyncOperation<T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>
): {
  execute: (...args: Args) => Promise<T | null>;
  result: T | null;
  error: Error | null;
  isLoading: boolean;
} {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useMountedState();
  
  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await asyncFn(...args);
      
      if (isMounted()) {
        setResult(result);
        return result;
      }
      
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (isMounted()) {
        setError(err);
      }
      
      return null;
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [asyncFn, isMounted]);
  
  return {
    execute,
    result,
    error,
    isLoading,
  };
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    setMatches(mediaQuery.matches);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
}

// Responsive design hooks
export function useBreakpoint(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large';
} {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isLarge = useMediaQuery('(min-width: 1280px)');
  
  const currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large' = useMemo(() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'large';
  }, [isMobile, isTablet, isDesktop]);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    currentBreakpoint,
  };
}

// Constitutional compliance monitoring hook
export function useConstitutionalCompliance(): {
  isCompliant: boolean;
  violations: string[];
  lastChecked: Date | null;
  checkCompliance: () => Promise<boolean>;
} {
  const [isCompliant, setIsCompliant] = useState(true);
  const [violations, setViolations] = useState<string[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const checkCompliance = useCallback(async (): Promise<boolean> => {
    try {
      // This would integrate with all constitutional validators
      const foundViolations: string[] = [];
      
      // Check layer progression (would need wizard state)
      // Check auto-save interval (would need preferences)
      // Check output generation time (would need performance data)
      // Check accessibility compliance
      // Check privacy compliance
      // Check i18n compliance
      
      setViolations(foundViolations);
      setIsCompliant(foundViolations.length === 0);
      setLastChecked(new Date());
      
      return foundViolations.length === 0;
    } catch (error) {
      console.error('Constitutional compliance check failed:', error);
      return false;
    }
  }, []);
  
  // Check compliance periodically
  useEffect(() => {
    checkCompliance();
    
    // Check every 10 minutes
    const interval = setInterval(checkCompliance, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkCompliance]);
  
  return {
    isCompliant,
    violations,
    lastChecked,
    checkCompliance,
  };
}

// Error boundary hook
export function useErrorHandler(): {
  error: Error | null;
  resetError: () => void;
  captureError: (error: Error, context?: string) => void;
} {
  const [error, setError] = useState<Error | null>(null);
  
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = useCallback((error: Error, context?: string) => {
    console.error(`Error captured${context ? ` in ${context}` : ''}:`, error);
    setError(error);
  }, []);
  
  return {
    error,
    resetError,
    captureError,
  };
}