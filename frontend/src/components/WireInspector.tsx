import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { useState } from 'react';
import type { PayPalWireEvent } from '../types/atompay';

interface WireInspectorProps {
  events: PayPalWireEvent[];
}

export function WireInspector({ events }: WireInspectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <aside className="rounded-2xl border border-slate-800 bg-[#0D1424] p-4 flex flex-col max-h-[760px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          PayPal REST Wire Trace
        </h2>
        <span className="text-[11px] font-mono text-slate-400">
          {events.length} calls
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-xs text-slate-500 py-10 text-center">
          PayPal REST calls (`oauth2/token`, `orders`, `authorize`, `capture`, `void`, `invoices`) will appear here live.
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto pr-1">
          {events.map((ev) => {
            const isOpen = expandedId === ev.id;
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : ev.id)}
                  className="w-full text-left p-2.5 hover:bg-slate-900/70 transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">
                        {ev.method}
                      </span>
                      <span className="text-[11px] font-mono text-slate-200 truncate">
                        {ev.endpoint}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        ev.status >= 200 && ev.status < 300
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {ev.status} · {ev.latencyMs}ms
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 pl-5">
                    {ev.summary}
                  </p>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 p-2.5 bg-black/40 space-y-2 text-[10px] font-mono">
                    <div>
                      <div className="text-slate-500 mb-1">
                        MODE: {ev.mode} | PHASE: {ev.phase}
                      </div>
                      {ev.requestBody !== undefined && (
                        <>
                          <div className="text-cyan-400 mb-0.5">REQUEST:</div>
                          <pre className="text-slate-300 overflow-x-auto max-h-36">
                            {JSON.stringify(ev.requestBody, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                    {ev.responseBody !== undefined && (
                      <div>
                        <div className="text-emerald-400 mb-0.5">RESPONSE:</div>
                        <pre className="text-slate-300 overflow-x-auto max-h-40">
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
    </aside>
  );
}

