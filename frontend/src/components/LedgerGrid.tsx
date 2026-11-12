import { AllCommunityModule, ModuleRegistry, colorSchemeDarkBlue, themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Download, RefreshCw } from 'lucide-react';
import type { LedgerEntry } from '../types/atompay';

ModuleRegistry.registerModules([AllCommunityModule]);

const darkTheme = themeQuartz.withPart(colorSchemeDarkBlue);

interface LedgerGridProps {
  entries: LedgerEntry[];
  onRefresh: () => void;
}

const colDefs: ColDef<LedgerEntry>[] = [
  { field: 'bundleId', headerName: 'Bundle', width: 120, filter: true },
  { field: 'sellerName', headerName: 'Seller', width: 145, filter: true },
  { field: 'itemTitle', headerName: 'Item', flex: 1, minWidth: 200, filter: true },
  { field: 'criticality', headerName: 'Rule', width: 105, filter: true },
  {
    field: 'authorizedAmount',
    headerName: 'Hold ($)',
    width: 105,
    valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
  },
  {
    field: 'settledAmount',
    headerName: 'Captured ($)',
    width: 115,
    valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)}`,
  },
  { field: 'finalStatus', headerName: 'Tranche Status', width: 130, filter: true },
  { field: 'paypalAuthorizationId', headerName: 'PayPal Auth ID', width: 165 },
  { field: 'paypalCaptureId', headerName: 'Capture / Action ID', width: 165 },
  { field: 'decisionNote', headerName: 'AI / 2PC Audit Note', flex: 1.2, minWidth: 220 },
];

export function LedgerGrid({ entries, onRefresh }: LedgerGridProps) {
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atompay-audit-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            AG Grid Atomic Settlement &amp; Rollback Audit Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Every PayPal authorization hold, multi-tranche partial capture, AI swap, and atomic void recorded per seller leg.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={entries.length === 0}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-800">
        <AgGridReact<LedgerEntry>
          theme={darkTheme}
          rowData={entries}
          columnDefs={colDefs}
          pagination
          paginationPageSize={15}
          defaultColDef={{ sortable: true, resizable: true }}
        />
      </div>
    </div>
  );
}

