import {
    RULES, isRealDate, validateTitle, validateDuration, validateDate, validateTag, validateRecord,
  } from './scripts/validators.js';
  import { compileRegex, filterRecords, sortRecords, splitMatches } from './scripts/search.js';
  import { computeStats, targetStatus, addDays, formatMinutes, toUnit, fromUnit } from './scripts/stats.js';
  import { validateImportText, parseRecords } from './scripts/storage.js';
  
  const valid = (fn, v) => fn(v) === '';
  const invalid = (fn, v) => fn(v) !== '';
  const rec = (o) => ({ id: 'rec_1', type: 'task', title: 'A', dueDate: '2026-10-14', duration: 10, tag: 'Study', ...o });
  
export const cases = [

    ['title: normal text is valid', () => valid(validateTitle, 'Complete assignmet')],
    ['title: single character is valid', () => valid(validateTitle, 'A')],
    ['title: leading space is invalid', () => invalid(validateTitle, ' Complete assignment')],
    ['title: trailing space is invalid', () => invalid(validateTitle, 'Complete assignment ')],
    ['title: empty is invalid', () => invalid(validateTitle, '')],
    ['title: spaces only is invalid', () => invalid(validateTitle, '   ')],
    ['title: HTML-like text is allowed (rendered safely)', () => valid(validateTitle, 'Read <b>chapter</b> 5 & 6')],

    ['duplicate words: "study study" is flagged', () => invalid(validateTitle, 'study study session')],
    ['duplicate words: different case is flagged', () => invalid(validateTitle, 'Exam exam prep')],
    ['duplicate words: "the theory" is NOT flagged', () => valid(validateTitle, 'the theory')],
    ['duplicate words: regex back-reference works', () => RULES.duplicateWord.test('go go now')],

    ['duration: 90 valid', () => valid(validateDuration, '90')],
    ['duration: 0 valid', () => valid(validateDuration, '0')],
    ['duration: 45.5 valid', () => valid(validateDuration, '45.5')],
    ['duration: 45.25 valid', () => valid(validateDuration, '45.25')],
    ['duration: -5 invalid', () => invalid(validateDuration, '-5')],
    ['duration: 1.234 (3 decimals) invalid', () => invalid(validateDuration, '1.234')],
    ['duration: 007 (leading zeros) invalid', () => invalid(validateDuration, '007')],
    ['duration: abc invalid', () => invalid(validateDuration, 'abc')],
    ['duration: empty invalid', () => invalid(validateDuration, '')],
    ['duration: huge value invalid', () => invalid(validateDuration, '100001')],
    ['duration: number type 90 valid', () => valid(validateDuration, 90)],

    ['date: 2026-10-14 valid', () => valid(validateDate, '2026-10-14')],
    ['date: leap day 2028-02-29 valid', () => valid(validateDate, '2028-02-29')],
    ['date: 2026-02-29 (not a leap year) invalid', () => invalid(validateDate, '2026-02-29')],
    ['date: 2026-13-01 invalid', () => invalid(validateDate, '2026-13-01')],
    ['date: 2026-04-31 invalid (shape ok, date not real)', () => RULES.date.test('2026-04-31') && invalid(validateDate, '2026-04-31')],
    ['date: 14/10/2026 invalid format', () => invalid(validateDate, '14/10/2026')],
    ['date: isRealDate 2026-12-31 true', () => isRealDate('2026-12-31') === true],

    ['tag: Study valid', () => valid(validateTag, 'Study')],
    ['tag: Study Group valid', () => valid(validateTag, 'Study Group')],
    ['tag: Self-care valid', () => valid(validateTag, 'Self-care')],
    ['tag: Study123 invalid', () => invalid(validateTag, 'Study123')],
    ['tag: trailing space invalid', () => invalid(validateTag, 'Study ')],
    ['tag: double space invalid', () => invalid(validateTag, 'Study  Group')],
    ['tag: empty invalid', () => invalid(validateTag, '')],

    ['record: good record has no errors', () => Object.keys(validateRecord(rec({}))).length === 0],
    ['record: bad type flagged', () => 'type' in validateRecord(rec({ type: 'meeting' }))],
    ['record: multiple errors reported together', () => Object.keys(validateRecord(rec({ title: '', tag: '1' }))).length === 2],

    ['search: empty pattern means no filter', () => compileRegex('').re === null && compileRegex('').error === null],
    ['search: invalid regex returns an error, does not throw', () => compileRegex('(').error !== null],
    ['search: case-insensitive flag', () => compileRegex('abc', true).re.flags.includes('i')],
    ['search: case-sensitive has no i flag', () => !compileRegex('abc', false).re.flags.includes('i')],
    ['search: case-sensitive does not match other case', () => {
        const { re } = compileRegex('study', false);
        return filterRecords([rec({ title: 'Study hard', tag: 'Exam' })], re).length === 0;
    }],

    ['search: case-insensitive matches other case', () => {
    const { re } = compileRegex('study', true);
    return filterRecords([rec({ title: 'Study hard', tag: 'Exam' })], re).length === 1;
    }],

    ['search: no matches gives empty list', () => {
    const { re } = compileRegex('zzz');
    return filterRecords([rec({})], re).length === 0;
    }],

    ['search: pattern matching several records', () => {
    const list = [rec({ id: 'a', title: 'Math exam' }), rec({ id: 'b', title: 'Physics exam' }), rec({ id: 'c', title: 'Lunch' })];
    return filterRecords(list, compileRegex('exam$').re).length === 2;
    }],

    ['search: repeated filtering with a global regex is stable', () => {
    const { re } = compileRegex('a');
    const list = [rec({ id: 'a', title: 'aaa' }), rec({ id: 'b', title: 'aba' })];
    return filterRecords(list, re).length === 2 && filterRecords(list, re).length === 2;
    }],

    ['search: splitMatches wraps every match', () => {
    const segs = splitMatches('a-b-a', compileRegex('a').re);
    return segs.filter((s) => s.match).length === 2 && segs.map((s) => s.text).join('') === 'a-b-a';
    }],

    ['search: splitMatches keeps HTML-like text as plain text', () => {
    const segs = splitMatches('<b>x</b>', compileRegex('x').re);
    return segs.map((s) => s.text).join('') === '<b>x</b>';
    }],

    ['search: zero-length pattern does not hang', () => { 
    const segs = splitMatches('abc', compileRegex('x*').re);
    return segs.map((s) => s.text).join('') === 'abc';
    }],

    ['sort: title A-Z', () => sortRecords([rec({ title: 'b' }), rec({ title: 'a' })], 'title-asc')[0].title === 'a'],
    ['sort: title Z-A', () => sortRecords([rec({ title: 'a' }), rec({ title: 'b' })], 'title-desc')[0].title === 'b'],
    ['sort: duration ascending', () => sortRecords([rec({ duration: 9 }), rec({ duration: 1 })], 'dur-asc')[0].duration === 1],
    ['sort: duration descending', () => sortRecords([rec({ duration: 1 }), rec({ duration: 9 })], 'dur-desc')[0].duration === 9],
    ['sort: due date ascending', () => sortRecords([rec({ dueDate: '2026-12-01' }), rec({ dueDate: '2026-01-01' })], 'due-asc')[0].dueDate === '2026-01-01'],

    ['stats: totals and top tag', () => {
    const s = computeStats([rec({ duration: 30, tag: 'Exam' }), rec({ duration: 60, tag: 'Study' }), rec({ duration: 10, tag: 'study' })], '2026-10-10');
    return s.total === 3 && s.totalMinutes === 100 && s.topTag.toLowerCase() === 'study' && s.topTagCount === 2;
    }],

    ['stats: no records gives no top tag', () => computeStats([], '2026-10-10').topTag === null],
    ['stats: trend has 7 days ending today', () => {
    const t = computeStats([], '2026-10-10').trend;
    return t.length === 7 && t[0].date === '2026-10-04' && t[6].date === '2026-10-10';
    }],

    ['stats: trend sums minutes per due date', () => {
    const t = computeStats([rec({ dueDate: '2026-10-10', duration: 20 }), rec({ dueDate: '2026-10-10', duration: 5 }), rec({ dueDate: '2026-10-03', duration: 99 })], '2026-10-10').trend;
    return t[6].minutes === 25 && t[6].count === 2 && t.every((d) => d.date !== '2026-10-03');
    }],

    ['stats: addDays crosses month and year', () => addDays('2026-12-31', 1) === '2027-01-01' && addDays('2026-03-01', -1) === '2026-02-28'],
    ['target: 900 of 1200 leaves 300 remaining', () => {
    const t = targetStatus(900, 1200);
    return t.state === 'under' && t.remaining === 300;
    }],

    ['target: 1300 of 1200 is 100 over', () => {
    const t = targetStatus(1300, 1200);
    return t.state === 'over' && t.overage === 100;
    }],

    ['target: exactly on target is not over', () => targetStatus(1200, 1200).state === 'under'],
    ['target: zero target means none', () => targetStatus(10, 0).state === 'none'],
    ['units: 90 min shows as 1.5 h', () => formatMinutes(90, 'hr') === '1.5 h'],
    ['units: minutes format', () => formatMinutes(90, 'min') === '90 min'],
    ['units: 60 minutes = 1 hour both ways', () => toUnit(60, 'hr') === 1 && fromUnit(1, 'hr') === 60],

    ['import: malformed JSON is rejected', () => validateImportText('{oops').ok === false],
    ['import: wrong structure is rejected', () => validateImportText('{"hello":1}').ok === false],
    ['import: a plain number is rejected', () => validateImportText('42').ok === false], 
    ['import: record with bad field is rejected', () => validateImportText(JSON.stringify([rec({ duration: -1 })])).ok === false],
    ['import: duplicate ids are rejected', () => validateImportText(JSON.stringify([rec({}), rec({})])).ok === false],
    ['import: missing id is rejected', () => { const r = rec({}); delete r.id; return validateImportText(JSON.stringify([r])).ok === false; }],
    ['import: plain array of valid records works', () => {
    const r = validateImportText(JSON.stringify([rec({id: 'x1'}), rec({id: 'x2'})]));
    return r.ok && r.records.length === 2;
    }],

    ['import: {activities:[...]} with settings works', () => {
        const r = validateImportText(JSON.stringify({ settings: { targetMinutes: 600, unit: 'hr' }, activities: [rec({ id: 'x1' })] }));
        return r.ok && r.settings.targetMinutes === 600 && r.settings.unit === 'hr';
    }],

    ['import: missing timestamps are filled in', () => {
    const r = validateImportText(JSON.stringify([rec({ id: 'x1' })]));
    return r.ok && typeof r.records[0].createdAt === 'string';
    }],

    ['import: empty list is accepted', () => validateImportText('[]').ok === true],
    ['parseRecords: non-array rejected', () => parseRecords('nope').errors.length === 1],
];


export function runTests() {
    return cases.map(([name, fn]) => {
      try {
        return { name, pass: fn() === true };
      } catch (err) {
        return { name, pass: false, error: String(err) };
      }
    });
}






