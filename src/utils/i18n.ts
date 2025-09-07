// Internationalization utilities with constitutional compliance
// T028: Implement i18n system with Japanese primary support

import {
  SupportedLanguage,
  TranslationFunction,
  TranslationInterpolation,
  LanguageDetectionResult,
  TranslationNamespaces,
} from '../types';

// Simple translation storage
class TranslationStorage {
  private translations = new Map<string, Record<string, any>>();
  
  setTranslations(language: SupportedLanguage, namespace: string, data: Record<string, any>): void {
    const key = `${language}:${namespace}`;
    this.translations.set(key, data);
  }
  
  getTranslation(language: SupportedLanguage, namespace: string, key: string): string | undefined {
    const translationKey = `${language}:${namespace}`;
    const translations = this.translations.get(translationKey);
    
    if (!translations) {
      return undefined;
    }
    
    return this.getNestedValue(translations, key);
  }
  
  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  hasTranslations(language: SupportedLanguage, namespace: string): boolean {
    const key = `${language}:${namespace}`;
    return this.translations.has(key);
  }
}

// Language detection utility
export class LanguageDetector {
  static detect(): LanguageDetectionResult {
    const supportedLanguages: SupportedLanguage[] = ['ja', 'en'];
    const defaultLanguage: SupportedLanguage = 'ja'; // Constitutional requirement
    
    // Get browser languages
    const browserLanguages = [
      navigator.language,
      ...(navigator.languages || []),
    ].map(lang => lang.split('-')[0].toLowerCase());
    
    // Find first supported language
    let detectedLanguage: SupportedLanguage = defaultLanguage;
    let confidence = 0;
    
    for (const browserLang of browserLanguages) {
      if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
        detectedLanguage = browserLang as SupportedLanguage;
        confidence = 0.8;
        break;
      }
    }
    
    // Check stored preference
    try {
      const stored = localStorage.getItem('user-preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        if (preferences.language && supportedLanguages.includes(preferences.language)) {
          detectedLanguage = preferences.language;
          confidence = 1.0;
        }
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }
    
    return {
      detectedLanguage,
      confidence,
      fallbackLanguage: defaultLanguage,
      browserLanguages,
    };
  }
}

// Translation interpolation utility
export class TranslationInterpolator {
  static interpolate(template: string, values: TranslationInterpolation = {}): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = values[key as keyof TranslationInterpolation];
      return value !== undefined ? String(value) : match;
    });
  }
  
  static pluralize(
    template: string, 
    count: number, 
    values: TranslationInterpolation = {}
  ): string {
    // Simple pluralization for Japanese (no plural forms) and English
    const interpolatedValues = { ...values, count };
    
    // Handle Japanese pluralization (no plural forms, just count)
    if (template.includes('|')) {
      const [singular, plural] = template.split('|');
      const form = count === 1 ? singular : (plural || singular);
      return this.interpolate(form, interpolatedValues);
    }
    
    return this.interpolate(template, interpolatedValues);
  }
}

