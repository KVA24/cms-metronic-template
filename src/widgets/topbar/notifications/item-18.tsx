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

interface IItem18Item {
  image: string;
  title: string;
  id: string;
}

type IItem18Items = Array<IItem18Item>;

export default function Item18() {
  const items: IItem18Items = [
    {
      image: '6.jpg',
      title: 'Geometric Patterns',
      id: '81023',
    },
    {
      image: '1.jpg',
      title: 'Artistic Expressions',
      id: '67890',
    },
  ];

  const renderItem = (item: IItem18Item) => {
    return (
      <Card
        key={item.id}
        className="bg-muted/70 flex w-40 flex-col gap-3.5 overflow-hidden shadow-none"
      >
        <div
          className="kt-card-rounded-t h-24 shrink-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x600/${item.image}`)})`,
          }}
        ></div>

        <div className="px-2.5 pb-2">
          <Link
            to="#"
            className="text-secondary-foreground hover:text-primary mb-0.5 block text-xs leading-4 font-medium"
          >
            {item.title}
          </Link>
          <div className="text-muted-foreground text-xs font-medium">
            Token ID:
            <span className="text-secondary-foreground text-xs font-medium">
              {item.id}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-1.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="online" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-2.5">
        <div className="mb-1 flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Jane Perez
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              added 2 new works to{' '}
            </span>
            <Link
              to="#"
              className="hover:text-primary text-primary font-semibold"
            >
              Inspirations 2024
            </Link>
          </div>

          <span className="text-muted-foreground flex items-center text-xs font-medium">
            23 hours ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Craftwork Design
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {items.map((item) => {
            return renderItem(item);
          })}
        </div>
      </div>
    </div>
  );
}
