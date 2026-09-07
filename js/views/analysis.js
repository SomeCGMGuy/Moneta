import {
  filterBookingsForPeriod,
  getAnalysisPeriod,
  groupByCategory,
  monthlyExpenseSeries,
  summarizeBookings
} from '../services/analysis-service.js';
import { renderBookingList } from '../components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const chartColors = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'
];

const ranges = [
  ['month', 'Monat'],
  ['previous-quarter', 'Letztes Quartal'],
  ['year', 'Dieses Jahr'],
  ['previous-year', 'Letztes Jahr']
];

export function renderAnalysis({ allBookings, categoryMap, month, analysisRange = 'month', analysisCategoryId = null }) {
  const period = getAnalysisPeriod(analysisRange, month);
  const bookings = filterBookingsForPeriod(allBookings, period);
  const summary = summarizeBookings(bookings);
  const groups = groupByCategory(bookings, 'expense');
  const max = groups[0]?.amount ?? 1;
  const selectedCategory = analysisCategoryId ? categoryMap.get(analysisCategoryId) : null;
  const selectedBookings = selectedCategory
    ? bookings.filter((booking) => booking.type === 'expense' && booking.categoryId === selectedCategory.id)
    : [];
  const series = analysisRange === 'month' ? [] : monthlyExpenseSeries(bookings, period);

  return `
    <main class="page analysis-page">
      <header class="page-header"><div><h1 class="page-title">Analyse</h1><p class="page-subtitle">Ausgaben für ${escapeHtml(period.label)} – interaktiv nach Kategorien aufgeschlüsselt.</p></div></header>

      <div class="analysis-range-tabs" aria-label="Analysezeitraum">
        ${ranges.map(([id, label]) => `<button type="button" data-analysis-range="${id}" class="${analysisRange === id ? 'active' : ''}" aria-pressed="${analysisRange === id}">${label}</button>`).join('')}
      </div>

      <section class="card analysis-summary">
        <div><div class="analysis-summary-label">Ausgaben gesamt</div><div class="analysis-summary-value">${money.format(summary.expense)}</div></div>
        <div class="analysis-summary-period">${escapeHtml(period.label)}<br><span>${bookings.filter((b) => b.type === 'expense').length} Ausgaben</span></div>
      </section>

      ${groups.length ? renderPieChart(groups, summary.expense, categoryMap, analysisCategoryId) : ''}
      ${series.length ? renderTrend(series) : ''}

      <section class="section">
        <div class="section-heading"><div><h2>Nach Kategorien</h2><p class="section-subtitle">Kategorie antippen, um die zugehörigen Buchungen zu sehen.</p></div>${selectedCategory ? '<button class="btn btn-ghost analysis-reset" type="button" data-analysis-category="">Alle</button>' : ''}</div>
        ${groups.length ? groups.map((group, index) => {
          const category = categoryMap.get(group.categoryId) ?? { name: 'Unbekannt', icon: '•' };
          const percent = summary.expense ? (group.amount / summary.expense) * 100 : 0;
          const color = chartColors[index % chartColors.length];
          const selected = analysisCategoryId === group.categoryId;
          return `<button type="button" class="card analysis-row analysis-row-button ${selected ? 'selected' : ''}" data-analysis-category="${escapeAttr(group.categoryId)}" aria-pressed="${selected}">
            <span class="analysis-top"><span class="analysis-name"><span class="chart-dot" style="--segment-color:${color}"></span>${escapeHtml(category.icon)} ${escapeHtml(category.name)}</span><span class="analysis-value">${money.format(group.amount)}</span></span>
            <span class="progress-track"><span class="progress-value" style="width:${Math.min(100, (group.amount / max) * 100).toFixed(1)}%;--progress-color:${color}"></span></span>
            <span class="analysis-meta">${percent.toFixed(1).replace('.', ',')} % der Ausgaben</span>
          </button>`;
        }).join('') : '<div class="card empty-state"><strong>Noch nichts zu analysieren</strong>Für diesen Zeitraum sind keine Ausgaben vorhanden.</div>'}
      </section>

      ${selectedCategory ? `<section class="section analysis-drilldown">
        <div class="section-heading"><div><h2>${escapeHtml(selectedCategory.icon)} ${escapeHtml(selectedCategory.name)}</h2><p class="section-subtitle">${selectedBookings.length} ${selectedBookings.length === 1 ? 'Buchung' : 'Buchungen'} · ${money.format(selectedBookings.reduce((sum, booking) => sum + booking.amount, 0))}</p></div></div>
        ${renderBookingList(selectedBookings, categoryMap)}
      </section>` : ''}
    </main>`;
}

function renderPieChart(groups, total, categoryMap, selectedCategoryId) {
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
    const selected = selectedCategoryId === group.categoryId;
    return `<button type="button" class="chart-legend-item ${selected ? 'selected' : ''}" data-analysis-category="${escapeAttr(group.categoryId)}" aria-pressed="${selected}">
      <span class="chart-dot" style="--segment-color:${chartColors[index % chartColors.length]}"></span>
      <span class="chart-legend-name">${escapeHtml(category.name)}</span>
      <strong>${percent.toFixed(0)} %</strong>
    </button>`;
  }).join('');

  return `<section class="card analysis-chart-card" aria-label="Kreisdiagramm der Ausgaben nach Kategorie">
    <div class="analysis-chart-copy"><span class="analysis-chart-kicker">Verteilung</span><strong>Ausgaben nach Kategorie</strong><p>Tippe auf eine Kategorie, um ihre Buchungen aufzuschlüsseln.</p></div>
    <div class="analysis-chart-layout">
      <button type="button" class="donut-chart" style="--chart-background:conic-gradient(${segments.join(',')})" data-analysis-category="" aria-label="Kategorieauswahl zurücksetzen">
        <span class="donut-center"><span>Gesamt</span><strong>${money.format(total)}</strong></span>
      </button>
      <div class="chart-legend">${legend}</div>
    </div>
  </section>`;
}

function renderTrend(series) {
  const max = Math.max(...series.map((row) => row.amount), 1);
  return `<section class="card analysis-trend-card">
    <div class="analysis-chart-copy"><span class="analysis-chart-kicker">Verlauf</span><strong>Ausgaben pro Monat</strong><p>So verteilt sich der ausgewählte Zeitraum über die einzelnen Monate.</p></div>
    <div class="trend-chart" aria-label="Monatlicher Ausgabenverlauf">
      ${series.map((row) => `<div class="trend-column" title="${escapeAttr(`${row.label}: ${money.format(row.amount)}`)}">
        <div class="trend-value">${row.amount ? compactMoney(row.amount) : '–'}</div>
        <div class="trend-bar-wrap"><div class="trend-bar" style="--trend-height:${Math.max(row.amount ? 7 : 0, (row.amount / max) * 100).toFixed(1)}%"></div></div>
        <div class="trend-label">${escapeHtml(row.label)}</div>
      </div>`).join('')}
    </div>
  </section>`;
}

function compactMoney(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.', ',')}k`;
  return `${Math.round(value)} €`;
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
