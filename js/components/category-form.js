import { mountPushPage } from './push-page.js';

export function showCategoryForm({ category = null, initialType = 'expense' }) {
  const type = category?.type ?? initialType;
  const layer = document.createElement('div');
  layer.className = 'push-page-layer';
  layer.innerHTML = `
    <section class="push-page" role="dialog" aria-modal="true" aria-labelledby="category-page-title">
      <header class="push-page-header">
        <button class="push-page-back" type="button" data-back aria-label="Zurück">‹</button>
        <h2 id="category-page-title">${category ? 'Kategorie bearbeiten' : 'Kategorie hinzufügen'}</h2>
        <span class="push-page-header-spacer" aria-hidden="true"></span>
      </header>
      <form class="push-page-form">
        <div class="push-page-content">
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
          ${category ? '<button class="btn btn-ghost push-page-delete" type="button" data-delete>Kategorie löschen</button>' : ''}
        </div>
        <footer class="push-page-actions">
          <button class="btn btn-primary push-page-save" type="submit">${category ? 'Änderungen speichern' : 'Kategorie hinzufügen'}</button>
        </footer>
      </form>
    </section>`;

  const navigation = mountPushPage(layer, { historyKey: 'monetaCategoryPage' });
  const form = layer.querySelector('form');
  const typeInput = form.elements.type;

  layer.querySelectorAll('[data-type]').forEach((button) => {
    button.addEventListener('click', () => {
      typeInput.value = button.dataset.type;
      layer.querySelectorAll('[data-type]').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(null));
  layer.querySelector('[data-delete]')?.addEventListener('click', () => navigation.close({ deleteRequested: true, category }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    navigation.close({
      id: category?.id,
      type: data.get('type'),
      icon: data.get('icon'),
      name: data.get('name')
    });
  });

  requestAnimationFrame(() => layer.querySelector('input[name="name"]')?.focus({ preventScroll: true }));
  return navigation.promise;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }
