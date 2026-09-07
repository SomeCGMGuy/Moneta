const monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'long' });

export function showChoiceSheet({ title, options, selected = '', searchable = false, searchPlaceholder = 'Suchen' }) {
  return new Promise((resolve) => {
    const layer = document.createElement('div');
    layer.className = 'choice-sheet-backdrop';
    layer.innerHTML = `<section class="choice-sheet" role="dialog" aria-modal="true" aria-labelledby="choice-sheet-title">
      <div class="choice-sheet-handle" aria-hidden="true"></div>
      <header class="choice-sheet-header"><h2 id="choice-sheet-title">${escapeHtml(title)}</h2><button type="button" class="choice-sheet-close" data-choice-close aria-label="Schließen">×</button></header>
      ${searchable ? `<label class="choice-sheet-search"><span aria-hidden="true">⌕</span><input type="search" data-choice-search placeholder="${escapeAttr(searchPlaceholder)}" autocomplete="off" /></label>` : ''}
      <div class="choice-sheet-list" data-choice-list>${renderOptions(options, selected)}</div>
      <div class="choice-sheet-empty" data-choice-empty hidden>Keine Treffer.</div>
    </section>`;
    document.body.append(layer);
    const close = (value = null) => { layer.remove(); document.removeEventListener('keydown', onKey); resolve(value); };
    const onKey = (event) => { if (event.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    layer.addEventListener('click', (event) => {
      if (event.target === layer || event.target.closest('[data-choice-close]')) return close(null);
      const option = event.target.closest('[data-choice-value]');
      if (option) close(option.dataset.choiceValue);
    });
    layer.querySelector('[data-choice-search]')?.addEventListener('input', (event) => {
      const query = normalize(event.currentTarget.value);
      let visible = 0;
      layer.querySelectorAll('[data-choice-value]').forEach((row) => {
        row.hidden = Boolean(query) && !normalize(row.dataset.choiceLabel).includes(query);
        if (!row.hidden) visible += 1;
      });
      layer.querySelector('[data-choice-empty]').hidden = visible > 0;
    });
    requestAnimationFrame(() => { layer.classList.add('open'); if (searchable) layer.querySelector('[data-choice-search]')?.focus({ preventScroll: true }); else layer.querySelector('.selected')?.focus({ preventScroll: true }); });
  });
}

export function showMonthSheet({ title = 'Monat wählen', value }) {
  return new Promise((resolve) => {
    const [initialYear, initialMonth] = String(value).split('-').map(Number);
    let year = Number.isFinite(initialYear) ? initialYear : new Date().getFullYear();
    const selected = /^\d{4}-\d{2}$/.test(value ?? '') ? value : '';
    const layer = document.createElement('div');
    layer.className = 'choice-sheet-backdrop';
    layer.innerHTML = `<section class="choice-sheet month-choice-sheet" role="dialog" aria-modal="true" aria-labelledby="month-sheet-title">
      <div class="choice-sheet-handle" aria-hidden="true"></div>
      <header class="choice-sheet-header"><h2 id="month-sheet-title">${escapeHtml(title)}</h2><button type="button" class="choice-sheet-close" data-choice-close aria-label="Schließen">×</button></header>
      <div class="month-sheet-year"><button type="button" data-year-step="-1" aria-label="Vorheriges Jahr">‹</button><strong data-month-year>${year}</strong><button type="button" data-year-step="1" aria-label="Nächstes Jahr">›</button></div>
      <div class="month-sheet-grid" data-month-grid></div>
    </section>`;
    document.body.append(layer);
    const render = () => {
      layer.querySelector('[data-month-year]').textContent = String(year);
      layer.querySelector('[data-month-grid]').innerHTML = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const monthValue = `${year}-${String(month).padStart(2, '0')}`;
        return `<button type="button" class="month-sheet-option${monthValue === selected ? ' selected' : ''}" data-month-value="${monthValue}">${capitalize(monthFormat.format(new Date(year, index, 1)))}</button>`;
      }).join('');
    };
    const close = (result = null) => { layer.remove(); document.removeEventListener('keydown', onKey); resolve(result); };
    const onKey = (event) => { if (event.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    layer.addEventListener('click', (event) => {
      if (event.target === layer || event.target.closest('[data-choice-close]')) return close(null);
      const step = event.target.closest('[data-year-step]');
      if (step) { year += Number(step.dataset.yearStep); render(); return; }
      const month = event.target.closest('[data-month-value]');
      if (month) close(month.dataset.monthValue);
    });
    render();
    requestAnimationFrame(() => layer.classList.add('open'));
  });
}

function renderOptions(options, selected) {
  return options.map((option) => `<button type="button" class="choice-sheet-option${String(option.value) === String(selected) ? ' selected' : ''}" data-choice-value="${escapeAttr(option.value)}" data-choice-label="${escapeAttr(option.label)}"><span class="choice-sheet-option-icon">${escapeHtml(option.icon || '')}</span><span>${escapeHtml(option.label)}</span><span class="choice-sheet-check" aria-hidden="true">${String(option.value) === String(selected) ? '✓' : ''}</span></button>`).join('');
}
function normalize(value) { return String(value ?? '').trim().toLocaleLowerCase('de-DE'); }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
