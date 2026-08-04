import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { Card } from '@/shared/ui/atoms/card';
import { SquareSigma } from 'lucide-react';
import { Link } from 'react-router-dom';

interface INFTProps {
  image: string;
  title: string;
  id: string;
  info: string;
  date: string;
}

const CardNFT = ({ image, id, title, info, date }: INFTProps) => {
  return (
    <Card className="mb-5 shadow-none">
      <div
        className="h-[240px] w-[280px] rounded-t-xl bg-cover bg-center"
        style={{
          backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x600/${image}`)})`,
        }}
      ></div>
      <div className="card-border card-rounded-b px-3.5 pt-5 pb-3.5">
        <div className="pb-6">
          <Link
            to="#"
            className="text-mono hover:text-primary mb-2 block text-base leading-4 font-medium"
          >
            {title}
          </Link>
          <div className="text-secondary-foreground text-sm">
            Token ID:
            <span className="text-foreground text-sm font-medium"> {id}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 items-center">
          <div className="flex flex-col gap-2">
            <span className="text-secondary-foreground text-sm">
              Current bid
            </span>
            <div className="flex items-center gap-1">
              <SquareSigma
                size={16}
                className="text-lg leading-none text-orange-400"
              />
              <span className="text-mono text-sm leading-none font-semibold tracking-tight">
                {info}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 justify-self-end text-end">
            <span className="text-secondary-foreground text-sm">Ending in</span>
            <span className="text-mono text-sm leading-none font-semibold tracking-tight">
              {date}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { CardNFT, type INFTProps };
