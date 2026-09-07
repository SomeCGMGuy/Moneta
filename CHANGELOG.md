# Changelog

## 2.0.7 – 2026-09-07

- In den Einstellungen einen eigenen Bereich „App“ mit „App neu laden“ ergänzt.
- Das vollständige Neuladen startet nur die App-Oberfläche neu; lokal gespeicherte Buchungen, Kategorien, Budgets und Einstellungen bleiben erhalten.
- Pull-to-refresh bleibt davon getrennt und aktualisiert weiterhin nur die Daten der laufenden App.
- Versionsanzeige und Service-Worker-Cache auf Version 2.0.7 angehoben.

## 2.0.6 – 2026-09-07

- Eigenes Pull-to-refresh für Moneta ergänzt: Herunterziehen am oberen Rand aktualisiert nur die App-Daten und löst keinen vollständigen Seitenreload aus.
- Die aktuell geöffnete Ansicht, der gewählte Monat sowie Analysezustände bleiben beim Aktualisieren erhalten.
- Native wirkende Pull-to-refresh-Anzeige mit Zuständen für Ziehen, Loslassen, Aktualisieren, Erfolg und Fehler ergänzt.
- Pull-to-refresh greift nicht in offene Dialoge oder Formulareingaben ein und ersetzt weiterhin das Browser-Pull-to-refresh.
- Versionsanzeige und Service-Worker-Cache auf Version 2.0.6 angehoben.

## 2.0.5 – 2026-09-07

- Pull-to-refresh bzw. das Herunterziehen der gesamten App-Oberfläche am oberen Rand unterbunden, damit Moneta sich in der installierten PWA stärker wie eine native App verhält.
- Textauswahl und Touch-Callout in der Bottom-Navigation deaktiviert, sodass die Navigationsbeschriftungen nicht mehr markiert oder kopiert werden können.
- Beschriftung „Einstellungen“ im Footer für schmale Displays optimiert, damit der letzte Buchstabe nicht mehr abgeschnitten wird.
- Versionsanzeige unter „Über Moneta“ auf 2.0.5 angehoben.
- Service-Worker-Cache auf Version 2.0.5 angehoben.

## 2.0.4 – 2026-09-07

- Pinch-/Seitenskalierung in der installierten Moneta-App unterbunden, damit die Oberfläche wie eine feste App-UI bedient wird.
- Ungewolltes Fokus-Zoomen bei Formulareingaben durch mobile 16-px-Eingabeschrift vermieden.
- Bottom-Navigation auf eine feste Höhe stabilisiert.
- Navigationsbeschriftungen bleiben einzeilig; der aktive Zustand verändert die Schriftbreite nicht mehr. Dadurch springt der Footer beim Wechsel auf „Einstellungen“ nicht mehr.
- Service-Worker-Cache auf Version 2.0.4 angehoben.

## 2.0.3 – 2026-09-07

- Schnellerfassung auf der Übersicht ergänzt: Freitext wie „REWE 12,40“, Kategorie auswählen und direkt buchen.
- Betrag wird aus dem Freitext erkannt; das Buchungsdatum ist automatisch heute.
- Eigenes maskierbares PWA-Icon mit zusätzlicher Safe-Zone ergänzt, damit Launcher wie Xiaomi/HyperOS das Moneta-Symbol nicht mehr ungewollt hineinzoomen oder beschneiden.
- Normale App-Icons und maskierbares Launcher-Icon im Manifest getrennt.
- Service-Worker-Cache auf Version 2.0.3 angehoben.

## 2.0.2 – 2026-09-07

- Backup/Restore als vollständiges JSON-Datenbackup ergänzt.
- Analyse um Zeitraumfilter, Kategorie-Drilldown, Animationen und Monatsverlauf erweitert.
- Hell-/Dunkelmodus ergänzt und lokal persistiert.
- „Über Moneta“ auf reine Versionsanzeige reduziert.
- Blaue Mobile-Tap-Highlights entfernt.
- Überlauf langer Buchungstexte in den Betragsbereich behoben.
- Service-Worker-Cache auf Version 2.0.2 angehoben und Online-Abruf auf Network-first umgestellt.
- Visuelle Referenzen unter `docs/mockups/` ergänzt.
