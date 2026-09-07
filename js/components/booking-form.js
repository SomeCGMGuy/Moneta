import { listCategories } from '../services/category-service.js';
import { mountPushPage } from './push-page.js';

export async function showBookingForm({ booking = null }) {
  const type = booking?.type ?? 'expense';
  const layer = document.createElement('div');
  layer.className = 'push-page-layer';

  const categories = await listCategories(type);
  layer.innerHTML = buildMarkup(booking, type, categories, defaultBookingDate());
  const navigation = mountPushPage(layer, { historyKey: 'monetaBookingPage' });

  const form = layer.querySelector('form');
  const typeInput = form.elements.type;
  const categorySelect = form.elements.categoryId;

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
  };

  layer.querySelectorAll('[data-type]').forEach((button) => {
    button.addEventListener('click', () => setType(button.dataset.type));
  });

  if (booking?.categoryId) categorySelect.value = booking.categoryId;

  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(null));
  layer.querySelector('[data-delete]')?.addEventListener('click', () => navigation.close({ deleteRequested: true, booking }));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    navigation.close({
      id: booking?.id,
      type: data.get('type'),
      amount: data.get('amount'),
      categoryId: data.get('categoryId'),
      title: data.get('title'),
      note: data.get('note'),
      date: data.get('date')
    });
  });

  return navigation.promise;
}

function buildMarkup(booking, type, categories, defaultDate) {
  const title = booking ? 'Buchung bearbeiten' : 'Neue Buchung';
  return `
    <section class="push-page" role="dialog" aria-modal="true" aria-labelledby="booking-page-title">
      <header class="push-page-header">
        <button class="push-page-back" type="button" data-back aria-label="Zurück">‹</button>
        <h2 id="booking-page-title">${title}</h2>
        <span class="push-page-header-spacer" aria-hidden="true"></span>
      </header>

      <form class="push-page-form">
        <div class="push-page-content">
          <input type="hidden" name="type" value="${type}" />
          <div class="segmented" aria-label="Buchungstyp">
            <button type="button" data-type="expense" class="${type === 'expense' ? 'active' : ''}">Ausgabe</button>
            <button type="button" data-type="income" class="${type === 'income' ? 'active' : ''}">Einnahme</button>
          </div>
          <div class="field">
            <label for="booking-title">Bezeichnung</label>
            <input id="booking-title" name="title" maxlength="120" required value="${escapeAttr(booking?.title ?? '')}" placeholder="z. B. Supermarkt" />
          </div>
          <div class="field">
            <label for="booking-amount">Betrag</label>
            <input id="booking-amount" name="amount" inputmode="decimal" type="number" min="0.01" step="0.01" required value="${booking?.amount ?? ''}" placeholder="0,00" />
          </div>
          <div class="field">
            <label for="booking-category">Kategorie</label>
            <select id="booking-category" name="categoryId" required>${categories.map((category) => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label for="booking-date">Datum</label>
            <input id="booking-date" name="date" type="date" required value="${escapeAttr(booking?.date ?? defaultDate)}" />
          </div>
          <div class="field">
            <label for="booking-note">Notiz <span aria-hidden="true">·</span> optional</label>
            <textarea id="booking-note" name="note" maxlength="500" placeholder="Zusätzliche Informationen">${escapeHtml(booking?.note ?? '')}</textarea>
          </div>
          ${booking ? '<button class="btn btn-ghost push-page-delete" type="button" data-delete>Buchung löschen</button>' : ''}
        </div>

        <footer class="push-page-actions">
          <button class="btn btn-primary push-page-save" type="submit">${booking ? 'Änderungen speichern' : 'Buchung hinzufügen'}</button>
        </footer>
      </form>
    </section>`;
}

function defaultBookingDate() {
  const today = new Date();
  const activeMonth = document.querySelector('[data-active-month]')?.dataset.activeMonth;
  if (!/^\d{4}-\d{2}$/.test(activeMonth ?? '')) return localIsoDate(today);

  const [year, month] = activeMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(today.getDate(), lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function localIsoDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }
