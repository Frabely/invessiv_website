# Ordner 15 — Dateiablage und Portaldownloads

> **Status:** offen · **Abhängigkeiten:** 12b, 14 · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–100 Dateien

> **Portal-Fundament (Neuzuschnitt 23.09.2026):** Seiten über `requirePortalActor(locale, customerId)`, Endpunkte über
> `withPortalActor`, jede Portal-Query über `portalAccessCondition`, jede Portal-Mutation über `portalCanOn` (alles
> aus Task 49). Eigene Portal-Permissions dieses Ordners, in `portal_standard` ergänzt: `portal.files.read` (freigegebene Dateien, Download), `portal.files.write` (Upload, Löschanfrage).
> Navigation: „Dateien“ (`/portal/[customerId]/files`) in `PORTAL_NAV_ITEMS` mit `requiredPermission`. Negativtests zusätzlich für fehlende
> Portal-Permission.

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

## Portal-Widget (aus Ordner 13)

Das Dashboard-Widget `files` („Dateien“, `openMode: dialog`) existiert seit Ordner 13 als Mock mit zwei Reitern in
der Widget-Registry (`PORTAL_WIDGET_LAYOUT`). Dieser Ordner stellt den Reiter **„Von uns“** auf echte Daten um: nur
explizit freigegebene Dateien mit Download. Der Reiter „Von Ihnen“ bleibt bis Ordner 15a Mock. Keine eigene
Dashboard-Karte außerhalb der Registry.

## Merge-Gate

- [ ] Portal-Widget `files` von Mock auf echte Daten umgestellt, Reiter „Von uns“ (Registry `mock: false` +
      `requiredPermission: portal.files.read`); ohne Permission fehlt es vollständig.
- [ ] Upload, Liste, Freigabe, Download, ZIP und Löschanfrage funktionieren als vollständiger Flow.
- [ ] Portal kann interne Datei weder listen noch per erratener ID signieren lassen.
- [ ] Mehrfachupload zeigt Fortschritt und Einzelfehler, ohne erfolgreiche Dateien zurückzurollen.
- [ ] ZIP-Limits werden vor dem ersten gelesenen Objekt geprüft; die Ablehnung ist eine
      Fehlerantwort, kein angefangener Stream.
- [ ] `maxDuration`, Zeitbudget und Archivgrenzen sind gemessen und im PR mit Zahlen begründet.
- [ ] Ein Archiv genau an beiden Grenzen läuft vollständig durch und bleibt im Zeitbudget.
- [ ] `unscanned` ist intern erkennbar; kein falsches Sicherheitsversprechen im Portal.
- [ ] Responsive, Keyboard, Fokus und beide Themes sind geprüft.

## Rollback

`portal.files.read`/`portal.files.write` aus `portal_standard` und eigenen Portalrollen nehmen; Navigationseintrag und Endpunkte verschwinden. Cleanup und sichere Storage-Pipeline aus Ordner 14
bleiben aktiv; vorhandene Dateien bleiben erhalten.
