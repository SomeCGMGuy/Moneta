import { registerOverlayHistory } from './components/overlay-history.js';

const PREVIEW_LIMIT = 5;
const FINANCIAL_SHEET_EXIT_MS = 180;
let financialSheetHistoryGuard = null;
let financialSheetReturnFocus = null;

document.addEventListener('input', (event) => {
  const input = event.target.closest('[data-category-search]');
  if (!input) return;
  updateCategoryGroup(input.dataset.categorySearch, input.value);
});

document.addEventListener('click', (event) => {
  const openFinancial = event.target.closest('[data-financial-start-open]');
  if (openFinancial) { openFinancialStartSheet(openFinancial); return; }

  const day = event.target.closest('[data-financial-day]');
  if (day) {
    const input = document.querySelector('[data-financial-start]');
    if (input) {
      input.value = day.dataset.financialDay;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    closeFinancialStartSheet();
    return;
  }

  if (event.target.matches('[data-financial-sheet-backdrop]') || event.target.closest('[data-financial-sheet-close]')) { closeFinancialStartSheet(); return; }

  const button = event.target.closest('[data-category-show-more]');
  if (!button) return;
  const type = button.dataset.categoryShowMore;
  const group = document.querySelector(`[data-category-group="${CSS.escape(type)}"]`);
  if (!group) return;
  const rows = [...group.querySelectorAll('[data-category-row]')];
  const expanded = button.dataset.expanded === 'true';
  rows.forEach((row, index) => { row.hidden = expanded && index >= PREVIEW_LIMIT; });
  button.dataset.expanded = expanded ? 'false' : 'true';
  button.textContent = expanded ? `Alle ${rows.length} anzeigen` : 'Weniger anzeigen';
});

document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeFinancialStartSheet(); });

function openFinancialStartSheet(trigger) {
  document.querySelector('[data-financial-sheet-backdrop]')?.remove();
  financialSheetHistoryGuard?.release();
  financialSheetReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  const current = Number(document.querySelector('[data-financial-start]')?.value || 28);
  const sheet = document.createElement('div');
  sheet.className = 'financial-sheet-backdrop';
  sheet.dataset.financialSheetBackdrop = '';
  sheet.innerHTML = `<section class="financial-sheet" role="dialog" aria-modal="true" aria-labelledby="financial-sheet-title">
    <div class="financial-sheet-handle" aria-hidden="true"></div>
    <header class="financial-sheet-header"><div><span class="financial-sheet-kicker">Finanzmonat</span><h2 id="financial-sheet-title">Starttag wählen</h2></div><button type="button" class="financial-sheet-close" data-financial-sheet-close aria-label="Schließen">×</button></header>
    <div class="financial-day-grid" role="radiogroup" aria-label="Starttag des Finanzmonats">${Array.from({ length: 28 }, (_, index) => index + 1).map((value) => `<button type="button" role="radio" aria-checked="${value === current}" class="financial-day-option${value === current ? ' selected' : ''}" data-financial-day="${value}">${value}</button>`).join('')}</div>
    <p class="financial-sheet-hint">Die Auswahl wird sofort übernommen.</p>
  </section>`;
  document.body.append(sheet);
  financialSheetHistoryGuard = registerOverlayHistory(() => closeFinancialStartSheet({ fromHistory: true }), 'monetaFinancialSheet');
  requestAnimationFrame(() => sheet.classList.add('open'));
  sheet.querySelector('.financial-day-option.selected')?.focus({ preventScroll: true });
}

function closeFinancialStartSheet({ fromHistory = false } = {}) {
  const sheet = document.querySelector('[data-financial-sheet-backdrop]');
  if (!sheet || sheet.classList.contains('closing')) return;
  if (fromHistory) financialSheetHistoryGuard?.release(); else financialSheetHistoryGuard?.consume();
  financialSheetHistoryGuard = null;
  sheet.classList.remove('open');
  sheet.classList.add('closing');
  window.setTimeout(() => {
    sheet.remove();
    if (financialSheetReturnFocus?.isConnected) financialSheetReturnFocus.focus({ preventScroll: true });
    financialSheetReturnFocus = null;
  }, FINANCIAL_SHEET_EXIT_MS);
}

function updateCategoryGroup(type, value) {
  const group = document.querySelector(`[data-category-group="${CSS.escape(type)}"]`);
  if (!group) return;
  const query = normalize(value);
  const rows = [...group.querySelectorAll('[data-category-row]')];
  const showMore = group.querySelector('[data-category-show-more]');
  let visible = 0;
  rows.forEach((row, index) => {
    const matches = !query || normalize(row.dataset.categoryName).includes(query);
    const expanded = showMore?.dataset.expanded === 'true';
    const inPreview = expanded || index < PREVIEW_LIMIT;
    row.hidden = query ? !matches : !inPreview;
    if (!row.hidden) visible += 1;
  });
  if (showMore) showMore.hidden = Boolean(query);
  const empty = group.querySelector('[data-category-search-empty]');
  if (empty) empty.hidden = visible > 0;
}

function normalize(value) { return String(value ?? '').trim().toLocaleLowerCase('de-DE'); }
