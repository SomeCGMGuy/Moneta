export function showConfirmDialog({ title, message, confirmLabel = 'Bestätigen', danger = false }) {
  return new Promise((resolve) => {
    const root = document.querySelector('#modal-root');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="modal-header">
          <h2 id="confirm-title">${escapeHtml(title)}</h2>
          <button class="icon-btn" type="button" data-close aria-label="Schließen">×</button>
        </div>
        <p class="confirm-copy">${escapeHtml(message)}</p>
        <div class="form-actions">
          <div class="form-actions-right">
            <button class="btn btn-secondary" type="button" data-cancel>Abbrechen</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>
          </div>
        </div>
      </section>`;

    const onKey = (event) => { if (event.key === 'Escape') close(false); };
    const close = (value) => { document.removeEventListener('keydown', onKey); backdrop.remove(); resolve(value); };
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(false); });
    backdrop.querySelector('[data-close]').addEventListener('click', () => close(false));
    backdrop.querySelector('[data-cancel]').addEventListener('click', () => close(false));
    backdrop.querySelector('[data-confirm]').addEventListener('click', () => close(true));
    document.addEventListener('keydown', onKey);
    root.append(backdrop);
    backdrop.querySelector('[data-confirm]').focus();
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
