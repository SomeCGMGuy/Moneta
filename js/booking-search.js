import { renderBookingList } from './components/booking-list.js';

const PAGE_SIZE = 25;
const normalize = (value) => String(value ?? '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
let observer = null;

export function setupBookingList({ bookings, allBookings, categoryMap, month }) {
  observer?.disconnect();
  const section = document.querySelector('[data-booking-section]');
  if (!section) return;
  const list = section.querySelector('[data-booking-list]');
  const sentinel = section.querySelector('[data-booking-list-sentinel]');
  const input = section.querySelector('[data-booking-search]');
  const filters = section.querySelector('[data-booking-search-filters]');
  const empty = section.querySelector('[data-booking-search-empty]');
  const count = section.querySelector('[data-booking-visible-count]');
  const realBookings = allBookings.filter((booking) => !booking.isProjected);
  let scope = 'all';
  let source = bookings;
  let rendered = 0;

  const searchText = (booking) => {
    const category = categoryMap.get(booking.categoryId);
    return normalize([booking.title, booking.note, category?.name, booking.amount, money(booking.amount), booking.date, booking.type === 'expense' ? 'Ausgabe' : 'Einnahme'].filter(Boolean).join(' '));
  };

  function matchingBookings() {
    const query = normalize(input?.value);
    if (!query) return bookings;
    const year = month.slice(0, 4);
    return realBookings.filter((booking) => {
      const inScope = scope === 'month' ? booking.date?.startsWith(month) : scope === 'year' ? booking.date?.startsWith(year) : true;
      return inScope && searchText(booking).includes(query);
    });
  }

  function renderNext(reset = false) {
    if (reset) { source = matchingBookings(); rendered = 0; list.innerHTML = ''; }
    const next = source.slice(rendered, rendered + PAGE_SIZE);
    if (next.length) {
      const holder = document.createElement('div');
      holder.innerHTML = renderBookingList(next, categoryMap);
      while (holder.firstChild) list.append(holder.firstChild);
      rendered += next.length;
      document.dispatchEvent(new CustomEvent('moneta:booking-rows-added'));
    }
    const queryActive = Boolean(normalize(input?.value));
    if (count) count.textContent = String(queryActive ? source.length : bookings.length);
    if (empty) empty.hidden = !queryActive || source.length > 0;
    if (sentinel) sentinel.hidden = rendered >= source.length;
  }

  input?.addEventListener('input', () => {
    if (filters) filters.hidden = !normalize(input.value);
    renderNext(true);
  });

  filters?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-booking-search-scope]');
    if (!button) return;
    scope = button.dataset.bookingSearchScope || 'all';
    filters.querySelectorAll('[data-booking-search-scope]').forEach((item) => item.classList.toggle('active', item === button));
    renderNext(true);
  });

  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting) && rendered < source.length) renderNext();
  }, { rootMargin: '320px 0px' });
  if (sentinel) observer.observe(sentinel);
  renderNext(true);
}

function money(value) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value); }
