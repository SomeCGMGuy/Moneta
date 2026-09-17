import { filterBookingsForPeriod, getAnalysisPeriod, summarizeBookings } from '../services/analysis-service.js';
import { renderBookingList } from './booking-list.js';
import { mountPushPage } from './push-page.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function showAnalysisCategoryDetail({ categoryId, allBookings, categoryMap, month, analysisRange }) {
  const category = categoryMap.get(categoryId);
  if (!category) return Promise.resolve(null);

  const period = getAnalysisPeriod(analysisRange, month);
  const periodBookings = filterBookingsForPeriod(allBookings, period);
  const expenses = periodBookings.filter((booking) => booking.type === 'expense');
  const bookings = expenses.filter((booking) => booking.categoryId === categoryId);
  const total = bookings.reduce((sum, booking) => sum + booking.amount, 0);
  const totalExpenses = summarizeBookings(periodBookings).expense;
  const percent = totalExpenses ? (total / totalExpenses) * 100 : 0;
  const scrollY = window.scrollY;

  const layer = document.createElement('div');
  layer.className = 'push-page-layer analysis-category-layer';
  layer.innerHTML = `
    <section class="push-page analysis-category-page" role="dialog" aria-modal="true" aria-labelledby="analysis-category-title">
      <header class="push-page-header">
        <button class="push-page-back" type="button" data-back aria-label="Zurück zur Analyse">‹</button>
        <h2 id="analysis-category-title">${escapeHtml(category.icon || '•')} ${escapeHtml(category.name)}</h2>
        <span class="push-page-header-spacer" aria-hidden="true"></span>
      </header>
      <div class="push-page-content analysis-category-content">
        <section class="card analysis-category-summary">
          <span class="analysis-category-kicker">Ausgaben · ${escapeHtml(period.label)}</span>
          <strong>${money.format(total)}</strong>
          <div class="analysis-category-metrics">
            <span><b>${bookings.length}</b> ${bookings.length === 1 ? 'Buchung' : 'Buchungen'}</span>
            <span><b>${percent.toFixed(1).replace('.', ',')} %</b> der Ausgaben</span>
          </div>
        </section>
        <section class="section analysis-category-bookings">
          <div class="section-heading"><h2>Buchungen</h2><span class="chip">${bookings.length}</span></div>
          ${renderBookingList(bookings, categoryMap)}
        </section>
      </div>
    </section>`;

  const navigation = mountPushPage(layer, { historyKey: 'monetaAnalysisCategoryPage' });
  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(null));
  navigation.promise.finally(() => requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' })));
  return navigation.promise;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
