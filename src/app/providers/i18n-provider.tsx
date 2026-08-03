import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { I18N_DEFAULT_LANGUAGE, I18N_LANGUAGES } from '@/shared/i18n/config';
import i18n from '@/shared/i18n/i18n';
import { I18nProviderProps, type Language } from '@/shared/i18n/types';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';

const getInitialLanguage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');

  // Check if langParam matches a supported language
  if (langParam) {
    const matchedLanguage = I18N_LANGUAGES.find(
      (lang) => lang.code === langParam,
    );
    if (matchedLanguage) {
      return matchedLanguage;
    }
  }

  return I18N_DEFAULT_LANGUAGE;
};

const initialProps: I18nProviderProps = {
  currenLanguage: getInitialLanguage(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  changeLanguage: (_: Language) => {},
  isRTL: () => false,
};

const TranslationsContext = createContext<I18nProviderProps>(initialProps);
const useLanguage = () => use(TranslationsContext);

const I18nProvider = ({ children }: PropsWithChildren) => {
  const [currenLanguage, setCurrenLanguage] = useState(
    initialProps.currenLanguage,
  );

  // Initialize i18next with saved language (mount-only)
  useEffect(() => {
    i18n.changeLanguage(currenLanguage.code);
  }, [currenLanguage.code]);

  const changeLanguage = useCallback((language: Language) => {
    setCurrenLanguage(language);
    i18n.changeLanguage(language.code);
  }, []);

  const isRTL = useCallback(() => {
    return currenLanguage.direction === 'rtl';
  }, [currenLanguage.direction]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', currenLanguage.direction);
  }, [currenLanguage]);

  const value = useMemo(
    () => ({
      isRTL,
      currenLanguage,
      changeLanguage,
    }),
    [isRTL, currenLanguage, changeLanguage],
  );

  return (
    <TranslationsContext.Provider value={value}>
      <RadixDirectionProvider dir={currenLanguage.direction}>
        {children}
      </RadixDirectionProvider>
    </TranslationsContext.Provider>
  );
};

export { I18nProvider, useLanguage };
