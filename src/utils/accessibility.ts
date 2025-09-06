// Accessibility utilities for WCAG 2.1 AA compliance
// T029: Implement accessibility features and focus management

import { FocusManager } from '../types';

// Focus management utility class
export class AccessibilityFocusManager implements FocusManager {
  private focusHistory: HTMLElement[] = [];
  private trapContainer: HTMLElement | null = null;
  private trapCleanup: (() => void) | null = null;
  
  // Focus trap implementation
  trapFocus(container: HTMLElement): () => void {
    this.trapContainer = container;
    
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) {
      console.warn('Focus trap container has no focusable elements');
      return () => {};
    }
    
    // Store current focus
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Focus first element
    focusableElements[0].focus();
    
    // Handle tab navigation within trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
          // Shift + Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      } else if (e.key === 'Escape') {
        // Allow escape to break out of trap
        this.releaseFocusTrap();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    const cleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.trapContainer = null;
      this.trapCleanup = null;
      
      // Restore previous focus
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus();
      }
    };
    
    this.trapCleanup = cleanup;
    return cleanup;
  }
  
  private releaseFocusTrap(): void {
    if (this.trapCleanup) {
      this.trapCleanup();
    }
  }
  
  // Restore focus to previously focused element
  restoreFocus(element?: HTMLElement): void {
    if (element && element.focus) {
      element.focus();
    } else if (this.focusHistory.length > 0) {
      const lastFocused = this.focusHistory.pop();
      if (lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }
  }
  
  // Focus management for step transitions
  focusFirstTabbable(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }
  
  focusLastTabbable(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  }
  
  // Get all focusable elements within container
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');
    
    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    
    // Filter out hidden elements
    return elements.filter(element => {
      return element.offsetParent !== null && // Not hidden via display:none or visibility:hidden
             !element.hasAttribute('hidden') &&
             !element.getAttribute('aria-hidden');
    });
  }
  
  // Store current focus for later restoration
  storeFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement);
    }
  }
}

// ARIA live region manager
export class LiveRegionManager {
  private liveRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  
  constructor() {
    this.createLiveRegions();
  }
  
  private createLiveRegions(): void {
    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('aria-relevant', 'additions text');
    this.politeRegion.className = 'sr-only'; // Screen reader only
    this.politeRegion.id = 'live-region-polite';
    
    // Create assertive live region  
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.id = 'live-region-assertive';
    
    // Add to DOM
    document.body.appendChild(this.politeRegion);
    document.body.appendChild(this.assertiveRegion);
  }
  
  // Announce message politely (doesn't interrupt)
  announcePolitely(message: string, clearAfter: number = 5000): void {
    if (this.politeRegion) {
      this.politeRegion.textContent = message;
      
      // Clear after specified time
      if (clearAfter > 0) {
        setTimeout(() => {
          if (this.politeRegion) {
            this.politeRegion.textContent = '';
          }
        }, clearAfter);
      }
    }
  }
  
  // Announce message assertively (interrupts current announcements)
  announceAssertively(message: string, clearAfter: number = 3000): void {
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = message;
      
      if (clearAfter > 0) {
        setTimeout(() => {
          if (this.assertiveRegion) {
            this.assertiveRegion.textContent = '';
          }
        }, clearAfter);
      }
    }
  }
  
  // Clear all announcements
  clearAll(): void {
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
    }
  }
}

// Screen reader announcement utility
export class ScreenReaderAnnouncer {
  private liveRegionManager = new LiveRegionManager();
  
  announceStepChange(step: number, total: number, question: string): void {
    const message = `ステップ${step}、全${total}ステップ中。${question}`;
    this.liveRegionManager.announcePolitely(message);
  }
  
  announceValidationError(errors: string[]): void {
    if (errors.length === 0) return;
    
    const message = errors.length === 1 
      ? `入力エラー: ${errors[0]}`
      : `${errors.length}件の入力エラーがあります: ${errors.join('、')}`;
    
    this.liveRegionManager.announceAssertively(message);
  }
  
  announceSuccess(message: string): void {
    this.liveRegionManager.announcePolitely(`成功: ${message}`);
  }
  
  announceLoading(isLoading: boolean, message?: string): void {
    if (isLoading) {
      this.liveRegionManager.announcePolitely(message || '読み込み中...');
    } else {
      this.liveRegionManager.announcePolitely('読み込み完了');
    }
  }
  
  announceDraftSaved(): void {
    this.liveRegionManager.announcePolitely('下書きが保存されました');
  }
}

