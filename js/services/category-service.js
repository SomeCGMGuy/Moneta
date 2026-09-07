import { getAll, put } from '../db/database.js';

const DEFAULT_CATEGORIES = [
  { id: 'expense-groceries', type: 'expense', name: 'Lebensmittel', icon: '🛒' },
  { id: 'expense-mobility', type: 'expense', name: 'Mobilität', icon: '🚗' },
  { id: 'expense-housing', type: 'expense', name: 'Wohnen', icon: '🏠' },
  { id: 'expense-leisure', type: 'expense', name: 'Freizeit', icon: '🎟️' },
  { id: 'expense-shopping', type: 'expense', name: 'Shopping', icon: '🛍️' },
  { id: 'expense-health', type: 'expense', name: 'Gesundheit', icon: '🩺' },
  { id: 'expense-other', type: 'expense', name: 'Sonstiges', icon: '•' },
  { id: 'income-salary', type: 'income', name: 'Gehalt', icon: '💼' },
  { id: 'income-refund', type: 'income', name: 'Erstattung', icon: '↩️' },
  { id: 'income-sale', type: 'income', name: 'Verkauf', icon: '🏷️' },
  { id: 'income-other', type: 'income', name: 'Sonstiges', icon: '+' }
];

export async function ensureDefaultCategories() {
  const current = await getAll('categories');
  if (current.length) return current;
  await Promise.all(DEFAULT_CATEGORIES.map((category) => put('categories', category)));
  return DEFAULT_CATEGORIES;
}

export async function listCategories(type) {
  const categories = await getAll('categories');
  return categories
    .filter((category) => !type || category.type === type)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export async function getCategoryMap() {
  const categories = await getAll('categories');
  return new Map(categories.map((category) => [category.id, category]));
}
