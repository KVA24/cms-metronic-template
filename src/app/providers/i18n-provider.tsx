import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  I18N_CONFIG_KEY,
  I18N_DEFAULT_LANGUAGE,
  I18N_LANGUAGES,
} from '@/shared/i18n/config';
import i18n from '@/shared/i18n/i18n';
import { I18nProviderProps, type Language } from '@/shared/i18n/types';
import { getData, setData } from '@/shared/lib/storage';
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
      setData(I18N_CONFIG_KEY, matchedLanguage);
      return matchedLanguage;
    }
  }

  const storedData = getData(I18N_CONFIG_KEY);

  // Handle legacy string format (e.g., "en") or new object format
  if (storedData) {
    // If it's a string, find the matching language object
    if (typeof storedData === 'string') {
      const matchedLanguage = I18N_LANGUAGES.find(
        (lang) => lang.code === storedData,
      );
      if (matchedLanguage) {
        // Update storage to new format
        setData(I18N_CONFIG_KEY, matchedLanguage);
        return matchedLanguage;
      }
    }
    // If it's already an object with a code property, validate it
    else if (
      typeof storedData === 'object' &&
      storedData !== null &&
      'code' in storedData
    ) {
      const currentLanguage = storedData as Language;
      const isValid = I18N_LANGUAGES.some(
        (lang) => lang.code === currentLanguage.code,
      );
      if (isValid) {
        return currentLanguage;
      }
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
    // eslint-disable-next-line react-doctor/exhaustive-deps
  }, []);

  const changeLanguage = useCallback((language: Language) => {
    setData(I18N_CONFIG_KEY, language);
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
