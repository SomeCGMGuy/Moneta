import { mountPushPage } from '../components/push-page.js';

const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function renderBudgets({ budgets, bookings, categoryMap, month }) {
  const spendByCategory = new Map();
  for (const booking of bookings) {
    if (booking.type !== 'expense') continue;
    spendByCategory.set(booking.categoryId, (spendByCategory.get(booking.categoryId) ?? 0) + booking.amount);
  }

  return `
    <main class="page">
      <header class="page-header"><div><h1 class="page-title">Budgets</h1><p class="page-subtitle">Grenzen setzen, ohne dass Moneta dir auf die Finger haut.</p></div></header>
      <section class="card budget-add-card">
        <div><strong>Monatsbudget anlegen</strong><div class="page-subtitle">Pro Ausgabenkategorie ein Limit definieren.</div></div>
        <button class="btn btn-primary" type="button" data-budget-add>+ Budget</button>
      </section>
      <section class="section budget-grid">
        ${budgets.length ? budgets.map((budget) => {
          const category = categoryMap.get(budget.categoryId) ?? { name: 'Unbekannt', icon: '•' };
          const spent = spendByCategory.get(budget.categoryId) ?? 0;
          const percent = budget.limit ? (spent / budget.limit) * 100 : 0;
          return `<article class="card budget-card" data-budget-id="${budget.id}">
            <div class="budget-top"><div class="budget-name">${escapeHtml(category.icon)} ${escapeHtml(category.name)}</div><button class="icon-btn" type="button" data-budget-edit="${budget.id}" aria-label="Budget bearbeiten">⋯</button></div>
            <div class="budget-value">${money.format(spent)} <span style="color:var(--text-muted);font-weight:600">von ${money.format(budget.limit)}</span></div>
            <div class="progress-track" style="margin-top:10px"><div class="progress-value ${percent > 100 ? 'over' : ''}" style="width:${Math.min(percent, 100).toFixed(1)}%"></div></div>
            <div class="budget-meta">${percent.toFixed(0)} % genutzt</div>
          </article>`;
        }).join('') : '<div class="card empty-state"><strong>Noch keine Budgets</strong>Lege für deine wichtigsten Ausgabenkategorien ein Monatslimit an.</div>'}
      </section>
    </main>`;
}

export function showBudgetForm({ budget = null, categories, month }) {
  const layer = document.createElement('div');
  layer.className = 'push-page-layer';
  layer.innerHTML = `
    <section class="push-page" role="dialog" aria-modal="true" aria-labelledby="budget-page-title">
      <header class="push-page-header">
        <button class="push-page-back" type="button" data-back aria-label="Zurück">‹</button>
        <h2 id="budget-page-title">${budget ? 'Budget bearbeiten' : 'Budget hinzufügen'}</h2>
        <span class="push-page-header-spacer" aria-hidden="true"></span>
      </header>
      <form class="push-page-form">
        <div class="push-page-content">
          <div class="field"><label for="budget-category">Kategorie</label><select id="budget-category" name="categoryId" required>${categories.map(c => `<option value="${c.id}">${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="budget-month">Monat</label><input id="budget-month" name="month" type="month" required value="${budget?.month ?? month}" /></div>
          <div class="field"><label for="budget-limit">Limit</label><input id="budget-limit" name="limit" inputmode="decimal" type="number" min="0.01" step="0.01" required value="${budget?.limit ?? ''}" placeholder="300,00" /></div>
          ${budget ? '<button class="btn btn-ghost push-page-delete" type="button" data-delete>Budget löschen</button>' : ''}
        </div>
        <footer class="push-page-actions">
          <button class="btn btn-primary push-page-save" type="submit">${budget ? 'Änderungen speichern' : 'Budget hinzufügen'}</button>
        </footer>
      </form>
    </section>`;

  if (budget) layer.querySelector('select[name="categoryId"]').value = budget.categoryId;
  const navigation = mountPushPage(layer, { historyKey: 'monetaBudgetPage' });

  layer.querySelector('[data-back]').addEventListener('click', () => navigation.close(null));
  layer.querySelector('[data-delete]')?.addEventListener('click', () => navigation.close({ delete: true, id: budget.id }));
  layer.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    navigation.close({ id: budget?.id, month: fd.get('month'), categoryId: fd.get('categoryId'), limit: fd.get('limit') });
  });

  return navigation.promise;
}

function escapeHtml(value) { return String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
