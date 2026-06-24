import { Fragment } from 'react/jsx-runtime';
import { useTranslations } from '@/shared/hooks/use-translations';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Link } from 'react-router-dom';

export function Error500() {
  const { t } = useTranslations();

  return (
    <Fragment>
      <div className="mb-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/20.svg')}
          className="dark:hidden max-h-[160px]"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/20-dark.svg')}
          className="light:hidden max-h-[160px]"
          alt=""
        />
      </div>

      <Badge variant="destructive" appearance="outline" className="mb-3">
        {t('ERROR.500.BADGE')}
      </Badge>

      <h3 className="text-2xl font-semibold text-mono text-center mb-2">
        {t('ERROR.500.TITLE')}
      </h3>

      <div className="text-base text-center text-secondary-foreground mb-10">
        {t('ERROR.500.DESCRIPTION')}&nbsp;
        <Link
          to="/"
          className="text-primary font-medium hover:text-primary-active"
        >
          {t('ERROR.500.RETURN_HOME')}
        </Link>
        .
      </div>

      <Button asChild>
        <Link to="/">{t('ERROR.500.RETURN_HOME')}</Link>
      </Button>
    </Fragment>
  );
}
