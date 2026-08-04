import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';

interface Avatar {
  path?: string;
  filename?: string;
  fallback?: string;
  variant?: string;
}

type Avatars = Array<Avatar>;

interface AvatarGroupProp {
  size?: string;
  group: Avatar[];
  more?: { variant?: string; number?: number | string; label?: string };
  className?: string;
}

function AvatarGroup({ size, group, more, className }: AvatarGroupProp) {
  const avatarSize = size ? size : 'size-7';

  const renderItem = (each: Avatar) => {
    return (
      <Avatar key={each.filename || each.path} className={cn(avatarSize)}>
        {each.filename || each.path ? (
          <AvatarImage
            src={toAbsoluteUrl(each.path || `/media/avatars/${each.filename}`)}
            alt=""
            className={cn(
              'border-background border-1 hover:z-10',
              each.variant,
            )}
          />
        ) : null}
        {each.fallback ? (
          <AvatarFallback
            className={cn(
              'border-background relative border-1 text-[11px] hover:z-10',
              size,
              each.variant,
            )}
          >
            {each.fallback}
          </AvatarFallback>
        ) : null}
      </Avatar>
    );
  };

  return (
    <div className={cn('flex -space-x-2', className)}>
      {group.map((each) => renderItem(each))}
      {more && (
        <span
          className={cn(
            'border-background relative flex shrink-0 cursor-default items-center justify-center rounded-full border-1 text-[11px] leading-none font-semibold hover:z-10',
            avatarSize,
            more.variant,
          )}
        >
          +{more.number || more.label}
        </span>
      )}
    </div>
  );
}

export { AvatarGroup, type Avatar, type Avatars, type AvatarGroupProp };
