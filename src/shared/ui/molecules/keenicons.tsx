import { cn } from '@/shared/lib/utils';
import { KeeniconsProps } from './keenicons-types.ts';

export function KeenIcon({
  icon,
  style = 'filled',
  className = '',
  ref,
  ...props
}: KeeniconsProps & { ref?: React.Ref<HTMLElement> }) {
  return (
    <i
      ref={ref}
      {...props}
      className={cn(`ki-${style}`, `ki-${icon}`, className)}
    />
  );
}
