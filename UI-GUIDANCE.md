# moneta. UI Guidance

Diese Datei definiert die verbindliche visuelle und interaktive Sprache von **moneta.**

Ziel ist eine ruhige, hochwertige mobile Finanz-App mit klarer eigener Identität.

## 1. Markenname

Die bevorzugte Schreibweise im Branding lautet:

# moneta.

Kleingeschrieben und mit abschließendem Punkt.

Der Punkt gehört bewusst zur Wortmarke.

## 2. Designcharakter

Moneta soll wirken:

- ruhig
- hochwertig
- modern
- vertrauenswürdig
- reduziert
- freundlich
- klar
- mobile-native

Nicht:

- verspielt
- technisch
- bankmäßig steril
- neonfarben
- überladen
- dashboard-lastig
- wie eine responsive Webseite

## 3. Farbwelt

Die visuelle Identität basiert auf **Forest Green**.

Grün ist die zentrale Markenfarbe und wird unter anderem verwendet für:

- Branding
- aktive Zustände
- primäre Aktionen
- ausgewählte Navigation
- wichtige positive Akzente

Die bereits im Projekt verwendete Farbpalette hat Vorrang vor frei gewählten neuen Farbtönen.

Keine neue Akzentfarbe ohne ausdrückliche Designentscheidung einführen.

## 4. Hintergrund

Hintergründe sollen ruhig und flächig wirken.

Leichte:

- Tonwertunterschiede
- Verläufe
- Schatten
- Layer

dürfen zur räumlichen Trennung verwendet werden.

Sie sollen subtil bleiben.

Der Lockscreen ist eine bewusste Ausnahme und verwendet den freigegebenen grünen Hintergrund mit den definierten Schattierungen.

Dieser Hintergrund darf bei einer Umsetzung nach Referenz nicht frei neu interpretiert werden.

## 5. Typografie

Typografie soll:

- modern
- gut lesbar
- ruhig
- konsistent

sein.

Keine unterschiedlichen Font-Familien zwischen:

- Onboarding
- Lockscreen
- Übersicht
- Analyse
- Budgets
- Einstellungen

verwenden.

Hierarchie entsteht primär durch:

- Größe
- Gewicht
- Abstand

und nicht durch unterschiedliche Schriftarten.

## 6. Spacing

Abstände folgen einem konsistenten Raster.

Bevorzugt werden Werte wie:

`4 / 8 / 12 / 16 / 24 / 32`

Keine zufälligen Einzelabstände einführen, sofern sie nicht technisch oder durch einen freigegebenen Mock begründet sind.

Vertikaler Rhythmus soll über alle Screens konsistent bleiben.

## 7. Cards

Cards sind zurückhaltend.

Sie verwenden:

- klare Flächen
- moderate Rundung
- dezente Abgrenzung
- wenig visuelles Rauschen

Keine starken:

- Borders
- Glows
- tiefen Schatten
- dekorativen Verläufe in jeder Card

Cards dienen der Struktur und nicht der Dekoration.

## 8. Icons

Icons müssen aus einer konsistenten visuellen Familie stammen.

Bestehende freigegebene Icons haben Vorrang.

Nicht innerhalb derselben Navigation oder Oberfläche mischen:

- Outline
- Filled
- Emoji
- Unicode-Symbole
- beliebige SVG-Stile

Icons dürfen nicht durch nur ungefähr ähnliche Symbole ersetzt werden, wenn bereits eine konkrete Referenz existiert.

Bei externen Icons kann eine etablierte Bibliothek wie Iconify verwendet werden, sofern der Stil zur vorhandenen UI passt.

## 9. App-Icon

Das Android-App-Icon muss visuell zum innerhalb der App verwendeten Moneta-Symbol passen.

Bei Adaptive/Maskable Icons:

- ausreichende Safe Zone
- Motiv nicht übermäßig vergrößern
- keine abgeschnittenen Elemente
- konsistente Proportionen zur In-App-Darstellung

Das Betriebssystem muss das Motiv maskieren können, ohne dass es gequetscht oder sichtbar hineingezoomt wirkt.

## 10. Bottom Navigation

Die Hauptnavigation enthält:

**Übersicht · Analyse · + · Budgets · Einstellungen**

Sie ist permanenter Bestandteil der App-Struktur.

Anforderungen:

- feste und stabile Geometrie
- keine Layout-Shifts
- keine Textselektion
- ausreichend große Touch Targets
- konsistente Icon-Geometrie
- aktiver Zustand klar, aber nicht aggressiv

Das zentrale `+` ist die primäre Aktion zum Erstellen einer Buchung.

Es darf stärker hervorgehoben sein als normale Navigationselemente.

## 11. Header

Der Header respektiert Android System Insets.

