const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const fullDate = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function renderBookingList(bookings, categoryMap, { timeline = false, pageSize = 3 } = {}) {
  if (!bookings.length) return `<div class="card empty-state"><strong>Noch keine Buchungen</strong>Über das Plus kannst du deine erste Einnahme oder Ausgabe anlegen.</div>`;
  if (!timeline) return renderDays(bookings, categoryMap);

  const months = groupByMonth(bookings);
  const pages = chunk(months, Math.max(1, pageSize));
  const firstPage = pages.shift() ?? [];
  return `<div class="booking-timeline" data-booking-timeline>
    ${renderMonths(firstPage, categoryMap)}
    ${pages.map((page) => `<template data-booking-timeline-page>${renderMonths(page, categoryMap)}</template>`).join('')}
    ${pages.length ? `<div class="booking-timeline-loader" data-booking-timeline-sentinel aria-label="Ältere Buchungen werden geladen"><span class="timeline-skeleton-line"></span><span class="timeline-skeleton-line short"></span><span class="timeline-skeleton-line"></span></div>` : ''}
  </div>`;
}

function renderMonths(months, categoryMap) {
  return months.map(({ month, bookings: rows }) => `
    <section class="booking-month" data-booking-month="${escapeAttr(month)}">
      <div class="booking-month-heading"><span>${escapeHtml(monthLabel(month))}</span></div>
      ${renderDays(rows, categoryMap)}
    </section>`).join('');
}

function renderDays(bookings, categoryMap) {
  const groups = groupByDate(bookings);
  return `<div class="booking-groups">${groups.map(({ date, bookings: rows }) => `
    <section class="booking-day" data-booking-day>
      <div class="booking-day-heading">${escapeHtml(dayLabel(date))}</div>
      <div class="card booking-list">${rows.map((booking) => renderRow(booking, categoryMap)).join('')}</div>
    </section>`).join('')}</div>`;
}

function renderRow(booking, categoryMap) {
  const category = categoryMap.get(booking.categoryId) ?? { name: 'Unbekannt', icon: '•' };
  const sign = booking.type === 'expense' ? '−' : '+';
  const projectedLabel = booking.isProjected ? ' · Geplant' : '';
  const searchText = [booking.title, booking.note, category.name, booking.amount, money.format(booking.amount), booking.date, booking.type === 'expense' ? 'Ausgabe' : 'Einnahme', booking.isProjected ? 'geplant wiederkehrend prognose' : ''].filter(Boolean).join(' ');
  const tag = booking.isProjected ? 'div' : 'button';
  const interaction = booking.isProjected ? 'aria-label="Geplante wiederkehrende Buchung"' : `type="button" data-booking-id="${escapeAttr(booking.id)}"`;
  return `<${tag} class="booking-row${booking.isProjected ? ' booking-row-projected' : ''}" ${interaction} data-booking-row data-booking-search="${escapeAttr(searchText)}">
    <span class="booking-icon" aria-hidden="true">${escapeHtml(category.icon ?? '•')}</span>
    <span class="booking-copy"><span class="booking-title">${escapeHtml(booking.title)}</span><span class="booking-meta">${escapeHtml(category.name)}${projectedLabel}</span></span>
    <span class="booking-amount ${booking.type}">${sign}${money.format(booking.amount)}</span>
  </${tag}>`;
}

function groupByDate(bookings) {
  const groups = new Map();
  bookings.forEach((booking) => {
    if (!groups.has(booking.date)) groups.set(booking.date, []);
    groups.get(booking.date).push(booking);
  });
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, rows]) => ({ date, bookings: rows }));
}

function groupByMonth(bookings) {
  const groups = new Map();
  bookings.forEach((booking) => {
    const month = String(booking.date).slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(booking);
  });
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([month, rows]) => ({ month, bookings: rows }));
}

function chunk(items, size) {
  const pages = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size));
  return pages;
}
function monthLabel(month) {
  const value = new Date(`${month}-01T12:00:00`);
  return monthName.format(value).replace(/^./, (c) => c.toUpperCase());
}
function dayLabel(iso) {
  const value = new Date(`${iso}T12:00:00`);
  const today = startOfDay(new Date());
  const target = startOfDay(value);
  const diff = Math.round((today - target) / 86400000);
  const formatted = fullDate.format(value).replace(/^./, (c) => c.toUpperCase());
  if (diff === 0) return `Heute, ${formatted.replace(/^\S+\s/, '')}`;
  if (diff === 1) return `Gestern, ${formatted.replace(/^\S+\s/, '')}`;
  return formatted;
}
function startOfDay(value) { return new Date(value.getFullYear(), value.getMonth(), value.getDate()); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
