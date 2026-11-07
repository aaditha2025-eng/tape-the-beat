import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeLanding from './views/HomeLanding';
import JudgeHome from './views/JudgeHome';
import JudgeScore from './views/JudgeScore';
import AdminDashboard from './views/AdminDashboard';
import { 
  subscribeEntries, 
  subscribeJudges, 
  subscribeScores, 
  subscribeSettings,
  saveEntriesBatch,
  saveJudge,
  saveScore
} from './lib/firebase';
import { DEMO_ENTRIES, DEMO_JUDGES, DEMO_SCORES } from './utils/demoData';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [judges, setJudges] = useState([]);
  const [scores, setScores] = useState([]);
  const [settings, setSettings] = useState({
    lockedCategories: { SOLO: false, DUO: false, TRIO: false },
    namesVisible: false,
    adminPin: '2026',
  });

  const [currentView, setCurrentView] = useState('home'); // 'home', 'judge_home', 'judge_score', 'leaderboard', 'admin'
  const [currentJudgeToken, setCurrentJudgeToken] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Network connectivity listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time Subscriptions (Firestore / Local fallback)
  useEffect(() => {
    const unsubEntries = subscribeEntries((data) => {
      setEntries(data || []);
      setInitialLoaded(true);
    });

    const unsubJudges = subscribeJudges((data) => {
      setJudges(data || []);
    });

    const unsubScores = subscribeScores((data) => {
      setScores(data || []);
    });

    const unsubSettings = subscribeSettings((data) => {
      if (data) setSettings(data);
    });

    return () => {
      unsubEntries();
      unsubJudges();
      unsubScores();
      unsubSettings();
    };
  }, []);

  // Parse URL on load for /?judge=<token> or /#judge/<token> or pathname
  useEffect(() => {
    const parseUrlToken = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const judgeParam = searchParams.get('judge');
      if (judgeParam) {
        setCurrentJudgeToken(judgeParam);
        setCurrentView('judge_home');
        return;
      }

      // Check pathname e.g. /judge/token-123
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'judge' && pathParts[1]) {
        setCurrentJudgeToken(pathParts[1]);
        setCurrentView('judge_home');
        return;
      }
    };

    parseUrlToken();
    window.addEventListener('popstate', parseUrlToken);
    return () => window.removeEventListener('popstate', parseUrlToken);
  }, []);

  // Auto-seed demo data if fresh empty start
  useEffect(() => {
    if (initialLoaded && entries.length === 0 && judges.length === 0) {
      // Auto-load demo data so user immediately sees a working app
      const autoSeed = async () => {
        try {
          await saveEntriesBatch(DEMO_ENTRIES);
          for (const j of DEMO_JUDGES) {
            await saveJudge(j);
          }
          for (const s of DEMO_SCORES) {
            await saveScore(s.judgeId, s.entryId, s);
          }
        } catch (e) {
          console.error('Auto seed error:', e);
        }
      };
      autoSeed();
    }
  }, [initialLoaded, entries.length, judges.length]);

  // Find active judge by token
  const activeJudge = judges.find((j) => j.token === currentJudgeToken);

  // Navigate to specific judge link
  const handleSelectJudgeToken = (token) => {
    setCurrentJudgeToken(token);
    setCurrentView('judge_home');
    const newUrl = `${window.location.pathname}?judge=${token}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleSelectEntry = (entryId) => {
    setSelectedEntryId(entryId);
    setCurrentView('judge_score');
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view === 'home') {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Find currently selected entry and existing score
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const existingScore = activeJudge && selectedEntry
    ? scores.find((s) => s.judgeId === activeJudge.id && s.entryId === selectedEntry.id)
    : null;

  const currentCategoryEntries = selectedEntry
    ? entries.filter(
        (e) => (e.category || 'SOLO').toUpperCase() === (selectedEntry.category || 'SOLO').toUpperCase() && !e.isExcluded
      )
    : [];

  return (
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Fixed Ambient Glow & Grid Background */}
      <div className="ambient-bg" />

      {/* Persistent Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeJudge={activeJudge}
        isOnline={isOnline}
      />

      {/* Main Container Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        {/* Loading state skeleton if initial load in progress */}
        {!initialLoaded ? (
          <div className="space-y-4 max-w-xl mx-auto my-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 skeleton mx-auto" />
            <h3 className="font-display text-2xl text-white tracking-wide">
              INITIALIZING COMPETITION PORTAL...
            </h3>
            <p className="text-xs text-[#a3a3a3]">Connecting real-time scoring stream...</p>
          </div>
        ) : (
          <>
            {/* 1. Landing / Portal Selector */}
            {currentView === 'home' && (
              <HomeLanding
                judges={judges}
                onSelectJudgeToken={handleSelectJudgeToken}
                onNavigate={handleNavigate}
              />
            )}

            {/* 2. Judge Home (Entries Grid & Progress) */}
            {currentView === 'judge_home' && (
              <JudgeHome
                judge={activeJudge || { token: currentJudgeToken, active: false }}
                entries={entries}
                scores={scores}
                settings={settings}
                onSelectEntry={handleSelectEntry}
              />
            )}

            {/* 3. Judge Scoring Screen */}
            {currentView === 'judge_score' && selectedEntry && activeJudge && (
              <JudgeScore
                entry={selectedEntry}
                judge={activeJudge}
                existingScore={existingScore}
                allCategoryEntries={currentCategoryEntries}
                settings={settings}
                isOnline={isOnline}
                onBack={() => setCurrentView('judge_home')}
                onNavigateEntry={(nextId) => setSelectedEntryId(nextId)}
              />
            )}

            {/* 4. Admin Dashboard (PIN-Protected, includes Live Leaderboard & Audit) */}
            {(currentView === 'admin' || currentView === 'leaderboard') && (
              <AdminDashboard
                entries={entries}
                judges={judges}
                scores={scores}
                settings={settings}
                onSelectJudgeToken={handleSelectJudgeToken}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#737373] border-t border-white/5 relative z-10 bg-black/40">
        <span>DanceJudge Pro &copy; 2026 &bull; Glassmorphism Real-Time Judging Engine</span>
      </footer>
    </div>
  );
}
