import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardFooter } from '@/shared/ui/atoms/card';
import { CircleCheck, LucideIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarGroup } from '../common/avatar-group';
import { Rating } from '../common/rating';

interface ITeamProps {
  icon: LucideIcon;
  title: string;
  description: string;
  labels: string[];
  team: {
    size?: string;
    group: Array<{ filename?: string; variant?: string; fallback?: string }>;
    more?: {
      number: number;
      variant: string;
    };
    className?: string;
  };
  connected: boolean;
  rating: {
    value: number;
    round: number;
  };
}

const CardTeam = ({
  icon: Icon,
  title,
  description,
  labels,
  rating,
  team,
  connected,
}: ITeamProps) => {
  const renderItem = (label: string) => {
    return (
      <Badge key={label} size="md" variant="outline">
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="grid gap-7 py-7.5">
        <div className="grid place-items-center gap-4">
          <div className="ring-input bg-accent/60 flex size-14 items-center justify-center rounded-full ring-1">
            <Icon size={16} className="text-secondary-foreground text-2xl" />
          </div>
          <div className="grid place-items-center">
            <Link
              to="#"
              className="text-mono hover:text-primary-active mb-px text-base font-medium"
            >
              {title}
            </Link>
            <span className="text-secondary-foreground text-center text-sm">
              {description}
            </span>
          </div>
        </div>
        <div className="grid">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-secondary-foreground text-xs uppercase">
              skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => {
                return renderItem(label);
              })}
            </div>
          </div>
          <div className="border-input border-t border-dashed"></div>
          <div className="my-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-secondary-foreground text-xs uppercase">
              rating
            </span>
            <Rating rating={rating.value} round={rating.round} />
          </div>
          <div className="border-input mb-3.5 border-t border-dashed"></div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-secondary-foreground text-xs uppercase">
              members
            </span>
            <AvatarGroup
              group={team.group}
              more={team.more}
              className={team.className}
              size={team.size}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        {connected ? (
          <Button variant="outline">
            <Link to="#">
              <CircleCheck size={16} />
            </Link>{' '}
            Joined
          </Button>
        ) : (
          <Button variant="primary">
            <Link to="#">
              <Users size={16} />
            </Link>{' '}
            Join
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export { CardTeam, type ITeamProps };
