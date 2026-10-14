import { validateRecord } from './validators.js';
import * as state from './state.js'

const $ = (sel) => document.querySelector(sel);

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

function card(r){
  return el(
    'li',
    {class: 'card', 'data-id': r.id},
    el('div', {class: 'card-top'},
      el('span',{class:`badge badge-${r.type}`, text:r.type}),
      el('span',{class: 'tag',text: r.tag})),
    el('h3',{ text: r.title}),
    el('p', { class: 'meta'},
      el('time', {datetime: r.dueDate, text: `Due ${r.dueDate}`}),
      ' . ',
      `${r.duration} min`),  
    );
}
function renderList(){
  const all = state.getAll();
  $('#list').replaceChildren(...all.map((r) => card (r)));
  $('#empty-state').hidden = all.length !== 0;
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

  renderList();
}