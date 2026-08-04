import { Rocket } from 'lucide-react';
import { TimelineItem } from './timeline-item';

const ActivitiesProjectStatus = () => {
  return (
    <TimelineItem icon={Rocket} line={false}>
      <div className="flex flex-col">
        <div className="text-mono text-sm">
          Completed phase one of client project ahead of schedule.
        </div>
        <span className="text-secondary-foreground text-xs">
          6 days ago, 10:45 AM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesProjectStatus };
