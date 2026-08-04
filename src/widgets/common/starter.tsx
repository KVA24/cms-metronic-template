import { ReactNode } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Link } from 'react-router-dom';

export interface StarterProps {
  image: ReactNode;
  title: string;
  subTitle: ReactNode;
  engage: {
    path: string;
    btnColor: string;
    label: string;
  };
}

export function Starter({ image, title, subTitle, engage }: StarterProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2.5 py-7.5">
        <div className="flex justify-center p-7.5 py-9">{image}</div>
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-mono text-xl font-semibold">{title}</h2>
            <p className="text-foreground text-sm">{subTitle}</p>
          </div>
          <div className="mb-5 flex justify-center">
            <Button size="md" className={engage.btnColor}>
              <Link to={engage.path}>{engage.label}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
