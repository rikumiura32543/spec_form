// Accessibility hook with WCAG 2.1 AA compliance
// T034: Accessibility state management and screen reader support

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AccessibilityFocusManager,
  ScreenReaderAnnouncer,
  HighContrastDetector,
  ReducedMotionDetector,
  focusManager,
  screenReader,
} from '../utils';
import { UserPreferences } from '../types';

interface AccessibilityState {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isKeyboardNavigation: boolean;
  isFocusVisible: boolean;
  screenReaderActive: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  announcements: string[];
}

interface UseAccessibilityOptions {
  enableAnnouncements?: boolean;
  enableFocusManagement?: boolean;
  enableKeyboardNavigation?: boolean;
  preferences?: UserPreferences;
}

interface UseAccessibilityReturn {
  // State
  a11yState: AccessibilityState;
  isAccessibilityMode: boolean;
  
  // Focus management
  focusElement: (element: HTMLElement | string) => void;
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  manageFocusForStep: (stepContainer: HTMLElement) => void;
  
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceStepChange: (step: number, total: number, question: string) => void;
  announceError: (errors: string[]) => void;
  announceSuccess: (message: string) => void;
  clearAnnouncements: () => void;
  
  // Keyboard navigation
  handleKeyboardNavigation: (event: React.KeyboardEvent, context?: string) => void;
  registerKeyboardShortcuts: (shortcuts: Record<string, () => void>) => () => void;
  
  // Preferences
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  
  // Validation
  validateWCAGCompliance: () => Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }>;
}

export function useAccessibility({
  enableAnnouncements = true,
  enableFocusManagement = true,
  enableKeyboardNavigation = true,
  preferences,
}: UseAccessibilityOptions = {}): UseAccessibilityReturn {
  const [a11yState, setA11yState] = useState<AccessibilityState>({
    isHighContrast: false,
    isReducedMotion: false,
    isKeyboardNavigation: false,
    isFocusVisible: false,
    screenReaderActive: false,
    fontSize: 'normal',
    announcements: [],
  });
  
  const announcementTimeoutsRef = useRef<number[]>([]);
  const keyboardShortcutsRef = useRef<Map<string, () => void>>(new Map());
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  
  // Detect accessibility preferences on mount
  useEffect(() => {
    const detectAccessibilityFeatures = () => {
      const isHighContrast = HighContrastDetector.isHighContrastMode();
      const isReducedMotion = ReducedMotionDetector.isReducedMotionPreferred();
      
      // Detect screen reader (simplified detection)
      const hasScreenReader = 
        navigator.userAgent.includes('NVDA') || 
        navigator.userAgent.includes('JAWS') || 
        'speechSynthesis' in window;
      
      setA11yState(prev => ({
        ...prev,
        isHighContrast,
        isReducedMotion,
        screenReaderActive: hasScreenReader,
      }));
    };
    
    detectAccessibilityFeatures();
    
    // Listen for media query changes
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setA11yState(prev => ({ ...prev, isHighContrast: e.matches }));
    };
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setA11yState(prev => ({ ...prev, isReducedMotion: e.matches }));
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);
  
  // Apply user preferences
  useEffect(() => {
    if (preferences) {
      setA11yState(prev => ({
        ...prev,
        isReducedMotion: preferences.reducedMotion || prev.isReducedMotion,
      }));
    }
  }, [preferences]);
  
  // Detect keyboard navigation
  useEffect(() => {
    let keyboardUsed = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key.startsWith('Arrow')) {
        keyboardUsed = true;
        setA11yState(prev => ({ 
          ...prev, 
          isKeyboardNavigation: true,
          isFocusVisible: true 
        }));
      }
    };
    
    const handleMouseDown = () => {
      if (keyboardUsed) {
        setA11yState(prev => ({ 
          ...prev, 
          isFocusVisible: false 
        }));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  // Focus management functions
  const focusElement = useCallback((element: HTMLElement | string) => {
    if (!enableFocusManagement) return;
    
    let targetElement: HTMLElement | null = null;
    
    if (typeof element === 'string') {
      targetElement = document.querySelector(element);
    } else {
      targetElement = element;
    }
    
    if (targetElement && targetElement.focus) {
      // Store previous focus for restoration
      if (document.activeElement && document.activeElement !== document.body) {
        lastFocusedElementRef.current = document.activeElement as HTMLElement;
      }
      
      targetElement.focus();
    }
  }, [enableFocusManagement]);
  
  const trapFocus = useCallback((container: HTMLElement): (() => void) => {
    if (!enableFocusManagement) {
      return () => {};
    }
    
    return focusManager.trapFocus(container);
  }, [enableFocusManagement]);
  
  const restoreFocus = useCallback(() => {
    if (!enableFocusManagement) return;
    
    if (lastFocusedElementRef.current) {
      focusManager.restoreFocus(lastFocusedElementRef.current);
      lastFocusedElementRef.current = null;
    } else {
      focusManager.restoreFocus();
    }
  }, [enableFocusManagement]);
  
  const manageFocusForStep = useCallback((stepContainer: HTMLElement) => {
    if (!enableFocusManagement) return;
    
    // Focus the first input in the step
    const success = focusManager.focusFirstTabbable(stepContainer);
    
    if (!success) {
      // Fallback: focus the container itself
      stepContainer.focus();
    }
  }, [enableFocusManagement]);
  
  // Announcement functions
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!enableAnnouncements) return;
    
    if (priority === 'assertive') {
      screenReader.announceValidationError([message]);
    } else {
      screenReader.announceSuccess(message);
    }
    
    // Add to announcements history
    setA11yState(prev => ({
      ...prev,
      announcements: [...prev.announcements.slice(-9), message], // Keep last 10
    }));
    
    // Clear announcement after 5 seconds
    const timeoutId = window.setTimeout(() => {
      setA11yState(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a !== message),
      }));
    }, 5000);
    
    announcementTimeoutsRef.current.push(timeoutId);
  }, [enableAnnouncements]);
  
  const announceStepChange = useCallback((
    step: number, 
    total: number, 
    question: string
  ) => {
    if (!enableAnnouncements) return;
    
    screenReader.announceStepChange(step, total, question);
  }, [enableAnnouncements]);
  
  const announceError = useCallback((errors: string[]) => {
    if (!enableAnnouncements || errors.length === 0) return;
    
    screenReader.announceValidationError(errors);
  }, [enableAnnouncements]);
  
  const announceSuccess = useCallback((message: string) => {
    if (!enableAnnouncements) return;
    
    screenReader.announceSuccess(message);
    announce(message, 'polite');
  }, [enableAnnouncements, announce]);
  
  const clearAnnouncements = useCallback(() => {
    // Clear all pending timeouts
    announcementTimeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    announcementTimeoutsRef.current = [];
    
    // Clear announcements state
    setA11yState(prev => ({
      ...prev,
      announcements: [],
    }));
  }, []);
  
  // Keyboard navigation
  const handleKeyboardNavigation = useCallback((
    event: React.KeyboardEvent,
    context?: string
  ) => {
    if (!enableKeyboardNavigation) return;
    
    const { key, ctrlKey, altKey, shiftKey } = event;
    
    // Handle common shortcuts
    const shortcutKey = [
      ctrlKey && 'Ctrl',
      altKey && 'Alt', 
      shiftKey && 'Shift',
      key
    ].filter(Boolean).join('+');
    
    const handler = keyboardShortcutsRef.current.get(shortcutKey);
    if (handler) {
      event.preventDefault();
      handler();
      return;
    }
    
    // Context-specific navigation
    switch (context) {
      case 'wizard':
        if (key === 'Enter' && !shiftKey) {
          // Handle next step
          const nextButton = document.querySelector('[data-action="next"]') as HTMLButtonElement;
          if (nextButton && !nextButton.disabled) {
            event.preventDefault();
            nextButton.click();
          }
        }
        break;
        
      case 'modal':
        if (key === 'Escape') {
          // Handle modal close
          const closeButton = document.querySelector('[data-action="close"]') as HTMLButtonElement;
          if (closeButton) {
            event.preventDefault();
            closeButton.click();
          }
        }
        break;
    }
  }, [enableKeyboardNavigation]);
  
  const registerKeyboardShortcuts = useCallback((
    shortcuts: Record<string, () => void>
  ): (() => void) => {
    Object.entries(shortcuts).forEach(([key, handler]) => {
      keyboardShortcutsRef.current.set(key, handler);
    });
    
    // Return cleanup function
    return () => {
      Object.keys(shortcuts).forEach(key => {
        keyboardShortcutsRef.current.delete(key);
      });
    };
  }, []);
  
  // Preference toggles
  const toggleHighContrast = useCallback(() => {
    setA11yState(prev => ({
      ...prev,
      isHighContrast: !prev.isHighContrast,
    }));
    
    // Apply high contrast styles
    document.documentElement.classList.toggle('high-contrast');
  }, []);
  
  const toggleReducedMotion = useCallback(() => {
    setA11yState(prev => ({
      ...prev,
      isReducedMotion: !prev.isReducedMotion,
    }));
    
    // Apply reduced motion styles
    document.documentElement.classList.toggle('reduced-motion');
  }, []);
  
  const increaseFontSize = useCallback(() => {
    setA11yState(prev => {
      const sizeMap = { normal: 'large', large: 'larger', larger: 'larger' } as const;
      const newSize = sizeMap[prev.fontSize];
      
      // Apply font size class
      document.documentElement.className = document.documentElement.className
        .replace(/font-size-\w+/, '') + ` font-size-${newSize}`;
      
      return { ...prev, fontSize: newSize };
    });
  }, []);
  
  const decreaseFontSize = useCallback(() => {
    setA11yState(prev => {
      const sizeMap = { larger: 'large', large: 'normal', normal: 'normal' } as const;
      const newSize = sizeMap[prev.fontSize];
      
      // Apply font size class
      document.documentElement.className = document.documentElement.className
        .replace(/font-size-\w+/, '') + ` font-size-${newSize}`;
      
      return { ...prev, fontSize: newSize };
    });
  }, []);
  
  const resetFontSize = useCallback(() => {
    setA11yState(prev => ({ ...prev, fontSize: 'normal' }));
    
    // Remove font size classes
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/, '');
  }, []);
  
  // WCAG compliance validation
  const validateWCAGCompliance = useCallback(async () => {
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let hasH1 = false;
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level === 1) hasH1 = true;
      
      if (previousLevel > 0 && level > previousLevel + 1) {
        violations.push(`Heading level skipped: ${heading.tagName} after h${previousLevel}`);
      }
      
      previousLevel = level;
    });
    
    if (!hasH1) {
      violations.push('No h1 element found on page');
    }
    
    // Check for alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        violations.push(`Image ${index + 1} missing alt attribute`);
      }
    });
    
    // Check for form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = input.hasAttribute('aria-label') ||
                     input.hasAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        violations.push(`Form input ${index + 1} missing label`);
      }
    });
    
    // Check for sufficient color contrast (simplified)
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, label');
    let lowContrastCount = 0;
    
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // This is a simplified check - full implementation would parse colors and calculate contrast
      if (color === backgroundColor) {
        lowContrastCount++;
      }
    });
    
    if (lowContrastCount > 0) {
      violations.push(`${lowContrastCount} elements may have insufficient color contrast`);
      recommendations.push('Check color contrast ratios meet WCAG AA standards (4.5:1)');
    }
    
    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    if (skipLinks.length === 0) {
      recommendations.push('Consider adding skip links for keyboard navigation');
    }
    
    // Check for live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    if (liveRegions.length === 0) {
      recommendations.push('Consider adding ARIA live regions for dynamic content');
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      recommendations,
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all announcement timeouts
      announcementTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      
      // Clear keyboard shortcuts
      keyboardShortcutsRef.current.clear();
      
      // Remove document classes
      document.documentElement.classList.remove('high-contrast', 'reduced-motion');
      document.documentElement.className = document.documentElement.className
        .replace(/font-size-\w+/, '');
    };
  }, []);
  
  const isAccessibilityMode = 
    a11yState.isHighContrast || 
    a11yState.isReducedMotion || 
    a11yState.screenReaderActive || 
    preferences?.accessibilityMode;
  
  return {
    // State
    a11yState,
    isAccessibilityMode,
    
    // Focus management
    focusElement,
    trapFocus,
    restoreFocus,
    manageFocusForStep,
    
    // Announcements
    announce,
    announceStepChange,
    announceError,
    announceSuccess,
    clearAnnouncements,
    
    // Keyboard navigation
    handleKeyboardNavigation,
    registerKeyboardShortcuts,
    
    // Preferences
    toggleHighContrast,
    toggleReducedMotion,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    
    // Validation
    validateWCAGCompliance,
  };
}