import { summarizeBookings } from '../services/analysis-service.js';
import { renderBookingList } from '../components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function renderOverview({ month, bookings, allBookings, categoryMap, timelineMonths = 3 }) {
  const summary = summarizeBookings(bookings); const date = new Date(`${month}-01T12:00:00`);
  const projectedCount = bookings.filter((booking) => booking.isProjected).length;
  const balanceClass = summary.balance < 0 ? ' negative' : '';
  const timelineBookings = bookingsForTimeline(allBookings, month, timelineMonths);
  const hasMoreTimeline = hasOlderBookings(allBookings, month, timelineMonths);
  return `<main class="page" data-active-month="${escapeHtml(month)}">
    <header class="page-header"><div class="hero-brand"><div class="hero-logo" aria-hidden="true"><svg viewBox="0 0 512 512" focusable="false"><defs><linearGradient id="hero-logo-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3d9660"/><stop offset="1" stop-color="#0d4a32"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#hero-logo-gradient)"/><g fill="#fff"><rect x="112" y="294" width="70" height="106" rx="22"/><rect x="221" y="218" width="70" height="182" rx="22"/><rect x="330" y="126" width="70" height="274" rx="22"/></g></svg></div><div><div class="hero-wordmark">moneta<span class="brand-dot">.</span></div><div class="hero-tagline">Finanzanalyse & Budget</div></div></div><span class="local-badge">● Lokal</span></header>
    <div class="section-heading month-switcher-shell"><div class="month-switcher" role="group" aria-label="Monat auswählen"><button class="month-nav-btn" type="button" data-month="prev" aria-label="Vorheriger Monat"><span aria-hidden="true">‹</span></button><div class="month-label" aria-live="polite">${capitalize(monthName.format(date))}</div><button class="month-nav-btn" type="button" data-month="next" aria-label="Nächster Monat"><span aria-hidden="true">›</span></button></div></div>
    <section class="card summary-card"><div class="eyebrow">Saldo</div><div class="summary-balance${balanceClass}">${money.format(summary.balance)}</div><div class="summary-period">für ${capitalize(monthName.format(date))}</div>${projectedCount ? `<div class="projected-summary-note">inkl. geplantem Saldo von ${money.format(summary.projectedBalance)}</div>` : ''}</section>
    <section class="metric-grid"><div class="card metric-card"><div class="metric-label">Einnahmen</div><div class="metric-value income">${money.format(summary.income)}</div>${summary.projectedIncome ? `<div class="projected-metric-note">davon ${money.format(summary.projectedIncome)} geplant</div>` : ''}</div><div class="card metric-card"><div class="metric-label">Ausgaben</div><div class="metric-value expense">${money.format(summary.expense)}</div>${summary.projectedExpense ? `<div class="projected-metric-note">davon ${money.format(summary.projectedExpense)} geplant</div>` : ''}</div><div class="card metric-card"><div class="metric-label">Buchungen</div><div class="metric-value">${bookings.length}</div>${projectedCount ? `<div class="projected-metric-note">${projectedCount} geplant</div>` : ''}</div><div class="card metric-card"><div class="metric-label">Ø Ausgabe</div><div class="metric-value">${money.format(averageExpense(bookings))}</div></div></section>
    <section class="section" data-booking-section><div class="section-heading"><div><h2>Buchungen</h2><p class="section-subtitle">Chronologisch durch deine Finanzhistorie</p></div><span class="chip" data-booking-visible-count>${timelineBookings.length}</span></div>${timelineBookings.length ? `<label class="booking-search" aria-label="Buchungen durchsuchen"><span class="booking-search-icon" aria-hidden="true">⌕</span><input type="search" data-booking-search placeholder="Buchungen durchsuchen" autocomplete="off" spellcheck="false" /></label>` : ''}${renderBookingList(timelineBookings, categoryMap, { timeline: true, hasMore: hasMoreTimeline })}<div class="card empty-state booking-search-empty" data-booking-search-empty hidden><strong>Keine Treffer</strong>Für diese Suche gibt es in den geladenen Buchungen keinen Treffer.</div></section>
  </main>`;
}

function bookingsForTimeline(allBookings, month, timelineMonths) {
  const newest = `${month}-31`;
  const oldestMonth = shiftMonth(month, -(Math.max(1, timelineMonths) - 1));
  const oldest = `${oldestMonth}-01`;
  return allBookings.filter((booking) => booking.date >= oldest && booking.date <= newest);
}
function hasOlderBookings(allBookings, month, timelineMonths) {
  const oldestMonth = shiftMonth(month, -(Math.max(1, timelineMonths) - 1));
  return allBookings.some((booking) => booking.date < `${oldestMonth}-01`);
}
function shiftMonth(month, delta) { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + delta); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function averageExpense(bookings) { const expenses = bookings.filter((b) => b.type === 'expense'); return expenses.length ? expenses.reduce((sum, b) => sum + b.amount, 0) / expenses.length : 0; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
