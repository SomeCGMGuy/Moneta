import { getAll, getOne, put, remove } from '../db/database.js';
import { deleteRecurringRule, getRecurringRule, listRecurringRules, projectRecurringBookings, saveRecurringRule } from './recurring-service.js';

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
  return rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function listBookingsWithProjections({ from, to }) {
  const [bookings, rules] = await Promise.all([listBookings(), listRecurringRules()]);
  const projected = projectRecurringBookings(rules, from, to);
  return [...bookings, ...projected].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function listBookingsForMonth(month) {
  return (await listBookings()).filter((row) => row.date.slice(0, 7) === month);
}

export async function getBooking(bookingId) {
  const booking = await getOne('bookings', bookingId);
  if (!booking) return null;
  const rule = booking.recurrenceRuleId ? await getRecurringRule(booking.recurrenceRuleId) : null;
  return {
    ...booking,
    recurrenceFrequency: rule?.frequency ?? 'none',
    recurrenceEndDate: rule?.endDate ?? ''
  };
}

export async function saveBooking(input) {
  if (!['income', 'expense'].includes(input.type)) throw new Error('Ungültiger Buchungstyp.');
  if (!input.categoryId) throw new Error('Bitte eine Kategorie auswählen.');
  if (!input.date) throw new Error('Bitte ein Datum auswählen.');
  if (!input.title?.trim()) throw new Error('Bitte eine Bezeichnung eingeben.');

  const existing = input.id ? await getOne('bookings', input.id) : null;
  const bookingId = input.id || id();
  const amount = normalizeAmount(input.amount);
  const recurrenceFrequency = ['weekly', 'monthly', 'yearly'].includes(input.recurrenceFrequency) ? input.recurrenceFrequency : 'none';
  let recurrenceRuleId = existing?.recurrenceRuleId ?? null;

  if (recurrenceFrequency !== 'none') {
    const rule = await saveRecurringRule({
      id: recurrenceRuleId,
      bookingId,
      frequency: recurrenceFrequency,
      startDate: input.date,
      endDate: input.recurrenceEndDate || '',
      type: input.type,
      amount,
      categoryId: input.categoryId,
      title: input.title.trim(),
      note: input.note?.trim() ?? ''
    });
    recurrenceRuleId = rule.id;
  } else if (recurrenceRuleId) {
    await deleteRecurringRule(recurrenceRuleId);
    recurrenceRuleId = null;
  }

  const booking = {
    id: bookingId,
    type: input.type,
    amount,
    categoryId: input.categoryId,
    title: input.title.trim(),
    note: input.note?.trim() ?? '',
    date: input.date,
    recurrenceRuleId,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await put('bookings', booking);
  return booking;
}

export async function deleteBooking(bookingId) {
  const booking = await getOne('bookings', bookingId);
  if (booking?.recurrenceRuleId) await deleteRecurringRule(booking.recurrenceRuleId);
  await remove('bookings', bookingId);
}
