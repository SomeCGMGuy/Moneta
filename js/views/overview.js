import { summarizeBookings } from '../services/analysis-service.js';
import { renderBookingList } from '../components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function renderOverview({ month, bookings, categoryMap }) {
  const summary = summarizeBookings(bookings); const date = new Date(`${month}-01T12:00:00`);
  const projectedCount = bookings.filter((booking) => booking.isProjected).length;
  const balanceClass = summary.balance < 0 ? ' negative' : '';
  const label = capitalize(monthName.format(date));
  return `<main class="page" data-active-month="${escapeHtml(month)}">
    <header class="page-header"><div class="hero-brand"><div class="hero-logo" aria-hidden="true"><svg viewBox="0 0 512 512" focusable="false"><defs><linearGradient id="hero-logo-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3d9660"/><stop offset="1" stop-color="#0d4a32"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#hero-logo-gradient)"/><g fill="#fff"><rect x="112" y="294" width="70" height="106" rx="22"/><rect x="221" y="218" width="70" height="182" rx="22"/><rect x="330" y="126" width="70" height="274" rx="22"/></g></svg></div><div><div class="hero-wordmark">moneta<span class="brand-dot">.</span></div><div class="hero-tagline">Finanzanalyse & Budget</div></div></div><span class="local-badge">● Lokal</span></header>
    <div class="section-heading month-switcher-shell"><div class="month-switcher" role="group" aria-label="Monat auswählen"><button class="month-nav-btn" type="button" data-month="prev" aria-label="Vorheriger Monat"><span aria-hidden="true">‹</span></button><div class="month-label" aria-live="polite">${label}</div><button class="month-nav-btn" type="button" data-month="next" aria-label="Nächster Monat"><span aria-hidden="true">›</span></button></div></div>
    <section class="card summary-card"><div class="eyebrow">Saldo</div><div class="summary-balance${balanceClass}">${money.format(summary.balance)}</div><div class="summary-period">für ${label}</div>${projectedCount ? `<div class="projected-summary-note">inkl. geplantem Saldo von ${money.format(summary.projectedBalance)}</div>` : ''}</section>
    <section class="metric-grid"><div class="card metric-card"><div class="metric-label">Einnahmen</div><div class="metric-value income">${money.format(summary.income)}</div>${summary.projectedIncome ? `<div class="projected-metric-note">davon ${money.format(summary.projectedIncome)} geplant</div>` : ''}</div><div class="card metric-card"><div class="metric-label">Ausgaben</div><div class="metric-value expense">${money.format(summary.expense)}</div>${summary.projectedExpense ? `<div class="projected-metric-note">davon ${money.format(summary.projectedExpense)} geplant</div>` : ''}</div><div class="card metric-card"><div class="metric-label">Buchungen</div><div class="metric-value">${bookings.length}</div>${projectedCount ? `<div class="projected-metric-note">${projectedCount} geplant</div>` : ''}</div><div class="card metric-card"><div class="metric-label">Ø Ausgabe</div><div class="metric-value">${money.format(averageExpense(bookings))}</div></div></section>
    <section class="section" data-booking-section>
      <div class="booking-sticky-sentinel" data-booking-sticky-sentinel aria-hidden="true"></div>
      <div class="booking-sticky-header" data-booking-sticky-header>
        <div class="booking-sticky-summary"><span>${escapeHtml(label)}</span><strong class="${balanceClass.trim()}">${money.format(summary.balance)}</strong></div>
        <div class="section-heading"><h2>Buchungen</h2><span class="chip" data-booking-visible-count>${bookings.length}</span></div>
        ${bookings.length ? `<label class="booking-search" aria-label="Buchungen durchsuchen"><span class="booking-search-icon" aria-hidden="true">⌕</span><input type="search" data-booking-search placeholder="Buchungen durchsuchen" autocomplete="off" spellcheck="false" /></label>` : ''}
      </div>
      <div class="booking-timeline" data-booking-timeline>
        <div class="timeline-sentinel timeline-sentinel-top loading" data-timeline-sentinel="future" aria-hidden="true">${renderSkeleton()}</div>
        <section class="timeline-month timeline-month-current" data-timeline-month="${escapeHtml(month)}"${bookings.length ? '' : ' hidden'}><div data-timeline-list>${bookings.length ? renderBookingList(bookings, categoryMap) : ''}</div></section>
      </div>
      ${bookings.length ? '<div class="card empty-state booking-search-empty" data-booking-search-empty hidden><strong>Keine Treffer</strong>Für diese Suche gibt es in der geladenen Timeline keine passende Buchung.</div>' : '<div class="card empty-state"><strong>Noch keine Buchungen</strong>Über das Plus kannst du deine erste Einnahme oder Ausgabe anlegen.</div>'}
    </section>
  </main>`;
}
function renderSkeleton() { return `<div class="timeline-skeleton card"><span class="timeline-skeleton-icon"></span><span class="timeline-skeleton-copy"><i></i><i></i></span><span class="timeline-skeleton-amount"></span></div><div class="timeline-skeleton card"><span class="timeline-skeleton-icon"></span><span class="timeline-skeleton-copy"><i></i><i></i></span><span class="timeline-skeleton-amount"></span></div>`; }
function averageExpense(bookings) { const expenses = bookings.filter((b) => b.type === 'expense'); return expenses.length ? expenses.reduce((sum, b) => sum + b.amount, 0) / expenses.length : 0; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
