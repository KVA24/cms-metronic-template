import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Card } from '@/shared/ui/atoms/card';
import { AvatarGroup } from '@/shared/ui/molecules/common/avatar-group';
import {
  CalendarDays,
  Lock,
  MapPin,
  NotepadText,
  Timer,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Item7() {
  return (
    <div className="flex grow gap-2.5 px-5">
      <Avatar>
        <AvatarImage src="/media/avatars/300-15.png" alt="" />
        <AvatarFallback>CH</AvatarFallback>
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus variant="offline" className="size-2.5" />
        </AvatarIndicator>
      </Avatar>

      <div className="flex grow flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="mb-px text-sm font-medium">
            <Link to="#" className="hover:text-primary text-mono font-semibold">
              Nova Hawthorne
            </Link>
            <span className="text-secondary-foreground">
              {' '}
              sent you an meeting invation{' '}
            </span>
          </div>
          <span className="text-muted-foreground flex items-center text-xs font-medium">
            2 days ago
            <span className="bg-mono/30 mx-1.5 size-1 rounded-full"></span>
            Dev Team
          </span>
        </div>

        <Card className="bg-muted/70 gap-1.5 rounded-lg py-2.5 shadow-none">
          <div className="mb-0.5 flex flex-col gap-2.5 px-2.5">
            <span className="text-secondary-foreground text-xs font-medium">
              Peparation for Release
              <Lock size={16} />
            </span>

            <div className="flex items-center gap-2.5">
              <Badge
                size="sm"
                variant="warning"
                appearance="light"
                className="me-1 text-yellow-400"
              >
                <NotepadText /> Project
              </Badge>
              <Badge
                size="sm"
                variant="secondary"
                appearance="light"
                className="text-secondary-foreground me-1"
              >
                <Users /> DigitalDream
              </Badge>
            </div>
          </div>

          <div className="border-b-border my-1.5 border-b"></div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 px-2.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  <CalendarDays
                    size={16}
                    className="text-muted-foreground me-0.5 text-xs"
                  />
                  <span className="text-muted-foreground text-xs font-medium">
                    22 April 2024
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <Timer size={16} className="text-muted-foreground text-xs" />
                  <span className="text-muted-foreground text-xs font-medium">
                    12:00 PM - 14:00 PM
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <MapPin size={16} className="text-muted-foreground text-xs" />
                <div className="text-muted-foreground text-xs font-medium">
                  Online
                  <Link
                    to="#"
                    className="hover:text-primary text-primary font-medium"
                  >
                    Zoom Meeting
                  </Link>
                </div>
              </div>
            </div>

            <AvatarGroup
              size="size-6"
              group={[
                { path: '/media/avatars/300-4.png' },
                { path: '/media/avatars/300-1.png' },
                { path: '/media/avatars/300-2.png' },
                {
                  fallback: '+3',
                  variant: 'text-white size-6 ring-background bg-green-500',
                },
              ]}
            />
          </div>
        </Card>

        <div className="flex flex-wrap gap-2.5">
          <Button size="sm" variant="outline">
            Decline
          </Button>
          <Button size="sm" variant="mono">
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
