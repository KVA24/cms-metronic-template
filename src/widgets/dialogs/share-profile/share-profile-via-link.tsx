import { useState } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Copy, Info } from 'lucide-react';

export function ShareProfileViaLink() {
  const [linkInput, setLinkInput] = useState('');
  return (
    <div className="flex flex-col gap-2.5 px-5">
      <div className="flex-center flex gap-1">
        <h2 className="text-mono text-sm font-semibold">
          Share read-only link
        </h2>
        <Info size={16} className="text-muted-foreground text-sm" />
      </div>

      <div className="relative w-full">
        <Input
          className="pe-10"
          type="text"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder=""
        />
        <Button
          variant="ghost"
          mode="icon"
          className="absolute end-0 top-2/4 me-1.5 -translate-y-2/4"
        >
          <Copy size={12} />
        </Button>
      </div>
    </div>
  );
}
