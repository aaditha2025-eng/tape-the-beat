import React from 'react';
import { Minus, Plus, HelpCircle } from 'lucide-react';

/**
 * ScoreSlider Component
 * Allows judges to slide or step between 1.0 and 10.0 in 0.5 increments.
 * Features large confident score numeral, sleek red slider track, and >= 44px touch targets.
 */
export default function ScoreSlider({
  criterion,
  value,
  onChange,
  disabled = false,
}) {
  const currentVal = value !== undefined && value !== null ? Number(value) : null;
  const isScored = currentVal !== null;
  const displayVal = isScored ? currentVal.toFixed(1) : '--';

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    onChange(val);
  };

  const handleStep = (delta) => {
    if (disabled) return;
    const base = isScored ? currentVal : 5.0;
    const nextVal = Math.min(10.0, Math.max(1.0, Math.round((base + delta) * 2) / 2));
    onChange(nextVal);
  };

  // Color gradient for the score number: from warm red (1-4) to vivid red (5-8) to glowing crimson (9-10)
  const getScoreColor = () => {
    if (!isScored) return 'text-[#a3a3a3]';
    if (currentVal >= 9.0) return 'text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.7)]';
    if (currentVal >= 7.0) return 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    if (currentVal >= 5.0) return 'text-red-600';
    return 'text-[#fafafa]';
  };

  return (
    <div className={`p-4 md:p-5 rounded-2xl glass-card transition-all duration-200 ${isScored ? 'border-red-500/25 bg-red-950/10' : 'border-white/10'}`}>
      {/* Header: Title, Description, and Score Display */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base md:text-lg font-semibold text-[#fafafa] tracking-wide">
              {criterion.name}
            </h4>
            {criterion.description && (
              <span className="text-xs text-[#a3a3a3] hidden sm:inline" title={criterion.description}>
                ({criterion.description})
              </span>
            )}
          </div>
          {criterion.description && (
            <p className="text-xs text-[#a3a3a3] mt-0.5 sm:hidden line-clamp-1">
              {criterion.description}
            </p>
          )}
        </div>

        {/* Big Confident Score Numeral */}
        <div className="flex items-baseline gap-1 bg-black/40 px-3 py-1 rounded-xl border border-white/5">
          <span className={`text-3xl md:text-4xl font-bold font-score transition-colors duration-150 ${getScoreColor()}`}>
            {displayVal}
          </span>
          <span className="text-xs text-[#a3a3a3] font-medium">/ 10</span>
        </div>
      </div>

      {/* Slider Controls with Quick Steppers */}
      <div className="flex items-center gap-3 mt-4">
        {/* Decrement Button (-0.5) */}
        <button
          type="button"
          onClick={() => handleStep(-0.5)}
          disabled={disabled || (isScored && currentVal <= 1.0)}
          aria-label="Decrease score by 0.5"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 disabled:opacity-30 disabled:pointer-events-none text-white transition-all"
        >
          <Minus className="w-4 h-4 text-red-400" />
        </button>

        {/* 1 to 10 Range Slider */}
        <div className="flex-1 px-1 relative">
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.5"
            value={isScored ? currentVal : 5.0}
            onChange={handleSliderChange}
            disabled={disabled}
            className="score-slider w-full cursor-pointer h-3"
            aria-label={`${criterion.name} score slider`}
          />
          {/* Micro ticks at 1, 5, 10 */}
          <div className="flex justify-between text-[10px] text-[#737373] mt-1.5 font-mono px-0.5 select-none">
            <span>1.0</span>
            <span>2.5</span>
            <span className="text-red-400/80 font-bold">5.0</span>
            <span>7.5</span>
            <span className="text-red-400/80 font-bold">10.0</span>
          </div>
        </div>

        {/* Increment Button (+0.5) */}
        <button
          type="button"
          onClick={() => handleStep(0.5)}
          disabled={disabled || (isScored && currentVal >= 10.0)}
          aria-label="Increase score by 0.5"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 disabled:opacity-30 disabled:pointer-events-none text-white transition-all"
        >
          <Plus className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
