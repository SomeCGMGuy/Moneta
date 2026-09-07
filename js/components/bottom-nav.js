const items = [
  ['overview', '⌂', 'Übersicht'],
  ['analysis', '◔', 'Analyse'],
  ['add', '+', 'Buchen'],
  ['budgets', '▤', 'Budgets'],
  ['settings', '⚙', 'Einstellungen']
];

export function renderBottomNav(activeView) {
  return `<nav class="bottom-nav" aria-label="Hauptnavigation">${items.map(([id, icon, label]) => {
    if (id === 'add') return `<button class="nav-add" type="button" data-nav="add" aria-label="Buchung hinzufügen">+</button>`;
    return `<button class="nav-item ${activeView === id ? 'active' : ''}" type="button" data-nav="${id}"><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`;
  }).join('')}</nav>`;
}
