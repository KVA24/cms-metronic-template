import { useState } from 'react';
import {
  PeriodType,
  PeriodTypeSchedule,
  PoolRewardSchedule,
  RewardMap,
} from '@/features/game-pools/api/gamePoolsApi';
import { useTranslations } from '@/shared/hooks/use-translations';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { DatePicker } from '@/shared/ui/atoms/date-picker';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { Switch } from '@/shared/ui/atoms/switch';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { RewardSelectorDialog } from './reward-selector-dialog';

const PERIOD_TYPES: PeriodType[] = [
  'ALL_THE_TIME',
  'UNLIMITED',
  'DAY',
  'WEEK',
  'MONTH',
];

const PERIOD_TYPES_SCHEDULE: PeriodTypeSchedule[] = ['MINUTE', 'HOUR', 'DAY'];

interface RewardMapEditorProps {
  value: RewardMap[];
  onChange: (maps: RewardMap[]) => void;
  disabled?: boolean;
}

function emptySchedule(): PoolRewardSchedule {
  return {
    periodType: 'MINUTE',
    quantity: 0,
    startAt: '',
    endAt: '',
    state: 'ACTIVE',
  };
}

function emptyRewardMap(): RewardMap {
  return {
    rewardId: 0,
    weight: 1,
    periodType: 'ALL_THE_TIME',
    periodNumber: 0,
    periodValue: 0,
    isUnlimited: false,
    isActivate: true,
    poolRewardSchedules: [],
  };
}

