import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : fallback;
}

const jwtExpiresIn = optional('JWT_EXPIRES_IN', '7d');

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '4000')),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: jwtExpiresIn,
  },
  bcrypt: {
    rounds: Number(optional('BCRYPT_ROUNDS', '12')),
  },
} as const;
