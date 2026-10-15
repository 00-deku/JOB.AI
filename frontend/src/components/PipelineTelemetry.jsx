import React from 'react';
import { X, Activity, CheckCircle2, AlertTriangle, AlertCircle, Info, Clock, Cpu } from 'lucide-react';

export default function PipelineTelemetry({ isOpen, onClose, logs, toolsUsed, queryId, searchTime }) {
  if (!isOpen) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCleanToolName = (tool) => {
    return tool.replace(/TinyFish\s*/gi, '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#121316] border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-pixel text-neutral-900 dark:text-white uppercase">
                Execution Pipeline Audit
              </h2>
              <p className="text-xs text-neutral-500 font-mono-code">
                Query: {queryId || 'active'} • Runtime: {searchTime}s
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools activated summary */}
        <div className="px-5 py-3 bg-neutral-100/60 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500 font-pixel mr-1 uppercase">Primitives:</span>
          {toolsUsed && toolsUsed.length > 0 ? (
            toolsUsed.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md text-[11px] font-pixel bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 uppercase"
              >
                {getCleanToolName(t)}
              </span>
            ))
          ) : (
            <span className="text-xs text-neutral-400 font-mono-code">Awaiting live query</span>
          )}
        </div>

        {/* Step-by-step logs timeline */}
        <div className="p-5 overflow-y-auto space-y-3 font-mono-code text-xs">
          {logs && logs.length > 0 ? (
            logs.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  {getStatusIcon(step.status)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-pixel text-neutral-600 dark:text-neutral-400 uppercase">
                        Step {step.step_number}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                        {step.step_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-pixel bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 uppercase">
                        {getCleanToolName(step.tool)}
                      </span>
                      {step.duration_ms > 0 && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {step.duration_ms}ms
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-neutral-600 dark:text-neutral-400 font-sans text-xs leading-relaxed pt-1">
                    {step.details.replace(/TinyFish\s*/gi, 'Agent ')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-400 font-sans">
              No audit logs captured yet. Execute a search to view the live execution pipeline.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 font-pixel text-[10px] uppercase">
            <Cpu className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
            <span>Multi-Agent Search & Extraction Graph</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold font-pixel text-[11px] uppercase transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
