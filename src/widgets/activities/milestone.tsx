import { Button } from '@/shared/ui/atoms/button';
import { Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TimelineItem } from './timeline-item';

const ActivitiesFollowersMilestone = () => {
  return (
    <TimelineItem icon={Coffee} line={true}>
      <div className="flex flex-col">
        <div className="text-mono text-sm">
          Reaching the milestone of{' '}
          <Button mode="link" asChild>
            <Link to="/public-profile/profiles/feeds">10,000 followers</Link>
          </Button>{' '}
          on the blog was a dream come true
        </div>
        <span className="text-secondary-foreground text-xs">
          5 days ago, 4:07 PM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesFollowersMilestone };
