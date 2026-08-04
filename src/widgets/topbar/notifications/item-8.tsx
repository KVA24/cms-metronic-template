import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Card } from '@/shared/ui/atoms/card';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Item8() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-12.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Skylar Frost
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              uploaded 2 attachments{' '}
            </span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            3 days ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Web Design
          </span>
        </div>

        <Card className="bg-muted/70 flex flex-row items-center justify-between gap-1.5 rounded-lg p-2.5 shadow-none">
          <div className="flex items-center gap-1.5">
            <img
              src={toAbsoluteUrl('/media/file-types/word.svg')}
              className="h-5"
              alt=""
            />

            <span className="text-secondary-foreground me-1 text-xs font-medium">
              landing-page-ver1.docx
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              Upload 3 days ago
            </span>
          </div>
          <Download size={16} className="text-muted-foreground text-md" />
        </Card>

        <Card className="bg-muted/70 flex flex-row items-center justify-between gap-1.5 rounded-lg p-2.5 shadow-none">
          <div className="flex items-center gap-1.5">
            <img
              src={toAbsoluteUrl('/media/file-types/word.svg')}
              className="h-5"
              alt=""
            />

            <span className="hover:text-primary text-secondary-foreground me-1 text-xs font-medium">
              landing-page-ver2.docx
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              Upload 3 days ago
            </span>
          </div>

          <Download size={16} className="text-muted-foreground text-md" />
        </Card>
      </div>
    </div>
  );
}
