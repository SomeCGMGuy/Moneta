# Changelog

## 2.0.13 – 2026-09-07

- Beim Anlegen einer neuen Buchung wird die Bezeichnung nach dem Push-Übergang automatisch fokussiert, sodass direkt mit der Eingabe begonnen werden kann.
- Die Schnellerfassung auf der Übersicht wurde vollständig entfernt; neue Buchungen laufen wieder ausschließlich über die zentrale Plus-Aktion.
- Das nicht mehr benötigte Schnellerfassungs-Skript sowie dessen Service-Worker-Eintrag wurden entfernt.
- Service-Worker-Cache und Versionsanzeige auf Version 2.0.13 angehoben.

## 2.0.12 – 2026-09-07

- Die Bottom-Navigation bleibt während Push-Übergängen jetzt vollständig in ihrer festen Position und wird nicht mehr zusammen mit dem Hintergrund verschoben.
- Dadurch entfällt der sichtbare Sprung des Footers beim Zurückkehren aus Buchungen, Kategorien, Budgets und Bestätigungsansichten.
- Nur der eigentliche Inhaltsbereich nutzt weiterhin den dezenten Parallax-Effekt; die Push-Seite fährt darüber ein und wieder aus.
- Service-Worker-Cache und Versionsanzeige auf Version 2.0.12 angehoben.

## 2.0.11 – 2026-09-07

- Push-Navigation auf Kategorien, Budgets und Bestätigungsdialoge erweitert, damit diese Bereiche wie eigene App-Seiten statt klassische Modals erscheinen.
- Android-System-Zurück funktioniert damit auch in diesen Ansichten konsistent wie der Zurück-Pfeil in der Kopfzeile.
- Die Push-Animation wurde von 280 ms auf 190 ms verkürzt und startet beim Schließen sofort, statt erst auf den History-Rücksprung zu warten.
- Hintergrund-Parallax und Abdunklung reduziert sowie die Animation auf GPU-freundliche translate3d-Transformationen umgestellt, damit das Zurückfahren flüssiger und weniger wie ein Hänger wirkt.
- Gemeinsame Push-Navigationslogik zentralisiert und Service-Worker-Cache sowie Versionsanzeige auf 2.0.11 angehoben.

## 2.0.10 – 2026-09-07

- Die Android-System-Zurücktaste ist jetzt mit der neuen Transaktionsnavigation verknüpft.
- Beim Öffnen einer Buchung wird ein eigener History-Eintrag gesetzt; Android-Zurück, Browser-Zurück und der Zurück-Button oben schließen dadurch dieselbe Push-Ansicht.
- Speichern und Löschen räumen den temporären Navigationseintrag ebenfalls sauber auf, damit kein zusätzlicher Zurück-Schritt in der App-Historie hängen bleibt.
- Versionsanzeige und Service-Worker-Cache auf Version 2.0.10 angehoben.

## 2.0.9 – 2026-09-07

- Neue und bestehende Buchungen öffnen jetzt als eigene, vollflächige Transaktionsansicht statt als Modal.
- Beim Öffnen fährt die aktuelle Moneta-Ansicht nach links, während die Transaktionsansicht von rechts hereinkommt; beim Zurückgehen läuft die Animation spiegelverkehrt.
- Die Transaktionsansicht hat eine eigene Kopfzeile mit Zurück-Navigation und eine feste Speichern-Aktion am unteren Rand.
- Die Bottom-Navigation bleibt während der Transaktionsansicht im Hintergrund und bewegt sich zusammen mit der bisherigen Ansicht aus dem Fokus.
- Eingaben, Kategorien, Datumslogik und Löschen bestehender Buchungen funktionieren weiterhin wie zuvor.
- Eigene Navigations-Styles ergänzt und Service-Worker-Cache sowie Versionsanzeige auf 2.0.9 angehoben.

## 2.0.8 – 2026-09-07

- Neue Buchungen orientieren ihr vorausgewähltes Datum jetzt am aktuell geöffneten Monat statt immer am heutigen Kalendermonat.
- Dabei bleibt der heutige Tag erhalten, soweit er im Zielmonat existiert; andernfalls wird automatisch der letzte gültige Tag des Monats verwendet.
- Die Schnellerfassung verwendet dieselbe Monatslogik und zeigt im Vormonat das konkrete Buchungsdatum statt „Heute“ an.
- Das Donutdiagramm in der Analyse ist jetzt direkt interaktiv: Segmente können angetippt werden, die gewählte Kategorie wird deutlich hervorgehoben und die übrigen Segmente werden zurückgenommen.
- In der Donutmitte werden bei einer Auswahl Kategorie, Betrag und prozentualer Anteil angezeigt; Kategorieauswahl und Diagramm sind miteinander synchronisiert.
- Die Zeitraumfilter in der Analyse haben seitlichen Innenabstand und Scroll-Snapping, sodass erste und letzte Schaltfläche beim horizontalen Scrollen vollständig sichtbar bleiben.
- Versionsanzeige und Service-Worker-Cache auf Version 2.0.8 angehoben.

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
