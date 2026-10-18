# Paket L – Vorschaubilder in Dateilisten (Portal und CRM)

Stand: 17.10.2026. Folgt auf [Paket K](../done/26-portal-dateien-layout/K-portal-files-layout.md) und ist noch nicht umgesetzt.

## Ziel

Bilder zeigen in der Dateiliste statt des Typ-Symbols eine kleine, komprimierte Vorschau. Das Vorschau-Panel aus
Paket K nutzt sie als Platzhalter, bis das Original geladen ist. Davon profitieren Portal-Dateien, das Dashboard-Widget
und die CRM-Dateiliste, weil alle `FileEntryRow` nutzen.

## Warum ein eigenes Paket

- Dateien liegen **privat** in Vercel Blob und sind nur über kurzlebige, signierte URLs erreichbar
  (`packages/storage/src/adapters/vercel-blob-storage.ts`). `next/image` kann diese URLs nicht optimieren. Das ist
  derselbe Grund wie im Kommentar in `FileLightbox`.
- Bilder dürfen bis **40 MB** groß sein (`UPLOAD_LIMIT_BY_KIND`). Würde die Liste die Originale laden, kämen bei
  25 Zeilen schnell über 100 MB zusammen. Am Handy wäre das untragbar (LCP, Datenvolumen).
- Sinnvoll ist deshalb nur eine **serverseitig erzeugte Kleinversion**: etwa 480 px lange Kante, WebP, Qualität 70,
  typisch 15–40 KB. 25 Zeilen kosten dann unter 1 MB und werden zusätzlich erst beim Hineinscrollen geladen
  (`loading="lazy"`).
- Dafür braucht es eine Migration, einen Speicher-Schreibweg, eine Bildbibliothek und ein Nachzieh-Skript. Diese
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
  - Ablauf: Original über `openReadStream` → `sharp().rotate().resize(480, 480, { fit: "inside", withoutEnlargement: true }).webp({ quality: 70 })` → `put(`${storage_key}.thumb.webp`)` → `thumbnail_key` über `updateVersioned` setzen.
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
  (etwa 2.75rem, `object-fit: cover`, `loading="lazy"`, `decoding="async"`, feste `width`/`height` gegen CLS). Bei
  `onError` (z. B. abgelaufene URL) fällt es auf das Symbol zurück. `alt=""`, weil der Name daneben steht.
- `FilePreviewPanel` / `FilePreviewStage` bekommen einen optionalen Platzhalter (`placeholderSrc`). Das Panel zeigt
  sofort die Kleinversion und blendet zum Original über, sobald es geladen ist.
- Das Dashboard-Widget `files` übernimmt das automatisch über `FileEntryRow`.

### 6. Bestand nachziehen

- Skript `apps/workspace/scripts/files-backfill-thumbnails.ts`: Es verarbeitet bereitstehende Bilddateien ohne
  `thumbnail_key` in Blöcken von 20 und nutzt dabei denselben Service.
  - Es ist idempotent und kann jederzeit erneut laufen.
  - Konsolenausgabe ist Englisch.
  - Es wird über ein `package.json`-Script gestartet.

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
  Datenmigration; verwaiste `.thumb.webp`-Objekte kann das Skript entfernen.
- Laufzeit und Speicher: `sharp` dekodiert ein 40-MB-JPEG in der Function. Das passiert über `after()` außerhalb der
  Antwortzeit. Bei Problemen läuft die Erzeugung nur noch über das Skript.
- **Env:** keine neuen Variablen. Der bestehende Blob-Token deckt `put` ab.

## Reihenfolge (kleine PRs)

1. Storage `put` und Migration `thumbnail_key`.
2. `file-thumbnail-service` mit Hook in beide Complete-Handler.
3. DTO-Feld, Mapper und UI-Zeile.
4. Panel-Platzhalter und Nachzieh-Skript.
