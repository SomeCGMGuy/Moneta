import { summarizeBookings } from '../services/analysis-service.js';
import { renderBookingList } from '../components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });

export function renderOverview({ month, bookings, categoryMap }) {
  const summary = summarizeBookings(bookings);
  const date = new Date(`${month}-01T12:00:00`);
  return `
    <main class="page" data-active-month="${escapeHtml(month)}">
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

      ${renderQuickCapture(categoryMap, month)}

      <section class="section">
        <div class="section-heading"><h2>Buchungen</h2><span class="chip">${bookings.length}</span></div>
        ${renderBookingList(bookings, categoryMap)}
      </section>
    </main>`;
}

function renderQuickCapture(categoryMap, month) {
  const categories = [...categoryMap.values()]
    .filter((category) => category.type === 'expense')
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const bookingDate = dateForMonth(month);
  const currentMonth = localIsoDate(new Date()).slice(0, 7);
  const chipLabel = month === currentMonth ? 'Heute' : shortDate.format(new Date(`${bookingDate}T12:00:00`));

  return `
    <section class="section">
      <div class="section-heading"><h2>Schnellerfassung</h2><span class="chip">${escapeHtml(chipLabel)}</span></div>
      <form class="card metric-card form-grid" data-quick-capture data-booking-month="${escapeHtml(month)}">
        <div class="field">
          <label for="quick-text">Buchung</label>
          <input id="quick-text" name="quickText" type="text" inputmode="text" autocomplete="off" placeholder="z. B. REWE 12,40" required />
        </div>
        <div class="field">
          <label for="quick-category">Kategorie</label>
          <select id="quick-category" name="quickCategory" required>
            <option value="">Kategorie auswählen …</option>
            ${categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" type="submit">Buchen</button>
      </form>
    </section>`;
}

function dateForMonth(month) {
  const today = new Date();
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const day = Math.min(today.getDate(), lastDay);
  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function localIsoDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function averageExpense(bookings) {
  const expenses = bookings.filter((b) => b.type === 'expense');
  return expenses.length ? expenses.reduce((sum, b) => sum + b.amount, 0) / expenses.length : 0;
}
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
