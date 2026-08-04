import { ReactNode } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { CardContent } from '@/shared/ui/atoms/card';
import { LucideIcon, SquarePen } from 'lucide-react';
import { HexagonBadge } from '../common/hexagon-badge';

interface INotificationProps {
  icon: LucideIcon;
  title: string;
  description: string;
  button?: boolean;
  actions: ReactNode;
}

const CardNotification = ({
  icon: Icon,
  title,
  description,
  button,
  actions,
}: INotificationProps) => {
  return (
    <CardContent className="border-border flex items-center justify-between gap-2.5 border-b py-4">
      <div className="flex items-center gap-3.5">
        <HexagonBadge
          size="size-[50px]"
          badge={<Icon size={16} className="text-muted-foreground text-xl" />}
          stroke="stroke-input"
          fill="fill-muted/30"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-mono flex items-center gap-1.5 text-sm leading-none font-medium">
            {title}
          </span>
          <span className="text-secondary-foreground text-sm">
            {description}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        {button && (
          <Button variant="primary" appearance="ghost" mode="icon">
            <SquarePen />
          </Button>
        )}
        <div className="flex items-center gap-2.5">{actions}</div>
      </div>
    </CardContent>
  );
};

export { CardNotification, type INotificationProps };