export function RewardMapEditor({
  value,
  onChange,
  disabled = false,
}: RewardMapEditorProps) {
  const { t } = useTranslations();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    new Set(),
  );

  // Get form context to access field state and errors
  const formContext = useFormContext();
  const formState = formContext?.formState;

  // Get errors for rewardMaps field
  const rewardMapsErrors = formState?.errors?.rewardMaps;

  // Helper to get error message for a specific field
  const getFieldError = (
    mapIndex: number,
    fieldName: string,
  ): string | null => {
    if (!rewardMapsErrors) return null;

    // Check if rewardMapsErrors is an array (zod array validation)
    if (Array.isArray(rewardMapsErrors)) {
      const mapError = rewardMapsErrors[mapIndex];
      if (mapError && typeof mapError === 'object') {
        const fieldError = (mapError as any)[fieldName];
        if (
          fieldError &&
          typeof fieldError === 'object' &&
          'message' in fieldError
        ) {
          return fieldError.message as string;
        }
      }
    }

    return null;
  };

  // Helper to check if field has error
  const hasFieldError = (mapIndex: number, fieldName: string): boolean => {
    const error = getFieldError(mapIndex, fieldName);
    return error !== null && error !== undefined;
  };

  // Helper to get schedule error message
  const getScheduleFieldError = (
    mapIndex: number,
    schedIndex: number,
    fieldName: string,
  ): string | null => {
    if (!rewardMapsErrors) return null;

    if (Array.isArray(rewardMapsErrors)) {
      const mapError = rewardMapsErrors[mapIndex];
      if (mapError && typeof mapError === 'object') {
        const schedulesError = (mapError as any).poolRewardSchedules;
        if (schedulesError && Array.isArray(schedulesError)) {
          const schedError = schedulesError[schedIndex];
          if (schedError && typeof schedError === 'object') {
            const fieldError = (schedError as any)[fieldName];
            if (
              fieldError &&
              typeof fieldError === 'object' &&
              'message' in fieldError
            ) {
              return fieldError.message as string;
            }
          }
        }
      }
    }

    return null;
  };

  // Helper to check if schedule field has error
  const hasScheduleFieldError = (
    mapIndex: number,
    schedIndex: number,
    fieldName: string,
  ): boolean => {
    const error = getScheduleFieldError(mapIndex, schedIndex, fieldName);
    return error !== null && error !== undefined;
  };

  const updateMap = (index: number, partial: Partial<RewardMap>) => {
    const updated = [...value];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const removeMap = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    // Remove from expanded set if it was expanded
    const newExpanded = new Set(expandedIndexes);
    newExpanded.delete(index);
    // Adjust indexes for items after the removed one
    const adjustedExpanded = new Set<number>();
    newExpanded.forEach((idx) => {
      if (idx > index) {
        adjustedExpanded.add(idx - 1);
      } else {
        adjustedExpanded.add(idx);
      }
    });
    setExpandedIndexes(adjustedExpanded);
  };

  const addSchedule = (mapIndex: number) => {
    const updated = [...value];
    updated[mapIndex] = {
      ...updated[mapIndex],
      poolRewardSchedules: [
        ...updated[mapIndex].poolRewardSchedules,
        emptySchedule(),
      ],
    };
    onChange(updated);
  };

  const updateSchedule = (
    mapIndex: number,
    schedIndex: number,
    partial: Partial<PoolRewardSchedule>,
  ) => {
    const updated = [...value];
    const schedules = [...updated[mapIndex].poolRewardSchedules];
    schedules[schedIndex] = { ...schedules[schedIndex], ...partial };
    updated[mapIndex] = {
      ...updated[mapIndex],
      poolRewardSchedules: schedules,
    };
    onChange(updated);
  };

  const removeSchedule = (mapIndex: number, schedIndex: number) => {
    const updated = [...value];
    updated[mapIndex] = {
      ...updated[mapIndex],
      poolRewardSchedules: updated[mapIndex].poolRewardSchedules.filter(
        (_, i) => i !== schedIndex,
      ),
    };
    onChange(updated);
  };

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedIndexes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIndexes(newExpanded);
  };

  const existingRewardIds = value.map((m) => m.rewardId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {t('GAME_POOLS.REWARD_MAP_EDITOR.TITLE')}
        </Label>
      </div>

      {value.length === 0 && (
        <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
          {t('GAME_POOLS.REWARD_MAP_EDITOR.NO_REWARDS')}
        </div>
      )}

      {value.map((map, mapIndex) => (
        <div key={mapIndex} className="border rounded-md overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
            <button
              type="button"
              className="flex-1 flex items-center gap-2 text-left"
              onClick={() => toggleExpand(mapIndex)}
            >
              {expandedIndexes.has(mapIndex) ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
              <span className="text-sm font-medium">
                {map.rewardName || `Reward ID: ${map.rewardId}`}
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Weight: {map.weight}
              </Badge>
              <Badge
                variant={map.isActivate ? 'success' : 'secondary'}
                className="text-xs"
              >
                {map.isActivate ? t('COMMON.ACTIVE') : t('COMMON.INACTIVE')}
              </Badge>
            </button>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMap(mapIndex)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Expanded content */}
          {expandedIndexes.has(mapIndex) && (
            <div className="p-3 space-y-4 border-t">
              <div className="grid grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.PERIOD_TYPE')} *
                  </Label>
                  <Select
                    value={map.periodType}
                    onValueChange={(v) =>
                      updateMap(mapIndex, { periodType: v as PeriodType })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger
                      clearable={false}
                      aria-invalid={hasFieldError(mapIndex, 'periodType')}
                      className={
                        hasFieldError(mapIndex, 'periodType')
                          ? 'border-destructive'
                          : ''
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_TYPES.map((pt) => (
                        <SelectItem key={pt} value={pt}>
                          {pt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getFieldError(mapIndex, 'periodType') && (
                    <p className="text-xs text-destructive">
                      {t(getFieldError(mapIndex, 'periodType') || '')}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.PERIOD_VALUE')}
                  </Label>
                  <Input
                    value={map.periodValue}
                    onChange={(e) =>
                      updateMap(mapIndex, {
                        periodValue: parseInt(e.target.value),
                      })
                    }
                    disabled={disabled}
                    placeholder={t(
                      'GAME_POOLS.REWARD_MAP_EDITOR.PERIOD_VALUE_PLACEHOLDER',
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.LIMIT')}
                  </Label>
                  <Input
                    value={map.periodNumber}
                    onChange={(e) =>
                      updateMap(mapIndex, {
                        periodNumber: parseInt(e.target.value),
                      })
                    }
                    disabled={disabled}
                    placeholder={t(
                      'GAME_POOLS.REWARD_MAP_EDITOR.LIMIT_PLACEHOLDER',
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.WEIGHT')} *
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={map.weight}
                    onChange={(e) =>
                      updateMap(mapIndex, { weight: Number(e.target.value) })
                    }
                    disabled={disabled}
                    aria-invalid={hasFieldError(mapIndex, 'weight')}
                    className={
                      hasFieldError(mapIndex, 'weight')
                        ? 'border-destructive'
                        : ''
                    }
                  />
                  {getFieldError(mapIndex, 'weight') && (
                    <p className="text-xs text-destructive">
                      {t(getFieldError(mapIndex, 'weight') || '')}
                    </p>
                  )}
                </div>
                <div className="h-full flex flex-row items-center justify-center gap-2">
                  <Switch
                    checked={map.isUnlimited}
                    onCheckedChange={(v) =>
                      updateMap(mapIndex, { isUnlimited: v })
                    }
                    disabled={disabled}
                  />
                  <Label className="text-xs">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.UNLIMITED')}
                  </Label>
                </div>
                <div className="h-full flex flex-row items-center justify-center gap-2">
                  <Switch
                    checked={map.isActivate}
                    onCheckedChange={(v) =>
                      updateMap(mapIndex, { isActivate: v })
                    }
                    disabled={disabled}
                  />
                  <Label className="text-xs">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.ACTIVATE')}
                  </Label>
                </div>
              </div>

              {/* Schedules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.SCHEDULES')}
                  </Label>
                </div>

                {map.poolRewardSchedules.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2 border rounded">
                    {t('GAME_POOLS.REWARD_MAP_EDITOR.NO_SCHEDULES')}
                  </div>
                )}

                {map.poolRewardSchedules.map((sched, schedIndex) => (
                  <div
                    key={schedIndex}
                    className="border rounded p-2 space-y-2 bg-muted/20"
                  >
                    {!disabled && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSchedule(mapIndex, schedIndex)}
                          className="h-7"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('GAME_POOLS.REWARD_MAP_EDITOR.PERIOD_TYPE')}
                        </Label>
                        <Select
                          value={sched.periodType}
                          onValueChange={(v) =>
                            updateSchedule(mapIndex, schedIndex, {
                              periodType: v as PeriodTypeSchedule,
                            })
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger
                            className="h-8 text-xs"
                            clearable={false}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIOD_TYPES_SCHEDULE.map((pt) => (
                              <SelectItem key={pt} value={pt}>
                                {pt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('GAME_POOLS.REWARD_MAP_EDITOR.QUANTITY')}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={sched.quantity}
                          onChange={(e) =>
                            updateSchedule(mapIndex, schedIndex, {
                              quantity: Number(e.target.value),
                            })
                          }
                          disabled={disabled}
                          className="h-8 text-xs"
                          aria-invalid={hasScheduleFieldError(
                            mapIndex,
                            schedIndex,
                            'quantity',
                          )}
                        />
                        {getScheduleFieldError(
                          mapIndex,
                          schedIndex,
                          'quantity',
                        ) && (
                          <p className="text-xs text-destructive">
                            {t(
                              getScheduleFieldError(
                                mapIndex,
                                schedIndex,
                                'quantity',
                              ) || '',
                            )}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('GAME_POOLS.REWARD_MAP_EDITOR.START_AT')}
                        </Label>
                        <DatePicker
                          value={
                            sched.startAt ? new Date(sched.startAt) : undefined
                          }
                          onChange={(date) =>
                            updateSchedule(mapIndex, schedIndex, {
                              startAt: date
                                ? date
                                    .toISOString()
                                    .slice(0, 19)
                                    .replace('T', ' ')
                                : '',
                            })
                          }
                          placeholder={t(
                            'GAME_POOLS.REWARD_MAP_EDITOR.START_AT_PLACEHOLDER',
                          )}
                          disabled={disabled}
                          showClearButton={!disabled}
                          dateFormat="dd/MM/yyyy"
                          showTime={true}
                        />
                        {getScheduleFieldError(
                          mapIndex,
                          schedIndex,
                          'startAt',
                        ) && (
                          <p className="text-xs text-destructive">
                            {t(
                              getScheduleFieldError(
                                mapIndex,
                                schedIndex,
                                'startAt',
                              ) || '',
                            )}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t('GAME_POOLS.REWARD_MAP_EDITOR.END_AT')}
                        </Label>
                        <DatePicker
                          value={
                            sched.endAt ? new Date(sched.endAt) : undefined
                          }
                          onChange={(date) =>
                            updateSchedule(mapIndex, schedIndex, {
                              endAt: date
                                ? date
                                    .toISOString()
                                    .slice(0, 19)
                                    .replace('T', ' ')
                                : '',
                            })
                          }
                          placeholder={t(
                            'GAME_POOLS.REWARD_MAP_EDITOR.END_AT_PLACEHOLDER',
                          )}
                          disabled={disabled}
                          min={
                            sched.startAt ? new Date(sched.startAt) : undefined
                          }
                          showClearButton={!disabled}
                          dateFormat="dd/MM/yyyy"
                          showTime={true}
                        />
                        {getScheduleFieldError(
                          mapIndex,
                          schedIndex,
                          'endAt',
                        ) && (
                          <p className="text-xs text-destructive">
                            {t(
                              getScheduleFieldError(
                                mapIndex,
                                schedIndex,
                                'endAt',
                              ) || '',
                            )}
                          </p>
                        )}
                      </div>
                      <div className="h-full flex flex-row items-center justify-center gap-2">
                        <Switch
                          checked={sched.state === 'ACTIVE'}
                          onCheckedChange={(v) =>
                            updateSchedule(mapIndex, schedIndex, {
                              state: v ? 'ACTIVE' : 'INACTIVE',
                            })
                          }
                          disabled={disabled}
                        />
                        <Label className="text-xs">{t('COMMON.ACTIVE')}</Label>
                      </div>
                    </div>
                  </div>
                ))}
                {!disabled && (
                  <div className="flex justify-end p-4 pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSchedule(mapIndex)}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('GAME_POOLS.REWARD_MAP_EDITOR.ADD_SCHEDULE')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {!disabled && (
        <div className="flex justify-end p-4 pt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectorOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('GAME_POOLS.REWARD_MAP_EDITOR.ADD_REWARD')}
          </Button>
        </div>
      )}

      <RewardSelectorDialog
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        excludeIds={existingRewardIds}
        onSelect={(rewards) => {
          const newMaps: RewardMap[] = rewards.map((reward) => ({
            ...emptyRewardMap(),
            rewardId: Number(reward.id),
            rewardName: reward.rewardName,
          }));
          const startIndex = value.length;
          onChange([...value, ...newMaps]);
          // Auto-expand all newly added rewards
          setExpandedIndexes((prev) => {
            const next = new Set(prev);
            newMaps.forEach((_, i) => next.add(startIndex + i));
            return next;
          });
        }}
        onConfirm={() => {
          setSelectorOpen(false);
        }}
      />
    </div>
  );
}
