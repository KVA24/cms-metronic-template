import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Container } from '@/shared/ui/molecules/container';
import { Outlet } from 'react-router-dom';
import { Breadcrumb } from './breadcrumb';

export function Content() {
  const mobile = useIsMobile();

  return (
    <div className="grow content pt-5" role="content">
      {mobile && (
        <Container>
          <Breadcrumb />
        </Container>
      )}
      <Outlet />
    </div>
  );
}
