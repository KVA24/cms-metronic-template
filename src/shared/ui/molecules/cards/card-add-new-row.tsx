import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HexagonBadge } from '../common/hexagon-badge';

interface IAddNewProps {
  path: string;
  size: string;
  iconSize: string;
  title: string;
  subTitle: string;
}

const CardAddNewRow = ({
  path,
  size,
  iconSize,
  title,
  subTitle,
}: IAddNewProps) => {
  return (
    <Link to={`/${path}`}>
      <Card className="border-primary-clarity border-2 border-dashed bg-cover bg-center bg-no-repeat">
        <CardContent>
          <div className="flex items-center justify-center gap-5">
            <div className="flex justify-center">
              <HexagonBadge
                size={size}
                badge={
                  <Rocket size={16} className={`${iconSize} text-primary`} />
                }
                stroke="stroke-blue-400"
                fill="fill-white"
              />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-mono hover:text-primary-active mb-px text-lg font-semibold">
                {title}
              </span>
              <span className="text-secondary-foreground text-sm font-normal">
                {subTitle}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export { CardAddNewRow, type IAddNewProps };
