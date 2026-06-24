import { useState } from 'react';
import { GameReward } from '@/features/game-pools/api/gameRewardsApi';
import { useAllGameRewards } from '@/features/game-pools/hooks/use-game-rewards-queries';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { ScrollArea } from '@/shared/ui/atoms/scroll-area';
import { Search } from 'lucide-react';

interface RewardSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (rewards: GameReward[]) => void;
  onConfirm?: () => void;
  excludeIds?: number[];
}

export function RewardSelectorDialog({
  open,
  onClose,
  onSelect,
  onConfirm,
  excludeIds = [],
}: RewardSelectorDialogProps) {
  const { t } = useTranslations();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: rewards = [], isLoading } = useAllGameRewards({
    enabled: open,
  });

  const filtered = rewards.filter(
    (r) =>
      !excludeIds.includes(Number(r.id)) &&
      (r.rewardName?.toLowerCase().includes(search.toLowerCase()) ||
        r.id?.toString().includes(search)),
  );

  const handleToggle = (rewardId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(rewardId)) {
      newSelected.delete(rewardId);
    } else {
      newSelected.add(rewardId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selectedRewards = rewards.filter((r) => selectedIds.has(r.id));
    onSelect(selectedRewards);
    setSelectedIds(new Set());
    setSearch('');
    onConfirm?.();
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('GAME_POOLS.REWARD_SELECTOR.TITLE')}</DialogTitle>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('GAME_POOLS.REWARD_SELECTOR.SEARCH_PLACEHOLDER')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Badge variant="secondary">
              {t('GAME_POOLS.REWARD_SELECTOR.SELECTED', {
                count: selectedIds.size,
              })}
            </Badge>
          </div>
        )}
        <ScrollArea className="h-72 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {t('COMMON.LOADING')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {t('GAME_POOLS.REWARD_SELECTOR.NO_REWARDS')}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((reward) => {
                const isSelected = selectedIds.has(reward.id);
                return (
                  <button
                    key={reward.id}
                    type="button"
                    onClick={() => handleToggle(reward.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm text-left transition-colors ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium">{reward.rewardName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ID: {reward.id} · {reward.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('COMMON.CANCEL')}
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            {t('COMMON.CONFIRM')} ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
