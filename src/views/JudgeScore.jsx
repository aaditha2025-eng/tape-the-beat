import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Check, 
  AlertTriangle, 
  Lock, 
  WifiOff, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import ScoreSlider from '../components/ScoreSlider';
import { 
  getCriteriaForCategory, 
  getMaxScoreForCategory, 
  JUDGING_CONFIG 
} from '../config/criteria';
import { saveScore } from '../lib/firebase';

export default function JudgeScore({
  entry,
  judge,
  existingScore,
  allCategoryEntries = [],
  settings = {},
  isOnline = true,
  onBack,
  onNavigateEntry,
}) {
  const category = (entry.category || 'SOLO').toUpperCase();
  const criteria = getCriteriaForCategory(category);
  const maxScore = getMaxScoreForCategory(category);

  const isLocked = settings.lockedCategories && settings.lockedCategories[category];

  // State for criteria scores: { [criterionId]: number }
  const [scores, setScores] = useState(() => {
    if (existingScore && existingScore.criteriaScores) {
      return { ...existingScore.criteriaScores };
    }
    return {};
  });

  const [comment, setComment] = useState(existingScore ? existingScore.comment || '' : '');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [validationWarning, setValidationWarning] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  const autoSaveTimerRef = useRef(null);

  // When entry changes, reset or load existing score
  useEffect(() => {
    if (existingScore && existingScore.criteriaScores) {
      setScores({ ...existingScore.criteriaScores });
      setComment(existingScore.comment || '');
    } else {
      setScores({});
      setComment('');
    }
    setSaveStatus('idle');
    setValidationWarning('');
  }, [entry.id, existingScore]);

  // Calculate live running total
  const runningTotal = criteria.reduce((sum, c) => {
    const val = scores[c.id];
    return sum + (val !== undefined && val !== null ? Number(val) : 0);
  }, 0);

  // Check if all applicable criteria have been assigned a score
  const unscoredCriteria = criteria.filter(
    (c) => scores[c.id] === undefined || scores[c.id] === null
  );
  const isFullyScored = unscoredCriteria.length === 0;

  // Handle score slider change
  const handleScoreChange = (criterionId, val) => {
    if (isLocked) return;

    setScores((prev) => {
      const updated = { ...prev, [criterionId]: val };
      
      // Debounced local draft save
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        try {
          const draftKey = `dance_draft_${judge.id}_${entry.id}`;
          localStorage.setItem(draftKey, JSON.stringify({
            criteriaScores: updated,
            comment,
            updatedAt: new Date().toISOString(),
          }));
          setDraftSaved(true);
          setTimeout(() => setDraftSaved(false), 2000);
        } catch (e) {
          console.error('Draft save error:', e);
        }
      }, 500);

      return updated;
    });

    setValidationWarning('');
  };

  // Explicit Save Score
  const handleSave = async (moveToNext = false) => {
    if (isLocked) return;

    if (!isFullyScored) {
      const missingNames = unscoredCriteria.map((c) => c.name).join(', ');
      setValidationWarning(`Please score all criteria before submitting: missing (${missingNames})`);
      return;
    }

    setSaveStatus('saving');
    try {
      await saveScore(judge.id, entry.id, {
        criteriaScores: scores,
        total: runningTotal,
        comment: comment.trim(),
      });
      setSaveStatus('saved');
      setValidationWarning('');

      // Clear draft
      localStorage.removeItem(`dance_draft_${judge.id}_${entry.id}`);

      if (moveToNext) {
        setTimeout(() => {
          handleNext();
        }, 600);
      } else {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Save score error:', err);
      setSaveStatus('error');
    }
  };

  // Find previous and next entry IDs
  const currentIndex = allCategoryEntries.findIndex((e) => e.id === entry.id);
  const prevEntry = currentIndex > 0 ? allCategoryEntries[currentIndex - 1] : null;
  const nextEntry = currentIndex < allCategoryEntries.length - 1 ? allCategoryEntries[currentIndex + 1] : null;

  const handlePrev = () => {
    if (prevEntry) onNavigateEntry(prevEntry.id);
  };

  const handleNext = () => {
    if (nextEntry) onNavigateEntry(nextEntry.id);
  };

  return (
    <div className="pb-32 space-y-6 animate-in fade-in duration-200">
      {/* Top Bar: Back button, Entry Anonymous ID, Status */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs md:text-sm text-[#fafafa] border border-white/10 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Entries</span>
        </button>

        {/* Anonymous ID Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-score text-2xl md:text-3xl font-bold tracking-wider text-red-500">
              {entry.anonymousId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-600/30 text-red-300 border border-red-500/40">
              {category}
            </span>
          </div>
          <p className="text-[11px] text-[#a3a3a3]">Blind Evaluation Mode</p>
        </div>

        {/* Category Round Locked Warning */}
        {isLocked ? (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Round Locked</span>
          </div>
        ) : (
          <div className="text-right text-xs text-[#a3a3a3]">
            {draftSaved && <span className="text-emerald-400 font-medium">Draft autosaved</span>}
          </div>
        )}
      </div>

      {/* Offline banner if disconnected */}
      {!isOnline && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline — Your scores are safely saved to your phone/laptop local storage and will sync upon reconnection.</span>
        </div>
      )}

      {/* 1. Large Embedded Video on Top */}
      <div>
        <VideoPlayer
          videoUrl={entry.mainVideo}
          videoLinks={entry.videoLinks || []}
          entryId={entry.anonymousId}
        />
      </div>

      {/* 2. Validation Warning alert if incomplete on submit */}
      {validationWarning && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs md:text-sm flex items-start gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Missing Criteria</span>
            <span>{validationWarning}</span>
          </div>
        </div>
      )}

      {/* 3. Criteria Scoring Sliders (1 to 10 in 0.5 steps) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-lg font-bold font-display tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            Official Scoring Criteria (1.0 to 10.0)
          </h3>
          <span className="text-xs text-[#a3a3a3]">
            {criteria.length - unscoredCriteria.length} of {criteria.length} criteria completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteria.map((c) => (
            <ScoreSlider
              key={c.id}
              criterion={c}
              value={scores[c.id]}
              onChange={(val) => handleScoreChange(c.id, val)}
              disabled={isLocked}
            />
          ))}
        </div>
      </div>

      {/* 4. Optional Judge Comments */}
      <div className="p-4 md:p-5 rounded-2xl glass-card border-white/10">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#fafafa] mb-2">
          <MessageSquare className="w-4 h-4 text-red-400" />
          Judge Feedback & Comments (Optional)
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isLocked}
          placeholder="Constructive feedback, technical observations, standout moments..."
          className="w-full glass-input p-3 text-sm placeholder:text-[#737373] resize-none"
        />
      </div>

      {/* 5. Sticky Translucent Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-3 md:p-4 glass-elevated border-t border-white/15">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={!prevEntry}
            aria-label="Previous Entry"
            className="px-3 md:px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-20 disabled:pointer-events-none text-xs md:text-sm font-semibold text-white border border-white/10 transition-all flex items-center gap-1.5 min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Running Total Live Display */}
          <div className="flex items-baseline gap-1.5 bg-black/60 px-4 py-2 rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.25)]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#a3a3a3]">
              Total:
            </span>
            <span className="font-score text-2xl md:text-3xl font-bold text-red-500">
              {runningTotal.toFixed(1)}
            </span>
            <span className="text-xs text-[#a3a3a3]">/ {maxScore}</span>
          </div>

          {/* Save & Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isLocked || saveStatus === 'saving'}
              className={`px-4 md:px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all min-h-[44px] flex items-center gap-2 active:scale-95 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-red-600 hover:bg-red-500 disabled:opacity-40'
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved ✓</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>

            {nextEntry && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isLocked}
                title="Save & Proceed to next participant"
                className="px-3 md:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs md:text-sm font-semibold text-white border border-white/10 transition-all flex items-center gap-1 min-h-[44px]"
              >
                <span className="hidden sm:inline">Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
