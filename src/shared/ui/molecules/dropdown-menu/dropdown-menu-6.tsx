import { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import {
  Bell,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function DropdownMenu6({ trigger }: { trigger: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-[150px]" side="bottom" align="end">
        <DropdownMenuItem asChild>
          <Link to="#">
            <FileText />
            <span>View</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Bell />
            <span>Export</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[150px]">
            <DropdownMenuItem asChild>
              <Link to="/account/home/settings-sidebar">
                <Mail />
                <span>Email</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account/home/settings-sidebar">
                <MessageSquare />
                <span>SMS</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account/home/settings-sidebar">
                <Send />
                <span>Push</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <Link to="#">
            <Pencil />
            <span>Edit</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="#">
            <Trash2 />
            <span>Delete</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
