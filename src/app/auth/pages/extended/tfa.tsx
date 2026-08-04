import { useState } from 'react';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { MoveLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const OTP_FIELDS = [
  'otp-0',
  'otp-1',
  'otp-2',
  'otp-3',
  'otp-4',
  'otp-5',
] as const;

const TwoFactorAuth = () => {
  const [codeInputs, setCodeInputs] = useState(() =>
    Array(OTP_FIELDS.length).fill(''),
  );

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const updatedInputs = [...codeInputs];
    updatedInputs[index] = value;
    setCodeInputs(updatedInputs);
  };

  return (
    <div className="flex flex-col gap-5 p-10">
      <img
        src={toAbsoluteUrl('/media/illustrations/34.svg')}
        className="mb-2 h-20 dark:hidden"
        alt=""
      />
      <img
        src={toAbsoluteUrl('/media/illustrations/34-dark.svg')}
        className="light:hidden mb-2 h-20"
        alt=""
      />

      <div className="mb-2 text-center">
        <h3 className="text-mono mb-5 text-lg font-medium">
          Verify your phone
        </h3>
        <div className="flex flex-col">
          <span className="text-secondary-foreground mb-1.5 text-sm">
            Enter the verification code we sent to
          </span>
          <span className="text-mono text-sm font-medium">****** 7859</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {OTP_FIELDS.map((fieldId, index) => (
          <Input
            key={fieldId}
            type="text"
            maxLength={1}
            className="size-10 shrink-0 px-0 text-center"
            value={codeInputs[index]}
            onChange={(e) => handleInputChange(index, e.target.value)}
          />
        ))}
      </div>

      <div className="mb-2 flex items-center justify-center">
        <span className="text-secondary-foreground me-1.5 text-sm">
          Didn’t receive a code? (37s)
        </span>
        <Link
          to="/auth/classic/login"
          className="text-foreground hover:text-primary font-semibold"
        >
          Resend
        </Link>
      </div>

      <Button className="grow">Continue</Button>

      <Link
        to="/auth/signin"
        className="text-foreground hover:text-primary flex items-center justify-center gap-2.5 text-sm font-semibold"
      >
        <MoveLeft className="size-3.5 opacity-70" />
        Back to Login
      </Link>
    </div>
  );
};

export { TwoFactorAuth };
