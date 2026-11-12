import { useMemo, useState } from 'react';
import { AllCommunityModule, ModuleRegistry, colorSchemeDarkBlue, themeQuartz } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { LedgerEntry } from '../types/atompay';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const darkTheme = themeQuartz.withPart(colorSchemeDarkBlue);

interface LedgerGridProps {
  entries: LedgerEntry[];
  onRefresh: () => void;
}

export function LedgerGrid({ entries, onRefresh }: LedgerGridProps) {
  const [quickFilterText, setQuickFilterText] = useState('');

  // Financial KPI totals computed across all ledger entries
  const metrics = useMemo(() => {
    const totalHolds = entries.reduce((s, e) => s + (e.authorizedAmount || 0), 0);
    const totalCaptured = entries.reduce((s, e) => s + (e.settledAmount || 0), 0);
    const voidedEntries = entries.filter(
      (e) => e.finalStatus === 'VOIDED' || e.finalStatus === 'FAILED'
    );
    const totalProtected = voidedEntries.reduce(
      (s, e) => s + (e.authorizedAmount || 0),
      0
    );
    const substitutedCount = entries.filter((e) => e.finalStatus === 'SUBSTITUTED').length;

    return {
      totalHolds,
      totalCaptured,
      totalProtected,
      totalCount: entries.length,
      substitutedCount,
    };
  }, [entries]);

  const colDefs = useMemo<ColDef<LedgerEntry>[]>(
    () => [
      {
        field: 'bundleId',
        headerName: 'Bundle ID',
        width: 120,
        filter: true,
        pinned: 'left',
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="font-mono text-xs font-semibold text-cyan-300">
            {p.value}
          </span>
        ),
      },
      {
        field: 'paypalOrderId',
        headerName: 'PayPal Order ID',
        width: 175,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="font-mono text-xs text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            {p.value || 'N/A'}
          </span>
        ),
      },
      {
        field: 'paypalAuthorizationId',
        headerName: 'PayPal Auth ID',
        width: 175,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            {p.value || 'N/A'}
          </span>
        ),
      },
      {
        field: 'paypalCaptureId',
        headerName: 'Capture / Action ID',
        width: 165,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => {
          const val = p.value || 'N/A';
          if (val === 'VOIDED') {
            return (
              <span className="font-mono text-[11px] font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                VOIDED
              </span>
            );
          }
          if (val === 'SKIPPED') {
            return (
              <span className="font-mono text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                SKIPPED
              </span>
            );
          }
          return (
            <span className="font-mono text-xs text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {val}
            </span>
          );
        },
      },
      {
        field: 'sellerName',
        headerName: 'Merchant / Seller',
        width: 160,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="font-medium text-slate-200">{p.value}</span>
        ),
      },
      {
        field: 'itemTitle',
        headerName: 'Item / Sku',
        flex: 1.2,
        minWidth: 210,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="text-slate-100 font-normal">{p.value}</span>
        ),
      },
      {
        field: 'criticality',
        headerName: 'Rule',
        width: 110,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => {
          const isCritical = p.value === 'CRITICAL';
          return (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                isCritical
                  ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'
                  : 'text-sky-300 bg-sky-500/10 border-sky-500/30'
              }`}
            >
              {p.value}
            </span>
          );
        },
      },
      {
        field: 'authorizedAmount',
        headerName: 'Hold ($)',
        width: 110,
        filter: 'agNumberColumnFilter',
        valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
        cellClass: 'font-mono text-slate-300',
      },
      {
        field: 'settledAmount',
        headerName: 'Captured ($)',
        width: 120,
        filter: 'agNumberColumnFilter',
        valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
        cellClass: 'font-mono text-emerald-300 font-semibold',
      },
      {
        field: 'finalStatus',
        headerName: 'Tranche Status',
        width: 145,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => {
          const s = p.value;
          if (s === 'CAPTURED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                CAPTURED
              </span>
            );
          }
          if (s === 'VOIDED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-rose-300 bg-rose-500/15 border border-rose-500/30">
                <ShieldAlert className="h-3 w-3" />
                VOIDED
              </span>
            );
          }
          if (s === 'SUBSTITUTED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-indigo-300 bg-indigo-500/15 border border-indigo-500/30">
                <Sparkles className="h-3 w-3" />
                SUBSTITUTED
              </span>
            );
          }
          if (s === 'AUTHORIZED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-sky-300 bg-sky-500/15 border border-sky-500/30">
                <Clock className="h-3 w-3" />
                AUTHORIZED
              </span>
            );
          }
          if (s === 'SKIPPED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-slate-400 bg-slate-800 border border-slate-700">
                SKIPPED
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-amber-300 bg-amber-500/15 border border-amber-500/30">
              {s}
            </span>
          );
        },
      },
      {
        field: 'timestamp',
        headerName: 'Timestamp',
        width: 175,
        filter: true,
        valueFormatter: (p) => {
          if (!p.value) return 'N/A';
          try {
            return new Date(p.value).toLocaleString();
          } catch {
            return String(p.value);
          }
        },
        cellClass: 'text-[11px] font-mono text-slate-400',
      },
      {
        field: 'decisionNote',
        headerName: 'AI / 2PC Audit Note',
        flex: 1.4,
        minWidth: 240,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => {
          const val = p.value || '';
          const isSwap = val.includes('AI Swapped');
          return (
            <span
              className={`text-xs ${
                isSwap ? 'text-indigo-300 font-medium' : 'text-slate-300'
              }`}
              title={val}
            >
              {val}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atompay-settlement-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const headers = [
      'Bundle ID',
      'Bundle Title',
      'PayPal Order ID',
      'PayPal Authorization ID',
      'PayPal Capture ID',
      'Seller Name',
      'Item Title',
      'Criticality',
      'Authorized Hold (USD)',
      'Settled Amount (USD)',
      'Final Tranche Status',
      'Execution Mode',
      'Timestamp',
      'AI / 2PC Audit Note',
    ];

    const rows = entries.map((e) => [
      e.bundleId,
      `"${(e.bundleTitle || '').replace(/"/g, '""')}"`,
      e.paypalOrderId || '',
      e.paypalAuthorizationId || '',
      e.paypalCaptureId || '',
      `"${(e.sellerName || '').replace(/"/g, '""')}"`,
      `"${(e.itemTitle || '').replace(/"/g, '""')}"`,
      e.criticality,
      (e.authorizedAmount || 0).toFixed(2),
      (e.settledAmount || 0).toFixed(2),
      e.finalStatus,
      e.executionMode,
      e.timestamp,
      `"${(e.decisionNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atompay-settlement-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Auth Holds</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${metrics.totalHolds.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Locked via PayPal Orders v2</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Settled &amp; Captured</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${metrics.totalCaptured.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Atomic Multi-Tranche Captures</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Voided / Protected</span>
            <ShieldCheck className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            ${metrics.totalProtected.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Protected by 2PC Atomic VOID</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AI Swaps &amp; Audits</span>
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            {metrics.substitutedCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              / {metrics.totalCount} tranches
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Gemini Compatible Recoveries</p>
        </div>
      </div>

      {/* Main AG Grid Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                AG Grid Atomic Settlement &amp; Rollback Audit Ledger
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                AG Grid Community v33
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Every PayPal authorization hold, multi-tranche partial capture, AI swap, and atomic void recorded per seller leg.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={entries.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-40 text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={entries.length === 0}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
          </div>
        </div>

        {/* AG Grid React Table Container */}
        <div className="h-[540px] w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          <AgGridReact<LedgerEntry>
            theme={darkTheme}
            rowData={entries}
            columnDefs={colDefs}
            quickFilterText={quickFilterText}
            pagination
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            defaultColDef={{
              sortable: true,
              resizable: true,
              filter: true,
            }}
            animateRows
            rowSelection="single"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
          <span className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-cyan-400" />
            Quick filter active: search across seller names, PayPal IDs, item SKUs, and AI notes.
          </span>
          <span className="font-mono text-slate-500">
            Qualified for AG Grid Sponsor Award · ag-grid-react &amp; ag-grid-community
          </span>
        </div>
      </div>
    </div>
  );
}
