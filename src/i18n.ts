import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslations from '../public/locales/en/translation.json';
import jaTranslations from '../public/locales/ja/translation.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  ja: {
    translation: jaTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja', // Default to Japanese
    lng: 'ja', // Default language
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already handles escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;