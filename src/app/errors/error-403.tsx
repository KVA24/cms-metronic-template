import { useTranslations } from '@/shared/hooks/use-translations';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Link } from 'react-router-dom';

export function Error403() {
  const { t } = useTranslations();

  return (
    <>
      <div className="mb-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/22.svg')}
          className="dark:hidden max-h-[160px]"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/22-dark.svg')}
          className="hidden dark:block max-h-[160px]"
          alt=""
        />
      </div>

      <span className="badge badge-destructive badge-outline mb-3">
        {t('ERROR.403.BADGE')}
      </span>

      <h3 className="text-2xl font-semibold text-mono text-center mb-2">
        {t('ERROR.403.TITLE')}
      </h3>

      <div className="text-base text-center text-secondary-foreground mb-10">
        {t('ERROR.403.DESCRIPTION')}&nbsp;
        <Link
          to="/"
          className="text-primary font-medium hover:text-primary-active"
        >
          {t('ERROR.403.RETURN_HOME')}
        </Link>
        &nbsp;{t('ERROR.403.CONTACT_ADMIN')}
      </div>
    </>
  );
}
