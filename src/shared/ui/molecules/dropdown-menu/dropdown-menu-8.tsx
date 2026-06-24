import { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Copy, FileText, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DropdownMenu8({ trigger }: { trigger: ReactNode }) {
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
        <DropdownMenuItem asChild>
          <Link to="#">
            <Pencil />
            <span>Edit</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="#">
            <Copy />
            <span>Make a copy</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
