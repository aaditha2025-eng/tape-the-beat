import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 10
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (isSupabaseConfigured) {
  console.log('[DanceJudge] Connected to Supabase:', supabaseUrl);
}

// Local storage keys for offline/fallback
const LOCAL_STORAGE_KEYS = {
  ENTRIES: 'dance_judge_entries_v1',
  JUDGES: 'dance_judge_judges_v1',
  SCORES: 'dance_judge_scores_v1',
  SETTINGS: 'dance_judge_settings_v1',
};

const listeners = {
  entries: new Set(),
  judges: new Set(),
  scores: new Set(),
  settings: new Set(),
};

function getLocalData(key, defaultVal = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('dance_storage_update_' + key));
  } catch (e) {}
}

function notifyLocal(type, data) {
  if (listeners[type]) {
    listeners[type].forEach((cb) => cb(data));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    Object.entries(LOCAL_STORAGE_KEYS).forEach(([type, storageKey]) => {
      if (e.key === storageKey) {
        notifyLocal(type.toLowerCase(), Object.values(getLocalData(storageKey)));
      }
    });
  });

  Object.entries(LOCAL_STORAGE_KEYS).forEach(([type, storageKey]) => {
    window.addEventListener('dance_storage_update_' + storageKey, () => {
      notifyLocal(type.toLowerCase(), Object.values(getLocalData(storageKey)));
    });
  });
}

// Mappers for Supabase snake_case <-> Frontend camelCase
function mapEntryFromDb(d) {
  return {
    id: d.id,
    anonymousId: d.anonymous_id || d.id,
    category: d.category,
    displayName: d.display_name,
    primaryRegNo: d.primary_reg_no,
    primaryPhone: d.primary_phone,
    primaryEmail: d.primary_email,
    mainVideo: d.main_video,
    videoLinks: d.video_links || [],
    performers: d.performers || [],
    flags: d.flags || [],
    isFlagged: d.is_flagged || false,
    isDuplicate: d.is_duplicate || false,
    isExcluded: d.is_excluded || false,
    status: d.status || 'pending',
    createdAt: d.created_at,
  };
}

function mapEntryToDb(e) {
  return {
    id: e.id,
    anonymous_id: e.anonymousId || e.id,
    category: e.category,
    display_name: e.displayName,
    primary_reg_no: e.primaryRegNo || '',
    primary_phone: e.primaryPhone || '',
    primary_email: e.primaryEmail || '',
    main_video: e.mainVideo || '',
    video_links: e.videoLinks || [],
    performers: e.performers || [],
    flags: e.flags || [],
    is_flagged: Boolean(e.isFlagged),
    is_duplicate: Boolean(e.isDuplicate),
    is_excluded: Boolean(e.isExcluded),
    status: e.status || 'pending',
  };
}

function mapScoreFromDb(d) {
  return {
    id: d.id,
    judgeId: d.judge_id,
    entryId: d.entry_id,
    total: Number(d.total),
    criteriaScores: d.criteria_scores || {},
    comment: d.comment || '',
    updatedAt: d.updated_at,
  };
}

function mapScoreToDb(s) {
  return {
    id: s.id || `${s.judgeId}_${s.entryId}`,
    judge_id: s.judgeId,
    entry_id: s.entryId,
    total: s.total,
    criteria_scores: s.criteriaScores || {},
    comment: s.comment || '',
    updated_at: s.updatedAt || new Date().toISOString(),
  };
}

function mapSettingsFromDb(d) {
  return {
    lockedCategories: d.locked_categories || { SOLO: false, DUO: false, TRIO: false },
    namesVisible: Boolean(d.names_visible),
    adminPin: d.admin_pin || '2026',
    activeRoundName: d.active_round_name || 'Final Round 2026',
  };
}

// ==========================================
// UNIFIED REAL-TIME SUBSCRIBERS
// ==========================================

export function subscribeEntries(callback) {
  if (supabase) {
    // Initial fetch
    supabase.from('entries').select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data.map(mapEntryFromDb));
      } else {
        callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {})));
      }
    });

    // Realtime channel
    const channel = supabase
      .channel('public:entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
        supabase.from('entries').select('*').then(({ data }) => {
          if (data) callback(data.map(mapEntryFromDb));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Local fallback
  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {}));
  callback(current);
  listeners.entries.add(callback);
  return () => listeners.entries.delete(callback);
}

export function subscribeJudges(callback) {
  if (supabase) {
    supabase.from('judges').select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data);
      } else {
        callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {})));
      }
    });

    const channel = supabase
      .channel('public:judges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judges' }, () => {
        supabase.from('judges').select('*').then(({ data }) => {
          if (data) callback(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {}));
  callback(current);
  listeners.judges.add(callback);
  return () => listeners.judges.delete(callback);
}

export function subscribeScores(callback) {
  if (supabase) {
    supabase.from('scores').select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data.map(mapScoreFromDb));
      } else {
        callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {})));
      }
    });

    const channel = supabase
      .channel('public:scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        supabase.from('scores').select('*').then(({ data }) => {
          if (data) callback(data.map(mapScoreFromDb));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {}));
  callback(current);
  listeners.scores.add(callback);
  return () => listeners.scores.delete(callback);
}

