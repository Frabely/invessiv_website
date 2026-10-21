# Paket L – Vorschaubilder in Dateilisten (Portal und CRM)

Stand: 21.10.2026. Folgt auf [Paket K](../done/26-portal-dateien-layout/K-portal-files-layout.md). Umgesetzt auf
`feat/portal-file-thumbnails` und nach `master` gemerged. Temporäre Backfill-Hilfen sind auf Nutzerwunsch entfernt;
Migration `0061` bleibt erhalten.

## Nacharbeiten aus dem Review (21.10.2026)

- Schreibrecht allein erzeugt keine signierte Vorschau-URL. Beim Bearbeiten werden Quell- und Ziel-Leserecht geprüft.
- Fehlende Storage-Konfiguration betrifft nur die Vorschau; Listen und Metadatenänderungen bleiben nutzbar.
- Unterstützte Bilder ohne Vorschau werden in geöffneten Listen höchstens fünfmal im Hintergrund nachgeladen
  (Wartezeiten 1/2/4/8/15 Sekunden). Pagination, Auswahl und zwischenzeitliche Metadatenänderungen bleiben erhalten.
  HEIC, SVG und andere nicht unterstützte Formate lösen keine Nachladeversuche aus.
- Auch der erste DB-Read der automatischen Erzeugung fällt unter die kontrollierte Fehlerbehandlung.
- Die reine Zieldefinition liegt in `packages/common/src/constants/database/database-target.ts`.
- Explizite Read-Write-Tokens haben im Storage-Adapter Vorrang vor automatisch erkannten OIDC-Anmeldungen.
  Ohne Read-Write-Token bleibt die OIDC-Anmeldung über das SDK erhalten.

## Einmaliger Backfill und Cleanup

Die temporären Backfill-Hilfen wurden am 21.10.2026 auf Nutzerwunsch entfernt: Skript, Konfigurationshelfer samt
Tests, Package-Command, App-DevDependency `tsx` und die Batch-Methode im Thumbnail-Service. Die Zielwahl der normalen
DB-Skripte liegt wieder in `packages/db/scripts/database-target.ts`; deren Verhalten bleibt erhalten.

Neue Uploads erzeugen ihre Vorschaubilder automatisch. `sharp`, Migration `0061`, `thumbnail_key` und bereits
gespeicherte Vorschauen bleiben bestehen. Der Cleanup führt keine DB-Migration aus und verändert keine Blob-Objekte.
Er bestätigt keinen separat ausgeführten Deployment- oder Backfill-Lauf.

## Abweichungen in der Umsetzung (Entscheidungen 20.10.2026)

- **160 px statt 480 px** (Performance): Die Zeile zeigt 36 px, 160 px reichen bis 3x-Dichte. Eine Seite mit 25 Zeilen
  liegt so unter 200 KB. Im Panel wirkt die Vorschau bis zum Original kurz weich; sie ist dort leicht weichgezeichnet.
- **Stabile URLs für den Browser-Cache:** `signUrls` rundet den Ablauf auf ein 2-Minuten-Raster (Restlaufzeit 3–5 min,
  TTL unverändert). Das Objekt trägt ein Jahr `Cache-Control`, die Download-URL nutzt den CDN-Cache
  (`StorageDownloadOptions.cacheable`). Der Schlüssel hängt am unveränderlichen Original.
- **`thumbnail_key` ohne Versionssprung:** technisches `UPDATE … WHERE id, storage_key, ready, nicht verwaist,
thumbnail_key IS NULL/gleich` statt `updateVersioned`. Sonst liefe ein Bearbeiten direkt nach dem Upload in einen
  unnötigen 409. Ist die Zeile inzwischen weg, löscht der Service das Objekt wieder.
- **Gemeinsame `FileThumbnail`** in `packages/ui`: `FileEntryRow` (CRM), das Portal-Dashboard-Widget und die Portal-Tabelle
  (`PortalFileTableRow`, seit Paket M) nutzen sie. Größe wie das Typ-Symbol (2.25rem), damit Namen bündig bleiben.
- **`put` überschreibt** (`allowOverwrite: true`), damit ein erneuter Lauf nach verlorenem DB-Write nicht scheitert.
- **Schreibantworten:** `updateFile` signiert mit Quell- und Ziel-Leserecht die Vorschau mit (der Client ersetzt die Zeile durch die Antwort);
  Anlegen, Abschluss und Konfliktantwort liefern `null`.
- **Kein Bereinigungsjob vorhanden:** `remove` löscht Vorschau und Original; eine als verwaist markierte Zeile behält
  beide Schlüssel für einen späteren Lauf.
- `sharp` liest Stream-Eingaben ohnehin komplett ein; der Service puffert das Original deshalb direkt.

## Ziel

Bilder zeigen in der Dateiliste statt des Typ-Symbols eine kleine, komprimierte Vorschau. Das Vorschau-Panel aus
Paket K nutzt sie als Platzhalter, bis das Original geladen ist. Davon profitieren Portal-Dateien, das Dashboard-Widget
und die CRM-Dateiliste über die gemeinsame `FileThumbnail`-Darstellung.

## Warum ein eigenes Paket

- Dateien liegen **privat** in Vercel Blob und sind nur über kurzlebige, signierte URLs erreichbar
  (`packages/storage/src/adapters/vercel-blob-storage.ts`). `next/image` kann diese URLs nicht optimieren. Das ist
  derselbe Grund wie im Kommentar in `FileLightbox`.
- Bilder dürfen bis **40 MB** groß sein (`UPLOAD_LIMIT_BY_KIND`). Würde die Liste die Originale laden, kämen bei
  25 Zeilen schnell über 100 MB zusammen. Am Handy wäre das untragbar (LCP, Datenvolumen).
- Sinnvoll ist deshalb eine **serverseitig erzeugte Kleinversion**: maximal 160 px lange Kante, WebP, Qualität 70.
  Die kleinen Vorschaubilder werden zusätzlich erst beim Hineinscrollen geladen
  (`loading="lazy"`).
- Dafür braucht es eine Migration, einen Speicher-Schreibweg, eine Bildbibliothek und eine einmalige Bestandsnacharbeit. Diese
  Backend-Änderung soll als eigener PR prüfbar sein.

## Umfang

### 1. Datenmodell (`packages/db`)

- Migration: Die Tabelle der Dateien (`record-configuration/crm/files.ts`) bekommt `thumbnail_key text null`.
  `null` heißt: keine Vorschau, die UI zeigt das Symbol. Kein Default, kein Index (gelesen wird nur je Zeile).
- Modell und Migration bleiben deckungsgleich (Regel in `packages/db/AGENTS.md`).
- `FileRow` und die Mapper übernehmen das Feld.

### 2. Speicher (`packages/storage`)

- `StorageAdapter` bekommt `put(key, body: Uint8Array, options: { contentType })`.
- Umsetzung im Vercel-Adapter mit `put` aus `@vercel/blob` (`access: "private"`, `addRandomSuffix: false`), im
  In-Memory-Adapter und im Contract-Test (`storage-contract.test.ts`).
- Fehler laufen wie bisher über `safe()`, damit keine signierten URLs oder Tokens nach außen gelangen.

### 3. Erzeugung (`apps/workspace/src/server/shared/files/`)

- Neuer Service `file-thumbnail-service.ts`, der Portal und CRM gemeinsam dient (deshalb `server/shared`):
  - nur für `assetKind = image` mit `png`, `jpg`, `jpeg` und `webp`;
  - **HEIC/HEIF nicht**, weil das vorgebaute `sharp` sie nicht liest; dort bleibt das Symbol;
  - **SVG nicht**, weil das Original im `<img>` ohnehin klein und sicher ist;
  - Ablauf: Original über `openReadStream` → `sharp().rotate().resize(160, 160, { fit: "inside", withoutEnlargement: true }).webp({ quality: 70 })` → `put(`${storage_key}.thumb.webp`)` → `thumbnail_key` über das abgesicherte technische Update setzen.
  - `sharp` entfernt EXIF-Daten. Die Vorschau trägt damit **keine GPS-Position** der Handyfotos weiter (Privacy-Plus).
- **Zeitpunkt:** nach dem Commit von `completeUpload`, in den Complete-Handlern von Portal
  (`complete-portal-file-upload.command-handler.ts`) und CRM (`complete-file-upload.command-handler.ts`), über `after()`
  aus `next/server`. Die Antwort an den Uploader wartet also nicht auf die Bildberechnung.
- **Fehler:** Die Datei bleibt ohne Vorschau. Geloggt wird nur ein strukturiertes Event mit Datei-ID und Fehlercode,
  ohne Dateinamen (keine PII).
