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
  const root = document.querySelector('#modal-root');
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
      <div class="modal-header"><h2 id="budget-modal-title">${budget ? 'Budget bearbeiten' : 'Budget hinzufügen'}</h2><button class="icon-btn" type="button" data-close>×</button></div>
      <form class="form-grid">
        <div class="field"><label>Kategorie</label><select name="categoryId" required>${categories.map(c => `<option value="${c.id}">${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Monat</label><input name="month" type="month" required value="${budget?.month ?? month}" /></div>
        <div class="field"><label>Limit</label><input name="limit" type="number" min="0.01" step="0.01" required value="${budget?.limit ?? ''}" placeholder="300,00" /></div>
        <div class="form-actions">
          ${budget ? '<button class="btn btn-ghost" style="color:var(--danger)" type="button" data-delete>Budget löschen</button>' : ''}
          <div class="form-actions-right"><button class="btn btn-secondary" type="button" data-cancel>Abbrechen</button><button class="btn btn-primary" type="submit">Speichern</button></div>
        </div>
      </form>
    </section>`;
  root.append(backdrop);
  if (budget) backdrop.querySelector('select[name="categoryId"]').value = budget.categoryId;

  return new Promise((resolve) => {
    const close = (value) => { backdrop.remove(); resolve(value); };
    backdrop.querySelector('[data-close]').addEventListener('click', () => close(null));
    backdrop.querySelector('[data-cancel]').addEventListener('click', () => close(null));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(null); });
    backdrop.querySelector('[data-delete]')?.addEventListener('click', () => close({ delete: true, id: budget.id }));
    backdrop.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      close({ id: budget?.id, month: fd.get('month'), categoryId: fd.get('categoryId'), limit: fd.get('limit') });
    });
  });
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
