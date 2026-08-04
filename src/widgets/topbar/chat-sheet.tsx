import { ReactNode, useState } from 'react';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Input } from '@/shared/ui/atoms/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/atoms/sheet';
import {
  Calendar,
  CheckCheck,
  MoreVertical,
  Settings2,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarGroup } from '../../shared/ui/molecules/common/avatar-group';

interface Message {
  avatar: string;
  text: string;
  time: string;
  in?: boolean;
  out?: boolean;
  read?: boolean;
}

export function ChatSheet({ trigger }: { trigger: ReactNode }) {
  const [emailInput, setEmailInput] = useState('');

  const messages: Message[] = [
    {
      avatar: '/media/avatars/300-5.png',
      time: '14:04',
      text: 'Hello! <br> Next week we are closing the project. Do You have questions?',
      in: true,
    },
    {
      avatar: '/media/avatars/300-2.png',
      text: 'This is excellent news!',
      time: '14:08',
      read: true,
      out: true,
    },
    {
      avatar: '/media/avatars/300-4.png',
      time: '14:26',
      text: 'I have checked the features, can not wait to demo them!',
      in: true,
    },
    {
      avatar: '/media/avatars/300-1.png',
      time: '15:09',
      text: 'I have looked over the rollout plan, and everything seems spot on. I am ready on my end and can not wait for the user feedback.',
      in: true,
    },
    {
      avatar: '/media/avatars/300-2.png',
      text: "Haven't seen the build yet, I'll look now.",
      time: '15:52',
      read: false,
      out: true,
    },
    {
      avatar: '/media/avatars/300-2.png',
      text: 'Checking the build now',
      time: '15:52',
      read: false,
      out: true,
    },
    {
      avatar: '/media/avatars/300-4.png',
      time: '17:40',
      text: 'Tomorrow, I will send the link for the meeting',
      in: true,
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="inset-5 start-auto h-auto gap-0 rounded-lg p-0 sm:w-[450px] sm:max-w-none [&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5">
        <SheetHeader>
          <div className="border-border flex items-center justify-between border-b p-3">
            <SheetTitle>Chat</SheetTitle>
          </div>
          <div className="border-border border-b p-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-accent/60 border-border flex h-11 w-11 items-center justify-center rounded-full border">
                  <img
                    src={toAbsoluteUrl('/media/brand-logos/gitlab.svg')}
                    className="h-7 w-7"
                    alt=""
                  />
                </div>
                <div>
                  <Link
                    to="#"
                    className="text-mono text-sm font-semibold hover:text-blue-600"
                  >
                    HR Team
                  </Link>
                  <span className="text-muted-foreground block text-xs italic">
                    Jessy is typing...
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AvatarGroup
                  size="size-8"
                  group={[
                    { path: '/media/avatars/300-4.png' },
                    { path: '/media/avatars/300-1.png' },
                    { path: '/media/avatars/300-2.png' },
                    {
                      fallback: '+10',
                      variant: 'bg-green-500 text-white',
                    },
                  ]}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" mode="icon" size="sm">
                      <MoreVertical className="size-4!" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-44"
                    side="bottom"
                    align="end"
                  >
                    <DropdownMenuItem asChild>
                      <Link to="/account/members/teams">
                        <Users /> Invite Users
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Settings2 />
                        <span>Team Settings</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to="/account/members/import-members">
                              <Shield />
                              Find Members
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/account/members/import-members">
                              <Calendar /> Meetings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/account/members/import-members">
                              <Shield /> Group Settings
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem asChild>
                      <Link to="/account/security/privacy-settings">
                        <Shield /> Group Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </SheetHeader>
        <SheetBody className="scrollable-y-auto grow space-y-3.5">
          {messages.map((message) =>
            message.out ? (
              <div
                key={`out-${message.time}`}
                className="flex items-end justify-end gap-3 px-5"
              >
                <div className="flex flex-col gap-1">
                  <div
                    className="bg-primary text-primary-foreground rounded-lg p-3 text-sm font-medium shadow-xs"
                    dangerouslySetInnerHTML={{ __html: message.text }}
                  />
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-secondary-foreground text-xs">
                      {message.time}
                    </span>
                    <CheckCheck
                      className={cn(
                        'h-4 w-4',
                        message.read
                          ? 'text-green-500'
                          : 'text-muted-foreground',
                      )}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Avatar className="size-9">
                    <AvatarImage
                      src={toAbsoluteUrl('/media/avatars//300-2.png')}
                      alt=""
                    />
                    <AvatarFallback>CH</AvatarFallback>
                    <AvatarIndicator className="-end-2 -bottom-2">
                      <AvatarStatus variant="online" className="size-2.5" />
                    </AvatarIndicator>
                  </Avatar>
                </div>
              </div>
            ) : message.in ? (
              <div
                key={`in-${message.time}`}
                className="flex items-end gap-3 px-5"
              >
                <Avatar className="size-9">
                  <AvatarImage src={toAbsoluteUrl(message.avatar)} alt="" />
                  <AvatarFallback>CH</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div
                    className="bg-accent/50 text-secondary-foreground rounded-lg p-3 text-sm font-medium shadow-xs"
                    dangerouslySetInnerHTML={{ __html: message.text }}
                  />
                  <span className="text-muted-foreground text-xs">
                    {message.time}
                  </span>
                </div>
              </div>
            ) : null,
          )}
        </SheetBody>
        <SheetFooter className="block p-0 sm:space-x-0">
          <div className="bg-accent/50 flex gap-2 p-4">
            <Avatar className="size-9">
              <AvatarImage
                src={toAbsoluteUrl('/media/avatars//300-14.png')}
                alt=""
              />
              <AvatarFallback>CH</AvatarFallback>
              <AvatarIndicator className="-end-2 -bottom-2">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
            <div className="flex flex-1 items-center justify-between gap-0.5">
              <div className="flex flex-col">
                <div className="inline-flex gap-0.5 text-sm">
                  <Link
                    to="#"
                    className="text-mono hover:text-primary font-semibold"
                  >
                    Jane Perez
                  </Link>
                  <span className="text-muted-foreground">
                    wants to join chat
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  1 day ago • Design Team
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Decline
                </Button>
                <Button size="sm" variant="mono">
                  Accept
                </Button>
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-2 p-5">
            <img
              src={toAbsoluteUrl('/media/avatars/300-2.png')}
              className="absolute top-1/2 left-7 h-8 w-8 -translate-y-1/2 rounded-full"
              alt=""
            />
            <Input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Write a message..."
              className="h-auto w-full py-4 ps-12 pe-24"
            />
            <div className="absolute end-7 top-1/2 flex -translate-y-1/2 gap-2">
              <Button size="sm" variant="ghost" mode="icon">
                <Upload className="size-4!" />
              </Button>
              <Button size="sm" variant="mono">
                Send
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
