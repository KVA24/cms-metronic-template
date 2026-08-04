import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import { Link } from 'react-router-dom';

export default function Item17() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-19.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-2.5">
        <div className="mb-1 flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Natalie Wood
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              wants to edit marketing project{' '}
            </span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            1 day ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Designer
          </span>
        </div>

        <div className="kt-card bg-muted/70 flex flex-row items-center gap-1.5 rounded-lg p-2.5 shadow-none">
          <div className="border-border flex h-[30px] w-[26px] shrink-0 items-center justify-center rounded-sm border bg-white">
            <img
              src={toAbsoluteUrl('/media/brand-logos/jira.svg')}
              className="h-5"
              alt=""
            />
          </div>

          <Link
            to="#"
            className="hover:text-primary text-secondary-foreground me-1 text-xs font-medium"
          >
            User-feedback.jira
          </Link>
          <span className="text-muted-foreground text-xs font-medium">
            Edited 1 hour ago
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button size="sm" variant="outline">
            Decline
          </Button>
          <Button size="sm" variant="mono">
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
