import { toAbsoluteUrl } from '@/shared/lib/helpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { Link } from 'react-router-dom';

export function ShareProfileUsers() {
  const items = [
    {
      avatar: '300-3.png',
      userName: 'Tyler Hero',
      email: 'tyler.hero@gmail.com',
      role: 'owner',
    },
    {
      avatar: '300-1.png',
      userName: 'Esther Howard',
      email: 'esther.howard@gmail.com',
      role: 'editor',
    },
    {
      avatar: '300-11.png',
      userName: 'Jacob Jones',
      email: 'jacob.jones@gmail.com',
      role: 'viewer',
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 px-5">
      {items.map((item) => (
        <div key={item.userName} className="flex flex-wrap items-center gap-2">
          <div className="flex grow items-center gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
              className="size-9 shrink-0 rounded-full"
              alt={`${item.userName} avatar`}
            />
            <div className="flex flex-col">
              <Link
                to="#"
                className="text-mono hover:text-primary-active mb-px text-sm font-semibold"
              >
                {item.userName}
              </Link>
              <Link
                to="#"
                className="hover:text-primary-active text-secondary-foreground text-sm font-medium"
              >
                {item.email}
              </Link>
            </div>
          </div>

          <Select defaultValue={item.role}>
            <SelectTrigger className="w-24" size="sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="w-32">
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
