const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const date = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' });

export function renderBookingList(bookings, categoryMap) {
  if (!bookings.length) {
    return `<div class="card empty-state"><strong>Noch keine Buchungen</strong>Über das Plus kannst du deine erste Einnahme oder Ausgabe anlegen.</div>`;
  }

  return `<div class="card booking-list">${bookings.map((booking) => {
    const category = categoryMap.get(booking.categoryId) ?? { name: 'Unbekannt', icon: '•' };
    const sign = booking.type === 'expense' ? '−' : '+';
    return `
      <button class="booking-row" type="button" data-booking-id="${escapeAttr(booking.id)}">
        <span class="booking-icon" aria-hidden="true">${escapeHtml(category.icon ?? '•')}</span>
        <span class="booking-copy">
          <span class="booking-title">${escapeHtml(booking.title)}</span>
          <span class="booking-meta">${escapeHtml(category.name)} · ${date.format(new Date(`${booking.date}T12:00:00`))}</span>
        </span>
        <span class="booking-amount ${booking.type}">${sign}${money.format(booking.amount)}</span>
      </button>`;
  }).join('')}</div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }
