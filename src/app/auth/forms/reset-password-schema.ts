import { z } from 'zod';

// Schema for requesting a password reset email
export const getResetRequestSchema = () => {
  return z.object({
    email: z
      .string()
      .email({ message: 'Please enter a valid email address.' })
      .min(1, { message: 'Email is required.' }),
  });
};

export type ResetRequestSchemaType = z.infer<
  ReturnType<typeof getResetRequestSchema>
>;
