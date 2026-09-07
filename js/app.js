import {
  ensureDefaultCategories,
  getCategoryMap,
  listCategories,
  getCategory,
  saveCategory,
  deleteCategory,
  getCategoryUsage
} from './services/category-service.js';
import { listBookingsForMonth, saveBooking, deleteBooking, getBooking } from './services/booking-service.js';
import { listBudgetsForMonth, saveBudget, deleteBudget } from './services/budget-service.js';
import { renderOverview } from './views/overview.js';
import { renderAnalysis } from './views/analysis.js';
import { renderBudgets, showBudgetForm } from './views/budgets.js';
import { renderSettings } from './views/settings.js';
import { renderBottomNav } from './components/bottom-nav.js';
import { showBookingForm } from './components/booking-form.js';
import { showCategoryForm } from './components/category-form.js';
import { showConfirmDialog } from './components/confirm-dialog.js';

const app = document.querySelector('#app');
const state = {
  view: location.hash.replace('#/', '') || 'overview',
  month: currentMonth(),
  bookings: [],
  budgets: [],
  categoryMap: new Map()
};

let viewRoot;
let bottomNavRoot;

await bootstrap();

async function bootstrap() {
  await ensureDefaultCategories();
  await reloadData();
  mountShell();
  bindGlobalEvents();
  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Service Worker:', error));
  }
}

function mountShell() {
  app.innerHTML = '<div id="view-root"></div><div id="bottom-nav-root"></div>';
  viewRoot = app.querySelector('#view-root');
  bottomNavRoot = app.querySelector('#bottom-nav-root');
  bottomNavRoot.innerHTML = renderBottomNav(state.view);
}

async function reloadData() {
  [state.bookings, state.budgets, state.categoryMap] = await Promise.all([
    listBookingsForMonth(state.month),
    listBudgetsForMonth(state.month),
    getCategoryMap()
  ]);
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
      await reloadData();
      render();
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

  window.addEventListener('hashchange', () => {
    state.view = location.hash.replace('#/', '') || 'overview';
    render();
  });
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

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
