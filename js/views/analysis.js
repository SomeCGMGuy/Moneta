import { groupByCategory, summarizeBookings } from '../services/analysis-service.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function renderAnalysis({ bookings, categoryMap }) {
  const summary = summarizeBookings(bookings);
  const groups = groupByCategory(bookings, 'expense');
  const max = groups[0]?.amount ?? 1;

  return `
    <main class="page">
      <header class="page-header"><div><h1 class="page-title">Analyse</h1><p class="page-subtitle">Wo dein Geld in diesem Monat hingeht.</p></div></header>
      <section class="card analysis-summary">
        <div class="analysis-summary-label">Ausgaben gesamt</div>
        <div class="analysis-summary-value">${money.format(summary.expense)}</div>
      </section>
      <section class="section">
        <div class="section-heading"><h2>Nach Kategorien</h2></div>
        ${groups.length ? groups.map((group) => {
          const category = categoryMap.get(group.categoryId) ?? { name: 'Unbekannt', icon: '•' };
          const percent = summary.expense ? (group.amount / summary.expense) * 100 : 0;
          return `<article class="card analysis-row">
            <div class="analysis-top"><div class="analysis-name">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</div><div class="analysis-value">${money.format(group.amount)}</div></div>
            <div class="progress-track"><div class="progress-value" style="width:${Math.min(100, (group.amount / max) * 100).toFixed(1)}%"></div></div>
            <div class="analysis-meta">${percent.toFixed(1).replace('.', ',')} % der Ausgaben</div>
          </article>`;
        }).join('') : '<div class="card empty-state"><strong>Noch nichts zu analysieren</strong>Sobald du Ausgaben erfasst, erscheinen hier deine Kategorien.</div>'}
      </section>
    </main>`;
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
