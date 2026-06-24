import { lazy, Suspense } from 'react';
import { SuspenseLoading } from '@/shared/ui/molecules/suspense-loading';
import { ErrorLayout } from '@/widgets/layouts/error/layout';
import { Navigate, Route, Routes } from 'react-router-dom';

// Lazy load error pages
const Error403 = lazy(() =>
  import('./error-403').then((m) => ({ default: m.Error403 })),
);
const Error404 = lazy(() =>
  import('./error-404').then((m) => ({ default: m.Error404 })),
);
const Error500 = lazy(() =>
  import('./error-500').then((m) => ({ default: m.Error500 })),
);

export function ErrorRouting() {
  return (
    <Suspense fallback={<SuspenseLoading />}>
      <Routes>
        <Route element={<ErrorLayout />}>
          <Route index element={<Error404 />} />
          <Route path="403" element={<Error403 />} />
          <Route path="404" element={<Error404 />} />
          <Route path="500" element={<Error500 />} />
          <Route path="*" element={<Navigate to="/error/404" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
