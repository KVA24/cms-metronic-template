import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { CircleCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarGroup } from '../common/avatar-group';
import { Rating } from '../common/rating';
import { ITeamProps } from './card-team';

const CardTeamRow = ({
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
    <Card className="p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-7">
        <div className="flex items-center gap-4">
          <div className="ring-input bg-accent/60 flex size-14 shrink-0 items-center justify-center rounded-full ring-1">
            <Icon size={16} className="text-secondary-foreground text-2xl" />
          </div>
          <div className="grid-col grid gap-1">
            <Link
              to="#"
              className="text-mono hover:text-primary-active mb-px text-base font-medium"
            >
              {title}
            </Link>
            <span className="text-secondary-foreground text-sm">
              {description}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 lg:gap-12">
          <div className="grid justify-end gap-5 lg:text-end">
            <span className="text-muted-foreground text-xs font-normal uppercase">
              skills
            </span>
            <div className="flex gap-1.5">
              {labels.map((label) => {
                return renderItem(label);
              })}
            </div>
          </div>
          <div className="grid justify-end gap-6 lg:text-end">
            <div className="text-secondary-foreground text-xs uppercase">
              rating
            </div>
            <Rating rating={rating.value} round={rating.round} />
          </div>
          <div className="max-w-auto grid shrink-0 justify-end gap-3.5 lg:min-w-24 lg:text-end">
            <span className="text-secondary-foreground text-xs uppercase">
              memebers
            </span>
            <AvatarGroup
              group={team.group}
              more={team.more}
              className={team.className}
              size={team.size}
            />
          </div>
          <div className="grid min-w-20 justify-end">
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
          </div>
        </div>
      </div>
    </Card>
  );
};

export { CardTeamRow };
