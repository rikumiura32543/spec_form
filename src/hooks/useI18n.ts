// Internationalization hook with constitutional compliance
// T036: i18n state management with Japanese primary support

import { useState, useEffect, useCallback } from 'react';
import {
  SupportedLanguage,
  TranslationFunction,
  TranslationInterpolation,
  TranslationNamespaces,
} from '../types';
import {
  i18n,
  I18nManager,
  LanguageDetector,
  I18nConstitutionalValidator,
  UserPreferencesManager,
} from '../utils';

interface UseI18nOptions {
  namespace?: keyof TranslationNamespaces;
  fallback?: Partial<Record<string, string>>;
  enableLanguageDetection?: boolean;
  persistLanguageChoice?: boolean;
}

interface UseI18nReturn {
  // Current state
  language: SupportedLanguage;
  isLoading: boolean;
  error: string | null;
  ready: boolean;
  
  // Translation function
  t: TranslationFunction;
  
  // Language management
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  getSupportedLanguages: () => SupportedLanguage[];
  getLanguageDisplayName: (language: SupportedLanguage) => string;
  
  // Namespace management
  loadNamespace: (namespace: keyof TranslationNamespaces) => Promise<void>;
  isNamespaceLoaded: (namespace: keyof TranslationNamespaces) => boolean;
  
  // Constitutional compliance
  validateCompliance: () => boolean;
  isPrimaryLanguage: () => boolean;
  
  // Language detection
  detectedLanguage: SupportedLanguage;
  browserLanguages: string[];
  
  // Formatting utilities
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date, base?: Date) => string;
}

