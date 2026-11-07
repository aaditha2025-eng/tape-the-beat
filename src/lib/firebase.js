/**
 * Firebase Firestore Integration with Automatic Local Fallback
 * 
 * If .env contains valid Firebase credentials, uses real-time Firestore.
 * If credentials are not yet configured, automatically uses an interactive
 * local reactive store (backed by localStorage and cross-tab storage events)
 * so the app can be developed, tested, and demoed immediately without blocking!
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
);

let app = null;
let firestoreDb = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreDb = getFirestore(app);
    console.log('[DanceJudge] Connected to Firebase Firestore:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[DanceJudge] Failed to initialize Firebase Firestore, using local fallback:', error);
  }
} else {
  console.info('[DanceJudge] Firebase credentials not configured in .env. Running with local reactive storage.');
}

export { firestoreDb };

// ==========================================
// LOCAL REACTIVE STORAGE (Fallback & Offline)
// ==========================================
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
    console.error('Error reading localStorage:', e);
    return defaultVal;
  }
}

function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('dance_storage_update_' + key));
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
}

function notifyLocalListeners(type, data) {
  if (listeners[type]) {
    listeners[type].forEach((cb) => cb(data));
  }
}

// Window storage listener for multi-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    Object.entries(LOCAL_STORAGE_KEYS).forEach(([type, storageKey]) => {
      if (e.key === storageKey) {
        const val = getLocalData(storageKey);
        notifyLocalListeners(type.toLowerCase(), Object.values(val));
      }
    });
  });

  Object.entries(LOCAL_STORAGE_KEYS).forEach(([type, storageKey]) => {
    window.addEventListener('dance_storage_update_' + storageKey, () => {
      const val = getLocalData(storageKey);
      notifyLocalListeners(type.toLowerCase(), Object.values(val));
    });
  });
}

// ==========================================
// DATA API (Unified Firestore + Local fallback)
// ==========================================

/**
 * Subscribe to Entries
 */
export function subscribeEntries(callback) {
  if (firestoreDb) {
    const coll = collection(firestoreDb, 'entries');
    return onSnapshot(coll, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (err) => {
      console.error('Firestore entries subscription error:', err);
      const fallback = Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {}));
      callback(fallback);
    });
  }

  // Local fallback
  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {}));
  callback(current);
  listeners.entries.add(callback);
  return () => listeners.entries.delete(callback);
}

/**
 * Subscribe to Judges
 */
export function subscribeJudges(callback) {
  if (firestoreDb) {
    const coll = collection(firestoreDb, 'judges');
    return onSnapshot(coll, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (err) => {
      console.error('Firestore judges subscription error:', err);
      const fallback = Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {}));
      callback(fallback);
    });
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {}));
  callback(current);
  listeners.judges.add(callback);
  return () => listeners.judges.delete(callback);
}

/**
 * Subscribe to Scores
 */
export function subscribeScores(callback) {
  if (firestoreDb) {
    const coll = collection(firestoreDb, 'scores');
    return onSnapshot(coll, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (err) => {
      console.error('Firestore scores subscription error:', err);
      const fallback = Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {}));
      callback(fallback);
    });
  }

  const current = Object.values(getLocalData(LOCAL_STORAGE_KEYS.SCORES, {}));
  callback(current);
  listeners.scores.add(callback);
  return () => listeners.scores.delete(callback);
}

/**
 * Subscribe to App Settings (locked categories, name visibility, etc.)
 */
export function subscribeSettings(callback) {
  const defaultSettings = {
    lockedCategories: { SOLO: false, DUO: false, TRIO: false },
    namesVisible: false,
    adminPin: '2026',
    activeRoundName: 'Final Round 2026',
  };

  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'settings', 'global');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...defaultSettings, ...docSnap.data() });
      } else {
        callback(defaultSettings);
      }
    }, (err) => {
      console.error('Firestore settings subscription error:', err);
      const local = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
      callback(local);
    });
  }

  const local = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
  callback(local);
  listeners.settings.add(callback);
  return () => listeners.settings.delete(callback);
}

