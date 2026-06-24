import { useTranslations } from '@/shared/hooks';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, ChangePasswordRequest } from '@/app/auth/api/authApi';

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
