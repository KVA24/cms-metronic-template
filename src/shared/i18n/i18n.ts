import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enMessages from './messages/en.json';
import viMessages from './messages/vi.json';

const resources = {
  en: { translation: enMessages },
  vi: { translation: viMessages },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  lng: 'en',
  defaultNS: 'translation',

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