/**
 * Save Judge Score
 */
export async function saveScore(judgeId, entryId, scoreData) {
  const scoreId = `${judgeId}_${entryId}`;
  const payload = {
    ...scoreData,
    judgeId,
    entryId,
    updatedAt: new Date().toISOString(),
  };

  // Always mirror to local storage for offline resiliency & instant responsiveness
  const localScores = getLocalData(LOCAL_STORAGE_KEYS.SCORES, {});
  localScores[scoreId] = payload;
  setLocalData(LOCAL_STORAGE_KEYS.SCORES, localScores);

  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'scores', scoreId);
      await setDoc(docRef, {
        ...payload,
        serverTimestamp: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Error saving score to Firestore:', err);
      throw err;
    }
  }

  return payload;
}

/**
 * Batch Save Entries (during import)
 */
export async function saveEntriesBatch(entriesList) {
  const localEntries = getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  entriesList.forEach((entry) => {
    localEntries[entry.id] = {
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString(),
    };
  });
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, localEntries);

  if (firestoreDb) {
    const batch = writeBatch(firestoreDb);
    entriesList.forEach((entry) => {
      const docRef = doc(firestoreDb, 'entries', entry.id);
      batch.set(docRef, entry, { merge: true });
    });
    await batch.commit();
  }
}

/**
 * Replace all entries and remap existing scores if IDs changed
 */
export async function replaceAllEntries(renumberedEntries, idMap = new Map()) {
  const newLocalEntries = {};
  renumberedEntries.forEach((e) => {
    newLocalEntries[e.id] = {
      ...e,
      createdAt: e.createdAt || new Date().toISOString(),
    };
  });
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, newLocalEntries);

  // Remap existing scores if entry IDs changed
  if (idMap.size > 0) {
    const localScores = getLocalData(LOCAL_STORAGE_KEYS.SCORES, {});
    const updatedScores = {};
    Object.values(localScores).forEach((score) => {
      const newEntryId = idMap.get(score.entryId) || score.entryId;
      const newScoreId = `${score.judgeId}_${newEntryId}`;
      updatedScores[newScoreId] = {
        ...score,
        entryId: newEntryId,
      };
    });
    setLocalData(LOCAL_STORAGE_KEYS.SCORES, updatedScores);
  }

  if (firestoreDb) {
    const batch = writeBatch(firestoreDb);
    renumberedEntries.forEach((entry) => {
      const docRef = doc(firestoreDb, 'entries', entry.id);
      batch.set(docRef, entry);
    });
    await batch.commit();
  }
}

/**
 * Delete Entry
 */
export async function deleteEntry(entryId) {
  const localEntries = getLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  delete localEntries[entryId];
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, localEntries);

  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'entries', entryId));
  }
}

/**
 * Add / Update Judge
 */
export async function saveJudge(judge) {
  const localJudges = getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  localJudges[judge.id] = judge;
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, localJudges);

  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'judges', judge.id);
    await setDoc(docRef, judge, { merge: true });
  }
}

/**
 * Delete Judge
 */
export async function deleteJudge(judgeId) {
  const localJudges = getLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  delete localJudges[judgeId];
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, localJudges);

  if (firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'judges', judgeId));
  }
}

/**
 * Update Global Settings
 */
export async function updateSettings(partialSettings) {
  const current = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, {
    lockedCategories: { SOLO: false, DUO: false, TRIO: false },
    namesVisible: false,
    adminPin: '2026',
    activeRoundName: 'Final Round 2026',
  });
  const updated = { ...current, ...partialSettings };
  setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, updated);

  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'settings', 'global');
    await setDoc(docRef, updated, { merge: true });
  }
}

/**
 * Clear All Data (Admin reset option)
 */
export async function clearAllCompetitionData() {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.ENTRIES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.JUDGES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SCORES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
  setLocalData(LOCAL_STORAGE_KEYS.ENTRIES, {});
  setLocalData(LOCAL_STORAGE_KEYS.JUDGES, {});
  setLocalData(LOCAL_STORAGE_KEYS.SCORES, {});
}
