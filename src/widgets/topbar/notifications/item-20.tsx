import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import { CircleCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Item20() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-9.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-2.5">
        <div className="mb-1 flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Gabriel Bennett
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              started connect you{' '}
            </span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            3 day ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Development
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button size="sm" variant="outline">
            <CircleCheck /> Connected
          </Button>
          <Button size="sm" variant="mono">
            Go to profile
          </Button>
        </div>
      </div>
    </div>
  );
}
