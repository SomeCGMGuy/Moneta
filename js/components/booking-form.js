import { listCategories } from '../services/category-service.js';
import { listBookings } from '../services/booking-service.js';
import { mountPushPage } from './push-page.js';
import { showChoiceSheet } from './choice-sheet.js';

const FOCUS_DELAY_MS = 210;
const MAX_SUGGESTIONS = 4;
const RECURRENCE_OPTIONS = [
  { value: 'weekly', label: 'Wöchentlich', icon: '↻' },
  { value: 'monthly', label: 'Monatlich', icon: '↻' },
  { value: 'yearly', label: 'Jährlich', icon: '↻' }
];

export async function showBookingForm({ booking = null }) {
  const type = booking?.type ?? 'expense';
  const layer = document.createElement('div');
  layer.className = 'push-page-layer';
  let categories = await listCategories(type);
  const bookingHistory = await listBookings();
  layer.innerHTML = buildMarkup(booking, type, categories, defaultBookingDate());
  const navigation = mountPushPage(layer, { historyKey: 'monetaBookingPage' });
  const form = layer.querySelector('form');
  const typeInput = form.elements.type;
  const categoryInput = form.elements.categoryId;
  const recurrenceInput = form.elements.recurrenceFrequency;
  const titleInput = form.elements.title;
  const noteInput = form.elements.note;
  const suggestions = layer.querySelector('[data-title-suggestions]');
  const recurrenceToggle = layer.querySelector('[data-recurrence-toggle]');
  const noteToggle = layer.querySelector('[data-note-toggle]');
  const recurrenceDetails = layer.querySelector('[data-recurrence-details]');
  const noteDetails = layer.querySelector('[data-note-details]');
  let categoryManuallySelected = false;

  const selectedCategory = () => categories.find((row) => row.id === categoryInput.value) ?? categories[0] ?? null;
  const updateCategoryDisplay = () => {
    const category = selectedCategory();
    layer.querySelector('[data-category-value]').textContent = category ? `${category.icon || '•'} ${category.name}` : 'Kategorie wählen';
  };
  const updateRecurrenceDisplay = () => {
    const enabled = recurrenceToggle.checked;
    recurrenceDetails.hidden = !enabled;
    if (!enabled) recurrenceInput.value = 'none';
    else if (recurrenceInput.value === 'none') recurrenceInput.value = 'monthly';
    const option = RECURRENCE_OPTIONS.find((row) => row.value === recurrenceInput.value) ?? RECURRENCE_OPTIONS[1];
    layer.querySelector('[data-recurrence-value]').textContent = option.label;
  };
  const updateNoteDisplay = () => {
    noteDetails.hidden = !noteToggle.checked;
    if (noteToggle.checked) window.setTimeout(() => noteInput.focus({ preventScroll: true }), 0);
  };
  const refreshCategories = async (nextType) => {
    categories = await listCategories(nextType);
    const existingCategory = booking?.type === nextType ? booking.categoryId : null;
    if (existingCategory && categories.some((row) => row.id === existingCategory)) categoryInput.value = existingCategory;
    else if (!categories.some((row) => row.id === categoryInput.value)) categoryInput.value = categories[0]?.id ?? '';
    categoryManuallySelected = false;
    updateCategoryDisplay();
  };
  const setType = async (nextType) => {
    typeInput.value = nextType;
    layer.querySelectorAll('[data-type]').forEach((button) => button.classList.toggle('active', button.dataset.type === nextType));
    await refreshCategories(nextType);
    renderSuggestions();
  };
  const matchingSuggestions = () => {
    const query = normalizeTitle(titleInput.value);
    if (!query) return [];
    const matches = new Map();
    bookingHistory.forEach((row) => {
      if (row.isProjected || row.type !== typeInput.value || !row.title) return;
      const normalized = normalizeTitle(row.title);
      if (!normalized.startsWith(query) || normalized === query) return;
      const current = matches.get(normalized) ?? { title: row.title.trim(), categories: new Map(), count: 0, lastDate: '' };
      current.count += 1;
      current.lastDate = current.lastDate > (row.date ?? '') ? current.lastDate : (row.date ?? '');
      current.categories.set(row.categoryId, (current.categories.get(row.categoryId) ?? 0) + 1);
      matches.set(normalized, current);
    });
    return [...matches.values()].map((item) => ({ ...item, categoryId: [...item.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' })).sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate) || a.title.localeCompare(b.title)).slice(0, MAX_SUGGESTIONS);
  };
  const hideSuggestions = () => { suggestions.hidden = true; suggestions.innerHTML = ''; };
  const renderSuggestions = () => {
    const rows = matchingSuggestions();
    if (!rows.length) return hideSuggestions();
    suggestions.innerHTML = rows.map((row) => `<button type="button" class="booking-title-suggestion" data-suggestion-title="${escapeAttr(row.title)}" data-suggestion-category="${escapeAttr(row.categoryId)}"><span>${escapeHtml(row.title)}</span><small>aus bisherigen Buchungen</small></button>`).join('');
    suggestions.hidden = false;
  };
  const applyLearnedCategory = () => {
    if (categoryManuallySelected) return;
    const exact = bookingHistory.filter((row) => !row.isProjected && row.type === typeInput.value && normalizeTitle(row.title) === normalizeTitle(titleInput.value));
    if (!exact.length) return;
    const counts = new Map();
    exact.forEach((row) => counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1));
    const learnedCategory = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (learnedCategory && categories.some((row) => row.id === learnedCategory)) { categoryInput.value = learnedCategory; updateCategoryDisplay(); }
  };

  layer.querySelectorAll('[data-type]').forEach((button) => button.addEventListener('click', () => setType(button.dataset.type)));
  layer.querySelector('[data-category-picker]').addEventListener('click', async () => {
    const value = await showChoiceSheet({ title: 'Kategorie wählen', options: categories.map((row) => ({ value: row.id, label: row.name, icon: row.icon || '•' })), selected: categoryInput.value, searchable: categories.length > 5, searchPlaceholder: 'Kategorien durchsuchen' });
    if (!value) return;
    categoryInput.value = value; categoryManuallySelected = true; updateCategoryDisplay();
  });
  recurrenceToggle.addEventListener('change', updateRecurrenceDisplay);
  noteToggle.addEventListener('change', updateNoteDisplay);
  layer.querySelector('[data-recurrence-picker]').addEventListener('click', async () => {
    const value = await showChoiceSheet({ title: 'Intervall', options: RECURRENCE_OPTIONS, selected: recurrenceInput.value });
    if (!value) return;
    recurrenceInput.value = value; updateRecurrenceDisplay();
  });
  titleInput.addEventListener('input', () => { renderSuggestions(); applyLearnedCategory(); });
  titleInput.addEventListener('focus', renderSuggestions);
  suggestions.addEventListener('pointerdown', (event) => event.preventDefault());
  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-suggestion-title]');
    if (!button) return;
    titleInput.value = button.dataset.suggestionTitle;
    if (!categoryManuallySelected && button.dataset.suggestionCategory && categories.some((row) => row.id === button.dataset.suggestionCategory)) { categoryInput.value = button.dataset.suggestionCategory; updateCategoryDisplay(); }
    hideSuggestions(); titleInput.focus({ preventScroll: true });
  });
  titleInput.addEventListener('blur', () => window.setTimeout(hideSuggestions, 100));
  updateCategoryDisplay(); updateRecurrenceDisplay();
  if (!booking) window.setTimeout(() => { if (layer.isConnected) layer.querySelector('#booking-amount')?.focus({ preventScroll: true }); }, FOCUS_DELAY_MS);
  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(null));
  layer.querySelector('[data-delete]')?.addEventListener('click', () => navigation.close({ deleteRequested: true, booking }));
  form.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(form);
    navigation.close({ id: booking?.id, type: data.get('type'), amount: data.get('amount'), categoryId: data.get('categoryId'), title: data.get('title'), note: noteToggle.checked ? data.get('note') : '', date: data.get('date'), recurrenceFrequency: recurrenceToggle.checked ? data.get('recurrenceFrequency') : 'none', recurrenceEndDate: recurrenceToggle.checked ? data.get('recurrenceEndDate') : '' });
  });
  return navigation.promise;
}

