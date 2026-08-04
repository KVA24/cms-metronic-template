import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Card } from '@/shared/ui/atoms/card';
import { Clock9 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IPostProps {
  image: string;
  label: string;
  description: string;
  time: string;
}

const CardPost = ({ image, label, description, time }: IPostProps) => {
  return (
    <Card className="mb-5 w-[280px] shadow-none">
      <div
        className="h-[240px] w-[280px] rounded-t-xl bg-cover bg-center"
        style={{
          backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x400/${image}`)})`,
        }}
      ></div>
      <div className="card-border card-rounded-b grid gap-1.5 px-5 py-4">
        <Link
          to="#"
          className="hover:text-primary text-sm font-medium text-orange-400"
        >
          {label}
        </Link>
        <Link
          to="#"
          className="text-mono hover:text-primary mb-1.5 text-lg leading-6 font-medium"
        >
          {description}
        </Link>
        <time className="text-secondary-foreground flex items-center gap-1.5 text-sm leading-none font-medium">
          <Clock9 size={16} className="text-muted-foreground text-lg" /> {time}
        </time>
      </div>
    </Card>
  );
};

export { CardPost, type IPostProps };
