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

  const originalLabel = button.textContent;
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
    button.disabled = false;
    button.textContent = originalLabel;
    updateInstallUi();
  }
});

let updateQueued = false;
const observer = new MutationObserver(() => {
  if (updateQueued) return;
  updateQueued = true;
  requestAnimationFrame(() => {
    updateQueued = false;
    updateInstallUi();
  });
});
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
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
  if (document.querySelector('[data-pwa-install-suggestion]')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <aside class="pwa-install-suggestion card" data-pwa-install-suggestion aria-labelledby="pwa-install-title">
      <div class="pwa-install-suggestion-copy">
        <strong id="pwa-install-title">Moneta als App installieren?</strong>
        <p>Direkt vom Startbildschirm öffnen und wie eine normale App verwenden.</p>
      </div>
      <div class="pwa-install-suggestion-actions">
        <button class="btn btn-ghost" type="button" data-pwa-install-later>Später</button>
        <button class="btn btn-primary" type="button" data-pwa-install>Installieren</button>
      </div>
    </aside>`);
}

function closeInstallSuggestion() {
  document.querySelector('[data-pwa-install-suggestion]')?.remove();
}

function updateInstallUi() {
  const button = document.querySelector('[data-pwa-install]');
  const copy = document.querySelector('[data-pwa-install-copy]');
  if (!button) return;

  const standalone = isStandalone();
  const label = standalone ? 'Installiert' : 'App installieren';
  const text = standalone
    ? 'Moneta ist bereits als App auf diesem Gerät installiert.'
    : deferredInstallPrompt
      ? 'Installiert Moneta über den nativen Browserdialog direkt auf deinem Startbildschirm.'
      : 'Falls kein direkter Installationsdialog verfügbar ist, zeigt Moneta dir den passenden Weg über das Browsermenü.';

  if (button.disabled !== standalone) button.disabled = standalone;
  if (button.textContent !== label) button.textContent = label;
  if (copy && copy.textContent !== text) copy.textContent = text;
}
