import React from 'react';
import { X, Bookmark, Trash2, ArrowUpRight, Building2, MapPin } from 'lucide-react';

export default function SavedJobsModal({ isOpen, onClose, savedJobs, onRemove }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#121316] border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-pixel text-neutral-950 dark:text-white uppercase">
                Saved Openings ({savedJobs.length})
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-500 font-mono-code">
                Stored in local database
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

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3">
          {savedJobs && savedJobs.length > 0 ? (
            savedJobs.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-400 font-mono-code">
                    <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-neutral-950 dark:text-neutral-100 font-semibold">{item.job.company}</span>
                    <span className="text-neutral-400">•</span>
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-400">{item.job.location}</span>
                  </div>
                  <h4 className="text-base font-bold text-neutral-950 dark:text-white">
                    {item.job.title}
                  </h4>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-pixel bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                      Score: {item.job.match_score}%
                    </span>
                    <span className="text-[10px] font-mono-code text-neutral-600 dark:text-neutral-400 font-medium">
                      Saved: {new Date(item.saved_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.job.apply_url || item.job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:opacity-80 transition-opacity"
                    title="Apply Now"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Bookmark className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-300">No saved jobs yet.</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-1">Bookmark any job card to save it for later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
