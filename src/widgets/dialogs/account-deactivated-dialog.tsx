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

export function AccountDeactivatedDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollable-y-auto max-h-[95%] w-full max-w-[500px]">
        <DialogHeader className="justify-end border-0 pt-5">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col items-center pt-0 pb-10">
          <div className="mb-9">
            <img
              src={toAbsoluteUrl('/media/illustrations/23.svg')}
              className="max-h-[150px] dark:hidden"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/23-dark.svg')}
              className="light:hidden max-h-[150px]"
              alt=""
            />
          </div>

          <h3 className="text-mono mb-3 text-center text-lg font-medium">
            Account Deactivated
          </h3>

          <div className="text-secondary-foreground mb-7 text-center text-sm">
            Your account has been deactivated. Please contact <br />
            support if this is an error or for reactivation.
          </div>

          <Link to="/" className="btn btn-primary flex justify-center">
            Go to Home
          </Link>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
