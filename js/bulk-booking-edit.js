import { getBooking, saveBooking } from './services/booking-service.js';
import { listCategories } from './services/category-service.js';
import { showChoiceSheet } from './components/choice-sheet.js';
import { registerOverlayHistory } from './components/overlay-history.js';

const LONG_PRESS_MS = 460;
const selected = new Map();
let selectionActive = false;
let pressTimer = null;
let pressStart = null;
let suppressClickUntil = 0;
let selectionHistoryActive = false;
let selectionChildOverlayActive = false;

const rowFromEvent = (event) => event.target.closest('[data-booking-id]');
const visibleBookingRows = () => [...document.querySelectorAll('[data-booking-id]')].filter((row) => row.getClientRects().length && getComputedStyle(row).visibility !== 'hidden');

async function getSelectableBooking(row, { quiet = false } = {}) {
  const booking = row?.dataset.bookingId ? await getBooking(row.dataset.bookingId) : null;
  if (!booking) return null;
  if (booking.recurrenceRuleId) {
    if (!quiet) showToast('Wiederkehrende Buchungen bitte einzeln bearbeiten.');
    return null;
  }
  return booking;
}

async function startSelection(row) {
  const booking = await getSelectableBooking(row);
  if (!booking) return;
  selectionActive = true;
  selected.set(booking.id, booking);
  document.body.classList.add('bulk-selection-active');
  history.pushState({ ...(history.state ?? {}), monetaBulkSelection: true }, '', location.href);
  selectionHistoryActive = true;
  renderSelection();
}

async function toggleSelection(row) {
  const id = row?.dataset.bookingId;
  if (!id) return;
  if (selected.has(id)) selected.delete(id);
  else {
    const booking = await getSelectableBooking(row);
    if (!booking) return;
    selected.set(id, booking);
  }
  renderSelection();
}

async function toggleAllVisible() {
  const selectable = [];
  for (const row of visibleBookingRows()) {
    const booking = await getSelectableBooking(row, { quiet: true });
    if (booking) selectable.push(booking);
  }
  if (!selectable.length) return;
  const allSelected = selectable.every((booking) => selected.has(booking.id));
  if (allSelected) selected.clear();
  else selectable.forEach((booking) => selected.set(booking.id, booking));
  renderSelection();
}

function renderSelection() {
  document.querySelectorAll('[data-booking-id]').forEach((row) => {
    let control = row.querySelector('.bulk-select-control');
    if (!control) {
      control = document.createElement('span');
      control.className = 'bulk-select-control';
      control.setAttribute('aria-hidden', 'true');
      control.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6.8 12.3 3.2 3.2 7.3-7.3"/></svg>';
      row.prepend(control);
    }
    const isSelected = selected.has(row.dataset.bookingId);
    row.classList.toggle('bulk-selected', isSelected);
    row.setAttribute('aria-pressed', String(isSelected));
  });
  updateToolbar();
}

function ensureToolbar() {
  let bar = document.querySelector('[data-bulk-toolbar]');
  if (bar) return bar;
  bar = document.createElement('aside');
  bar.className = 'bulk-action-bar';
  bar.dataset.bulkToolbar = '';
  bar.innerHTML = `<div class="bulk-action-head"><button type="button" class="bulk-close" data-bulk-close aria-label="Auswahl beenden"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button><strong data-bulk-count></strong><button type="button" class="bulk-toggle-all" data-bulk-toggle-all>Alle</button></div><div class="bulk-action-buttons"><button type="button" class="bulk-action-button" data-bulk-date><svg viewBox="0 0 24 24"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg><span>Datum</span></button><button type="button" class="bulk-action-button" data-bulk-category><svg viewBox="0 0 24 24"><path d="M4 5h7l9 9-6 6-9-9V5Z"/><circle cx="8.2" cy="8.2" r="1.2"/></svg><span>Kategorie</span></button></div>`;
  document.body.append(bar);
  bar.querySelector('[data-bulk-close]').addEventListener('click', requestClose);
  bar.querySelector('[data-bulk-toggle-all]').addEventListener('click', toggleAllVisible);
  bar.querySelector('[data-bulk-date]').addEventListener('click', changeDate);
  bar.querySelector('[data-bulk-category]').addEventListener('click', changeCategory);
  return bar;
}

async function updateToolbar() {
  const bar = ensureToolbar();
  bar.querySelector('[data-bulk-count]').textContent = `${selected.size} ausgewählt`;
  const types = new Set([...selected.values()].map((booking) => booking.type));
  bar.querySelector('[data-bulk-date]').disabled = selected.size === 0;
  bar.querySelector('[data-bulk-category]').disabled = selected.size === 0 || types.size !== 1;
  const selectableIds = [];
  for (const row of visibleBookingRows()) {
    const booking = await getSelectableBooking(row, { quiet: true });
    if (booking) selectableIds.push(booking.id);
  }
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const toggle = bar.querySelector('[data-bulk-toggle-all]');
  toggle.textContent = allSelected ? 'Aufheben' : 'Alle';
  toggle.setAttribute('aria-label', allSelected ? 'Markierung aufheben' : 'Alle sichtbaren Buchungen auswählen');
}

function cleanupSelection() {
  selectionActive = false;
  selectionChildOverlayActive = false;
  selected.clear();
  document.body.classList.remove('bulk-selection-active');
  document.querySelector('[data-bulk-toolbar]')?.remove();
  document.querySelectorAll('.bulk-select-control').forEach((node) => node.remove());
  document.querySelectorAll('.bulk-selected').forEach((row) => row.classList.remove('bulk-selected'));
  document.querySelectorAll('[data-booking-id][aria-pressed]').forEach((row) => row.removeAttribute('aria-pressed'));
}

function requestClose() {
  if (selectionHistoryActive) history.back();
  else cleanupSelection();
}

window.addEventListener('popstate', (event) => {
  if (!selectionActive) return;
  if (selectionChildOverlayActive) return;
  if (event.state?.monetaBulkSelection) return;
  selectionHistoryActive = false;
  cleanupSelection();
});

async function changeCategory() {
  if (!selected.size) return;
  const types = new Set([...selected.values()].map((booking) => booking.type));
  if (types.size !== 1) return showToast('Einnahmen und Ausgaben können nicht gemeinsam einer Kategorie zugeordnet werden.');
  const type = [...types][0];
  const categories = await listCategories(type);
  selectionChildOverlayActive = true;
  try {
    const categoryId = await showChoiceSheet({ title: `Kategorie für ${selected.size} Buchungen`, options: categories.map((category) => ({ value: category.id, label: category.name, icon: category.icon || '•' })), searchable: categories.length > 5, searchPlaceholder: 'Kategorien durchsuchen' });
    if (!categoryId) return;
    await applyBulkChange((booking) => ({ ...booking, categoryId }));
  } finally {
    selectionChildOverlayActive = false;
  }
}

async function changeDate() {
  if (!selected.size) return;
  const dates = new Set([...selected.values()].map((booking) => booking.date));
  const initialDate = dates.size === 1 ? [...dates][0] : localIsoDate(new Date());
  selectionChildOverlayActive = true;
  try {
    const date = await showDateSheet(initialDate, selected.size);
    if (!date) return;
    await applyBulkChange((booking) => ({ ...booking, date }));
  } finally {
    selectionChildOverlayActive = false;
  }
}

async function applyBulkChange(transform) {
  const bookings = [...selected.values()];
  try {
    for (const booking of bookings) await saveBooking(transform(booking));
    const count = bookings.length;
    cleanupSelection();
    if (selectionHistoryActive) {
      selectionHistoryActive = false;
      history.back();
      await delay(80);
    }
    await refreshOverview();
    showToast(`${count} Buchung${count === 1 ? '' : 'en'} geändert.`);
  } catch (error) {
    showToast(error?.message || 'Die Buchungen konnten nicht geändert werden.');
  }
}

