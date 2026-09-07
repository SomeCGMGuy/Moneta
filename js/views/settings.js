export function renderSettings() {
  return `
    <main class="page">
      <header class="page-header"><div><h1 class="page-title">Einstellungen</h1><p class="page-subtitle">Moneta bleibt lokal und überschaubar.</p></div></header>
      <section class="card settings-list">
        <div class="settings-item"><strong>Lokale Datenspeicherung</strong><p>Buchungen, Kategorien und Budgets liegen ausschließlich in IndexedDB dieses Browsers.</p></div>
        <div class="settings-item"><strong>Offline-PWA</strong><p>Der App-Shell wird über einen Service Worker gecacht. Nach dem ersten Laden funktioniert die Oberfläche auch ohne Netz.</p></div>
        <div class="settings-item"><strong>Datenmodell</strong><p>Saldo und Analysewerte werden aus Buchungen berechnet und nicht redundant gespeichert.</p></div>
        <div class="settings-item"><strong>Moneta 2.0</strong><p>Neu aufgebaut, bewusst ohne Framework und ohne Altlasten aus der bisherigen JavaScript-Struktur.</p></div>
      </section>
    </main>`;
}
