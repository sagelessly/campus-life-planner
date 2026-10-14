import { validateRecord } from './validators.js';

const $ = (sel) => document.querySelector(sel);

function announce(message) {
  $('#save-status').textContent = message;
}

// ---------- form ----------
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
  resetForm();
  announce('Activity added.');
}

// ---------- start-up ----------
export function init() {
  $('#activity-form').addEventListener('submit', onSubmit);
}