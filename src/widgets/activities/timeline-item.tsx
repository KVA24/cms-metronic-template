import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface TimelineItemProps {
  icon: LucideIcon;
  line: boolean;
  children: ReactNode;
  removeSpace?: boolean;
}

export function TimelineItem({
  line,
  icon: Icon,
  children,
  removeSpace,
}: TimelineItemProps) {
  return (
    <div className="relative flex items-start">
      {line && (
        <div className="border-s-input absolute start-0 top-9 bottom-0 w-9 translate-x-1/2 border-s rtl:-translate-x-1/2"></div>
      )}
      <div className="bg-accent/60 border-input text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full border">
        <Icon size={16} className="text-base" />
      </div>
      <div className={`ps-2.5 ${!removeSpace ? 'mb-7' : ''} grow text-base`}>
        {children}
      </div>
    </div>
  );
}
