import { listCategories } from '../services/category-service.js';

export async function showBookingForm({ booking = null, onDelete = null }) {
  const root = document.querySelector('#modal-root');
  const type = booking?.type ?? 'expense';
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const categories = await listCategories(type);
  backdrop.innerHTML = buildMarkup(booking, type, categories);
  root.append(backdrop);

  const form = backdrop.querySelector('form');
  const typeInput = form.elements.type;
  const categorySelect = form.elements.categoryId;

  const refreshCategories = async (nextType) => {
    const rows = await listCategories(nextType);
    categorySelect.innerHTML = rows.map((category) => `<option value="${category.id}">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</option>`).join('');
    const existingCategory = booking?.type === nextType ? booking.categoryId : null;
    if (existingCategory) categorySelect.value = existingCategory;
  };

  const setType = async (nextType) => {
    typeInput.value = nextType;
    backdrop.querySelectorAll('[data-type]').forEach((button) => button.classList.toggle('active', button.dataset.type === nextType));
    await refreshCategories(nextType);
  };

  backdrop.querySelectorAll('[data-type]').forEach((button) => {
    button.addEventListener('click', () => setType(button.dataset.type));
  });

  if (booking?.categoryId) categorySelect.value = booking.categoryId;

  return new Promise((resolve) => {
    let settled = false;
    const close = (value) => {
      if (settled) return;
      settled = true;
      backdrop.remove();
      resolve(value);
    };

    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(null); });
    backdrop.querySelector('[data-close]').addEventListener('click', () => close(null));
    backdrop.querySelector('[data-cancel]').addEventListener('click', () => close(null));

    const deleteButton = backdrop.querySelector('[data-delete]');
    if (deleteButton) {
      deleteButton.addEventListener('click', async () => {
        const deleted = await onDelete?.(booking);
        if (deleted) close({ deleted: true });
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      close({
        id: booking?.id,
        type: data.get('type'),
        amount: data.get('amount'),
        categoryId: data.get('categoryId'),
        title: data.get('title'),
        note: data.get('note'),
        date: data.get('date')
      });
    });
  });
}

function buildMarkup(booking, type, categories) {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return `
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div class="modal-header">
        <h2 id="booking-modal-title">${booking ? 'Buchung bearbeiten' : 'Buchung hinzufügen'}</h2>
        <button class="icon-btn" type="button" data-close aria-label="Schließen">×</button>
      </div>
      <form class="form-grid">
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
          <select id="booking-category" name="categoryId" required>${categories.map((category) => `<option value="${category.id}">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label for="booking-date">Datum</label>
          <input id="booking-date" name="date" type="date" required value="${booking?.date ?? localDate}" />
        </div>
        <div class="field">
          <label for="booking-note">Notiz <span aria-hidden="true">·</span> optional</label>
          <textarea id="booking-note" name="note" maxlength="500" placeholder="Zusätzliche Informationen">${escapeHtml(booking?.note ?? '')}</textarea>
        </div>
        <div class="form-actions">
          ${booking ? '<button class="btn btn-ghost" type="button" data-delete style="color:var(--danger)">Buchung löschen</button>' : ''}
          <div class="form-actions-right">
            <button class="btn btn-secondary" type="button" data-cancel>Abbrechen</button>
            <button class="btn btn-primary" type="submit">${booking ? 'Speichern' : 'Hinzufügen'}</button>
          </div>
        </div>
      </form>
    </section>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }
