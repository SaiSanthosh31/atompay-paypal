import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Download, RefreshCw } from 'lucide-react';
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
  { field: 'criticality', headerName: 'Rule', width: 105, filter: true },
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

export function LedgerGrid({ entries, onRefresh }: LedgerGridProps) {
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Orders &amp; Settlement Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Complete history of authorized holds, multi-seller tranche captures, automatic swaps, and voided orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleExportJson}
            disabled={entries.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#003087] hover:bg-[#002569] disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-200">
        <AgGridReact<LedgerEntry>
          theme={themeQuartz}
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
