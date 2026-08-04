import { Button } from '@/shared/ui/atoms/button';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TimelineItem } from './timeline-item';

const ActivitiesAnniversary = () => {
  return (
    <TimelineItem icon={Trophy} line={false} removeSpace={true}>
      <div className="flex flex-col">
        <div className="text-foreground text-sm">
          We recently{' '}
          <Button mode="link" asChild>
            <Link to="/public-profile/profiles/nft">celebrated</Link>
          </Button>{' '}
          the blog's 1-year anniversary
        </div>
        <span className="text-secondary-foreground text-xs">
          3 months ago, 4:07 PM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesAnniversary };
