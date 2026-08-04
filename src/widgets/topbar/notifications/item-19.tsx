import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Card } from '@/shared/ui/atoms/card';
import { UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Item19() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-17.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-2.5">
        <div className="mb-1 flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Aaron Foster
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              requested to view{' '}
            </span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            3 day ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Larsen Ltd
          </span>
        </div>

        <Card className="kt-card bg-muted/70 flex flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5 shadow-none">
          <UserRoundCheck size={16} className="text-base text-green-500" />
          <span className="text-sm font-medium text-green-500">
            You allowed Aaron to view
          </span>
        </Card>
      </div>
    </div>
  );
}
