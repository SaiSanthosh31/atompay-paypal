import { GoogleGenAI } from '@google/genai';
import { env, isGeminiConfigured } from '../config/env.js';
import type {
  DependencyEdge,
  LegCriticality,
  SubstituteOption,
  VendorLeg,
} from '../types/atompay.js';

export interface DependencyAnalysisResult {
  aiEngine: 'gemini' | 'heuristic_fallback';
  aiSummary: string;
  edges: DependencyEdge[];
  legOverrides: Array<{
    legId: string;
    criticality: LegCriticality;
    dependsOn: string[];
    dependencyReason: string;
    maxTolerancePct: number;
  }>;
}

export interface RecoveryDecision {
  aiEngine: 'gemini' | 'heuristic_fallback';
  action: 'SUBSTITUTE' | 'ABORT_AND_VOID';
  chosenSubstitute?: SubstituteOption;
  reasoning: string;
}

export interface GeneratedCartItem {
  title: string;
  sellerName: string;
  category: string;
  unitPrice: number;
  criticality: LegCriticality;
}

export async function generateSmartCartFromGoal(
  goalPrompt: string
): Promise<{ items: GeneratedCartItem[]; aiEngine: 'gemini' | 'heuristic_fallback' }> {
  const client = getClient();
  if (!client) {
    return {
      aiEngine: 'heuristic_fallback',
      items: [
        {
          title: 'Shure MV7+ USB/XLR Podcast Mic',
          sellerName: 'AudioForge Store',
          category: 'Audio',
          unitPrice: 145,
          criticality: 'CRITICAL',
        },
        {
          title: 'Elgato Wave Mic Arm LP',
          sellerName: 'DeskCraft Supply',
          category: 'Rigging',
          unitPrice: 65,
          criticality: 'CRITICAL',
        },
        {
          title: 'Acoustic Foam Desk Pop Shield',
          sellerName: 'StudioQuiet Co',
          category: 'Accessory',
          unitPrice: 24,
          criticality: 'OPTIONAL',
        },
      ],
    };
  }

  try {
    const prompt = `Build a realistic multi-seller online shopping bundle for this buyer goal: "${goalPrompt}".
Return 3 to 4 complementary products from DIFFERENT independent sellers (e.g. hardware, creator gear, software/cloud services, or event kit) with realistic prices under $400 total.
Mark items that are useless without each other as "CRITICAL" and nice-to-have accessories as "OPTIONAL".

Respond ONLY with valid JSON:
{
  "items": [
    {
      "title": "Specific product name",
      "sellerName": "Independent store name",
      "category": "Short category",
      "unitPrice": 89.00,
      "criticality": "CRITICAL"
    }
  ]
}`;

    const rawText = await generateWithTimeout(client, prompt, 0.3, 8_000);
    const cleaned = rawText.replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(cleaned) as { items?: GeneratedCartItem[] };
    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length < 2) {
      throw new Error('Invalid generated cart');
    }

    const sanitized: GeneratedCartItem[] = parsed.items.slice(0, 5).map((it) => ({
      title: String(it.title || 'Bundle Item').slice(0, 100),
      sellerName: String(it.sellerName || 'Partner Store').slice(0, 60),
      category: String(it.category || 'General').slice(0, 40),
      unitPrice: Math.max(5, Math.min(999, Number(it.unitPrice) || 49)),
      criticality: it.criticality === 'OPTIONAL' ? 'OPTIONAL' : 'CRITICAL',
    }));

    return { items: sanitized, aiEngine: 'gemini' };
  } catch {
    return {
      aiEngine: 'heuristic_fallback',
      items: [
        {
          title: 'Primary Hardware Unit',
          sellerName: 'ApexDirect Store',
          category: 'Core',
          unitPrice: 140,
          criticality: 'CRITICAL',
        },
        {
          title: 'Compatible Companion Module',
          sellerName: 'LinkGear Depot',
          category: 'Module',
          unitPrice: 85,
          criticality: 'CRITICAL',
        },
        {
          title: 'Protective Carry Case',
          sellerName: 'PackStudio',
          category: 'Accessory',
          unitPrice: 25,
          criticality: 'OPTIONAL',
        },
      ],
    };
  }
}

function getClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) return null;
  return new GoogleGenAI({ apiKey: env.geminiApiKey });
}

async function generateWithTimeout(
  client: GoogleGenAI,
  contents: string,
  temperature: number,
  timeoutMs = 2_500
): Promise<string> {
  const model = env.geminiModel || 'gemini-flash-latest';
  const callPromise = client.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
      temperature,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini timeout (${model})`)), timeoutMs)
  );

  const response = await Promise.race([callPromise, timeoutPromise]);
  const text = response.text?.trim() || '';
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

function buildFallbackAnalysis(legs: VendorLeg[]): DependencyAnalysisResult {
  const edges: DependencyEdge[] = [];
  const legOverrides = legs.map((leg) => {
    for (const depId of leg.dependsOn) {
      edges.push({
        from: depId,
        to: leg.id,
        reason: leg.dependencyReason,
        strict: leg.criticality === 'CRITICAL',
      });
    }
    return {
      legId: leg.id,
      criticality: leg.criticality,
      dependsOn: leg.dependsOn,
      dependencyReason: leg.dependencyReason,
      maxTolerancePct: leg.maxTolerancePct,
    };
  });

  const criticalCount = legs.filter((l) => l.criticality === 'CRITICAL').length;
  const optionalCount = legs.length - criticalCount;

  return {
    aiEngine: 'heuristic_fallback',
    aiSummary: `Compiled ${criticalCount} CRITICAL and ${optionalCount} OPTIONAL dependencies across ${legs.length} independent sellers.`,
    edges,
    legOverrides,
  };
}

export async function analyzeBundleDependencies(
  goalPrompt: string,
  legs: VendorLeg[]
): Promise<DependencyAnalysisResult> {
  const client = getClient();
  if (!client) {
    return buildFallbackAnalysis(legs);
  }

  try {
    const prompt = `You are AtomPay's Distributed Commerce Dependency Compiler.
Analyze this multi-seller online cart and determine which items are strictly interdependent (CRITICAL: if one fails and has no compatible substitute within budget, the entire PayPal authorization must be voided) vs OPTIONAL (can be dropped cleanly via partial capture without voiding the rest).

Buyer Goal: "${goalPrompt}"
Cart Items JSON:
${JSON.stringify(
  legs.map((l) => ({
    id: l.id,
    title: l.title,
    sellerName: l.sellerName,
    category: l.category,
    unitPrice: l.unitPrice,
    existingDependsOn: l.dependsOn,
  })),
  null,
  2
)}

Respond ONLY with valid JSON matching this exact shape (no markdown fences):
{
  "aiSummary": "1-2 concise sentences explaining why these items depend on each other and what triggers atomic rollback vs partial capture.",
  "legs": [
    {
      "legId": "exact leg id from input",
      "criticality": "CRITICAL" or "OPTIONAL",
      "dependsOn": ["array of other legIds this item depends on, or empty"],
      "dependencyReason": "short 5-10 word explanation",
      "maxTolerancePct": 10
    }
  ]
}`;

    const rawText = await generateWithTimeout(client, prompt, 0.2, 2_500);
    const cleaned = rawText.replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(cleaned) as {
      aiSummary?: string;
      legs?: Array<{
        legId: string;
        criticality: LegCriticality;
        dependsOn?: string[];
        dependencyReason?: string;
        maxTolerancePct?: number;
      }>;
    };

    if (!parsed.legs || !Array.isArray(parsed.legs) || parsed.legs.length === 0) {
      return buildFallbackAnalysis(legs);
    }

    const validIds = new Set(legs.map((l) => l.id));
    const edges: DependencyEdge[] = [];
    const legOverrides = legs.map((orig) => {
      const match = parsed.legs?.find((x) => x.legId === orig.id);
      const criticality: LegCriticality =
        match?.criticality === 'OPTIONAL' ? 'OPTIONAL' : 'CRITICAL';
      const dependsOn = (match?.dependsOn || orig.dependsOn).filter(
        (d) => validIds.has(d) && d !== orig.id
      );
      const reason =
        match?.dependencyReason || orig.dependencyReason || 'Required for bundle completeness';
      const maxTolerancePct =
        typeof match?.maxTolerancePct === 'number'
          ? Math.max(0, Math.min(30, match.maxTolerancePct))
          : orig.maxTolerancePct;

      for (const dep of dependsOn) {
        edges.push({
          from: dep,
          to: orig.id,
          reason,
          strict: criticality === 'CRITICAL',
        });
      }

      return {
        legId: orig.id,
        criticality,
        dependsOn,
        dependencyReason: reason,
        maxTolerancePct,
      };
    });

    return {
      aiEngine: 'gemini',
      aiSummary:
        parsed.aiSummary ||
        `Gemini analyzed ${legs.length} cross-vendor legs and mapped atomic rollback constraints.`,
      edges,
      legOverrides,
    };
  } catch {
    return buildFallbackAnalysis(legs);
  }
}

export async function evaluateSubstituteRecovery(params: {
  failedLeg: VendorLeg;
  remainingBudgetHeadroom: number;
  goalPrompt: string;
}): Promise<RecoveryDecision> {
  const { failedLeg, remainingBudgetHeadroom, goalPrompt } = params;
  const maxAllowedPrice = failedLeg.unitPrice + remainingBudgetHeadroom;
  const eligible = failedLeg.substitutes.filter(
    (sub) => sub.price <= maxAllowedPrice
  );

  if (eligible.length === 0) {
    return {
      aiEngine: isGeminiConfigured() ? 'gemini' : 'heuristic_fallback',
      action: 'ABORT_AND_VOID',
      reasoning: `No compatible substitute for "${failedLeg.title}" fits within the authorized $${maxAllowedPrice.toFixed(2)} PayPal cap. Triggering atomic VOID to prevent partial stranding.`,
    };
  }

  const client = getClient();
  if (!client) {
    const best = [...eligible].sort((a, b) => a.price - b.price)[0];
    return {
      aiEngine: 'heuristic_fallback',
      action: 'SUBSTITUTE',
      chosenSubstitute: best,
      reasoning: `Auto-substituted "${failedLeg.title}" with compatible "${best.title}" from ${best.sellerName} ($${best.price.toFixed(2)}) within authorized PayPal hold.`,
    };
  }

  try {
    const prompt = `A critical seller leg failed during PayPal Phase 2 verification. Decide whether one of the backup substitutes preserves full technical compatibility within the authorized PayPal budget ceiling.

Goal: "${goalPrompt}"
Failed Item: ${failedLeg.title} ($${failedLeg.unitPrice}) — Reason: ${failedLeg.failureReason}
Max Allowed Price for Substitute: $${maxAllowedPrice.toFixed(2)}
Candidates:
${JSON.stringify(eligible, null, 2)}

Reply ONLY with valid JSON:
{
  "action": "SUBSTITUTE" or "ABORT_AND_VOID",
  "chosenSku": "sku from candidates or null",
  "reasoning": "concise 1-sentence justification"
}`;

    const rawText = await generateWithTimeout(client, prompt, 0.1, 3_500);
    const cleaned = rawText.replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(cleaned) as {
      action?: 'SUBSTITUTE' | 'ABORT_AND_VOID';
      chosenSku?: string | null;
      reasoning?: string;
    };

    if (parsed.action === 'SUBSTITUTE' && parsed.chosenSku) {
      const matched = eligible.find((c) => c.sku === parsed.chosenSku) || eligible[0];
      return {
        aiEngine: 'gemini',
        action: 'SUBSTITUTE',
        chosenSubstitute: matched,
        reasoning:
          parsed.reasoning ||
          `Gemini verified ${matched.title} (${matched.sellerName}) preserves full bundle compatibility.`,
      };
    }

    return {
      aiEngine: 'gemini',
      action: 'ABORT_AND_VOID',
      reasoning:
        parsed.reasoning ||
        `Gemini rejected backup substitutes for ${failedLeg.title}; enforcing atomic rollback.`,
    };
  } catch {
    const best = [...eligible].sort((a, b) => a.price - b.price)[0];
    return {
      aiEngine: 'heuristic_fallback',
      action: 'SUBSTITUTE',
      chosenSubstitute: best,
      reasoning: `Selected compatible substitute ${best.title} ($${best.price.toFixed(2)}) within PayPal authorization cap.`,
    };
  }
}
