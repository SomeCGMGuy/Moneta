# Moneta 2.0.2

Lokale PWA für **Finanzanalyse und Budgetplanung**. Bewusst schlank als Plain-JavaScript-Anwendung mit IndexedDB, ohne Framework, Cloud oder Build-Pipeline.

## Neu in 2.0.2

- Vollständiger JSON-Backup-Export für Buchungen, Kategorien, Budgets und Einstellungen
- Wiederherstellungs-Import mit Prüfung und ausdrücklicher Bestätigung vor dem Ersetzen der lokalen Daten
- Backup-Metadaten mit App- und Formatversion für spätere Kompatibilität
- Erweiterte Analyse mit Zeitraumwahl: Monat, letztes Quartal, dieses Jahr und letztes Jahr
- Anklickbare Kategorien mit Buchungs-Drilldown
- Animiertes Donutdiagramm, Fortschrittsbalken und monatlicher Ausgabenverlauf
- Hell-/Dunkelmodus, lokal gespeichert und ebenfalls im Backup enthalten
- „Über Moneta“ auf die Versionsanzeige reduziert
- Mobile Tap-Highlights in Navigation und Buchungslisten entfernt; stattdessen dezentes App-Feedback
- Lange Buchungstexte bleiben sicher im Textbereich und überlagern den Betrag nicht mehr
- Service Worker auf Network-first umgestellt, damit neue Releases online schneller den aktuellen Stand laden und offline weiterhin aus dem Cache funktionieren
- Visuelle Referenzdateien unter `docs/mockups/`

## Grundfunktionen

- Übersicht mit Einnahmen, Ausgaben, Saldo und Monatswechsel
- Buchungen anlegen, bearbeiten und nach zusätzlicher Bestätigung löschen
- Einnahmen- und Ausgabenkategorien getrennt verwalten
- Kategorieanalyse der Ausgaben mit Donutdiagramm
- Monatsbudgets pro Ausgabenkategorie
- IndexedDB als lokale Datenbank
- PWA-Manifest und Service Worker für Offline-Nutzung
- Moneta-Icon im reduzierten Münzstil

## Starten

ES-Module und Service Worker sollten über HTTP geladen werden. Im Projektordner zum Beispiel:

```bash
python -m http.server 8080
```

Danach im Browser öffnen:

```text
http://localhost:8080
```

Für GitHub Pages kann der Inhalt des Projektordners direkt als statische Website veröffentlicht werden.

## Datensicherung

Unter **Einstellungen → Datensicherung** kann ein vollständiges Backup als JSON-Datei exportiert werden. Der Import ersetzt nach einer Sicherheitsabfrage den aktuellen lokalen Datenbestand atomar durch den Inhalt der Sicherung.

Enthalten sind die IndexedDB-Stores:

- `bookings`
- `categories`
- `budgets`
- `settings`

Das Backupformat enthält zusätzlich `appVersion`, `formatVersion` und `exportedAt`.

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

Key-/Value-Einstellungen, aktuell unter anderem das gewählte Farbschema.

Saldo, Summen und Analysewerte werden bewusst **nicht** gespeichert, sondern aus den Buchungen berechnet.

## Visuelle Referenz

Die vereinbarte Designsprache ist als statische Referenz unter `docs/mockups/` im Release enthalten. Diese Dateien enthalten nur Beispieldaten und dienen bei späteren Änderungen zum visuellen Abgleich mit dem Soll-Zustand.
