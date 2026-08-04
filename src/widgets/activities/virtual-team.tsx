import { Button } from '@/shared/ui/atoms/button';
import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TimelineItem } from './timeline-item';

const ActivitiesVirtualTeam = () => {
  return (
    <TimelineItem icon={BadgeCheck} line={false}>
      <div className="flex flex-col">
        <div className="text-foreground text-sm font-medium">
          Hosted a virtual{' '}
          <Button mode="link" asChild>
            <Link to="/public-profile/profiles/creator">
              team-building event
            </Link>
          </Button>
          , fostering collaboration and strengthening bonds among team members.
        </div>
        <span className="text-muted-foreground text-xs font-medium">
          1 month ago, 13:56 PM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesVirtualTeam };
