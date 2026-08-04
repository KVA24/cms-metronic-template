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
          className="max-h-[160px] dark:hidden"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/22-dark.svg')}
          className="hidden max-h-[160px] dark:block"
          alt=""
        />
      </div>

      <span className="badge badge-destructive badge-outline mb-3">
        {t('ERROR.403.BADGE')}
      </span>

      <h3 className="text-mono mb-2 text-center text-2xl font-semibold">
        {t('ERROR.403.TITLE')}
      </h3>

      <div className="text-secondary-foreground mb-10 text-center text-base">
        {t('ERROR.403.DESCRIPTION')}&nbsp;
        <Link
          to="/"
          className="text-primary hover:text-primary-active font-medium"
        >
          {t('ERROR.403.RETURN_HOME')}
        </Link>
        &nbsp;{t('ERROR.403.CONTACT_ADMIN')}
      </div>
    </>
  );
}
