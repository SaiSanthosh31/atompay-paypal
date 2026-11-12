import { Router } from 'express';
import { z } from 'zod';
import {
  getFaultMode,
  resetAllFaults,
  SCENARIO_PRESETS,
  setFaultMode,
} from '../services/vendors.js';

export const vendorsRouter = Router();

const faultSchema = z.object({
  faultMode: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'PRICE_SPIKE', 'TIMEOUT']),
});

vendorsRouter.get('/scenarios', (_req, res) => {
  const enriched = SCENARIO_PRESETS.map((preset) => ({
    ...preset,
    items: preset.items.map((item) => ({
      ...item,
      faultMode: getFaultMode(item.id),
    })),
  }));
  res.json({ scenarios: enriched });
});

vendorsRouter.post('/:legId/fault', (req, res) => {
  const parsed = faultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  setFaultMode(req.params.legId, parsed.data.faultMode);
  res.json({
    ok: true,
    legId: req.params.legId,
    faultMode: parsed.data.faultMode,
  });
});

vendorsRouter.post('/reset', (_req, res) => {
  resetAllFaults();
  res.json({ ok: true });
});

