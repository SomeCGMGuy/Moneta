import { getAll, put, remove } from '../db/database.js';

function id() {
  return crypto.randomUUID?.() ?? `budget-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function listBudgetsForMonth(month) {
  const budgets = await getAll('budgets');
  return budgets.filter((budget) => budget.month === month).sort((a, b) => a.categoryId.localeCompare(b.categoryId));
}

export async function saveBudget({ id: budgetId, month, categoryId, limit }) {
  const amount = Number(limit);
  if (!month || !categoryId || !Number.isFinite(amount) || amount <= 0) throw new Error('Bitte ein gültiges Budget angeben.');
  const budget = { id: budgetId || id(), month, categoryId, limit: Math.round(amount * 100) / 100 };
  await put('budgets', budget);
  return budget;
}

export async function deleteBudget(budgetId) {
  await remove('budgets', budgetId);
}
