import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  Bookmark,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function JobCard({ job, onSave, isSaved }) {
  const [showAllReasons, setShowAllReasons] = useState(false);

  // Score styling logic
  const getScoreBadge = (score) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-400 font-bold',
        label: 'Top Match'
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-400 font-bold',
        label: 'Strong Match'
      };
    } else {
      return {
        bg: 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-black dark:text-neutral-200 font-bold',
        label: 'Good Match'
      };
    }
  };

  const badge = getScoreBadge(job.match_score);

  // Source extraction tool label (no TinyFish mention in UI)
  const getSourceBadge = (src) => {
    switch (src) {
      case 'tinyfish_fetch':
        return { label: 'Verified Page', color: 'text-black dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700' };
      case 'tinyfish_agent':
        return { label: 'Browser Agent', color: 'text-purple-950 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/15 border-purple-500/40' };
      default:
        return { label: 'Web Discovery', color: 'text-black dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700' };
    }
  };

  const sourceBadge = getSourceBadge(job.extraction_source);

  // Hostname for display
  let host = 'Career Portal';
  try {
    host = new URL(job.source_url).hostname.replace('www.', '');
  } catch (e) {
    host = job.source_url || 'Career Site';
  }

  return (
    <div className="twenty-card rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-sm hover:border-black dark:hover:border-neutral-600 transition-all">
      <div>
        {/* Top Header: Company, Location, Match Score & Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-black dark:text-neutral-100">
                <Building2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-400" />
                {job.company}
              </span>

              {job.is_official && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-pixel bg-emerald-50 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-400 border border-emerald-500/40 uppercase font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                  Official ATS
                </span>
              )}

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-pixel border uppercase font-bold ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight pt-1">
              {job.title}
            </h3>
          </div>

          {/* Match Score Badge & Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex flex-col items-end px-2.5 py-1.5 rounded-lg border ${badge.bg}`}>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-pixel uppercase opacity-90">Score:</span>
                <span className="text-sm font-black font-pixel">{job.match_score}%</span>
              </div>
              <span className="text-[9px] font-pixel uppercase opacity-95">{badge.label}</span>
            </div>

            <button
              onClick={() => onSave(job)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-800 hover:text-black dark:text-neutral-400 dark:hover:text-white border-neutral-300 dark:border-neutral-700 shadow-2xs'
              }`}
              title={isSaved ? "Saved to your list" : "Save this job"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Location & Experience tags */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-800 dark:text-neutral-300 my-3 font-mono-code font-semibold">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-400" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-400" />
            <span>{job.experience_level} • {job.role_type}</span>
          </div>
          {job.date_posted ? (
            <div className="flex items-center gap-1 text-emerald-900 dark:text-emerald-400 font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Posted: {job.date_posted}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date: Unspecified</span>
            </div>
          )}
        </div>

        {/* Short Job Description - High contrast black text */}
        <p className="text-sm text-neutral-900 dark:text-neutral-200 line-clamp-3 leading-relaxed mb-4 font-normal">
          {job.description}
        </p>

        {/* Skills & Keywords - Pure white cards with black text in light mode */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {job.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md text-xs font-mono-code font-bold bg-neutral-100 dark:bg-neutral-800 text-black dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Match score reasons breakdown */}
        {job.match_reasons && job.match_reasons.length > 0 && (
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4 text-xs font-mono-code">
            <div className="flex items-center justify-between text-neutral-800 dark:text-neutral-300 mb-2">
              <span className="flex items-center gap-1 font-pixel text-[10px] text-black dark:text-neutral-100 uppercase font-bold">
                <Sparkles className="w-3 h-3 text-neutral-700 dark:text-neutral-400" />
                Match Breakdown
              </span>
              {job.match_reasons.length > 2 && (
                <button
                  onClick={() => setShowAllReasons(!showAllReasons)}
                  className="text-[11px] text-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer font-bold underline"
                >
                  {showAllReasons ? 'Show less' : `+${job.match_reasons.length - 2} more`}
                </button>
              )}
            </div>
            <ul className="space-y-1.5">
              {(showAllReasons ? job.match_reasons : job.match_reasons.slice(0, 2)).map((reason, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-black dark:text-neutral-200 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer: Source link, timestamp, and prominent Apply button */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-400 font-mono-code text-[11px]">
            <span>Source:</span>
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black dark:text-neutral-100 hover:underline flex items-center gap-1 max-w-[200px] truncate font-bold"
            >
              {host}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-700 dark:text-neutral-400 font-mono-code font-semibold">
            <Clock className="w-3 h-3" />
            <span>Verified: {new Date(job.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Apply Now Button */}
        <a
          href={job.apply_url || job.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border border-black dark:border-white transition-all shadow-xs group/btn cursor-pointer font-pixel uppercase tracking-wide"
        >
          <span>Apply Now</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
