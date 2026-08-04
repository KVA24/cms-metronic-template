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

export default function Item4() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-10.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="offline" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Jane Perez
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              invites you to review a file.{' '}
            </span>
          </div>

          <span className="text-muted-foreground flex items-center text-xs font-medium">
            3 hours ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            742kb
          </span>
        </div>

        <Card className="bg-muted/70 flex flex-row items-center gap-1.5 rounded-lg p-2.5 shadow-none">
          <img
            src={toAbsoluteUrl('/media/file-types/pdf.svg')}
            className="h-5"
            alt=""
          />
          <Link
            to="#"
            className="hover:text-primary text-secondary-foreground me-1 text-xs font-medium"
          >
            Launch_nov24.pptx
          </Link>
          <span className="text-muted-foreground text-xs font-medium">
            Edited 39 mins ago
          </span>
        </Card>
      </div>
    </div>
  );
}
