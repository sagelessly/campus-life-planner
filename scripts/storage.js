import { validateRecord } from './validators.js';

const KEY_DATA = 'clp.activities.v1';

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