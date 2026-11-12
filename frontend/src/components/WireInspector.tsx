import { ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { useState } from 'react';
import type { PayPalWireEvent } from '../types/atompay';

interface WireInspectorProps {
  events: PayPalWireEvent[];
}

export function WireInspector({ events }: WireInspectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-[#003087]" />
          PayPal API Logs
        </h2>
        <span className="text-xs font-mono text-slate-500">
          {events.length} requests
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-xs text-slate-400 py-14 text-center">
          No PayPal API calls recorded in this session yet. Start a checkout from the Storefront tab to inspect live requests.
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((ev) => {
            const isOpen = expandedId === ev.id;
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : ev.id)}
                  className="w-full text-left p-3 hover:bg-slate-100/70 transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#003087]">
                        {ev.method}
                      </span>
                      <span className="text-xs font-mono text-slate-800 truncate">
                        {ev.endpoint}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded shrink-0 ${
                        ev.status >= 200 && ev.status < 300
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ev.status} · {ev.latencyMs}ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 pl-6">{ev.summary}</p>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-200 p-3 bg-slate-900 text-slate-100 space-y-2 text-[11px] font-mono">
                    <div className="text-slate-400">
                      PHASE: {ev.phase} · SOURCE: {ev.mode}
                    </div>
                    {ev.requestBody !== undefined && (
                      <div>
                        <div className="text-cyan-300 mb-1">REQUEST PAYLOAD</div>
                        <pre className="overflow-x-auto max-h-44 text-slate-200">
                          {JSON.stringify(ev.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}
                    {ev.responseBody !== undefined && (
                      <div>
                        <div className="text-emerald-300 mb-1">RESPONSE BODY</div>
                        <pre className="overflow-x-auto max-h-48 text-slate-200">
                          {JSON.stringify(ev.responseBody, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
