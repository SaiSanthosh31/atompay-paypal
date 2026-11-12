import { useMemo, useState } from 'react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
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

ModuleRegistry.registerModules([AllCommunityModule]);

interface LedgerGridProps {
  entries: LedgerEntry[];
  onRefresh: () => void;
}

type StatusFilter = 'ALL' | 'CAPTURED' | 'VOIDED' | 'SWAPPED';

export function LedgerGrid({ entries, onRefresh }: LedgerGridProps) {
  const [quickFilterText, setQuickFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredEntries = useMemo(() => {
    if (statusFilter === 'ALL') return entries;
    if (statusFilter === 'VOIDED') {
      return entries.filter(
        (e) => e.finalStatus === 'VOIDED' || e.finalStatus === 'FAILED'
      );
    }
    if (statusFilter === 'SWAPPED') {
      return entries.filter(
        (e) =>
          e.finalStatus === 'SUBSTITUTED' ||
          (e.decisionNote || '').includes('AI Swapped')
      );
    }
    return entries.filter((e) => e.finalStatus === statusFilter);
  }, [entries, statusFilter]);

  const metrics = useMemo(() => {
    const totalHolds = entries.reduce(
      (s, e) => s + (e.authorizedAmount || 0),
      0
    );
    const totalCaptured = entries.reduce(
      (s, e) => s + (e.settledAmount || 0),
      0
    );
    const voidedEntries = entries.filter(
      (e) => e.finalStatus === 'VOIDED' || e.finalStatus === 'FAILED'
    );
    const totalProtected = voidedEntries.reduce(
      (s, e) => s + (e.authorizedAmount || 0),
      0
    );
    const substitutedCount = entries.filter(
      (e) =>
        e.finalStatus === 'SUBSTITUTED' ||
        (e.decisionNote || '').includes('AI Swapped')
    ).length;

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
        headerName: 'Order Ref',
        width: 125,
        filter: true,
        pinned: 'left',
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="font-mono text-xs font-semibold text-[#003087]">
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
          <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
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
          <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {p.value || 'N/A'}
          </span>
        ),
      },
      {
        field: 'paypalCaptureId',
        headerName: 'Capture / Void ID',
        width: 165,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => {
          const val = p.value || 'N/A';
          if (val === 'VOIDED') {
            return (
              <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                VOIDED
              </span>
            );
          }
          if (val === 'SKIPPED') {
            return (
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                SKIPPED
              </span>
            );
          }
          return (
            <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
          <span className="font-semibold text-slate-800">{p.value}</span>
        ),
      },
      {
        field: 'itemTitle',
        headerName: 'Item / SKU',
        flex: 1.2,
        minWidth: 210,
        filter: true,
        cellRenderer: (p: ICellRendererParams<LedgerEntry>) => (
          <span className="text-slate-800">{p.value}</span>
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
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-sky-700 bg-sky-50 border-sky-200'
              }`}
            >
              {isCritical ? 'REQUIRED' : 'OPTIONAL'}
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
        cellClass: 'font-mono text-slate-600',
      },
      {
        field: 'settledAmount',
        headerName: 'Charged ($)',
        width: 120,
        filter: 'agNumberColumnFilter',
        valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
        cellClass: 'font-mono text-emerald-700 font-bold',
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
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                CAPTURED
              </span>
            );
          }
          if (s === 'VOIDED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-rose-700 bg-rose-50 border border-rose-200">
                <ShieldAlert className="h-3 w-3" />
                VOIDED
              </span>
            );
          }
          if (s === 'SUBSTITUTED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-indigo-700 bg-indigo-50 border border-indigo-200">
                <Sparkles className="h-3 w-3" />
                SUBSTITUTED
              </span>
            );
          }
          if (s === 'AUTHORIZED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-blue-700 bg-blue-50 border border-blue-200">
                <Clock className="h-3 w-3" />
                AUTHORIZED
              </span>
            );
          }
          if (s === 'SKIPPED') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
                SKIPPED
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-amber-700 bg-amber-50 border border-amber-200">
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
        cellClass: 'text-[11px] font-mono text-slate-500',
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
                isSwap ? 'text-indigo-700 font-semibold' : 'text-slate-600'
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
    const blob = new Blob([JSON.stringify(filteredEntries, null, 2)], {
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
    if (filteredEntries.length === 0) return;
    const headers = [
      'Order Ref',
      'Bundle Title',
      'PayPal Order ID',
      'PayPal Authorization ID',
      'PayPal Capture ID',
      'Seller Name',
      'Item Title',
      'Criticality',
      'Authorized Hold (USD)',
      'Charged Amount (USD)',
      'Final Tranche Status',
      'Execution Mode',
      'Timestamp',
      'AI / 2PC Audit Note',
    ];

    const rows = filteredEntries.map((e) => [
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Holds</span>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ${metrics.totalHolds.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Captured</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ${metrics.totalCaptured.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Voided</span>
            <ShieldCheck className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            ${metrics.totalProtected.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AI Swaps</span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            {metrics.substitutedCount} / {metrics.totalCount}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Orders &amp; Settlement Ledger
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0070BA] w-44 sm:w-56"
              />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredEntries.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={filteredEntries.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[#003087] hover:bg-[#002569] disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'CAPTURED', label: 'Settled' },
              { id: 'VOIDED', label: 'Voided / Failed' },
              { id: 'SWAPPED', label: 'AI Swapped' },
            ] as Array<{ id: StatusFilter; label: string }>
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
          <AgGridReact<LedgerEntry>
            theme={themeQuartz}
            rowData={filteredEntries}
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

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
          <span className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-[#0070BA]" />
            Live filter active: search across seller names, PayPal IDs, item SKUs, and AI notes.
          </span>
          <span className="font-mono text-slate-500">
            Powered by AG Grid Community v33
          </span>
        </div>
      </div>
    </div>
  );
}
