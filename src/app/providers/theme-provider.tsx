'use client';

import * as React from 'react';
import { TooltipProvider } from '@/shared/ui/atoms/tooltip';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      storageKey="vite-theme"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
