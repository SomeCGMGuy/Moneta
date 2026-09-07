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
