import { useSyncExternalStore } from 'react';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Link } from 'react-router-dom';
import { useSettings } from '@/app/providers/settings-provider';

const emptySubscribe = () => () => {};

const ResetPasswordCheckEmail = () => {
  const { settings } = useSettings();
  const email = useSyncExternalStore(
    emptySubscribe,
    () => new URLSearchParams(window.location.search).get('email'),
    () => null,
  );

  return (
    <div className="card w-full max-w-[440px]">
      <div className="card-body p-10">
        <div className="flex justify-center py-10">
          <img
            src={toAbsoluteUrl('/media/illustrations/30.svg')}
            className="max-h-[130px] dark:hidden"
            alt=""
          />
          <img
            src={toAbsoluteUrl('/media/illustrations/30-dark.svg')}
            className="light:hidden max-h-[130px]"
            alt=""
          />
        </div>

        <h3 className="text-mono mb-3 text-center text-lg font-medium">
          Check your email
        </h3>
        <div className="text-secondary-foreground mb-7.5 text-center text-sm">
          Please click the link sent to your email{' '}
          <span className="text-foreground hover:text-primary-active text-sm font-medium">
            {email}
          </span>
          <br />
          to reset your password. Thank you
        </div>

        <div className="mb-5 flex justify-center">
          <Link
            to={
              settings?.layout === 'auth-branded'
                ? '/auth/reset-password/changed'
                : '/auth/classic/reset-password/changed'
            }
            className="btn btn-primary flex justify-center"
          >
            Skip for now
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1">
          <span className="text-secondary-foreground text-xs">
            Didn’t receive an email?
          </span>
          <Link
            to={
              settings?.layout === 'auth-branded'
                ? '/auth/reset-password/enter-email'
                : '/auth/classic/reset-password/enter-email'
            }
            className="link text-xs font-medium"
          >
            Resend
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordCheckEmail };
