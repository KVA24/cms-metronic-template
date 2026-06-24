'use client';

import { useState } from 'react';
import { useSharedValidationRules } from '@/features/shared';
import { useTranslations } from '@/shared/hooks/use-translations';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';
import { ScrollArea } from '@/shared/ui/atoms/scroll-area';
import { Eye, Plus, Trash2 } from 'lucide-react';

/**
 * ValidationRuleSelector for campaigns feature
 * Isolated copy to avoid cross-feature dependencies
 */

interface ValidationRule {
  validationRuleId: string;
  operator: 'AND' | 'OR';
  ruleForm: string;
  ruleName?: string;
}

interface ValidationRuleSelectorProps {
  value: ValidationRule[];
  onChange: (rules: ValidationRule[]) => void;
  disabled?: boolean;
}

export function ValidationRuleSelector({
  value,
  onChange,
  disabled = false,
}: ValidationRuleSelectorProps) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const { data: availableRulesData } = useSharedValidationRules();
  const availableRules = availableRulesData?.data || [];

  const handleAddRule = (ruleId: string, ruleName: string, ruleForm: any) => {
    const newRule: ValidationRule = {
      validationRuleId: ruleId,
      operator: value.length === 0 ? 'AND' : 'AND',
      ruleForm: ruleForm,
      ruleName: ruleName,
    };
    onChange([...value, newRule]);
    setOpen(false);
  };

  const handleRemoveRule = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChangeOperator = (index: number, operator: 'AND' | 'OR') => {
    const updated = [...value];
    updated[index].operator = operator;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.TITLE')}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.ADD_RULE')}
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.NO_RULES')}
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((rule, index) => (
            <div key={index} className="space-y-2">
              {index > 0 && (
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant={rule.operator === 'AND' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeOperator(index, 'AND')}
                    disabled={disabled}
                    className="w-16"
                  >
                    {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.AND')}
                  </Button>
                  <Button
                    type="button"
                    variant={rule.operator === 'OR' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeOperator(index, 'OR')}
                    disabled={disabled}
                    className="w-16"
                  >
                    {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.OR')}
                  </Button>
                </div>
              )}
              <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center">
                    {rule.ruleName}{' '}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className=" transition-opacity ml-2 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            {t(
                              'CAMPAIGNS.VALIDATION_RULE_SELECTOR.RULE_DETAILS',
                            )}
                          </h4>
                          <div className="text-sm text-muted-foreground break-words">
                            <p className="font-mono text-xs bg-muted p-2 rounded">
                              {rule.ruleForm}
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {rule.validationRuleId}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRule(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.SELECT_RULE')}
            </DialogTitle>
            <DialogDescription>
              {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.SELECT_RULE_DESC')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {(() => {
                const availableRulesFiltered = availableRules.filter(
                  (rule: any) =>
                    !value.some((v) => v.validationRuleId === rule.id),
                );

                if (availableRules.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t(
                        'CAMPAIGNS.VALIDATION_RULE_SELECTOR.NO_AVAILABLE_RULES',
                      )}
                    </div>
                  );
                }

                if (availableRulesFiltered.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t('CAMPAIGNS.VALIDATION_RULE_SELECTOR.ALL_RULES_ADDED')}
                    </div>
                  );
                }

                return availableRulesFiltered.map((rule: any) => (
                  <button
                    key={rule.id}
                    onClick={() => handleAddRule(rule.id, rule.name, rule.rule)}
                    className={cn(
                      'w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer flex items-center justify-between group',
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rule.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {rule.id}
                      </p>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className=" transition-opacity ml-2 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            {t(
                              'CAMPAIGNS.VALIDATION_RULE_SELECTOR.RULE_DETAILS',
                            )}
                          </h4>
                          <div className="text-sm text-muted-foreground break-words">
                            <p className="font-mono text-xs bg-muted p-2 rounded">
                              {rule.rule}
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </button>
                ));
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
