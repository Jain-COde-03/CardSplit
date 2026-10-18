import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z
    .string({ message: 'MONGODB_URI is required.' })
    .trim()
    .min(1, 'MONGODB_URI is required. Example: mongodb://127.0.0.1:27017/cardbridge'),
  CLIENT_ORIGIN: z
    .string({ message: 'CLIENT_ORIGIN is required.' })
    .trim()
    .min(1, 'CLIENT_ORIGIN is required. Example: http://localhost:5173'),
  AUTH_SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(14),
  EMAIL_HOST: z.string().trim().default(''),
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SECURE: z.enum(['true', 'false']).default('false'),
  EMAIL_USER: z.string().trim().default(''),
  EMAIL_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().trim().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().trim().default(''),
  CLOUDINARY_API_KEY: z.string().trim().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
});

export function validateEnv(source = process.env) {
  const currentEnv = source.NODE_ENV ?? process.env.NODE_ENV ?? 'development';
  const isTest = currentEnv === 'test';
  const isDev = currentEnv === 'development';

  const normalized = {
    PORT: source.PORT ?? '5001',
    NODE_ENV: source.NODE_ENV ?? (isTest && source === process.env ? 'test' : 'development'),
    MONGODB_URI:
      source.MONGODB_URI ??
      (isTest && source === process.env
        ? 'mongodb://127.0.0.1:27017/cardbridge_test'
        : isDev && source === process.env
        ? 'mongodb://127.0.0.1:27017/cardbridge'
        : undefined),
    CLIENT_ORIGIN:
      source.CLIENT_ORIGIN ??
      ((isTest || isDev) && source === process.env ? 'http://localhost:5173' : 'http://localhost:5173'),
    AUTH_SESSION_DAYS: source.AUTH_SESSION_DAYS ?? '14',
    EMAIL_HOST: source.EMAIL_HOST ?? '',
    EMAIL_PORT: source.EMAIL_PORT ?? '587',
    EMAIL_SECURE: source.EMAIL_SECURE ?? 'false',
    EMAIL_USER: source.EMAIL_USER ?? '',
    EMAIL_PASSWORD: source.EMAIL_PASSWORD ?? '',
    EMAIL_FROM: source.EMAIL_FROM ?? '',
    CLOUDINARY_CLOUD_NAME: source.CLOUDINARY_CLOUD_NAME ?? '',
    CLOUDINARY_API_KEY: source.CLOUDINARY_API_KEY ?? '',
    CLOUDINARY_API_SECRET: source.CLOUDINARY_API_SECRET ?? '',
  };

  const parsed = envSchema.safeParse(normalized);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
      .join('; ');

    const error = new Error(
      `Invalid environment configuration: ${details}. Copy .env.example to .env and update the values before starting the server.`
    );
    error.name = 'ConfigError';
    throw error;
  }

  const emailValues = [
    parsed.data.EMAIL_HOST,
    parsed.data.EMAIL_USER,
    parsed.data.EMAIL_PASSWORD,
    parsed.data.EMAIL_FROM,
  ];
  if (emailValues.some(Boolean) && !emailValues.every(Boolean)) {
    throw new Error(
      'Invalid environment configuration: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM must all be set to enable email verification and password resets.'
    );
  }

  const cloudinaryValues = [
    parsed.data.CLOUDINARY_CLOUD_NAME,
    parsed.data.CLOUDINARY_API_KEY,
    parsed.data.CLOUDINARY_API_SECRET,
  ];
  if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
    throw new Error(
      'Invalid environment configuration: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be set to enable avatar uploads.'
    );
  }

  return parsed.data;
}

export const env = validateEnv(process.env);
export default env;
