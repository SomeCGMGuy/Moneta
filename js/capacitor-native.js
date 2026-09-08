const capacitor = window.Capacitor;
const appPlugin = capacitor?.Plugins?.App;
const biometricPlugin = capacitor?.Plugins?.NativeBiometric;
const isNative = Boolean(capacitor?.isNativePlatform?.());

let biometricUnlocked = false;
let biometricBusy = false;

if (isNative) {
  initNativeShell();
}

async function initNativeShell() {
  setupBackButton();
  await setupBiometricLock();
}

function setupBackButton() {
  if (!appPlugin?.addListener) return;

  appPlugin.addListener('backButton', ({ canGoBack }) => {
    const lock = document.querySelector('[data-biometric-lock]');
    if (lock && !biometricUnlocked) return;

    if (canGoBack || history.length > 1) {
      history.back();
      return;
    }

    appPlugin.exitApp?.();
  });
}

async function setupBiometricLock() {
  if (!biometricPlugin?.isAvailable || !biometricPlugin?.verifyIdentity) {
    console.warn('Biometric authentication plugin is unavailable.');
    return;
  }

  let availability;
  try {
    availability = await biometricPlugin.isAvailable();
  } catch (error) {
    console.warn('Biometric availability check failed:', error);
    return;
  }

  if (!availability?.isAvailable) {
    console.warn('Biometric authentication is not available on this device.');
    return;
  }

  const lock = createBiometricLock();
  document.body.append(lock);
  await requestBiometricUnlock(lock);
}

function createBiometricLock() {
  const lock = document.createElement('div');
  lock.dataset.biometricLock = 'true';
  lock.setAttribute('role', 'dialog');
  lock.setAttribute('aria-modal', 'true');
  lock.innerHTML = `
    <div class="biometric-lock-card">
      <img class="biometric-lock-logo" src="./assets/icons/icon.svg" alt="" />
      <div class="biometric-lock-brand">moneta.</div>
      <p class="biometric-lock-copy">Mit Biometrie entsperren</p>
      <button type="button" class="biometric-lock-button" data-biometric-retry>Entsperren</button>
      <p class="biometric-lock-error" data-biometric-error hidden>Entsperren nicht erfolgreich.</p>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    [data-biometric-lock] {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
      background: var(--surface, #f5f5f2);
      color: var(--text, #17221d);
    }
    .biometric-lock-card {
      width: min(100%, 320px);
      text-align: center;
    }
    .biometric-lock-logo {
      width: 84px;
      height: 84px;
      margin-bottom: 18px;
      border-radius: 22px;
    }
    .biometric-lock-brand {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .biometric-lock-copy {
      margin: 10px 0 22px;
      opacity: .72;
    }
    .biometric-lock-button {
      min-height: 48px;
      padding: 0 22px;
      border: 0;
      border-radius: 16px;
      background: #214b3b;
      color: white;
      font: inherit;
      font-weight: 650;
      -webkit-tap-highlight-color: transparent;
    }
    .biometric-lock-error {
      margin-top: 14px;
      font-size: .9rem;
      opacity: .72;
    }
  `;
  lock.append(style);

  lock.querySelector('[data-biometric-retry]')?.addEventListener('click', () => requestBiometricUnlock(lock));
  return lock;
}

async function requestBiometricUnlock(lock) {
  if (biometricBusy || biometricUnlocked) return;
  biometricBusy = true;

  const retry = lock.querySelector('[data-biometric-retry]');
  const error = lock.querySelector('[data-biometric-error]');
  if (retry) retry.disabled = true;
  if (error) error.hidden = true;

  try {
    await biometricPlugin.verifyIdentity({
      title: 'moneta.',
      subtitle: 'App entsperren',
      reason: 'Bestätige deine Identität, um Moneta zu öffnen.'
    });
    biometricUnlocked = true;
    lock.remove();
  } catch (failure) {
    console.warn('Biometric authentication failed:', failure);
    if (error) error.hidden = false;
    if (retry) retry.disabled = false;
  } finally {
    biometricBusy = false;
  }
}