export function useI18n({
  namespace = 'common',
  fallback = {},
  enableLanguageDetection = true,
  persistLanguageChoice = true,
}: UseI18nOptions = {}): UseI18nReturn {
  const [language, setLanguage] = useState<SupportedLanguage>('ja');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadedNamespaces, setLoadedNamespaces] = useState<Set<string>>(new Set());
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage>('ja');
  const [browserLanguages, setBrowserLanguages] = useState<string[]>([]);
  
  // Initialize i18n system
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        setError(null);
        
        // Constitutional compliance check
        if (!I18nConstitutionalValidator.validateJapanesePrimary(i18n)) {
          console.warn('Constitutional compliance: Japanese should be primary language');
        }
        
        // Language detection
        let initialLanguage: SupportedLanguage = 'ja';
        
        if (enableLanguageDetection) {
          const detection = LanguageDetector.detect();
          setDetectedLanguage(detection.detectedLanguage);
          setBrowserLanguages(detection.browserLanguages);
          initialLanguage = detection.detectedLanguage;
        }
        
        // Initialize i18n manager
        await i18n.initialize();
        
        // Set initial language
        await i18n.changeLanguage(initialLanguage);
        setLanguage(initialLanguage);
        
        // Load initial namespace
        await i18n.loadNamespace(namespace);
        setLoadedNamespaces(prev => new Set([...prev, namespace]));
        
        setReady(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        console.error('Failed to initialize i18n:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeI18n();
  }, [namespace, enableLanguageDetection]);
  
  // Translation function with namespace context
  const t: TranslationFunction = useCallback((key: string, options = {}) => {
    const {
      ns = namespace,
      interpolation = {},
      defaultValue,
    } = options;
    
    // Use fallback if provided
    if (fallback[key] && !i18n.t(key, { ns, defaultValue: undefined })) {
      const fallbackValue = fallback[key];
      
      if (typeof fallbackValue === 'string' && Object.keys(interpolation).length > 0) {
        return fallbackValue.replace(/\{(\w+)\}/g, (match, key) => {
          const value = interpolation[key as keyof TranslationInterpolation];
          return value !== undefined ? String(value) : match;
        });
      }
      
      return fallbackValue || key;
    }
    
    return i18n.t(key, { ns, interpolation, defaultValue });
  }, [namespace, fallback]);
  
  // Change language
  const changeLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Constitutional compliance: warn if changing from Japanese
      if (language === 'ja' && newLanguage !== 'ja') {
        console.warn('Constitutional notice: Changing from primary language (Japanese)');
      }
      
      await i18n.changeLanguage(newLanguage);
      setLanguage(newLanguage);
      
      // Persist language choice
      if (persistLanguageChoice) {
        try {
          await UserPreferencesManager.updatePreferences({
            language: newLanguage,
          });
        } catch (error) {
          console.warn('Failed to persist language choice:', error);
        }
      }
      
      // Reload current namespace to get new language content
      await i18n.loadNamespace(namespace);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language, namespace, persistLanguageChoice]);
  
  // Get supported languages
  const getSupportedLanguages = useCallback((): SupportedLanguage[] => {
    return ['ja', 'en'];
  }, []);
  
  // Get language display name
  const getLanguageDisplayName = useCallback((lang: SupportedLanguage): string => {
    const displayNames = {
      ja: '日本語',
      en: 'English',
    };
    
    return displayNames[lang];
  }, []);
  
  // Load additional namespace
  const loadNamespace = useCallback(async (ns: keyof TranslationNamespaces) => {
    try {
      if (loadedNamespaces.has(ns)) {
        return; // Already loaded
      }
      
      await i18n.loadNamespace(ns);
      setLoadedNamespaces(prev => new Set([...prev, ns]));
    } catch (error) {
      console.error(`Failed to load namespace ${ns}:`, error);
    }
  }, [loadedNamespaces]);
  
  // Check if namespace is loaded
  const isNamespaceLoaded = useCallback((ns: keyof TranslationNamespaces): boolean => {
    return loadedNamespaces.has(ns);
  }, [loadedNamespaces]);
  
  // Validate constitutional compliance
  const validateCompliance = useCallback((): boolean => {
    try {
      // Check Japanese primary requirement
      if (!I18nConstitutionalValidator.validateJapanesePrimary(i18n)) {
        return false;
      }
      
      // Check no auto-translation usage
      if (!I18nConstitutionalValidator.validateNoAutoTranslation()) {
        return false;
      }
      
      // Check supported languages only
      if (!I18nConstitutionalValidator.validateSupportedLanguagesOnly()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('I18n compliance validation failed:', error);
      return false;
    }
  }, []);
  
  // Check if current language is primary (Japanese)
  const isPrimaryLanguage = useCallback((): boolean => {
    return language === 'ja';
  }, [language]);
  
  // Format number with current locale
  const formatNumber = useCallback((
    num: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    try {
      const locale = language === 'ja' ? 'ja-JP' : 'en-US';
      return new Intl.NumberFormat(locale, options).format(num);
    } catch (error) {
      return String(num);
    }
  }, [language]);
  
  // Format date with current locale
  const formatDate = useCallback((
    date: Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    try {
      const locale = language === 'ja' ? 'ja-JP' : 'en-US';
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      };
      
      return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  }, [language]);
  
  // Format relative time
  const formatRelativeTime = useCallback((
    date: Date,
    base: Date = new Date()
  ): string => {
    const diffMs = base.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (language === 'ja') {
      if (diffMinutes < 1) return 'たった今';
      if (diffMinutes < 60) return `${diffMinutes}分前`;
      if (diffHours < 24) return `${diffHours}時間前`;
      if (diffDays < 7) return `${diffDays}日前`;
      return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
    } else {
      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }, [language, formatDate]);
  
  // Watch for language changes in i18n manager
  useEffect(() => {
    const currentLanguage = i18n.getCurrentLanguage();
    if (currentLanguage !== language) {
      setLanguage(currentLanguage);
    }
  }, [language]);
  
  // Validate compliance periodically
  useEffect(() => {
    if (ready) {
      const interval = setInterval(() => {
        const compliant = validateCompliance();
        if (!compliant) {
          console.warn('I18n constitutional compliance violation detected');
        }
      }, 5 * 60 * 1000); // Every 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [ready, validateCompliance]);
  
  return {
    // Current state
    language,
    isLoading,
    error,
    ready,
    
    // Translation function
    t,
    
    // Language management
    changeLanguage,
    getSupportedLanguages,
    getLanguageDisplayName,
    
    // Namespace management
    loadNamespace,
    isNamespaceLoaded,
    
    // Constitutional compliance
    validateCompliance,
    isPrimaryLanguage,
    
    // Language detection
    detectedLanguage,
    browserLanguages,
    
    // Formatting utilities
    formatNumber,
    formatDate,
    formatRelativeTime,
  };
}