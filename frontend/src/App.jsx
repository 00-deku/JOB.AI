import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import JobCard from './components/JobCard';
import FilterBar from './components/FilterBar';
import SavedJobsModal from './components/SavedJobsModal';
import HistoryModal from './components/HistoryModal';
import ApiKeyModal from './components/ApiKeyModal';
import {
  AlertCircle,
  Inbox,
  Search,
  Key
} from 'lucide-react';

export default function App() {
  // Theme state: dark or light mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('jobai_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return true; // default dark
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jobai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jobai_theme', 'light');
    }
  }, [isDarkMode]);

  // TinyBounties.com-style circular ripple View Transition
  const toggleTheme = (event) => {
    const isDark = document.documentElement.classList.contains('dark');
    const nextTheme = !isDark;

    // Check if View Transition API is supported
    if (!document.startViewTransition) {
      setIsDarkMode(nextTheme);
      return;
    }

    // Get click coordinates (or default to button area near top right)
    const x = event?.clientX ?? window.innerWidth - 60;
    const y = event?.clientY ?? 32;

    // Radius to cover the entire viewport from click origin
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setIsDarkMode(nextTheme);
      if (nextTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('jobai_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('jobai_theme', 'light');
      }
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ],
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    role: '',
    location: 'Bengaluru',
    experience_level: 'Internship',
    keywords: ['Python', 'Git'],
    company: '',
    use_agent_fallback: false
  });

  // Results & Pipeline data
  const [results, setResults] = useState([]);
  const [queryId, setQueryId] = useState('');
  const [searchTime, setSearchTime] = useState(0);

  // Status & App State
  const [systemStatus, setSystemStatus] = useState(null);
  const [demoScenarios, setDemoScenarios] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('match_score');
  const [filterOfficialOnly, setFilterOfficialOnly] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(0);

  // Modals state
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch initial app status, demo scenarios, and saved jobs
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.warn('Backend status check failed:', e);
    }
  };

  const fetchScenarios = async () => {
    try {
      const res = await fetch('/api/demo/scenarios');
      if (res.ok) {
        const data = await res.json();
        setDemoScenarios(data);
      }
    } catch (e) {
      console.warn('Failed to load demo scenarios:', e);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch('/api/jobs/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedJobs(data);
      }
    } catch (e) {
      console.warn('Failed to load saved jobs:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchScenarios();
    fetchSavedJobs();
    fetchHistory();
  }, []);

  // Execute Search
  const handleSearch = async (overrideParams = null) => {
    const paramsToUse = overrideParams || searchParams;
    if (!paramsToUse.role.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramsToUse),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Search execution failed');
      }

      setResults(data.results || []);
      setQueryId(data.query_id || '');
      setSearchTime(data.search_time_seconds || 0);

      // Refresh history list
      fetchHistory();
    } catch (err) {
      console.error('Job search error:', err);
      setSearchError(err.message || 'An unexpected error occurred while performing search.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scenario selection preset
  const handleSelectScenario = (scenario) => {
    const newParams = {
      role: scenario.role,
      location: scenario.location,
      experience_level: scenario.experience_level,
      keywords: scenario.keywords,
      company: '',
      use_agent_fallback: false
    };
    setSearchParams(newParams);
    handleSearch(newParams);
  };

  // Re-run from history
  const handleSelectHistory = (item) => {
    const keywordsArray = item.keywords ? item.keywords.split(',').map(s => s.trim()).filter(Boolean) : [];
    const newParams = {
      role: item.role,
      location: item.location,
      experience_level: item.experience_level || 'Internship',
      keywords: keywordsArray,
      company: '',
      use_agent_fallback: false
    };
    setSearchParams(newParams);
    setIsHistoryOpen(false);
    handleSearch(newParams);
  };

  // Save / Bookmark job toggle
  const handleSaveJob = async (job) => {
    const isAlreadySaved = savedJobs.some(item => item.job.apply_url === job.apply_url || (item.job.title === job.title && item.job.company === job.company));
    if (isAlreadySaved) {
      const existing = savedJobs.find(item => item.job.apply_url === job.apply_url || (item.job.title === job.title && item.job.company === job.company));
      if (existing) {
        await handleRemoveSavedJob(existing.id);
      }
      return;
    }

    try {
      const res = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      if (res.ok) {
        await fetchSavedJobs();
      }
    } catch (e) {
      console.error('Failed to save job:', e);
    }
  };

  const handleRemoveSavedJob = async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/saved/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedJobs(prev => prev.filter(item => item.id !== jobId));
      }
    } catch (e) {
      console.error('Failed to remove saved job:', e);
    }
  };

  // Save API key via modal
  const handleSaveApiKey = async (newKey) => {
    const res = await fetch('/api/settings/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: newKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update key');
    }
    await fetchStatus();
    return data;
  };

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let list = [...results];

    // Official filter
    if (filterOfficialOnly) {
      list = list.filter(j => j.is_official);
    }

    // Min match score filter
    if (minMatchScore > 0) {
      list = list.filter(j => j.match_score >= minMatchScore);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'match_score') {
        return b.match_score - a.match_score;
      } else if (sortBy === 'company') {
        return a.company.localeCompare(b.company);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [results, filterOfficialOnly, minMatchScore, sortBy]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'pixel-grid-dark text-neutral-100' : 'pixel-grid-light text-neutral-900'}`}>
      {/* Navbar without API settings button or audit logs */}
      <Navbar
        savedCount={savedJobs.length}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Hero Section & Search Console */}
        <HeroSection
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          onSearch={() => handleSearch()}
          isLoading={isLoading}
          demoScenarios={demoScenarios}
          onSelectScenario={handleSelectScenario}
        />

        {/* Results Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Active Loading State */}
          {isLoading && (
            <div className="twenty-card rounded-2xl p-12 text-center max-w-xl mx-auto bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 shadow-md">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                <Search className="w-6 h-6 animate-spin text-black dark:text-neutral-100" />
              </div>
              <h3 className="text-xl font-black font-pixel text-black dark:text-white mb-2 uppercase">
                Exploring Live Openings...
              </h3>
              <p className="text-xs text-neutral-800 dark:text-neutral-400 font-mono-code max-w-md mx-auto font-medium">
                Running live web discovery, reading official career portals, deduplicating records, and calculating transparent match scores.
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && searchError && (
            <div className="twenty-card rounded-2xl p-8 text-center max-w-xl mx-auto border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-rose-950/20 shadow-md">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-pixel text-black dark:text-rose-200 mb-1 uppercase">
                Search Discovery Interrupted
              </h3>
              <p className="text-xs text-rose-900 dark:text-rose-300 font-mono-code mb-4 font-semibold">
                {searchError}
              </p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black transition-colors inline-flex items-center gap-1.5 font-pixel uppercase cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Configure API Key</span>
              </button>
            </div>
          )}

          {/* Results Display */}
          {!isLoading && !searchError && hasSearched && (
            <div>
              {/* Filter & Sort Bar */}
              <FilterBar
                totalResults={results.length}
                filteredCount={filteredAndSortedResults.length}
                searchTime={searchTime}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterOfficialOnly={filterOfficialOnly}
                setFilterOfficialOnly={setFilterOfficialOnly}
                minMatchScore={minMatchScore}
                setMinMatchScore={setMinMatchScore}
              />

              {/* Job Listings Grid */}
              {filteredAndSortedResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredAndSortedResults.map((job, idx) => {
                    const isSaved = savedJobs.some(
                      item => item.job.apply_url === job.apply_url || (item.job.title === job.title && item.job.company === job.company)
                    );
                    return (
                      <JobCard
                        key={idx}
                        job={job}
                        onSave={handleSaveJob}
                        isSaved={isSaved}
                      />
                    );
                  })}
                </div>
              ) : (
                /* No Results State */
                <div className="twenty-card rounded-2xl p-12 text-center max-w-xl mx-auto bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 shadow-md">
                  <Inbox className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                  <h3 className="text-lg font-black font-pixel text-black dark:text-white mb-1 uppercase">
                    No Matching Openings Found
                  </h3>
                  <p className="text-xs text-neutral-800 dark:text-neutral-400 leading-relaxed mb-4 font-medium">
                    The live web search completed, but no listings matched your active filters. Try relaxing the location or minimum score filter.
                  </p>
                  {(filterOfficialOnly || minMatchScore > 0) && (
                    <button
                      onClick={() => { setFilterOfficialOnly(false); setMinMatchScore(0); }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-pixel bg-black hover:bg-neutral-800 dark:bg-neutral-800 text-white border border-black dark:border-neutral-700 uppercase cursor-pointer font-bold shadow-xs"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Initial State / Welcome Prompt */}
          {!isLoading && !hasSearched && (
            <div className="twenty-card rounded-2xl p-8 sm:p-10 text-center max-w-2xl mx-auto bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 shadow-md mt-2">
              <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-black font-pixel text-black dark:text-white mb-2 uppercase">
                Ready to Discover
              </h3>
              <p className="text-xs text-neutral-800 dark:text-neutral-400 max-w-md mx-auto leading-relaxed mb-6 font-mono-code font-semibold">
                Enter your desired career role above, or select a preset search to initiate live agent discovery across verified career boards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {demoScenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 hover:border-black dark:hover:border-neutral-600 transition-all group cursor-pointer shadow-xs"
                  >
                    <p className="text-xs font-bold text-black dark:text-white font-mono-code">
                      {sc.name}
                    </p>
                    <p className="text-[11px] text-neutral-700 dark:text-neutral-400 mt-1 line-clamp-2 font-medium">
                      {sc.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <SavedJobsModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedJobs={savedJobs}
        onRemove={handleRemoveSavedJob}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        onSelectHistory={handleSelectHistory}
      />

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentStatus={systemStatus}
        onSaveKey={handleSaveApiKey}
      />

      {/* Footer matching exact request: Made with ❤️ by TechnoJam × TinyFish */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 bg-white dark:bg-[#0c0d0e] text-center text-xs text-black dark:text-neutral-300 font-mono-code transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-bold text-black dark:text-neutral-100">
            <span>Made with ❤️ by TechnoJam × TinyFish</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-400 text-[11px] font-pixel uppercase font-bold">
            <span>Job.ai</span>
            <span>•</span>
            <span>Live Web Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
