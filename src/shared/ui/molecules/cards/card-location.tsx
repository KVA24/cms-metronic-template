import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Card } from '@/shared/ui/atoms/card';
import { Link } from 'react-router-dom';

interface ILocationProps {
  image: string;
  title: string;
  description: string;
}

const CardLocation = ({ image, title, description }: ILocationProps) => {
  return (
    <Card className="mb-4 w-[280px] border-0 shadow-none">
      <img
        src={toAbsoluteUrl(`/media/images/600x400/${image}`)}
        className="max-w-[280px] shrink-0 rounded-t-xl"
        alt=""
      />
      <div className="card-border card-rounded-b h-full px-3.5 pt-3 pb-3.5">
        <Link
          to="#"
          className="text-mono hover:text-primary mb-2 block text-base font-medium"
        >
          {title}
        </Link>
        <p className="text-secondary-foreground text-sm">{description}</p>
      </div>
    </Card>
  );
};

export { CardLocation, type ILocationProps };
