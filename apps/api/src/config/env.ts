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
  google: {
    clientId: optional('GOOGLE_CLIENT_ID', ''),
  },
  razorpay: {
    keyId: optional('RAZORPAY_KEY_ID', ''),
    keySecret: optional('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: optional('RAZORPAY_WEBHOOK_SECRET', ''),
  },
  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: optional('CLOUDINARY_API_KEY', ''),
    apiSecret: optional('CLOUDINARY_API_SECRET', ''),
  },
} as const;
