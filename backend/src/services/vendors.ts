import type {
  LegCriticality,
  ScenarioPreset,
  VendorFaultMode,
  VendorLeg,
} from '../types/atompay.js';

export type CatalogItemPreset = ScenarioPreset['items'][number] & {
  scenarioId: string;
};

function makePart(
  id: string,
  sku: string,
  title: string,
  sellerName: string,
  altSellerName: string,
  category: string,
  unitPrice: number,
  dependencyReason: string,
  criticality: LegCriticality = 'CRITICAL'
): CatalogItemPreset {
  const altPrice = Math.max(10, Number((unitPrice - Math.min(10, Math.round(unitPrice * 0.02))).toFixed(2)));
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return {
    id,
    scenarioId: 'ai-workstation-build',
    sku,
    title,
    sellerId: `seller_${slug(sellerName)}`,
    sellerName,
    category,
    unitPrice,
    quantity: 1,
    criticality,
    dependsOn: [],
    dependencyReason,
    maxTolerancePct: 10,
    substitutes: [
      {
        sku,
        title,
        sellerName: altSellerName,
        sellerId: `seller_${slug(altSellerName)}`,
        price: altPrice,
        compatibilityNote: `Exact same product fulfilled by ${altSellerName}`,
      },
    ],
  };
}

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
  // CPUs (AMD Ryzen 9000 / 7000 + Intel Core Ultra & 14th/13th Gen)
  makePart('cpu-r9-9900x', 'AMD-R9-9900X', 'AMD Ryzen 9 9900X (12-Core AM5)', 'AMD Official Store', 'Newegg Authorized', 'CPU', 429, 'Requires AM5 motherboard'),
  makePart('cpu-r7-9800x3d', 'AMD-R7-9800X3D', 'AMD Ryzen 7 9800X3D (AM5)', 'AMD Official Store', 'MicroCenter Direct', 'CPU', 449, 'Requires AM5 motherboard'),
  makePart('cpu-r7-9700x', 'AMD-R7-9700X', 'AMD Ryzen 7 9700X (8-Core AM5)', 'AMD Official Store', 'BestBuy Tech Partner', 'CPU', 329, 'Requires AM5 motherboard'),
  makePart('cpu-r5-9600x', 'AMD-R5-9600X', 'AMD Ryzen 5 9600X (6-Core AM5)', 'AMD Official Store', 'Newegg Authorized', 'CPU', 249, 'Requires AM5 motherboard'),
  makePart('cpu-r9-7950x3d', 'AMD-R9-7950X3D', 'AMD Ryzen 9 7950X3D (16-Core AM5)', 'AMD Official Store', 'B&H Authorized Partner', 'CPU', 599, 'Requires AM5 motherboard'),
  makePart('cpu-r9-7950x', 'AMD-R9-7950X', 'AMD Ryzen 9 7950X (16-Core AM5)', 'AMD Official Store', 'Amazon Tech Partner', 'CPU', 499, 'Requires AM5 motherboard'),
  makePart('cpu-r7-7800x3d', 'AMD-R7-7800X3D', 'AMD Ryzen 7 7800X3D (AM5)', 'AMD Official Store', 'MicroCenter Direct', 'CPU', 389, 'Requires AM5 motherboard'),
  makePart('cpu-r5-7600x', 'AMD-R5-7600X', 'AMD Ryzen 5 7600X (6-Core AM5)', 'AMD Official Store', 'Newegg Authorized', 'CPU', 199, 'Requires AM5 motherboard'),
  makePart('cpu-intel-285k', 'INT-U9-285K', 'Intel Core Ultra 9 285K (LGA1851)', 'Intel Official Store', 'BestBuy Tech Partner', 'CPU', 569, 'Requires LGA1851 Z890 board'),
  makePart('cpu-intel-265k', 'INT-U7-265K', 'Intel Core Ultra 7 265K (LGA1851)', 'Intel Official Store', 'MicroCenter Direct', 'CPU', 389, 'Requires LGA1851 Z890 board'),
  makePart('cpu-intel-245k', 'INT-U5-245K', 'Intel Core Ultra 5 245K (LGA1851)', 'Intel Official Store', 'Newegg Authorized', 'CPU', 299, 'Requires LGA1851 Z890 board'),
  makePart('cpu-intel-14900k', 'INT-I9-14900K', 'Intel Core i9-14900K (LGA1700)', 'Intel Official Store', 'MicroCenter Direct', 'CPU', 439, 'Requires LGA1700 board'),
  makePart('cpu-intel-14700k', 'INT-I7-14700K', 'Intel Core i7-14700K (LGA1700)', 'Intel Official Store', 'Newegg Authorized', 'CPU', 349, 'Requires LGA1700 board'),
  makePart('cpu-intel-14600k', 'INT-I5-14600K', 'Intel Core i5-14600K (LGA1700)', 'Intel Official Store', 'BestBuy Tech Partner', 'CPU', 249, 'Requires LGA1700 board'),
  makePart('cpu-intel-13600k', 'INT-I5-13600K', 'Intel Core i5-13600K (LGA1700)', 'Intel Official Store', 'Amazon Tech Partner', 'CPU', 219, 'Requires LGA1700 board'),

  // GPUs (NVIDIA RTX 40 & 30 + AMD Radeon RX 7000)
  makePart('gpu-rtx-4090', 'NV-RTX-4090', 'NVIDIA GeForce RTX 4090 24GB', 'NVIDIA Official Store', 'BestBuy Tech Partner', 'GPU', 1599, 'Requires 850W+ ATX 3.0 PSU'),
  makePart('gpu-rtx-4070tis', 'NV-RTX-4070TIS', 'NVIDIA GeForce RTX 4070 Ti Super 16GB', 'NVIDIA Official Store', 'MicroCenter Direct', 'GPU', 789, 'Requires 750W+ PSU'),
  makePart('gpu-rtx-4070s', 'NV-RTX-4070S', 'NVIDIA GeForce RTX 4070 Super 12GB', 'NVIDIA Official Store', 'Newegg Authorized', 'GPU', 599, 'Requires 650W+ PSU'),
  makePart('gpu-rtx-4070', 'NV-RTX-4070', 'NVIDIA GeForce RTX 4070 12GB', 'NVIDIA Official Store', 'B&H Authorized Partner', 'GPU', 529, 'Requires 650W+ PSU'),
  makePart('gpu-rtx-4060ti', 'NV-RTX-4060TI-16', 'NVIDIA GeForce RTX 4060 Ti 16GB', 'NVIDIA Official Store', 'Newegg Authorized', 'GPU', 429, '16GB VRAM AI & 1440p GPU'),
  makePart('gpu-rtx-4060', 'NV-RTX-4060-8', 'NVIDIA GeForce RTX 4060 8GB', 'NVIDIA Official Store', 'BestBuy Tech Partner', 'GPU', 299, 'Compact 1080p PCIe 4.0 GPU'),
  makePart('gpu-rtx-3080ti', 'NV-RTX-3080TI', 'NVIDIA GeForce RTX 3080 Ti 12GB', 'NVIDIA Official Store', 'Amazon Tech Partner', 'GPU', 649, 'Ampere 4K gaming/compute GPU'),
  makePart('gpu-rtx-3060', 'NV-RTX-3060-12', 'NVIDIA GeForce RTX 3060 12GB', 'NVIDIA Official Store', 'Newegg Authorized', 'GPU', 279, '12GB budget CUDA GPU'),
  makePart('gpu-rx-7900xtx', 'AMD-RX-7900XTX', 'AMD Radeon RX 7900 XTX 24GB', 'AMD Official Store', 'Newegg Authorized', 'GPU', 899, '24GB ROCm/gaming flagship GPU'),
  makePart('gpu-rx-7900xt', 'AMD-RX-7900XT', 'AMD Radeon RX 7900 XT 20GB', 'AMD Official Store', 'MicroCenter Direct', 'GPU', 689, '20GB 4K Radeon GPU'),
  makePart('gpu-rx-7900gre', 'AMD-RX-7900GRE', 'AMD Radeon RX 7900 GRE 16GB', 'AMD Official Store', 'BestBuy Tech Partner', 'GPU', 539, '16GB 1440p Radeon GPU'),
  makePart('gpu-rx-7800xt', 'AMD-RX-7800XT', 'AMD Radeon RX 7800 XT 16GB', 'AMD Official Store', 'BestBuy Tech Partner', 'GPU', 479, '16GB PCIe 4.0 GPU'),
  makePart('gpu-rx-7700xt', 'AMD-RX-7700XT', 'AMD Radeon RX 7700 XT 12GB', 'AMD Official Store', 'Newegg Authorized', 'GPU', 389, '12GB 1440p Radeon GPU'),
  makePart('gpu-rx-7600', 'AMD-RX-7600-8', 'AMD Radeon RX 7600 8GB', 'AMD Official Store', 'Amazon Tech Partner', 'GPU', 259, 'Entry 1080p RDNA 3 GPU'),

  // Motherboards
  makePart('mb-x870e-carbon', 'MSI-X870E-CARBON', 'MSI MPG X870E Carbon WiFi (AM5)', 'MSI Official Store', 'Newegg Authorized', 'Motherboard', 469, 'AM5 PCIe 5.0 flagship board'),
  makePart('mb-b650e-f', 'ASUS-B650E-F', 'ASUS ROG Strix B650E-F WiFi (AM5)', 'ASUS Official Store', 'MicroCenter Direct', 'Motherboard', 259, 'AM5 PCIe 5.0 gaming board'),
  makePart('mb-b650-am5', 'MSI-B650-TOMAHAWK', 'MSI MAG B650 Tomahawk WiFi (AM5)', 'MSI Official Store', 'Newegg Authorized', 'Motherboard', 199, 'Compatible with Ryzen 7000/9000 CPUs'),
  makePart('mb-x670e-aorus', 'GIGA-X670E-AORUS', 'Gigabyte X670E AORUS Master (AM5)', 'Gigabyte Official Store', 'B&H Authorized Partner', 'Motherboard', 389, 'AM5 workstation board'),
  makePart('mb-z790-lga1700', 'ASUS-Z790-E', 'ASUS ROG Strix Z790-E WiFi (LGA1700)', 'ASUS Official Store', 'MicroCenter Direct', 'Motherboard', 329, 'Compatible with Intel 13th/14th Gen CPUs'),
  makePart('mb-b760m-mortar', 'MSI-B760M-MORTAR', 'MSI MAG B760M Mortar WiFi II (LGA1700)', 'MSI Official Store', 'Newegg Authorized', 'Motherboard', 179, 'mATX LGA1700 DDR5 board'),
  makePart('mb-z890-lga1851', 'GIGA-Z890-AORUS', 'Gigabyte Z890 AORUS Elite WiFi7 (LGA1851)', 'Gigabyte Official Store', 'Newegg Authorized', 'Motherboard', 289, 'Compatible with Intel Core Ultra 200S CPUs'),

  // Memory & Storage
  makePart('ram-64gb-ddr5', 'CORSAIR-64G-DDR5', 'Corsair Vengeance 64GB DDR5-6000 CL30', 'Corsair Official Store', 'BestBuy Tech Partner', 'Memory & Storage', 189, 'Required DDR5 system memory'),
  makePart('ram-gskill-64gb', 'GSKILL-64G-6400', 'G.Skill Trident Z5 RGB 64GB DDR5-6400', 'G.Skill Official Store', 'Newegg Authorized', 'Memory & Storage', 209, 'High-speed XMP DDR5 memory'),
  makePart('ram-kingston-32gb', 'KING-32G-DDR5', 'Kingston Fury Beast 32GB DDR5-6000', 'Kingston Official Store', 'Amazon Tech Partner', 'Memory & Storage', 105, '32GB dual-channel DDR5 kit'),
  makePart('ram-crucial-32gb', 'CRUC-32G-DDR5', 'Crucial Pro 32GB DDR5-5600 Kit', 'Crucial Official Store', 'B&H Authorized Partner', 'Memory & Storage', 89, '32GB workstation DDR5 kit'),
  makePart('ram-corsair-ddr4', 'CORSAIR-32G-DDR4', 'Corsair Vengeance LPX 32GB DDR4-3600', 'Corsair Official Store', 'BestBuy Tech Partner', 'Memory & Storage', 69, '32GB DDR4 kit'),
  makePart('ssd-990pro-4tb', 'SAM-990PRO-4TB', 'Samsung 990 Pro 4TB PCIe 4.0 NVMe', 'Samsung Official Store', 'B&H Authorized Partner', 'Memory & Storage', 299, 'High-capacity NVMe SSD'),
  makePart('ssd-990pro-2tb', 'SAM-990PRO-2TB', 'Samsung 990 Pro 2TB PCIe 4.0 NVMe', 'Samsung Official Store', 'B&H Authorized Partner', 'Memory & Storage', 159, 'Boot & dataset NVMe drive'),
  makePart('ssd-sn850x-2tb', 'WD-SN850X-2TB', 'WD_BLACK SN850X 2TB PCIe 4.0 NVMe', 'WD Official Store', 'BestBuy Tech Partner', 'Memory & Storage', 149, '2TB Gen4 gaming/AI NVMe'),
  makePart('ssd-t705-2tb', 'CRUC-T705-2TB', 'Crucial T705 2TB PCIe 5.0 NVMe', 'Crucial Official Store', 'Newegg Authorized', 'Memory & Storage', 269, '14,500MB/s Gen5 NVMe SSD'),
  makePart('ssd-p41-1tb', 'SKH-P41-1TB', 'SK hynix Platinum P41 1TB NVMe', 'SK hynix Direct', 'Amazon Tech Partner', 'Memory & Storage', 89, '1TB Gen4 NVMe boot drive'),

  // Power, Cooling & Cases
  makePart('psu-rm1000x', 'CORSAIR-RM1000X', 'Corsair RM1000x 1000W 80+ Gold ATX 3.1', 'Corsair Official Store', 'Newegg Authorized', 'Power & Case', 179, '12V-2x6 power rail for RTX 4080/4090'),
  makePart('psu-rm850e', 'CORSAIR-RM850E', 'Corsair RM850e 850W 80+ Gold ATX 3.0', 'Corsair Official Store', 'BestBuy Tech Partner', 'Power & Case', 119, 'Modular 850W ATX 3.0 PSU'),
  makePart('psu-seasonic-1200', 'SEA-VERTEX-1200', 'Seasonic Vertex GX-1200 1200W Gold', 'Seasonic Official Store', 'B&H Authorized Partner', 'Power & Case', 229, '1200W dual-GPU workstation PSU'),
  makePart('cool-arctic-360', 'ARCTIC-LF3-360', 'Arctic Liquid Freezer III 360 AIO', 'Arctic Official Store', 'Amazon Tech Partner', 'Cooling', 109, '360mm high-static-pressure AIO'),
  makePart('cool-noctua-d15', 'NOCTUA-D15-G2', 'Noctua NH-D15 G2 Dual-Tower Air Cooler', 'Noctua Official Store', 'Newegg Authorized', 'Cooling', 149, 'Silent flagship dual-tower air cooler'),
  makePart('case-lancool-216', 'LIANLI-216-BLK', 'Lian Li Lancool 216 Airflow ATX Case', 'Lian Li Official Store', 'MicroCenter Direct', 'Power & Case', 99, 'ATX chassis with 360mm clearance', 'OPTIONAL'),
  makePart('case-north-xl', 'FRACTAL-NORTH-XL', 'Fractal Design North XL Charcoal ATX', 'Fractal Official Store', 'Newegg Authorized', 'Power & Case', 179, 'Full-tower walnut mesh workstation case', 'OPTIONAL'),
  makePart('case-nzxt-h9', 'NZXT-H9-FLOW', 'NZXT H9 Flow Dual-Chamber ATX Case', 'NZXT Official Store', 'BestBuy Tech Partner', 'Power & Case', 159, 'Panoramic dual-chamber case', 'OPTIONAL'),

  // Monitors & Peripherals
  makePart('mon-lg-27oled', 'LG-27GS95QE', 'LG UltraGear 27" OLED 240Hz 1440p', 'LG Official Store', 'BestBuy Tech Partner', 'Monitors', 699, '0.03ms OLED gaming monitor', 'OPTIONAL'),
  makePart('mon-asus-32oled', 'ASUS-PG32UCDM', 'ASUS ROG Swift 32" 4K 240Hz QD-OLED', 'ASUS Official Store', 'MicroCenter Direct', 'Monitors', 1199, '4K 240Hz creator & gaming monitor', 'OPTIONAL'),
  makePart('mon-dell-u2723', 'DELL-U2723QE', 'Dell UltraSharp 27" 4K USB-C Hub', 'Dell Official Store', 'B&H Authorized Partner', 'Monitors', 489, '4K IPS Black color-accurate display', 'OPTIONAL'),
  makePart('per-keychron-q1', 'KEY-Q1-PRO', 'Keychron Q1 Pro QMK/VIA Wireless', 'Keychron Official Store', 'Amazon Tech Partner', 'Peripherals', 189, 'CNC aluminum mechanical keyboard', 'OPTIONAL'),
  makePart('per-gpx2', 'LOGI-GPX-SL2', 'Logitech G Pro X Superlight 2 Mouse', 'Logitech Official Store', 'BestBuy Tech Partner', 'Peripherals', 149, '60g wireless pro mouse', 'OPTIONAL'),
  makePart('per-shure-sm7db', 'SHURE-SM7DB', 'Shure SM7dB Active Dynamic XLR Mic', 'Shure Official Store', 'B&H Authorized Partner', 'Camera', 499, 'Built-in preamp broadcast microphone', 'OPTIONAL'),
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
