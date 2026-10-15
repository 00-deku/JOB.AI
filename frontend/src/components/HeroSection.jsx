import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Code, Building2, SlidersHorizontal, ChevronDown, ChevronUp, Bot, ArrowRight } from 'lucide-react';

export default function HeroSection({
  searchParams,
  setSearchParams,
  onSearch,
  isLoading,
  demoScenarios,
  onSelectScenario
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordInput.trim().replace(/^,+|,+$/g, '');
      if (val && !searchParams.keywords.includes(val)) {
        setSearchParams(prev => ({
          ...prev,
          keywords: [...prev.keywords, val]
        }));
        setKeywordInput('');
      }
    }
  };

  const removeKeyword = (kw) => {
    setSearchParams(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== kw)
    }));
  };

  const experienceLevels = [
    { id: 'Internship', label: 'Internship' },
    { id: 'Fresher', label: 'Fresher' },
    { id: 'Entry-level', label: 'Entry-level' },
  ];

  const suggestedSkills = ['Python', 'React', 'C++', 'AI / ML', 'SQL', 'FastAPI', 'Node.js'];

  return (
    <div className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header - High contrast typography */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-pixel mb-4 shadow-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse inline-block" />
          <span>LIVE WEB INTELLIGENCE</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-black dark:text-white leading-tight">
          Find live jobs & internships with <span className="font-pixel text-3xl sm:text-4xl md:text-5xl text-black dark:text-white block sm:inline mt-1 sm:mt-0 underline decoration-2 decoration-neutral-800 dark:decoration-neutral-400 underline-offset-8">AI Agents.</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-neutral-900 dark:text-neutral-200 font-medium max-w-2xl mx-auto leading-relaxed">
          Job.ai searches the live web, extracts real company career openings, deduplicates portal listings, and calculates transparent match scores for students and developers.
        </p>

        {/* 1-Click Demo Presets */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-neutral-800 dark:text-neutral-400 font-pixel mr-1 uppercase font-bold">Preset Searches:</span>
          {demoScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold bg-white dark:bg-neutral-900 text-black dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:shadow-xs transition-all flex items-center gap-1.5 group cursor-pointer"
            >
              <span>{sc.name}</span>
              <ArrowRight className="w-3 h-3 text-neutral-700 dark:text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Search Console Card - Pure White Backdrop in Light Mode */}
      <div className="twenty-card rounded-2xl p-5 sm:p-7 shadow-md bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 max-w-4xl mx-auto">
        <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="space-y-4">
          {/* Main Grid: Role & Location */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Role input */}
            <div className="md:col-span-7">
              <label className="block text-xs font-pixel text-black dark:text-neutral-200 mb-1.5 uppercase font-bold">
                JOB ROLE / TITLE <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineering Intern, Frontend Developer"
                  value={searchParams.role}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 text-sm font-semibold outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Location input */}
            <div className="md:col-span-5">
              <label className="block text-xs font-pixel text-black dark:text-neutral-200 mb-1.5 uppercase font-bold">
                LOCATION / WORK MODE
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Noida, Remote"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 text-sm font-semibold outline-none transition-all shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Experience level & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
            {/* Experience level selector */}
            <div className="md:col-span-5">
              <label className="block text-xs font-pixel text-black dark:text-neutral-200 mb-1.5 uppercase font-bold">
                EXPERIENCE LEVEL
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                {experienceLevels.map((lvl) => {
                  const active = searchParams.experience_level === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSearchParams(prev => ({ ...prev, experience_level: lvl.id }))}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        active
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keywords / Skills Tag input */}
            <div className="md:col-span-7">
              <label className="block text-xs font-pixel text-black dark:text-neutral-200 mb-1.5 uppercase font-bold">
                SKILLS (Press Enter to add)
              </label>
              <div className="min-h-[42px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus-within:border-black dark:focus-within:border-white focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white flex flex-wrap items-center gap-1.5 transition-all shadow-xs">
                <Code className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0 ml-1" />
                {searchParams.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-black dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 text-xs font-mono-code font-bold"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="hover:text-rose-600 dark:hover:text-rose-400 text-neutral-700 dark:text-neutral-400 text-xs leading-none cursor-pointer font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={searchParams.keywords.length === 0 ? "e.g. Python, React, AI..." : "Add skill..."}
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleAddKeyword}
                  className="bg-transparent text-black dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 text-xs outline-none flex-1 min-w-[90px] py-1 px-1 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Quick Skill Suggestion Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
            <span className="text-[11px] font-pixel text-neutral-800 dark:text-neutral-400 mr-1 uppercase font-bold">QUICK ADD:</span>
            {suggestedSkills.map((sk) => {
              const isIncluded = searchParams.keywords.includes(sk);
              if (isIncluded) return null;
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => setSearchParams(prev => ({ ...prev, keywords: [...prev.keywords, sk] }))}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-[11px] font-mono-code font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  +{sk}
                </button>
              );
            })}
          </div>

          {/* Advanced toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs font-pixel text-neutral-900 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer uppercase font-bold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide advanced filters' : 'More filters (Target Company, Browser Agent)'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-800 mt-2">
              <div className="md:col-span-6">
                <label className="block text-xs font-pixel text-black dark:text-neutral-200 mb-1 uppercase font-bold">
                  TARGET COMPANY (OPTIONAL)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <input
                    type="text"
                    placeholder="e.g. Google, Swiggy, Razorpay"
                    value={searchParams.company || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-black dark:text-white placeholder-neutral-500 outline-none font-semibold shadow-xs"
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 self-end shadow-xs">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-neutral-900 dark:text-neutral-200" />
                  <div>
                    <p className="text-xs font-bold text-black dark:text-white">Deep Browser Automation</p>
                    <p className="text-[10px] text-neutral-700 dark:text-neutral-400 font-semibold">Enable autonomous navigation for complex dynamic SPAs</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={searchParams.use_agent_fallback || false}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, use_agent_fallback: e.target.checked }))}
                  className="rounded border-neutral-400 text-black focus:ring-black dark:bg-neutral-900 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !searchParams.role.trim()}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-pixel uppercase tracking-wide"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Researching Live Web...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Jobs & Internships</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
