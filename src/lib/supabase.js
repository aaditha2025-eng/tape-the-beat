import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lkhgccaokicgyfrsbhlt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NLnviuclWfKph8DwB2V4Cg_z4pwttfq';

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

function mapJudgeFromDb(d) {
  return {
    id: d.id,
    name: d.name,
    token: d.token,
    active: d.active !== false,
    createdAt: d.created_at || d.createdAt || new Date().toISOString(),
  };
}

function mapJudgeToDb(j) {
  return {
    id: j.id,
    name: j.name,
    token: j.token,
    active: j.active !== false,
    created_at: j.createdAt || j.created_at || new Date().toISOString(),
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

export async function checkSupabaseHealth() {
  if (!supabase) return { connected: false, message: 'Supabase credentials not configured' };
  try {
    const { data, error } = await supabase.from('judges').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table') || error.message?.includes('schema cache')) {
        return { connected: false, tablesMissing: true, message: "Tables missing in Supabase schema cache. Please run supabase-schema.sql in Supabase SQL Editor." };
      }
      return { connected: false, tablesMissing: false, message: error.message };
    }
    return { connected: true, tablesMissing: false, message: 'Connected and synchronized with Supabase cloud database.' };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

export async function syncLocalDataToSupabase() {
  if (!supabase) return { success: false, message: 'No Supabase connection' };
  try {
    const localEntries = Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {}));
    const localJudges = Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {}));
    const localScores = Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {}));
    const localSettings = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, null);

    if (localJudges.length > 0) {
      await supabase.from('judges').upsert(localJudges.map(mapJudgeToDb));
    }
    if (localEntries.length > 0) {
      await supabase.from('entries').upsert(localEntries.map(mapEntryToDb));
    }
    if (localScores.length > 0) {
      await supabase.from('scores').upsert(localScores.map(mapScoreToDb));
    }
    if (localSettings) {
      await supabase.from('settings').upsert({
        id: 'global',
        locked_categories: localSettings.lockedCategories,
        names_visible: localSettings.namesVisible,
        admin_pin: localSettings.adminPin,
        active_round_name: localSettings.activeRoundName,
      });
    }

    return { 
      success: true, 
      counts: { 
        judges: localJudges.length, 
        entries: localEntries.length, 
        scores: localScores.length 
      } 
    };
  } catch (err) {
    console.error('syncLocalDataToSupabase error:', err);
    return { success: false, error: err.message };
  }
}

export function subscribeEntries(callback) {
  listeners.entries.add(callback);

  if (supabase) {
    supabase.from('entries').select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data.map(mapEntryFromDb));
      } else {
        callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {})));
      }
    }).catch(() => {
      callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {})));
    });

    const channel = supabase
      .channel('public:entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
        supabase.from('entries').select('*').then(({ data, error }) => {
          if (!error && data) callback(data.map(mapEntryFromDb));
        });
      })
      .subscribe();

    return () => {
      listeners.entries.delete(callback);
      supabase.removeChannel(channel);
    };
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {}));
  callback(current);
  return () => listeners.entries.delete(callback);
}

export function subscribeJudges(callback) {
  listeners.judges.add(callback);

  if (supabase) {
    supabase.from('judges').select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data.map(mapJudgeFromDb));
      } else {
        callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {})));
      }
    }).catch(() => {
      callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {})));
    });

    const channel = supabase
      .channel('public:judges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judges' }, () => {
        supabase.from('judges').select('*').then(({ data, error }) => {
          if (!error && data) callback(data.map(mapJudgeFromDb));
        });
      })
      .subscribe();

    return () => {
      listeners.judges.delete(callback);
      supabase.removeChannel(channel);
    };
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {}));
  callback(current);
  return () => listeners.judges.delete(callback);
}

export function subscribeScores(callback) {
  listeners.scores.add(callback);

  if (supabase) {
    supabase.from('scores').select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data.map(mapScoreFromDb));
      } else {
        callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {})));
      }
    }).catch(() => {
      callback(Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {})));
    });

    const channel = supabase
      .channel('public:scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        supabase.from('scores').select('*').then(({ data, error }) => {
          if (!error && data) callback(data.map(mapScoreFromDb));
        });
      })
      .subscribe();

    return () => {
      listeners.scores.delete(callback);
      supabase.removeChannel(channel);
    };
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {}));
  callback(current);
  return () => listeners.scores.delete(callback);
}

