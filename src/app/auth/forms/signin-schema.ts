import { z } from 'zod';

interface SigninValidationMessages {
  usernameRequired?: string;
  passwordRequired?: string;
}

export const getSigninSchema = (messages: SigninValidationMessages = {}) => {
  return z.object({
    username: z.string().min(1, {
      message: messages.usernameRequired ?? 'Username is required.',
    }),
    password: z.string().min(1, {
      message: messages.passwordRequired ?? 'Password is required.',
    }),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
