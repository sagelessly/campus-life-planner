import { validateRecord } from './validators.js';
import * as state from './state.js'
import * as storage from './storage.js'
import { compileRegex, filterRecords, sortRecords, splitMatches } from './search.js';
import { computeStats, targetStatus, localToday, formatMinutes, toUnit, fromUnit } from './stats.js';

const $ = (sel) => document.querySelector(sel);

let settings = storage.loadSettings();
const view = {pattern: '', ci:true, sort: 'due-asc'};
let editingId = null;
let saveOk = true;

// helpers

function el(tag,attrs = {}, ...kids){
  const node = document.createElement(tag);
  for(const[k, v] of Object.entries(attrs)){
    if(k === 'class') node.className = v;
    else if (k === 'text') node.textContent =v;
    else node.setAttribute(k, v);
  }
  node.append(...kids);
  return node;
}

function announce(message) {
  const warn = saveOk ? '' : ' Warning: your changes could not be saved.';
  $('#save-status').textContent = message + warn; 
}

function round2(n){
  return Math.rount(n * 100)/ 100;
}

// activities list

function card(r, re){
  return el(
    'li',
    {class: 'card', 'data-id': r.id},
    el('div', {class: 'card-top'},
      el('span',{class:`badge badge-${r.type}`, text:r.type}),
      el('span',{class: 'tag'}, highlighted (r.tag, re))),
    el('h3',{}, highlighted (r.title, re)),
    el('p', { class: 'meta'},
      el('time', {datetime: r.dueDate, text: `Due ${r.dueDate}`}),
      ' . ',
      formatMinutes(r.duration, settings.unit)),
    el('div', {class: 'actions'},
      el('button', { type: 'button', class: 'btn btn-small', 'data-action': 'edit', 'aria-label': `Edit ${r.title}`, text:'Edit'}),
      el('button', { type: 'button', class: 'btn btn-small btn-danger', 'data-action': 'delete', 'aria-label': `Delete ${r.title}`, text: 'Delete' })),
    );
}
function renderList(){
  const all = state.getAll();
  const { re, error } = compileRegex(view.pattern, view.ci);
  const errBox = $ ('#regex-error');
  errBox.textContent =error ? `Invalid pattern: ${error}. Showing all activities.` : '';
  $('#search').setAttribute('aria-invalid', error ? 'true' : 'false');

  const shown = sortRecords(filterRecords(all, re), view.sort);
  const list = $('#list');
  list.replaceChildren(...shown.map((r) => card(r, re)));

  $('#empty-state').hidden = all.length !== 0;
  $('#no-matches').hidden = !(all.length > 0 && shown.length === 0);
  $('#result-count').textContent =
    all.length === 0 ? '' : `Showing ${shown.length} of ${all.length} activit${all.length === 1 ? 'y' : 'ies'}.`;
}

//dashboard
+function setLiveText(node, text) {
  if (node.textContent !== text) node.textContent = text;
  }
  
  function renderDashboard() {
    const s = computeStats(state.getAll(), localToday());
    $('#stat-total').textContent = String(s.total);
    $('#stat-duration').textContent = formatMinutes(s.totalMinutes, settings.unit);
    $('#stat-tag').textContent = s.topTag ? `${s.topTag} (${s.topTagCount})` : 'None yet';
  
    const max = Math.max(0, ...s.trend.map((d) => d.minutes));
    const trend = $('#trend');
    trend.replaceChildren(
      ...s.trend.map((d) => {
        const bar = el('div', { class: 'bar', 'aria-hidden': 'true' });
        bar.style.height = d.minutes > 0 ? `${Math.max(4, (d.minutes / max) * 100)}%` : '0';
        return el('li', {},
          el('span', { class: 'trend-value', text: formatMinutes(d.minutes, settings.unit) }),
          el('div', { class: 'bar-wrap' }, bar),
          el('span', { class: 'trend-label', text: d.label }),
          el('span', { class: 'visually-hidden', text: `${d.count} due` }));
      }),
    );

// settings

   function renderSettings(){
    $('#unit').value = settings.unit;
    $('#target-label-unit').textContent = settings.unit === 'hr' ? 'hours' : 'minutes';
    $('#target').value = String(round2(toUnit(settings.targetMinutes, settings.unit)));
   }

    // The sum of durations of ALL saved activities vs the target.
  const t = targetStatus(s.totalMinutes, settings.targetMinutes);
  const polite = $('#target-status');
  const alertBox = $('#target-alert');
  const progress = $('#target-progress');
  progress.max = settings.targetMinutes > 0 ? settings.targetMinutes : 1;
  progress.value = Math.min(s.totalMinutes, progress.max);
  progress.hidden = t.state === 'none';
  const target = formatMinutes(settings.targetMinutes, settings.unit);
  if (t.state === 'none') {
    setLiveText(polite, 'No duration target set. Set one in Settings.');
    setLiveText(alertBox, '');
  } else if (t.state === 'under') {
    setLiveText(polite, `Target ${target}. Remaining: ${formatMinutes(t.remaining, settings.unit)}.`);
    setLiveText(alertBox, '');
  } else {
    setLiveText(polite, '');
    setLiveText(alertBox, `Over target by ${formatMinutes(t.overage, settings.unit)} (target ${target}).`);
  }
}

function renderAll(){
  renderDashboard();
  renderList();
  renderSettings();
}
  

// form
const FIELD_MAP = {
  type: ['f-type', 'err-type'],
  title: ['f-title', 'err-title'],
  dueDate: ['f-date', 'err-date'],
  duration: ['f-duration', 'err-duration'],
  tag: ['f-tag', 'err-tag'],
};

function readForm() {
  return {
    type: $('#f-type').value,
    title: $('#f-title').value,
    dueDate: $('#f-date').value,
    duration: $('#f-duration').value,
    tag: $('#f-tag').value,
  };
}

function showErrors(errors) {
  let first = null;
  for (const [key, [inputId, errId]] of Object.entries(FIELD_MAP)) {
    const input = $('#' + inputId);
    $('#' + errId).textContent = errors[key] || '';
    input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    if (errors[key] && !first) first = input;
  }
  if (first) first.focus();
}

function resetForm() {
  $('#activity-form').reset();
  editingId = null;
  $('#form-heading').textContent = 'Add activity';
  $('#save-btn').textContent = 'Add activity';
  $('#cancel-edit').hidden = true;
  showErrors({});
}

function startEdit(id){
  const r = state.get(id);
  if(!r) return;
  editingId = id;
  $('#f-type').value = r.type;
  $('#f-title').value = r.title;
  $('#f-date').value = r.dueDate;
  $('#f-duration').value = String(r.duration);
  $('#f-tag').value = r.tag;
  $('#form-heading').textContent = 'Edit activity';
  $('#save-btn').textContent = 'Update activity';
  $('#cancel-edit').hidden = false;
  showErrors({});
  $('#add').scrollIntoView({behavior: 'smooth', block: 'start'});
  $('#f-title').focus({ preventScroll: true});
  announce(`Editing "${r.title}".`);
}
  
function onSubmit(e) {
  e.preventDefault();
  const data = readForm();
  const errors = validateRecord(data);
  showErrors(errors);
  const n = Object.keys(errors).length;
  if (n > 0) {
    announce(`Not saved. ${n} field${n > 1 ? 's need' : ' needs'} attention.`);
    return;
  }
  state.add(data);
  resetForm();
  announce('Activity added.');
}
//settings action

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  
function showImportResult(ok, message) {
  $('#import-ok').textContent = ok ? message : '';
  $('#import-error').textContent = ok ? '' : message;
  }
  
function applyImport(text) {
  const result = storage.validateImportText(text);
  if (!result.ok) {
    showImportResult(false, `Import failed. ${result.errors.join(' ')} Your existing data was not changed.`);
  return false;
  }
  state.replaceAll(result.records);
  if (result.settings) {
    settings = result.settings;
    storage.saveSettings(settings);
  }
  renderAll();
  const n = result.records.length;
  showImportResult(true, `Imported ${n} activit${n === 1 ? 'y' : 'ies'}.`);
  announce(`Imported ${n} activities.`);
  return true;
}

async function onImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2_000_000) {
    showImportResult(false, 'Import failed. The file is larger than 2 MB. Your existing data was not changed.');
  } else {
    try {
    applyImport(await file.text());
    } catch (err) {
    showImportResult(false, 'Import failed. The file could not be read. Your existing data was not changed.');
    }
  }
  e.target.value = ''; 
}

async function loadSample() {
  if (state.getAll().length > 0 && !confirm('Replace your current activities with the sample data?')) return;
  try {
    const res = await fetch('seed.json');
    if (!res.ok) throw new Error(String(res.status));
    applyImport(await res.text());
  } catch (err) {
    showImportResult(false, 'Could not load seed.json. Open the app through a web server (not a file:// address).');
  }
}

// startup
export function init() {
  const { records, problem } = storage.loadRecords();
  state.init(records);

  state.subscribe((all) => {
    saveOk = storage.saveRecords(all);
    renderDashboard();
    renderAll();
    if(problem) announce (problem);
  });
  $('#activity-form').addEventListener('submit', onSubmit);
  $('#cancel-edit').addEventListener('click',() => { 
    resetForm();
    announce('Edit cancelled.');
  });

  $('#list').addEventListener('click', (e) => { 
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const id = btn.closest('[data-id]').dataset.id;
    const r= state.get(id);
    if(!ir) return;
    if(btn.dataset.action === 'edit') startEdit(id);
    else if(confirm(`Delete "${r.title}"?`)){
      state.remove(id);
      if(editingId === id) resetForm();
      announce(`Deleted "${r.title}".`);
      $('#Seach').focus();
    }
  });


  $('#search').addEventListener('input', (e) => {
      view.pattern = e.target.value;
      renderList();
    });
  $('#case-insensitive').addEventListener('change', (e) => {
    view.ci = e.target.checked;
    renderList();
    });
  $('#sort').addEventListener('change', (e) => {
    view.sort = e.target.value;
    renderList();
  });

  $('#target').addEventListener('change', onTargetChange);
  $('#unit').addEventListener('change', onUnitChange);
  $('#export-btn').addEventListener('click', () => {
    download(`campus-planner-${localToday()}.json`, JSON.stringify(storage.buildExport(state.getAll(), settings), null, 2));
    announce('Exported your planner as a JSON file.');
  });
  $('#import-file').addEventListener('change', onImportFile);
  $('#load-sample').addEventListener('click', loadSample);
  $('#load-sample-inline').addEventListener('click', loadSample);
  $('#clear-all').addEventListener('click', () => {
    if (state.getAll().length === 0) return announce('There is nothing to clear.');
    if (confirm('Delete ALL activities? This cannot be undone.')) {
      state.replaceAll([]);
      resetForm();
      announce('All activities deleted.');
    }
  });

renderAll();

}