import {
  compareCategoryMonths,
  filterBookingsForPeriod,
  getAnalysisPeriod,
  groupByCategory,
  monthlyExpenseSeries,
  summarizeBookings
} from '../services/analysis-service.js';
import { renderBookingList } from '../components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const chartColors = ['var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)','var(--chart-5)','var(--chart-6)','var(--chart-7)','var(--chart-8)'];
const ranges = [['month','Monat'],['previous-quarter','Letztes Quartal'],['year','Dieses Jahr'],['previous-year','Letztes Jahr']];

export function renderAnalysis({ allBookings, categoryMap, month, analysisRange = 'month', analysisCategoryId = null, analysisMonth = null }) {
  const period = getAnalysisPeriod(analysisRange, month);
  const bookings = filterBookingsForPeriod(allBookings, period);
  const summary = summarizeBookings(bookings);
  const groups = groupByCategory(bookings, 'expense');
  const max = groups[0]?.amount ?? 1;
  const selectedCategory = analysisCategoryId ? categoryMap.get(analysisCategoryId) : null;
  const selectedBookings = selectedCategory ? bookings.filter((booking) => booking.type === 'expense' && booking.categoryId === selectedCategory.id) : [];
  const trendBookings = selectedCategory ? selectedBookings : bookings;
  const series = analysisRange === 'month' ? [] : monthlyExpenseSeries(trendBookings, period);
  const activeMonthDate = new Date(`${month}-01T12:00:00`);
  const comparison = selectedCategory && analysisMonth ? compareCategoryMonths(allBookings, selectedCategory.id, analysisMonth) : null;

  return `<main class="page analysis-page" data-active-month="${escapeAttr(month)}">
    <header class="page-header"><div><h1 class="page-title">Analyse</h1><p class="page-subtitle">Ausgaben für ${escapeHtml(period.label)} – interaktiv nach Kategorien aufgeschlüsselt.</p></div></header>
    <div class="section-heading analysis-month-heading"><div class="month-switcher" aria-label="Bezugsmonat der Analyse"><button class="icon-btn" type="button" data-month="prev" aria-label="Vorheriger Monat">‹</button><div class="month-label">${capitalize(monthName.format(activeMonthDate))}</div><button class="icon-btn" type="button" data-month="next" aria-label="Nächster Monat">›</button></div></div>
    <div class="analysis-range-shell"><div class="analysis-range-tabs" aria-label="Analysezeitraum">${ranges.map(([id,label]) => `<button type="button" data-analysis-range="${id}" class="${analysisRange === id ? 'active' : ''}" aria-pressed="${analysisRange === id}">${label}</button>`).join('')}</div></div>
    <section class="card analysis-summary"><div><div class="analysis-summary-label">Ausgaben gesamt</div><div class="analysis-summary-value">${money.format(summary.expense)}</div></div><div class="analysis-summary-period">${escapeHtml(period.label)}<br><span>${bookings.filter((b) => b.type === 'expense').length} Ausgaben</span></div></section>
    ${groups.length ? renderPieChart(groups, summary.expense, categoryMap, analysisCategoryId) : ''}
    ${series.length ? renderTrend(series, selectedCategory, analysisMonth) : ''}
    ${comparison ? renderComparison(comparison, selectedCategory) : ''}
    <section class="section"><div class="section-heading"><div><h2>Nach Kategorien</h2><p class="section-subtitle">Kategorie antippen, um Kostenentwicklung und Buchungen zu sehen.</p></div>${selectedCategory ? '<button class="btn btn-ghost analysis-reset" type="button" data-analysis-category="">Alle</button>' : ''}</div>
    ${groups.length ? groups.map((group,index) => { const category = categoryMap.get(group.categoryId) ?? { name:'Unbekannt', icon:'•' }; const percent = summary.expense ? (group.amount / summary.expense) * 100 : 0; const color = chartColors[index % chartColors.length]; const selected = analysisCategoryId === group.categoryId; return `<button type="button" class="card analysis-row analysis-row-button ${selected ? 'selected' : ''}" data-analysis-category="${escapeAttr(group.categoryId)}" aria-pressed="${selected}"><span class="analysis-top"><span class="analysis-name"><span class="chart-dot" style="--segment-color:${color}"></span>${escapeHtml(category.icon)} ${escapeHtml(category.name)}</span><span class="analysis-value">${money.format(group.amount)}</span></span><span class="progress-track"><span class="progress-value" style="width:${Math.min(100,(group.amount/max)*100).toFixed(1)}%;--progress-color:${color}"></span></span><span class="analysis-meta">${percent.toFixed(1).replace('.',',')} % der Ausgaben</span></button>`; }).join('') : '<div class="card empty-state"><strong>Noch nichts zu analysieren</strong>Für diesen Zeitraum sind keine Ausgaben vorhanden.</div>'}</section>
    ${selectedCategory ? `<section class="section analysis-drilldown"><div class="section-heading"><div><h2>${escapeHtml(selectedCategory.icon)} ${escapeHtml(selectedCategory.name)}</h2><p class="section-subtitle">${selectedBookings.length} ${selectedBookings.length === 1 ? 'Buchung' : 'Buchungen'} · ${money.format(selectedBookings.reduce((sum,b) => sum + b.amount,0))}</p></div></div>${renderBookingList(selectedBookings, categoryMap)}</section>` : ''}
  </main>`;
}

