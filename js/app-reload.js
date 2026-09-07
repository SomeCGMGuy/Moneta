import { APP_VERSION } from './version.js';

const REFRESH_PARAM = 'moneta-refresh';
const APP_CACHE_PREFIX = 'moneta-shell-';
const UPDATE_TARGET_KEY = 'moneta-update-target';

const initialUrl = new URL(location.href);
if (initialUrl.searchParams.has(REFRESH_PARAM)) {
  finishForcedReload(initialUrl);
} else {
  setTimeout(checkForAppUpdate, 900);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-app-reload]');
  if (!button) return;
  refreshApp(button);
});

async function refreshApp(button) {
  if (button.disabled) return;
  await forceFreshReload(button);
}

async function forceFreshReload(button = null, targetVersion = null) {
  const originalLabel = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'Aktualisiere …';
  }

  try {
    sessionStorage.setItem('moneta-manual-refresh', '1');
    sessionStorage.setItem('moneta-sw-reloaded', '1');
    if (targetVersion) sessionStorage.setItem(UPDATE_TARGET_KEY, targetVersion);

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(APP_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set(REFRESH_PARAM, Date.now().toString());
    location.replace(nextUrl.href);
  } catch (error) {
    console.warn('App-Aktualisierung:', error);
    sessionStorage.removeItem('moneta-manual-refresh');
    sessionStorage.removeItem('moneta-sw-reloaded');
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
    location.reload();
  }
}

async function checkForAppUpdate() {
  if (location.protocol === 'file:') return;

  try {
    const versionUrl = new URL('./js/version.js', location.href);
    versionUrl.searchParams.set('moneta-update-check', Date.now().toString());
    const response = await fetch(versionUrl.href, { cache: 'no-store' });
    if (!response.ok) return;

    const source = await response.text();
    const match = source.match(/APP_VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
    const remoteVersion = match?.[1];
    if (!remoteVersion) return;

    if (remoteVersion === APP_VERSION) {
      sessionStorage.removeItem(UPDATE_TARGET_KEY);
      return;
    }

    if (sessionStorage.getItem(UPDATE_TARGET_KEY) === remoteVersion) return;
    await forceFreshReload(null, remoteVersion);
  } catch (error) {
    console.warn('Update-Prüfung:', error);
  }
}

async function finishForcedReload(url) {
  try {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
      try { await registration.update(); } catch (error) { console.warn('Service-Worker-Update:', error); }
      await waitForController();
    }
  } finally {
    url.searchParams.delete(REFRESH_PARAM);
    sessionStorage.removeItem('moneta-manual-refresh');
    sessionStorage.removeItem('moneta-sw-reloaded');
    location.replace(url.href);
  }
}

async function waitForController() {
  if (navigator.serviceWorker.controller) return;

  await Promise.race([
    new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    }),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]);
}
