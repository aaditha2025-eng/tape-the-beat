import React, { useState, useRef } from 'react';
import { 
  Shield, 
  KeyRound, 
  Users, 
  FileSpreadsheet, 
  Trophy, 
  Settings, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Share2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Sparkles, 
  AlertTriangle, 
  ExternalLink,
  Search,
  MessageCircle
} from 'lucide-react';
import { 
  saveJudge, 
  deleteJudge, 
  saveEntriesBatch, 
  deleteEntry, 
  updateSettings,
  clearAllCompetitionData,
  saveScore
} from '../lib/firebase';
import { parseGoogleFormExcel, assignAnonymousIds } from '../utils/importer';
import { DEMO_ENTRIES, DEMO_JUDGES, DEMO_SCORES } from '../utils/demoData';
import EntryReviewModal from '../components/EntryReviewModal';
import Leaderboard from './Leaderboard';

export default function AdminDashboard({
  entries = [],
  judges = [],
  scores = [],
  settings = {},
  onSelectJudgeToken,
}) {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState('entries'); // 'entries', 'judges', 'leaderboard', 'settings'

  // Import flow state
  const [parsedImportRows, setParsedImportRows] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // New Judge creation
  const [newJudgeName, setNewJudgeName] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  // Search & Filters in Entries
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Verify Admin PIN
  const handlePinSubmit = (e) => {
    e.preventDefault();
    const correctPin = settings.adminPin || '2026';
    if (pinInput.trim() === correctPin) {
      setIsAdminAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Handle Excel File Drop / Selection
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const rawParsed = await parseGoogleFormExcel(buffer);
      setParsedImportRows(rawParsed);
    } catch (err) {
      console.error('Error reading excel file:', err);
      alert('Failed to parse Excel file. Please ensure it is a valid Google Form export (.xlsx).');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirm Import after review modal
  const handleConfirmImport = async (reviewedEntries) => {
    try {
      const assigned = assignAnonymousIds(reviewedEntries, entries);
      await saveEntriesBatch(assigned);
      setParsedImportRows(null);
      alert(`Successfully imported ${assigned.length} dance entries!`);
    } catch (err) {
      console.error('Error saving imported entries:', err);
      alert('Error saving entries to database.');
    }
  };

  // Load Demo Data
  const handleLoadDemoData = async () => {
    if (window.confirm('Load 6 realistic demo entries (2 Solo, 2 Duo, 2 Trio) and 3 celebrity judges? This will merge with existing data.')) {
      try {
        await saveEntriesBatch(DEMO_ENTRIES);
        for (const j of DEMO_JUDGES) {
          await saveJudge(j);
        }
        for (const s of DEMO_SCORES) {
          await saveScore(s.judgeId, s.entryId, s);
        }
        alert('Demo data loaded successfully! You can now test judging, blind evaluation, and the leaderboard.');
      } catch (e) {
        console.error('Demo data error:', e);
      }
    }
  };

  // Create Judge
  const handleCreateJudge = async (e) => {
    e.preventDefault();
    if (!newJudgeName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const slug = newJudgeName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10);
    const token = `judge-${slug}-${randomSuffix}`;

    const newJudge = {
      id: `judge_${Date.now()}`,
      name: newJudgeName.trim(),
      token,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await saveJudge(newJudge);
    setNewJudgeName('');
  };

  // Copy Judge Link
  const handleCopyLink = (token) => {
    const origin = window.location.origin;
    const link = `${origin}/?judge=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // WhatsApp Share
  const handleWhatsAppShare = (judge) => {
    const origin = window.location.origin;
    const link = `${origin}/?judge=${judge.token}`;
    const text = `Hello ${judge.name}, here is your private judging portal link for the Dance Competition: ${link}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Regenerate Judge Token
  const handleRegenerateToken = async (judge) => {
    if (window.confirm(`Regenerate link for ${judge.name}? Their previous link will stop working.`)) {
      const randomSuffix = Math.random().toString(36).substring(2, 12);
      const newToken = `judge-${Math.random().toString(36).substring(2, 6)}-${randomSuffix}`;
      await saveJudge({ ...judge, token: newToken });
    }
  };

  // Toggle Judge Status (Revoke/Enable)
  const handleToggleJudgeActive = async (judge) => {
    await saveJudge({ ...judge, active: !judge.active });
  };

  // Toggle Category Lock
  const handleToggleCategoryLock = async (category) => {
    const current = settings.lockedCategories || {};
    const updated = {
      ...current,
      [category]: !current[category],
    };
    await updateSettings({ lockedCategories: updated });
  };

  // Toggle Name Visibility (Blind Judging)
  const handleToggleNameVisibility = async () => {
    await updateSettings({ namesVisible: !settings.namesVisible });
  };

  // Clear Database
  const handleResetAllData = async () => {
    const code = prompt('Type RESET to completely wipe all entries, scores, and judges:');
    if (code === 'RESET') {
      await clearAllCompetitionData();
      alert('All competition data has been cleared.');
    }
  };

  // PIN Login Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 md:p-8 rounded-2xl glass-elevated border-red-500/30 text-center animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center mx-auto mb-4 border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
          <KeyRound className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold font-display tracking-wider text-white">
          Admin Portal Authentication
        </h2>
        <p className="text-xs text-[#a3a3a3] mt-1 mb-6">
          Enter competition coordinator PIN to manage entries, judges, and scores.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter PIN (Default: 2026)"
              className="w-full glass-input p-3 text-center text-lg tracking-widest font-mono placeholder:text-[#737373]"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-400 mt-1.5 font-medium">
                Incorrect PIN. Default is 2026.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all min-h-[44px]"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  // Filtered Entries
  const filteredEntries = entries.filter((e) => {
    if (categoryFilter !== 'ALL' && (e.category || 'SOLO').toUpperCase() !== categoryFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = (e.anonymousId || '').toLowerCase().includes(q);
      const matchName = (e.displayName || '').toLowerCase().includes(q);
      const matchReg = (e.primaryRegNo || '').toLowerCase().includes(q);
      return matchId || matchName || matchReg;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Import Review Modal if file parsed */}
      {parsedImportRows && (
        <EntryReviewModal
          parsedEntries={parsedImportRows}
          onConfirm={handleConfirmImport}
          onCancel={() => setParsedImportRows(null)}
        />
      )}

      {/* Admin Header with Quick Actions */}
      <div className="p-6 md:p-8 rounded-2xl glass-card border-red-500/20 bg-gradient-to-r from-red-950/20 via-black to-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-xs font-semibold text-red-300 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Administrator Control Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-wider text-white">
            COMPETITION DASHBOARD
          </h1>
          <p className="text-xs md:text-sm text-[#a3a3a3] mt-1">
            Real-time management for entries, private judge links, category locks, and audit exports.
          </p>
        </div>

        {/* Global Controls & Demo Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleToggleNameVisibility}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 min-h-[40px] ${
              settings.namesVisible
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {settings.namesVisible ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4" />}
            <span>{settings.namesVisible ? 'Names Revealed' : 'Blind Judging (Names Hidden)'}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemoData}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center gap-1.5 min-h-[40px]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Load Demo Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'entries', label: `Entries (${entries.length})`, icon: FileSpreadsheet },
          { id: 'judges', label: `Judges (${judges.length})`, icon: Users },
          { id: 'leaderboard', label: 'Leaderboard & Audit', icon: Trophy },
          { id: 'settings', label: 'Settings & Round Locks', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-[#a3a3a3]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ENTRIES MANAGEMENT & IMPORT */}
      {activeTab === 'entries' && (
        <div className="space-y-6">
          {/* Import Banner Card */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold font-display tracking-wide text-white">
                Import Google Form Submissions (.xlsx)
              </h3>
              <p className="text-xs text-[#a3a3a3] mt-1 max-w-xl">
                Automatically trims names, dedupes registrations by category (keeping latest), checks registration number patterns (26BEE1040), formats phone numbers, and flags junk rows for review.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer transition-all text-sm min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Parsing...' : 'Upload Spreadsheet'}</span>
              </label>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Performer, Reg..."
                className="w-full glass-input pl-9 pr-3 py-2 text-xs md:text-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {['ALL', 'SOLO', 'DUO', 'TRIO'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[38px] ${
                    categoryFilter === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-[#a3a3a3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Entries Table */}
          <div className="rounded-2xl glass-card overflow-hidden border border-white/10">
            {filteredEntries.length === 0 ? (
              <div className="py-16 text-center text-[#a3a3a3]">
                No entries match your search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-[#a3a3a3] bg-white/[0.03] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Anonymous ID</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Performer Name(s)</th>
                      <th className="py-3 px-4">Primary Reg No</th>
                      <th className="py-3 px-4">Video Link</th>
                      <th className="py-3 px-4 text-center">Scores In</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEntries.map((e) => {
                      const entryScores = scores.filter((s) => s.entryId === e.id);

                      return (
                        <tr key={e.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 font-score text-lg font-bold text-red-500">
                            {e.anonymousId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-950/40 border border-red-500/30 text-red-300">
                              {e.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            {e.displayName}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#a3a3a3]">
                            {e.primaryRegNo || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {e.mainVideo ? (
                              <a
                                href={e.mainVideo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 max-w-[150px] truncate"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span>Watch Video</span>
                              </a>
                            ) : (
                              <span className="text-xs text-[#737373]">No video</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white font-mono">
                              {entryScores.length} / {judges.length}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete entry ${e.anonymousId} (${e.displayName})?`)) {
                                  deleteEntry(e.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* TAB 2: JUDGES MANAGEMENT & PRIVATE LINKS */}
      {activeTab === 'judges' && (
        <div className="space-y-6">
          {/* Create Judge Form */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-lg font-bold font-display tracking-wide text-white mb-1">
              Add Competition Judge
            </h3>
            <p className="text-xs text-[#a3a3a3] mb-4">
              Enter the judge's full name. A private, secure scoring link will be generated automatically.
            </p>

            <form onSubmit={handleCreateJudge} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newJudgeName}
                onChange={(e) => setNewJudgeName(e.target.value)}
                placeholder="Judge Full Name (e.g., Remo D'Souza)"
                className="flex-1 glass-input p-3 text-sm"
              />
              <button
                type="submit"
                disabled={!newJudgeName.trim()}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none text-white font-semibold shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all text-sm min-h-[44px] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Judge Link</span>
              </button>
            </form>
          </div>

          {/* Judges List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {judges.length === 0 ? (
              <div className="col-span-full py-16 text-center text-[#a3a3a3] rounded-2xl glass-card p-6">
                No judges added yet. Add a judge above or load the demo dataset.
              </div>
            ) : (
              judges.map((j) => {
                const judgeScores = scores.filter((s) => s.judgeId === j.id);
                const activeEntriesCount = entries.filter((e) => !e.isExcluded).length;
                const percentDone = activeEntriesCount > 0 
                  ? Math.round((judgeScores.length / activeEntriesCount) * 100) 
                  : 0;

                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const privateLink = `${origin}/?judge=${j.token}`;

                return (
                  <div
                    key={j.id}
                    className={`p-5 rounded-2xl glass-card border transition-all ${
                      j.active ? 'border-white/10' : 'border-red-900/30 opacity-60 bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-white tracking-wide">
                            {j.name}
                          </h4>
                          {!j.active && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/50 text-red-300 border border-red-500/30">
                              REVOKED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a3a3a3] mt-0.5">
                          Progress: <span className="font-semibold text-white">{judgeScores.length}</span> of {activeEntriesCount} scored ({percentDone}%)
                        </p>
                      </div>

                      {/* Live progress indicator */}
                      <span className="font-score text-xl font-bold text-red-500">
                        {percentDone}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentDone}%` }}
                      />
                    </div>

                    {/* Token & Link Box */}
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between gap-2 mb-4">
                      <code className="text-xs font-mono text-red-300 truncate">
                        {privateLink}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(j.token)}
                        title="Copy private link"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        {copiedToken === j.token ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Actions: WhatsApp, Open Portal, Regenerate, Toggle */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp Share */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(j)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Open Direct */}
                        <button
                          type="button"
                          onClick={() => onSelectJudgeToken(j.token)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                          <span>Enter</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Regenerate Token */}
                        <button
                          type="button"
                          onClick={() => handleRegenerateToken(j)}
                          title="Regenerate Token"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#a3a3a3] hover:text-white transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Revoke / Enable Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleJudgeActive(j)}
                          title={j.active ? 'Revoke link' : 'Reactivate link'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[38px] ${
                            j.active
                              ? 'bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-950/50'
                              : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/50'
                          }`}
                        >
                          {j.active ? 'Revoke' : 'Reactivate'}
                        </button>

                        {/* Delete Judge */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete judge ${j.name}?`)) {
                              deleteJudge(j.id);
                            }
                          }}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD & REAL-TIME AUDIT */}
      {activeTab === 'leaderboard' && (
        <Leaderboard
          entries={entries}
          judges={judges}
          scores={scores}
          settings={settings}
        />
      )}

      {/* TAB 4: SETTINGS & ROUND CONTROLS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Round Locks */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-lg font-bold font-display tracking-wide text-white mb-1">
              Category Round Locks
            </h3>
            <p className="text-xs text-[#a3a3a3] mb-4">
              When a category is locked, judges can view their scores but cannot modify them.
            </p>

            <div className="space-y-3">
              {['SOLO', 'DUO', 'TRIO'].map((cat) => {
                const isLocked = settings.lockedCategories && settings.lockedCategories[cat];

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">{cat} Round</div>
                      <div className="text-xs text-[#a3a3a3]">
                        Status: <span className={isLocked ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {isLocked ? 'Locked (Scores Frozen)' : 'Unlocked (Active Scoring)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCategoryLock(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[40px] ${
                        isLocked
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock Round</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock Round</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Change Admin PIN */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-lg font-bold font-display tracking-wide text-white mb-1">
              Admin Access PIN
            </h3>
            <p className="text-xs text-[#a3a3a3] mb-4">
              Current PIN: <code className="font-mono text-red-300 font-bold">{settings.adminPin || '2026'}</code>
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                id="new-pin-input"
                placeholder="Enter new 4-digit PIN"
                maxLength={8}
                className="glass-input p-3 text-sm flex-1 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-pin-input');
                  if (input && input.value.trim().length >= 4) {
                    updateSettings({ adminPin: input.value.trim() });
                    alert(`Admin PIN updated to ${input.value.trim()}`);
                    input.value = '';
                  } else {
                    alert('PIN must be at least 4 digits');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold min-h-[44px]"
              >
                Update PIN
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-2xl glass-card border-red-500/30 bg-red-950/15">
            <h3 className="text-lg font-bold font-display tracking-wide text-red-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reset Competition Data
            </h3>
            <p className="text-xs text-[#a3a3a3] mb-4">
              Completely wipes all imported entries, judges, and judge score submissions from this competition instance.
            </p>

            <button
              type="button"
              onClick={handleResetAllData}
              className="px-5 py-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 text-xs font-bold transition-all min-h-[44px]"
            >
              Wipe All Data (Danger)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
