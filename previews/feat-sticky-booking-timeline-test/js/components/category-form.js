import { mountPushPage } from './push-page.js';

const CATEGORY_ICONS = ['🛒','🍽️','☕','🏠','⚡','🚗','⛽','🚌','🛍️','🎬','🎮','💊','🏥','✈️','🎁','🐾','📱','💻','💰','💼','📈','🏦','🎓','🧾'];

export function showCategoryForm({ category = null, initialType = 'expense' }) {
  const type = category?.type ?? initialType;
  const selectedIcon = category?.icon ?? '';
  const icons = selectedIcon && !CATEGORY_ICONS.includes(selectedIcon) ? [selectedIcon, ...CATEGORY_ICONS] : CATEGORY_ICONS;
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
          <input type="hidden" name="icon" value="${escapeAttr(selectedIcon)}" />
          <div class="segmented" aria-label="Kategorietyp">
            <button type="button" data-type="expense" class="${type === 'expense' ? 'active' : ''}">Ausgabe</button>
            <button type="button" data-type="income" class="${type === 'income' ? 'active' : ''}">Einnahme</button>
          </div>
          <div class="field">
            <label>Icon</label>
            <div class="category-icon-picker" role="radiogroup" aria-label="Kategorie-Icon auswählen">
              ${icons.map((icon) => `<button type="button" class="category-icon-option${icon === selectedIcon ? ' selected' : ''}" data-category-icon="${escapeAttr(icon)}" role="radio" aria-checked="${icon === selectedIcon ? 'true' : 'false'}">${escapeHtml(icon)}</button>`).join('')}
            </div>
            <button type="button" class="category-icon-clear" data-category-icon-clear ${selectedIcon ? '' : 'hidden'}>Kein Icon</button>
          </div>
          <div class="field">
            <label for="category-name">Name</label>
            <input id="category-name" name="name" maxlength="50" required value="${escapeAttr(category?.name ?? '')}" placeholder="z. B. Café" autocomplete="off" />
          </div>
          <p class="form-hint">Einnahmen und Ausgaben haben getrennte Kategorien. Wähle ein Icon aus der Liste oder lasse es leer.</p>
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
  const iconInput = form.elements.icon;
  const clearIconButton = layer.querySelector('[data-category-icon-clear]');

  layer.querySelectorAll('[data-type]').forEach((button) => {
    button.addEventListener('click', () => {
      typeInput.value = button.dataset.type;
      layer.querySelectorAll('[data-type]').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  layer.querySelectorAll('[data-category-icon]').forEach((button) => {
    button.addEventListener('click', () => {
      iconInput.value = button.dataset.categoryIcon;
      layer.querySelectorAll('[data-category-icon]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-checked', selected ? 'true' : 'false');
      });
      clearIconButton.hidden = false;
    });
  });

  clearIconButton.addEventListener('click', () => {
    iconInput.value = '';
    layer.querySelectorAll('[data-category-icon]').forEach((item) => {
      item.classList.remove('selected');
      item.setAttribute('aria-checked', 'false');
    });
    clearIconButton.hidden = true;
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
