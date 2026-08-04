import { ReactNode } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HexagonBadge } from '../common/hexagon-badge';
import { DropdownMenu5 } from '../dropdown-menu/dropdown-menu-5';

interface Badge {
  size: string;
  badge: ReactNode;
  fill: string;
  stroke: string;
}

interface IRoleProps {
  badge: Badge;
  title: string;
  subTitle: string;
  description: string;
  team: string;
  path: string;
}

const CardRole = ({
  path,
  title,
  subTitle,
  description,
  team,
  badge,
}: IRoleProps) => {
  return (
    <Card className="flex flex-col gap-5 p-5 lg:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-2.5">
          <HexagonBadge {...badge} />
          <div className="flex flex-col">
            <Link
              to={path}
              className="text-mono hover:text-primary-active mb-px text-base font-medium"
            >
              {title}
            </Link>
            <span className="text-secondary-foreground text-sm">
              {subTitle}
            </span>
          </div>
        </div>
        <DropdownMenu5
          trigger={
            <Button variant="ghost" mode="icon">
              <EllipsisVertical />
            </Button>
          }
        />
      </div>
      <p className="text-secondary-foreground text-sm">{description}</p>
      <span className="text-foreground text-sm">{team}</span>
    </Card>
  );
};

export { CardRole, type IRoleProps };
