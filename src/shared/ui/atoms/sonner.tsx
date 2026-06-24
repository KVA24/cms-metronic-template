'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="group toaster"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground! group-[.toaster]:border group-[.toaster]:shadow-lg has-[[role=alert]]:border-0! has-[[role=alert]]:shadow-none! has-[[role=alert]]:bg-transparent!',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:rounded-md! group-[.toast]:bg-primary group-[.toast]:text-primary-foreground!',
          cancelButton:
            'group-[.toast]:rounded-md! group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground!',

          // Success toast - green
          success:
            'group-[.toaster]:!bg-green-50 group-[.toaster]:!border-green-200 group-[.toaster]:!text-green-900 dark:group-[.toaster]:!bg-green-950 dark:group-[.toaster]:!border-green-800 dark:group-[.toaster]:!text-green-100 [&_[data-icon]]:!text-green-600 dark:[&_[data-icon]]:!text-green-400',

          // Error toast - red
          error:
            'group-[.toaster]:!bg-red-50 group-[.toaster]:!border-red-200 group-[.toaster]:!text-red-900 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!border-red-800 dark:group-[.toaster]:!text-red-100 [&_[data-icon]]:!text-red-600 dark:[&_[data-icon]]:!text-red-400',

          // Warning toast - yellow/orange
          warning:
            'group-[.toaster]:!bg-yellow-50 group-[.toaster]:!border-yellow-200 group-[.toaster]:!text-yellow-900 dark:group-[.toaster]:!bg-yellow-950 dark:group-[.toaster]:!border-yellow-800 dark:group-[.toaster]:!text-yellow-100 [&_[data-icon]]:!text-yellow-600 dark:[&_[data-icon]]:!text-yellow-400',

          // Info toast - blue
          info: 'group-[.toaster]:!bg-blue-50 group-[.toaster]:!border-blue-200 group-[.toaster]:!text-blue-900 dark:group-[.toaster]:!bg-blue-950 dark:group-[.toaster]:!border-blue-800 dark:group-[.toaster]:!text-blue-100 [&_[data-icon]]:!text-blue-600 dark:[&_[data-icon]]:!text-blue-400',
        },
      }}
      style={{
        zIndex: 2147483647, // Maximum z-index value
      }}
      {...props}
    />
  );
};

export { Toaster };
