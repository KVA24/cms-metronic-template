import { createContext, ReactNode, use, useState } from 'react';
import { MenuItem } from '@/shared/config/types';

interface BreadcrumbContextType {
  customBreadcrumb: MenuItem[] | null;
  setCustomBreadcrumb: (items: MenuItem[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined,
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customBreadcrumb, setCustomBreadcrumb] = useState<MenuItem[] | null>(
    null,
  );

  return (
    <BreadcrumbContext.Provider
      value={{ customBreadcrumb, setCustomBreadcrumb }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = use(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context;
}
