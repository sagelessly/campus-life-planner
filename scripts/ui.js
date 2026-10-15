import { validateRecord } from './validators.js';
import * as state from './state.js'
import { compileRegex, filterRecords, sortRecords, splitMatches } from './search.js';

const $ = (sel) => document.querySelector(sel);

const view = {pattern: '', ci:true, sort: 'due-asc'};

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
  $('#save-status').textContent = message;
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
      `${r.duration} min`),  
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
  showErrors({});
  $('#f-title').blur();
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

// startup
export function init() {
  state.init([]);
  state.subscribe((all) => {
    renderList();
  });
  $('#activity-form').addEventListener('submit', onSubmit);
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
}