// High contrast mode detector
export class HighContrastDetector {
  static isHighContrastMode(): boolean {
    // Check for Windows High Contrast mode
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return true;
    }
    
    // Check for forced colors (Windows High Contrast)
    if (window.matchMedia('(forced-colors: active)').matches) {
      return true;
    }
    
    // Fallback: test if we can detect high contrast by creating test elements
    return this.detectHighContrastFallback();
  }
  
  private static detectHighContrastFallback(): boolean {
    try {
      // Create test element
      const testElement = document.createElement('div');
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.width = '1px';
      testElement.style.height = '1px';
      testElement.style.backgroundColor = 'rgb(31, 41, 59)'; // Dark color
      testElement.style.color = 'rgb(255, 255, 255)'; // Light color
      
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const backgroundColor = computedStyle.backgroundColor;
      const color = computedStyle.color;
      
      document.body.removeChild(testElement);
      
      // In high contrast mode, colors might be forced to system colors
      return backgroundColor === color || 
             backgroundColor === 'rgb(255, 255, 255)' ||
             backgroundColor === 'rgb(0, 0, 0)';
    } catch (error) {
      return false;
    }
  }
}

// Reduced motion detector
export class ReducedMotionDetector {
  static isReducedMotionPreferred(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  static getAnimationSettings() {
    const reducedMotion = this.isReducedMotionPreferred();
    
    return {
      enableTransitions: !reducedMotion,
      transitionDuration: reducedMotion ? '0ms' : '300ms',
      enableParallax: !reducedMotion,
      enableAutoplay: !reducedMotion,
      respectUserPreference: true,
    };
  }
}

// Color contrast utilities
export class ColorContrastUtil {
  // Calculate relative luminance
  private static getRelativeLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  // Calculate contrast ratio between two colors
  static getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  // Check if contrast ratio meets WCAG AA standards
  static meetsWCAGAA(foreground: [number, number, number], background: [number, number, number], isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const minimumRatio = isLargeText ? 3.0 : 4.5;
    return ratio >= minimumRatio;
  }
  
  // Check if contrast ratio meets WCAG AAA standards
  static meetsWCAGAAA(foreground: [number, number, number], background: [number, number, number], isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const minimumRatio = isLargeText ? 4.5 : 7.0;
    return ratio >= minimumRatio;
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }
    
    return newIndex;
  }
}

// Touch accessibility utilities
export class TouchAccessibility {
  // Check if minimum touch target size is met (44x44px for WCAG)
  static meetsMinimumTouchTargetSize(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  }
  
  // Add touch-friendly improvements
  static enhanceForTouch(element: HTMLElement): void {
    // Increase touch target size if needed
    if (!this.meetsMinimumTouchTargetSize(element)) {
      element.style.minWidth = '44px';
      element.style.minHeight = '44px';
      element.style.padding = '8px';
    }
    
    // Add touch-specific styles
    element.style.touchAction = 'manipulation'; // Prevent zoom on double-tap
    element.classList.add('touch-enhanced');
  }
}

// Constitutional compliance validator for accessibility
export class AccessibilityConstitutionalValidator {
  static validateWCAG21AA(): {
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    if (skipLinks.length === 0) {
      violations.push('No skip links found - WCAG 2.4.1');
      recommendations.push('Add skip links for keyboard navigation');
    }
    
    // Check for live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    if (liveRegions.length === 0) {
      violations.push('No live regions found - WCAG 4.1.3');
      recommendations.push('Add aria-live regions for dynamic content');
    }
    
    // Check for form labels
    const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    if (unlabeledInputs.length > 0) {
      violations.push(`${unlabeledInputs.length} unlabeled form inputs - WCAG 1.3.1`);
      recommendations.push('Add proper labels to all form inputs');
    }
    
    // Check color contrast (simplified)
    const elementsToCheck = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, button, a, label, span');
    let contrastViolations = 0;
    
    elementsToCheck.forEach(element => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // This is a simplified check - in production, would use proper color parsing
      if (color && backgroundColor && color !== 'inherit' && backgroundColor !== 'inherit') {
        // Basic contrast check would go here
      }
    });
    
    return {
      compliant: violations.length === 0,
      violations,
      recommendations,
    };
  }
}

// Export instances for global use
export const focusManager = new AccessibilityFocusManager();
export const screenReader = new ScreenReaderAnnouncer();
export const liveRegion = new LiveRegionManager();