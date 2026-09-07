import {
  ensureDefaultCategories,
  getCategoryMap,
  listCategories,
  getCategory,
  saveCategory,
  deleteCategory,
  getCategoryUsage
} from './services/category-service.js';
import { listBookings, saveBooking, deleteBooking, getBooking } from './services/booking-service.js';
import { listBudgetsForMonth, saveBudget, deleteBudget } from './services/budget-service.js';
import { getSetting, setSetting } from './services/settings-service.js';
import { createBackup, downloadBackup, parseBackup, restoreBackup, summarizeBackup } from './services/backup-service.js';
import { renderOverview } from './views/overview.js';
import { renderAnalysis } from './views/analysis.js';
import { renderBudgets, showBudgetForm } from './views/budgets.js';
import { renderSettings } from './views/settings.js';
import { renderBottomNav } from './components/bottom-nav.js';
import { showBookingForm } from './components/booking-form.js';
import { showCategoryForm } from './components/category-form.js';
import { showConfirmDialog } from './components/confirm-dialog.js';

const app = document.querySelector('#app');
const PULL_REFRESH_THRESHOLD = 72;
const PULL_REFRESH_MAX = 112;
const state = {
  view: location.hash.replace('#/', '') || 'overview',
  month: currentMonth(),
  bookings: [],
  allBookings: [],
  budgets: [],
  categoryMap: new Map(),
  analysisRange: 'month',
  analysisCategoryId: null,
  theme: 'light'
};

let viewRoot;
let bottomNavRoot;
let pullRefreshRoot;
let pullStartY = null;
let pullStartX = null;
let pullDistance = 0;
let pullRefreshBusy = false;

await bootstrap();

async function bootstrap() {
  await ensureDefaultCategories();
  state.theme = normalizeTheme(await getSetting('theme', localStorage.getItem('moneta-theme') || 'light'));
  applyTheme(state.theme, false);
  await reloadData();
  mountShell();
  bindGlobalEvents();
  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const hadController = Boolean(navigator.serviceWorker.controller);
    if (hadController) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (sessionStorage.getItem('moneta-sw-reloaded') === '1') return;
        sessionStorage.setItem('moneta-sw-reloaded', '1');
        location.reload();
      }, { once: true });
    }

    navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => console.warn('Service Worker:', error));
  }
}

function mountShell() {
  app.innerHTML = `
    <div id="pull-refresh" class="pull-refresh" role="status" aria-live="polite" aria-atomic="true">
      <span class="pull-refresh-icon" aria-hidden="true">↓</span>
      <span data-pull-refresh-label>Zum Aktualisieren ziehen</span>
    </div>
    <div id="view-root"></div>
    <div id="bottom-nav-root"></div>`;
  pullRefreshRoot = app.querySelector('#pull-refresh');
  viewRoot = app.querySelector('#view-root');
  bottomNavRoot = app.querySelector('#bottom-nav-root');
  bottomNavRoot.innerHTML = renderBottomNav(state.view);
}

async function reloadData() {
  const [allBookings, budgets, categoryMap] = await Promise.all([
    listBookings(),
    listBudgetsForMonth(state.month),
    getCategoryMap()
  ]);
  state.allBookings = allBookings;
  state.bookings = allBookings.filter((row) => row.date.slice(0, 7) === state.month);
  state.budgets = budgets;
  state.categoryMap = categoryMap;
}

function render() {
  const views = {
    overview: () => renderOverview(state),
    analysis: () => renderAnalysis(state),
    budgets: () => renderBudgets(state),
    settings: () => renderSettings(state)
  };
  viewRoot.innerHTML = (views[state.view] ?? views.overview)();
  updateBottomNav();
}

