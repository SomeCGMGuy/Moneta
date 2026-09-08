const items = [
  ['overview', '<svg viewBox="0 0 24 24"><path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"/></svg>', 'Übersicht'],
  ['analysis', '<svg viewBox="0 0 24 24"><rect x="4" y="13" width="3.5" height="7" rx="1"/><rect x="10.25" y="9" width="3.5" height="11" rx="1"/><rect x="16.5" y="4" width="3.5" height="16" rx="1"/></svg>', 'Analyse'],
  ['add', '+', 'Buchen'],
  ['budgets', '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>', 'Budgets'],
  ['settings', '<svg viewBox="0 0 24 24"><path d="M12 8.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Zm8.2 5.1v-2.6l-2.4-.8a7 7 0 0 0-.6-1.5l1.1-2.2-1.9-1.9-2.2 1.1a7 7 0 0 0-1.5-.6L11.9 2H9.3l-.8 2.4a7 7 0 0 0-1.5.6L4.8 3.9 2.9 5.8 4 8a7 7 0 0 0-.6 1.5L1 10.3v2.6l2.4.8a7 7 0 0 0 .6 1.5l-1.1 2.2 1.9 1.9L7 18.2a7 7 0 0 0 1.5.6l.8 2.4h2.6l.8-2.4a7 7 0 0 0 1.5-.6l2.2 1.1 1.9-1.9-1.1-2.2a7 7 0 0 0 .6-1.5z"/></svg>', 'Einstellungen']
];

export function renderBottomNav(activeView) {
  return `<nav class="bottom-nav" aria-label="Hauptnavigation">${items.map(([id, icon, label]) => {
    if (id === 'add') return `<button class="nav-add" type="button" data-nav="add" aria-label="Buchung hinzufügen">+</button>`;
    return `<button class="nav-item ${activeView === id ? 'active' : ''}" type="button" data-nav="${id}"><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`;
  }).join('')}</nav>`;
}
