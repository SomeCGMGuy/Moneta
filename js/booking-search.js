import { renderBookingList } from './components/booking-list.js';

const PAGE_SIZE = 25;
const normalize = (value) => String(value ?? '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
let observer = null;
let activeSection = null;

function setup(section) {
  if (!section || section === activeSection) return;
  activeSection = section;
  observer?.disconnect();
  const payloadNode = section.querySelector('[data-booking-payload]');
  if (!payloadNode) return;
  let payload;
  try { payload = JSON.parse(payloadNode.textContent); } catch { return; }
  const bookings = payload.bookings || [];
  const allBookings = payload.allBookings || [];
  const categoryMap = new Map(payload.categories || []);
  const month = section.dataset.searchMonth || '';
  const list = section.querySelector('[data-booking-list]');
  const sentinel = section.querySelector('[data-booking-list-sentinel]');
  const input = section.querySelector('[data-booking-search]');
  const filters = section.querySelector('[data-booking-search-filters]');
  const empty = section.querySelector('[data-booking-search-empty]');
  const count = section.querySelector('[data-booking-visible-count]');
  let scope = 'all';
  let source = bookings;
  let rendered = Math.min(PAGE_SIZE, bookings.length);

  const searchText = (booking) => {
    const category = categoryMap.get(booking.categoryId);
    return normalize([booking.title, booking.note, category?.name, booking.amount, money(booking.amount), booking.date, booking.type === 'expense' ? 'Ausgabe' : 'Einnahme'].filter(Boolean).join(' '));
  };
  const matches = () => {
    const query = normalize(input?.value);
    if (!query) return bookings;
    const year = month.slice(0, 4);
    return allBookings.filter((booking) => {
      const inScope = scope === 'month' ? booking.date?.startsWith(month) : scope === 'year' ? booking.date?.startsWith(year) : true;
      return inScope && searchText(booking).includes(query);
    });
  };
  const append = (rows) => {
    if (!rows.length) return;
    const holder = document.createElement('div');
    holder.innerHTML = renderBookingList(rows, categoryMap);
    while (holder.firstChild) list.append(holder.firstChild);
    document.dispatchEvent(new CustomEvent('moneta:booking-rows-added'));
  };
  const renderNext = (reset = false) => {
    if (reset) { source = matches(); rendered = 0; list.innerHTML = ''; }
    const next = source.slice(rendered, rendered + PAGE_SIZE);
    append(next); rendered += next.length;
    const searching = Boolean(normalize(input?.value));
    if (count) count.textContent = String(searching ? source.length : bookings.length);
    if (empty) empty.hidden = !searching || source.length > 0;
    if (sentinel) sentinel.hidden = rendered >= source.length;
  };
  input?.addEventListener('input', () => { if (filters) filters.hidden = !normalize(input.value); renderNext(true); });
  filters?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-booking-search-scope]'); if (!button) return;
    scope = button.dataset.bookingSearchScope || 'all';
    filters.querySelectorAll('[data-booking-search-scope]').forEach((item) => item.classList.toggle('active', item === button));
    renderNext(true);
  });
  observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting) && rendered < source.length) renderNext(); }, { rootMargin: '320px 0px' });
  if (sentinel) observer.observe(sentinel);
}

const watch = new MutationObserver(() => setup(document.querySelector('[data-booking-section]')));
watch.observe(document.getElementById('app'), { childList: true, subtree: true });
setup(document.querySelector('[data-booking-section]'));

function money(value) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value); }
