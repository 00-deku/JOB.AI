import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, currentStatus, onSaveKey }) {
  const [keyInput, setKeyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await onSaveKey(keyInput.trim());
      setFeedback({
        type: res.verified ? 'success' : 'warning',
        message: res.verified
          ? 'API Key verified and saved successfully!'
          : res.message || 'Key saved. Verification test returned an issue (check key permissions).'
      });
      if (res.verified) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update API key.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121316] border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-pixel text-black dark:text-white uppercase">
                Search Engine API Key
              </h2>
              <p className="text-xs text-neutral-700 dark:text-neutral-500 font-mono-code font-semibold">
                Web automation & search credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Status Box */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {currentStatus?.api_key_configured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              )}
              <div>
                <p className="text-xs font-bold text-black dark:text-neutral-100">
                  Status: {currentStatus?.api_key_configured ? 'Connected' : 'Key Needed'}
                </p>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-400 font-mono-code font-semibold">
                  Key: {currentStatus?.api_key_masked || 'None'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-pixel text-black dark:text-neutral-400 mb-1.5 uppercase font-bold">
                ENTER API KEY
              </label>
              <input
                type="password"
                placeholder="sk-tinyfish-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white text-black dark:text-white font-mono-code text-xs outline-none shadow-xs font-semibold"
              />
              <p className="text-[11px] text-neutral-700 dark:text-neutral-500 mt-1.5 font-mono-code font-medium">
                Key can also be defined in <code className="text-black dark:text-neutral-200 font-bold">.env</code> as <code className="text-black dark:text-neutral-200 font-bold">TINYFISH_API_KEY</code>.
              </p>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-mono-code flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 font-semibold'
                    : feedback.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-300 font-semibold'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-300 font-semibold'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !keyInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-colors disabled:opacity-50 cursor-pointer font-pixel uppercase shadow-xs"
              >
                {isSubmitting ? 'Verifying...' : 'Save & Verify Key'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
