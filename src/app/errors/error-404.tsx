import { useTranslations } from '@/shared/hooks/use-translations';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Link } from 'react-router-dom';

export function Error404() {
  const { t } = useTranslations();

  return (
    <>
      <div className="mb-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/19.svg')}
          className="dark:hidden max-h-[160px]"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/19-dark.svg')}
          className="hidden dark:block max-h-[160px]"
          alt=""
        />
      </div>

      <span className="badge badge-primary badge-outline mb-3">
        {t('ERROR.404.BADGE')}
      </span>

      <h3 className="text-2xl font-semibold text-mono text-center mb-2">
        {t('ERROR.404.TITLE')}
      </h3>

      <div className="text-base text-center text-secondary-foreground mb-10">
        {t('ERROR.404.DESCRIPTION')}&nbsp;
        <Link
          to="/"
          className="text-primary font-medium hover:text-primary-active"
        >
          {t('ERROR.404.RETURN_HOME')}
        </Link>
        .
      </div>
    </>
  );
}
