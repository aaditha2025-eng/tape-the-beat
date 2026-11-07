import React, { useState } from 'react';
import { 
  UserCheck, 
  Lock, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  Sparkles, 
  Flame 
} from 'lucide-react';
import { getMaxScoreForCategory } from '../config/criteria';

export default function JudgeHome({
  judge,
  entries = [],
  scores = [],
  settings = {},
  onSelectEntry,
  onOpenLeaderboard,
}) {
  const [selectedCategory, setSelectedCategory] = useState('SOLO');

  // If judge is invalid or revoked
  if (!judge || !judge.active) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl glass-card text-center border-red-500/30">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold font-display text-white">Invalid or Revoked Link</h2>
        <p className="text-sm text-[#a3a3a3] mt-2 mb-6">
          This judging portal link is either expired, revoked, or incorrect. Please contact the competition coordinator for a new link.
        </p>
        <div className="p-3 bg-red-950/30 rounded-xl border border-red-500/20 text-xs text-red-300">
          Token: <code className="font-mono">{judge ? judge.token : 'null'}</code>
        </div>
      </div>
    );
  }

  // Filter entries by category
  const categoryEntries = entries.filter(
    (e) => (e.category || 'SOLO').toUpperCase() === selectedCategory && !e.isExcluded
  );

  // Judge's scores for this category
  const judgeScoresMap = new Map();
  scores
    .filter((s) => s.judgeId === judge.id)
    .forEach((s) => judgeScoresMap.set(s.entryId, s));

  const totalEntries = categoryEntries.length;
  const scoredCount = categoryEntries.filter((e) => judgeScoresMap.has(e.id)).length;
  const progressPercent = totalEntries > 0 ? Math.round((scoredCount / totalEntries) * 100) : 0;

  const isLocked = settings.lockedCategories && settings.lockedCategories[selectedCategory];
  const maxScore = getMaxScoreForCategory(selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-2xl glass-card border-red-500/20 bg-gradient-to-r from-red-950/20 via-black to-red-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame className="w-48 h-48 text-red-500" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-xs font-semibold text-red-300 mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              Authenticated Judge
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-wide text-white">
              Welcome, {judge.name}
            </h1>
            <p className="text-xs md:text-sm text-[#a3a3a3] mt-1">
              Blind scoring mode active. Review participant videos and submit your criteria scores.
            </p>
          </div>

          {/* Quick Round Progress Box */}
          <div className="bg-black/60 p-4 rounded-xl border border-white/10 shrink-0 min-w-[200px]">
            <div className="flex items-center justify-between text-xs text-[#a3a3a3] mb-1.5">
              <span>{selectedCategory} Progress</span>
              <span className="font-semibold text-white">
                {scoredCount} of {totalEntries} scored
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.7)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1.5 text-right text-[11px] font-bold text-red-400">
              {progressPercent}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 bg-black/50 rounded-2xl border border-white/10">
          {['SOLO', 'DUO', 'TRIO'].map((cat) => {
            const count = entries.filter((e) => (e.category || 'SOLO').toUpperCase() === cat && !e.isExcluded).length;
            const completed = entries
              .filter((e) => (e.category || 'SOLO').toUpperCase() === cat && !e.isExcluded)
              .filter((e) => judgeScoresMap.has(e.id)).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl font-display text-sm md:text-base tracking-wider transition-all min-h-[44px] flex items-center gap-2 ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat}</span>
                <span className="text-xs font-sans opacity-80">
                  ({completed}/{count})
                </span>
              </button>
            );
          })}
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>{selectedCategory} Round is Locked by Admin</span>
          </div>
        )}
      </div>

      {/* Entries Grid */}
      {categoryEntries.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-card p-6">
          <AlertCircle className="w-12 h-12 text-[#a3a3a3] mx-auto mb-3 opacity-50" />
          <h3 className="text-xl font-bold font-display text-white">No Entries in {selectedCategory}</h3>
          <p className="text-xs text-[#a3a3a3] mt-1 max-w-sm mx-auto">
            The organizer has not uploaded or approved entries for this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryEntries.map((entry) => {
            const scoreObj = judgeScoresMap.get(entry.id);
            const isScored = Boolean(scoreObj);

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry.id)}
                className="group relative p-5 rounded-2xl glass-card-interactive cursor-pointer border border-white/10 hover:border-red-500/40 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Anonymous ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-score text-2xl font-bold tracking-wider text-red-500 group-hover:text-red-400 transition-colors">
                      {entry.anonymousId}
                    </span>

                    {isScored ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Scored ({scoreObj.total.toFixed(1)} / {maxScore})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#a3a3a3]">
                        <Clock className="w-3 h-3" />
                        Not Scored
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div className="text-xs text-[#a3a3a3] font-medium mb-3">
                    Category: <span className="text-white font-semibold">{entry.category}</span>
                  </div>

                  {/* Video indicator */}
                  <div className="text-xs text-[#737373] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    <span>Video submission attached</span>
                  </div>
                </div>

                {/* Bottom Row / CTA */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-red-400 group-hover:text-red-300 transition-colors">
                  <span>{isScored ? 'Edit Score' : 'Score Performance'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
