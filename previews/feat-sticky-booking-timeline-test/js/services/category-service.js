import { getAll, getOne, put, remove } from '../db/database.js';

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

function id() {
  return crypto.randomUUID?.() ?? `category-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

export async function getCategory(categoryId) {
  return getOne('categories', categoryId);
}

export async function getCategoryMap() {
  const categories = await getAll('categories');
  return new Map(categories.map((category) => [category.id, category]));
}

export async function saveCategory(input) {
  if (!['income', 'expense'].includes(input.type)) throw new Error('Ungültiger Kategorietyp.');
  const name = input.name?.trim();
  const icon = input.icon?.trim() || '•';
  if (!name) throw new Error('Bitte einen Kategorienamen eingeben.');
  if (name.length > 50) throw new Error('Der Kategoriename ist zu lang.');

  const categories = await getAll('categories');
  const duplicate = categories.find((category) =>
    category.type === input.type &&
    category.id !== input.id &&
    category.name.localeCompare(name, 'de', { sensitivity: 'base' }) === 0
  );
  if (duplicate) throw new Error('Eine Kategorie mit diesem Namen existiert bereits.');

  const category = {
    id: input.id || id(),
    type: input.type,
    name,
    icon: icon.slice(0, 16)
  };
  await put('categories', category);
  return category;
}

export async function getCategoryUsage(categoryId) {
  const [bookings, budgets] = await Promise.all([getAll('bookings'), getAll('budgets')]);
  return {
    bookings: bookings.filter((booking) => booking.categoryId === categoryId).length,
    budgets: budgets.filter((budget) => budget.categoryId === categoryId).length
  };
}

export async function deleteCategory(categoryId) {
  const usage = await getCategoryUsage(categoryId);
  if (usage.bookings || usage.budgets) {
    const parts = [];
    if (usage.bookings) parts.push(`${usage.bookings} Buchung${usage.bookings === 1 ? '' : 'en'}`);
    if (usage.budgets) parts.push(`${usage.budgets} Budget${usage.budgets === 1 ? '' : 's'}`);
    throw new Error(`Die Kategorie wird noch von ${parts.join(' und ')} verwendet und kann deshalb nicht gelöscht werden.`);
  }
  await remove('categories', categoryId);
}