function buildMarkup(booking, type, categories, defaultDate) {
  const title = booking ? 'Buchung bearbeiten' : 'Neue Buchung';
  const recurrenceFrequency = booking?.recurrenceFrequency ?? 'none';
  const recurrenceEnabled = recurrenceFrequency !== 'none';
  const noteEnabled = Boolean(String(booking?.note ?? '').trim());
  const initialCategory = categories.find((row) => row.id === booking?.categoryId) ?? categories[0] ?? null;
  return `<section class="push-page" role="dialog" aria-modal="true" aria-labelledby="booking-page-title">
    <header class="push-page-header"><button class="push-page-back" type="button" data-back aria-label="Zurück">‹</button><h2 id="booking-page-title">${title}</h2><span class="push-page-header-spacer" aria-hidden="true"></span></header>
    <form class="push-page-form booking-push-form"><div class="push-page-content booking-editor">
      <input type="hidden" name="type" value="${type}" /><input type="hidden" name="categoryId" value="${escapeAttr(initialCategory?.id ?? '')}" /><input type="hidden" name="recurrenceFrequency" value="${escapeAttr(recurrenceFrequency)}" />
      <div class="segmented booking-type" aria-label="Buchungstyp"><button type="button" data-type="expense" class="${type === 'expense' ? 'active' : ''}">Ausgabe</button><button type="button" data-type="income" class="${type === 'income' ? 'active' : ''}">Einnahme</button></div>
      <div class="field booking-amount-field"><label for="booking-amount">Betrag</label><div class="booking-amount-input"><input id="booking-amount" name="amount" inputmode="decimal" type="number" min="0.01" step="0.01" required value="${booking?.amount ?? ''}" placeholder="0,00" /><span>€</span></div></div>
      <div class="field booking-title-field"><label for="booking-title">Bezeichnung</label><div class="booking-title-autocomplete"><input id="booking-title" name="title" maxlength="120" required autocomplete="off" aria-autocomplete="list" aria-controls="booking-title-suggestions" value="${escapeAttr(booking?.title ?? '')}" placeholder="Wofür?" /><div id="booking-title-suggestions" class="booking-title-suggestions" data-title-suggestions role="listbox" hidden></div></div></div>
      <div class="field"><label>Kategorie</label><button class="native-select-row" type="button" data-category-picker><span class="native-select-value" data-category-value></span><span class="native-select-chevron" aria-hidden="true">›</span></button></div>
      <div class="field"><label for="booking-date">Datum</label><input id="booking-date" name="date" type="date" required value="${escapeAttr(booking?.date ?? defaultDate)}" /></div>
      <label class="booking-toggle-row"><span><strong>Wiederholung</strong><small>Regelmäßige Buchung planen</small></span><input class="material-switch" type="checkbox" data-recurrence-toggle ${recurrenceEnabled ? 'checked' : ''} /><span class="material-switch-track" aria-hidden="true"></span></label>
      <div class="booking-progressive" data-recurrence-details ${recurrenceEnabled ? '' : 'hidden'}><div class="field"><label>Intervall</label><button class="native-select-row" type="button" data-recurrence-picker><span class="native-select-value" data-recurrence-value></span><span class="native-select-chevron" aria-hidden="true">›</span></button></div><div class="field"><label for="booking-recurrence-end">Endet am <span aria-hidden="true">·</span> optional</label><input id="booking-recurrence-end" name="recurrenceEndDate" type="date" min="${escapeAttr(booking?.date ?? defaultDate)}" value="${escapeAttr(booking?.recurrenceEndDate ?? '')}" /></div><p class="form-hint">Zukünftige Termine werden als Prognose in Salden und Statistiken berücksichtigt.</p></div>
      <label class="booking-toggle-row"><span><strong>Notiz</strong><small>Zusätzliche Informationen</small></span><input class="material-switch" type="checkbox" data-note-toggle ${noteEnabled ? 'checked' : ''} /><span class="material-switch-track" aria-hidden="true"></span></label>
      <div class="field booking-progressive" data-note-details ${noteEnabled ? '' : 'hidden'}><label for="booking-note">Notiz</label><textarea id="booking-note" name="note" maxlength="500" placeholder="Zusätzliche Informationen">${escapeHtml(booking?.note ?? '')}</textarea></div>
    </div><footer class="push-page-actions booking-fixed-actions">${booking ? '<button class="btn btn-ghost booking-footer-delete" type="button" data-delete>Löschen</button>' : ''}<button class="btn btn-primary push-page-save" type="submit">${booking ? 'Änderungen speichern' : 'Buchung hinzufügen'}</button></footer></form>
  </section>`;
}

function normalizeTitle(value) { return String(value ?? '').trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' '); }
function defaultBookingDate() { const today = new Date(); const activeMonth = document.querySelector('[data-active-month]')?.dataset.activeMonth; if (!/^\d{4}-\d{2}$/.test(activeMonth ?? '')) return localIsoDate(today); const [year, month] = activeMonth.split('-').map(Number); const lastDay = new Date(year, month, 0).getDate(); const day = Math.min(today.getDate(), lastDay); return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function localIsoDate(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
