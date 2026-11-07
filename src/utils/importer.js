import * as XLSX from 'xlsx';

// Registration number regex pattern: 2 digits + 3 letters + 4 digits (e.g., 26BEE1040)
const REG_NO_REGEX = /^\d{2}[A-Za-z]{3}\d{4}$/;

// Junk name detection
const NONSENSE_PATTERNS = [
  /^[a-z]{1,2}$/i,         // 1 or 2 letters
  /^[^a-zA-Z0-9]+$/,       // punctuation only like ".", "---"
  /^(test|asdf|qwerty|afkn|sdgsd|xyz|aaa|zzz|none|na|nil|unknown)$/i,
];

function isJunkName(name) {
  if (!name || name.trim().length < 2) return true;
  const clean = name.trim();
  return NONSENSE_PATTERNS.some((pat) => pat.test(clean));
}

function cleanPhone(rawPhone) {
  if (rawPhone == null || rawPhone === '') return '';
  let str = String(rawPhone).trim();
  
  // If scientific notation e.g. 9.87654321E9
  if (/e[+-]?\d+/i.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      str = BigInt(Math.round(num)).toString();
    }
  }
  // Strip decimals if any e.g. 9876543210.0
  str = str.replace(/\.0+$/, '').replace(/[^0-9+]/g, '');
  return str;
}

function normalizeCategory(raw) {
  if (!raw) return 'SOLO';
  const val = String(raw).toUpperCase().trim();
  if (val.includes('TRIO')) return 'TRIO';
  if (val.includes('DUO')) return 'DUO';
  return 'SOLO';
}

function findCol(rowObj, candidates) {
  const keys = Object.keys(rowObj);
  for (const c of candidates) {
    const found = keys.find((k) => k.trim().toUpperCase() === c.toUpperCase());
    if (found && rowObj[found] !== undefined && rowObj[found] !== '') {
      return rowObj[found];
    }
  }
  // Fuzzy partial match
  for (const c of candidates) {
    const found = keys.find((k) => k.trim().toUpperCase().includes(c.toUpperCase()));
    if (found && rowObj[found] !== undefined && rowObj[found] !== '') {
      return rowObj[found];
    }
  }
  return '';
}

/**
 * Parse an Excel buffer / File from Google Forms export
 */
