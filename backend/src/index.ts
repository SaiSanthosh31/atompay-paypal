import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isGeminiConfigured, isPayPalConfigured } from './config/env.js';
import { bundlesRouter } from './routes/bundles.js';
import { healthRouter } from './routes/health.js';
import { vendorsRouter } from './routes/vendors.js';

const app = express();

app.use(
  cors({
    origin: [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/bundles', bundlesRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
);

app.listen(env.port, () => {
  console.log(
    `[AtomPay API] listening on http://localhost:${env.port} | PayPal=${
      isPayPalConfigured() ? 'LIVE_SANDBOX' : 'SIMULATED_FALLBACK'
    } | Gemini=${isGeminiConfigured() ? env.geminiModel : 'HEURISTIC_FALLBACK'}`
  );
});
