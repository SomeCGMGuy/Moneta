import { APP_VERSION } from '../version.js';

const CATEGORY_PREVIEW_LIMIT = 5;

export function renderSettings({ categoryMap, theme, financialMonthMode = 'calendar', financialMonthStart = 28 }) {
  const categories = [...categoryMap.values()];
  const expenses = categories.filter((category) => category.type === 'expense').sort(sortCategories);
  const incomes = categories.filter((category) => category.type === 'income').sort(sortCategories);
  const customFinancialMonth = financialMonthMode === 'custom';

  return `
    <main class="page">
      <header class="page-header"><div><h1 class="page-title">Einstellungen</h1><p class="page-subtitle">Kategorien, Auswertung, Darstellung und Datensicherung verwalten.</p></div></header>

      <section class="section settings-section">
        <div class="section-heading"><div><h2>Auswertung</h2><p class="section-subtitle">Lege fest, wann dein persönlicher Finanzmonat beginnt.</p></div></div>
        <div class="card theme-setting">
          <div><strong>Monatszeitraum</strong><p>Ein eigener Finanzmonat ordnet Einnahmen und Ausgaben nach deinem tatsächlichen Zahlungsrhythmus.</p></div>
          <div class="segmented theme-segmented" aria-label="Monatszeitraum">
            <button type="button" data-financial-mode="calendar" class="${customFinancialMonth ? '' : 'active'}">Kalendermonat</button>
            <button type="button" data-financial-mode="custom" class="${customFinancialMonth ? 'active' : ''}">Finanzmonat</button>
          </div>
        </div>
        ${customFinancialMonth ? `<div class="card financial-start-setting">
          <button class="financial-start-row" type="button" data-financial-start-open aria-haspopup="dialog" aria-label="Starttag des Finanzmonats auswählen, aktuell ${Number(financialMonthStart)}">
            <span class="financial-start-copy"><strong>Finanzmonat beginnt am</strong><span>Der Monat wird nach seinem Endmonat benannt.</span></span>
            <span class="financial-start-value"><strong>${Number(financialMonthStart)}.</strong><span aria-hidden="true">›</span></span>
          </button>
          <p class="financial-start-example">Bei Starttag ${Number(financialMonthStart)} läuft „September“ z. B. vom ${Number(financialMonthStart)}. August bis ${Number(financialMonthStart) - 1 || 31}. September.</p>
          <input type="hidden" data-financial-start value="${Number(financialMonthStart)}" />
        </div>` : ''}
      </section>

      <section class="section settings-section">
        <div class="section-heading"><div><h2>Darstellung</h2><p class="section-subtitle">Moneta so anzeigen, wie es für dich angenehmer ist.</p></div></div>
        <div class="card theme-setting">
          <div><strong>Farbschema</strong><p>Die Auswahl wird lokal gespeichert und beim nächsten Start wieder verwendet.</p></div>
          <div class="segmented theme-segmented" aria-label="Farbschema">
            <button type="button" data-theme-choice="light" class="${theme === 'light' ? 'active' : ''}">☀ Hell</button>
            <button type="button" data-theme-choice="dark" class="${theme === 'dark' ? 'active' : ''}">☾ Dunkel</button>
          </div>
        </div>
      </section>

      <section class="section settings-section">
        <div class="section-heading"><div><h2>Kategorien</h2><p class="section-subtitle">Getrennt für Ausgaben und Einnahmen.</p></div></div>
        <div class="category-settings-grid">${renderCategoryGroup('Ausgaben', 'expense', expenses)}${renderCategoryGroup('Einnahmen', 'income', incomes)}</div>
      </section>

      <section class="section">
        <div class="section-heading"><div><h2>Datensicherung</h2><p class="section-subtitle">Alle lokalen Moneta-Daten in einer Datei sichern oder wiederherstellen.</p></div></div>
        <div class="card backup-card">
          <div class="backup-copy"><strong>Backup & Wiederherstellung</strong><p>Enthält Buchungen, Kategorien, Budgets und lokale Einstellungen.</p></div>
          <div class="backup-actions"><button class="btn btn-primary" type="button" data-backup-export>Backup exportieren</button><button class="btn btn-secondary" type="button" data-backup-import>Backup importieren</button><input class="sr-only" type="file" accept="application/json,.json" data-backup-file /></div>
          <p class="backup-warning">Beim Import werden die aktuell gespeicherten Daten erst nach deiner Bestätigung vollständig durch den Inhalt des Backups ersetzt.</p>
        </div>
      </section>

      <section class="section settings-section">
        <div class="section-heading"><div><h2>App</h2><p class="section-subtitle">Moneta installieren oder nach einem Update vollständig neu laden.</p></div></div>
        <div class="category-settings-grid">
          <div class="card theme-setting"><div><strong>Auf Startbildschirm installieren</strong><p data-pwa-install-copy>Moneta kann als PWA installiert und wie eine normale App gestartet werden.</p></div><button class="btn btn-primary" type="button" data-pwa-install>App installieren</button></div>
          <div class="card theme-setting"><div><strong>App neu laden</strong><p>Löscht nur zwischengespeicherte App-Dateien und lädt Moneta frisch vom Server. Buchungen, Kategorien, Budgets und Einstellungen bleiben erhalten.</p></div><button class="btn btn-secondary" type="button" data-app-reload>Neu laden</button></div>
        </div>
      </section>

      <section class="section"><div class="section-heading"><h2>Über Moneta</h2></div><div class="card settings-list"><div class="settings-item version-only"><strong>Moneta ${APP_VERSION}</strong></div></div></section>
    </main>`;
}

function renderCategoryGroup(title, type, categories) {
  const search = categories.length > CATEGORY_PREVIEW_LIMIT ? `<label class="category-search"><span aria-hidden="true">⌕</span><input type="search" data-category-search="${type}" placeholder="${title} durchsuchen" autocomplete="off" spellcheck="false" /></label>` : '';
  const rows = categories.length ? categories.map((category, index) => `<button class="category-row${index >= CATEGORY_PREVIEW_LIMIT ? ' category-row-overflow' : ''}" type="button" data-category-edit="${escapeAttr(category.id)}" data-category-row="${type}" data-category-name="${escapeAttr(category.name.toLocaleLowerCase('de-DE'))}" ${index >= CATEGORY_PREVIEW_LIMIT ? 'hidden' : ''}><span class="category-row-icon">${escapeHtml(category.icon || '•')}</span><span class="category-row-name">${escapeHtml(category.name)}</span><span class="category-row-action" aria-hidden="true">›</span></button>`).join('') : '<div class="category-empty">Noch keine Kategorien.</div>';
  const showMore = categories.length > CATEGORY_PREVIEW_LIMIT ? `<button class="category-show-more" type="button" data-category-show-more="${type}">Alle ${categories.length} anzeigen</button>` : '';
  return `<article class="card category-group" data-category-group="${type}"><div class="category-group-header"><div><strong>${title}</strong><span>${categories.length} ${categories.length === 1 ? 'Kategorie' : 'Kategorien'}</span></div><button class="btn btn-secondary category-add-btn" type="button" data-category-add="${type}">+ Neu</button></div>${search}<div class="category-list">${rows}</div>${showMore}<div class="category-empty category-search-empty" data-category-search-empty="${type}" hidden>Keine passende Kategorie gefunden.</div></article>`;
}
function sortCategories(a, b) { return a.name.localeCompare(b.name, 'de'); }
function escapeHtml(value) { return String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
