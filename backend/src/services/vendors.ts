import type {
  ScenarioPreset,
  VendorFaultMode,
  VendorLeg,
} from '../types/atompay.js';

export type CatalogItemPreset = ScenarioPreset['items'][number] & {
  scenarioId: string;
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'creator-camera-rig',
    name: 'Creator Camera Kit',
    tagline: 'Camera body, mount-matched lens & optional ND filter across 3 stores',
    goalPrompt:
      'Buy a complete mirrorless camera kit for 4K video: Sony E-mount body, compatible 35mm prime lens, and optional variable ND filter.',
    items: [
      {
        id: 'cam-body',
        sku: 'SONY-A7IV-BODY',
        title: 'Sony Alpha a7 IV Mirrorless Body',
        sellerId: 'seller_sony_official',
        sellerName: 'Sony Official Store',
        category: 'Camera',
        unitPrice: 185.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: [],
        dependencyReason: 'Core E-mount chassis required by lens',
        maxTolerancePct: 8,
        substitutes: [
          {
            sku: 'SONY-A7IV-BODY',
            title: 'Sony Alpha a7 IV Mirrorless Body',
            sellerName: 'B&H Authorized Partner',
            sellerId: 'seller_bh_partner',
            price: 182.0,
            compatibilityNote: 'Exact same product fulfilled by authorized 3rd-party seller',
          },
        ],
      },
      {
        id: 'cam-lens',
        sku: 'SIGMA-35-F14-E',
        title: 'Sigma 35mm f/1.4 DG DN Art (E-Mount)',
        sellerId: 'seller_sigma_direct',
        sellerName: 'Sigma Direct',
        category: 'Camera',
        unitPrice: 95.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['cam-body'],
        dependencyReason: 'Useless without compatible E-mount body',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'SIGMA-35-F14-E',
            title: 'Sigma 35mm f/1.4 DG DN Art (E-Mount)',
            sellerName: 'Adorama Pro Partner',
            sellerId: 'seller_adorama',
            price: 94.0,
            compatibilityNote: 'Exact same lens from authorized 3rd-party seller',
          },
        ],
      },
      {
        id: 'cam-filter',
        sku: 'POLARPRO-ND-67',
        title: 'Variable ND Filter 67mm (2-5 Stop)',
        sellerId: 'seller_polarpro',
        sellerName: 'PolarPro Official',
        category: 'Camera',
        unitPrice: 28.0,
        quantity: 1,
        criticality: 'OPTIONAL',
        dependsOn: ['cam-lens'],
        dependencyReason: 'Optional outdoor filter; not blocking core rig',
        maxTolerancePct: 15,
        substitutes: [],
      },
    ],
  },
  {
    id: 'ai-workstation-build',
    name: 'AI PC Workstation',
    tagline: 'Ryzen CPU, RTX GPU, AM5 motherboard & AIO across independent sellers',
    goalPrompt:
      'Assemble an AM5 AI workstation: Ryzen CPU, RTX GPU, AM5 motherboard, and liquid cooler.',
    items: [
      {
        id: 'pc-cpu',
        sku: 'AMD-R9-9950X',
        title: 'AMD Ryzen 9 9950X (16-Core AM5)',
        sellerId: 'seller_amd_official',
        sellerName: 'AMD Official Store',
        category: 'CPU',
        unitPrice: 540.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: [],
        dependencyReason: 'Requires matching AM5 motherboard',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'AMD-R9-9950X',
            title: 'AMD Ryzen 9 9950X (16-Core AM5)',
            sellerName: 'MicroCenter Direct',
            sellerId: 'seller_microcenter',
            price: 535.0,
            compatibilityNote: 'Exact same Ryzen 9 9950X from authorized retailer',
          },
        ],
      },
      {
        id: 'pc-gpu',
        sku: 'NV-RTX-4080S',
        title: 'NVIDIA GeForce RTX 4080 Super 16GB',
        sellerId: 'seller_nvidia_official',
        sellerName: 'NVIDIA Official Store',
        category: 'GPU',
        unitPrice: 989.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['pc-mobo'],
        dependencyReason: 'Requires PCIe motherboard & 850W+ PSU',
        maxTolerancePct: 8,
        substitutes: [
          {
            sku: 'NV-RTX-4080S',
            title: 'NVIDIA GeForce RTX 4080 Super 16GB',
            sellerName: 'Newegg Authorized',
            sellerId: 'seller_newegg',
            price: 979.0,
            compatibilityNote: 'Exact same RTX 4080 Super from authorized 3rd-party seller',
          },
        ],
      },
      {
        id: 'pc-mobo',
        sku: 'ASUS-X870E-AM5',
        title: 'ASUS ProArt X870E-Creator AM5',
        sellerId: 'seller_asus_official',
        sellerName: 'ASUS Official Store',
        category: 'Motherboard',
        unitPrice: 399.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['pc-cpu'],
        dependencyReason: 'Must match AM5 CPU socket',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'ASUS-X870E-AM5',
            title: 'ASUS ProArt X870E-Creator AM5',
            sellerName: 'Amazon Tech Partner',
            sellerId: 'seller_amazon_tech',
            price: 395.0,
            compatibilityNote: 'Exact same motherboard from authorized 3rd-party seller',
          },
        ],
      },
      {
        id: 'pc-cooler',
        sku: 'NZXT-KRAKEN-360',
        title: 'NZXT Kraken 360mm AIO Liquid Cooler',
        sellerId: 'seller_nzxt_official',
        sellerName: 'NZXT Official Store',
        category: 'Cooling',
        unitPrice: 169.0,
        quantity: 1,
        criticality: 'OPTIONAL',
        dependsOn: ['pc-cpu'],
        dependencyReason: 'Optional liquid cooling upgrade',
        maxTolerancePct: 15,
        substitutes: [],
      },
    ],
  },
  {
    id: 'saas-launch-stack',
    name: 'Cloud & API Stack',
    tagline: 'Domain + GPU Inference Pack + Observability',
    goalPrompt:
      'Provision startup launch infrastructure together: custom domain, GPU inference credits, and observability.',
    items: [
      {
        id: 'saas-domain',
        sku: 'DOM-AI-2YR',
        title: 'Production .ai Domain + DNSSEC (2 Yr)',
        sellerId: 'seller_nameforge',
        sellerName: 'NameForge Registry',
        category: 'Cloud',
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
        title: 'Dedicated H100 GPU Credit Pack',
        sellerId: 'seller_tensorgrid',
        sellerName: 'TensorGrid Cloud',
        category: 'Cloud',
        unitPrice: 120.0,
        quantity: 1,
        criticality: 'CRITICAL',
        dependsOn: ['saas-domain'],
        dependencyReason: 'Core AI runtime for launch stack',
        maxTolerancePct: 10,
        substitutes: [
          {
            sku: 'GPU-H100-PACK',
            title: 'Dedicated H100 GPU Credit Pack',
            sellerName: 'NovaCompute Partner',
            sellerId: 'seller_novacompute',
            price: 118.0,
            compatibilityNote: 'Exact same H100 cluster allocation from partner region',
          },
        ],
      },
      {
        id: 'saas-analytics',
        sku: 'TELEMETRY-PRO-1MO',
        title: 'Real-Time Observability Add-on',
        sellerId: 'seller_pulseops',
        sellerName: 'PulseOps SaaS',
        category: 'Cloud',
        unitPrice: 25.0,
        quantity: 1,
        criticality: 'OPTIONAL',
        dependsOn: ['saas-gpu'],
        dependencyReason: 'Optional metrics dashboarding',
        maxTolerancePct: 20,
        substitutes: [],
      },
    ],
  },
];

export const EXTRA_PC_PARTS: CatalogItemPreset[] = [
  {
    id: 'cpu-r7-9800x3d',
    scenarioId: 'ai-workstation-build',
    sku: 'AMD-R7-9800X3D',
    title: 'AMD Ryzen 7 9800X3D (AM5)',
    sellerId: 'seller_amd_official',
    sellerName: 'AMD Official Store',
    category: 'CPU',
    unitPrice: 449.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires AM5 motherboard',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'AMD-R7-9800X3D',
        title: 'AMD Ryzen 7 9800X3D (AM5)',
        sellerName: 'MicroCenter Direct',
        sellerId: 'seller_microcenter',
        price: 445.0,
        compatibilityNote: 'Exact same CPU fulfilled by authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'cpu-r5-9600x',
    scenarioId: 'ai-workstation-build',
    sku: 'AMD-R5-9600X',
    title: 'AMD Ryzen 5 9600X (6-Core AM5)',
    sellerId: 'seller_amd_official',
    sellerName: 'AMD Official Store',
    category: 'CPU',
    unitPrice: 249.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires AM5 motherboard',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'AMD-R5-9600X',
        title: 'AMD Ryzen 5 9600X (6-Core AM5)',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 245.0,
        compatibilityNote: 'Exact same CPU from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'cpu-intel-285k',
    scenarioId: 'ai-workstation-build',
    sku: 'INT-U9-285K',
    title: 'Intel Core Ultra 9 285K (LGA1851)',
    sellerId: 'seller_intel_official',
    sellerName: 'Intel Official Store',
    category: 'CPU',
    unitPrice: 569.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires LGA1851 Z890 motherboard',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'INT-U9-285K',
        title: 'Intel Core Ultra 9 285K (LGA1851)',
        sellerName: 'BestBuy Tech Partner',
        sellerId: 'seller_bestbuy',
        price: 565.0,
        compatibilityNote: 'Exact same CPU from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'cpu-intel-14900k',
    scenarioId: 'ai-workstation-build',
    sku: 'INT-I9-14900K',
    title: 'Intel Core i9-14900K (LGA1700)',
    sellerId: 'seller_intel_official',
    sellerName: 'Intel Official Store',
    category: 'CPU',
    unitPrice: 439.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires LGA1700 motherboard',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'INT-I9-14900K',
        title: 'Intel Core i9-14900K (LGA1700)',
        sellerName: 'MicroCenter Direct',
        sellerId: 'seller_microcenter',
        price: 434.0,
        compatibilityNote: 'Exact same CPU from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'cpu-intel-14700k',
    scenarioId: 'ai-workstation-build',
    sku: 'INT-I7-14700K',
    title: 'Intel Core i7-14700K (LGA1700)',
    sellerId: 'seller_intel_official',
    sellerName: 'Intel Official Store',
    category: 'CPU',
    unitPrice: 349.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires LGA1700 motherboard',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'INT-I7-14700K',
        title: 'Intel Core i7-14700K (LGA1700)',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 345.0,
        compatibilityNote: 'Exact same CPU from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'gpu-rtx-4090',
    scenarioId: 'ai-workstation-build',
    sku: 'NV-RTX-4090',
    title: 'NVIDIA GeForce RTX 4090 24GB',
    sellerId: 'seller_nvidia_official',
    sellerName: 'NVIDIA Official Store',
    category: 'GPU',
    unitPrice: 1599.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires 850W+ ATX 3.0 PSU',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'NV-RTX-4090',
        title: 'NVIDIA GeForce RTX 4090 24GB',
        sellerName: 'BestBuy Tech Partner',
        sellerId: 'seller_bestbuy',
        price: 1589.0,
        compatibilityNote: 'Exact same RTX 4090 fulfilled by authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'gpu-rtx-4070tis',
    scenarioId: 'ai-workstation-build',
    sku: 'NV-RTX-4070TIS',
    title: 'NVIDIA GeForce RTX 4070 Ti Super 16GB',
    sellerId: 'seller_nvidia_official',
    sellerName: 'NVIDIA Official Store',
    category: 'GPU',
    unitPrice: 789.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Requires 750W+ PSU',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'NV-RTX-4070TIS',
        title: 'NVIDIA GeForce RTX 4070 Ti Super 16GB',
        sellerName: 'MicroCenter Direct',
        sellerId: 'seller_microcenter',
        price: 785.0,
        compatibilityNote: 'Exact same RTX 4070 Ti Super from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'gpu-rtx-4060ti',
    scenarioId: 'ai-workstation-build',
    sku: 'NV-RTX-4060TI-16',
    title: 'NVIDIA GeForce RTX 4060 Ti 16GB',
    sellerId: 'seller_nvidia_official',
    sellerName: 'NVIDIA Official Store',
    category: 'GPU',
    unitPrice: 429.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Midrange AI & 1440p PCIe GPU',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'NV-RTX-4060TI-16',
        title: 'NVIDIA GeForce RTX 4060 Ti 16GB',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 425.0,
        compatibilityNote: 'Exact same RTX 4060 Ti 16GB from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'gpu-rx-7900xtx',
    scenarioId: 'ai-workstation-build',
    sku: 'AMD-RX-7900XTX',
    title: 'AMD Radeon RX 7900 XTX 24GB',
    sellerId: 'seller_amd_official',
    sellerName: 'AMD Official Store',
    category: 'GPU',
    unitPrice: 899.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: '24GB ROCm/gaming flagship GPU',
    maxTolerancePct: 8,
    substitutes: [
      {
        sku: 'AMD-RX-7900XTX',
        title: 'AMD Radeon RX 7900 XTX 24GB',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 895.0,
        compatibilityNote: 'Exact same RX 7900 XTX from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'gpu-rx-7800xt',
    scenarioId: 'ai-workstation-build',
    sku: 'AMD-RX-7800XT',
    title: 'AMD Radeon RX 7800 XT 16GB',
    sellerId: 'seller_amd_official',
    sellerName: 'AMD Official Store',
    category: 'GPU',
    unitPrice: 479.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: '16GB PCIe 4.0 graphics card',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'AMD-RX-7800XT',
        title: 'AMD Radeon RX 7800 XT 16GB',
        sellerName: 'BestBuy Tech Partner',
        sellerId: 'seller_bestbuy',
        price: 475.0,
        compatibilityNote: 'Exact same RX 7800 XT from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'mb-b650-am5',
    scenarioId: 'ai-workstation-build',
    sku: 'MSI-B650-TOMAHAWK',
    title: 'MSI MAG B650 Tomahawk WiFi (AM5)',
    sellerId: 'seller_msi_official',
    sellerName: 'MSI Official Store',
    category: 'Motherboard',
    unitPrice: 199.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Compatible with all Ryzen 7000/9000 AM5 CPUs',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'MSI-B650-TOMAHAWK',
        title: 'MSI MAG B650 Tomahawk WiFi (AM5)',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 195.0,
        compatibilityNote: 'Exact same motherboard from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'mb-z790-lga1700',
    scenarioId: 'ai-workstation-build',
    sku: 'ASUS-Z790-E',
    title: 'ASUS ROG Strix Z790-E WiFi (LGA1700)',
    sellerId: 'seller_asus_official',
    sellerName: 'ASUS Official Store',
    category: 'Motherboard',
    unitPrice: 329.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Compatible with Intel 13th/14th Gen LGA1700 CPUs',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'ASUS-Z790-E',
        title: 'ASUS ROG Strix Z790-E WiFi (LGA1700)',
        sellerName: 'MicroCenter Direct',
        sellerId: 'seller_microcenter',
        price: 325.0,
        compatibilityNote: 'Exact same motherboard from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'mb-z890-lga1851',
    scenarioId: 'ai-workstation-build',
    sku: 'GIGA-Z890-AORUS',
    title: 'Gigabyte Z890 AORUS Elite WiFi7 (LGA1851)',
    sellerId: 'seller_gigabyte_official',
    sellerName: 'Gigabyte Official Store',
    category: 'Motherboard',
    unitPrice: 289.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Compatible with Intel Core Ultra 200S CPUs',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'GIGA-Z890-AORUS',
        title: 'Gigabyte Z890 AORUS Elite WiFi7 (LGA1851)',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 285.0,
        compatibilityNote: 'Exact same motherboard from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'ram-64gb-ddr5',
    scenarioId: 'ai-workstation-build',
    sku: 'CORSAIR-64G-DDR5',
    title: 'Corsair Vengeance 64GB DDR5-6000 CL30',
    sellerId: 'seller_corsair_official',
    sellerName: 'Corsair Official Store',
    category: 'Memory & Storage',
    unitPrice: 189.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Required DDR5 system memory',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'CORSAIR-64G-DDR5',
        title: 'Corsair Vengeance 64GB DDR5-6000 CL30',
        sellerName: 'BestBuy Tech Partner',
        sellerId: 'seller_bestbuy',
        price: 185.0,
        compatibilityNote: 'Exact same RAM kit from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'ssd-990pro-2tb',
    scenarioId: 'ai-workstation-build',
    sku: 'SAM-990PRO-2TB',
    title: 'Samsung 990 Pro 2TB PCIe 4.0 NVMe',
    sellerId: 'seller_samsung_official',
    sellerName: 'Samsung Official Store',
    category: 'Memory & Storage',
    unitPrice: 159.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: 'Boot & dataset NVMe drive',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'SAM-990PRO-2TB',
        title: 'Samsung 990 Pro 2TB PCIe 4.0 NVMe',
        sellerName: 'B&H Authorized Partner',
        sellerId: 'seller_bh_partner',
        price: 155.0,
        compatibilityNote: 'Exact same NVMe SSD from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'psu-rm1000x',
    scenarioId: 'ai-workstation-build',
    sku: 'CORSAIR-RM1000X',
    title: 'Corsair RM1000x 1000W 80+ Gold ATX 3.1',
    sellerId: 'seller_corsair_official',
    sellerName: 'Corsair Official Store',
    category: 'Power & Case',
    unitPrice: 179.0,
    quantity: 1,
    criticality: 'CRITICAL',
    dependsOn: [],
    dependencyReason: '12V-2x6 power rail required for high-TDP GPUs',
    maxTolerancePct: 10,
    substitutes: [
      {
        sku: 'CORSAIR-RM1000X',
        title: 'Corsair RM1000x 1000W 80+ Gold ATX 3.1',
        sellerName: 'Newegg Authorized',
        sellerId: 'seller_newegg',
        price: 175.0,
        compatibilityNote: 'Exact same PSU from authorized 3rd-party seller',
      },
    ],
  },
  {
    id: 'case-lancool-216',
    scenarioId: 'ai-workstation-build',
    sku: 'LIANLI-216-BLK',
    title: 'Lian Li Lancool 216 Airflow ATX Case',
    sellerId: 'seller_lianli_official',
    sellerName: 'Lian Li Official Store',
    category: 'Power & Case',
    unitPrice: 99.0,
    quantity: 1,
    criticality: 'OPTIONAL',
    dependsOn: [],
    dependencyReason: 'ATX chassis with 360mm radiator clearance',
    maxTolerancePct: 15,
    substitutes: [],
  },
];

export function getAllCatalogItems(): CatalogItemPreset[] {
  const scenarioItems: CatalogItemPreset[] = SCENARIO_PRESETS.flatMap((sc) =>
    sc.items.map((item) => ({
      ...item,
      scenarioId: sc.id,
    }))
  );
  return [...scenarioItems, ...EXTRA_PC_PARTS];
}

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

  await new Promise((r) => setTimeout(r, mode === 'TIMEOUT' || mode === 'DELAYED' ? 450 : 120));

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

  if (mode === 'TIMEOUT' || mode === 'DELAYED') {
    return {
      legId: leg.id,
      sellerName: leg.sellerName,
      available: false,
      liveUnitPrice: leg.unitPrice,
      latencyMs: Date.now() - started,
      faultMode: mode,
      reason: `${leg.sellerName} fulfillment API delayed/timed out (>5000ms) during 2PC Prepare.`,
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
