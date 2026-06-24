import { useMutation } from '@tanstack/react-query';
import { authApi, ChangePasswordRequest } from '@/app/auth/api/authApi';
import { toast } from 'sonner';
import { useTranslations } from '@/shared/hooks';

export function useChangePassword() {
  const { t } = useTranslations();

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success(t('AUTH.CHANGE_PASSWORD.SUCCESS'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('AUTH.CHANGE_PASSWORD.ERROR.FAILED'));
    },
  });
}
