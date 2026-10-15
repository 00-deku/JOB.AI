import React from 'react';
import { Search, Bookmark, History, Sun, Moon } from 'lucide-react';

export default function Navbar({
  savedCount,
  onOpenSaved,
  onOpenHistory,
  isDarkMode,
  onToggleTheme
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0d0e]/95 backdrop-blur-md transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          {/* Magnifying Glass Logo */}
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black text-white dark:bg-white dark:text-black border border-black dark:border-neutral-200 shadow-xs transition-transform hover:scale-105">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-black dark:text-white font-pixel">
              Job<span className="text-neutral-500 dark:text-neutral-400">.ai</span>
            </span>
            <span className="text-[10px] font-pixel px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-black dark:text-neutral-300 uppercase font-bold">
              beta
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle Button with TinyBounties ripple trigger */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-black dark:text-neutral-100 transition-all cursor-pointer shadow-xs"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-black stroke-[2.2]" />
            )}
          </button>

          {/* Saved Jobs */}
          <button
            onClick={onOpenSaved}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer shadow-xs"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-code bg-black text-white dark:bg-white dark:text-black font-black">
                {savedCount}
              </span>
            )}
          </button>

          {/* Search History */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer shadow-xs"
            title="View Search History"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
}
