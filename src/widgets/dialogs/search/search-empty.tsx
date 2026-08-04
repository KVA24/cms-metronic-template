import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Button } from '@/shared/ui/atoms/button';

export function SearchEmpty() {
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
          Looking for something..
        </h3>
        <span className="text-secondary-foreground text-center text-sm font-medium">
          Initiate your digital experience with <br />
          our intuitive dashboard
        </span>
      </div>
      <div className="flex justify-center">
        <Button variant="outline">View Projects</Button>
      </div>
    </div>
  );
}
