# moneta.

**moneta.** ist eine lokale, mobile Finanz-App für Finanzanalyse, Budgetplanung und die Frage, die im Alltag wirklich zählt:

> **Wie viel Geld steht mir tatsächlich zur Verfügung – heute, diesen Monat und in Zukunft?**

Der Fokus liegt auf verständlicher Finanzplanung, einer ruhigen Oberfläche und einem möglichst nativen Android-Erlebnis. Moneta ist keine Banking-App und benötigt für seine Kernfunktionen keine Cloud- oder Bankanbindung.

## Produktprinzipien

- **Local first:** Finanzdaten bleiben lokal auf dem Gerät.
- **Offline nutzbar:** Kernfunktionen benötigen keine Internetverbindung.
- **Einfach vor vollständig:** Funktionen müssen verständlich bleiben.
- **Mobile first:** Bedienung und Layout werden für Smartphones entwickelt.
- **App statt Webseite:** Verhalten, Navigation und Komponenten sollen sich möglichst nativ anfühlen.
- **Vorausschauend:** Zukünftige und wiederkehrende Buchungen gehören zur finanziellen Planung.
- **Ruhige UI:** Keine unnötigen Effekte, Dialoge oder dekorativen Elemente.

## Aktueller technischer Stand

Moneta wird als **Capacitor-App für Android** weiterentwickelt.

Aktuell verwendet das Projekt unter anderem:

- Plain JavaScript / ES Modules
- HTML / CSS
- IndexedDB für lokale Datenhaltung
- Capacitor 8
- `@capacitor/app`
- `@capgo/capacitor-native-biometric`
- Android als primäres Deployment-Ziel

Die frühere GitHub-Pages-/PWA-Ausrichtung ist nicht mehr das primäre Produktziel.

Die aktuelle Paketversion ist in `package.json` definiert.

## Kernfunktionen

### Übersicht

Die Übersicht zeigt den gewählten Finanzzeitraum mit:

- Einnahmen
- Ausgaben
- verfügbarem Saldo
- Buchungen
- Tagesgruppierung wie **Heute** und **Gestern**
- zukünftigen bzw. prognostizierten Buchungen

Negative Salden werden eindeutig hervorgehoben.

Größere Buchungslisten werden schrittweise geladen. Skeleton-Zustände sollen sichtbare Layoutsprünge vermeiden.

### Buchungen

Eine Buchung enthält mindestens:

- Bezeichnung
- Betrag
- Typ: `income` oder `expense`
- Kategorie
- Datum

Optional können unter anderem Notizen und Wiederholungen ergänzt werden.

Der Erstellungsdialog soll kompakt bleiben. Optionale Bereiche werden nur eingeblendet, wenn sie benötigt werden.

### Finanzmonat

Kalendermonate bilden persönliche Finanzen nicht immer sinnvoll ab. Wenn z. B. das Gehalt am Monatsanfang eingeht, die Miete aber bereits kurz vor Monatsende abgebucht wird, kann eine reine Kalendermonatsbetrachtung irreführend sein.

Moneta unterstützt deshalb einen verschiebbaren **Finanzmonat**. Auswertungen, Salden und Monatsansichten sollen sich an diesem Finanzzeitraum orientieren.

### Wiederkehrende Buchungen

Buchungen können wiederkehrend angelegt werden.

Zukünftige, aus Wiederholungen abgeleitete Buchungen werden bereits in relevanten:

- Salden
- Monatsplanungen
- Analysen
- Statistiken

berücksichtigt.

Da sie noch nicht tatsächlich erfolgt sind, werden sie visuell zurückhaltender dargestellt, insbesondere mit reduzierter Opazität.

Damit unterscheidet Moneta klar zwischen **gebucht** und **prognostiziert**.

### Kategorien

Einnahmen- und Ausgabenkategorien werden getrennt verwaltet.

Kategorien besitzen unter anderem:

- Name
- Typ
- Icon

Auswahl- und Suchoberflächen sollen sich wie mobile App-Komponenten und nicht wie klassische Desktop-Webformulare verhalten.

### Analyse

Die Analyse unterstützt unterschiedliche Betrachtungszeiträume, unter anderem:

- Monat
- letztes Quartal
- dieses Jahr
- letztes Jahr

Kategorien können interaktiv ausgewählt werden. Das zugehörige Diagrammsegment wird hervorgehoben und die Auswahl verständlich in den Kontext gesetzt.

Charts dienen der Erklärung der Finanzen und nicht als dekoratives Dashboard.

### Budgets

Budgets können pro Ausgabenkategorie verwaltet und dem jeweiligen Finanzzeitraum gegenübergestellt werden.

### Suche

Buchungen und Kategorien müssen zuverlässig durchsuchbar bleiben. Suche ist Kernfunktion und bei Änderungen an Navigation, Datenfluss oder Filtern regressionskritisch.

### Datensicherung

Moneta unterstützt Export und Import lokaler Daten.

Backups dienen sowohl der Datensicherung als auch als Migrationsmöglichkeit für spätere Änderungen an der Persistenz.

Bestehende Nutzerdaten dürfen durch App-Updates nicht verloren gehen.

## Datenhaltung

Die aktuelle Persistenz basiert auf IndexedDB.

Die UI soll nicht unnötig eng an IndexedDB gekoppelt werden, damit eine spätere Migration auf eine andere lokale oder servergestützte Datenbank möglich bleibt.

Berechnete Werte wie Salden und Summen sollen nach Möglichkeit aus den Buchungsdaten abgeleitet und nicht redundant gespeichert werden.

## Hauptnavigation

Die Hauptnavigation besteht aus:

1. Übersicht
2. Analyse
3. Neue Buchung (`+`)
4. Budgets
5. Einstellungen

Das zentrale Plus ist eine Aktion und keine eigenständige Inhaltsseite.

Die Bottom Navigation muss über Hauptansichten hinweg geometrisch stabil bleiben.

## Navigation und App-Verhalten

Navigation soll sich wie eine mobile Anwendung verhalten.

- Vorwärtsnavigation: neue Ansicht bewegt sich von rechts herein.
- Rückwärtsnavigation: vorherige Ansicht erscheint in Gegenrichtung.
- Android-Zurück muss sinnvoll funktionieren.
- Fokus und Soft Keyboard müssen sauber verwaltet werden.
- Systemleisten und Safe Areas müssen berücksichtigt werden.
- Browser-typische Effekte wie Textselektion auf Controls oder Seitenzoom sind zu vermeiden.

## Onboarding

Beim ersten Start erhält der Benutzer eine kurze Einführung in die wesentlichen Konzepte der App.

Das Onboarding verwendet dieselbe Typografie, Farbwelt und Komponentenlogik wie die Hauptanwendung.

Die Wortmarke wird konsistent als **moneta.** dargestellt.

## Biometrische Sperre

Biometrie ist optional.

Beim ersten Start ist keine biometrische Einrichtung erforderlich. Die Funktion kann später in den Einstellungen aktiviert oder deaktiviert werden.

Zusätzlich kann ein Zeitraum definiert werden, nach dem Moneta erneut gesperrt wird.

Der Lockscreen folgt der verbindlichen Designsprache aus `UI-GUIDANCE.md` und vorhandenen freigegebenen Referenz-Mockups.

## App-Icon

Das Android-App-Icon muss visuell mit dem innerhalb der App verwendeten Moneta-Symbol übereinstimmen.

Bei Adaptive/Maskable Icons ist insbesondere auf eine ausreichende Safe Zone zu achten, damit das Motiv vom Launcher nicht sichtbar hineingezoomt oder abgeschnitten wird.

## Entwicklung

Vor Änderungen gilt grundsätzlich:

> **Verstehen → Auswirkungen bestimmen → minimal ändern → testen → Version aktualisieren → committen**

Kleine Bugfixes sollen einen möglichst engen Scope behalten.

Größere Features werden auf einem separaten Branch entwickelt und erst nach erfolgreicher Prüfung übernommen.

Ein Bugfix ist kein Anlass für ein ungefragtes Refactoring oder Redesign.

Die verbindlichen Arbeitsregeln für Coding-Agents stehen in [`AGENTS.md`](AGENTS.md).

Die verbindliche Designsprache steht in [`UI-GUIDANCE.md`](UI-GUIDANCE.md).

## Visuelle Referenzen

Vorhandene freigegebene Mockups unter `docs/mockups/` sind bei entsprechenden Screens die visuelle Soll-Referenz.

Wenn ausdrücklich eine exakte Umsetzung eines Mockups verlangt wird, ist dieses nicht gestalterisch neu zu interpretieren.

## Ziel

Moneta soll keine überladene Banking-App werden.

Das Ziel ist eine Finanz-App, die verständlich beantwortet:

> **Was habe ich – und was kann ich tatsächlich noch ausgeben?**
