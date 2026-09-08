import { APP_VERSION } from './version.js';

const UPDATE_TARGET_KEY = 'moneta-update-target';

setTimeout(checkForAppUpdate, 900);

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-app-reload]');
  if (!button) return;
  refreshApp(button);
});

async function refreshApp(button) {
  if (button.disabled) return;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Prüfe Update …';

  try {
    if (!navigator.onLine) throw new Error('offline');
    const remoteVersion = await fetchRemoteVersion();
    if (!remoteVersion || remoteVersion === APP_VERSION) {
      button.textContent = 'Bereits aktuell';
      window.setTimeout(() => { button.disabled = false; button.textContent = originalLabel; }, 1200);
      return;
    }
    button.textContent = 'Aktualisiere …';
    await installUpdate(remoteVersion);
  } catch (error) {
    console.warn('App-Aktualisierung:', error);
    button.textContent = navigator.onLine ? 'Update fehlgeschlagen' : 'Offline – App bleibt verfügbar';
    window.setTimeout(() => { button.disabled = false; button.textContent = originalLabel; }, 1800);
  }
}

async function checkForAppUpdate() {
  if (location.protocol === 'file:' || !navigator.onLine) return;
  try {
    const remoteVersion = await fetchRemoteVersion();
    if (!remoteVersion || remoteVersion === APP_VERSION) { sessionStorage.removeItem(UPDATE_TARGET_KEY); return; }
    if (sessionStorage.getItem(UPDATE_TARGET_KEY) === remoteVersion) return;
    await installUpdate(remoteVersion);
  } catch (error) {
    console.warn('Update-Prüfung:', error);
  }
}

async function fetchRemoteVersion() {
  const versionUrl = new URL('./js/version.js', location.href);
  versionUrl.searchParams.set('moneta-update-check', Date.now().toString());
  const response = await fetch(versionUrl.href, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Update-Prüfung fehlgeschlagen (${response.status})`);
  const source = await response.text();
  return source.match(/APP_VERSION\s*=\s*['\"]([^'\"]+)['\"]/)?.[1] ?? null;
}

async function installUpdate(targetVersion) {
  if (!('serviceWorker' in navigator)) { location.reload(); return; }
  sessionStorage.setItem(UPDATE_TARGET_KEY, targetVersion);
  const registration = await navigator.serviceWorker.getRegistration() ?? await navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
  await registration.update();
  const worker = registration.waiting ?? registration.installing;
  if (worker) await waitForWorker(worker);
  const readyWorker = registration.waiting;
  if (readyWorker) {
    await new Promise((resolve) => {
      const timeout = window.setTimeout(resolve, 3000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
      readyWorker.postMessage({ type: 'SKIP_WAITING' });
    });
  }
  sessionStorage.removeItem(UPDATE_TARGET_KEY);
  location.reload();
}

function waitForWorker(worker) {
  if (worker.state === 'installed' || worker.state === 'activated') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Update-Installation Timeout')), 10000);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'activated') { window.clearTimeout(timeout); resolve(); }
      if (worker.state === 'redundant') { window.clearTimeout(timeout); reject(new Error('Update konnte nicht installiert werden')); }
    });
  });
}
