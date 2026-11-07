import React, { useState } from 'react';
import { 
  Flame, 
  Shield, 
  UserCheck, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function HomeLanding({
  judges = [],
  onSelectJudgeToken,
  onNavigate,
}) {
  const [tokenInput, setTokenInput] = useState('');

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      onSelectJudgeToken(tokenInput.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 md:my-12 space-y-10 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-xs font-bold text-red-300 uppercase tracking-widest">
          <Flame className="w-4 h-4 text-red-500" />
          Official Dance Judging Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-display tracking-wider text-white leading-none">
          EVALUATE. SCORE. <span className="text-red-500">CROWN.</span>
        </h1>

        <p className="text-sm md:text-base text-[#a3a3a3] max-w-xl mx-auto font-normal">
          A high-performance scoring system engineered for blind evaluation, instant video playback, and real-time cross-judge tallying.
        </p>
      </div>

      {/* Main Role Cards (Judge Portal & Admin Dashboard only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Card 1: Judges */}
        <div className="p-6 md:p-8 rounded-2xl glass-card border border-white/10 hover:border-red-500/40 flex flex-col justify-between group transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-display tracking-wide text-white">
              JUDGE PORTAL
            </h3>
            <p className="text-xs text-[#a3a3a3] mt-2 mb-4 leading-relaxed">
              Score participants on your phone or laptop using your private judge token or direct link.
            </p>
          </div>

          <form onSubmit={handleTokenSubmit} className="space-y-2 mt-4">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste Judge Token"
              className="w-full glass-input p-3 text-xs font-mono"
            />
            <button
              type="submit"
              disabled={!tokenInput.trim()}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <span>Enter Judge Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Card 2: Admin Dashboard (Contains Exclusive Live Leaderboard) */}
        <div 
          onClick={() => onNavigate('admin')}
          className="p-6 md:p-8 rounded-2xl glass-card-interactive border border-white/10 hover:border-red-500/40 flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-display tracking-wide text-white">
              ADMIN DASHBOARD
            </h3>
            <p className="text-xs text-[#a3a3a3] mt-2 leading-relaxed">
              Access the live competition leaderboard, import spreadsheets, manage private judge links, freeze rounds, and export final Excel reports.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-red-400 group-hover:text-red-300">
            <span>Coordinator Login</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Judge Demo Selector */}
      {judges.length > 0 && (
        <div className="p-6 rounded-2xl glass-card border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-bold font-display tracking-wider text-white uppercase">
              Quick Judge Preview Links
            </h4>
          </div>
          <p className="text-xs text-[#a3a3a3] mb-4">
            Click below to instantly experience the competition as any of the registered judges:
          </p>

          <div className="flex flex-wrap gap-2.5">
            {judges.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => onSelectJudgeToken(j.token)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-600/20 hover:border-red-500/40 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-2 min-h-[40px]"
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Enter as {j.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#a3a3a3]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
