import 'server-only';

type EnvKey = keyof NodeJS.ProcessEnv;

function requireEnv(key: EnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }

  return value;
}

function getNumberEnv(key: EnvKey, fallback: number): number {
  const rawValue = process.env[key];

  if (rawValue == null || rawValue === '') {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${String(key)} must be a valid number`);
  }

  return parsed;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: getNumberEnv('PORT', 4000),
  MONGO_URI: requireEnv('MONGO_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  CLOUDINARY_URL: requireEnv('CLOUDINARY_URL'),
} as const;

export type AppEnv = typeof env;
