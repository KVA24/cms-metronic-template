import { memo, useCallback, useMemo } from 'react';
import { TierMetric } from '@/features/tier-metrics/api/tierMetricApi';
import { TierCondition } from '@/features/tiers/api/tierApi';
import { useTranslations } from '@/shared/hooks/use-translations';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/atoms/tooltip';
import { Info, Plus, Trash2 } from 'lucide-react';

interface TreeConditionsBuilderProps {
  value: TierCondition;
  onChange: (condition: TierCondition) => void;
  disabled?: boolean;
  activeMetrics: TierMetric[];
}

interface ConditionNodeProps {
  node: TierCondition;
  path: number[];
  activeMetrics: TierMetric[];
  disabled: boolean;
  onUpdate: (path: number[], updates: Partial<TierCondition>) => void;
  onRemove: (path: number[]) => void;
  onAddChild: (path: number[], nodeType: 'OPERATOR' | 'CONDITION') => void;
  usedMetricCodes: Set<string>;
  depth: number;
  canRemove?: boolean;
}

const ConditionNode = memo(function ConditionNode({
  node,
  path,
  activeMetrics,
  disabled,
  onUpdate,
  onRemove,
  onAddChild,
  usedMetricCodes,
  depth,
}: ConditionNodeProps) {
  const { t } = useTranslations();

  // ALL HOOKS MUST BE AT THE TOP - before any conditional logic
  const isRoot = path.length === 0;

  const handleUpdate = useCallback(
    (updates: Partial<TierCondition>) => {
      onUpdate(path, updates);
    },
    [onUpdate, path],
  );

  const handleRemove = useCallback(() => {
    onRemove(path);
  }, [onRemove, path]);

  const handleAddCondition = useCallback(() => {
    onAddChild(path, 'CONDITION');
  }, [onAddChild, path]);

  const handleAddGroup = useCallback(() => {
    onAddChild(path, 'OPERATOR');
  }, [onAddChild, path]);

  const availableMetrics = useMemo(
    () =>
      activeMetrics.filter(
        (m) =>
          m.metricCode === node.metricCode ||
          !usedMetricCodes.has(m.metricCode),
      ),
    [activeMetrics, node.metricCode, usedMetricCodes],
  );

  const hasMetricError = node.nodeType === 'CONDITION' && !node.metricCode;

  const handleMetricChange = useCallback(
    (value: string) => {
      handleUpdate({ metricCode: value });
    },
    [handleUpdate],
  );

  const handleOperatorChange = useCallback(
    (value: 'GTE' | 'LTE' | 'GT' | 'LT' | 'EQ' | 'NEQ') => {
      handleUpdate({ comparisonOperator: value });
    },
    [handleUpdate],
  );

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleUpdate({ thresholdValue: Number(e.target.value) });
    },
    [handleUpdate],
  );

  // NOW we can do conditional rendering
  if (node.nodeType === 'OPERATOR') {
    return (
      <Card
        className={cn(
          'border-l-2',
          depth === 0 ? 'border-l-primary' : 'border-l-muted',
        )}
      >
        <CardContent className="p-2 px-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold">
                  {t('TIERS.CONDITIONS.LOGICAL_OPERATOR')}
                </Label>
                {/*<Select*/}
                {/*  value={node.logicalOperator || 'AND'}*/}
                {/*  onValueChange={(value: 'AND' | 'OR' | 'NOT') =>*/}
                {/*    onUpdate(path, { logicalOperator: value })*/}
                {/*  }*/}
                {/*  disabled={true}*/}
                {/*>*/}
                {/*  <SelectTrigger clearable={false}>*/}
                {/*    <SelectValue />*/}
                {/*  </SelectTrigger>*/}
                {/*  <SelectContent>*/}
                {/*    <SelectItem value="AND">AND</SelectItem>*/}
                {/*    <SelectItem value="OR">OR</SelectItem>*/}
                {/*    <SelectItem value="NOT">NOT</SelectItem>*/}
                {/*  </SelectContent>*/}
                {/*</Select>*/}
                <Button variant={'outline'} onClick={(e) => e.preventDefault()}>
                  {node.logicalOperator || 'AND'}
                </Button>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCondition}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('TIERS.CONDITIONS.ADD_CONDITION')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddGroup}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('TIERS.CONDITIONS.ADD_GROUP')}
                </Button>
                {!isRoot && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 ml-2 border-l-2 border-muted pl-4">
              {node.children && node.children.length > 0 ? (
                node.children.map((child, index) => (
                  <ConditionNode
                    key={`${path.join('-')}-${index}`}
                    node={child}
                    path={[...path, index]}
                    activeMetrics={activeMetrics}
                    disabled={disabled}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onAddChild={onAddChild}
                    usedMetricCodes={usedMetricCodes}
                    depth={depth + 1}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t('TIERS.CONDITIONS.NO_CHILDREN')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // CONDITION node
  return (
    <Card
      className={cn(
        'border-l-2',
        hasMetricError ? 'border-l-destructive' : 'border-l-blue-500',
      )}
    >
      <CardContent className="p-2">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <Label className="text-xs">
              {t('TIERS.CONDITIONS.METRIC')}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={node.metricCode || ''}
              onValueChange={handleMetricChange}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn('w-full', hasMetricError && 'border-destructive')}
              >
                <SelectValue
                  placeholder={t('TIERS.CONDITIONS.METRIC_PLACEHOLDER')}
                />
              </SelectTrigger>
              <SelectContent>
                {availableMetrics.map((metric) => (
                  <SelectItem key={metric.id} value={metric.metricCode}>
                    {metric.metricName} ({metric.metricCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasMetricError && (
              <p className="text-xs text-destructive">
                {t('TIERS.CONDITIONS.METRIC_REQUIRED')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1 w-24">
            <Label className="text-xs">{t('TIERS.CONDITIONS.OPERATOR')}</Label>
            <Select
              value={node.comparisonOperator || 'GTE'}
              onValueChange={handleOperatorChange}
              disabled={disabled}
            >
              <SelectTrigger clearable={false}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GTE">&gt;=</SelectItem>
                <SelectItem value="LTE">&lt;=</SelectItem>
                <SelectItem value="GT">&gt;</SelectItem>
                <SelectItem value="LT">&lt;</SelectItem>
                <SelectItem value="EQ">=</SelectItem>
                <SelectItem value="NEQ">!=</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 w-32">
            <Label className="text-xs">
              {t('COMMON.VALUE')} <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={node.thresholdValue ?? 0}
              onChange={handleValueChange}
              disabled={disabled}
              placeholder="0"
            />
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function cloneCondition(node: TierCondition): TierCondition {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(node);
  }
  return JSON.parse(JSON.stringify(node));
}

export function TreeConditionsBuilder({
  value,
  onChange,
  disabled = false,
  activeMetrics,
}: TreeConditionsBuilderProps) {
  const { t } = useTranslations();

  const rootNode: TierCondition = value || {
    nodeType: 'OPERATOR',
    logicalOperator: 'OR',
    children: [
      { nodeType: 'CONDITION', comparisonOperator: 'GTE', thresholdValue: 0 },
    ],
  };

  const usedMetricCodes = useMemo(() => {
    const collectUsedMetricCodes = (node: TierCondition): Set<string> => {
      const codes = new Set<string>();
      if (node.nodeType === 'CONDITION' && node.metricCode) {
        codes.add(node.metricCode);
      }
      if (node.children) {
        node.children.forEach((child) => {
          collectUsedMetricCodes(child).forEach((code) => codes.add(code));
        });
      }
      return codes;
    };
    return collectUsedMetricCodes(rootNode);
  }, [rootNode]);

  // Generate formula string
  const generateFormula = useCallback(
    (node: TierCondition, depth: number = 0): string => {
      if (node.nodeType === 'CONDITION') {
        const metricName = node.metricCode || '??';
        const operator = node.comparisonOperator || 'GTE';
        const value = node.thresholdValue ?? 0;

        const operatorSymbol =
          {
            GTE: '≥',
            LTE: '≤',
            GT: '>',
            LT: '<',
            EQ: '=',
            NEQ: '≠',
          }[operator] || '≥';

        return `${metricName} ${operatorSymbol} ${value}`;
      }

      if (
        node.nodeType === 'OPERATOR' &&
        node.children &&
        node.children.length > 0
      ) {
        const childFormulas = node.children.map((child) =>
          generateFormula(child, depth + 1),
        );
        const operator = node.logicalOperator || 'AND';

        if (childFormulas.length === 1) {
          return childFormulas[0];
        }

        const joined = childFormulas.join(` ${operator} `);
        return depth > 0 ? `(${joined})` : joined;
      }

      return '';
    },
    [],
  );

  const formula = useMemo(
    () => generateFormula(rootNode),
    [rootNode, generateFormula],
  );

  const updateNode = useCallback(
    (path: number[], updates: Partial<TierCondition>) => {
      const newRoot = cloneCondition(rootNode);
      let current = newRoot;

      for (let i = 0; i < path.length - 1; i++) {
        if (current.children) {
          current = current.children[path[i]];
        }
      }

      if (path.length === 0) {
        Object.assign(newRoot, updates);
      } else {
        const lastIndex = path[path.length - 1];
        if (current.children) {
          current.children[lastIndex] = {
            ...current.children[lastIndex],
            ...updates,
          };
        }
      }

      console.log('🔄 Conditions Updated:', JSON.stringify(newRoot, null, 2));
      onChange(newRoot);
    },
    [rootNode, onChange],
  );

  const removeNode = useCallback(
    (path: number[]) => {
      if (path.length === 0) return;

      const newRoot = cloneCondition(rootNode);
      let current = newRoot;

      for (let i = 0; i < path.length - 1; i++) {
        if (current.children) {
          current = current.children[path[i]];
        }
      }

      const lastIndex = path[path.length - 1];
      if (current.children) {
        current.children.splice(lastIndex, 1);
      }

      console.log('🗑️ Node Removed:', JSON.stringify(newRoot, null, 2));
      onChange(newRoot);
    },
    [rootNode, onChange],
  );

  const addChild = useCallback(
    (path: number[], nodeType: 'OPERATOR' | 'CONDITION') => {
      const newRoot = cloneCondition(rootNode);
      let current = newRoot;

      for (let i = 0; i < path.length; i++) {
        if (current.children) {
          current = current.children[path[i]];
        }
      }

      if (!current.children) {
        current.children = [];
      }

      const newNode: TierCondition =
        nodeType === 'OPERATOR'
          ? {
              nodeType: 'OPERATOR',
              logicalOperator: 'AND',
              children: [
                {
                  nodeType: 'CONDITION',
                  comparisonOperator: 'GTE',
                  thresholdValue: 0,
                },
              ],
            }
          : {
              nodeType: 'CONDITION',
              comparisonOperator: 'GTE',
              thresholdValue: 0,
            };

      current.children.push(newNode);
      console.log(
        `➕ ${nodeType === 'OPERATOR' ? 'Group' : 'Condition'} Added:`,
        JSON.stringify(newRoot, null, 2),
      );
      onChange(newRoot);
    },
    [rootNode, onChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-base font-semibold">
          {t('TIERS.CONDITIONS.TITLE')}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">{t('TIERS.CONDITIONS.TREE_INFO')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ConditionNode
        node={rootNode}
        path={[]}
        activeMetrics={activeMetrics}
        disabled={disabled}
        onUpdate={updateNode}
        onRemove={removeNode}
        onAddChild={addChild}
        usedMetricCodes={usedMetricCodes}
        depth={0}
        canRemove={true}
      />

      {/* Formula Display */}
      {formula && (
        <Card className="bg-muted/50">
          <CardContent className="p-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t('TIERS.CONDITIONS.FORMULA_PREVIEW')}
              </Label>
              <div className="font-mono text-xs p-2 bg-background rounded-md border">
                {formula}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground italic">
        {t('TIERS.CONDITIONS.UPGRADE_NOTE')}
      </p>
    </div>
  );
}
