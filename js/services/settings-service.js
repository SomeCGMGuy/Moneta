import { getOne, put } from '../db/database.js';

export async function getSetting(key, fallback = null) {
  const row = await getOne('settings', key);
  return row?.value ?? fallback;
}

export async function setSetting(key, value) {
  const row = { key, value, updatedAt: new Date().toISOString() };
  await put('settings', row);
  return value;
}