Kein Text, Logo oder Bedienelement darf ungewollt mit:

- Uhrzeit
- Statusicons
- Kameraausschnitt
- Display-Cutout

kollidieren.

Die Position darf nicht mit starren Pixelwerten nur für ein einzelnes Smartphone optimiert werden.

Safe Areas/System Insets verwenden.

## 12. Buttons

Primäre Buttons:

- klar erkennbar
- in der Moneta-Farbwelt
- ausreichend groß
- eindeutig beschriftet

Sekundäre Aktionen:

- visuell schwächer
- keine Konkurrenz zur Hauptaktion

Destruktive Aktionen:

- eindeutig erkennbar
- nicht mit primären Aktionen verwechselbar

Buttons sollen nicht unnötig die gesamte Bildschirmbreite dominieren, wenn eine kompaktere Lösung dem bestehenden Layout entspricht.

## 13. Touch Targets

Interaktive Elemente benötigen mobile Touch-Flächen.

Ein kleines sichtbares Icon darf eine größere unsichtbare Touch-Fläche besitzen.

Zielgröße:

**ungefähr 44–48 px Mindest-Touchfläche**

Keine winzigen Desktop-Klickziele.

## 14. Dialoge

Dialoge sollen sich wie mobile Sheets bzw. App-Dialoge verhalten und nicht wie Browser-Popups.

Eigenschaften:

- klare Hierarchie
- ruhiger Hintergrund
- große Touch-Flächen
- sauberer Scrollbereich
- sichere Position oberhalb der Systemnavigation
- Tastatur berücksichtigt

Längere Formulare dürfen einen stabilen Footer für Aktionen verwenden.

## 15. Switches

Binäre oder optionale Funktionen werden bevorzugt über Switches dargestellt.

Beispiele:

- Wiederholung
- optionale Notizbereiche
- Biometrie
- weitere klare Ein/Aus-Einstellungen

Zusätzliche Felder erscheinen erst, wenn die jeweilige Funktion aktiviert wurde.

Dadurch bleibt das Grundformular kompakt.

## 16. Inputs

Inputs sollen möglichst wenig visuelles Gewicht besitzen.

Jedes Feld benötigt einen klaren Kontext.

Keine Desktop-Formulare mit vielen permanent sichtbaren Feldern.

Auswahlfelder wie:

- Kategorie
- Monat
- Jahr
- Wiederholung
- Sperrzeit

sollen sich möglichst wie mobile Picker bzw. App-Komponenten verhalten.

## 17. Fokus und Tastatur

Das Öffnen der Tastatur darf:

- Footer nicht zerstören
- Dialogaktionen nicht verdecken
- Layout nicht unkontrolliert verschieben

Beim Wechsel zwischen Screens muss Fokus bewusst verwaltet werden.

Autofokus nur dort einsetzen, wo er den konkreten Workflow verbessert und bereits so vorgesehen ist.

## 18. Bewegungen und Animationen

Animationen vermitteln Navigation und Zustand.

Sie sind kein Selbstzweck.

Bevorzugt:

- kurze Dauer
- natürliche Beschleunigung
- geringe Distanz
- keine Bounce-Effekte ohne funktionalen Grund

Navigation:

**Push → von rechts**

**Pop → Gegenrichtung**

Modale Inhalte verwenden dezente, mobile Übergänge.

Keine auffälligen Web-Transition-Effekte.

## 19. Haptik

Haptisches Feedback ist eine optionale spätere Verfeinerung.

Wenn es eingesetzt wird, dann gezielt, zum Beispiel bei:

- erfolgreicher Hauptaktion
- wichtiger Auswahl
- sinnvoller Navigation

Keine Vibration bei jeder Berührung.

## 20. Buchungslisten

Buchungen werden zeitlich gruppiert.

Beispiele:

- **Heute**
- **Gestern**
- konkretes Datum

Eine Buchungszeile muss schnell erfassbar machen:

- Bezeichnung
- Kategorie bzw. visuellen Kontext
- Betrag
- Einnahme oder Ausgabe
- ggf. Prognosestatus

Listen sollen ruhig bleiben und nicht jede Information gleichzeitig hervorheben.

## 21. Beträge

Geldbeträge besitzen hohe visuelle Priorität.

Positive und negative Werte müssen klar unterscheidbar sein.

Ein negativer Gesamtsaldo wird eindeutig hervorgehoben.

Farbe darf nicht die einzige Informationsträgerin sein.

## 22. Prognostizierte Buchungen

Zukünftige Buchungen aus Wiederholungen werden bewusst zurückgenommen dargestellt.

Primäres Mittel:

**reduzierte Opazität**

Sie müssen weiterhin gut lesbar sein.

Die Darstellung vermittelt:

> Diese Buchung ist berücksichtigt, aber noch nicht tatsächlich erfolgt.

Keine unnötige Warnfarbe oder komplett andere Card verwenden.

## 23. Analyse

Charts sollen verständlich und interaktiv sein.

Bei Auswahl einer Kategorie:

- entsprechendes Segment hervorheben
- Auswahl eindeutig anzeigen
- relevante Werte sichtbar machen

Diagramme dienen der Erklärung der Finanzen.

Sie dürfen nicht zum dekorativen Dashboard werden.

## 24. Skeleton Loading

Wenn Inhalte nachgeladen werden, Skeletons verwenden, sofern dadurch Layoutsprünge verhindert werden.

Skeletons sollen:

- ungefähr die endgültige Geometrie darstellen
- subtil animiert sein
- keine Aufmerksamkeit auf sich ziehen

Keine unnötigen Spinner für lokale Vorgänge, die praktisch sofort abgeschlossen sind.

## 25. Lockscreen

Der Lockscreen besitzt eine eigene, aber klar zu Moneta gehörende Komposition.

Verbindliche Merkmale des freigegebenen Designs:

- `moneta.`-Branding
- Forest-Green-Hintergrund mit den festgelegten Schattierungen
- hochwertiges Fingerabdrucksymbol
- reduzierte Texte
- klare biometrische Aktion

Das Fingerabdrucksymbol muss wie ein tatsächlicher Fingerabdruck wirken.

Keine simplen:

- Kreise
- generischen Touch-Icons
- groben selbstgebauten Linien

verwenden.

Eine passende SVG- oder Icon-Lösung ist gegenüber einer schlechten Approximation zu bevorzugen.

Bei Umsetzung nach freigegebenem Mock gilt:

**Mock exakt reproduzieren, nicht neu gestalten.**

## 26. Onboarding

Das Onboarding gehört visuell vollständig zur App.

Es verwendet dieselben:

- Farben
- Icons
- Fonts
- Buttons
- Abstände
- Rundungen

wie die Hauptanwendung.

Es erklärt nur die wesentlichen Konzepte und soll nicht wie eine separate Werbeseite wirken.

Keine technisch unnötigen Aussagen prominent bewerben, wenn sie dem Benutzer keinen konkreten Mehrwert erklären.

## 27. Einstellungen

Die Einstellungen bleiben bewusst schlicht.

Bevorzugte Struktur:

- gruppierte Einstellungen
- eindeutige Zeilen
- Switches für boolesche Optionen
- Chevron nur, wenn tatsächlich eine Unterseite oder Auswahl folgt

Kein Dashboard.

Keine großen dekorativen Cards für einfache Einstellungen.

## 28. Native Feeling

Bei jeder neuen Komponente prüfen:

> Würde dieses Verhalten in einer guten Android-App normal wirken?

Wenn nein, prüfen, ob die Lösung zu stark aus klassischen Web-Konventionen stammt.

Besonders vermeiden:

- Browser-Zoom
- Textselektion auf Controls
- native HTML-Popups im falschen Stil
- Desktop-Hover-Zustände
- unpassende Select-Menüs
- Browser-Refresh-Verhalten
- sichtbare Layout-Reflows

## 29. Responsive Verhalten

Primäres Ziel sind Smartphone-Displays.

Die UI muss insbesondere auf:

- schmalen Displays
- großen Displays
- unterschiedlichen Seitenverhältnissen
- Geräten mit Display-Cutouts
- Geräten mit Gestennavigation

funktionieren.

Keine Positionierung ausschließlich anhand eines einzelnen Testgeräts.

## 30. Dark Mode

Dark Mode verwendet dieselbe visuelle Hierarchie wie Light Mode.

Nicht einfach Farben stumpf invertieren.

Beibehalten werden:

- Kontrastverhältnisse
- Ebenenhierarchie
- Forest-Green-Identität
- Lesbarkeit
- Unterscheidung von realen und prognostizierten Buchungen

## 31. Visuelle Regressionen

Nach UI-Änderungen insbesondere prüfen:

- Header
- Bottom Navigation
- Dialoge
- Tastatur offen
- lange Buchungsnamen
- große Geldbeträge
- negative Beträge
- leere Listen
- viele Buchungen
- Dark Mode
- Lockscreen
- Android Systemleisten

## 32. Referenzregel

Wenn ein freigegebener Mock existiert, ist dieser die visuelle Referenz.

Wenn kein Mock existiert:

1. bestehende Moneta-Komponente wiederverwenden
2. bestehende Design-Tokens verwenden
3. bestehendes Interaktionsmuster verwenden
4. erst danach eine neue Lösung entwerfen

**Konsistenz hat Vorrang vor Neuheit.**

Eine neue Komponente soll aussehen, als wäre sie schon immer Teil von Moneta gewesen.
