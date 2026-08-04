import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Card } from '@/shared/ui/atoms/card';
import { Heart, Mails } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IWorkProps {
  image: string;
  title: string;
  description?: string;
  authorAvatar: string;
  authorName: string;
  likes: number;
  comments: number;
}

const CardWork = ({
  image,
  title,
  authorAvatar,
  authorName,
  likes,
  comments,
}: IWorkProps) => {
  return (
    <Card className="border-0 shadow-sm shadow-black/8">
      <img
        src={toAbsoluteUrl(`/media/images/600x400/${image}`)}
        className="h-auto w-full rounded-t-xl"
        alt=""
      />
      <div className="card-border card-rounded-b flex flex-col gap-2 px-5 py-4.5">
        <Link
          to="/public-profile/profiles/company"
          className="text-mono hover:text-primary text-lg font-medium"
        >
          {title}
        </Link>
        <div className="flex grow items-center justify-between">
          <div className="flex grow items-center">
            <img
              src={toAbsoluteUrl(`/media/avatars/${authorAvatar}`)}
              className="me-2 size-7 rounded-full"
              alt=""
            />
            <Link
              to="/public-profile/profiles/nft"
              className="text-foreground hover:text-primary mb-px text-sm"
            >
              {authorName}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart size={16} className="text-muted-foreground text-base" />
              <span className="text-foreground py-2 text-sm">{likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Mails size={16} className="text-muted-foreground text-base" />
              <span className="text-foreground py-2 text-sm">{comments}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { CardWork, type IWorkProps };
