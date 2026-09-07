import { saveBooking } from './services/booking-service.js';

const app = document.querySelector('#app');

app?.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-quick-capture]');
  if (!form) return;
  event.preventDefault();

  const input = form.querySelector('[name="quickText"]');
  const category = form.querySelector('[name="quickCategory"]');
  const submit = form.querySelector('button[type="submit"]');

  try {
    const parsed = parseQuickText(input.value);
    if (!category.value) throw new Error('Bitte eine Kategorie auswählen.');
    submit.disabled = true;
    await saveBooking({
      type: 'expense',
      amount: parsed.amount,
      categoryId: category.value,
      title: parsed.title,
      note: '',
      date: today()
    });
    location.reload();
  } catch (error) {
    alert(error.message ?? 'Die Schnellerfassung konnte nicht gespeichert werden.');
    submit.disabled = false;
  }
});

function parseQuickText(value) {
  const text = value.trim();
  if (!text) throw new Error('Gib eine Bezeichnung und einen Betrag ein, z. B. „REWE 12,40“.');

  const matches = [...text.matchAll(/(?:€\s*)?(\d{1,7}(?:[.,]\d{1,2})?)(?:\s*€)?/g)];
  const match = matches.at(-1);
  if (!match) throw new Error('Ich konnte keinen Betrag erkennen, z. B. „REWE 12,40“.');

  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Der Betrag muss größer als 0 sein.');

  const title = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:\-–—]+|[\s,;:\-–—]+$/g, '')
    .trim();
  if (!title) throw new Error('Bitte ergänze eine Bezeichnung, z. B. „REWE 12,40“.');

  return { title, amount };
}

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
