import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  RotateCcw, 
  X, 
  Upload, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';

export default function EntryReviewModal({
  parsedEntries = [],
  onConfirm,
  onCancel,
}) {
  const [entries, setEntries] = useState(parsedEntries);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'flagged', 'duplicates', 'valid'

  const validEntries = entries.filter((e) => !e.isFlagged && !e.isDuplicate && !e.isExcluded);
  const flaggedEntries = entries.filter((e) => e.isFlagged && !e.isDuplicate);
  const duplicateEntries = entries.filter((e) => e.isDuplicate);
  const excludedEntries = entries.filter((e) => e.isExcluded);

  const toggleExclude = (tempId) => {
    setEntries((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, isExcluded: !e.isExcluded } : e))
    );
  };

  const removeEntry = (tempId) => {
    setEntries((prev) => prev.filter((e) => e.tempId !== tempId));
  };

  const activeCount = entries.filter((e) => !e.isExcluded).length;

  const displayedList = entries.filter((e) => {
    if (activeTab === 'valid') return !e.isFlagged && !e.isDuplicate && !e.isExcluded;
    if (activeTab === 'flagged') return e.isFlagged && !e.isDuplicate;
    if (activeTab === 'duplicates') return e.isDuplicate;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl glass-elevated border border-white/15 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-red-950/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white uppercase tracking-wider">
                Import Review
              </span>
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-wide text-white">
                Verify Spreadsheet Submissions
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#a3a3a3] mt-1">
              Review flagged items and deduplicated submissions before assigning blind competition IDs.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-[#a3a3a3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary & Filter Tabs */}
        <div className="p-4 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[38px] ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-[#a3a3a3]'
              }`}
            >
              All ({entries.length})
            </button>

            <button
              onClick={() => setActiveTab('valid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[38px] flex items-center gap-1.5 ${
                activeTab === 'valid'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid ({validEntries.length})
            </button>

            <button
              onClick={() => setActiveTab('flagged')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[38px] flex items-center gap-1.5 ${
                activeTab === 'flagged'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-amber-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Flagged ({flaggedEntries.length})
            </button>

            <button
              onClick={() => setActiveTab('duplicates')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[38px] flex items-center gap-1.5 ${
                activeTab === 'duplicates'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-purple-400'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicates ({duplicateEntries.length})
            </button>
          </div>

          <div className="text-xs text-[#a3a3a3]">
            <span className="font-semibold text-white">{activeCount}</span> of {entries.length} will be imported
          </div>
        </div>

        {/* Scrollable Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayedList.length === 0 ? (
            <div className="py-12 text-center text-[#a3a3a3] text-sm">
              No entries found in this tab.
            </div>
          ) : (
            displayedList.map((entry) => {
              const hasFlags = entry.flags && entry.flags.length > 0;

              return (
                <div
                  key={entry.tempId}
                  className={`p-4 rounded-xl border transition-all ${
                    entry.isExcluded
                      ? 'opacity-40 bg-black/30 border-white/5'
                      : entry.isDuplicate
                      ? 'bg-purple-950/15 border-purple-500/30'
                      : hasFlags
                      ? 'bg-amber-950/15 border-amber-500/30'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white">
                          Row #{entry.originalRowIndex}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600/30 text-red-300 border border-red-500/40">
                          {entry.category}
                        </span>
                        <h4 className="text-base font-semibold text-white">
                          {entry.displayName}
                        </h4>
                        {entry.primaryRegNo && (
                          <span className="text-xs font-mono text-[#a3a3a3] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                            {entry.primaryRegNo}
                          </span>
                        )}
                      </div>

                      {/* Flag warnings */}
                      {hasFlags && (
                        <div className="mt-2 space-y-1">
                          {entry.flags.map((f, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1.5 text-xs font-medium ${
                                f.type === 'duplicate'
                                  ? 'text-purple-300'
                                  : 'text-amber-300'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{f.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Video Link & Contact */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[#a3a3a3] flex-wrap">
                        {entry.mainVideo ? (
                          <a
                            href={entry.mainVideo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 truncate max-w-xs underline"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {entry.mainVideo}
                          </a>
                        ) : (
                          <span className="text-red-400 font-medium">No video URL</span>
                        )}
                        {entry.primaryPhone && <span>📞 {entry.primaryPhone}</span>}
                        {entry.primaryEmail && <span>✉️ {entry.primaryEmail}</span>}
                      </div>
                    </div>

                    {/* Actions: Exclude / Restore / Remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExclude(entry.tempId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[38px] flex items-center gap-1.5 ${
                          entry.isExcluded
                            ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-[#a3a3a3] border border-white/10'
                        }`}
                      >
                        {entry.isExcluded ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </>
                        ) : (
                          'Skip Entry'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEntry(entry.tempId)}
                        title="Delete permanently from import"
                        className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#a3a3a3] text-center sm:text-left">
            Confirming will automatically assign anonymous IDs (S-01, D-01, T-01) and publish them to the judging portal.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onConfirm(entries.filter((e) => !e.isExcluded))}
              disabled={activeCount === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all min-h-[44px] flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Confirm & Import ({activeCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
