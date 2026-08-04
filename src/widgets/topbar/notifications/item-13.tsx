import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { Link } from 'react-router-dom';

export default function Item13() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-25.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Samuel Lee
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              requested to add user to{' '}
            </span>
            <Link
              to="#"
              className="hover:text-primary text-primary font-semibold"
            >
              TechSynergy
            </Link>
          </div>

          <span className="text-muted-foreground flex items-center text-xs font-medium">
            22 hours ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Dev Team
          </span>
        </div>

        <Card className="bg-muted/70 flex flex-row items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 shadow-none">
          <div className="flex flex-col">
            <Link
              to="#"
              className="hover:text-primary text-mono text-xs font-medium"
            >
              Ronald Richards
            </Link>
            <Link
              to="#"
              className="hover:text-primary text-muted-foreground text-xs font-medium"
            >
              ronald.richards@gmail.com
            </Link>
          </div>

          <Link
            to="#"
            className="hover:text-primary text-secondary-foreground text-xs font-medium"
          >
            Go to profile
          </Link>
        </Card>

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
