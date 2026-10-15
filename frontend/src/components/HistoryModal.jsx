import React from 'react';
import { X, History, ArrowRight, Clock } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose, historyItems, onSelectHistory }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#121316] border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-pixel text-neutral-950 dark:text-white uppercase">
                Search Queries ({historyItems.length})
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-500 font-mono-code">
                Saved query sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-3 font-mono-code text-xs">
          {historyItems && historyItems.length > 0 ? (
            historyItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-950 dark:text-white font-sans text-sm">
                      {item.role}
                    </span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-700 dark:text-neutral-400">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-500 text-[11px]">
                    <span>Level: {item.experience_level}</span>
                    {item.keywords && <span>• Skills: {item.keywords}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500 text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <span>• {item.results_count} results</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectHistory(item)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-950 dark:text-white border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer font-pixel text-[10px] uppercase font-bold"
                >
                  <span>Re-run</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-neutral-600 dark:text-neutral-400 font-sans">
              No recent searches recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
