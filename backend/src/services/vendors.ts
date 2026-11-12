import type {
  ScenarioPreset,
  VendorFaultMode,
  VendorLeg,
} from '../types/atompay.js';

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'creator-camera-rig',
    name: 'Creator Camera Kit (3 Sellers)',
    tagline: 'Camera body, mount-matched lens & optional ND filter across 3 stores',
    goalPrompt:
      'Buy a complete mirrorless camera kit for 4K video: Sony E-mount body, compatible 35mm prime lens, and optional variable ND filter.',
    items: [
      {
        id: 'cam-body',
        sku: 'SONY-A7IV-BODY',
        title: 'Sony Alpha a7 IV Mirrorless Body',
        sellerId: 'seller_opticvault',
        sellerName: 'OpticVault Pro',
        category: 'Camera Body',
        unitPrice: 185.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: [],
        dependencyReason: 'Core E-mount chassis required by lens',
        maxTolerancePct: 8,
        substitutes: [
          {
            sku: 'SONY-A7C2-BODY',
            title: 'Sony a7C II Compact Full-Frame Body',
            sellerName: 'CineGear Direct',
            sellerId: 'seller_cinegear',
            price: 180.0,
            compatibilityNote: 'Same E-mount & 4K60 10-bit sensor pipeline',
          },
        ],
      },
      {
        id: 'cam-lens',
        sku: 'SIGMA-35-F14-E',
        title: 'Sigma 35mm f/1.4 DG DN Art (E-Mount)',
        sellerId: 'seller_lenshub',
        sellerName: 'LensHub Depot',
        category: 'Lens',
        unitPrice: 95.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['cam-body'],
        dependencyReason: 'Useless without compatible E-mount body',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'SONY-FE-35-F18',
            title: 'Sony FE 35mm f/1.8 Prime Lens',
            sellerName: 'PixelStreet Co',
            sellerId: 'seller_pixelstreet',
            price: 92.0,
            compatibilityNote: 'Native Sony E-mount, matches 35mm focal spec',
          },
        ],
      },
      {
        id: 'cam-filter',
        sku: 'POLARPRO-ND-67',
        title: 'Variable ND Filter 67mm (2-5 Stop)',
        sellerId: 'seller_rigcraft',
        sellerName: 'RigCraft Studio',
        category: 'Accessory',
        unitPrice: 28.0,
        quantity: 1,
        criticality: 'OPTIONAL',
        dependsOn: ['cam-lens'],
        dependencyReason: 'Enhances outdoor shoots; not blocking core rig',
        maxTolerancePct: 15,
        substitutes: [],
      },
    ],
  },
  {
    id: 'ai-workstation-build',
    name: 'AI PC Workstation (3 Sellers)',
    tagline: 'Socket-matched CPU, motherboard & liquid cooler across 3 hardware vendors',
    goalPrompt:
      'Assemble an AM5 AI workstation core: Ryzen CPU, AM5 motherboard, and optional RGB NVMe heatsink.',
    items: [
      {
        id: 'pc-cpu',
        sku: 'AMD-R9-9900X',
        title: 'AMD Ryzen 9 9900X (AM5)',
        sellerId: 'seller_siliconbay',
        sellerName: 'SiliconBay Parts',
        category: 'CPU',
        unitPrice: 140.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: [],
        dependencyReason: 'Requires matching AM5 motherboard',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'AMD-R7-9800X3D',
            title: 'AMD Ryzen 7 9800X3D (AM5)',
            sellerName: 'CoreForge Tech',
            sellerId: 'seller_coreforge',
            price: 138.0,
            compatibilityNote: 'Drop-in AM5 socket compatibility',
          },
        ],
      },
      {
        id: 'pc-mobo',
        sku: 'ASUS-X870-AM5',
        title: 'ASUS ProArt X870-Creator AM5 Board',
        sellerId: 'seller_boardworks',
        sellerName: 'BoardWorks Direct',
        category: 'Motherboard',
        unitPrice: 110.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['pc-cpu'],
        dependencyReason: 'Must match AM5 CPU socket or build fails',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'MSI-B650-PRO-AM5',
            title: 'MSI PRO B650-A WiFi (AM5)',
            sellerName: 'Vertex Components',
            sellerId: 'seller_vertex',
            price: 102.0,
            compatibilityNote: 'Verified AM5 DDR5 PCIe 5.0 motherboard',
          },
        ],
      },
      {
        id: 'pc-heatsink',
        sku: 'SABRENT-NVME-HS',
        title: 'Copper M.2 NVMe Thermal Shield',
        sellerId: 'seller_coollab',
        sellerName: 'CoolLab Mods',
        category: 'Cooling',
        unitPrice: 22.0,
        quantity: 1,
        criticality: 'OPTIONAL',
        dependsOn: ['pc-mobo'],
        dependencyReason: 'Optional thermal add-on; board works without it',
        maxTolerancePct: 15,
        substitutes: [],
      },
    ],
  },
  {
    id: 'saas-launch-stack',
    name: 'Startup Cloud & API Pack (3 Sellers)',
    tagline: 'Domain + GPU Inference Pack + Managed Postgres provisioned atomically',
    goalPrompt:
      'Provision startup launch infrastructure together: custom domain registration, GPU inference credits, and managed Postgres database.',
    items: [
      {
        id: 'saas-domain',
        sku: 'DOM-AI-2YR',
        title: 'Production .ai Domain + DNSSEC (2 Yr)',
        sellerId: 'seller_nameforge',
        sellerName: 'NameForge Registry',
        category: 'Domain',
        unitPrice: 70.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: [],
        dependencyReason: 'Required before binding SSL/API endpoints',
        maxTolerancePct: 5,
        substitutes: [],
      },
      {
        id: 'saas-gpu',
        sku: 'GPU-H100-PACK',
        title: 'Dedicated Inference GPU Credit Pack',
        sellerId: 'seller_tensorgrid',
        sellerName: 'TensorGrid Cloud',
        category: 'Compute',
        unitPrice: 120.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['saas-domain'],
        dependencyReason: 'Core AI runtime for launch stack',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'GPU-A100-CLUSTER',
            title: 'Managed A100 80GB Inference Pack',
            sellerName: 'NovaCompute Cloud',
            sellerId: 'seller_novacompute',
            price: 115.0,
            compatibilityNote: 'Compatible CUDA 12 container runtime within budget',
          },
        ],
      },
      {
        id: 'saas-analytics',
        sku: 'TELEMETRY-PRO-1MO',
        title: 'Real-Time Observability Add-on',
        sellerId: 'seller_pulseops',
        sellerName: 'PulseOps SaaS',
        category: 'Monitoring',
        unitPrice: 25.0,
        quantity: 1,
        criticality: 'OPTIONAL',
        dependsOn: ['saas-gpu'],
        dependencyReason: 'Nice-to-have dashboarding; core app still launches',
        maxTolerancePct: 20,
        substitutes: [],
      },
    ],
  },
];

