import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Badge } from '@/shared/ui/atoms/badge';
import { Link } from 'react-router-dom';

export default function Item16() {
  return (
    <div className="flex grow gap-2 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-29.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Ethan Parker
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              created a new tasks to{' '}
            </span>
            <Link to="#" className="hover:text-primary text-primary">
              Site Sculpt
            </Link>
            <span className="text-secondary-foreground"> project</span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            3 days ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Web Designer
          </span>
        </div>

        <div className="kt-card bg-muted/70 gap-3.5 rounded-lg p-3.5 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-mono text-xs font-medium">
                Location history is erased after Logging In
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                Due Date: 15 May, 2024
              </span>
            </div>

            <div className="flex -space-x-2">
              <Avatar className="size-6">
                <AvatarImage
                  src={toAbsoluteUrl('/media/avatars/300-3.png')}
                  alt=""
                />
                <AvatarFallback>CH</AvatarFallback>
              </Avatar>
              <Avatar className="size-6">
                <AvatarImage
                  src={toAbsoluteUrl('/media/avatars/300-2.png')}
                  alt=""
                />
                <AvatarFallback>CH</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge size="sm" variant="success" appearance="light">
              Improvement
            </Badge>
            <Badge size="sm" variant="destructive" appearance="light">
              Bug
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
