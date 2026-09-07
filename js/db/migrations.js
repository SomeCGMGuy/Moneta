export const DB_NAME = 'moneta';
export const DB_VERSION = 2;

export function upgradeDatabase(db, oldVersion, transaction) {
  if (oldVersion < 1) {
    const bookings = db.createObjectStore('bookings', { keyPath: 'id' });
    bookings.createIndex('date', 'date');
    bookings.createIndex('type', 'type');
    bookings.createIndex('categoryId', 'categoryId');

    const categories = db.createObjectStore('categories', { keyPath: 'id' });
    categories.createIndex('type', 'type');

    const budgets = db.createObjectStore('budgets', { keyPath: 'id' });
    budgets.createIndex('month', 'month');
    budgets.createIndex('categoryId', 'categoryId');

    db.createObjectStore('settings', { keyPath: 'key' });
  }

  if (oldVersion < 2) {
    const recurringRules = db.createObjectStore('recurringRules', { keyPath: 'id' });
    recurringRules.createIndex('bookingId', 'bookingId');
    recurringRules.createIndex('startDate', 'startDate');
    recurringRules.createIndex('frequency', 'frequency');
  }
}
