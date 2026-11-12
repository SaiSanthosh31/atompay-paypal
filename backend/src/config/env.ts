import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });
dotenv.config(); // Fallback to cwd .env if present

export const env = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  paypalClientId: (process.env.PAYPAL_CLIENT_ID || '').trim(),
  paypalClientSecret: (process.env.PAYPAL_CLIENT_SECRET || '').trim(),
  paypalMode: (process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase(),
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: (process.env.GEMINI_MODEL || 'gemini-flash-latest').trim(),
};

export function isPayPalConfigured(): boolean {
  return Boolean(
    env.paypalClientId &&
      env.paypalClientSecret &&
      !env.paypalClientId.startsWith('your_') &&
      !env.paypalClientSecret.startsWith('your_')
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(env.geminiApiKey && !env.geminiApiKey.startsWith('your_'));
}

export function getPayPalBaseUrl(): string {
  return env.paypalMode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}
