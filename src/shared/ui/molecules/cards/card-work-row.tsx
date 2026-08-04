import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { EllipsisVertical, Heart, Mails } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu2 } from '../dropdown-menu/dropdown-menu-2';
import { IWorkProps } from './card-work';

const CardWorkRow = ({
  image,
  description,
  title,
  authorAvatar,
  authorName,
  likes,
  comments,
}: IWorkProps) => {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-7">
        <div className="flex flex-wrap items-center gap-5">
          <img
            src={toAbsoluteUrl(`/media/images/600x400/${image}`)}
            className="max-h-20 max-w-full shrink-0 rounded-md"
            alt=""
          />
          <div className="grid-col grid gap-1">
            <Link
              to="#"
              className="text-mono hover:text-primary-active mb-px text-lg font-semibold"
            >
              {title}
            </Link>
            <span className="text-secondary-foreground text-sm font-medium">
              {description}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5 lg:gap-7.5">
          <div className="flex items-center gap-1.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${authorAvatar}`)}
              className="h-7 rounded-full"
              alt=""
            />
            <Link
              to="#"
              className="text-secondary-foreground hover:text-primary-active mb-px text-sm font-medium"
            >
              {authorName}
            </Link>
          </div>
          <div className="flex w-20 items-center justify-end gap-1">
            <Heart size={16} className="text-muted-foreground text-base" />
            <span className="text-secondary-foreground py-2 text-sm font-medium">
              {likes}
            </span>
            <span className="text-secondary-foreground text-sm font-medium">
              Likes
            </span>
          </div>
          <div className="flex w-28 items-center justify-end gap-1">
            <Mails size={16} className="text-muted-foreground text-base" />
            <span className="text-secondary-foreground py-2 text-sm font-medium">
              {comments}
            </span>
            <span className="text-secondary-foreground text-sm font-medium">
              Comments
            </span>
          </div>
          <DropdownMenu2
            trigger={
              <Button variant="ghost" mode="icon">
                <EllipsisVertical />
              </Button>
            }
          />
        </div>
      </div>
    </Card>
  );
};

export { CardWorkRow };
