export function showCategoryForm({ category = null, initialType = 'expense' }) {
  const root = document.querySelector('#modal-root');
  const type = category?.type ?? initialType;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <section class="modal modal-compact" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
      <div class="modal-header">
        <h2 id="category-modal-title">${category ? 'Kategorie bearbeiten' : 'Kategorie hinzufügen'}</h2>
        <button class="icon-btn" type="button" data-close aria-label="Schließen">×</button>
      </div>
      <form class="form-grid">
        <input type="hidden" name="type" value="${type}" />
        <div class="segmented" aria-label="Kategorietyp">
          <button type="button" data-type="expense" class="${type === 'expense' ? 'active' : ''}">Ausgabe</button>
          <button type="button" data-type="income" class="${type === 'income' ? 'active' : ''}">Einnahme</button>
        </div>
        <div class="category-form-grid">
          <div class="field category-icon-field">
            <label for="category-icon">Icon</label>
            <input id="category-icon" name="icon" maxlength="16" value="${escapeAttr(category?.icon ?? '')}" placeholder="z. B. ☕" autocomplete="off" />
          </div>
          <div class="field">
            <label for="category-name">Name</label>
            <input id="category-name" name="name" maxlength="50" required value="${escapeAttr(category?.name ?? '')}" placeholder="z. B. Café" autocomplete="off" />
          </div>
        </div>
        <p class="form-hint">Einnahmen und Ausgaben haben getrennte Kategorien. Das Icon ist optional.</p>
        <div class="form-actions">
          ${category ? '<button class="btn btn-ghost" type="button" data-delete style="color:var(--danger)">Kategorie löschen</button>' : ''}
          <div class="form-actions-right">
            <button class="btn btn-secondary" type="button" data-cancel>Abbrechen</button>
            <button class="btn btn-primary" type="submit">Speichern</button>
          </div>
        </div>
      </form>
    </section>`;
  root.append(backdrop);

  const form = backdrop.querySelector('form');
  const typeInput = form.elements.type;
  backdrop.querySelectorAll('[data-type]').forEach((button) => {
    button.addEventListener('click', () => {
      typeInput.value = button.dataset.type;
      backdrop.querySelectorAll('[data-type]').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  return new Promise((resolve) => {
    let settled = false;
    const close = (value) => {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      resolve(value);
    };
    const onKey = (event) => { if (event.key === 'Escape') close(null); };

    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(null); });
    backdrop.querySelector('[data-close]').addEventListener('click', () => close(null));
    backdrop.querySelector('[data-cancel]').addEventListener('click', () => close(null));
    backdrop.querySelector('[data-delete]')?.addEventListener('click', () => close({ deleteRequested: true, category }));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      close({
        id: category?.id,
        type: data.get('type'),
        icon: data.get('icon'),
        name: data.get('name')
      });
    });
    document.addEventListener('keydown', onKey);
    backdrop.querySelector('input[name="name"]').focus();
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }
