import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(10).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(10)
    .default('dev-refresh-secret-change-me'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  FILE_SIGNING_SECRET: z.string().min(10).optional(),
  FILE_STORAGE_DRIVER: z.enum(['local', 's3', 'minio']).optional(),
  FILE_STORAGE_ROOT: z.string().min(1).optional(),
  FILE_STORAGE_BUCKET: z.string().min(1).optional(),
  FILE_STORAGE_REGION: z.string().min(1).optional(),
  FILE_STORAGE_ENDPOINT: z.string().url().optional(),
  FILE_STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  FILE_STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  BILLING_STRIPE_SECRET_KEY: z.string().min(1).optional(),
  BILLING_STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  BILLING_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  BILLING_RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  BILLING_RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  NOTIFICATIONS_EMAIL_WEBHOOK_URL: z.string().url().optional(),
  NOTIFICATIONS_SMS_WEBHOOK_URL: z.string().url().optional(),
  NOTIFICATIONS_WHATSAPP_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  return envSchema.parse(raw);
}
