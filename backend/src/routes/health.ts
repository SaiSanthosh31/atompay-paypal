import { Router } from 'express';
import {
  env,
  isGeminiConfigured,
  isPayPalConfigured,
} from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'AtomPay 2PC Orchestrator',
    paypalConfigured: isPayPalConfigured(),
    paypalMode: env.paypalMode,
    paypalClientId: isPayPalConfigured() ? env.paypalClientId : null,
    geminiConfigured: isGeminiConfigured(),
    geminiModel: env.geminiModel,
    timestamp: new Date().toISOString(),
  });
});

