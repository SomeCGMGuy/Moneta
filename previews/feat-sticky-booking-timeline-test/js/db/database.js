import { DB_NAME, DB_VERSION, upgradeDatabase } from './migrations.js';

let dbPromise;

export function getDatabase() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => upgradeDatabase(request.result, event.oldVersion, request.transaction);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => console.warn('Moneta IndexedDB upgrade blocked.');
    });
  }
  return dbPromise;
}

export async function withStore(storeName, mode, action) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try {
      result = action(store, tx);
    } catch (error) {
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export async function getAll(storeName) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOne(storeName, key) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(storeName, value) {
  return withStore(storeName, 'readwrite', (store) => store.put(value));
}

export async function remove(storeName, key) {
  return withStore(storeName, 'readwrite', (store) => store.delete(key));
}

export async function clearStore(storeName) {
  return withStore(storeName, 'readwrite', (store) => store.clear());
}
