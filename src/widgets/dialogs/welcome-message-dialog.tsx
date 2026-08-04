import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Link } from 'react-router-dom';

export function WelcomeMessageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader className="border-0">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col items-center pt-10 pb-10">
          <div className="mb-10">
            <img
              src={toAbsoluteUrl('/media/illustrations/21.svg')}
              className="max-h-[140px] dark:hidden"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/21-dark.svg')}
              className="light:hidden max-h-[140px]"
              alt=""
            />
          </div>

          <h3 className="text-mono mb-3 text-center text-lg font-medium">
            Welcome to Dashboard
          </h3>

          <div className="text-secondary-foreground mb-7 text-center text-sm">
            We're thrilled to have you on board and excited for <br />
            the journey ahead together.
          </div>

          <div className="mb-2 flex justify-center">
            <Link to="/" className="btn btn-primary flex justify-center">
              Show me around
            </Link>
          </div>

          <Link
            to="/"
            className="text-secondary-foreground hover:text-primary py-3 text-sm font-medium"
          >
            Skip the tour
          </Link>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
