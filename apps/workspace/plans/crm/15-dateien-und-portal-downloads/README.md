# Ordner 15 — Dateiablage und Portaldownloads

> **Status:** offen · **Abhängigkeiten:** 12, 14 · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–120 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`15-dateien-ui.md`](./15-dateien-ui.md) — interne Dateiablage und Freigaben.
- [`16-bulk-upload-download.md`](./16-bulk-upload-download.md) — Mehrfachupload und ZIP-Download.

Interne Nutzer können Dokumente hochladen, kategorisieren, suchen, freigeben und gesammelt
herunterladen. Portalnutzer können eigene Dokumente hochladen, Löschung anfragen und ausschließlich
freigegebene Dokumente herunterladen. Der vollständige Datei-Flow wird erst in diesem Ordner
sichtbar geschaltet.

## Daten und UI

- Genau ein Scope je Datei: Kunde, Projekt oder später Feedbackrunde. DB-Check verhindert null oder
  mehrere Scopes; Projekt/Kunde müssen übereinstimmen.
- Flache Liste mit Kategorie, Name, Typ, Größe, Uploader, Datum, Freigabe und Inspectionstatus.
- Keine Ordner, Bildraster oder Dateiversionen. PDF darf eingebettet angesehen werden; Office/TXT
  werden heruntergeladen beziehungsweise als sicherer Plaintext gezeigt.
- Neue Uploads sind intern. Freigabe ist eigene protokollierte Mutation mit `version`.
- Portal-Upload bleibt zunächst intern; Kunden-Löschaktion erzeugt nur eine interne Anfrage.
- ZIP enthält maximal 100 ausgewählte Dateien und 300 MB, streamt serverseitig und verwendet sichere,
  kollisionsfreie Namen.

## Autorisierung

- Workspace: alle sehen Metadaten; Schreiben nach Permission.
- Portal: Query enthält Kundenmitgliedschaft und `visible_to_customer = true`; direkte fremde ID
  liefert 404.
- Signierte URLs werden kurz vor Download erzeugt und nicht dauerhaft im DTO gespeichert.
- Cache-Control verhindert das Speichern privater Antworten in öffentlichen Caches.

## Merge-Gate

- [ ] Upload, Liste, Freigabe, Download, ZIP und Löschanfrage funktionieren als vollständiger Flow.
- [ ] Portal kann interne Datei weder listen noch per erratener ID signieren lassen.
- [ ] Mehrfachupload zeigt Fortschritt und Einzelfehler, ohne erfolgreiche Dateien zurückzurollen.
- [ ] ZIP-Limits werden vor teurer Verarbeitung geprüft.
- [ ] `unscanned` ist intern erkennbar; kein falsches Sicherheitsversprechen im Portal.
- [ ] Responsive, Keyboard, Fokus und beide Themes sind geprüft.

## Rollback

Dateimodule und Portalupload per Flag ausblenden. Cleanup und sichere Storage-Pipeline aus Ordner 14
bleiben aktiv; vorhandene Dateien bleiben erhalten.
