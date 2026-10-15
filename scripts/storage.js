import { validateRecord } from './validators.js';

const KEY_DATA = 'clp.activities.v1';

export const DEFAULT_SETTINGS = Object.freeze({ targetMinutes: 1200, unit: 'min'});

const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

export function parseRecords(list) {
  if (!Array.isArray(list)) return { records: [], errors: ['Expected a list of activities.'] };
  const records = [];
  const errors = [];
  const seen = new Set();
  const now = new Date().toISOString();

  list.forEach((item, i) => {
    const label = `Item ${i + 1}`;
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label}: not an object.`);
      return;
    }
    const problems = validateRecord(item);
    const msgs = Object.entries(problems).map(([field, msg]) => `${field}: ${msg}`);
    if (typeof item.id !== 'string' || item.id === '') msgs.push('id: missing.');
    else if (seen.has(item.id)) msgs.push(`id: "${item.id}" is used more than once.`);
    if (msgs.length) {
      errors.push(`${label}: ${msgs.join(' ')}`);
      return;
    }
    seen.add(item.id);
    records.push({
      id: item.id,
      type: item.type,
      title: item.title,
      dueDate: item.dueDate,
      duration: Number(item.duration),
      tag: item.tag,
      createdAt: isIso(item.createdAt) ? item.createdAt : now,
      updatedAt: isIso(item.updatedAt) ? item.updatedAt : now,
    });
  });
  return { records, errors };
}

function sanitizeSettings(obj) {
    const out = { ...DEFAULT_SETTINGS };
      if (obj && typeof obj === 'object') {
        if (Number.isFinite(obj.targetMinutes) && obj.targetMinutes >= 0) out.targetMinutes = obj.targetMinutes;
        if (obj.unit === 'min' || obj.unit === 'hr') out.unit = obj.unit;
      }
      return out;
}

    
export function validateImportText(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        return { ok: false, records: [], errors: [`The file is not valid JSON (${err.message}).`] };
    }
    const list = Array.isArray(data) ? data : data && Array.isArray(data.activities) ? data.activities : null;
    if (!list) {
        return {
            ok: false,
            records: [],
            errors: ['Wrong structure: expected a list of activities, or an object with an "activities" list.'],
        };
    }
    const { records, errors } = parseRecords(list);
    if (errors.length) {
        const shown = errors.slice(0, 5);
        if (errors.length > 5) shown.push(`...and ${errors.length - 5} more problems.`);
        return { ok: false, records: [], errors: shown };
        }
        const settings = data && !Array.isArray(data) && data.settings ? sanitizeSettings(data.settings) : null;
        return { ok: true, records, errors: [], settings };
    }

export function buildExport(records, settings){
    return{
        app: 'campus-life-planner',
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: { targetMinutes: settings.targetMinutes, unit: settings.unit},
        activities: records,
    };
}
    

export function loadRecords() {
    try {
      const raw = localStorage.getItem(KEY_DATA);
      if (raw === null) return { records: [], problem: null };
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : data && data.activities;
      const { records, errors } = parseRecords(list);
      const problem = errors.length ? `${errors.length} saved item(s) were damaged and skipped.` : null;
      return { records, problem };
    } catch (err) {
      return { records: [], problem: 'Saved data could not be read, so the planner started empty.' };
    }
  }
  
  export function saveRecords(records) {
    try {
      localStorage.setItem(KEY_DATA, JSON.stringify(records));
      return true;
    } catch (err) {
      return false;
    }
  }

  export function loadSettings() {
      try {
        const raw = localStorage.getItem(KEY_SETTINGS);
        return raw === null ? { ...DEFAULT_SETTINGS } : sanitizeSettings(JSON.parse(raw));
      } catch (err) {
        return { ...DEFAULT_SETTINGS };
      }
    }
    
    export function saveSettings(settings) {
      try {
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
        return true;
      } catch (err) {
        return false;
      }
    }