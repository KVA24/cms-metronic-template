import { cn } from '@/shared/lib/utils';
import { LoaderCircleIcon } from 'lucide-react';

export function ContentLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex w-full grow items-center justify-center', className)}
    >
      <div className="flex items-center gap-2.5">
        <LoaderCircleIcon className="text-muted-foreground animate-spin opacity-50" />
        <span className="text-muted-foreground text-sm font-medium">
          Loading...
        </span>
      </div>
    </div>
  );
}
