import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Card } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ItemProps {
  userName: string;
  avatar: string;
  description: string;
  link: string;
  label: string;
  time: string;
  specialist: string;
  text: string;
}

export default function Item1({
  userName,
  avatar,
  description,
  link,
  label,
  time,
  specialist,
  text,
}: ItemProps) {
  const [emailInput, setEmailInput] = useState('');
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src={`/media/avatars/${avatar}`} alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              {userName}
            </Link>
            <span className="text-secondary-foreground"> {description} </span>
            <Link to="#" className="hover:text-primary text-primary">
              {link}
            </Link>
            <span className="text-secondary-foreground"> {label} </span>
          </div>

          <span className="text-muted-foreground flex items-center text-xs font-medium">
            {time}
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            {specialist}
          </span>
        </div>

        <Card className="bg-muted/70 flex flex-col gap-2.5 rounded-lg p-3.5 shadow-none">
          <div className="text-secondary-foreground mb-px text-sm font-semibold">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              @Cody{' '}
            </Link>
            <span className="text-secondary-foreground font-medium">
              {text}
            </span>
          </div>

          <div className="relative w-full sm:max-w-full">
            <ImageIcon className="text-muted-foreground absolute end-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Reply"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