// Main i18n manager
export class I18nManager {
  private static instance: I18nManager;
  private storage = new TranslationStorage();
  private currentLanguage: SupportedLanguage = 'ja';
  private fallbackLanguage: SupportedLanguage = 'ja';
  private loadingPromises = new Map<string, Promise<void>>();
  
  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }
  
  async initialize(): Promise<void> {
    // Constitutional requirement: Japanese primary
    const detection = LanguageDetector.detect();
    this.currentLanguage = detection.detectedLanguage;
    this.fallbackLanguage = 'ja';
    
    // Load initial translations
    await this.loadNamespace('common');
    await this.loadNamespace('wizard');
    await this.loadNamespace('questions');
  }
  
  async loadNamespace(namespace: keyof TranslationNamespaces): Promise<void> {
    const cacheKey = `${this.currentLanguage}:${namespace}`;
    
    // Return existing promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }
    
    // Return immediately if already loaded
    if (this.storage.hasTranslations(this.currentLanguage, namespace)) {
      return;
    }
    
    const loadPromise = this.loadTranslationData(this.currentLanguage, namespace);
    this.loadingPromises.set(cacheKey, loadPromise);
    
    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
  
  private async loadTranslationData(
    language: SupportedLanguage, 
    namespace: string
  ): Promise<void> {
    try {
      // In a real implementation, this would load from JSON files or API
      // For now, we'll define translations inline
      const translations = this.getBuiltInTranslations(language, namespace);
      this.storage.setTranslations(language, namespace, translations);
    } catch (error) {
      console.error(`Failed to load translations for ${language}:${namespace}:`, error);
      
      // Load fallback if current language failed
      if (language !== this.fallbackLanguage) {
        const fallbackTranslations = this.getBuiltInTranslations(this.fallbackLanguage, namespace);
        this.storage.setTranslations(language, namespace, fallbackTranslations);
      }
    }
  }
  
  private getBuiltInTranslations(language: SupportedLanguage, namespace: string): Record<string, any> {
    // Built-in translations for constitutional compliance
    const translations: Record<string, Record<string, any>> = {
      'ja:common': {
        next: '次へ',
        previous: '前へ',
        save: '保存',
        cancel: 'キャンセル',
        close: '閉じる',
        continue: '続ける',
        finish: '完了',
        saveDraft: '下書き保存',
        loadDraft: '下書き読込',
        deleteDraft: '下書き削除',
        loading: '読み込み中...',
        saving: '保存中...',
        saved: '保存しました',
        error: 'エラー',
        success: '成功',
        warning: '警告',
      },
      'en:common': {
        next: 'Next',
        previous: 'Previous',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        continue: 'Continue',
        finish: 'Finish',
        saveDraft: 'Save Draft',
        loadDraft: 'Load Draft',
        deleteDraft: 'Delete Draft',
        loading: 'Loading...',
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
      },
      'ja:wizard': {
        title: '業務改善システム自動具体化ツール',
        subtitle: '15の質問に答えて、AIが即座に実装可能な仕様書を生成します',
        stepIndicator: 'ステップ {current} / {total}',
        layerIndicator: 'レイヤー {layer}: {layerName}',
        layer1Name: '目的・目標',
        layer2Name: 'プロセス・関係者',
        layer3Name: 'テクノロジー・連携',
        continueFromDraft: '下書きから続ける',
        wizardComplete: 'ウィザード完了',
        generatingOutput: '仕様書生成中...',
        outputReady: '仕様書が完成しました',
      },
      'en:wizard': {
        title: 'Business Improvement System Auto-Specification Tool',
        subtitle: 'Answer 15 questions to generate AI-implementable specifications instantly',
        stepIndicator: 'Step {current} of {total}',
        layerIndicator: 'Layer {layer}: {layerName}',
        layer1Name: 'Purpose & Goals',
        layer2Name: 'Process & Stakeholders',
        layer3Name: 'Technology & Integration',
        continueFromDraft: 'Continue from Draft',
        wizardComplete: 'Wizard Complete',
        generatingOutput: 'Generating Specifications...',
        outputReady: 'Specifications Ready',
      },
      'ja:questions': {
        layer1_purpose_label: 'このシステムで何を実現したいですか？',
        layer1_purpose_placeholder: '例：売上データの自動集計と月次レポートの作成',
        layer1_kpi_label: 'どのような効果を期待しますか？',
        layer1_kpi_placeholder: '例：作業時間50%削減、ミス率90%減少',
        layer2_actors_label: '誰が使いますか？（関係者）',
        layer2_actors_placeholder: '例：営業担当者、営業マネージャー、経理担当者',
        layer3_ui_label: 'どのような画面・操作が必要ですか？',
        layer3_ui_placeholder: '例：ダッシュボード画面、CSV取込ボタン、グラフ表示',
      },
      'en:questions': {
        layer1_purpose_label: 'What do you want to achieve with this system?',
        layer1_purpose_placeholder: 'e.g., Automated sales data aggregation and monthly reporting',
        layer1_kpi_label: 'What effects do you expect?',
        layer1_kpi_placeholder: 'e.g., 50% reduction in work time, 90% reduction in error rate',
        layer2_actors_label: 'Who will use this? (Stakeholders)',
        layer2_actors_placeholder: 'e.g., Sales representatives, Sales managers, Accounting staff',
        layer3_ui_label: 'What kind of interface/operations are needed?',
        layer3_ui_placeholder: 'e.g., Dashboard screen, CSV import button, Chart display',
      },
      'ja:validation': {
        required: 'この項目は必須です',
        minLength: '最低{min}文字入力してください',
        maxLength: '{max}文字以下で入力してください',
        email: '正しいメールアドレスを入力してください',
        containsPII: '個人情報が含まれています。暗号化保存されます。',
      },
      'en:validation': {
        required: 'This field is required',
        minLength: 'Please enter at least {min} characters',
        maxLength: 'Please enter no more than {max} characters',
        email: 'Please enter a valid email address',
        containsPII: 'Personal information detected. Will be encrypted.',
      },
      'ja:accessibility': {
        stepChanged: 'ステップ{step}、全{total}ステップ中に移動しました：{question}',
        validationErrors: 'フォームに{count}件のエラーがあります',
        skipToMain: 'メインコンテンツにスキップ',
        keyboardShortcuts: 'キーボードショートカット',
      },
      'en:accessibility': {
        stepChanged: 'Moved to step {step} of {total}: {question}',
        validationErrors: 'Form has {count} errors',
        skipToMain: 'Skip to main content',
        keyboardShortcuts: 'Keyboard Shortcuts',
      },
    };
    
    const key = `${language}:${namespace}`;
    return translations[key] || {};
  }
  
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }
  
  async changeLanguage(language: SupportedLanguage): Promise<void> {
    if (this.currentLanguage === language) {
      return;
    }
    
    this.currentLanguage = language;
    
    // Update user preferences
    try {
      const stored = localStorage.getItem('user-preferences');
      const preferences = stored ? JSON.parse(stored) : {};
      preferences.language = language;
      localStorage.setItem('user-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
    
    // Reload critical namespaces
    await this.loadNamespace('common');
    await this.loadNamespace('wizard');
    await this.loadNamespace('questions');
  }
  
  t: TranslationFunction = (key: string, options = {}) => {
    const {
      ns = 'common',
      interpolation = {},
      defaultValue = key,
    } = options;
    
    // Try current language first
    let translation = this.storage.getTranslation(this.currentLanguage, ns, key);
    
    // Fall back to fallback language
    if (translation === undefined && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.storage.getTranslation(this.fallbackLanguage, ns, key);
    }
    
    // Use default value if still not found
    if (translation === undefined) {
      translation = defaultValue;
    }
    
    // Apply interpolation
    return TranslationInterpolator.interpolate(translation, interpolation);
  };
}

// Constitutional compliance validator for i18n
export class I18nConstitutionalValidator {
  static validateJapanesePrimary(i18n: I18nManager): boolean {
    // Constitutional requirement: 日本語が主言語
    return i18n.getCurrentLanguage() === 'ja' || 
           Boolean(localStorage.getItem('user-preferences')?.includes('"language":"ja"'));
  }
  
  static validateNoAutoTranslation(): boolean {
    // Constitutional requirement: 自動翻訳使用禁止
    // Verify no external translation services are called
    return !document.querySelector('script[src*="translate.googleapis.com"]') &&
           !document.querySelector('script[src*="translate.google.com"]');
  }
  
  static validateSupportedLanguagesOnly(): boolean {
    // Only Japanese and English supported
    const supportedLanguages = ['ja', 'en'];
    const currentLang = I18nManager.getInstance().getCurrentLanguage();
    return supportedLanguages.includes(currentLang);
  }
}

// Export singleton instance
export const i18n = I18nManager.getInstance();

// Utility functions
export function t(key: string, options?: Parameters<TranslationFunction>[1]): string {
  return i18n.t(key, options);
}

export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  return i18n.changeLanguage(language);
}

export function getCurrentLanguage(): SupportedLanguage {
  return i18n.getCurrentLanguage();
}

// React hook for i18n (to be used in components)
export function useTranslation(namespace?: keyof TranslationNamespaces) {
  // This would be implemented as a proper React hook in the actual component
  // For now, return the basic translation function
  return {
    t: (key: string, interpolation?: TranslationInterpolation) => 
      i18n.t(key, { ns: namespace, interpolation }),
    i18n,
    ready: true,
  };
}