const STORAGE_KEY = 'moneta-onboarding-complete-v1';

const slides = [
  { icon: 'M', eyebrow: 'Willkommen', title: 'Deine Finanzen. Klar im Blick.', text: 'Moneta bringt Buchungen, Budgets und Auswertungen an einen Ort – ruhig, übersichtlich und für den Alltag gemacht.', note: 'Deine Finanzdaten bleiben lokal auf diesem Gerät.' },
  { icon: '↕', eyebrow: 'Buchungen', title: 'Einnahmen und Ausgaben im Griff.', text: 'Erfasse Buchungen, finde sie über die Suche wieder und nutze Kategorien. Wiederkehrende Buchungen fließen schon vorab als geplante Werte in deine Übersicht ein.', note: 'Geplante Buchungen erkennst du an der reduzierten Darstellung.' },
  { icon: '31', eyebrow: 'Finanzmonat', title: 'Ein Monat, der zu deinem Geldfluss passt.', text: 'Wenn Gehalt und Fixkosten nicht zum Kalendermonat passen, legst du deinen eigenen Starttag fest. Salden und Statistiken folgen dann deinem tatsächlichen Zahlungsrhythmus.', note: 'Jederzeit unter Einstellungen → Auswertung änderbar.' },
  { icon: '✓', eyebrow: 'Bereit', title: 'Moneta ist startklar.', text: 'Deine Finanzdaten werden lokal gespeichert. Nach dem ersten vollständigen Laden kannst du Moneta auch ohne Internetverbindung weiter nutzen.', note: 'Mit Backup & Wiederherstellung kannst du deine Daten zusätzlich sichern.' }
];

export function onboardingCompleted() { try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; } }

export function showOnboarding({ force = false } = {}) {
  if (!force && onboardingCompleted()) return Promise.resolve(false);
  const root = document.querySelector('#modal-root');
  const app = document.querySelector('#app');
  if (!root) return Promise.resolve(false);
  return new Promise((resolve) => {
    let index = 0;
    const previousOverflow = document.body.style.overflow;
    const appWasInert = app?.hasAttribute('inert') ?? false;
    const shell = document.createElement('div');
    shell.className = 'onboarding';
    shell.setAttribute('role', 'dialog'); shell.setAttribute('aria-modal', 'true'); shell.setAttribute('aria-label', 'Willkommen bei Moneta');
    app?.setAttribute('inert', '');
    root.appendChild(shell); document.body.style.overflow = 'hidden';

    const finish = () => { try { localStorage.setItem(STORAGE_KEY, '1'); } catch {} shell.classList.add('leaving'); window.setTimeout(() => { shell.remove(); document.body.style.overflow = previousOverflow; if (!appWasInert) app?.removeAttribute('inert'); resolve(true); }, 220); };
    const render = (direction = 1) => {
      const slide = slides[index];
      shell.innerHTML = `<div class="onboarding-top"><div class="onboarding-brand">moneta<span>.</span></div>${index < slides.length - 1 ? '<button type="button" class="onboarding-skip" data-onboarding-skip>Überspringen</button>' : '<span></span>'}</div><div class="onboarding-stage"><article class="onboarding-slide ${direction < 0 ? 'from-left' : 'from-right'}"><div class="onboarding-visual" aria-hidden="true"><span>${slide.icon}</span></div><div class="onboarding-eyebrow">${slide.eyebrow}</div><h1>${slide.title}</h1><p>${slide.text}</p><div class="onboarding-note"><span aria-hidden="true">●</span>${slide.note}</div></article></div><div class="onboarding-footer"><div class="onboarding-dots" aria-label="Schritt ${index + 1} von ${slides.length}">${slides.map((_, i) => `<span class="${i === index ? 'active' : ''}"></span>`).join('')}</div><div class="onboarding-actions">${index ? '<button type="button" class="btn btn-secondary" data-onboarding-back>Zurück</button>' : '<span></span>'}<button type="button" class="btn btn-primary onboarding-next" data-onboarding-next>${index === slides.length - 1 ? 'Moneta starten' : 'Weiter'}</button></div></div>`;
      requestAnimationFrame(() => shell.querySelector('.onboarding-slide')?.classList.add('visible'));
      shell.querySelector('[data-onboarding-next]')?.focus({ preventScroll: true });
    };
    shell.addEventListener('click', (event) => { if (event.target.closest('[data-onboarding-skip]')) return finish(); if (event.target.closest('[data-onboarding-back]')) { index -= 1; render(-1); return; } if (event.target.closest('[data-onboarding-next]')) { if (index === slides.length - 1) finish(); else { index += 1; render(1); } } });
    render();
  });
}
