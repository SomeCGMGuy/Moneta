import { registerOverlayHistory } from './overlay-history.js';

export function showConfirmDialog({ title, message, confirmLabel = 'Bestätigen', danger = false }) {
  return new Promise((resolve) => {
    const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const layer = document.createElement('div');
    layer.className = 'material-dialog-backdrop';
    layer.innerHTML = `<section class="material-dialog" role="alertdialog" aria-modal="true" aria-labelledby="material-dialog-title" aria-describedby="material-dialog-copy">
      <h2 id="material-dialog-title">${escapeHtml(title)}</h2>
      <p id="material-dialog-copy">${escapeHtml(message)}</p>
      <div class="material-dialog-actions">
        <button class="btn btn-ghost" type="button" data-cancel>Abbrechen</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    </section>`;
    document.body.append(layer);
    let closing = false;
    let historyGuard;
    const close = (value, { fromHistory = false } = {}) => {
      if (closing) return;
      closing = true;
      document.removeEventListener('keydown', onKey);
      if (fromHistory) historyGuard?.release(); else historyGuard?.consume();
      layer.remove();
      if (returnFocusTo?.isConnected) requestAnimationFrame(() => returnFocusTo.focus({ preventScroll: true }));
      resolve(value);
    };
    const onKey = (event) => { if (event.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    historyGuard = registerOverlayHistory(() => close(false, { fromHistory: true }), 'monetaConfirmDialog');
    layer.addEventListener('click', (event) => { if (event.target === layer) close(false); });
    layer.querySelector('[data-cancel]').addEventListener('click', () => close(false));
    layer.querySelector('[data-confirm]').addEventListener('click', () => close(true));
    requestAnimationFrame(() => layer.querySelector('[data-cancel]')?.focus({ preventScroll: true }));
  });
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