// Mutable fault registry keyed by legId so live demo can toggle seller failures in real time
const faultRegistry = new Map<string, VendorFaultMode>();

export function getFaultMode(legId: string): VendorFaultMode {
  return faultRegistry.get(legId) || 'IN_STOCK';
}

export function setFaultMode(legId: string, mode: VendorFaultMode): void {
  faultRegistry.set(legId, mode);
}

export function resetAllFaults(): void {
  faultRegistry.clear();
}

export function instantiateScenarioLegs(scenario: ScenarioPreset): VendorLeg[] {
  return scenario.items.map((item) => ({
    id: item.id,
    sku: item.sku,
    title: item.title,
    sellerId: item.sellerId,
    sellerName: item.sellerName,
    category: item.category,
    unitPrice: item.unitPrice,
    currentLivePrice: item.unitPrice,
    quantity: item.quantity,
    criticality: item.criticality,
    dependsOn: [...item.dependsOn],
    dependencyReason: item.dependencyReason,
    maxTolerancePct: item.maxTolerancePct,
    faultMode: getFaultMode(item.id),
    status: 'PENDING',
    substitutes: item.substitutes.map((s) => ({ ...s })),
  }));
}

export interface VendorProbeResponse {
  legId: string;
  sellerName: string;
  available: boolean;
  liveUnitPrice: number;
  latencyMs: number;
  faultMode: VendorFaultMode;
  reason?: string;
}

export async function probeSellerLeg(
  leg: VendorLeg
): Promise<VendorProbeResponse> {
  const started = Date.now();
  const mode = getFaultMode(leg.id);

  // Brief realistic network probe delay
  await new Promise((r) => setTimeout(r, mode === 'TIMEOUT' ? 450 : 120));

  if (mode === 'OUT_OF_STOCK') {
    return {
      legId: leg.id,
      sellerName: leg.sellerName,
      available: false,
      liveUnitPrice: leg.unitPrice,
      latencyMs: Date.now() - started,
      faultMode: mode,
      reason: `${leg.sellerName} reported 0 units remaining during pre-commit inventory lock.`,
    };
  }

  if (mode === 'TIMEOUT') {
    return {
      legId: leg.id,
      sellerName: leg.sellerName,
      available: false,
      liveUnitPrice: leg.unitPrice,
      latencyMs: Date.now() - started,
      faultMode: mode,
      reason: `${leg.sellerName} fulfillment API timed out (>5000ms) during 2PC Prepare.`,
    };
  }

  if (mode === 'PRICE_SPIKE') {
    const spikedPrice = Number((leg.unitPrice * 1.28).toFixed(2));
    const pctDelta = ((spikedPrice - leg.unitPrice) / leg.unitPrice) * 100;
    const withinTolerance = pctDelta <= leg.maxTolerancePct;
    return {
      legId: leg.id,
      sellerName: leg.sellerName,
      available: withinTolerance,
      liveUnitPrice: spikedPrice,
      latencyMs: Date.now() - started,
      faultMode: mode,
      reason: withinTolerance
        ? undefined
        : `${leg.sellerName} spiked price from $${leg.unitPrice.toFixed(2)} to $${spikedPrice.toFixed(2)} (+${pctDelta.toFixed(0)}%, exceeds ${leg.maxTolerancePct}% cap).`,
    };
  }

  return {
    legId: leg.id,
    sellerName: leg.sellerName,
    available: true,
    liveUnitPrice: leg.unitPrice,
    latencyMs: Date.now() - started,
    faultMode: 'IN_STOCK',
  };
}

