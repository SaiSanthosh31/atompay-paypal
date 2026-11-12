import { Router } from 'express';
import { z } from 'zod';
import {
  authorizeBundleHold,
  createAndAnalyzeBundle,
  createPayPalOrderForBundle,
  executeTwoPhaseCommit,
  getBundleById,
  getLedgerEntries,
  listBundles,
} from '../services/orchestrator.js';
import { generateSmartCartFromGoal } from '../services/gemini.js';

export const bundlesRouter = Router();

const analyzeSchema = z.object({
  scenarioId: z.string().optional(),
  customTitle: z.string().optional(),
  goalPrompt: z.string().optional(),
  autoSubstitute: z.boolean().optional(),
  customLegs: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1),
        sellerName: z.string().min(1),
        category: z.string().optional(),
        unitPrice: z.number().positive(),
        quantity: z.number().int().positive().optional(),
        criticality: z.enum(['CRITICAL', 'OPTIONAL']).optional(),
      })
    )
    .optional(),
});

bundlesRouter.get('/', (_req, res) => {
  res.json({ bundles: listBundles() });
});

bundlesRouter.get('/ledger', (_req, res) => {
  res.json({ entries: getLedgerEntries() });
});

bundlesRouter.get('/:id', (req, res) => {
  const bundle = getBundleById(req.params.id);
  if (!bundle) {
    res.status(404).json({ error: 'Bundle not found' });
    return;
  }
  res.json({ bundle });
});

bundlesRouter.post('/generate-cart', async (req, res, next) => {
  try {
    const goal =
      typeof req.body?.goal === 'string' ? req.body.goal.trim() : '';
    if (!goal) {
      res.status(400).json({ error: 'goal string is required' });
      return;
    }
    const result = await generateSmartCartFromGoal(goal);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

bundlesRouter.post('/analyze', async (req, res, next) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const bundle = await createAndAnalyzeBundle(parsed.data);
    res.status(201).json({ bundle });
  } catch (err) {
    next(err);
  }
});

bundlesRouter.post('/:id/paypal-order', async (req, res, next) => {
  try {
    const bundle = await createPayPalOrderForBundle(req.params.id);
    res.json({ bundle, orderId: bundle.paypalOrderId });
  } catch (err) {
    next(err);
  }
});

bundlesRouter.post('/:id/authorize', async (req, res, next) => {
  try {
    const orderId =
      typeof req.body?.orderId === 'string' ? req.body.orderId : undefined;
    const bundle = await authorizeBundleHold(req.params.id, orderId);
    res.json({ bundle });
  } catch (err) {
    next(err);
  }
});

bundlesRouter.post('/:id/execute-2pc', async (req, res, next) => {
  try {
    const autoSubstitute =
      typeof req.body?.autoSubstitute === 'boolean'
        ? req.body.autoSubstitute
        : undefined;
    const bundle = await executeTwoPhaseCommit(req.params.id, {
      autoSubstitute,
    });
    res.json({ bundle });
  } catch (err) {
    next(err);
  }
});