export async function parseGoogleFormExcel(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read as raw json rows
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });

  const rawEntries = [];

  rawRows.forEach((row, index) => {
    // 1. Timestamp
    const timestampRaw = findCol(row, ['Timestamp', 'Time', 'Date']);
    let timestamp = new Date();
    if (timestampRaw instanceof Date) {
      timestamp = timestampRaw;
    } else if (timestampRaw) {
      const parsedDate = new Date(timestampRaw);
      if (!isNaN(parsedDate.getTime())) timestamp = parsedDate;
    }

    // 2. Category
    const category = normalizeCategory(findCol(row, ['CATEGORY', 'Category', 'EVENT CATEGORY', 'Type']));

    // 3. Performer 1
    const p1Name = String(findCol(row, ['NAME', 'Performer 1 Name', 'Participant Name', 'Full Name'])).trim().toUpperCase();
    const p1Reg = String(findCol(row, ['REGISTRATION NUMBER', 'Reg No', 'Registration No', 'Reg Number'])).trim().toUpperCase();
    const p1Phone = cleanPhone(findCol(row, ['PHONE NUMBER', 'Phone', 'Mobile Number', 'Contact']));
    const p1Mail = String(findCol(row, ['COLLEGE MAIL', 'Email', 'Mail', 'College Email'])).trim().toLowerCase();
    const v1 = String(findCol(row, ['VIDEO LINK', 'Video', 'Video URL', 'Submission Link'])).trim();

    // 4. Performer 2
    const p2Name = String(findCol(row, ['Performer 2 Name', 'NAME 2', 'Participant 2 Name', 'Partner Name'])).trim().toUpperCase();
    const p2Reg = String(findCol(row, ['Performer 2 Reg', 'REGISTRATION NUMBER 2', 'Reg No 2', 'Partner Reg No'])).trim().toUpperCase();
    const p2Phone = cleanPhone(findCol(row, ['Performer 2 Phone', 'PHONE NUMBER 2', 'Phone 2']));
    const p2Mail = String(findCol(row, ['Performer 2 Mail', 'COLLEGE MAIL 2', 'Mail 2', 'Email 2'])).trim().toLowerCase();
    const v2 = String(findCol(row, ['VIDEO LINK 2', 'Video 2'])).trim();

    // 5. Performer 3
    const p3Name = String(findCol(row, ['Performer 3 Name', 'NAME 3', 'Participant 3 Name'])).trim().toUpperCase();
    const p3Reg = String(findCol(row, ['Performer 3 Reg', 'REGISTRATION NUMBER 3', 'Reg No 3'])).trim().toUpperCase();
    const p3Phone = cleanPhone(findCol(row, ['Performer 3 Phone', 'PHONE NUMBER 3', 'Phone 3']));
    const p3Mail = String(findCol(row, ['Performer 3 Mail', 'COLLEGE MAIL 3', 'Mail 3', 'Email 3'])).trim().toLowerCase();
    const v3 = String(findCol(row, ['VIDEO LINK 3', 'Video 3'])).trim();

    // Build performers array
    const performers = [];
    if (p1Name) {
      performers.push({ name: p1Name, regNo: p1Reg, phone: p1Phone, email: p1Mail });
    }
    if (p2Name && (category === 'DUO' || category === 'TRIO')) {
      performers.push({ name: p2Name, regNo: p2Reg, phone: p2Phone, email: p2Mail });
    }
    if (p3Name && category === 'TRIO') {
      performers.push({ name: p3Name, regNo: p3Reg, phone: p3Phone, email: p3Mail });
    }

    // Combined display name
    const displayName = performers.length > 0 
      ? performers.map((p) => p.name).join(' & ') 
      : (p1Name || `Participant ${index + 1}`);

    // Video links list
    const videoLinks = [v1, v2, v3].filter((link) => link && link.length > 5);
    const mainVideo = videoLinks[0] || '';

    // Validation & Flagging
    const flags = [];

    // Check junk name
    if (isJunkName(p1Name)) {
      flags.push({ type: 'junk_name', message: `Potentially invalid / junk name: "${p1Name}"` });
    }

    // Check registration number pattern
    if (!REG_NO_REGEX.test(p1Reg)) {
      flags.push({ 
        type: 'invalid_reg', 
        message: `Primary Reg No "${p1Reg || 'EMPTY'}" doesn't match format (e.g. 26BEE1040)` 
      });
    }

    // Check partner reg numbers if duo/trio
    if (p2Reg && !REG_NO_REGEX.test(p2Reg)) {
      flags.push({ type: 'invalid_partner_reg', message: `Partner 2 Reg No "${p2Reg}" format invalid` });
    }
    if (p3Reg && !REG_NO_REGEX.test(p3Reg)) {
      flags.push({ type: 'invalid_partner_reg', message: `Partner 3 Reg No "${p3Reg}" format invalid` });
    }

    // Check video link presence
    if (!mainVideo) {
      flags.push({ type: 'missing_video', message: 'Missing video link' });
    } else if (!mainVideo.startsWith('http://') && !mainVideo.startsWith('https://')) {
      flags.push({ type: 'malformed_video', message: `Video link lacks http/https protocol: "${mainVideo}"` });
    }

    rawEntries.push({
      tempId: `row_${index + 1}_${Date.now()}`,
      originalRowIndex: index + 2, // 1-based + header
      timestamp: timestamp.toISOString(),
      timestampObj: timestamp,
      category,
      displayName,
      performers,
      primaryRegNo: p1Reg,
      primaryPhone: p1Phone,
      primaryEmail: p1Mail,
      mainVideo,
      videoLinks,
      flags,
      isFlagged: flags.length > 0,
      isDuplicate: false,
      isExcluded: false, // Admin can toggle
      dedupeKey: `${p1Reg || p1Name}_${category}`.toUpperCase(),
    });
  });

  // ==========================================
  // DEDUPLICATION: (registration number + category)
  // Keep the LATEST submission, mark older ones as duplicate
  // ==========================================
  const grouped = new Map();

  rawEntries.forEach((entry) => {
    if (!grouped.has(entry.dedupeKey)) {
      grouped.set(entry.dedupeKey, []);
    }
    grouped.get(entry.dedupeKey).push(entry);
  });

  grouped.forEach((groupEntries) => {
    if (groupEntries.length > 1) {
      // Sort ascending by timestamp: earliest to latest
      groupEntries.sort((a, b) => a.timestampObj - b.timestampObj);
      
      // All except the last one are marked duplicate
      for (let i = 0; i < groupEntries.length - 1; i++) {
        const dup = groupEntries[i];
        dup.isDuplicate = true;
        dup.flags.push({
          type: 'duplicate',
          message: `Duplicate submission superseded by later entry on ${groupEntries[groupEntries.length - 1].timestampObj.toLocaleString()}`,
        });
        dup.isExcluded = true; // Exclude older duplicates by default
      }
    }
  });

  return rawEntries;
}

/**
 * Assign anonymous IDs (S-01, D-01, T-01) to active confirmed entries
 */
export function assignAnonymousIds(entries, existingEntries = []) {
  const categoryPrefixes = {
    SOLO: 'S',
    DUO: 'D',
    TRIO: 'T',
  };

  // Find max existing number per category
  const counters = { SOLO: 0, DUO: 0, TRIO: 0 };
  existingEntries.forEach((e) => {
    const cat = e.category || 'SOLO';
    const match = (e.anonymousId || '').match(/^[SDT]-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > (counters[cat] || 0)) counters[cat] = num;
    }
  });

  const processed = entries.map((entry) => {
    if (entry.isExcluded) return entry;

    const cat = entry.category || 'SOLO';
    counters[cat] = (counters[cat] || 0) + 1;
    const prefix = categoryPrefixes[cat] || 'S';
    const numStr = String(counters[cat]).padStart(2, '0');
    const anonymousId = `${prefix}-${numStr}`;

    return {
      ...entry,
      id: anonymousId,
      anonymousId,
      status: 'pending',
    };
  });

  return processed;
}