export function subscribeSettings(callback) {
  const defaultSettings = {
    lockedCategories: { SOLO: false, DUO: false, TRIO: false },
    namesVisible: false,
    adminPin: '2026',
    activeRoundName: 'Final Round 2026',
  };

  if (supabase) {
    supabase.from('settings').select('*').eq('id', 'global').maybeSingle().then(({ data, error }) => {
      if (!error && data) {
        callback(mapSettingsFromDb(data));
      } else {
        callback(getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings));
      }
    });

    const channel = supabase
      .channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        supabase.from('settings').select('*').eq('id', 'global').maybeSingle().then(({ data }) => {
          if (data) callback(mapSettingsFromDb(data));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  const local = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
  callback(local);
  listeners.settings.add(callback);
  return () => listeners.settings.delete(callback);
}

// ==========================================
// MUTATIONS
// ==========================================

export async function saveScore(judgeId, entryId, scoreData) {
  const scoreId = `${judgeId}_${entryId}`;
  const payload = {
    ...scoreData,
    id: scoreId,
    judgeId,
    entryId,
    updatedAt: new Date().toISOString(),
  };

  // Local cache
  const localScores = getLocalData(LOCAL_STORAGE_KEYS.SCORES, {});
  localScores[scoreId] = payload;
  setLocalData(LOCAL_STORAGE_KEYS.SCORES, localScores);

  if (supabase) {
    const dbPayload = mapScoreToDb(payload);
    const { error } = await supabase.from('scores').upsert(dbPayload);
    if (error) console.error('Supabase saveScore error:', error);
  }

  return payload;
}

export async function saveEntriesBatch(entriesList) {
  const localEntries = getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  entriesList.forEach((e) => {
    localEntries[e.id] = {
      ...e,
      createdAt: e.createdAt || new Date().toISOString(),
    };
  });
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, localEntries);

  if (supabase) {
    const dbEntries = entriesList.map(mapEntryToDb);
    const { error } = await supabase.from('entries').upsert(dbEntries);
    if (error) console.error('Supabase saveEntriesBatch error:', error);
  }
}

export async function replaceAllEntries(renumberedEntries, idMap = new Map()) {
  const newLocal = {};
  renumberedEntries.forEach((e) => {
    newLocal[e.id] = {
      ...e,
      createdAt: e.createdAt || new Date().toISOString(),
    };
  });
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, newLocal);

  if (idMap.size > 0) {
    const localScores = getLocalData(LOCAL_STORAGE_KEYS.SCORES, {});
    const updated = {};
    Object.values(localScores).forEach((score) => {
      const newEntryId = idMap.get(score.entryId) || score.entryId;
      const newScoreId = `${score.judgeId}_${newEntryId}`;
      updated[newScoreId] = {
        ...score,
        entryId: newEntryId,
      };
    });
    setLocalData(LOCAL_STORAGE_KEYS.SCORES, updated);
  }

  if (supabase) {
    await supabase.from('entries').delete().neq('id', '___none___');
    const dbEntries = renumberedEntries.map(mapEntryToDb);
    await supabase.from('entries').upsert(dbEntries);
  }
}

export async function deleteEntry(entryId) {
  const localEntries = getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  delete localEntries[entryId];
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, localEntries);

  if (supabase) {
    await supabase.from('entries').delete().eq('id', entryId);
  }
}

export async function saveJudge(judge) {
  const localJudges = getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  localJudges[judge.id] = judge;
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, localJudges);

  if (supabase) {
    await supabase.from('judges').upsert(judge);
  }
}

export async function deleteJudge(judgeId) {
  const localJudges = getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  delete localJudges[judgeId];
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, localJudges);

  if (supabase) {
    await supabase.from('judges').delete().eq('id', judgeId);
  }
}

export async function updateSettings(partialSettings) {
  const current = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, {
    lockedCategories: { SOLO: false, DUO: false, TRIO: false },
    namesVisible: false,
    adminPin: '2026',
    activeRoundName: 'Final Round 2026',
  });
  const updated = { ...current, ...partialSettings };
  setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, updated);

  if (supabase) {
    await supabase.from('settings').upsert({
      id: 'global',
      locked_categories: updated.lockedCategories,
      names_visible: updated.namesVisible,
      admin_pin: updated.adminPin,
      active_round_name: updated.activeRoundName,
    });
  }
}

export async function clearAllCompetitionData() {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.ENTRIES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.JUDGES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SCORES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  setLocalData(LOCAL_STORAGE_KEYS.SCORES, {});

  if (supabase) {
    await supabase.from('scores').delete().neq('id', '___none___');
    await supabase.from('entries').delete().neq('id', '___none___');
    await supabase.from('judges').delete().neq('id', '___none___');
  }
}
