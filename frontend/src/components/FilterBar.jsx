import React from 'react';
import { ArrowDownAZ, Shield } from 'lucide-react';

export default function FilterBar({
  totalResults,
  filteredCount,
  searchTime,
  sortBy,
  setSortBy,
  filterOfficialOnly,
  setFilterOfficialOnly,
  minMatchScore,
  setMinMatchScore
}) {
  return (
    <div className="twenty-card rounded-2xl p-4 mb-6 bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      {/* Results Counter & Freshness */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-pixel text-black dark:text-white">
            {filteredCount}
          </span>
          <span className="text-xs text-neutral-800 dark:text-neutral-400 font-mono-code uppercase font-bold">
            {filteredCount === 1 ? 'opening found' : 'openings found'}
          </span>
        </div>

        {totalResults !== filteredCount && (
          <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono-code font-semibold">
            (of {totalResults} total)
          </span>
        )}

        {searchTime > 0 && (
          <span className="hidden sm:inline-block text-[11px] font-mono-code text-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold">
            {searchTime}s execution
          </span>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Official Portals Toggle */}
        <button
          onClick={() => setFilterOfficialOnly(!filterOfficialOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-pixel uppercase transition-all border cursor-pointer font-bold ${
            filterOfficialOnly
              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
              : 'bg-white dark:bg-neutral-800/80 text-black dark:text-neutral-400 hover:bg-neutral-100 dark:hover:text-white border-neutral-300 dark:border-neutral-700 shadow-2xs'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Official ATS Only</span>
        </button>

        {/* Min Score Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-xs font-mono-code text-black dark:text-neutral-300 shadow-2xs">
          <span className="font-pixel text-[10px] uppercase text-neutral-800 dark:text-neutral-400 font-bold">Min Score:</span>
          <select
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="bg-transparent font-pixel text-xs text-black dark:text-white outline-none cursor-pointer font-bold"
          >
            <option value={0} className="bg-white dark:bg-neutral-900 text-black dark:text-white">All</option>
            <option value={50} className="bg-white dark:bg-neutral-900 text-black dark:text-white">50%+</option>
            <option value={70} className="bg-white dark:bg-neutral-900 text-black dark:text-white">70%+</option>
            <option value={80} className="bg-white dark:bg-neutral-900 text-black dark:text-white">80%+</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-xs font-mono-code text-black dark:text-neutral-300 shadow-2xs">
          <ArrowDownAZ className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-400" />
          <span className="font-pixel text-[10px] uppercase text-neutral-800 dark:text-neutral-400 font-bold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent font-pixel text-xs text-black dark:text-white outline-none cursor-pointer font-bold"
          >
            <option value="match_score" className="bg-white dark:bg-neutral-900 text-black dark:text-white">Match Score</option>
            <option value="company" className="bg-white dark:bg-neutral-900 text-black dark:text-white">Company</option>
            <option value="title" className="bg-white dark:bg-neutral-900 text-black dark:text-white">Job Title</option>
          </select>
        </div>
      </div>
    </div>
  );
}
