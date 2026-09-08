const normalize = (value) => String(value ?? '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

document.addEventListener('input', (event) => {
  const input = event.target.closest('[data-booking-search]'); if (!input) return;
  const section = input.closest('[data-booking-section]'); if (!section) return;
  const query = normalize(input.value); const rows = [...section.querySelectorAll('[data-booking-row]')]; let visible = 0;
  rows.forEach((row) => { const matches = !query || normalize(row.dataset.bookingSearch).includes(query); row.hidden = !matches; if (matches) visible += 1; });
  section.querySelectorAll('[data-booking-day]').forEach((group) => { group.hidden = ![...group.querySelectorAll('[data-booking-row]')].some((row) => !row.hidden); });
  const count = section.querySelector('[data-booking-visible-count]'); if (count) count.textContent = String(visible);
  const empty = section.querySelector('[data-booking-search-empty]'); if (empty) empty.hidden = !query || visible > 0;
});
