import { getAll, getDatabase } from '../db/database.js';
import { APP_VERSION } from '../version.js';

const BACKUP_FORMAT_VERSION = 1;
const STORES = ['bookings', 'categories', 'budgets', 'settings'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export async function createBackup() {
  const [bookings, categories, budgets, settings] = await Promise.all(STORES.map((store) => getAll(store)));
  return {
    app: 'Moneta',
    appVersion: APP_VERSION,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: { bookings, categories, budgets, settings }
  };
}

export function downloadBackup(backup) {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `moneta-backup-${stamp}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function parseBackup(text) {
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Die ausgewählte Datei enthält kein gültiges JSON.');
  }

  if (!backup || backup.app !== 'Moneta' || backup.formatVersion !== BACKUP_FORMAT_VERSION || !backup.data) {
    throw new Error('Die Datei ist kein unterstütztes Moneta-Backup.');
  }

  for (const store of STORES) {
    if (!Array.isArray(backup.data[store])) throw new Error(`Im Backup fehlt der Datenbereich „${store}“.`);
  }

  validateBookings(backup.data.bookings);
  validateCategories(backup.data.categories);
  validateBudgets(backup.data.budgets);
  validateSettings(backup.data.settings);
  return backup;
}

export async function restoreBackup(backup) {
  const db = await getDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');

    for (const storeName of STORES) {
      const store = tx.objectStore(storeName);
      store.clear();
      for (const row of backup.data[storeName]) store.put(row);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Das Backup konnte nicht wiederhergestellt werden.'));
    tx.onabort = () => reject(tx.error ?? new Error('Die Wiederherstellung wurde abgebrochen.'));
  });
}

export function summarizeBackup(backup) {
  return {
    bookings: backup.data.bookings.length,
    categories: backup.data.categories.length,
    budgets: backup.data.budgets.length,
    settings: backup.data.settings.length
  };
}

function validateBookings(rows) {
  assertUnique(rows, 'id', 'Buchungen');
  for (const row of rows) {
    if (!isNonEmptyString(row?.id) || !['income', 'expense'].includes(row.type) || !isPositiveNumber(row.amount) ||
        !isNonEmptyString(row.categoryId) || !isNonEmptyString(row.title) || !DATE_RE.test(row.date ?? '')) {
      throw new Error('Mindestens eine Buchung im Backup ist ungültig oder unvollständig.');
    }
  }
}

function validateCategories(rows) {
  assertUnique(rows, 'id', 'Kategorien');
  for (const row of rows) {
    if (!isNonEmptyString(row?.id) || !['income', 'expense'].includes(row.type) || !isNonEmptyString(row.name)) {
      throw new Error('Mindestens eine Kategorie im Backup ist ungültig oder unvollständig.');
    }
  }
}

function validateBudgets(rows) {
  assertUnique(rows, 'id', 'Budgets');
  for (const row of rows) {
    if (!isNonEmptyString(row?.id) || !MONTH_RE.test(row.month ?? '') || !isNonEmptyString(row.categoryId) || !isPositiveNumber(row.limit)) {
      throw new Error('Mindestens ein Budget im Backup ist ungültig oder unvollständig.');
    }
  }
}

function validateSettings(rows) {
  assertUnique(rows, 'key', 'Einstellungen');
  for (const row of rows) {
    if (!isNonEmptyString(row?.key)) throw new Error('Mindestens eine Einstellung im Backup ist ungültig.');
  }
}

function assertUnique(rows, key, label) {
  const values = rows.map((row) => row?.[key]);
  if (new Set(values).size !== values.length) throw new Error(`${label} enthalten doppelte IDs und können nicht sicher importiert werden.`);
}

function isNonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0; }
function isPositiveNumber(value) { return typeof value === 'number' && Number.isFinite(value) && value > 0; }
