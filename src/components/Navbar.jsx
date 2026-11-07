import React from 'react';
import { Trophy, Shield, UserCheck, Flame, Wifi, WifiOff } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

export default function Navbar({
  currentView,
  onNavigate,
  activeJudge,
  isOnline = true,
  onOpenAdminLogin,
}) {
  return (
    <header className="sticky top-0 z-40 w-full glass-elevated border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl tracking-wider text-white font-bold leading-none">
                DANCE<span className="text-red-500">JUDGE</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-600/30 text-red-300 rounded border border-red-500/40 uppercase">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-[#a3a3a3] font-medium tracking-tight">
              Competition Scoring Portal
            </p>
          </div>
        </div>

        {/* Center / Navigation items */}
        <nav className="flex items-center gap-1 md:gap-2">
          {/* Active Judge status pill */}
          {activeJudge && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200">
              <UserCheck className="w-3.5 h-3.5 text-red-400" />
              <span className="font-semibold">{activeJudge.name}</span>
            </div>
          )}

          {/* Leaderboard Link */}
          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all min-h-[40px] ${
              currentView === 'leaderboard'
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-[#fafafa]'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden xs:inline">Leaderboard</span>
          </button>

          {/* Admin Dashboard */}
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all min-h-[40px] ${
              currentView === 'admin'
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-[#fafafa]'
            }`}
          >
            <Shield className="w-4 h-4 text-red-400" />
            <span className="hidden xs:inline">Admin</span>
          </button>
        </nav>

        {/* Connectivity status & database indicator */}
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">Offline Mode</span>
            </div>
          ) : isFirebaseConfigured ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs" title="Live Firebase Firestore">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden md:inline font-medium">Firestore Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800/80 border border-white/10 text-[#a3a3a3] text-xs" title="Local Storage Realtime Mode">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="hidden md:inline font-medium">Local DB</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
