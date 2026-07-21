import { z } from 'zod';

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(50, { message: 'Full name cannot exceed 50 characters.' }),
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  bio: z
    .string()
    .max(200, { message: 'Bio cannot exceed 200 characters.' })
    .optional()
    .default(''),
  notifications: z.boolean().default(false),
});

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;
