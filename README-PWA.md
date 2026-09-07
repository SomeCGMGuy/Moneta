# Moneta als PWA

Moneta ist weiterhin eine reine HTML/JavaScript-Anwendung. Die fachlichen Daten
(Buchungen, Kategorien und Einstellungen) bleiben in IndexedDB.

## Neu hinzugekommen

- `manifest.webmanifest` – Installationsdaten der PWA
- `service-worker.js` – Offline-Cache
- `js/pwa.js` – Registrierung des Service Workers
- `icons/` – App-, Maskable- und Apple-Touch-Icons

## Starten / installieren

Ein Service Worker funktioniert nur über **HTTPS** oder über **localhost**.
`index.html` direkt per `file://` zu öffnen reicht für die PWA-Funktionen nicht.

Für die lokale Entwicklung genügt z. B. ein lokaler HTTP-Server. Für die
Installation auf Android muss Moneta über eine HTTPS-Adresse erreichbar sein.
Nach dem ersten erfolgreichen Start wird die App-Shell lokal gecacht und kann
danach ohne Netzverbindung starten.

## IndexedDB

Die bestehende IndexedDB-Implementierung wurde nicht geändert. Wichtig ist: 
Browserdaten sind an **Gerät + Browserprofil + Origin (Adresse)** gebunden. Eine
Installation von einer neuen HTTPS-Adresse übernimmt deshalb nicht automatisch
Daten, die vorher unter `file://` oder einer anderen Adresse gespeichert wurden.

## Cache-Strategie

Der Service Worker nutzt für Monetas eigene Dateien **Network First**:

1. Online wird immer zuerst die aktuelle Datei vom Server geladen.
2. Erfolgreiche Antworten aktualisieren den Offline-Cache.
3. Offline wird die zuletzt erfolgreiche Version aus dem Cache verwendet.

Damit bleiben Updates während der Entwicklung sichtbar und Moneta funktioniert
trotzdem offline.
