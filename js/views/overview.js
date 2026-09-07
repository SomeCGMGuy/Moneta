import { summarizeBookings } from '../services/analysis-service.js';
import { renderBookingList } from '../components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function renderOverview({ month, bookings, categoryMap }) {
  const summary = summarizeBookings(bookings);
  const date = new Date(`${month}-01T12:00:00`);
  return `
    <main class="page">
      <header class="page-header">
        <div class="hero-brand">
          <div class="hero-logo"><img src="./assets/icons/icon.svg" alt="" /></div>
          <div><div class="hero-wordmark">Moneta</div><div class="hero-tagline">Finanzanalyse & Budget</div></div>
        </div>
        <span class="local-badge">● Lokal</span>
      </header>

      <div class="section-heading">
        <div class="month-switcher">
          <button class="icon-btn" type="button" data-month="prev" aria-label="Vorheriger Monat">‹</button>
          <div class="month-label">${capitalize(monthName.format(date))}</div>
          <button class="icon-btn" type="button" data-month="next" aria-label="Nächster Monat">›</button>
        </div>
      </div>

      <section class="card summary-card">
        <div class="eyebrow">Saldo</div>
        <div class="summary-balance">${money.format(summary.balance)}</div>
        <div class="summary-period">für ${capitalize(monthName.format(date))}</div>
      </section>

      <section class="metric-grid">
        <div class="card metric-card"><div class="metric-label">Einnahmen</div><div class="metric-value income">${money.format(summary.income)}</div></div>
        <div class="card metric-card"><div class="metric-label">Ausgaben</div><div class="metric-value expense">${money.format(summary.expense)}</div></div>
        <div class="card metric-card"><div class="metric-label">Buchungen</div><div class="metric-value">${bookings.length}</div></div>
        <div class="card metric-card"><div class="metric-label">Ø Ausgabe</div><div class="metric-value">${money.format(averageExpense(bookings))}</div></div>
      </section>

      <section class="section">
        <div class="section-heading"><h2>Buchungen</h2><span class="chip">${bookings.length}</span></div>
        ${renderBookingList(bookings, categoryMap)}
      </section>
    </main>`;
}

function averageExpense(bookings) {
  const expenses = bookings.filter((b) => b.type === 'expense');
  return expenses.length ? expenses.reduce((sum, b) => sum + b.amount, 0) / expenses.length : 0;
}
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
