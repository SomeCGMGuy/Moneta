const PREVIEW_LIMIT = 5;

document.addEventListener('input', (event) => {
  const input = event.target.closest('[data-category-search]');
  if (!input) return;
  updateCategoryGroup(input.dataset.categorySearch, input.value);
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category-show-more]');
  if (!button) return;
  const type = button.dataset.categoryShowMore;
  const group = document.querySelector(`[data-category-group="${CSS.escape(type)}"]`);
  if (!group) return;
  const rows = [...group.querySelectorAll('[data-category-row]')];
  const expanded = button.dataset.expanded === 'true';
  rows.forEach((row, index) => { row.hidden = expanded && index >= PREVIEW_LIMIT; });
  button.dataset.expanded = expanded ? 'false' : 'true';
  button.textContent = expanded ? `Alle ${rows.length} anzeigen` : 'Weniger anzeigen';
});

function updateCategoryGroup(type, value) {
  const group = document.querySelector(`[data-category-group="${CSS.escape(type)}"]`);
  if (!group) return;
  const query = normalize(value);
  const rows = [...group.querySelectorAll('[data-category-row]')];
  const showMore = group.querySelector('[data-category-show-more]');
  let visible = 0;
  rows.forEach((row, index) => {
    const matches = !query || normalize(row.dataset.categoryName).includes(query);
    const expanded = showMore?.dataset.expanded === 'true';
    const inPreview = expanded || index < PREVIEW_LIMIT;
    row.hidden = query ? !matches : !inPreview;
    if (!row.hidden) visible += 1;
  });
  if (showMore) showMore.hidden = Boolean(query);
  const empty = group.querySelector('[data-category-search-empty]');
  if (empty) empty.hidden = visible > 0;
}

function normalize(value) {
  return String(value ?? '').trim().toLocaleLowerCase('de-DE');
}
