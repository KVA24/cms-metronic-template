import { useEffect, useState } from 'react';
import { useAddCampaignBudget } from '@/features/campaigns/hooks/use-campaign-queries';
import { useTranslations } from '@/shared/hooks';
import { useAddBudgetDialog } from '@/shared/stores/ui-store';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';

export function AddBudgetDialog() {
  const { t } = useTranslations();
  const dialog = useAddBudgetDialog();
  const addBudgetMutation = useAddCampaignBudget();
  const [localAmount, setLocalAmount] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (dialog.isOpen) {
      setLocalAmount('');
      setOtpCode('');
      setOtpError('');
    }
  }, [dialog.isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setLocalAmount(value);
      dialog.setAmount(value ? parseFloat(value) : 0);
    }
  };

  const handleConfirmClick = () => {
    if (localAmount && parseFloat(localAmount) > 0) {
      dialog.setStep('otp');
    }
  };

  const handleAddBudget = async () => {
    if (!dialog.campaign || !localAmount) {
      return;
    }

    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setOtpError('');

    try {
      await addBudgetMutation.mutateAsync({
        params: {
          campaignId: dialog.campaign.id,
          amount: parseFloat(localAmount),
          otpCode: otpCode,
        },
      });
      dialog.close();
    } catch {
      // Error handled by mutation
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !addBudgetMutation.isPending) {
      dialog.close();
    }
  };

  return (
    <AlertDialog open={dialog.isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dialog.step === 'input'
              ? t('CAMPAIGNS.PAGE.ADD_BUDGET.TITLE')
              : t('CAMPAIGNS.PAGE.ADD_BUDGET.OTP_TITLE')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dialog.step === 'input'
              ? t('CAMPAIGNS.PAGE.ADD_BUDGET.DESCRIPTION')
              : t('COMMON.ENTER_OTP_CODE_TO_PROCEED')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {dialog.step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t('CAMPAIGNS.PAGE.ADD_BUDGET.AMOUNT_LABEL')}
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder={t('CAMPAIGNS.PAGE.ADD_BUDGET.AMOUNT_PLACEHOLDER')}
                value={localAmount}
                onChange={handleAmountChange}
                min="0"
                step="0.01"
                disabled={addBudgetMutation.isPending}
              />
            </div>
          </div>
        )}

        {dialog.step === 'otp' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-input">{t('COMMON.OTP_CODE')} *</Label>
              <Input
                id="otp-input"
                type="text"
                placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError('');
                }}
                maxLength={6}
                disabled={addBudgetMutation.isPending}
              />
              {otpError && (
                <span className="text-xs text-destructive">{otpError}</span>
              )}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={addBudgetMutation.isPending}>
            {t('COMMON.CANCEL')}
          </AlertDialogCancel>
          {dialog.step === 'input' ? (
            <Button
              onClick={handleConfirmClick}
              disabled={!localAmount || parseFloat(localAmount) <= 0}
            >
              {t('CAMPAIGNS.PAGE.ADD_BUDGET.CONFIRM')}
            </Button>
          ) : (
            <Button
              onClick={handleAddBudget}
              disabled={addBudgetMutation.isPending}
            >
              {addBudgetMutation.isPending
                ? t('CAMPAIGNS.PAGE.ADD_BUDGET.CONFIRMING')
                : t('COMMON.YES')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
