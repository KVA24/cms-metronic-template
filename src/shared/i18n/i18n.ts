import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enMessages from './messages/en.json';
import viMessages from './messages/vi.json';

const resources = {
  en: { translation: enMessages },
  vi: { translation: viMessages },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Force default language to English
    defaultNS: 'translation',

    // Language detection options
    detection: {
      order: ['querystring', 'localStorage'], // Remove 'navigator' to ignore browser language
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nConfig',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Support nested keys with dot notation
    keySeparator: '.',
    nsSeparator: false,

    react: {
      useSuspense: false,
    },
  });

export default i18n;
