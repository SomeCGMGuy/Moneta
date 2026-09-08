import { listBookingsWithProjections } from './services/booking-service.js';
import { getCategoryMap } from './services/category-service.js';
import { filterBookingsForPeriod, getFinancialMonthPeriod, summarizeBookings } from './services/analysis-service.js';
import { renderBookingList } from './components/booking-list.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const RESTORE_MONTH_KEY = 'moneta-overview-timeline-month';
const RESTORE_SCROLL_KEY = 'moneta-overview-timeline-scroll';
let controller = null;

const observer = new MutationObserver(() => scheduleInit());
observer.observe(document.querySelector('#app') ?? document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', scheduleInit);
window.addEventListener('scroll', () => controller?.rememberScroll(), { passive: true });
document.addEventListener('input', (event) => {
  if (!event.target.closest('[data-booking-search]')) return;
  requestAnimationFrame(() => controller?.syncSearchVisibility());
});
document.addEventListener('click', async (event) => {
  const overviewNav = event.target.closest('[data-nav="overview"]');
  if (!overviewNav || !document.querySelector('[data-booking-timeline]')) return;
  if (location.hash.replace('#/', '') && location.hash.replace('#/', '') !== 'overview') return;
  event.preventDefault();
  event.stopPropagation();
  await controller?.jumpToMonth(currentMonth(), { behavior: 'smooth' });
}, true);

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
    this.topSentinel = root.querySelector('[data-timeline-sentinel="prev"]');
    this.bottomSentinel = root.querySelector('[data-timeline-sentinel="next"]');
    this.loaded = new Map();
    this.loading = new Set();
    this.sentinelObserver = null;
    this.monthObserver = null;
    this.scrollRaf = 0;
    this.categoryMap = null;
  }

  async init() {
    this.root.dataset.timelineReady = 'true';
    this.root.querySelectorAll('[data-timeline-month]').forEach((section) => this.loaded.set(section.dataset.timelineMonth, { section, bookings: null }));
    this.categoryMap = await getCategoryMap();
    const initialMonth = this.page?.dataset.activeMonth || currentMonth();
    const initialSection = this.root.querySelector(`[data-timeline-month="${cssEscape(initialMonth)}"]`);
    this.bindObservers();
    await this.hydrateMonth(initialMonth, initialSection);
    const restoreMonth = sessionStorage.getItem(RESTORE_MONTH_KEY);
    if (restoreMonth && restoreMonth !== initialMonth) await this.jumpToMonth(restoreMonth, { behavior: 'auto', restore: true });
    else {
      this.updateActiveMonth(initialMonth);
      const savedScroll = Number(sessionStorage.getItem(RESTORE_SCROLL_KEY));
      if (Number.isFinite(savedScroll) && savedScroll > 0 && location.hash.replace('#/', '') === 'overview') requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: 'auto' }));
    }
  }

  destroy() {
    this.sentinelObserver?.disconnect();
    this.monthObserver?.disconnect();
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
  }

  bindObservers() {
    this.sentinelObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        this.loadAdjacent(entry.target.dataset.timelineSentinel).catch((error) => console.warn('Timeline:', error));
      });
    }, { rootMargin: '650px 0px', threshold: 0.01 });
    if (this.topSentinel) this.sentinelObserver.observe(this.topSentinel);
    if (this.bottomSentinel) this.sentinelObserver.observe(this.bottomSentinel);
    this.monthObserver = new IntersectionObserver(() => this.scheduleActiveMonthSync(), { rootMargin: '-96px 0px -62% 0px', threshold: [0, 0.01, 0.4] });
    this.root.querySelectorAll('[data-timeline-month]').forEach((section) => this.monthObserver.observe(section));
    window.addEventListener('scroll', () => this.scheduleActiveMonthSync(), { passive: true });
  }

  scheduleActiveMonthSync() {
    if (this.scrollRaf) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      const sections = [...this.root.querySelectorAll('[data-timeline-month]:not([hidden])')];
      if (!sections.length) return;
      const anchor = 112;
      let active = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= anchor) active = section;
        else break;
      }
      this.updateActiveMonth(active.dataset.timelineMonth);
    });
  }

  async loadAdjacent(direction) {
    if (!['prev', 'next'].includes(direction)) return;
    const months = [...this.loaded.keys()].sort();
    if (!months.length) return;
    const edge = direction === 'prev' ? months[0] : months[months.length - 1];
    await this.ensureMonth(shiftMonth(edge, direction === 'prev' ? -1 : 1), direction);
  }

  async ensureMonth(month, direction = 'next') {
    if (this.loaded.has(month) || this.loading.has(month)) return this.loaded.get(month)?.section ?? null;
    this.loading.add(month);
    const sentinel = direction === 'prev' ? this.topSentinel : this.bottomSentinel;
    sentinel?.classList.add('loading');
    const oldHeight = document.documentElement.scrollHeight;
    const oldScroll = window.scrollY;
    try {
      const bookings = await this.fetchMonth(month);
      const section = this.createMonthSection(month, bookings);
      if (direction === 'prev') this.topSentinel.after(section); else this.bottomSentinel.before(section);
      this.loaded.set(month, { section, bookings });
      this.monthObserver?.observe(section);
      if (direction === 'prev') window.scrollTo({ top: oldScroll + (document.documentElement.scrollHeight - oldHeight), behavior: 'auto' });
      return section;
    } finally {
      this.loading.delete(month);
      sentinel?.classList.remove('loading');
    }
  }

  async hydrateMonth(month, section) {
    if (!section) return;
    const bookings = await this.fetchMonth(month);
    this.loaded.set(month, { section, bookings });
    const listHost = section.querySelector('[data-timeline-list]');
    if (listHost) listHost.innerHTML = renderBookingList(bookings, this.categoryMap);
    const count = section.querySelector('[data-timeline-month-count]');
    if (count) count.textContent = String(bookings.length);
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
    section.className = 'timeline-month';
    section.dataset.timelineMonth = month;
    section.innerHTML = `<div class="timeline-month-heading"><strong>${escapeHtml(label)}</strong><span data-timeline-month-count>${bookings.length}</span></div><div data-timeline-list>${renderBookingList(bookings, this.categoryMap)}</div>`;
    return section;
  }

  async jumpToMonth(month, { behavior = 'smooth', restore = false } = {}) {
    let section = this.loaded.get(month)?.section;
    if (!section) {
      const loadedMonths = [...this.loaded.keys()].sort();
      const direction = !loadedMonths.length || month >= loadedMonths[loadedMonths.length - 1] ? 'next' : 'prev';
      section = await this.ensureMonth(month, direction);
    }
    if (!section) return;
    this.updateActiveMonth(month);
    const top = window.scrollY + section.getBoundingClientRect().top - 94;
    window.scrollTo({ top: Math.max(0, top), behavior: restore ? 'auto' : behavior });
  }

  updateActiveMonth(month) {
    if (!month || !this.page) return;
    const data = this.loaded.get(month);
    if (!data?.bookings) return;
    if (this.page.dataset.activeMonth === month && this.page.dataset.timelineSummaryReady === month) return;
    this.page.dataset.activeMonth = month;
    this.page.dataset.timelineSummaryReady = month;
    sessionStorage.setItem(RESTORE_MONTH_KEY, month);
    const label = capitalize(monthName.format(new Date(`${month}-01T12:00:00`)));
    const labelNode = this.page.querySelector('.month-label');
    if (labelNode) labelNode.textContent = label;
    this.updateSummary(data.bookings, label);
  }

  updateSummary(bookings, label) {
    const summary = summarizeBookings(bookings);
    const projectedCount = bookings.filter((booking) => booking.isProjected).length;
    const balance = this.page.querySelector('[data-summary-balance]');
    if (balance) { balance.textContent = money.format(summary.balance); balance.classList.toggle('negative', summary.balance < 0); }
    setText(this.page, '[data-summary-period]', `für ${label}`);
    setOptionalText(this.page, '[data-projected-summary-note]', projectedCount ? `inkl. geplantem Saldo von ${money.format(summary.projectedBalance)}` : '');
    setText(this.page, '[data-metric-income]', money.format(summary.income));
    setOptionalText(this.page, '[data-metric-income-note]', summary.projectedIncome ? `davon ${money.format(summary.projectedIncome)} geplant` : '');
    setText(this.page, '[data-metric-expense]', money.format(summary.expense));
    setOptionalText(this.page, '[data-metric-expense-note]', summary.projectedExpense ? `davon ${money.format(summary.projectedExpense)} geplant` : '');
    setText(this.page, '[data-metric-bookings]', String(bookings.length));
    setOptionalText(this.page, '[data-metric-bookings-note]', projectedCount ? `${projectedCount} geplant` : '');
    setText(this.page, '[data-metric-average]', money.format(averageExpense(bookings)));
  }

  syncSearchVisibility() {
    const query = this.page?.querySelector('[data-booking-search]')?.value.trim();
    this.root.querySelectorAll('[data-timeline-month]').forEach((section) => {
      if (!query) { section.hidden = false; return; }
      section.hidden = ![...section.querySelectorAll('[data-booking-row]')].some((row) => !row.hidden);
    });
  }

  rememberScroll() {
    if (!this.page || location.hash.replace('#/', '') !== 'overview') return;
    sessionStorage.setItem(RESTORE_SCROLL_KEY, String(Math.round(window.scrollY)));
  }
}

function setText(root, selector, value) { const node = root.querySelector(selector); if (node) node.textContent = value; }
function setOptionalText(root, selector, value) { const node = root.querySelector(selector); if (!node) return; node.textContent = value; node.hidden = !value; }
function averageExpense(bookings) { const expenses = bookings.filter((booking) => booking.type === 'expense'); return expenses.length ? expenses.reduce((sum, booking) => sum + booking.amount, 0) / expenses.length : 0; }
function currentMonth() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
function shiftMonth(month, delta) { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + delta); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function cssEscape(value) { return globalThis.CSS?.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
