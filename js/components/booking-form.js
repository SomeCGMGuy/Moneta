import { listCategories } from '../services/category-service.js';
import { listBookings } from '../services/booking-service.js';
import { mountPushPage } from './push-page.js';

const FOCUS_DELAY_MS = 210;
const MAX_SUGGESTIONS = 4;

export async function showBookingForm({ booking = null }) {
  const type = booking?.type ?? 'expense';
  const layer = document.createElement('div');
  layer.className = 'push-page-layer';
  const [categories, bookingHistory] = await Promise.all([listCategories(type), listBookings()]);
  layer.innerHTML = buildMarkup(booking, type, categories, defaultBookingDate());
  const navigation = mountPushPage(layer, { historyKey: 'monetaBookingPage' });
  const form = layer.querySelector('form');
  const typeInput = form.elements.type;
  const categorySelect = form.elements.categoryId;
  const titleInput = form.elements.title;
  const suggestions = layer.querySelector('[data-title-suggestions]');
  const recurrenceSelect = form.elements.recurrenceFrequency;
  const recurrenceEndField = layer.querySelector('[data-recurrence-end-field]');

  const refreshCategories = async (nextType) => {
    const rows = await listCategories(nextType);
    categorySelect.innerHTML = rows.map((category) => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</option>`).join('');
    const existingCategory = booking?.type === nextType ? booking.categoryId : null;
    if (existingCategory) categorySelect.value = existingCategory;
  };
  const setType = async (nextType) => {
    typeInput.value = nextType;
    layer.querySelectorAll('[data-type]').forEach((button) => button.classList.toggle('active', button.dataset.type === nextType));
    await refreshCategories(nextType);
    renderSuggestions();
  };
  const updateRecurrenceVisibility = () => {
    recurrenceEndField.hidden = recurrenceSelect.value === 'none';
  };
  const matchingSuggestions = () => {
    const query = normalizeTitle(titleInput.value);
    if (!query) return [];
    const matches = new Map();
    bookingHistory.forEach((row) => {
      if (row.isProjected || row.type !== typeInput.value || !row.title) return;
      const normalized = normalizeTitle(row.title);
      if (!normalized.startsWith(query) || normalized === query) return;
      const key = normalized;
      const current = matches.get(key) ?? { title: row.title.trim(), categories: new Map(), count: 0, lastDate: '' };
      current.count += 1;
      current.lastDate = current.lastDate > (row.date ?? '') ? current.lastDate : (row.date ?? '');
      current.categories.set(row.categoryId, (current.categories.get(row.categoryId) ?? 0) + 1);
      matches.set(key, current);
    });
    return [...matches.values()]
      .map((item) => ({ ...item, categoryId: [...item.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' }))
      .sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate) || a.title.localeCompare(b.title))
      .slice(0, MAX_SUGGESTIONS);
  };
  const hideSuggestions = () => {
    suggestions.hidden = true;
    suggestions.innerHTML = '';
  };
  const renderSuggestions = () => {
    const rows = matchingSuggestions();
    if (!rows.length) return hideSuggestions();
    suggestions.innerHTML = rows.map((row) => `<button type="button" class="booking-title-suggestion" data-suggestion-title="${escapeAttr(row.title)}" data-suggestion-category="${escapeAttr(row.categoryId)}"><span>${escapeHtml(row.title)}</span><small>aus bisherigen Buchungen</small></button>`).join('');
    suggestions.hidden = false;
  };
  const applyLearnedCategory = () => {
    const exact = bookingHistory.filter((row) => !row.isProjected && row.type === typeInput.value && normalizeTitle(row.title) === normalizeTitle(titleInput.value));
    if (!exact.length) return;
    const counts = new Map();
    exact.forEach((row) => counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1));
    const learnedCategory = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (learnedCategory && [...categorySelect.options].some((option) => option.value === learnedCategory)) categorySelect.value = learnedCategory;
  };

  layer.querySelectorAll('[data-type]').forEach((button) => button.addEventListener('click', () => setType(button.dataset.type)));
  titleInput.addEventListener('input', () => { renderSuggestions(); applyLearnedCategory(); });
  titleInput.addEventListener('focus', renderSuggestions);
  suggestions.addEventListener('pointerdown', (event) => event.preventDefault());
  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-suggestion-title]');
    if (!button) return;
    titleInput.value = button.dataset.suggestionTitle;
    if (button.dataset.suggestionCategory && [...categorySelect.options].some((option) => option.value === button.dataset.suggestionCategory)) categorySelect.value = button.dataset.suggestionCategory;
    hideSuggestions();
    titleInput.focus({ preventScroll: true });
  });
  titleInput.addEventListener('blur', () => window.setTimeout(hideSuggestions, 100));
  recurrenceSelect.addEventListener('change', updateRecurrenceVisibility);
  updateRecurrenceVisibility();
  if (booking?.categoryId) categorySelect.value = booking.categoryId;
  if (!booking) window.setTimeout(() => { if (layer.isConnected) layer.querySelector('#booking-amount')?.focus({ preventScroll: true }); }, FOCUS_DELAY_MS);
  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(null));
  layer.querySelector('[data-delete]')?.addEventListener('click', () => navigation.close({ deleteRequested: true, booking }));
  form.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(form);
    navigation.close({
      id: booking?.id,
      type: data.get('type'),
      amount: data.get('amount'),
      categoryId: data.get('categoryId'),
      title: data.get('title'),
      note: data.get('note'),
      date: data.get('date'),
      recurrenceFrequency: data.get('recurrenceFrequency'),
      recurrenceEndDate: data.get('recurrenceEndDate')
    });
  });
  return navigation.promise;
}

function buildMarkup(booking, type, categories, defaultDate) {
  const title = booking ? 'Buchung bearbeiten' : 'Neue Buchung';
  const recurrenceFrequency = booking?.recurrenceFrequency ?? 'none';
  return `<section class="push-page" role="dialog" aria-modal="true" aria-labelledby="booking-page-title">
    <header class="push-page-header"><button class="push-page-back" type="button" data-back aria-label="Zurück">‹</button><h2 id="booking-page-title">${title}</h2><span class="push-page-header-spacer" aria-hidden="true"></span></header>
    <form class="push-page-form"><div class="push-page-content booking-editor">
      <input type="hidden" name="type" value="${type}" />
      <div class="segmented booking-type" aria-label="Buchungstyp"><button type="button" data-type="expense" class="${type === 'expense' ? 'active' : ''}">Ausgabe</button><button type="button" data-type="income" class="${type === 'income' ? 'active' : ''}">Einnahme</button></div>
      <div class="field booking-amount-field"><label for="booking-amount">Betrag</label><div class="booking-amount-input"><input id="booking-amount" name="amount" inputmode="decimal" type="number" min="0.01" step="0.01" required value="${booking?.amount ?? ''}" placeholder="0,00" /><span>€</span></div></div>
      <div class="field booking-title-field"><label for="booking-title">Bezeichnung</label><div class="booking-title-autocomplete"><input id="booking-title" name="title" maxlength="120" required autocomplete="off" aria-autocomplete="list" aria-controls="booking-title-suggestions" value="${escapeAttr(booking?.title ?? '')}" placeholder="Wofür?" /><div id="booking-title-suggestions" class="booking-title-suggestions" data-title-suggestions role="listbox" hidden></div></div></div>
      <div class="field"><label for="booking-category">Kategorie</label><select id="booking-category" name="categoryId" required>${categories.map((category) => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="booking-date">Datum</label><input id="booking-date" name="date" type="date" required value="${escapeAttr(booking?.date ?? defaultDate)}" /></div>
      <div class="field recurrence-field"><label for="booking-recurrence">Wiederholung</label><select id="booking-recurrence" name="recurrenceFrequency">
        ${recurrenceOption('none', 'Keine', recurrenceFrequency)}
        ${recurrenceOption('weekly', 'Wöchentlich', recurrenceFrequency)}
        ${recurrenceOption('monthly', 'Monatlich', recurrenceFrequency)}
        ${recurrenceOption('yearly', 'Jährlich', recurrenceFrequency)}
      </select><p class="form-hint">Zukünftige Termine werden als Prognose in Salden und Statistiken berücksichtigt.</p></div>
      <div class="field recurrence-end-field" data-recurrence-end-field><label for="booking-recurrence-end">Endet am <span aria-hidden="true">·</span> optional</label><input id="booking-recurrence-end" name="recurrenceEndDate" type="date" min="${escapeAttr(booking?.date ?? defaultDate)}" value="${escapeAttr(booking?.recurrenceEndDate ?? '')}" /></div>
      <div class="field"><label for="booking-note">Notiz <span aria-hidden="true">·</span> optional</label><textarea id="booking-note" name="note" maxlength="500" placeholder="Zusätzliche Informationen">${escapeHtml(booking?.note ?? '')}</textarea></div>
      ${booking ? '<button class="btn btn-ghost push-page-delete" type="button" data-delete>Buchung löschen</button>' : ''}
    </div><footer class="push-page-actions"><button class="btn btn-primary push-page-save" type="submit">${booking ? 'Änderungen speichern' : 'Buchung hinzufügen'}</button></footer></form>
  </section>`;
}

function recurrenceOption(value, label, selected) {
  return `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`;
}

function normalizeTitle(value) {
  return String(value ?? '').trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' ');
}

function defaultBookingDate() {
  const today = new Date(); const activeMonth = document.querySelector('[data-active-month]')?.dataset.activeMonth;
  if (!/^\d{4}-\d{2}$/.test(activeMonth ?? '')) return localIsoDate(today);
  const [year, month] = activeMonth.split('-').map(Number); const lastDay = new Date(year, month, 0).getDate(); const day = Math.min(today.getDate(), lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function localIsoDate(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function escapeHtml(value) { return String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
