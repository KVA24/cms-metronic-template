import { useState } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Info } from 'lucide-react';

export function ShareProfileViaEmail() {
  const [emailInput, setEmailInput] = useState('');
  return (
    <div className="flex flex-col gap-2.5 px-5">
      <div className="flex-center flex gap-1">
        <h2 className="text-mono text-sm font-semibold">Share via email</h2>
        <Info size={16} className="text-muted-foreground text-sm" />
      </div>

      <div className="flex-center flex gap-2.5">
        <Input
          type="email"
          placeholder="miles.turner@gmail.com"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="w-full"
        />

        <Button size="md">Share</Button>
      </div>
    </div>
  );
}
