import { APP_VERSION } from '../version.js';

export function renderSettings({ categoryMap, theme }) {
  const categories = [...categoryMap.values()];
  const expenses = categories.filter((category) => category.type === 'expense').sort(sortCategories);
  const incomes = categories.filter((category) => category.type === 'income').sort(sortCategories);

  return `
    <main class="page">
      <header class="page-header"><div><h1 class="page-title">Einstellungen</h1><p class="page-subtitle">Kategorien, Darstellung und Datensicherung verwalten.</p></div></header>

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
        <div class="category-settings-grid">
          ${renderCategoryGroup('Ausgaben', 'expense', expenses)}
          ${renderCategoryGroup('Einnahmen', 'income', incomes)}
        </div>
      </section>

      <section class="section">
        <div class="section-heading"><div><h2>Datensicherung</h2><p class="section-subtitle">Alle lokalen Moneta-Daten in einer Datei sichern oder wiederherstellen.</p></div></div>
        <div class="card backup-card">
          <div class="backup-copy"><strong>Backup & Wiederherstellung</strong><p>Enthält Buchungen, Kategorien, Budgets und lokale Einstellungen.</p></div>
          <div class="backup-actions">
            <button class="btn btn-primary" type="button" data-backup-export>Backup exportieren</button>
            <button class="btn btn-secondary" type="button" data-backup-import>Backup importieren</button>
            <input class="sr-only" type="file" accept="application/json,.json" data-backup-file />
          </div>
          <p class="backup-warning">Beim Import werden die aktuell gespeicherten Daten erst nach deiner Bestätigung vollständig durch den Inhalt des Backups ersetzt.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-heading"><h2>Über Moneta</h2></div>
        <div class="card settings-list">
          <div class="settings-item version-only"><strong>Moneta ${APP_VERSION}</strong></div>
        </div>
      </section>
    </main>`;
}

function renderCategoryGroup(title, type, categories) {
  return `<article class="card category-group">
    <div class="category-group-header">
      <div><strong>${title}</strong><span>${categories.length} ${categories.length === 1 ? 'Kategorie' : 'Kategorien'}</span></div>
      <button class="btn btn-secondary category-add-btn" type="button" data-category-add="${type}">+ Neu</button>
    </div>
    <div class="category-list">
      ${categories.length ? categories.map((category) => `<button class="category-row" type="button" data-category-edit="${escapeAttr(category.id)}">
        <span class="category-row-icon">${escapeHtml(category.icon || '•')}</span>
        <span class="category-row-name">${escapeHtml(category.name)}</span>
        <span class="category-row-action" aria-hidden="true">›</span>
      </button>`).join('') : '<div class="category-empty">Noch keine Kategorien.</div>'}
    </div>
  </article>`;
}

function sortCategories(a, b) { return a.name.localeCompare(b.name, 'de'); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
