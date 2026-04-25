import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long'),
  role: z.enum(['admin', 'courier', 'customer', 'operator']),
});
