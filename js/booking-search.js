const normalize = (value) => String(value ?? '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const scopes = new WeakMap();

function applySearch(section) {
  const input = section.querySelector('[data-booking-search]');
  if (!input) return;
  const query = normalize(input.value);
  const scope = scopes.get(section) || 'all';
  const activeMonth = section.dataset.searchMonth || '';
  const activeYear = activeMonth.slice(0, 4);
  const rows = [...section.querySelectorAll('[data-booking-row]')];
  let visible = 0;

  rows.forEach((row) => {
    const date = row.dataset.bookingDate || '';
    const inScope = scope === 'month' ? date.startsWith(activeMonth) : scope === 'year' ? date.startsWith(activeYear) : true;
    const matches = query ? inScope && normalize(row.dataset.bookingSearch).includes(query) : row.dataset.bookingCurrent === 'true';
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  section.querySelectorAll('[data-booking-day]').forEach((group) => { group.hidden = ![...group.querySelectorAll('[data-booking-row]')].some((row) => !row.hidden); });
  const count = section.querySelector('[data-booking-visible-count]'); if (count) count.textContent = String(visible);
  const empty = section.querySelector('[data-booking-search-empty]'); if (empty) empty.hidden = !query || visible > 0;
  const filters = section.querySelector('[data-booking-search-filters]'); if (filters) filters.hidden = !query;
}

document.addEventListener('input', (event) => {
  const input = event.target.closest('[data-booking-search]'); if (!input) return;
  const section = input.closest('[data-booking-section]'); if (!section) return;
  applySearch(section);
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-booking-search-scope]'); if (!button) return;
  const section = button.closest('[data-booking-section]'); if (!section) return;
  scopes.set(section, button.dataset.bookingSearchScope || 'all');
  section.querySelectorAll('[data-booking-search-scope]').forEach((item) => item.classList.toggle('active', item === button));
  applySearch(section);
});
