import { validateRecord } from './validators.js';
import * as state from './state.js'
import { compileRegex, filterRecords, sortRecords, splitMatches } from './search.js';

const $ = (sel) => document.querySelector(sel);

const view = {pattern: '', ci:true, sort: 'due-asc'};
let editingId = null;

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

// startup
export function init() {
  state.init([]);
  state.subscribe((all) => {
    renderList();
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
}