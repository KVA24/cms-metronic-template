import { useTranslations } from '@/shared/hooks/use-translations';
import { useAuthUser } from '@/shared/stores/auth-store.ts';

export function WelcomePage() {
  const { t } = useTranslations();
  const user = useAuthUser();

  return (
    <div className=" ">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {t('WELCOME.TITLE')},{' '}
            <span className="text-primary">{user?.username || 'User'}</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            {t('WELCOME.SUBTITLE')}
          </p>
        </div>
      </div>
    </div>
  );
}
