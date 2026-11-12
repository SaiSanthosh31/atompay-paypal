import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Download, FileSpreadsheet, RefreshCw, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { LedgerEntry } from '../types/atompay';

ModuleRegistry.registerModules([AllCommunityModule]);

interface LedgerGridProps {
  entries: LedgerEntry[];
  onRefresh: () => void;
}

const colDefs: ColDef<LedgerEntry>[] = [
  { field: 'bundleId', headerName: 'Order Ref', width: 120, filter: true },
  { field: 'sellerName', headerName: 'Seller', width: 145, filter: true },
  { field: 'itemTitle', headerName: 'Item', flex: 1, minWidth: 200, filter: true },
  {
    field: 'criticality',
    headerName: 'Rule',
    width: 105,
    filter: true,
    valueFormatter: (p) => (p.value === 'CRITICAL' ? 'Required' : 'Optional'),
  },
  {
    field: 'authorizedAmount',
    headerName: 'Hold ($)',
    width: 105,
    valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
  },
  {
    field: 'settledAmount',
    headerName: 'Charged ($)',
    width: 115,
    valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
  },
  { field: 'finalStatus', headerName: 'Status', width: 125, filter: true },
  { field: 'paypalAuthorizationId', headerName: 'PayPal Auth ID', width: 170 },
  { field: 'paypalCaptureId', headerName: 'Capture / Void ID', width: 170 },
  { field: 'decisionNote', headerName: 'Resolution Note', flex: 1.2, minWidth: 220 },
];

type StatusFilter = 'ALL' | 'CAPTURED' | 'VOIDED' | 'FAILED';

export function LedgerGrid({ entries, onRefresh }: LedgerGridProps) {
  const gridRef = useRef<AgGridReact<LedgerEntry>>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredEntries = useMemo(() => {
    if (statusFilter === 'ALL') return entries;
    if (statusFilter === 'VOIDED') {
      return entries.filter(
        (e) => e.finalStatus === 'VOIDED' || e.finalStatus === 'FAILED'
      );
    }
    return entries.filter((e) => e.finalStatus === statusFilter);
  }, [entries, statusFilter]);

  const metrics = useMemo(() => {
    const totalHold = entries.reduce((s, e) => s + e.authorizedAmount, 0);
    const totalCaptured = entries.reduce((s, e) => s + e.settledAmount, 0);
    const totalProtected = Math.max(0, totalHold - totalCaptured);
    const uniqueBundles = new Set(entries.map((e) => e.bundleId)).size;
    return { totalHold, totalCaptured, totalProtected, uniqueBundles };
  }, [entries]);

  const handleGridReady = (_e: GridReadyEvent<LedgerEntry>) => {
    // Grid API ready via gridRef.current.api
  };

  const handleExportCsv = () => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `atompay-ledger-${Date.now()}.csv`,
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredEntries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atompay-orders-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-medium text-slate-500">
            Protected Checkouts
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {metrics.uniqueBundles}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-medium text-slate-500">
            Total Authorized Holds
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            ${metrics.totalHold.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-medium text-slate-500">
            Settled to Verified Sellers
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ${metrics.totalCaptured.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-medium text-slate-500">
            Voided / Saved by Rollback
          </div>
          <div className="text-xl font-bold text-[#003087] mt-1">
            ${metrics.totalProtected.toFixed(2)}
          </div>
        </div>
      </div>

      {/* AG Grid Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Orders &amp; Settlement Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of authorized holds, tranche captures, automatic swaps, and voided orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredEntries.length === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={filteredEntries.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[#003087] hover:bg-[#002569] disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="Filter by seller, item, or PayPal ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0070BA]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'CAPTURED', label: 'Settled' },
                { id: 'VOIDED', label: 'Voided / Failed' },
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
        </div>

        <div className="h-[480px] w-full rounded-xl overflow-hidden border border-slate-200">
          <AgGridReact<LedgerEntry>
            ref={gridRef}
            onGridReady={handleGridReady}
            theme={themeQuartz}
            rowData={filteredEntries}
            columnDefs={colDefs}
            quickFilterText={quickFilter}
            pagination
            paginationPageSize={15}
            defaultColDef={{ sortable: true, resizable: true }}
          />
        </div>
      </div>
    </div>
  );
}
