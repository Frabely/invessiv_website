# Task 82 — Screenshot am Portal-Hinweis

> **Ordner:** 31 (Teil 31.2) · **Branch:** `feat/crm-portal-hinweise-2-screenshot` · **Status:** offen ·
> **Abhängigkeit:** Task 81 gemergt · **Dateien:** ≈ 35–50 · **Fachliche Regeln:** [`README.md`](./README.md)

## Ziel

Ein Portal-Hinweis kann optional genau ein Bild tragen, z. B. einen Screenshot der Fehlermeldung oder einen
Ausschnitt mit dem betroffenen Bereich. Intern wird es im Hinweis-Dialog hochgeladen, ersetzt oder entfernt. Im
Portal erscheint es als Vorschaubild im Widget und öffnet sich im Vollbild.

## Warum nicht `files`

`files.customer_id` ist `NOT NULL`, und `createFileStorageKey` erzeugt immer `customers/<customerId>/…`. Ein Hinweis
für alle Kunden gehört keinem Kunden. Eine nullable `customer_id` in `files` würde jede bestehende Dateiabfrage und
die Portal-Dateiliste berühren. Deshalb bekommt der Hinweis eine eigene Kindtabelle und ein eigenes Key-Präfix.
Wiederverwendet werden Storage-Adapter, Validierung und Upload-Transport.

## T1 — Schema

- `packages/db/migrations/00NN_create_portal_notice_images.sql` (Nummer im Repo ermitteln):
  - Tabelle `portal_notice_images`: `id uuid PK`,
    `notice_id uuid NOT NULL REFERENCES portal_notices(id)`, `storage_key text`, `status text`
    (`pending` | `ready`), `content_type text`, `byte_size integer`, `original_filename text`,
    `orphaned_at timestamptz NULL`, `created_by_user_id`, `created_at`.
  - Benannte CHECKs für Status, Content-Type-Liste und Größenlimit.
  - Partial-Unique-Index `portal_notice_images_one_ready_per_notice_idx ON (notice_id) WHERE status = 'ready'
AND orphaned_at IS NULL`.
- Drizzle-Modell, Constraint-Namen und Barrel wie in Task 81. Seed: Der globale Beispielhinweis bekommt kein Bild,
  damit beide Zustände prüfbar bleiben.

## T2 — Common

- `createPortalNoticeImageStorageKey(noticeId, imageId, filename)` in `packages/common/src/patterns/files/`, mit
  UUID-Prüfung und `sanitizeFilename` wie `createFileStorageKey`. Das Präfix lautet `portal-notices/`.
- `constants/crm/portal-notice-image-limits.ts`: erlaubte Typen `image/png`, `image/jpeg` und `image/webp`,
  höchstens 5 MB.
- DTOs: `PortalNoticeImageDto` (intern) und ein optionales `image`-Feld in `PortalNoticeDto`, das nur
  `{ url, alt }` und keinen Storage-Key enthält.

## T3 — Server

- `apps/workspace/src/server/workspace/crm/services/portal-notice-image-service.ts`:
  - `issueUpload`: legt eine `pending`-Zeile an und signiert die Upload-URL über `storageService.getAdapter()`.
  - `completeUpload`: `head` plus `fileValidationService.validate`, wobei die tatsächlichen Bytes gegen die erlaubten
    Bildtypen geprüft werden. Danach in einer Transaktion: neue Zeile auf `ready`, die alte `ready`-Zeile wird mit
    `orphaned_at` markiert.
  - Danach wird der alte Blob gelöscht und erst dann die alte Zeile entfernt. Schlägt das Löschen fehl, bleibt
    `orphaned_at` gesetzt, und ein erneuter Aufruf räumt auf.
  - `remove`: dieselbe Reihenfolge für das Entfernen ohne Ersatz.
  - Abgebrochene `pending`-Uploads werden wie bei `files` über `cancel` aufgeräumt.
- Command-Handler für Upload-Start, Abschluss, Abbruch und Entfernen. Jeder prüft `portal_notices.write`.
- Interner Vorschau-Query-Handler (`portal_notices.read`).
- Portal-Query-Handler `get-portal-notice-image.query-handler.ts`: nimmt einen `PortalReader` und liefert das Bild
  nur, wenn der Hinweis für diesen Reader **jetzt** sichtbar ist. Dafür nutzt er dieselbe Sichtbarkeitsbedingung wie
  `list-portal-notices`, als gemeinsamer Helfer und nicht kopiert. Sonst `not_found`.

## T4 — Routen und Client

- Intern unter `src/app/api/workspace/crm/portal-notices/[id]/image/`: `upload` (POST), `complete` (POST),
  `cancel` (POST), `route.ts` (DELETE) und `preview` (GET, Stream).
- Portal: `src/app/api/portal/[customerId]/notices/[noticeId]/image/route.ts` mit `privateFileResponse`,
  `withPortalReader` und Stream über `fileDownloadResponse`, nach dem Muster
  `src/app/api/portal/[customerId]/files/[fileId]/download/route.ts`. Inline-Disposition, kein öffentlicher
  Blob-Link.
- Endpunkte in `api-endpoints.ts` und Regeln in `crm-endpoint-access-rules.ts`.
- Client: `portal-notices-api-service.ts` um die Bildmethoden erweitern. Der Upload läuft über
  `src/client/shared/storage-transfer.ts`.

## T5 — UI

- Formdialog: Bildfeld mit Auswahl, Fortschritt, Vorschau, „Ersetzen“ und „Entfernen“. Fehlerzustände für falschen
  Typ, zu groß und Abbruch. Ein Alternativtext ist optional und fällt sonst auf den Hinweistitel zurück.
- Portal-Widget: Vorschaubild rechts neben dem Text (mobil darunter) über `next/image` bzw. die bestehende
  Vorschau-Mechanik. Ein Klick öffnet `FileLightbox` aus `packages/ui`, per Tastatur erreichbar, mit sichtbarem
  Fokus.
- Die Vorschau im internen Dialog zeigt das Bild ebenfalls.
- DE/EN-Texte für Upload, Fehler und Alt-Fallback ergänzen.

## T6 — Tests

- Unit: Key-Helfer (UUID-Ablehnung, Präfix), Limits, Service-Reihenfolge (Blob vor DB-Zeile, wiederholbar nach
  Fehler).
- Routen: 403 ohne write; Portal-Bild 404 für fremden Kunden, `draft`, `resolved`, außerhalb des Zeitraums und
  unbekannte ID.
- Integration: Ersetzen lässt genau eine `ready`-Zeile übrig; ein Validierungsfehler lässt keinen `ready`-Eintrag
  zurück.
- Komponenten: Upload-Feld in allen Zuständen, Widget mit und ohne Bild, Lightbox per Tastatur.
- E2E-Erweiterung von `portal-notices.e2e.ts`: Bild hochladen → im Portal sichtbar und vergrößerbar.

## Abnahme

Alle Merge-Gates aus der README, inklusive der mit „(31.2)“ markierten. Außerdem eine Sichtprüfung des Widgets mit
Hoch- und Querformat-Screenshot in Dark und Light.
