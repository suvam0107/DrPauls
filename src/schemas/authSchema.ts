import { z } from 'zod';

export const AuthSchema = z.object({
  email: z
    .string()
    .min(1, 'Email / Username is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type AuthFormValues = z.infer<typeof AuthSchema>;
