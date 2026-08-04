import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { Progress } from '@/shared/ui/atoms/progress';
import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarGroup } from '../common/avatar-group';
import { DropdownMenu5 } from '../dropdown-menu/dropdown-menu-5';

interface IProjectExtendedItem {
  total: string;
  description: string;
}

type IProjectExtendedItems = Array<IProjectExtendedItem>;

interface IProjectExtendedProps {
  status: {
    variant?:
      | 'primary'
      | 'destructive'
      | 'secondary'
      | 'info'
      | 'success'
      | 'warning'
      | null
      | undefined;
    label: string;
  };
  logo: string;
  title: string;
  description: string;
  team: {
    size?: string;
    group: Array<{ filename?: string; variant?: string; fallback?: string }>;
  };
  statistics: IProjectExtendedItem[];
  progress?: {
    variant: string;
    value: number;
  };
  url: string;
}

const CardProjectExtended = ({
  status,
  logo,
  title,
  description,
  team,
  statistics,
  progress,
  url,
}: IProjectExtendedProps) => {
  const renderItem = (statistic: IProjectExtendedItem) => {
    return (
      <div
        key={statistic.description}
        className="border-input max-w-auto grid min-w-24 shrink-0 grid-cols-1 content-between gap-1.5 rounded-md border border-dashed px-2.5 py-2"
      >
        <span className="text-mono text-sm leading-none font-medium">
          {statistic.total}
        </span>
        <span className="text-secondary-foreground text-xs">
          {statistic.description}
        </span>
      </div>
    );
  };

  return (
    <Card className="grow justify-between overflow-hidden">
      <div className="mb-5 p-5">
        <div className="mb-5 flex items-center justify-between">
          <Badge size="lg" variant={status.variant} appearance="light">
            {status.label}
          </Badge>
          <DropdownMenu5
            trigger={
              <Button variant="ghost" mode="icon">
                <EllipsisVertical />
              </Button>
            }
          />
        </div>
        <div className="mb-2 flex justify-center">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
            className="min-w-12 shrink-0"
            alt=""
          />
        </div>
        <div className="mb-7 text-center">
          <Link
            to={url}
            className="text-mono hover:text-primary text-lg font-medium"
          >
            {title}
          </Link>
          <div className="text-secondary-foreground text-sm">{description}</div>
        </div>
        <div className="mb-7.5 grid justify-center gap-1.5">
          <span className="text-secondary-foreground text-center text-xs uppercase">
            team
          </span>
          <AvatarGroup group={team.group} size={team.size} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-5">
          {statistics.map((statistic) => {
            return renderItem(statistic);
          })}
        </div>
      </div>
      <Progress
        value={progress?.value}
        indicatorClassName={progress?.variant}
        className="h-1"
      />
    </Card>
  );
};

export {
  CardProjectExtended,
  type IProjectExtendedItem,
  type IProjectExtendedItems,
  type IProjectExtendedProps,
};
