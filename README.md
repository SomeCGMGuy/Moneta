# Moneta 2.0.1

Lokale PWA für **Finanzanalyse und Budgetplanung**. Neu aufgebaut als bewusst schlanke Plain-JavaScript-Anwendung mit IndexedDB.

## Enthalten

- Übersicht mit Einnahmen, Ausgaben, Saldo und Monatswechsel
- Buchungen anlegen und bearbeiten
- Einnahmen- und Ausgabenkategorien getrennt und direkt in den Einstellungen verwaltbar
- Buchungen nur nach zusätzlicher Bestätigung löschen
- Kategorieanalyse der Ausgaben mit Kreis-/Donutdiagramm
- Monatsbudgets pro Ausgabenkategorie
- IndexedDB als lokale Datenbank
- PWA-Manifest und Service Worker für Offline-App-Shell
- Moneta-Icon im reduzierten Münzstil
- Kein Framework, keine Cloud, keine Build-Pipeline notwendig

## Starten

ES-Module und Service Worker sollten über HTTP geladen werden. Im Projektordner z. B.:

```bash
python -m http.server 8080
```

Dann im Browser öffnen:

```text
http://localhost:8080
```

## Datenmodell

### bookings

- `id`
- `type`: `income | expense`
- `amount`
- `categoryId`
- `title`
- `note`
- `date`
- `createdAt`
- `updatedAt`

### categories

- `id`
- `type`: `income | expense`
- `name`
- `icon`

### budgets

- `id`
- `month`: `YYYY-MM`
- `categoryId`
- `limit`

### settings

Vorbereitet für spätere lokale Einstellungen.

Saldo, Summen und Analysewerte werden bewusst **nicht** gespeichert, sondern aus den Buchungen berechnet.

## Nächste sinnvolle Schritte

1. Kategorien sortieren/archivieren
2. Wiederkehrende Buchungen
3. Datenexport/-import als JSON
4. Backup-/Restore-Workflow
5. Erweiterte Analysen und Monatsvergleiche
6. Optional CSV-Import mit Vorschau
