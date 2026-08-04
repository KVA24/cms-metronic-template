import { useEffect, useState } from 'react';

export function SuspenseLoading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="border-primary/20 absolute inset-0 rounded-full border-4"></div>
          <div className="border-t-primary absolute inset-0 animate-spin rounded-full border-4 border-transparent"></div>
        </div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
