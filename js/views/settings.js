export function renderSettings({ categoryMap }) {
  const categories = [...categoryMap.values()];
  const expenses = categories.filter((category) => category.type === 'expense').sort(sortCategories);
  const incomes = categories.filter((category) => category.type === 'income').sort(sortCategories);

  return `
    <main class="page">
      <header class="page-header"><div><h1 class="page-title">Einstellungen</h1><p class="page-subtitle">Kategorien und lokale App-Einstellungen verwalten.</p></div></header>

      <section class="section settings-section">
        <div class="section-heading"><div><h2>Kategorien</h2><p class="section-subtitle">Getrennt für Ausgaben und Einnahmen.</p></div></div>
        <div class="category-settings-grid">
          ${renderCategoryGroup('Ausgaben', 'expense', expenses)}
          ${renderCategoryGroup('Einnahmen', 'income', incomes)}
        </div>
      </section>

      <section class="section">
        <div class="section-heading"><h2>Über Moneta</h2></div>
        <div class="card settings-list">
          <div class="settings-item"><strong>Lokale Datenspeicherung</strong><p>Buchungen, Kategorien und Budgets liegen ausschließlich in IndexedDB dieses Browsers.</p></div>
          <div class="settings-item"><strong>Offline-PWA</strong><p>Der App-Shell wird über einen Service Worker gecacht. Nach dem ersten Laden funktioniert die Oberfläche auch ohne Netz.</p></div>
          <div class="settings-item"><strong>Datenmodell</strong><p>Saldo und Analysewerte werden aus Buchungen berechnet und nicht redundant gespeichert.</p></div>
          <div class="settings-item"><strong>Moneta 2.0.1</strong><p>Schlanke lokale Finanzanalyse und Budgetplanung ohne Framework und Cloud-Zwang.</p></div>
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
