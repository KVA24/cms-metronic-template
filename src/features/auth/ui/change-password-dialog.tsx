import {useReducer} from 'react';
import {useChangePassword} from '@/features/auth/hooks/use-auth-mutations';
import {useTranslations} from '@/shared/hooks';
import {useChangePasswordDialog} from '@/shared/stores/ui-store';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/atoms/alert-dialog';
import {Button} from '@/shared/ui/atoms/button';
import {Input} from '@/shared/ui/atoms/input';
import {Label} from '@/shared/ui/atoms/label';
import {Eye, EyeOff} from 'lucide-react';

interface FormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  otpCode: string;
  showOldPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  errors: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
    otpCode: string;
  };
}

type FormAction =
  | { type: 'reset' }
  | { type: 'field'; field: keyof FormState; value: any }
  | { type: 'error'; field: keyof FormState['errors']; value: string }
  | { type: 'clearError'; field: keyof FormState['errors'] };

const initialFormState: FormState = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  otpCode: '',
  showOldPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  errors: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    otpCode: '',
  },
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'reset':
      return initialFormState;
    case 'field':
      return {...state, [action.field]: action.value};
    case 'error':
      return {
        ...state,
        errors: {...state.errors, [action.field]: action.value},
      };
    case 'clearError':
      return {
        ...state,
        errors: {...state.errors, [action.field]: ''},
      };
    default:
      return state;
  }
}

export function ChangePasswordDialog() {
  const {t} = useTranslations();
  const dialog = useChangePasswordDialog();
  const changePasswordMutation = useChangePassword();
  
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const {
    oldPassword,
    newPassword,
    confirmPassword,
    otpCode,
    showOldPassword,
    showNewPassword,
    showConfirmPassword,
    errors,
  } = formState;
  
  const validatePasswords = (): boolean => {
    const newErrors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      otpCode: '',
    };
    
    if (!oldPassword) {
      newErrors.oldPassword = t(
        'AUTH.CHANGE_PASSWORD.ERROR.OLD_PASSWORD_REQUIRED',
      );
    }
    
    if (!newPassword) {
      newErrors.newPassword = t(
        'AUTH.CHANGE_PASSWORD.ERROR.NEW_PASSWORD_REQUIRED',
      );
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t(
        'AUTH.CHANGE_PASSWORD.ERROR.PASSWORD_TOO_SHORT',
      );
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = t(
        'AUTH.CHANGE_PASSWORD.ERROR.CONFIRM_PASSWORD_REQUIRED',
      );
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t(
        'AUTH.CHANGE_PASSWORD.ERROR.PASSWORDS_DO_NOT_MATCH',
      );
    }
    
    dispatch({type: 'field', field: 'errors', value: newErrors});
    return !Object.values(newErrors).some((error) => error !== '');
  };
  
  const handleContinueClick = () => {
    if (validatePasswords()) {
      dialog.setStep('otp');
    }
  };
  
  const handleChangePassword = async () => {
    // Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      dispatch({type: 'error', field: 'otpCode', value: t('AUTH.CHANGE_PASSWORD.ERROR.OTP_REQUIRED')});
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
        otpCode,
      });
      dialog.close();
    } catch {
      // Error handled by mutation
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open && !changePasswordMutation.isPending) {
      dispatch({type: 'reset'});
      dialog.close();
    }
  };
  
  return (
    <AlertDialog open={dialog.isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dialog.step === 'input'
              ? t('AUTH.CHANGE_PASSWORD.TITLE')
              : t('AUTH.CHANGE_PASSWORD.OTP_TITLE')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dialog.step === 'input'
              ? t('AUTH.CHANGE_PASSWORD.DESCRIPTION')
              : t('COMMON.ENTER_OTP_CODE_TO_PROCEED')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {dialog.step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">
                {t('AUTH.CHANGE_PASSWORD.OLD_PASSWORD')} *
              </Label>
              <div className="relative">
                <Input
                  id="old-password"
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder={t(
                    'AUTH.CHANGE_PASSWORD.OLD_PASSWORD_PLACEHOLDER',
                  )}
                  value={oldPassword}
                  onChange={(e) => {
                    dispatch({type: 'field', field: 'oldPassword', value: e.target.value});
                    dispatch({type: 'clearError', field: 'oldPassword'});
                  }}
                  disabled={changePasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => dispatch({type: 'field', field: 'showOldPassword', value: !showOldPassword})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOldPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.oldPassword && (
                <span className="text-xs text-destructive">
                  {errors.oldPassword}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {t('AUTH.CHANGE_PASSWORD.NEW_PASSWORD')} *
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={t(
                    'AUTH.CHANGE_PASSWORD.NEW_PASSWORD_PLACEHOLDER',
                  )}
                  value={newPassword}
                  onChange={(e) => {
                    dispatch({type: 'field', field: 'newPassword', value: e.target.value});
                    dispatch({type: 'clearError', field: 'newPassword'});
                  }}
                  disabled={changePasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => dispatch({type: 'field', field: 'showNewPassword', value: !showNewPassword})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.newPassword && (
                <span className="text-xs text-destructive">
                  {errors.newPassword}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t('AUTH.CHANGE_PASSWORD.CONFIRM_PASSWORD')} *
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t(
                    'AUTH.CHANGE_PASSWORD.CONFIRM_PASSWORD_PLACEHOLDER',
                  )}
                  value={confirmPassword}
                  onChange={(e) => {
                    dispatch({type: 'field', field: 'confirmPassword', value: e.target.value});
                    dispatch({type: 'clearError', field: 'confirmPassword'});
                  }}
                  disabled={changePasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => dispatch({type: 'field', field: 'showConfirmPassword', value: !showConfirmPassword})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16}/>
                  ) : (
                    <Eye size={16}/>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-destructive">
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          </div>
        )}
        
        {dialog.step === 'otp' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp-input">{t('COMMON.OTP_CODE')} *</Label>
              <Input
                id="otp-input"
                type="text"
                placeholder={t('COMMON.ENTER_6_DIGIT_OTP')}
                value={otpCode}
                onChange={(e) => {
                  dispatch({type: 'field', field: 'otpCode', value: e.target.value});
                  dispatch({type: 'clearError', field: 'otpCode'});
                }}
                maxLength={6}
                disabled={changePasswordMutation.isPending}
              />
              {errors.otpCode && (
                <span className="text-xs text-destructive">
                  {errors.otpCode}
                </span>
              )}
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={changePasswordMutation.isPending}>
            {t('COMMON.CANCEL')}
          </AlertDialogCancel>
          {dialog.step === 'input' ? (
            <Button
              onClick={handleContinueClick}
              disabled={!oldPassword || !newPassword || !confirmPassword}
            >
              {t('COMMON.CONTINUE')}
            </Button>
          ) : (
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? t('AUTH.CHANGE_PASSWORD.CHANGING')
                : t('COMMON.CONFIRM')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