function renderPieChart(groups,total,categoryMap,selectedCategoryId) {
  let cursor = 0; const selectedGroup = selectedCategoryId ? groups.find((g) => g.categoryId === selectedCategoryId) : null; const selectedCategory = selectedGroup ? categoryMap.get(selectedGroup.categoryId) : null; const selectedPercent = selectedGroup && total ? (selectedGroup.amount/total)*100 : 0;
  const segments = groups.map((group,index) => { const percent = total ? (group.amount/total)*100 : 0; const start = cursor; cursor += percent; const selected = selectedCategoryId === group.categoryId; const visiblePercent = Math.max(0,percent-.7); return `<circle class="donut-segment ${selected ? 'selected' : ''}" cx="60" cy="60" r="46" pathLength="100" fill="none" stroke="${chartColors[index % chartColors.length]}" stroke-width="14" stroke-dasharray="${visiblePercent.toFixed(3)} ${(100-visiblePercent).toFixed(3)}" stroke-dashoffset="${(-start).toFixed(3)}" data-analysis-category="${escapeAttr(group.categoryId)}" tabindex="0" role="button" aria-label="${escapeAttr((categoryMap.get(group.categoryId)?.name ?? 'Unbekannt') + ': ' + percent.toFixed(1).replace('.',',') + ' Prozent')}"></circle>`; }).join('');
  const legend = groups.slice(0,8).map((group,index) => { const category = categoryMap.get(group.categoryId) ?? { name:'Unbekannt' }; const percent = total ? (group.amount/total)*100 : 0; const selected = selectedCategoryId === group.categoryId; return `<button type="button" class="chart-legend-item ${selected ? 'selected' : ''}" data-analysis-category="${escapeAttr(group.categoryId)}" aria-pressed="${selected}"><span class="chart-dot" style="--segment-color:${chartColors[index % chartColors.length]}"></span><span class="chart-legend-name">${escapeHtml(category.name)}</span><strong>${percent.toFixed(0)} %</strong></button>`; }).join('');
  const centerLabel = selectedGroup && selectedCategory ? `<span>${escapeHtml(selectedCategory.name)}</span><strong>${money.format(selectedGroup.amount)}</strong><small>${selectedPercent.toFixed(1).replace('.',',')} %</small>` : `<span>Gesamt</span><strong>${money.format(total)}</strong>`;
  return `<section class="card analysis-chart-card" aria-label="Donutdiagramm der Ausgaben nach Kategorie"><div class="analysis-chart-copy"><span class="analysis-chart-kicker">Verteilung</span><strong>Ausgaben nach Kategorie</strong><p>Tippe auf ein Segment oder eine Kategorie, um Kostenentwicklung und Buchungen zu filtern.</p></div><div class="analysis-chart-layout"><div class="donut-chart-wrap ${selectedCategoryId ? 'has-selection' : ''}"><svg class="donut-chart" viewBox="0 0 120 120" aria-label="Ausgaben nach Kategorie">${segments}</svg><button type="button" class="donut-center" data-analysis-category="" aria-label="Kategorieauswahl zurücksetzen">${centerLabel}</button></div><div class="chart-legend">${legend}</div></div></section>`;
}

