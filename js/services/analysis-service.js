export function summarizeBookings(bookings) {
  const income = bookings.filter((b) => b.type === 'income').reduce((sum, b) => sum + b.amount, 0);
  const expense = bookings.filter((b) => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0);
  return { income, expense, balance: income - expense };
}

export function groupByCategory(bookings, type = 'expense') {
  const groups = new Map();
  for (const booking of bookings) {
    if (booking.type !== type) continue;
    groups.set(booking.categoryId, (groups.get(booking.categoryId) ?? 0) + booking.amount);
  }
  return [...groups.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getFinancialMonthPeriod(referenceMonth, startDay = getConfiguredStartDay()) {
  const [year, month] = referenceMonth.split('-').map(Number);
  const day = normalizeStartDay(startDay);
  if (day === 1) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return periodFromDates(start, end, monthLabel(start));
  }
  const start = new Date(year, month - 2, day);
  const end = new Date(year, month - 1, day - 1);
  return periodFromDates(start, end, `${monthLabel(new Date(year, month - 1, 1))} · ${formatShortDate(start)}–${formatShortDate(end)}`);
}

export function financialMonthForDate(value, startDay = getConfiguredStartDay()) {
  const date = parseDate(value);
  const day = normalizeStartDay(startDay);
  if (day > 1 && date.getDate() >= day) date.setMonth(date.getMonth() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getAnalysisPeriod(range, referenceMonth) {
  const [year, month] = referenceMonth.split('-').map(Number);

  if (range === 'previous-quarter') {
    const currentQuarterStart = Math.floor((month - 1) / 3) * 3;
    const start = new Date(year, currentQuarterStart - 3, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
    return periodFromDates(start, end, `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`);
  }

  if (range === 'year') {
    return periodFromDates(new Date(year, 0, 1), new Date(year, month, 0), `${year}`);
  }

  if (range === 'previous-year') {
    return periodFromDates(new Date(year - 1, 0, 1), new Date(year - 1, 11, 31), `${year - 1}`);
  }

  return getFinancialMonthPeriod(referenceMonth);
}

export function filterBookingsForPeriod(bookings, period) {
  return bookings.filter((booking) => booking.date >= period.start && booking.date <= period.end);
}

export function monthlyExpenseSeries(bookings, period) {
  const start = parseDate(period.start);
  const end = parseDate(period.end);
  const rows = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    rows.push({ key, label: new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(cursor).replace('.', ''), amount: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const byMonth = new Map(rows.map((row) => [row.key, row]));
  for (const booking of bookings) {
    if (booking.type !== 'expense') continue;
    const row = byMonth.get(booking.date.slice(0, 7));
    if (row) row.amount += booking.amount;
  }
  return rows;
}

function getConfiguredStartDay() {
  if (localStorage.getItem('moneta-financial-month-mode') !== 'custom') return 1;
  return normalizeStartDay(localStorage.getItem('moneta-financial-month-start'));
}

function normalizeStartDay(value) {
  const day = Number.parseInt(value, 10);
  return Number.isFinite(day) ? Math.min(28, Math.max(1, day)) : 1;
}

function periodFromDates(start, end, label) { return { start: localIsoDate(start), end: localIsoDate(end), label }; }
function localIsoDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseDate(value) { return new Date(`${value}T12:00:00`); }
function monthLabel(date) { return capitalize(new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(date)); }
function formatShortDate(date) { return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date); }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
