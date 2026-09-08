import { listBookingsWithProjections } from './services/booking-service.js';
import { getCategoryMap } from './services/category-service.js';
import { filterBookingsForPeriod, getFinancialMonthPeriod } from './services/analysis-service.js';
import { renderBookingList } from './components/booking-list.js';

const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const MAX_FUTURE_MONTHS = 2;
let controller = null;

const observer = new MutationObserver(() => scheduleInit());
observer.observe(document.querySelector('#app') ?? document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', scheduleInit);
document.addEventListener('input', (event) => {
  if (!event.target.closest('[data-booking-search]')) return;
  requestAnimationFrame(() => controller?.syncSearchVisibility());
});

scheduleInit();

function scheduleInit() {
  requestAnimationFrame(() => {
    const root = document.querySelector('[data-booking-timeline]');
    if (!root || root.dataset.timelineReady === 'true') return;
    controller?.destroy();
    controller = new OverviewTimeline(root);
    controller.init();
  });
}

class OverviewTimeline {
  constructor(root) {
    this.root = root;
    this.page = root.closest('[data-active-month]');
    this.baseMonth = this.page?.dataset.activeMonth;
    this.bottomSentinel = root.querySelector('[data-timeline-sentinel="next"]');
    this.loadedMonths = new Set(this.baseMonth ? [this.baseMonth] : []);
    this.nextOffset = 1;
    this.loading = false;
    this.observer = null;
    this.categoryMap = null;
  }

  async init() {
    this.root.dataset.timelineReady = 'true';
    if (!this.baseMonth || !this.bottomSentinel) return;
    this.categoryMap = await getCategoryMap();
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) this.loadNextAvailableMonth().catch((error) => console.warn('Timeline:', error));
    }, { rootMargin: '500px 0px', threshold: 0.01 });
    this.observer.observe(this.bottomSentinel);
  }

  destroy() {
    this.observer?.disconnect();
  }

  async loadNextAvailableMonth() {
    if (this.loading || this.nextOffset > MAX_FUTURE_MONTHS) return;
    this.loading = true;
    this.bottomSentinel.classList.add('loading');
    try {
      while (this.nextOffset <= MAX_FUTURE_MONTHS) {
        const month = shiftMonth(this.baseMonth, this.nextOffset);
        this.nextOffset += 1;
        if (this.loadedMonths.has(month)) continue;
        this.loadedMonths.add(month);
        const bookings = await this.fetchMonth(month);
        if (!bookings.length) continue;
        this.bottomSentinel.before(this.createMonthSection(month, bookings));
        break;
      }
    } finally {
      this.loading = false;
      this.bottomSentinel.classList.remove('loading');
      if (this.nextOffset > MAX_FUTURE_MONTHS) {
        this.observer?.unobserve(this.bottomSentinel);
        this.bottomSentinel.hidden = true;
      } else if (this.bottomSentinel.getBoundingClientRect().top < window.innerHeight + 500) {
        requestAnimationFrame(() => this.loadNextAvailableMonth().catch((error) => console.warn('Timeline:', error)));
      }
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
    return section;
  }

  syncSearchVisibility() {
    const input = this.page?.querySelector('[data-booking-search]');
    const query = input?.value.trim();
    this.root.querySelectorAll('[data-timeline-month]').forEach((section) => {
      if (!query) { section.hidden = false; return; }
      section.hidden = ![...section.querySelectorAll('[data-booking-row]')].some((row) => !row.hidden);
    });
  }
}

function shiftMonth(month, delta) { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + delta); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
