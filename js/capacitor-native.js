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
    <div class="biometric-lock-wave biometric-lock-wave-a" aria-hidden="true"></div>
    <div class="biometric-lock-wave biometric-lock-wave-b" aria-hidden="true"></div>
    <div class="biometric-lock-wave biometric-lock-wave-c" aria-hidden="true"></div>

    <div class="biometric-lock-card">
      <div class="biometric-lock-brand">moneta<span>.</span></div>

      <div class="biometric-lock-heading">
        <h1>Deine Daten sind privat.</h1>
        <p>Entsperre Moneta mit deinem<br>Fingerabdruck.</p>
      </div>

      <button type="button" class="biometric-lock-button" data-biometric-retry aria-label="Moneta mit Fingerabdruck entsperren">
        <svg class="biometric-lock-fingerprint" viewBox="0 0 96 112" aria-hidden="true">
          <path d="M18 42c0-18 13.4-32 30-32s30 14 30 32"/>
          <path d="M12 48c0-22.5 16.1-40 36-40s36 17.5 36 40"/>
          <path d="M24 46c0-14.2 10.7-25 24-25s24 10.8 24 25c0 12.8-1.4 24.2-5.4 34.7"/>
          <path d="M30 50c0-10.2 8-18 18-18s18 7.8 18 18c0 18-3.7 35.1-10.8 49.2"/>
          <path d="M36 52c0-6.6 5.2-12 12-12s12 5.4 12 12c0 18.6-4 35.1-12 49"/>
          <path d="M42 54c0-3.6 2.7-6.5 6-6.5s6 2.9 6 6.5c0 20.2-5.2 37-15.7 50.5"/>
          <path d="M24 55c.2 14.5-2.7 27.7-9.8 39.6"/>
          <path d="M31 61c-.4 15-3.4 27.4-9.1 37.6"/>
          <path d="M38 66c-.8 14-3.5 25.2-8.2 34.6"/>
          <path d="M67 58c-.4 14.9-3.2 28.4-8.2 40.4"/>
          <path d="M74 52c.2 10.6-.7 20.8-2.8 30.5"/>
          <path d="M17 60c.5 10.2-1.1 20.7-5.1 31.5"/>
        </svg>
      </button>

      <div class="biometric-lock-trust" aria-label="Datenschutz in Moneta">
        <div class="biometric-lock-trust-item">
          <span class="biometric-lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.9 8.1 7 10 4.1-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m9.3 12.2 1.7 1.7 3.8-4"/></svg></span>
          <strong>Nur auf<br>diesem Gerät</strong>
        </div>
        <div class="biometric-lock-trust-item">
          <span class="biometric-lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M6 20v-2.3c0-3.1 2.7-5.7 6-5.7s6 2.6 6 5.7V20H6Z"/></svg></span>
          <strong>Nur für dich</strong>
        </div>
        <div class="biometric-lock-trust-item">
          <span class="biometric-lock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 4C12.5 4 6 8.4 6 15c0 2.8 2.2 5 5 5 6.6 0 9-7.3 9-16Z"/><path d="M4 21c2.6-5.3 6.4-8.8 11.5-11"/></svg></span>
          <strong>Volle Kontrolle<br>über deine Daten</strong>
        </div>
      </div>

      <div class="biometric-lock-local">
        <span class="biometric-lock-local-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg></span>
        <p>Deine Finanzdaten bleiben lokal<br>auf diesem Gerät – sicher und privat.</p>
      </div>

      <p class="biometric-lock-error" data-biometric-error hidden>Entsperren nicht erfolgreich. Tippe erneut auf das Fingerabdruck-Symbol.</p>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    [data-biometric-lock] {
      position: fixed; inset: 0; z-index: 2147483647; overflow: hidden;
      display: grid; place-items: stretch center;
      padding: max(24px, env(safe-area-inset-top)) 22px max(22px, env(safe-area-inset-bottom));
      background: #fbfaf5; color: #10392d; font-family: inherit;
    }
    .biometric-lock-wave { position: absolute; left: -18%; width: 136%; border-radius: 50%; pointer-events: none; }
    .biometric-lock-wave-a { height: 28%; bottom: 22%; background: #e7f0eb; transform: rotate(8deg); opacity: .98; }
    .biometric-lock-wave-b { height: 25%; bottom: 8%; background: #dcebe3; transform: rotate(-7deg); opacity: .72; }
    .biometric-lock-wave-c { height: 20%; bottom: -6%; background: #d3e6dc; transform: rotate(5deg); opacity: .55; }

    .biometric-lock-card {
      position: relative; z-index: 1; width: min(100%, 430px); height: 100%;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .biometric-lock-brand {
      margin-top: clamp(24px, 6vh, 58px); color: #10392d;
      font-size: clamp(2.35rem, 9vw, 3.15rem); line-height: 1;
      font-weight: 780; letter-spacing: -.055em;
    }
    .biometric-lock-brand span { color: #64bd88; }
    .biometric-lock-heading { margin-top: clamp(54px, 7.7vh, 82px); }
    .biometric-lock-heading h1 {
      margin: 0; color: #12392e; font-size: clamp(1.78rem, 6.6vw, 2.22rem);
      line-height: 1.1; font-weight: 760; letter-spacing: -.025em;
    }
    .biometric-lock-heading p {
      margin: 14px 0 0; color: #6e7873; font-size: clamp(1rem, 4vw, 1.15rem);
      line-height: 1.42; font-weight: 430;
    }
    .biometric-lock-button {
      width: clamp(142px, 36vw, 160px); height: clamp(142px, 36vw, 160px);
      margin-top: clamp(44px, 6.2vh, 68px); padding: 0;
      display: grid; place-items: center; border-radius: 50%;
      border: 1px solid rgba(255,255,255,.95);
      background: rgba(239,247,242,.90); color: #113f32;
      box-shadow: 0 16px 42px rgba(42,91,72,.14), inset 0 0 0 1px rgba(107,170,136,.10);
      -webkit-tap-highlight-color: transparent;
      transition: transform 120ms ease-out, background 140ms linear, box-shadow 140ms linear;
    }
    .biometric-lock-button:active { transform: scale(.965); background: #e2eee7; }
    .biometric-lock-button:disabled { opacity: .68; }
    .biometric-lock-fingerprint {
      width: 72px; height: 84px; fill: none; stroke: currentColor; stroke-width: 4.1;
      stroke-linecap: round; stroke-linejoin: round;
    }
    .biometric-lock-trust {
      width: 100%; margin-top: auto; padding: 0 2px;
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; align-items: start;
    }
    .biometric-lock-trust-item { min-width: 0; color: #143b30; }
    .biometric-lock-icon {
      width: 48px; height: 48px; margin: 0 auto 9px; display: grid; place-items: center;
      border-radius: 50%; background: rgba(224,239,231,.88); color: #184737;
    }
    .biometric-lock-icon svg,
    .biometric-lock-local-icon svg {
      width: 27px; height: 27px; fill: none; stroke: currentColor; stroke-width: 1.8;
      stroke-linecap: round; stroke-linejoin: round;
    }
    .biometric-lock-trust strong {
      display: block; font-size: clamp(.72rem, 3vw, .84rem); line-height: 1.22; font-weight: 560;
    }
    .biometric-lock-local {
      width: 100%; margin-top: 30px; padding: 17px 20px;
      display: flex; align-items: center; justify-content: center; gap: 13px;
      border-radius: 24px; background: rgba(224,239,231,.82); color: #153c30;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.42);
    }
    .biometric-lock-local-icon { flex: 0 0 auto; width: 34px; height: 34px; display: grid; place-items: center; color: #174536; }
    .biometric-lock-local p { margin: 0; text-align: left; font-size: clamp(.8rem, 3.2vw, .94rem); line-height: 1.42; font-weight: 450; }
    .biometric-lock-error { margin: 11px 0 0; color: var(--danger, #b13b35); font-size: .8rem; line-height: 1.3; }

    :root[data-theme='dark'] [data-biometric-lock] {
      background:
        radial-gradient(circle at 74% 9%, rgba(24,87,67,.34) 0, rgba(24,87,67,0) 31%),
        radial-gradient(circle at 26% 34%, rgba(10,63,49,.26) 0, rgba(10,63,49,0) 37%),
        linear-gradient(180deg, #07382e 0%, #062f27 45%, #052920 100%);
      color: #f2f6f3;
    }
    :root[data-theme='dark'] .biometric-lock-wave-a { background: #164b3c; opacity: .70; }
    :root[data-theme='dark'] .biometric-lock-wave-b { background: #0e3e32; opacity: .84; }
    :root[data-theme='dark'] .biometric-lock-wave-c { background: #1a5645; opacity: .46; }
    :root[data-theme='dark'] .biometric-lock-brand,
    :root[data-theme='dark'] .biometric-lock-heading h1 { color: #f5f7f5; }
    :root[data-theme='dark'] .biometric-lock-brand span { color: #67d28f; }
    :root[data-theme='dark'] .biometric-lock-heading p { color: rgba(239,246,242,.76); }
    :root[data-theme='dark'] .biometric-lock-button {
      background: rgba(255,255,255,.075); color: #6ed594;
      border-color: rgba(255,255,255,.24);
      box-shadow: 0 18px 46px rgba(0,0,0,.25), 0 0 0 18px rgba(62,132,101,.035), inset 0 0 0 1px rgba(255,255,255,.045);
    }
    :root[data-theme='dark'] .biometric-lock-button:active { background: rgba(255,255,255,.12); }
    :root[data-theme='dark'] .biometric-lock-trust-item { color: #f1f6f3; }
    :root[data-theme='dark'] .biometric-lock-icon { background: rgba(255,255,255,.07); color: #68d392; }
    :root[data-theme='dark'] .biometric-lock-local {
      background: rgba(255,255,255,.07); color: #eef6f1;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
    }
    :root[data-theme='dark'] .biometric-lock-local-icon { color: #69d697; }

    @media (max-height: 760px) {
      .biometric-lock-brand { margin-top: 10px; }
      .biometric-lock-heading { margin-top: 30px; }
      .biometric-lock-button { width: 118px; height: 118px; margin-top: 28px; }
      .biometric-lock-fingerprint { width: 60px; height: 70px; }
      .biometric-lock-icon { width: 42px; height: 42px; margin-bottom: 6px; }
      .biometric-lock-local { margin-top: 18px; padding-block: 13px; }
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
