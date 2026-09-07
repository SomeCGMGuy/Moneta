import { groupByCategory, summarizeBookings } from '../services/analysis-service.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const chartColors = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'
];

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
      ${groups.length ? renderPieChart(groups, summary.expense, categoryMap) : ''}
      <section class="section">
        <div class="section-heading"><h2>Nach Kategorien</h2></div>
        ${groups.length ? groups.map((group, index) => {
          const category = categoryMap.get(group.categoryId) ?? { name: 'Unbekannt', icon: '•' };
          const percent = summary.expense ? (group.amount / summary.expense) * 100 : 0;
          const color = chartColors[index % chartColors.length];
          return `<article class="card analysis-row">
            <div class="analysis-top"><div class="analysis-name"><span class="chart-dot" style="--segment-color:${color}"></span>${escapeHtml(category.icon)} ${escapeHtml(category.name)}</div><div class="analysis-value">${money.format(group.amount)}</div></div>
            <div class="progress-track"><div class="progress-value" style="width:${Math.min(100, (group.amount / max) * 100).toFixed(1)}%;--progress-color:${color}"></div></div>
            <div class="analysis-meta">${percent.toFixed(1).replace('.', ',')} % der Ausgaben</div>
          </article>`;
        }).join('') : '<div class="card empty-state"><strong>Noch nichts zu analysieren</strong>Sobald du Ausgaben erfasst, erscheinen hier deine Kategorien.</div>'}
      </section>
    </main>`;
}

function renderPieChart(groups, total, categoryMap) {
  let cursor = 0;
  const segments = groups.map((group, index) => {
    const percent = total ? (group.amount / total) * 100 : 0;
    const start = cursor;
    cursor += percent;
    return `${chartColors[index % chartColors.length]} ${start.toFixed(3)}% ${cursor.toFixed(3)}%`;
  });

  const legend = groups.slice(0, 8).map((group, index) => {
    const category = categoryMap.get(group.categoryId) ?? { name: 'Unbekannt' };
    const percent = total ? (group.amount / total) * 100 : 0;
    return `<div class="chart-legend-item">
      <span class="chart-dot" style="--segment-color:${chartColors[index % chartColors.length]}"></span>
      <span class="chart-legend-name">${escapeHtml(category.name)}</span>
      <strong>${percent.toFixed(0)} %</strong>
    </div>`;
  }).join('');

  return `<section class="card analysis-chart-card" aria-label="Kreisdiagramm der Ausgaben nach Kategorie">
    <div class="analysis-chart-copy"><span class="analysis-chart-kicker">Verteilung</span><strong>Ausgaben nach Kategorie</strong><p>Die größten Kostenblöcke auf einen Blick.</p></div>
    <div class="analysis-chart-layout">
      <div class="donut-chart" style="--chart-background:conic-gradient(${segments.join(',')})" role="img" aria-label="Kreisdiagramm der Ausgaben">
        <div class="donut-center"><span>Gesamt</span><strong>${money.format(total)}</strong></div>
      </div>
      <div class="chart-legend">${legend}</div>
    </div>
  </section>`;
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
