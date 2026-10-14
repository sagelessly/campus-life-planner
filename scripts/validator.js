export const RULES = {
    
    title: /^\S(?:.*\S)?$/,
    
    duration: /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    
    date: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
    
    tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    
    duplicateWord: /\b(\w+)\s+\1\b/i,
  };
  
  export const TYPES = ['task', 'event'];
  
  export function isRealDate(value) {
    if (typeof value !== 'string' || !RULES.date.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }
  
  export function validateTitle(value) {
    if (typeof value !== 'string' || value.trim() === '') return 'Title is required.';
    if (!RULES.title.test(value)) return 'Remove the spaces at the start or end of the title.';
    if (value.length > 120) return 'Title must be 120 characters or fewer.';
    if (RULES.duplicateWord.test(value)) {
      return 'The title repeats a word twice in a row (for example "study study"). Remove the duplicate.';
    }
    return '';
  }
  
  export function validateDuration(value) {
    const s = value === null || value === undefined ? '' : String(value);
    if (s === '') return 'Duration is required.';
    if (!RULES.duration.test(s)) {
      return 'Enter minutes as a positive number such as 90 or 45.5 (no negatives, at most 2 decimals).';
    }
    if (Number(s) > 100000) return 'Duration must be 100,000 minutes or fewer.';
    return '';
  }
  
  export function validateDate(value) {
    if (typeof value !== 'string' || value === '') return 'Due date is required.';
    if (!RULES.date.test(value)) return 'Use the format YYYY-MM-DD, for example 2026-10-14.';
    if (!isRealDate(value)) return 'That date does not exist on the calendar.';
    return '';
  }
  
  export function validateTag(value) {
    if (typeof value !== 'string' || value === '') return 'Tag is required.';
    if (!RULES.tag.test(value)) {
      return 'Use letters, spaces and hyphens only, with no spaces at the start or end (for example "Study Group").';
    }
    if (value.length > 30) return 'Tag must be 30 characters or fewer.';
    return '';
  }
  
  export function validateType(value) {
    return TYPES.includes(value) ? '' : 'Choose either Task or Event.';
  }
  
  // Returns an object of { field: message } containing only the invalid fields.
  export function validateRecord(fields) {
    const f = fields || {};
    const checks = {
      type: validateType(f.type),
      title: validateTitle(f.title),
      dueDate: validateDate(f.dueDate),
      duration: validateDuration(f.duration),
      tag: validateTag(f.tag),
    };
    const errors = {};
    for (const [key, msg] of Object.entries(checks)) if (msg) errors[key] = msg;
    return errors;
  }