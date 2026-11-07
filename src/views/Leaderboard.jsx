import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Download, 
  AlertTriangle, 
  Sparkles, 
  Users, 
  ExternalLink 
} from 'lucide-react';
import { calculateCategoryLeaderboard } from '../utils/leaderboard';
import { getCriteriaForCategory, getMaxScoreForCategory } from '../config/criteria';
import { exportResultsToExcel } from '../utils/exporter';
import Confetti from '../components/Confetti';

export default function Leaderboard({
  entries = [],
  judges = [],
  scores = [],
  settings = {},
}) {
  const [selectedCategory, setSelectedCategory] = useState('SOLO');
  const [showConfetti, setShowConfetti] = useState(false);

  const criteria = getCriteriaForCategory(selectedCategory);
  const maxScore = getMaxScoreForCategory(selectedCategory);

  // Calculate live ranking
  const ranking = calculateCategoryLeaderboard({
    category: selectedCategory,
    entries,
    judges,
    scores,
  });

  const namesVisible = settings.namesVisible;

  // Handle Export to Excel
  const handleExport = () => {
    // Generate stats for all 3 categories
    const categoryStats = {
      SOLO: calculateCategoryLeaderboard({ category: 'SOLO', entries, judges, scores }),
      DUO: calculateCategoryLeaderboard({ category: 'DUO', entries, judges, scores }),
      TRIO: calculateCategoryLeaderboard({ category: 'TRIO', entries, judges, scores }),
    };

    exportResultsToExcel({ entries, judges, scores, categoryStats });
  };

  const triggerCelebration = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const top3 = ranking.slice(0, 3).filter((item) => item.judgeCount > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <Confetti trigger={showConfetti} />

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl glass-card border-red-500/25 bg-gradient-to-br from-red-950/30 via-black to-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-xs font-semibold text-red-300 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Official Real-Time Standings
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-wider text-white">
            COMPETITION LEADERBOARD
          </h1>
          <p className="text-xs md:text-sm text-[#a3a3a3] mt-1">
            Fair cross-judge average ranking with tie-break logic and 20% outlier audit.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={triggerCelebration}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-semibold text-white border border-white/10 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Celebrate</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs md:text-sm font-semibold text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="flex items-center gap-2 p-1 bg-black/60 rounded-2xl border border-white/10">
          {['SOLO', 'DUO', 'TRIO'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-display text-base tracking-wider transition-all min-h-[44px] ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-white/5'
              }`}
            >
              {cat} STANDINGS
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Silver - 2nd */}
          {top3[1] && (
            <div className="p-5 rounded-2xl glass-card border-neutral-400/30 bg-gradient-to-b from-neutral-900/40 to-black order-2 md:order-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-400/20 border border-neutral-400/50 flex items-center justify-center font-bold text-neutral-300">
                    2
                  </div>
                  <Medal className="w-6 h-6 text-neutral-300" />
                </div>
                <div className="text-xs uppercase text-[#a3a3a3] font-semibold">2nd Place</div>
                <h3 className="font-score text-2xl font-bold text-white mt-1">
                  {top3[1].entry.anonymousId}
                </h3>
                {namesVisible && (
                  <p className="text-xs text-red-300 font-semibold truncate mt-0.5">
                    {top3[1].entry.displayName}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-xs text-[#a3a3a3]">Avg Total</span>
                <span className="font-score text-3xl font-bold text-white">
                  {top3[1].averageTotal.toFixed(2)}
                  <span className="text-xs text-[#a3a3a3] font-sans"> / {maxScore}</span>
                </span>
              </div>
            </div>
          )}

          {/* Gold - 1st (Elevated center) */}
          {top3[0] && (
            <div className="p-6 rounded-2xl glass-elevated border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-black to-red-950/20 order-1 md:order-2 shadow-[0_0_35px_rgba(245,158,11,0.2)] md:-translate-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center font-bold text-amber-300 text-lg">
                    1
                  </div>
                  <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
                <div className="text-xs uppercase text-amber-400 font-bold tracking-wider">
                  Champion / 1st Place
                </div>
                <h3 className="font-score text-3xl font-bold text-amber-300 mt-1">
                  {top3[0].entry.anonymousId}
                </h3>
                {namesVisible && (
                  <p className="text-sm text-red-300 font-bold truncate mt-0.5">
                    {top3[0].entry.displayName}
                  </p>
                )}
              </div>
              <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-baseline justify-between">
                <span className="text-xs text-amber-200/80">Avg Total</span>
                <span className="font-score text-4xl font-bold text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                  {top3[0].averageTotal.toFixed(2)}
                  <span className="text-xs text-[#a3a3a3] font-sans"> / {maxScore}</span>
                </span>
              </div>
            </div>
          )}

          {/* Bronze - 3rd */}
          {top3[2] && (
            <div className="p-5 rounded-2xl glass-card border-amber-700/30 bg-gradient-to-b from-amber-950/10 to-black order-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-700/20 border border-amber-700/50 flex items-center justify-center font-bold text-amber-600">
                    3
                  </div>
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-xs uppercase text-[#a3a3a3] font-semibold">3rd Place</div>
                <h3 className="font-score text-2xl font-bold text-white mt-1">
                  {top3[2].entry.anonymousId}
                </h3>
                {namesVisible && (
                  <p className="text-xs text-red-300 font-semibold truncate mt-0.5">
                    {top3[2].entry.displayName}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-xs text-[#a3a3a3]">Avg Total</span>
                <span className="font-score text-3xl font-bold text-white">
                  {top3[2].averageTotal.toFixed(2)}
                  <span className="text-xs text-[#a3a3a3] font-sans"> / {maxScore}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Rankings Table */}
      <div className="rounded-2xl glass-card overflow-hidden border border-white/10">
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-bold tracking-wide text-white">
              {selectedCategory} Comprehensive Standings
            </h3>
            <span className="text-xs text-[#a3a3a3]">({ranking.length} participants)</span>
          </div>
          <div className="text-xs text-[#a3a3a3]">
            {namesVisible ? (
              <span className="text-red-400 font-semibold">Performer Names Revealed</span>
            ) : (
              <span>Blind Judging Active</span>
            )}
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="py-16 text-center text-[#a3a3a3]">
            No entries evaluated in this category yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[#a3a3a3] bg-white/[0.03] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Entry</th>
                  <th className="py-3 px-4 text-right">Avg Total</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="py-3 px-3 text-right hidden lg:table-cell">
                      {c.name.split(' ')[0]}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center">Judges</th>
                  <th className="py-3 px-4">Breakdown & Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ranking.map((row) => {
                  const hasOutliers = row.outliers && row.outliers.length > 0;
                  const isTop3 = row.rank <= 3 && row.judgeCount > 0;

                  return (
                    <tr
                      key={row.entry.id}
                      className={`hover:bg-white/[0.04] transition-colors ${
                        isTop3 ? 'bg-red-950/10' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-score ${
                            row.rank === 1
                              ? 'bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : row.rank === 2
                              ? 'bg-neutral-300 text-black font-extrabold'
                              : row.rank === 3
                              ? 'bg-amber-700 text-white font-extrabold'
                              : 'text-[#a3a3a3] bg-white/5'
                          }`}
                        >
                          {row.judgeCount > 0 ? row.rank : '-'}
                        </span>
                      </td>

                      {/* Entry ID & Name */}
                      <td className="py-4 px-4">
                        <div className="font-score text-lg font-bold text-white tracking-wide">
                          {row.entry.anonymousId}
                        </div>
                        {namesVisible && (
                          <div className="text-xs text-red-300 font-medium">
                            {row.entry.displayName}
                          </div>
                        )}
                        {row.tieBreakReason && (
                          <div className="text-[10px] text-amber-400 mt-0.5">
                            ⚡ {row.tieBreakReason}
                          </div>
                        )}
                      </td>

                      {/* Average Total */}
                      <td className="py-4 px-4 text-right">
                        <div className="font-score text-2xl font-bold text-red-500">
                          {row.judgeCount > 0 ? row.averageTotal.toFixed(2) : '--'}
                        </div>
                        <div className="text-[10px] text-[#737373]">/ {maxScore} max</div>
                      </td>

                      {/* Per-Criterion Averages */}
                      {criteria.map((c) => (
                        <td key={c.id} className="py-4 px-3 text-right hidden lg:table-cell">
                          <span className="font-mono text-xs text-[#fafafa]">
                            {row.judgeCount > 0 ? (row.criteriaAverages[c.id] || 0).toFixed(1) : '-'}
                          </span>
                        </td>
                      ))}

                      {/* Judges Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-mono">
                          <Users className="w-3 h-3 text-[#a3a3a3]" />
                          {row.judgeCount} / {judges.length}
                        </span>
                      </td>

                      {/* Breakdown Pills & Outlier Warning */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.judgeScores.map((js) => (
                            <span
                              key={js.judgeId}
                              title={`${js.judgeName}: ${js.total.toFixed(1)}${js.comment ? `\n"${js.comment}"` : ''}`}
                              className="px-2 py-0.5 rounded text-[11px] bg-black/60 border border-white/10 text-[#fafafa] font-mono cursor-help"
                            >
                              <span className="text-red-400 font-semibold">{js.judgeName.split(' ')[0]}:</span> {js.total.toFixed(1)}
                            </span>
                          ))}

                          {/* Outlier Warning Chip (>20% difference) */}
                          {hasOutliers && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-950/70 border border-amber-500/50 text-amber-300 font-medium cursor-help"
                              title={row.outliers.map((o) => `${o.judgeName} total (${o.total}) deviates ${Math.round(o.deviation * 100)}% from peer average (${o.peerAvg})`).join('\n')}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Outlier ({Math.round(row.outliers[0].deviation * 100)}% diff)</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
