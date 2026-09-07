import { getAll, getOne, put, remove } from '../db/database.js';

function id() {
  return crypto.randomUUID?.() ?? `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAmount(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Der Betrag muss größer als 0 sein.');
  return Math.round(parsed * 100) / 100;
}

export async function listBookings() {
  const rows = await getAll('bookings');
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function listBookingsForMonth(month) {
  return (await listBookings()).filter((row) => row.date.slice(0, 7) === month);
}

export async function getBooking(bookingId) {
  return getOne('bookings', bookingId);
}

export async function saveBooking(input) {
  if (!['income', 'expense'].includes(input.type)) throw new Error('Ungültiger Buchungstyp.');
  if (!input.categoryId) throw new Error('Bitte eine Kategorie auswählen.');
  if (!input.date) throw new Error('Bitte ein Datum auswählen.');
  if (!input.title?.trim()) throw new Error('Bitte eine Bezeichnung eingeben.');

  const existing = input.id ? await getBooking(input.id) : null;
  const booking = {
    id: input.id || id(),
    type: input.type,
    amount: normalizeAmount(input.amount),
    categoryId: input.categoryId,
    title: input.title.trim(),
    note: input.note?.trim() ?? '',
    date: input.date,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await put('bookings', booking);
  return booking;
}

export async function deleteBooking(bookingId) {
  await remove('bookings', bookingId);
}