function updateBottomNav() {
  bottomNavRoot.querySelectorAll('[data-nav]').forEach((button) => {
    const target = button.dataset.nav;
    if (target === 'add') return;
    button.classList.toggle('active', target === state.view);
    if (target === state.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function bindGlobalEvents() {
  app.addEventListener('click', async (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) {
      const target = nav.dataset.nav;
      if (target === 'add') {
        await openBookingForm();
      } else if (target !== state.view) {
        state.view = target;
        location.hash = `#/${target}`;
        render();
      }
      return;
    }

    const monthButton = event.target.closest('[data-month]');
    if (monthButton) {
      state.month = shiftMonth(state.month, monthButton.dataset.month === 'next' ? 1 : -1);
      state.analysisCategoryId = null;
      await reloadData();
      render();
      return;
    }

    const analysisRange = event.target.closest('[data-analysis-range]');
    if (analysisRange) {
      state.analysisRange = analysisRange.dataset.analysisRange;
      state.analysisCategoryId = null;
      render();
      return;
    }

    const analysisCategory = event.target.closest('[data-analysis-category]');
    if (analysisCategory) {
      const categoryId = analysisCategory.dataset.analysisCategory || null;
      state.analysisCategoryId = state.analysisCategoryId === categoryId ? null : categoryId;
      render();
      return;
    }

    const themeChoice = event.target.closest('[data-theme-choice]');
    if (themeChoice) {
      const theme = normalizeTheme(themeChoice.dataset.themeChoice);
      state.theme = theme;
      await applyTheme(theme, true);
      render();
      return;
    }

    if (event.target.closest('[data-backup-export]')) {
      try {
        downloadBackup(await createBackup());
      } catch (error) {
        alert(error.message ?? 'Das Backup konnte nicht erstellt werden.');
      }
      return;
    }

    if (event.target.closest('[data-backup-import]')) {
      app.querySelector('[data-backup-file]')?.click();
      return;
    }

    const bookingRow = event.target.closest('[data-booking-id]');
    if (bookingRow) {
      const booking = await getBooking(bookingRow.dataset.bookingId);
      if (booking) await openBookingForm(booking);
      return;
    }

    if (event.target.closest('[data-budget-add]')) {
      await openBudgetForm();
      return;
    }

    const budgetEdit = event.target.closest('[data-budget-edit]');
    if (budgetEdit) {
      const budget = state.budgets.find((item) => item.id === budgetEdit.dataset.budgetEdit);
      if (budget) await openBudgetForm(budget);
      return;
    }

    const categoryAdd = event.target.closest('[data-category-add]');
    if (categoryAdd) {
      await openCategoryForm(null, categoryAdd.dataset.categoryAdd);
      return;
    }

    const categoryEdit = event.target.closest('[data-category-edit]');
    if (categoryEdit) {
      const category = await getCategory(categoryEdit.dataset.categoryEdit);
      if (category) await openCategoryForm(category, category.type);
    }
  });

  app.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-backup-file]');
    if (!input?.files?.[0]) return;
    const file = input.files[0];
    input.value = '';

    try {
      const backup = parseBackup(await file.text());
      const counts = summarizeBackup(backup);
      const confirmed = await showConfirmDialog({
        title: 'Backup wiederherstellen?',
        message: `Das Backup enthält ${counts.bookings} Buchungen, ${counts.categories} Kategorien und ${counts.budgets} Budgets. Deine aktuellen Moneta-Daten werden vollständig ersetzt.`,
        confirmLabel: 'Daten ersetzen',
        danger: true
      });
      if (!confirmed) return;

      await restoreBackup(backup);
      await ensureDefaultCategories();
      state.theme = normalizeTheme(await getSetting('theme', 'light'));
      applyTheme(state.theme, false);
      state.analysisCategoryId = null;
      await reloadData();
      render();
      alert('Das Moneta-Backup wurde vollständig wiederhergestellt.');
    } catch (error) {
      alert(error.message ?? 'Das Backup konnte nicht importiert werden.');
    }
  });

  window.addEventListener('hashchange', () => {
    state.view = location.hash.replace('#/', '') || 'overview';
    render();
  });

  bindPullToRefresh();
}

function bindPullToRefresh() {
  if (!pullRefreshRoot) return;

  app.addEventListener('touchstart', (event) => {
    if (pullRefreshBusy || event.touches.length !== 1 || window.scrollY > 0) return;
    if (document.querySelector('#modal-root')?.childElementCount) return;
    if (event.target.closest('.bottom-nav, button, input, select, textarea, [contenteditable="true"]')) return;

    pullStartY = event.touches[0].clientY;
    pullStartX = event.touches[0].clientX;
    pullDistance = 0;
  }, { passive: true });

  app.addEventListener('touchmove', (event) => {
    if (pullStartY === null || pullRefreshBusy || event.touches.length !== 1) return;

    const deltaY = event.touches[0].clientY - pullStartY;
    const deltaX = event.touches[0].clientX - pullStartX;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      resetPullGesture();
      return;
    }

    if (deltaY <= 0 || window.scrollY > 0) return;

    event.preventDefault();
    pullDistance = Math.min(PULL_REFRESH_MAX, deltaY * 0.58);
    updatePullIndicator(pullDistance);
  }, { passive: false });

  app.addEventListener('touchend', async () => {
    if (pullStartY === null || pullRefreshBusy) return;
    const shouldRefresh = pullDistance >= PULL_REFRESH_THRESHOLD;
    pullStartY = null;
    pullStartX = null;

    if (!shouldRefresh) {
      resetPullIndicator();
      return;
    }

    await refreshCurrentView();
  }, { passive: true });

  app.addEventListener('touchcancel', () => {
    if (!pullRefreshBusy) resetPullGesture();
  }, { passive: true });
}

function updatePullIndicator(distance) {
  const ready = distance >= PULL_REFRESH_THRESHOLD;
  pullRefreshRoot.style.setProperty('--pull-distance', `${Math.round(distance)}px`);
  pullRefreshRoot.classList.add('pulling');
  pullRefreshRoot.classList.toggle('ready', ready);
  pullRefreshRoot.querySelector('[data-pull-refresh-label]').textContent = ready
    ? 'Loslassen zum Aktualisieren'
    : 'Zum Aktualisieren ziehen';
}

