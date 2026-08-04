import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import {
  ShareProfileSettings,
  ShareProfileUsers,
  ShareProfileViaEmail,
  ShareProfileViaLink,
} from '@/widgets/dialogs/share-profile';

export function GiveAwardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] space-y-0 p-0">
        <DialogHeader className="m-0 px-5 pt-5 pb-0">
          <DialogTitle>Give Award</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 px-0 py-5">
          <ShareProfileViaLink />
          <div className="border-b-border border-b"></div>

          <ShareProfileViaEmail />
          <div className="border-b-border border-b"></div>

          <div className="scrollable-y-auto max-h-[300px]">
            <ShareProfileUsers />
          </div>

          <div className="border-b-border border-b"></div>
          <ShareProfileSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}
