import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Button } from '@/shared/ui/atoms/button';
import { Link } from 'react-router-dom';
import { useSettings } from '@/app/providers/settings-provider';

const ResetPasswordChanged = () => {
  const { settings } = useSettings();

  return (
    <div className="px-4 py-8">
      <div className="mb-5 flex justify-center">
        <img
          src={toAbsoluteUrl('/media/illustrations/32.svg')}
          className="max-h-[180px] dark:hidden"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/32-dark.svg')}
          className="light:hidden max-h-[180px]"
          alt=""
        />
      </div>

      <h3 className="text-mono mb-4 text-center text-lg font-medium">
        Your password is changed
      </h3>
      <div className="text-secondary-foreground mb-7.5 text-center text-sm">
        Your password has been successfully updated. Your account's security is
        our priority.
      </div>

      <Button asChild className="w-full">
        <Link
          to={
            settings?.layout === 'auth-branded'
              ? '/auth/signin'
              : '/auth/classic/signin'
          }
        >
          Sign in
        </Link>
      </Button>
    </div>
  );
};

export { ResetPasswordChanged };
