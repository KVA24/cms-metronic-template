import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Card } from '@/shared/ui/atoms/card';
import { Link } from 'react-router-dom';

export default function Item6() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-14.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="offline" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Tyler Hero{' '}
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              wants to view your design project{' '}
            </span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            3 day ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Metronic Launcher mockups
          </span>
        </div>

        <Card className="bg-muted/70 flex flex-row items-center gap-1.5 rounded-lg p-2.5 shadow-none">
          <div className="bg-background border-border flex h-[30px] w-[26px] shrink-0 items-center justify-center rounded-sm border">
            <img
              src={toAbsoluteUrl('/media/file-types/figma.svg')}
              className="h-5"
              alt=""
            />
          </div>

          <Link
            to="#"
            className="hover:text-primary text-secondary-foreground me-1 text-xs font-medium"
          >
            Launcher-UIkit.fig
          </Link>
          <span className="text-muted-foreground text-xs font-medium">
            Edited 2 mins ago
          </span>
        </Card>
      </div>
    </div>
  );
}
