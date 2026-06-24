import { ReactNode, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Switch } from '@/shared/ui/atoms/switch';
import { GiveAwardDialog } from '@/widgets/dialogs/give-award-dialog.tsx';
import { ReportUserDialog } from '@/widgets/dialogs/report-user-dialog.tsx';
import { ShareProfileDialog } from '@/widgets/dialogs/share-profile';
import { Award, Coffee, Info, TrendingUp } from 'lucide-react';

export function DropdownMenu9({ trigger }: { trigger: ReactNode }) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const handleShareDialogClose = () => {
    setIsShareDialogOpen(false);
  };

  const handleAwardDialogClose = () => {
    setIsAwardDialogOpen(false);
  };

  const handleReportDialogClose = () => {
    setIsReportDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-[210px]" side="bottom" align="end">
          <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
            <Coffee />
            <span>Share Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsAwardDialogOpen(true)}>
            <Award />
            <span>Give Award</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center justify-between gap-2"
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            <TrendingUp />
            <div className="grow flex items-center justify-between gap-2">
              <span>Stay Updated</span>
              <Switch size="sm"></Switch>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
            <Info />
            <span>Report User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareProfileDialog
        open={isShareDialogOpen}
        onOpenChange={handleShareDialogClose}
      />
      <GiveAwardDialog
        open={isAwardDialogOpen}
        onOpenChange={handleAwardDialogClose}
      />
      <ReportUserDialog
        open={isReportDialogOpen}
        onOpenChange={handleReportDialogClose}
      />
    </>
  );
}
