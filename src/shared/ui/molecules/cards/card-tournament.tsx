import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Badge } from '@/shared/ui/atoms/badge';
import { Card } from '@/shared/ui/atoms/card';
import { Progress } from '@/shared/ui/atoms/progress';
import { Link } from 'react-router-dom';

interface ITournamentProps {
  image: string;
  logo: string;
  title: string;
  time: string;
  labels: string[];
  progress: {
    variant: string;
    value: number;
    slotNumber: number;
    leftNumber: number;
  };
}

const CardTournament = ({
  image,
  logo,
  title,
  time,
  labels,
  progress,
}: ITournamentProps) => {
  const renderItem = (label: string) => {
    return (
      <Badge key={label} size="sm" variant="outline">
        {label}
      </Badge>
    );
  };

  return (
    <Card className="mb-5 w-[285px] shadow-none">
      <div
        className="h-56 w-[285px] rounded-t-xl bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x600/${image}`)})`,
        }}
      ></div>
      <div className="card-border card-rounded-b mb-4 grid gap-6 px-5 pt-3.5 pb-3">
        <div className="flex items-center gap-2.5">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
            className="size"
            alt=""
          />
          <div className="grid grid-cols-1 gap-0.5">
            <Link
              to="#"
              className="text-mono hover:text-primary-active mb-px text-base font-medium"
            >
              {title}
            </Link>
            <time className="text-secondary-foreground flex items-center gap-1.5 text-xs">
              <div className="bg-destructive h-1.5 w-1.5 gap-1.5 rounded-full"></div>{' '}
              {time}
            </time>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => {
            return renderItem(label);
          })}
        </div>
        <div className="mb-0.5 grid gap-1.5">
          <Progress
            value={progress?.value}
            indicatorClassName={progress?.variant}
            className="h-1"
          />
          <div className="flex place-content-between items-center">
            <span className="text-secondary-foreground text-xs font-medium">
              {progress.slotNumber} slots
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {progress.leftNumber} left
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { CardTournament, type ITournamentProps };