export function subscribeSettings(callback) {
  const defaultSettings = {
    lockedCategories: { SOLO: false, DUO: false, TRIO: false },
    namesVisible: false,
    adminPin: '2026',
    activeRoundName: 'Final Round 2026',
  };

  listeners.settings.add(callback);

  if (supabase) {
    supabase.from('settings').select('*').eq('id', 'global').maybeSingle().then(({ data, error }) => {
      if (!error && data) {
        callback(mapSettingsFromDb(data));
      } else {
        callback(getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings));
      }
    }).catch(() => {
      callback(getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings));
    });

    const channel = supabase
      .channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        supabase.from('settings').select('*').eq('id', 'global').maybeSingle().then(({ data, error }) => {
          if (!error && data) callback(mapSettingsFromDb(data));
        });
      })
      .subscribe();

    return () => {
      listeners.settings.delete(callback);
      supabase.removeChannel(channel);
    };
  }

  const local = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
  callback(local);
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

  // Local cache & notify
  const localScores = getLocalData(LOCAL_STORAGE_KEYS.SCORES, {});
  localScores[scoreId] = payload;
  setLocalData(LOCAL_STORAGE_KEYS.SCORES, localScores);
  notifyLocal('scores', Object.values(localScores));

  if (supabase) {
    try {
      const dbPayload = mapScoreToDb(payload);
      const { error } = await supabase.from('scores').upsert(dbPayload);
      if (error) console.warn('Supabase saveScore warning:', error.message);
    } catch (e) {
      console.warn('Supabase saveScore network/table error:', e.message);
    }
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
  notifyLocal('entries', Object.values(localEntries));

  if (supabase) {
    try {
      const dbEntries = entriesList.map(mapEntryToDb);
      const { error } = await supabase.from('entries').upsert(dbEntries);
      if (error) console.warn('Supabase saveEntriesBatch warning:', error.message);
    } catch (e) {
      console.warn('Supabase saveEntriesBatch error:', e.message);
    }
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
  notifyLocal('entries', Object.values(newLocal));

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
    notifyLocal('scores', Object.values(updated));
  }

  if (supabase) {
    try {
      await supabase.from('entries').delete().neq('id', '___none___');
      const dbEntries = renumberedEntries.map(mapEntryToDb);
      await supabase.from('entries').upsert(dbEntries);
    } catch (e) {
      console.warn('Supabase replaceAllEntries error:', e.message);
    }
  }
}

export async function deleteEntry(entryId) {
  const localEntries = getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  delete localEntries[entryId];
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, localEntries);
  notifyLocal('entries', Object.values(localEntries));

  if (supabase) {
    try {
      await supabase.from('entries').delete().eq('id', entryId);
    } catch (e) {
      console.warn('Supabase deleteEntry error:', e.message);
    }
  }
}

export async function saveJudge(judge) {
  const localJudges = getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  localJudges[judge.id] = judge;
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, localJudges);
  notifyLocal('judges', Object.values(localJudges));

  if (supabase) {
    try {
      const dbPayload = mapJudgeToDb(judge);
      const { error } = await supabase.from('judges').upsert(dbPayload);
      if (error) console.warn('Supabase saveJudge warning:', error.message);
    } catch (e) {
      console.warn('Supabase saveJudge error:', e.message);
    }
  }
}

export async function deleteJudge(judgeId) {
  const localJudges = getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  delete localJudges[judgeId];
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, localJudges);
  notifyLocal('judges', Object.values(localJudges));

  if (supabase) {
    try {
      await supabase.from('judges').delete().eq('id', judgeId);
    } catch (e) {
      console.warn('Supabase deleteJudge error:', e.message);
    }
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
  notifyLocal('settings', updated);

  if (supabase) {
    try {
      await supabase.from('settings').upsert({
        id: 'global',
        locked_categories: updated.lockedCategories,
        names_visible: updated.namesVisible,
        admin_pin: updated.adminPin,
        active_round_name: updated.activeRoundName,
      });
    } catch (e) {
      console.warn('Supabase updateSettings error:', e.message);
    }
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
  notifyLocal('entries', []);
  notifyLocal('judges', []);
  notifyLocal('scores', []);

  if (supabase) {
    try {
      await supabase.from('scores').delete().neq('id', '___none___');
      await supabase.from('entries').delete().neq('id', '___none___');
      await supabase.from('judges').delete().neq('id', '___none___');
    } catch (e) {
      console.warn('Supabase clearAllCompetitionData error:', e.message);
    }
  }
}
