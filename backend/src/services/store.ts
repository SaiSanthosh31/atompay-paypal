import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BundleSession, LedgerEntry } from '../types/atompay.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const storePath = path.join(dataDir, 'store.json');

interface PersistedData {
  bundles: BundleSession[];
  ledgerEntries: LedgerEntry[];
}

export function loadPersistedStore(): PersistedData {
  try {
    if (!fs.existsSync(storePath)) {
      return { bundles: [], ledgerEntries: [] };
    }
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    return {
      bundles: Array.isArray(parsed.bundles) ? parsed.bundles : [],
      ledgerEntries: Array.isArray(parsed.ledgerEntries)
        ? parsed.ledgerEntries
        : [],
    };
  } catch {
    return { bundles: [], ledgerEntries: [] };
  }
}

export function savePersistedStore(data: PersistedData): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Non-fatal if read-only filesystem
  }
}

