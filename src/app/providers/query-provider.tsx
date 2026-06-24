'use client';

import { ReactNode, useState } from 'react';
import { generalConfig } from '@/shared/config/general.config';
import { Alert, AlertIcon, AlertTitle } from '@/shared/ui/atoms/alert';
import { RiErrorWarningFill } from '@remixicon/react';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';

const enableDebug =
  generalConfig.REACT_QUERY_DEBUG || generalConfig.REACT_QUERY_DEBUG === 'true';

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 0,
            refetchOnWindowFocus: false, // Disable auto refetch on window focus
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            const message =
              error.message || 'Something went wrong. Please try again.';

            toast.custom(
              () => (
                <Alert variant="mono" icon="destructive" close={false}>
                  <AlertIcon>
                    <RiErrorWarningFill />
                  </AlertIcon>
                  <AlertTitle>{message}</AlertTitle>
                </Alert>
              ),
              {
                position: 'top-center',
              },
            );
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && enableDebug && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
};

export { QueryProvider };
