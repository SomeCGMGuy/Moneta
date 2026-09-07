let deferredInstallPrompt = null;

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUi();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  updateInstallUi();
});

window.matchMedia('(display-mode: standalone)').addEventListener?.('change', updateInstallUi);

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-pwa-install]');
  if (!button || button.disabled) return;

  if (isStandalone()) {
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
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice?.outcome !== 'accepted') updateInstallUi();
  } catch (error) {
    console.warn('PWA-Installation:', error);
    deferredInstallPrompt = null;
    updateInstallUi();
  }
});

const observer = new MutationObserver(updateInstallUi);
observer.observe(document.documentElement, { childList: true, subtree: true });
updateInstallUi();

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
