export type LanguageCode = 'en' | 'vi';

export type LanguageDirection = 'ltr' | 'rtl';

export interface Language {
  label: string;
  code: LanguageCode;
  direction: LanguageDirection;
  flag: string;
}

export interface I18nProviderProps {
  currenLanguage: Language;
  isRTL: () => boolean;
  changeLanguage: (lang: Language) => void;
}