function renderTrend(series,selectedCategory,selectedMonth) {
  const max = Math.max(...series.map((row) => row.amount),1); const title = selectedCategory ? `${escapeHtml(selectedCategory.name)} pro Monat` : 'Ausgaben pro Monat';
  const description = selectedCategory ? `Tippe einen Monat an, um ihn mit dem Vormonat zu vergleichen.` : 'So verteilt sich der ausgewählte Zeitraum über die einzelnen Monate.';
  return `<section class="card analysis-trend-card"><div class="analysis-chart-copy"><span class="analysis-chart-kicker">Verlauf</span><strong>${title}</strong><p>${description}</p></div><div class="trend-chart" aria-label="Monatlicher Kostenverlauf">${series.map((row) => `<button type="button" class="trend-column ${selectedMonth === row.key ? 'selected' : ''}" ${selectedCategory ? `data-analysis-month="${escapeAttr(row.key)}"` : 'disabled'} title="${escapeAttr(`${row.label}: ${money.format(row.amount)}`)}"><span class="trend-value">${row.amount ? compactMoney(row.amount) : '0 €'}</span><span class="trend-bar-wrap"><span class="trend-bar" style="--trend-height:${Math.max(row.amount ? 7 : 0,(row.amount/max)*100).toFixed(1)}%"></span></span><span class="trend-label">${escapeHtml(row.label)}</span></button>`).join('')}</div></section>`;
}

function renderComparison(data,category) {
  const currentLabel = formatMonth(data.month); const previousLabel = formatMonth(data.previousMonth); const higher = data.delta > 0; const lower = data.delta < 0;
  const deltaText = `${data.delta > 0 ? '+' : ''}${money.format(data.delta)}`; const percentText = data.percent === null ? 'kein Vergleichswert' : `${data.percent > 0 ? '+' : ''}${data.percent.toFixed(0)} %`;
  const driverRows = data.drivers.length ? data.drivers.map((row) => `<div class="insight-driver"><span>${escapeHtml(row.title)}</span><strong>+${money.format(row.delta)}</strong></div>`).join('') : '<p class="insight-empty">Kein einzelner Buchungstitel erklärt einen Mehrbetrag gegenüber dem Vormonat.</p>';
  const verdict = higher ? `Im ${currentLabel} hast du in ${escapeHtml(category.name)} ${money.format(data.delta)} mehr ausgegeben als im ${previousLabel}.` : lower ? `Im ${currentLabel} waren es ${money.format(Math.abs(data.delta))} weniger als im ${previousLabel}.` : `Die Ausgaben waren genauso hoch wie im ${previousLabel}.`;
  return `<section class="card analysis-insight-card"><div class="analysis-chart-copy"><span class="analysis-chart-kicker">Monatsvergleich</span><strong>Warum war ${currentLabel} anders?</strong><p>${verdict}</p></div><div class="insight-metrics"><div><span>Unterschied</span><strong>${deltaText}</strong><small>${percentText}</small></div><div><span>Buchungen</span><strong>${data.currentCount}</strong><small>${signedCount(data.currentCount-data.previousCount)} zum Vormonat</small></div><div><span>Ø Buchung</span><strong>${money.format(data.currentAverage)}</strong><small>${signedMoney(data.currentAverage-data.previousAverage)}</small></div></div>${higher ? `<div class="insight-drivers"><h3>Größte Mehrbeträge</h3>${driverRows}</div>` : ''}${data.largestBooking ? `<div class="insight-largest"><span>Größte Buchung im Monat</span><strong>${escapeHtml(data.largestBooking.title || 'Ohne Bezeichnung')} · ${money.format(data.largestBooking.amount)}</strong></div>` : ''}<p class="insight-note">Die Erklärung basiert ausschließlich auf deinen Buchungen und vergleicht diesen Monat mit dem direkten Vormonat.</p></section>`;
}

function signedCount(value) { return `${value > 0 ? '+' : ''}${value}`; }
function signedMoney(value) { return `${value > 0 ? '+' : ''}${money.format(value)}`; }
function formatMonth(value) { return capitalize(monthName.format(new Date(`${value}-01T12:00:00`))); }
function compactMoney(value) { if (value >= 1000) return `${(value/1000).toFixed(value >= 10000 ? 0 : 1).replace('.',',')}k`; return `${Math.round(value)} €`; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value).replace(/[&<>'\"]/g,(char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
function escapeAttr(value) { return escapeHtml(value); }