- **Löschen:** `fileObjectService.remove` und die Orphan-Bereinigung löschen `thumbnail_key` mit.
- **Abhängigkeit:** `sharp` wird ausdrücklich in `apps/workspace/package.json` aufgenommen. Es liegt schon transitiv
  über Next vor (0.34.5); Next führt es standardmäßig als Server-External.

### 4. Ausliefern (DTOs)

- `FileDto` und `PortalFileDto` bekommen `thumbnailUrl: string | null` mit Docstring. Inhalt: eine signierte
  Inline-URL mit `DOWNLOAD_URL_TTL_MS`, erzeugt im List-Mapper **nach** dem Sichtbarkeitsfilter. Eine Vorschau ist
  damit genau so sichtbar wie das Original.
- Das Presigning läuft bei Vercel Blob lokal, nach einmaligem Token. 25 URLs je Seite kosten keine zusätzlichen
  Requests.
- Stores mit `ProxyRequired` liefern `null`, dann erscheint das Symbol.

### 5. UI (`packages/ui`)

- `FileEntryRow`: Mit `thumbnailUrl` erscheint an der Stelle des `FileKindIcon` ein quadratisches Vorschaubild
  (2.25rem, `object-fit: cover`, `loading="lazy"`, `decoding="async"`, feste `width`/`height` gegen CLS). Bei
  `onError` (z. B. abgelaufene URL) fällt es auf das Symbol zurück. `alt=""`, weil der Name daneben steht.
- `FilePreviewPanel` / `FilePreviewStage` bekommen einen optionalen Platzhalter (`placeholderSrc`). Das Panel zeigt
  sofort die Kleinversion und blendet zum Original über, sobald es geladen ist.
- Das Dashboard-Widget `files` bindet dieselbe `FileThumbnail`-Komponente direkt ein.

### 6. Bestand nachziehen

Die einmalige Backfill-Implementierung ist nach dem Cleanup entfernt. Neue Uploads nutzen weiterhin den gemeinsamen Thumbnail-Service.

## Nicht im Umfang

- Vorschaubilder für PDFs (erste Seite) und Videos (Standbild). Dafür bräuchte es zusätzlich ein PDF-Rendering bzw.
  `ffmpeg`. Das wäre später als Erweiterung desselben Services möglich.

## Tests

- Contract-Test für `put` (In-Memory und Vercel-Adapter wie die bestehenden Fälle).
- Unit-Test `file-thumbnail-service`:
  - kleines PNG/JPEG-Fixture ergibt eine WebP-Kleinversion mit EXIF entfernt und gesetztem `thumbnail_key`;
  - HEIC und SVG werden übersprungen;
  - ein Fehler beim Schreiben lässt die Datei unverändert.
- Mapper-Tests: `thumbnailUrl` nur für sichtbare Dateien mit `thumbnail_key`, sonst `null`.
- `FileEntryRow`: Bild statt Symbol und Rückfall bei `onError`. Panel: Platzhalter vor dem Original.
- `db:smoke:crm` für die Migration. Optional die Live-Blob-E2E (`E2E_LIVE_BLOB=true`): Upload eines JPG → die Zeile
  zeigt ein Vorschaubild.

## Risiko und Rollback

- Die Spalte ist nullable, die UI fällt ohne Wert auf das Symbol zurück. Ein Rollback des Codes braucht keine
  Datenmigration. Die Thumbnail-Erzeugung entfernt keine bereits verwaisten
  Objekte; ein solcher Bereinigungsjob ist nicht umgesetzt.
- Laufzeit und Speicher: `sharp` dekodiert ein 40-MB-JPEG in der Function. Das passiert über `after()` außerhalb der
  Antwortzeit. Bei Fehlern bleibt die Datei ohne Vorschau nutzbar; Datei-ID und Fehlercode werden protokolliert.
- **Env:** keine neuen Variablen. Der bestehende Blob-Token deckt `put` ab.

## Reihenfolge (kleine PRs)

1. Storage `put` und Migration `thumbnail_key`.
2. `file-thumbnail-service` mit Hook in beide Complete-Handler.
3. DTO-Feld, Mapper und UI-Zeile.
4. Panel-Platzhalter und einmalige Bestandsnacharbeit (temporäre Hilfen anschließend entfernt).
