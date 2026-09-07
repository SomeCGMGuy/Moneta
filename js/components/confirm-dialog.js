import { mountPushPage } from './push-page.js';

export function showConfirmDialog({ title, message, confirmLabel = 'Bestätigen', danger = false }) {
  const layer = document.createElement('div');
  layer.className = 'push-page-layer';
  layer.innerHTML = `
    <section class="push-page" role="dialog" aria-modal="true" aria-labelledby="confirm-page-title">
      <header class="push-page-header">
        <button class="push-page-back" type="button" data-back aria-label="Zurück">‹</button>
        <h2 id="confirm-page-title">${escapeHtml(title)}</h2>
        <span class="push-page-header-spacer" aria-hidden="true"></span>
      </header>
      <div class="push-page-body">
        <div class="push-page-content push-page-confirm-content">
          <p class="confirm-copy">${escapeHtml(message)}</p>
        </div>
        <footer class="push-page-actions push-page-confirm-actions">
          <div class="push-page-confirm-buttons">
            <button class="btn btn-secondary" type="button" data-cancel>Abbrechen</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>
          </div>
        </footer>
      </div>
    </section>`;

  const navigation = mountPushPage(layer, { historyKey: 'monetaConfirmPage' });
  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(false));
  layer.querySelector('[data-cancel]').addEventListener('click', () => navigation.close(false));
  layer.querySelector('[data-confirm]').addEventListener('click', () => navigation.close(true));
  requestAnimationFrame(() => layer.querySelector('[data-confirm]')?.focus({ preventScroll: true }));
  return navigation.promise;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
