# AGENTS.md

Diese Datei enthält verbindliche Arbeitsregeln für Coding-Agents im Projekt **moneta.**

Sie ist vor Änderungen am Repository vollständig zu berücksichtigen.

## 1. Grundregel

### Ändere nur, was beauftragt wurde.

Keine eigenmächtigen:

- UI-Redesigns
- Refactorings
- Architekturwechsel
- Dependency-Wechsel
- Umbenennungen
- Feature-Erweiterungen
- Bereinigungen angrenzender Komponenten

Wenn eine zusätzliche Änderung technisch notwendig erscheint, zuerst begründen und ihre Auswirkungen prüfen.

**Nicht interpretieren, wenn eine Vorgabe bereits eindeutig ist.**

## 2. Vor jeder Änderung

Vor dem Schreiben von Code:

1. relevante Dateien identifizieren
2. bestehenden Datenfluss verstehen
3. bestehende UI-Komponenten identifizieren
4. Seiteneffekte bestimmen
5. kleinstmöglichen sinnvollen Fix festlegen

Nicht sofort Code ändern, wenn zunächst ausdrücklich Analyse, Planung oder ein Mock verlangt wird.

Formulierungen wie:

- „lass uns überlegen“
- „prüf erst“
- „nicht gleich coden“
- „zeig mir erst, ob du verstanden hast“

bedeuten:

**Keine Codeänderung.**

## 3. Minimal Change Principle

Jede Änderung soll den kleinstmöglichen sinnvollen Scope besitzen.

Beispiel:

Problem:

> Header liegt unter Android zu hoch und kollidiert mit der Statusbar.

Richtig:

- Insets/Safe Area prüfen
- betroffenen Container korrigieren
- relevante Ansichten testen

Falsch:

- Header neu gestalten
- Navigation umbauen
- globale Spacing-Skala ändern
- Komponentenbibliothek refactoren

## 4. Bestehendes Verhalten schützen

Vor Änderungen prüfen, welche bestehenden Funktionen betroffen sein können.

Besonders regressionskritisch sind:

- Buchungen
- Bearbeiten von Buchungen
- Löschen
- Suche
- Kategorien
- Monatswechsel
- Finanzmonat
- wiederkehrende Buchungen
- Saldenberechnung
- Analyse
- Budgets
- Export
- Import
- Navigation
- Android Back
- Bottom Navigation
- Biometrie
- Lockscreen
- App Resume
- Tastatur/Fokus
- lokale Persistenz

Ein Fix gilt nicht als erfolgreich, wenn dafür eine andere Kernfunktion beschädigt wurde.

## 5. UI ist spezifiziert

`UI-GUIDANCE.md` ist verbindlich.

Bestehende freigegebene Screens und Mockups haben Vorrang vor eigener gestalterischer Interpretation.

Wenn ausdrücklich verlangt wird:

> „exakt wie im Mock“

bedeutet das:

- keine alternative Farbwahl
- keine anderen Icons
- keine neue Typografie
- keine abweichenden Abstände aus ästhetischen Gründen
- keine eigene Interpretation des Layouts

Falls etwas aus dem Mock technisch nicht eindeutig bestimmbar ist, die bestehende UI als Referenz verwenden oder vor einer sichtbaren Abweichung nachfragen.

## 6. Keine unnötigen Web-Komponenten

Moneta soll sich wie eine mobile App verhalten.

Vermeide sichtbare Browser-/Desktop-Web-Muster, wenn bereits eine app-native Lösung existiert.

Insbesondere kritisch:

- klassische Browser-Alerts
- Browser-Confirm-Dialoge
- Desktop-Dropdowns
- ungestylte HTML-Selects
- unpassende Scrollbars
- Textselektion auf Navigationselementen
- Browser-Zoom
- Layout-Shifts beim Öffnen der Tastatur

## 7. Android-Verhalten

Android ist das derzeitige primäre Ziel.

Bei UI-Änderungen prüfen:

- Statusbar/Safe Area
- Navigation Bar/Safe Area
- Android Back
- Soft Keyboard
- Fokus
- Resume aus dem Hintergrund
- biometrischer Status
- Touch Targets
- Scroll-Verhalten

Die App darf nicht ungewollt unter Systemleisten ragen.

## 8. Navigation

Die Bottom Navigation:

- muss geometrisch stabil bleiben
- darf beim Seitenwechsel nicht springen
- darf keinen Shake verursachen
- darf nicht durch Textselektion beeinflusst werden
- muss konsistente Icons verwenden

Navigationstransitionen:

**Push**  
Neue Ansicht kommt von rechts.

**Pop**  
Rückbewegung erfolgt in Gegenrichtung.

Animationen kurz und funktional halten.

Keine dekorativen Animationen hinzufügen, wenn sie nicht verlangt wurden.

## 9. Dialoge und Formulare

Dialoge müssen auf kleinen Smartphone-Displays vollständig bedienbar bleiben.

Primäre Aktionen dürfen nicht hinter:

- Tastatur
- Navigation Bar
- Scrollbereich
- Safe Area

verschwinden.

Bei längeren Formularen bevorzugt:

- scrollbarer Content
- stabiler Action-Bereich
- klare visuelle Hierarchie

Optionale Bereiche wie Wiederholung oder Notizen sollen nur dann Platz beanspruchen, wenn sie aktiviert bzw. benötigt werden.

## 10. Fokusmanagement

Fokus ist Teil des UX-Verhaltens.

Nach Navigation oder Öffnen eines Dialogs darf nicht zufällig ein Feld fokussiert werden.

Wenn ein definierter Fokus existiert, muss dieser bewusst gesetzt werden.

Beim Schließen eines Dialogs:

- Tastatur schließen
- Fokus sauber entfernen
- vorherigen Navigationszustand sinnvoll wiederherstellen

## 11. Datenmodell

UI-Komponenten dürfen Persistenzdetails nicht unnötig kennen.

Logik für:

- Buchungen
- Wiederholungen
- Finanzmonate
- Kategorien
- Prognosen

soll möglichst unabhängig vom konkreten Storage bleiben.

Damit bleibt eine spätere Migration der Persistenz möglich.

## 12. Wiederkehrende Buchungen

Zukünftige Instanzen wiederkehrender Buchungen sind **Prognosen**.

Sie:

- fließen in relevante zukünftige Salden ein
- fließen in relevante Analysen ein
- sind visuell von realen Buchungen unterscheidbar
- dürfen nicht versehentlich als tatsächlich gebuchte Transaktionen persistiert werden, sofern das bestehende Datenmodell dies nicht ausdrücklich vorsieht

Berechnungslogik und Darstellung strikt auseinanderhalten.

## 13. Finanzmonat

Nicht automatisch von einem Kalendermonat ausgehen.

Bei:

- Buchungslisten
- Summen
- Analysen
- Budgets
- Navigation
- Datumsvorgaben

immer prüfen, ob der gewählte Finanzmonat maßgeblich ist.

Beim Erstellen einer Buchung aus einem anderen Monat muss der Benutzer anschließend in einem sinnvollen Kontext landen und die Buchung unmittelbar finden können.

## 14. Lokale Daten

Bestehende Nutzerdaten dürfen bei Updates nicht verloren gehen.

Keine Änderungen an:

- Datenbankschema
- Storage Keys
- IndexedDB-Strukturen
- Serialisierung

ohne Prüfung der Migration.

Bei Schemaänderungen muss Abwärtskompatibilität bzw. eine Migration vorgesehen werden.

## 15. Versionierung

Nach einer tatsächlich ausgelieferten Änderung die Projektversion entsprechend der bestehenden Versionsstrategie erhöhen.

Keine Versionserhöhung für:

- reine Analyse
- Diskussion
- Mock
- nicht übernommene Experimente
- reine Dokumentationsänderungen, sofern die App selbst unverändert bleibt

Die Versionsanzeige innerhalb der App muss mit dem Buildstand übereinstimmen, sofern sie vorhanden ist.

## 16. Branching

Kleine, klar begrenzte Bugfixes können direkt im vorgesehenen Arbeitsbranch erfolgen.

Größere Features:

1. eigener Feature-Branch
2. Umsetzung
3. Test
4. visuelle Prüfung
5. Entscheidung
6. erst danach Merge

Ein verworfenes Experiment darf `main` nicht mit Restcode verschmutzen.

## 17. Commits

Commits sollen:

- klein
- nachvollziehbar
- thematisch geschlossen

sein.

Gute Beispiele:

```text
fix: respect Android status bar inset
fix: keep bottom navigation stable
feat: add optional biometric lock
feat: include recurring transactions in forecast
```

Nicht verwenden:

```text
various fixes
updates
changes
```

## 18. Keine Annahmen bei Unklarheit

Wenn eine Entscheidung das sichtbare Verhalten oder Datenmodell verändert und aus Repository, Mock oder Auftrag nicht eindeutig hervorgeht:

**nachfragen.**

Eine Rückfrage ist besser als eine kreative Fehlinterpretation.

Ausnahme: Wenn nur eine technisch interne, nicht sichtbare Implementierungsentscheidung nötig ist und die bestehende Architektur eine klare Richtung vorgibt, diese minimal und konsistent umsetzen.

## 19. Definition of Done

Eine Änderung ist erst fertig, wenn:

- gewünschtes Verhalten umgesetzt ist
- bestehende Funktionen weiterhin funktionieren
- keine offensichtlichen Layout-Regressions entstanden sind
- Android Insets berücksichtigt sind, sofern relevant
- Navigation funktioniert, sofern betroffen
- Fokus/Tastatur geprüft wurden, sofern relevant
- Daten erhalten bleiben
- Version bei ausgelieferter App-Änderung aktualisiert wurde
- Commit sinnvoll benannt ist

## 20. Prioritäten bei widersprüchlichen Signalen

Bei Widersprüchen gilt folgende Reihenfolge:

1. aktuelle explizite Anweisung des Benutzers
2. aktuell freigegebener Mock oder konkrete visuelle Referenz
3. `UI-GUIDANCE.md`
4. `AGENTS.md`
5. bestehendes Verhalten
6. `README.md`
7. eigene Annahmen

Eigene gestalterische Präferenzen des Agents stehen immer zuletzt.
