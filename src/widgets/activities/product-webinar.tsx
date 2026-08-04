import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { Progress } from '@/shared/ui/atoms/progress';
import { CalendarCheck2, SquareDashedBottomCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarGroup } from '../../shared/ui/molecules/common/avatar-group';
import { TimelineItem } from './timeline-item';

const ActivitiesProductWebinar = () => {
  return (
    <TimelineItem icon={CalendarCheck2} line={true}>
      <div className="flex flex-col pb-2.5">
        <span className="text-foreground text-sm">
          Jenny attended a webinar on new product features.
        </span>
        <span className="text-secondary-foreground text-xs">
          3 days ago, 11:45 AM
        </span>
      </div>
      <Card className="p-4 shadow-none">
        <div className="flex flex-wrap gap-2.5">
          <SquareDashedBottomCode
            size={20}
            className="text-lg text-violet-500"
          />
          <div className="flex grow flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-mono hover:text-primary mb-px cursor-pointer text-base font-medium">
                  Leadership Development Series: Part 1
                </span>
                <span className="text-secondary-foreground text-xs">
                  The first installment of a leadership development series.
                </span>
              </div>
              <Button mode="link" underlined="dashed">
                <Link to="/account/members/teams">View</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-7.5">
              <div className="flex items-center gap-1.5">
                <span className="text-secondary-foreground text-sm font-medium">
                  Code:
                </span>
                <span className="text-primary text-sm">#leaderdev-1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-secondary-foreground text-sm">
                  Progress:
                </span>
                <Progress
                  value={80}
                  indicatorClassName="bg-green-500 min-w-[120px]"
                  className="h-1"
                />
              </div>
              <div className="max-w-auto flex shrink-0 items-center gap-1.5 lg:min-w-24">
                <span className="text-secondary-foreground text-sm">
                  Guests:
                </span>
                <AvatarGroup
                  size="size-7"
                  group={[
                    { filename: '300-4.png' },
                    { filename: '300-1.png' },
                    { filename: '300-2.png' },
                    {
                      fallback: '+24',
                      variant:
                        'text-primary-foreground ring-background bg-primary',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </TimelineItem>
  );
};

export { ActivitiesProductWebinar };
