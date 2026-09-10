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
        <p>Entsperre Moneta mit deinem<br>Fingerabdruck.</p>
      </div>

      <button type="button" class="biometric-lock-button" data-biometric-retry aria-label="Moneta mit Biometrie entsperren">
        <svg class="biometric-lock-fingerprint" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 8c-13.2 0-24 10.8-24 24"/>
          <path d="M56 32C56 18.8 45.2 8 32 8"/>
          <path d="M14 34c0-10 8-18 18-18s18 8 18 18"/>
          <path d="M20 36c0-6.6 5.4-12 12-12s12 5.4 12 12c0 8.2-2.3 14.6-6.6 20"/>
          <path d="M26 38c0-3.3 2.7-6 6-6s6 2.7 6 6c0 7.8-1.5 13.7-4.7 18"/>
          <path d="M12 40c.8 8.2 3.8 14.4 8.7 19"/>
          <path d="M18 40c.6 6.2 2.6 11 6.4 15.3"/>
          <path d="M25 45c.8 5 2.4 8.6 5 11.5"/>
          <path d="M47 40c-.5 8.5-2.9 14.8-7.3 19"/>
        </svg>
      </button>

      <div class="biometric-lock-trust" aria-label="Datenschutz in Moneta">
        <div class="biometric-lock-trust-item">
          <span class="biometric-lock-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.9 8.1 7 10 4.1-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m9.3 12.2 1.7 1.7 3.8-4"/></svg>
          </span>
          <strong>Nur auf<br>diesem Gerät</strong>
        </div>
        <div class="biometric-lock-trust-item">
          <span class="biometric-lock-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M6 20v-2.3c0-3.1 2.7-5.7 6-5.7s6 2.6 6 5.7V20H6Z"/></svg>
          </span>
          <strong>Nur für dich</strong>
        </div>
        <div class="biometric-lock-trust-item">
          <span class="biometric-lock-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M20 4C12.5 4 6 8.4 6 15c0 2.8 2.2 5 5 5 6.6 0 9-7.3 9-16Z"/><path d="M4 21c2.6-5.3 6.4-8.8 11.5-11"/></svg>
          </span>
          <strong>Volle Kontrolle<br>über deine Daten</strong>
        </div>
      </div>

      <div class="biometric-lock-local">
        <span class="biometric-lock-local-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>
        </span>
        <p>Deine Finanzdaten bleiben lokal<br>auf diesem Gerät – sicher und privat.</p>
      </div>

      <p class="biometric-lock-error" data-biometric-error hidden>Entsperren nicht erfolgreich. Tippe erneut auf das Biometrie-Symbol.</p>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    [data-biometric-lock] {
      position: fixed; inset: 0; z-index: 2147483647; overflow: hidden;
      display: grid; place-items: stretch center;
      padding: max(24px, env(safe-area-inset-top)) 22px max(24px, env(safe-area-inset-bottom));
      background: #f8f6ef; color: #133a2e;
      font-family: inherit;
    }
    [data-biometric-lock]::before,
    [data-biometric-lock]::after {
      content: ''; position: absolute; pointer-events: none;
      left: -22%; width: 144%; height: 29%; border-radius: 50%;
      transform-origin: center;
      background: #dcebe3;
    }
    [data-biometric-lock]::before { bottom: 10.5%; transform: rotate(8deg); opacity: .92; }
    [data-biometric-lock]::after { bottom: -4%; transform: rotate(-6deg); opacity: .62; }

    .biometric-lock-card {
      position: relative; z-index: 1; width: min(100%, 430px); height: 100%;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .biometric-lock-brand {
      margin-top: clamp(20px, 5.2vh, 52px);
      color: #10392d; font-size: clamp(2.15rem, 8.4vw, 3rem); line-height: 1;
      font-weight: 780; letter-spacing: -.055em;
    }
    .biometric-lock-brand span { color: #64bd88; }

    .biometric-lock-heading { margin-top: clamp(48px, 7.2vh, 76px); }
    .biometric-lock-heading h1 {
      margin: 0; color: #12392e; font-size: clamp(1.7rem, 6.2vw, 2.15rem);
      line-height: 1.12; font-weight: 760; letter-spacing: -.025em;
    }
    .biometric-lock-heading p {
      margin: 13px 0 0; color: #6e7873; font-size: clamp(.98rem, 4vw, 1.12rem);
      line-height: 1.42; font-weight: 430;
    }

    .biometric-lock-button {
      width: clamp(132px, 34vw, 154px); height: clamp(132px, 34vw, 154px);
      margin-top: clamp(42px, 6.1vh, 66px); padding: 0;
      display: grid; place-items: center; border-radius: 50%;
      border: 1px solid rgba(255,255,255,.78);
      background: rgba(232,243,237,.84); color: #123f32;
      box-shadow: 0 12px 38px rgba(38,90,68,.13), inset 0 0 0 1px rgba(91,168,125,.10);
      -webkit-tap-highlight-color: transparent;
      transition: transform 120ms ease-out, background 140ms linear, box-shadow 140ms linear;
    }
    .biometric-lock-button:active { transform: scale(.965); background: #dcece4; }
    .biometric-lock-button:disabled { opacity: .68; }
    .biometric-lock-fingerprint {
      width: 74px; height: 74px; fill: none; stroke: currentColor; stroke-width: 3.1;
      stroke-linecap: round; stroke-linejoin: round;
    }

    .biometric-lock-trust {
      width: 100%; margin-top: auto; padding: 0 2px;
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
      align-items: start;
    }
    .biometric-lock-trust-item { min-width: 0; color: #143b30; }
    .biometric-lock-icon {
      width: 48px; height: 48px; margin: 0 auto 9px;
      display: grid; place-items: center; border-radius: 50%;
      background: rgba(224,239,231,.88); color: #184737;
    }
    .biometric-lock-icon svg,
    .biometric-lock-local-icon svg {
      width: 27px; height: 27px; fill: none; stroke: currentColor; stroke-width: 1.8;
      stroke-linecap: round; stroke-linejoin: round;
    }
    .biometric-lock-trust strong {
      display: block; font-size: clamp(.72rem, 3vw, .84rem); line-height: 1.22;
      font-weight: 560;
    }

    .biometric-lock-local {
      width: 100%; margin-top: 30px; padding: 17px 20px;
      display: flex; align-items: center; justify-content: center; gap: 13px;
      border-radius: 24px; background: rgba(224,239,231,.80); color: #153c30;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.36);
    }
    .biometric-lock-local-icon {
      flex: 0 0 auto; width: 34px; height: 34px; display: grid; place-items: center;
      color: #174536;
    }
    .biometric-lock-local p {
      margin: 0; text-align: left; font-size: clamp(.8rem, 3.2vw, .94rem); line-height: 1.42; font-weight: 450;
    }
    .biometric-lock-error {
      margin: 11px 0 0; color: var(--danger, #b13b35); font-size: .8rem; line-height: 1.3;
    }

    :root[data-theme='dark'] [data-biometric-lock] {
      background: #073027; color: #f2f6f3;
    }
    :root[data-theme='dark'] [data-biometric-lock]::before { background: #164a3b; opacity: .72; }
    :root[data-theme='dark'] [data-biometric-lock]::after { background: #1b5745; opacity: .50; }
    :root[data-theme='dark'] .biometric-lock-brand,
    :root[data-theme='dark'] .biometric-lock-heading h1 { color: #f5f7f5; }
    :root[data-theme='dark'] .biometric-lock-brand span { color: #67d28f; }
    :root[data-theme='dark'] .biometric-lock-heading p { color: rgba(239,246,242,.76); }
    :root[data-theme='dark'] .biometric-lock-button {
      background: rgba(255,255,255,.075); color: #6ed594;
      border-color: rgba(255,255,255,.22);
      box-shadow: 0 14px 42px rgba(0,0,0,.22), inset 0 0 0 1px rgba(255,255,255,.045);
    }
    :root[data-theme='dark'] .biometric-lock-button:active { background: rgba(255,255,255,.12); }
    :root[data-theme='dark'] .biometric-lock-trust-item { color: #f1f6f3; }
    :root[data-theme='dark'] .biometric-lock-icon {
      background: rgba(255,255,255,.07); color: #68d392;
    }
    :root[data-theme='dark'] .biometric-lock-local {
      background: rgba(255,255,255,.07); color: #eef6f1;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
    }
    :root[data-theme='dark'] .biometric-lock-local-icon { color: #69d697; }

    @media (max-height: 760px) {
      .biometric-lock-brand { margin-top: 10px; }
      .biometric-lock-heading { margin-top: 30px; }
      .biometric-lock-button { width: 116px; height: 116px; margin-top: 28px; }
      .biometric-lock-fingerprint { width: 62px; height: 62px; }
      .biometric-lock-icon { width: 42px; height: 42px; margin-bottom: 6px; }
      .biometric-lock-local { margin-top: 18px; padding-block: 13px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .biometric-lock-button { transition: none; }
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
