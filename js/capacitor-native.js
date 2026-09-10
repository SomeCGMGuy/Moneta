const capacitor = window.Capacitor;
const appPlugin = capacitor?.Plugins?.App;
const biometricPlugin = capacitor?.Plugins?.NativeBiometric;
const isNative = Boolean(capacitor?.isNativePlatform?.());
const BIOMETRIC_KEY = 'moneta-biometric-enabled';
const BIOMETRIC_TIMEOUT_KEY = 'moneta-biometric-timeout';
const DEFAULT_BIOMETRIC_TIMEOUT_MINUTES = 5;

let biometricUnlocked = false;
let biometricBusy = false;
let biometricBackgroundSince = null;
let settingsObserver = null;

if (isNative) {
  initNativeShell();
}

async function initNativeShell() {
  setupBackButton();
  setupBiometricSetting();
  setupBiometricRelock();
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

function biometricEnabled() {
  return localStorage.getItem(BIOMETRIC_KEY) === 'true';
}

function biometricTimeoutMinutes() {
  const stored = localStorage.getItem(BIOMETRIC_TIMEOUT_KEY);
  if (stored === null) return DEFAULT_BIOMETRIC_TIMEOUT_MINUTES;
  const minutes = Number(stored);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : DEFAULT_BIOMETRIC_TIMEOUT_MINUTES;
}

function biometricTimeoutLabel(minutes) {
  if (minutes === 0) return 'Sofort';
  if (minutes === 1) return '1 Min.';
  return `${minutes} Min.`;
}

function setupBiometricRelock() {
  if (!appPlugin?.addListener) return;

  appPlugin.addListener('appStateChange', async ({ isActive }) => {
    if (biometricBusy || !biometricEnabled()) return;

    if (!isActive) {
      biometricBackgroundSince = Date.now();
      return;
    }

    if (biometricBackgroundSince === null) return;

    const elapsed = Date.now() - biometricBackgroundSince;
    biometricBackgroundSince = null;
    const timeoutMs = biometricTimeoutMinutes() * 60 * 1000;
    if (elapsed < timeoutMs) return;

    biometricUnlocked = false;
    await showBiometricLock();
  });
}

function setupBiometricSetting() {
  const mountSetting = () => {
    const view = document.querySelector('#view-root');
    if (!view || view.querySelector('[data-biometric-setting]')) return;
    const title = view.querySelector('.page-title');
    if (title?.textContent?.trim() !== 'Einstellungen') return;

    const sections = [...view.querySelectorAll('.section')];
    const appSection = sections.find((section) => section.querySelector('h2')?.textContent?.trim() === 'App');
    if (!appSection) return;

    const section = document.createElement('section');
    section.className = 'section settings-section';
    section.dataset.biometricSetting = 'true';
    section.innerHTML = `
      <div class="section-heading"><div><h2>Sicherheit</h2><p class="section-subtitle">Schütze Moneta auf diesem Gerät mit der Android-Biometrie.</p></div></div>
      <div class="card theme-setting">
        <label class="booking-toggle-row">
          <span><strong>Biometrische Sperre</strong><small>Beim App-Start und nach längerer Abwesenheit Biometrie verlangen.</small></span>
          <input id="biometric-lock-toggle" class="material-switch" type="checkbox" data-biometric-toggle ${biometricEnabled() ? 'checked' : ''} />
          <span class="material-switch-track" aria-hidden="true"></span>
        </label>
        <label class="booking-toggle-row biometric-timeout-row" data-biometric-timeout-row>
          <span><strong>Erneut sperren</strong><small>Nach Verlassen von Moneta.</small></span>
          <span class="biometric-timeout-value" data-biometric-timeout-value aria-hidden="true">5 Min. <span>›</span></span>
          <select data-biometric-timeout aria-label="Zeit bis zur erneuten biometrischen Sperre">
            <option value="0">Sofort</option>
            <option value="1">Nach 1 Minute</option>
            <option value="5">Nach 5 Minuten</option>
            <option value="15">Nach 15 Minuten</option>
            <option value="30">Nach 30 Minuten</option>
          </select>
        </label>
        <p data-biometric-setting-status style="margin:0 0 4px;color:var(--text-muted);font-size:.78rem;" hidden></p>
      </div>`;
    appSection.before(section);

    const toggle = section.querySelector('[data-biometric-toggle]');
    const timeout = section.querySelector('[data-biometric-timeout]');
    const timeoutRow = section.querySelector('[data-biometric-timeout-row]');
    const timeoutValue = section.querySelector('[data-biometric-timeout-value]');
    const status = section.querySelector('[data-biometric-setting-status]');

    const syncTimeoutSetting = () => {
      if (!timeout) return;
      const enabled = biometricEnabled();
      timeout.disabled = !enabled;
      if (timeoutRow) timeoutRow.dataset.disabled = enabled ? 'false' : 'true';
      if (timeoutValue) timeoutValue.firstChild.textContent = `${biometricTimeoutLabel(Number(timeout.value))} `;
    };

    if (timeout) {
      timeout.value = String(biometricTimeoutMinutes());
      syncTimeoutSetting();
      timeout.addEventListener('change', () => {
        localStorage.setItem(BIOMETRIC_TIMEOUT_KEY, timeout.value);
        syncTimeoutSetting();
      });
    }

    toggle?.addEventListener('change', async () => {
      if (!toggle.checked) {
        localStorage.setItem(BIOMETRIC_KEY, 'false');
        biometricUnlocked = false;
        biometricBackgroundSince = null;
        syncTimeoutSetting();
        setStatus(status, 'Biometrische Sperre deaktiviert.', false);
        return;
      }

      toggle.disabled = true;
      setStatus(status, 'Biometrie wird geprüft …', false);
      const enabled = await confirmBiometricActivation();
      toggle.disabled = false;
      toggle.checked = enabled;
      localStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
      biometricUnlocked = enabled;
      biometricBackgroundSince = null;
      syncTimeoutSetting();
      setStatus(status, enabled ? 'Biometrische Sperre aktiviert.' : 'Biometrie konnte nicht aktiviert werden.', !enabled);
    });
  };

  mountSetting();
  settingsObserver = new MutationObserver(mountSetting);
  settingsObserver.observe(document.body, { childList: true, subtree: true });
}

function setStatus(node, text, isError) {
  if (!node) return;
  node.hidden = false;
  node.textContent = text;
  node.style.color = isError ? 'var(--danger)' : 'var(--text-muted)';
}

async function confirmBiometricActivation() {
  if (!biometricPlugin?.isAvailable || !biometricPlugin?.verifyIdentity) return false;
  try {
    const availability = await biometricPlugin.isAvailable();
    if (!availability?.isAvailable) return false;
    await biometricPlugin.verifyIdentity({
      title: 'moneta.',
      subtitle: 'Biometrie aktivieren',
      reason: 'Bestätige deine Identität, um die biometrische Sperre zu aktivieren.'
    });
    return true;
  } catch (error) {
    console.warn('Biometric activation failed:', error);
    return false;
  }
}

async function setupBiometricLock() {
  if (!biometricEnabled()) return;
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

  await showBiometricLock();
}

async function showBiometricLock() {
  if (!biometricEnabled() || biometricBusy) return;

  let lock = document.querySelector('[data-biometric-lock]');
  if (!lock) {
    lock = createBiometricLock();
    document.body.append(lock);
  }

  await requestBiometricUnlock(lock);
}

function createBiometricLock() {
  const lock = document.createElement('div');
  lock.dataset.biometricLock = 'true';
  lock.setAttribute('role', 'dialog');
  lock.setAttribute('aria-modal', 'true');
  lock.innerHTML = `
    <div class="biometric-lock-card">
      <div class="biometric-lock-brand">moneta<span>.</span></div>
      <div class="biometric-lock-heading">
        <h1>Deine Daten sind privat.</h1>
        <p>Entsperre Moneta mit deiner Biometrie.</p>
      </div>
      <button type="button" class="biometric-lock-button" data-biometric-retry aria-label="Moneta mit Biometrie entsperren">
        <span class="biometric-lock-fingerprint" aria-hidden="true">◉</span>
      </button>
      <div class="biometric-lock-trust" aria-label="Datenschutz in Moneta">
        <div><span aria-hidden="true">⌾</span><strong>Nur auf<br>diesem Gerät</strong></div>
        <div><span aria-hidden="true">♙</span><strong>Nur für dich</strong></div>
        <div><span aria-hidden="true">◇</span><strong>Volle Kontrolle<br>über deine Daten</strong></div>
      </div>
      <div class="biometric-lock-local">
        <span aria-hidden="true">▣</span>
        <p>Deine Finanzdaten bleiben lokal<br>auf diesem Gerät – sicher und privat.</p>
      </div>
      <p class="biometric-lock-error" data-biometric-error hidden>Entsperren nicht erfolgreich. Tippe erneut auf das Biometrie-Symbol.</p>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    [data-biometric-lock] {
      position: fixed; inset: 0; z-index: 2147483647; overflow: hidden;
      display: grid; place-items: center;
      padding: max(34px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom));
      background: var(--surface, #f7f5ee); color: var(--text, #17221d);
    }
    [data-biometric-lock]::before,
    [data-biometric-lock]::after {
      content: ''; position: absolute; left: -18%; width: 136%; height: 30%; border-radius: 50%; pointer-events: none;
      background: color-mix(in srgb, var(--forest-100, #dfece5) 68%, transparent);
      opacity: .72;
    }
    [data-biometric-lock]::before { bottom: 12%; transform: rotate(8deg); }
    [data-biometric-lock]::after { bottom: -5%; transform: rotate(-7deg); opacity: .48; }
    .biometric-lock-card {
      position: relative; z-index: 1; width: min(100%, 390px); min-height: min(760px, calc(100dvh - 62px));
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .biometric-lock-brand {
      margin-top: 5vh; color: var(--forest-950, #163e31); font-size: clamp(2rem, 8vw, 2.8rem);
      font-weight: 780; letter-spacing: -.055em;
    }
    .biometric-lock-brand span { color: var(--forest-500, #5fbf88); }
    .biometric-lock-heading { margin-top: clamp(38px, 7vh, 72px); }
    .biometric-lock-heading h1 { margin: 0; color: var(--forest-950, #163e31); font-size: clamp(1.6rem, 6vw, 2rem); line-height: 1.14; letter-spacing: -.025em; }
    .biometric-lock-heading p { margin: 12px auto 0; max-width: 300px; color: var(--text-muted, #707a75); font-size: 1rem; line-height: 1.45; }
    .biometric-lock-button {
      width: 136px; height: 136px; margin-top: clamp(38px, 6vh, 64px); padding: 0; border: 1px solid color-mix(in srgb, var(--forest-300, #9bc9b0) 52%, transparent);
      border-radius: 50%; display: grid; place-items: center;
      background: color-mix(in srgb, var(--forest-050, #eef6f1) 82%, transparent);
      color: var(--forest-950, #163e31); box-shadow: 0 14px 42px rgb(27 79 59 / .12), inset 0 0 0 1px rgb(255 255 255 / .32);
      -webkit-tap-highlight-color: transparent; transition: transform 120ms ease-out, background 140ms linear;
    }
    .biometric-lock-button:active { transform: scale(.96); background: var(--forest-100, #dfece5); }
    .biometric-lock-button:disabled { opacity: .72; }
    .biometric-lock-fingerprint { font-size: 4.2rem; line-height: 1; transform: scaleX(.82); }
    .biometric-lock-trust {
      width: 100%; margin-top: auto; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; align-items: start;
    }
    .biometric-lock-trust div { min-width: 0; color: var(--forest-950, #163e31); }
    .biometric-lock-trust div > span { width: 44px; height: 44px; margin: 0 auto 8px; border-radius: 50%; display: grid; place-items: center; background: var(--forest-050, #eef6f1); font-size: 1.45rem; }
    .biometric-lock-trust strong { display: block; font-size: .76rem; line-height: 1.25; font-weight: 650; }
    .biometric-lock-local {
      width: 100%; margin-top: 26px; padding: 15px 18px; border-radius: 22px; display: flex; align-items: center; justify-content: center; gap: 12px;
      background: color-mix(in srgb, var(--forest-100, #dfece5) 62%, transparent); color: var(--forest-950, #163e31);
    }
    .biometric-lock-local > span { font-size: 1.45rem; }
    .biometric-lock-local p { margin: 0; font-size: .82rem; line-height: 1.4; text-align: left; }
    .biometric-lock-error { margin: 12px 0 0; color: var(--danger, #b13b35); font-size: .82rem; line-height: 1.35; }
    :root[data-theme='dark'] [data-biometric-lock] { background: var(--bg, #082b22); color: var(--text, #f3f6f3); }
    :root[data-theme='dark'] [data-biometric-lock]::before,
    :root[data-theme='dark'] [data-biometric-lock]::after { background: rgb(62 121 95 / .28); }
    :root[data-theme='dark'] .biometric-lock-brand,
    :root[data-theme='dark'] .biometric-lock-heading h1 { color: #f5f7f5; }
    :root[data-theme='dark'] .biometric-lock-heading p { color: rgb(239 246 242 / .72); }
    :root[data-theme='dark'] .biometric-lock-button { background: rgb(255 255 255 / .08); color: #69d697; border-color: rgb(255 255 255 / .18); box-shadow: 0 14px 42px rgb(0 0 0 / .22), inset 0 0 0 1px rgb(255 255 255 / .06); }
    :root[data-theme='dark'] .biometric-lock-button:active { background: rgb(255 255 255 / .13); }
    :root[data-theme='dark'] .biometric-lock-trust div { color: #f1f6f3; }
    :root[data-theme='dark'] .biometric-lock-trust div > span { background: rgb(255 255 255 / .07); color: #69d697; }
    :root[data-theme='dark'] .biometric-lock-local { background: rgb(255 255 255 / .07); color: #eef6f1; border: 1px solid rgb(255 255 255 / .08); }
    @media (max-height: 720px) {
      .biometric-lock-card { min-height: calc(100dvh - 58px); }
      .biometric-lock-brand { margin-top: 1vh; }
      .biometric-lock-heading { margin-top: 28px; }
      .biometric-lock-button { width: 112px; height: 112px; margin-top: 28px; }
      .biometric-lock-fingerprint { font-size: 3.4rem; }
      .biometric-lock-local { margin-top: 18px; }
    }
    @media (prefers-reduced-motion: reduce) { .biometric-lock-button { transition: none; } }
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
    biometricBackgroundSince = null;
    lock.remove();
  } catch (failure) {
    console.warn('Biometric authentication failed:', failure);
    if (error) error.hidden = false;
    if (retry) retry.disabled = false;
  } finally {
    biometricBusy = false;
  }
}
