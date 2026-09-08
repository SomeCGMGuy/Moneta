import { listBookingsWithProjections } from './services/booking-service.js';
import { getCategoryMap } from './services/category-service.js';
import { filterBookingsForPeriod, getFinancialMonthPeriod } from './services/analysis-service.js';
import { renderBookingList } from './components/booking-list.js';

const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const MAX_FUTURE_MONTHS = 1;
let controller = null;

const observer = new MutationObserver(() => scheduleInit());
observer.observe(document.querySelector('#app') ?? document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', scheduleInit);
document.addEventListener('input', (event) => {
  if (!event.target.closest('[data-booking-search]')) return;
  requestAnimationFrame(() => controller?.syncSearchVisibility());
});
document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav="overview"]');
  if (!nav || !document.querySelector('[data-active-month]')) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, { capture: true });

scheduleInit();

function scheduleInit() {
  requestAnimationFrame(() => {
    const root = document.querySelector('[data-booking-timeline]');
    if (!root || root.dataset.timelineReady === 'true') return;
    controller?.destroy();
    controller = new OverviewTimeline(root);
    controller.init().catch((error) => console.warn('Timeline:', error));
  });
}

class OverviewTimeline {
  constructor(root) {
    this.root = root;
    this.page = root.closest('[data-active-month]');
    this.section = root.closest('[data-booking-section]');
    this.baseMonth = this.page?.dataset.activeMonth;
    this.futureSentinel = root.querySelector('[data-timeline-sentinel="future"]');
    this.currentSection = root.querySelector('.timeline-month-current');
    this.stickyHeader = this.section?.querySelector('[data-booking-sticky-header]');
    this.stickySentinel = this.section?.querySelector('[data-booking-sticky-sentinel]');
    this.categoryMap = null;
    this.boundStickyState = () => this.updateStickyState();
  }

  async init() {
    this.root.dataset.timelineReady = 'true';
    if (!this.baseMonth) return;
    this.categoryMap = await getCategoryMap();
    window.addEventListener('scroll', this.boundStickyState, { passive: true });
    this.updateStickyState();
    await this.loadFutureMonth();
    this.syncSearchVisibility();
    this.anchorLatestRealBooking();
  }

  destroy() {
    window.removeEventListener('scroll', this.boundStickyState);
  }

  async loadFutureMonth() {
    if (!this.futureSentinel || !this.currentSection || MAX_FUTURE_MONTHS < 1) return;
    const month = shiftMonth(this.baseMonth, 1);
    try {
      const bookings = await this.fetchMonth(month);
      if (bookings.length) this.currentSection.before(this.createMonthSection(month, bookings));
    } finally {
      this.futureSentinel.classList.remove('loading');
      this.futureSentinel.hidden = true;
    }
  }

  async fetchMonth(month) {
    const startDay = localStorage.getItem('moneta-financial-month-mode') === 'custom' ? Number(localStorage.getItem('moneta-financial-month-start') || 28) : 1;
    const period = getFinancialMonthPeriod(month, startDay);
    const rows = await listBookingsWithProjections({ from: period.start, to: period.end });
    return filterBookingsForPeriod(rows, period);
  }

  createMonthSection(month, bookings) {
    const label = capitalize(monthName.format(new Date(`${month}-01T12:00:00`)));
    const section = document.createElement('section');
    section.className = 'timeline-month timeline-month-future';
    section.dataset.timelineMonth = month;
    section.innerHTML = `<div class="timeline-month-heading"><strong>${escapeHtml(label)}</strong><span>${bookings.length}</span></div><div data-timeline-list>${renderBookingList(bookings, this.categoryMap)}</div>`;
    this.applyCurrentSearch(section);
    return section;
  }

  anchorLatestRealBooking() {
    const row = this.root.querySelector('.booking-row:not(.booking-row-projected)');
    const day = row?.closest('[data-booking-day]');
    if (!day) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const headerHeight = this.stickyHeader?.offsetHeight ?? 0;
      const top = window.scrollY + day.getBoundingClientRect().top - headerHeight - 10;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      this.updateStickyState();
    }));
  }

  updateStickyState() {
    if (!this.stickyHeader || !this.stickySentinel) return;
    const stuck = this.stickySentinel.getBoundingClientRect().top <= 0;
    this.stickyHeader.classList.toggle('is-stuck', stuck);
  }

  applyCurrentSearch(scope = this.root) {
    const input = this.page?.querySelector('[data-booking-search]');
    const query = normalize(input?.value ?? '');
    scope.querySelectorAll('[data-booking-row]').forEach((row) => {
      row.hidden = Boolean(query) && !normalize(row.dataset.bookingSearch).includes(query);
    });
    scope.querySelectorAll('[data-booking-day]').forEach((group) => {
      group.hidden = ![...group.querySelectorAll('[data-booking-row]')].some((row) => !row.hidden);
    });
  }

  syncSearchVisibility() {
    this.applyCurrentSearch();
    const input = this.page?.querySelector('[data-booking-search]');
    const query = normalize(input?.value ?? '');
    let visible = 0;
    this.root.querySelectorAll('[data-booking-row]').forEach((row) => { if (!row.hidden) visible += 1; });
    this.root.querySelectorAll('[data-timeline-month]').forEach((section) => {
      section.hidden = Boolean(query) && ![...section.querySelectorAll('[data-booking-row]')].some((row) => !row.hidden);
    });
    const count = this.section?.querySelector('[data-booking-visible-count]');
    if (count) count.textContent = String(visible);
    const empty = this.section?.querySelector('[data-booking-search-empty]');
    if (empty) empty.hidden = !query || visible > 0;
  }
}

function shiftMonth(month, delta) { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + delta); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function normalize(value) { return String(value ?? '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