function showDateSheet(initialDate, count) {
  return new Promise((resolve) => {
    const layer = document.createElement('div');
    layer.className = 'choice-sheet-backdrop bulk-date-backdrop';
    layer.innerHTML = `<section class="choice-sheet bulk-date-sheet" role="dialog" aria-modal="true" aria-labelledby="bulk-date-title"><div class="choice-sheet-handle" aria-hidden="true"></div><header class="choice-sheet-header"><h2 id="bulk-date-title">Datum für ${count} Buchung${count === 1 ? '' : 'en'}</h2><button type="button" class="choice-sheet-close" data-date-close aria-label="Schließen">×</button></header><label class="bulk-date-field"><span>Neues Datum</span><input type="date" data-bulk-date-input value="${escapeAttr(initialDate)}" /></label><div class="bulk-date-actions"><button type="button" class="btn btn-ghost" data-date-close>Abbrechen</button><button type="button" class="btn btn-primary" data-date-apply>Übernehmen</button></div></section>`;
    document.body.append(layer);
    const input = layer.querySelector('[data-bulk-date-input]');
    let closing = false;
    let historyGuard;
    const close = (value = null, { fromHistory = false } = {}) => {
      if (closing) return;
      closing = true;
      if (fromHistory) historyGuard?.release(); else historyGuard?.consume();
      layer.classList.remove('open');
      layer.classList.add('closing');
      setTimeout(() => { layer.remove(); resolve(value); }, 180);
    };
    historyGuard = registerOverlayHistory(() => close(null, { fromHistory: true }), 'monetaBulkDate');
    layer.addEventListener('click', (event) => {
      if (event.target === layer || event.target.closest('[data-date-close]')) return close(null);
      if (event.target.closest('[data-date-apply]')) close(input.value || null);
    });
    requestAnimationFrame(() => layer.classList.add('open'));
  });
}

async function refreshOverview() {
  const originalMonth = document.querySelector('[data-active-month]')?.dataset.activeMonth;
  const nextButton = document.querySelector('[data-month="next"]');
  if (!originalMonth || !nextButton) return;
  const cover = document.createElement('div');
  cover.className = 'bulk-refresh-cover';
  document.body.append(cover);
  try {
    nextButton.click();
    await waitFor(() => document.querySelector('[data-active-month]')?.dataset.activeMonth !== originalMonth);
    document.querySelector('[data-month="prev"]')?.click();
    await waitFor(() => document.querySelector('[data-active-month]')?.dataset.activeMonth === originalMonth);
  } finally { cover.remove(); }
}

function waitFor(test, timeout = 2400) {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => test() || performance.now() - started > timeout ? resolve() : requestAnimationFrame(tick);
    tick();
  });
}

function showToast(message) {
  document.querySelector('.bulk-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'bulk-toast';
  toast.textContent = message;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 180); }, 2200);
}

function clearPress() {
  if (pressTimer) clearTimeout(pressTimer);
  pressTimer = null;
  pressStart = null;
}

document.addEventListener('pointerdown', (event) => {
  if (selectionActive) return;
  const row = rowFromEvent(event);
  if (!row || (event.pointerType === 'mouse' && event.button !== 0)) return;
  pressStart = { x: event.clientX, y: event.clientY };
  pressTimer = setTimeout(async () => {
    suppressClickUntil = Date.now() + 700;
    await startSelection(row);
    clearPress();
  }, LONG_PRESS_MS);
}, true);

document.addEventListener('pointermove', (event) => {
  if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 10) clearPress();
}, true);
document.addEventListener('pointerup', clearPress, true);
document.addEventListener('pointercancel', clearPress, true);

document.addEventListener('click', async (event) => {
  const row = rowFromEvent(event);
  if (!row) return;
  if (Date.now() < suppressClickUntil || selectionActive) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (selectionActive && Date.now() >= suppressClickUntil) await toggleSelection(row);
  }
}, true);

function localIsoDate(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function escapeAttr(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