function resetPullGesture() {
  pullStartY = null;
  pullStartX = null;
  pullDistance = 0;
  resetPullIndicator();
}

function resetPullIndicator() {
  if (!pullRefreshRoot) return;
  pullDistance = 0;
  pullRefreshRoot.style.removeProperty('--pull-distance');
  pullRefreshRoot.classList.remove('pulling', 'ready', 'refreshing', 'complete', 'error');
  pullRefreshRoot.querySelector('[data-pull-refresh-label]').textContent = 'Zum Aktualisieren ziehen';
}

async function refreshCurrentView() {
  pullRefreshBusy = true;
  pullRefreshRoot.classList.remove('pulling', 'ready');
  pullRefreshRoot.classList.add('refreshing');
  pullRefreshRoot.style.setProperty('--pull-distance', `${PULL_REFRESH_THRESHOLD + 8}px`);
  pullRefreshRoot.querySelector('[data-pull-refresh-label]').textContent = 'Aktualisiere …';

  try {
    await reloadData();
    render();
    pullRefreshRoot.classList.remove('refreshing');
    pullRefreshRoot.classList.add('complete');
    pullRefreshRoot.querySelector('[data-pull-refresh-label]').textContent = 'Aktualisiert';
    await delay(420);
  } catch (error) {
    console.warn('Pull-to-refresh:', error);
    pullRefreshRoot.classList.remove('refreshing');
    pullRefreshRoot.classList.add('error');
    pullRefreshRoot.querySelector('[data-pull-refresh-label]').textContent = 'Aktualisierung fehlgeschlagen';
    await delay(900);
  } finally {
    pullRefreshBusy = false;
    resetPullGesture();
  }
}

async function openBookingForm(booking = null) {
  const result = await showBookingForm({ booking });
  if (!result) return;

  if (result.deleteRequested) {
    const row = result.booking;
    const confirmed = await showConfirmDialog({
      title: 'Buchung löschen?',
      message: `„${row.title}“ wird dauerhaft aus Moneta entfernt.`,
      confirmLabel: 'Endgültig löschen',
      danger: true
    });
    if (!confirmed) return;
    await deleteBooking(row.id);
    await reloadData();
    render();
    return;
  }

  try {
    await saveBooking(result);
    await reloadData();
    render();
  } catch (error) {
    alert(error.message ?? 'Die Buchung konnte nicht gespeichert werden.');
  }
}

async function openBudgetForm(budget = null) {
  const categories = await listCategories('expense');
  if (!categories.length) {
    alert('Lege zuerst mindestens eine Ausgabenkategorie in den Einstellungen an.');
    return;
  }

  const result = await showBudgetForm({ budget, categories, month: state.month });
  if (!result) return;

  if (result.delete) {
    const confirmed = await showConfirmDialog({
      title: 'Budget löschen?',
      message: 'Das Budget wird entfernt. Deine Buchungen bleiben unverändert erhalten.',
      confirmLabel: 'Budget löschen',
      danger: true
    });
    if (!confirmed) return;
    await deleteBudget(result.id);
  } else {
    const duplicate = state.budgets.find((item) => item.categoryId === result.categoryId && item.month === result.month && item.id !== result.id);
    if (duplicate) {
      alert('Für diese Kategorie existiert in diesem Monat bereits ein Budget.');
      return;
    }
    await saveBudget(result);
  }
  await reloadData();
  render();
}

async function openCategoryForm(category = null, initialType = 'expense') {
  const result = await showCategoryForm({ category, initialType });
  if (!result) return;

  if (result.deleteRequested) {
    const row = result.category;
    const usage = await getCategoryUsage(row.id);
    if (usage.bookings || usage.budgets) {
      const parts = [];
      if (usage.bookings) parts.push(`${usage.bookings} Buchung${usage.bookings === 1 ? '' : 'en'}`);
      if (usage.budgets) parts.push(`${usage.budgets} Budget${usage.budgets === 1 ? '' : 's'}`);
      alert(`„${row.name}“ kann nicht gelöscht werden, weil die Kategorie noch von ${parts.join(' und ')} verwendet wird.`);
      return;
    }

    const confirmed = await showConfirmDialog({
      title: 'Kategorie löschen?',
      message: `„${row.name}“ wird dauerhaft aus Moneta entfernt.`,
      confirmLabel: 'Kategorie löschen',
      danger: true
    });
    if (!confirmed) return;

    try {
      await deleteCategory(row.id);
    } catch (error) {
      alert(error.message ?? 'Die Kategorie konnte nicht gelöscht werden.');
      return;
    }
  } else {
    try {
      await saveCategory(result);
    } catch (error) {
      alert(error.message ?? 'Die Kategorie konnte nicht gespeichert werden.');
      return;
    }
  }

  await reloadData();
  render();
}

async function applyTheme(theme, persist) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem('moneta-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101b17' : '#214b3b');
  if (persist) await setSetting('theme', theme);
}

function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
