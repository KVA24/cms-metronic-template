import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { type Language } from './types';

const I18N_CONFIG_KEY = 'i18nConfig';

const I18N_LANGUAGES: Language[] = [
  {
    label: 'English',
    code: 'en',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/united-states.svg'),
  },
  {
    label: 'Tiếng Việt',
    code: 'vi',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/vietnam.svg'),
  },
];

const I18N_DEFAULT_LANGUAGE: Language = I18N_LANGUAGES[0];

export { I18N_CONFIG_KEY, I18N_DEFAULT_LANGUAGE, I18N_LANGUAGES };
