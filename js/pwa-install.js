let deferredInstallPrompt = null;

const INSTALL_PROMPT_SEEN_KEY = 'moneta-install-prompt-seen';
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUi();
  scheduleInstallSuggestion();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  closeInstallSuggestion();
  updateInstallUi();
});

window.matchMedia('(display-mode: standalone)').addEventListener?.('change', () => {
  if (isStandalone()) closeInstallSuggestion();
  updateInstallUi();
});

document.addEventListener('click', async (event) => {
  const later = event.target.closest('[data-pwa-install-later]');
  if (later) {
    closeInstallSuggestion();
    return;
  }

  const suggestion = event.target.closest('[data-pwa-install-suggestion]');
  if (suggestion && event.target === suggestion) {
    closeInstallSuggestion();
    return;
  }

  const button = event.target.closest('[data-pwa-install]');
  if (!button || button.disabled) return;

  if (isStandalone()) {
    closeInstallSuggestion();
    updateInstallUi();
    return;
  }

  if (!deferredInstallPrompt) {
    alert('Brave bietet den Installationsdialog gerade nicht direkt an. Öffne das Browsermenü und wähle „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Öffne …';

  try {
    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    closeInstallSuggestion();
    updateInstallUi();
  } catch (error) {
    console.warn('PWA-Installation:', error);
    deferredInstallPrompt = null;
    closeInstallSuggestion();
    updateInstallUi();
  }
});

const observer = new MutationObserver(updateInstallUi);
observer.observe(document.documentElement, { childList: true, subtree: true });
updateInstallUi();

function scheduleInstallSuggestion() {
  if (isStandalone() || !deferredInstallPrompt) return;
  if (sessionStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === '1') return;

  sessionStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
  setTimeout(() => {
    if (!deferredInstallPrompt || isStandalone()) return;
    showInstallSuggestion();
  }, 650);
}

function showInstallSuggestion() {
  const root = document.querySelector('#modal-root');
  if (!root || root.querySelector('[data-pwa-install-suggestion]')) return;

  root.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" data-pwa-install-suggestion>
      <section class="modal modal-compact" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <div class="modal-header">
          <h2 id="pwa-install-title">Moneta als App installieren?</h2>
        </div>
        <p class="confirm-copy">Installiere Moneta auf deinem Startbildschirm. Danach lässt sich die App wie eine normale Anwendung direkt öffnen.</p>
        <div class="form-actions">
          <button class="btn btn-ghost" type="button" data-pwa-install-later>Später</button>
          <div class="form-actions-right">
            <button class="btn btn-primary" type="button" data-pwa-install>App installieren</button>
          </div>
        </div>
      </section>
    </div>`);
}

function closeInstallSuggestion() {
  document.querySelector('[data-pwa-install-suggestion]')?.remove();
}

function updateInstallUi() {
  const button = document.querySelector('[data-pwa-install]');
  const copy = document.querySelector('[data-pwa-install-copy]');
  if (!button) return;

  if (isStandalone()) {
    button.disabled = true;
    button.textContent = 'Installiert';
    if (copy) copy.textContent = 'Moneta ist bereits als App auf diesem Gerät installiert.';
    return;
  }

  button.disabled = false;
  button.textContent = 'App installieren';
  if (copy) {
    copy.textContent = deferredInstallPrompt
      ? 'Installiert Moneta über den nativen Browserdialog direkt auf deinem Startbildschirm.'
      : 'Falls kein direkter Installationsdialog verfügbar ist, zeigt Moneta dir den passenden Weg über das Browsermenü.';
  }
}
