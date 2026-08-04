import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Button } from '@/shared/ui/atoms/button';

export function SearchNoResults() {
  return (
    <div className="flex flex-col gap-5 py-9 text-center">
      <div className="flex justify-center">
        <img
          src={toAbsoluteUrl('/media/illustrations/33.svg')}
          className="max-h-[113px] dark:hidden"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/33-dark.svg')}
          className="light:hidden max-h-[113px]"
          alt=""
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-mono text-center text-base font-semibold">
          No Results
        </h3>
        <span className="text-secondary-foreground text-center text-sm font-medium">
          Refine your query to discover relevant items
        </span>
      </div>
      <div className="flex justify-center">
        <Button variant="outline">View Projects</Button>
      </div>
    </div>
  );
}
