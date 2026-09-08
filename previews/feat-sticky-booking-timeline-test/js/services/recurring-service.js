import { getAll, getOne, put, remove } from '../db/database.js';

const FREQUENCIES = new Set(['weekly', 'monthly', 'yearly']);

function id() {
  return crypto.randomUUID?.() ?? `recurring-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function listRecurringRules() {
  return getAll('recurringRules');
}

export async function getRecurringRule(ruleId) {
  return ruleId ? getOne('recurringRules', ruleId) : null;
}

export async function saveRecurringRule(input) {
  if (!FREQUENCIES.has(input.frequency)) throw new Error('Ungültige Wiederholung.');
  const existing = input.id ? await getRecurringRule(input.id) : null;
  const rule = {
    id: input.id || id(),
    bookingId: input.bookingId,
    frequency: input.frequency,
    startDate: input.startDate,
    endDate: input.endDate || '',
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    title: input.title,
    note: input.note ?? '',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await put('recurringRules', rule);
  return rule;
}

export async function deleteRecurringRule(ruleId) {
  if (ruleId) await remove('recurringRules', ruleId);
}

export function projectRecurringBookings(rules, from, to) {
  const projected = [];
  for (const rule of rules) {
    if (!FREQUENCIES.has(rule.frequency) || !rule.startDate) continue;
    for (let occurrence = 1; occurrence <= 10000; occurrence += 1) {
      const date = occurrenceDate(rule.startDate, rule.frequency, occurrence);
      if (rule.endDate && date > rule.endDate) break;
      if (date > to) break;
      if (date < from) continue;
      projected.push({
        id: `projection:${rule.id}:${date}`,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        title: rule.title,
        note: rule.note ?? '',
        date,
        recurringRuleId: rule.id,
        isProjected: true,
        projectionSource: 'recurring'
      });
    }
  }
  return projected.sort((a, b) => b.date.localeCompare(a.date));
}

function occurrenceDate(startDate, frequency, occurrence) {
  const [year, month, day] = startDate.split('-').map(Number);
  if (frequency === 'weekly') {
    const date = new Date(year, month - 1, day + (occurrence * 7), 12);
    return localIsoDate(date);
  }
  if (frequency === 'yearly') {
    return clippedDate(year + occurrence, month, day);
  }
  const monthIndex = (month - 1) + occurrence;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = (monthIndex % 12) + 1;
  return clippedDate(targetYear, targetMonth, day);
}

function clippedDate(year, month, day) {
  const lastDay = new Date(year, month, 0, 12).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function localIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
