import { Button } from '@/shared/ui/atoms/button';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TimelineItem } from './timeline-item';

const ActivitiesNewArticle = () => {
  return (
    <TimelineItem icon={Users} line={true}>
      <div className="flex flex-col">
        <div className="text-foreground text-sm">
          Posted a new article{' '}
          <Button mode="link" asChild>
            <Link to="/public-profile/profiles/blogger">
              Top 10 Tech Trends
            </Link>
          </Button>
        </div>
        <span className="text-secondary-foreground text-xs">
          Today, 9:00 AM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesNewArticle };
