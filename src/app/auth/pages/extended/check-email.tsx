import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Link } from 'react-router-dom';

const CheckEmail = () => {
  return (
    <>
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
        Please click the link sent to your email&nbsp;
        <span className="text-mono hover:text-primary-active text-sm font-medium">
          bob@kt.com
        </span>
        <br />
        to verify your account. Thank you
      </div>

      <div className="mb-5 flex justify-center">
        <Link to="/" className="btn btn-primary flex justify-center">
          Back to Home
        </Link>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className="text-secondary-foreground text-sm">
          Didn’t receive an email?
        </span>
        <Link
          to="/auth/signin"
          className="text-foreground hover:text-primary text-sm font-semibold"
        >
          Resend
        </Link>
      </div>
    </>
  );
};

export { CheckEmail };
