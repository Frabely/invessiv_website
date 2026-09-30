# Ordner 14 — Dateien, Links und Portal-Dateien

> **Status:** gemerged; Review-Nachbesserung auf `fix/crm-files-review` · **Abhängigkeiten:** 07, 12a, 12b, 13, 13a · **Aufwand:** 12–16 Tage gesamt ·
> **Reviewziel:** sechs Teil-PRs mit je 25–90 Dateien

> **Neuzuschnitt 28.09.2026 (mit dem Owner abgestimmt):** Ersetzt die Ordner `14-storage-und-upload`,
> `15-dateien-und-portal-downloads` und `15a-medien-und-portal-upload` (Task 13, 14, 15, 16, 43). Alle Formate
> (Dokument, Bild, Video, Schrift, Link) entstehen in einem Rutsch. Abweichungen von früheren Entscheidungen stehen in
> Abschnitt „Geänderte Entscheidungen“.

> **Portal-Fundament:** Seiten über `requirePortalActor(locale, customerId)`, Endpunkte über `withPortalActor`, jede
> Portal-Query über `portalAccessCondition`, jede Portal-Mutation über `portalCanOn` (Task 49). Eigene
> Portal-Permissions dieses Ordners, in `portal_standard` ergänzt: `portal.files.read` (sichtbare Dateien und Links,
> Vorschau, Download, ZIP) und `portal.files.write` (eigene Uploads und Links). Navigation: „Dateien“
> (`/portal/[customerId]/files`) in `PORTAL_NAV_ITEMS` mit `requiredPermission`.

## Bewusste Ausnahme: ein Ordner, sechs Merge-Einheiten

Die Regel „ein Ordner = ein PR“ (`plans/crm/AGENTS.md`) gilt hier **nicht**. Auf Wunsch des Owners liegt der gesamte
Dateibereich in einem Ordner, wird aber in sechs Teil-PRs geliefert, damit jede Einheit klein, testbar und einzeln
mergebar bleibt. Jede Teil-Einheit hat einen eigenen Branch, einen eigenen PR, einen eigenen Status in der Tabelle
unten und hält `master` deploybar. Reine Fundamente bleiben unsichtbar; sichtbare Funktionen werden vertikal
vollständig geliefert.

| PR   | Task | Branch                             | Datei                                                                      | Nach Merge sichtbar          | Dateien | Umsetzung       | Status   |
| ---- | ---- | ---------------------------------- | -------------------------------------------------------------------------- | ---------------------------- | ------: | --------------- | -------- |
| 14.1 | 51   | `feat/crm-dateien-1-fundament`     | [`51-storage-fundament.md`](./51-storage-fundament.md)                     | nichts                       |   40–60 | GPT · max       | gemerged |
| 14.2 | 52   | `feat/crm-dateien-2-datenmodell`   | [`52-datenmodell-und-interne-api.md`](./52-datenmodell-und-interne-api.md) | nichts (API ohne Aufrufer)   |   60–90 | GPT · max       | gemerged |
| 14.3 | 53   | `feat/crm-dateien-3-interne-ui`    | [`53-drop-zone-und-interne-ui.md`](./53-drop-zone-und-interne-ui.md)       | interner Dateibereich        |   70–90 | Claude · max    | gemerged |
| 14.4 | 54   | `feat/crm-dateien-4-zip`           | [`54-mehrfachauswahl-und-zip.md`](./54-mehrfachauswahl-und-zip.md)         | Mehrfachauswahl + ZIP intern |   25–40 | GPT · mittel    | gemerged |
| 14.5 | 55   | `feat/crm-dateien-5-portal`        | [`55-portal-dateien.md`](./55-portal-dateien.md)                           | Dateien im Kundenportal      |   60–90 | Claude · max    | gemerged |
| 14.6 | 56   | `feat/crm-dateien-6-chat-anhaenge` | [`56-chat-anhaenge.md`](./56-chat-anhaenge.md)                             | Anhänge in beiden Chats      |   35–55 | Claude · mittel | gemerged |

**Umsetzung (Modell · Variante):** Empfehlung, welches Modell die Teil-PR umsetzt und mit welcher Denkstufe.

- **GPT** für klar spezifizierte Backend- und Algorithmik-Arbeit: Adapter-Contract, Binärsignaturen,
  ZIP-Central-Directory, Migration mit vielen CHECK-Constraints, Autorisierungs- und Negativtests, Streaming-ZIP.
- **Claude** für UI-lastige und querschnittliche Arbeit: Extraktion und Redesign der Drop-Zone mit Umstellung des
  Lead-Imports, Upload-Warteschlange, Lightbox, Portalseite mit Copy (`frontend-design`, `copywriting`),
  Einbindung in den bestehenden Chat.
- **max** bei sicherheitskritischen oder breit wirkenden Einheiten (Dateiprüfung, Rechte, Portal-Fremdzugriff,
  Refactoring bestehender Komponenten); **mittel** bei kleinen, eng umrissenen Einheiten auf fertigem Fundament.
  14.6 bleibt trotz „mittel“ an der Freigabe-beim-Senden sicherheitsrelevant — die zugehörigen Negativtests sind
  Pflicht und werden im Review gezielt geprüft.
- Review jeder Teil-PR durch das jeweils **andere** Modell.

Betriebs-Checkliste für Vercel und Environment: [`VERCEL-SETUP.md`](./VERCEL-SETUP.md). Sie muss vor dem Merge von
14.2 (erste Nutzung in Preview) erledigt sein.

Task 51 ist in seiner [Umsetzungs- und Übergabedokumentation](./51-storage-fundament.md) beschrieben.
Task 52 ist in seiner [Umsetzungs- und Übergabedokumentation](./52-datenmodell-und-interne-api.md) beschrieben.
Task 53 ist in seiner [Umsetzungs- und Übergabedokumentation](./53-drop-zone-und-interne-ui.md) beschrieben.
Task 54 ist in seiner [Umsetzungs- und Übergabedokumentation](./54-mehrfachauswahl-und-zip.md) beschrieben.
Task 55 ist in seiner [Umsetzungsdokumentation](./55-portal-dateien.md) beschrieben.
Task 56 ist in seiner [Umsetzungsdokumentation](./56-chat-anhaenge.md) beschrieben.

## Review-Nachbesserung auf `fix/crm-files-review`

- Intern angehängte Dateien erhalten vor dem Senden einen expliziten Freigabedialog. Abbrechen erhält Entwurf und
  Anhänge; ein Browser-Test prüft, dass dabei keine Sendeanfrage entsteht und der bestätigte Versand den Link im Portal
  sichtbar macht.
- ZIP-Downloads nutzen nach einer autorisierten Vorprüfung einen nativen Download. Der Browser sammelt das Archiv nicht
  mehr über `response.blob()` im JavaScript-Speicher; die Download-Route prüft Berechtigung und Auswahl erneut. Ein
  gleichoriginiger Download-Frame meldet auch Fehler nach der Vorprüfung an die UI. Der Live-Test prüft die ZIP-Einträge
  und deren Inhalt sowie diesen späteren Fehlerfall.
- Aktive Uploads warnen bei Seitenwechsel über Links, auch bei geändertem Query-Parameter, Browser-Zurück und beim
  Verlassen des Dokuments. Der modale Upload-Dialog verhindert sein Schließen während des Transfers.
- Der opt-in Browser-Test mit `E2E_LIVE_BLOB=true` prüft gegen den privaten Development-Store den echten internen
  Upload, zunächst gesperrten Portalzugriff, Freigabe, Einzel- und ZIP-Download sowie einen Kunden-Upload. Die
  Testdatenbereinigung entfernt die zugehörigen Blob-Objekte und Activities vor alten E2E-Kunden; ein fehlgeschlagenes
  Blob-Löschen bricht die Bereinigung ab, damit die Datenbankreferenz erhalten bleibt.
- Lokale Gates: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm` und
  `pnpm --filter @invessiv/workspace build` grün. Die Preview-Abnahme auf Mobilgeräten und in beiden Themes bleibt offen.

## Ziel und Stand nach Abschluss

- Intern: Dateien und Links je Kunde und Projekt hochladen bzw. anlegen, mit Notiz versehen, einem Projekt zuordnen,
  für den Kunden sichtbar oder intern halten, in der Lightbox ansehen, einzeln oder als ZIP laden, löschen.
- Portal: Der Kunde sieht, was wir freigegeben haben („Von uns“), und seine eigenen Uploads und Links („Von dir“),
  lädt einzeln oder als ZIP, lädt vom Handy Fotos, Videos, Logos und Dokumente hoch oder hinterlegt einen Link.
- Chat: 📎 im Composer beider Seiten, Anhänge als Verweise auf Dateien.
- Speicherort austauschbar: Domänencode kennt nur `StorageAdapter` und Storage-Keys; Vercel Blob ist eine Datei.

## Getroffene Entscheidungen

### Umfang

| Bereich          | Entscheidung                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Enthalten        | Upload, Links, Liste, Filter, Suche, Lightbox, Sichtbarkeit, Notiz, Projektzuordnung, Löschen (intern), ZIP, Portal, Chat                    |
| Kunde entfernt   | **Nichts.** Kein Löschen, kein Bearbeiten im Portal, auch nicht bei eigenen Uploads. Fehler klärt der Chat                                   |
| „Neu“-Markierung | Nicht enthalten (folgt ggf. mit Benachrichtigungen in 20c)                                                                                   |
| Rasteransicht    | Nicht enthalten. Liste mit Typ-Symbolen; Bildvorschau über die Lightbox. Clientseitig erzeugte Thumbnails sind ein späterer, eigener Schritt |
| Nicht enthalten  | Versionen, Ordner, Kategorien, Kommentare pro Datei, Bildannotation, serverseitige Konvertierung, Malware-Scanner, SHA-256                   |
| Vercel-Plan      | Pro. Limits wie unten; Spend-Management-Alarm Pflicht (siehe Setup)                                                                          |

### Formate und Limits

Einzige Quelle: `UPLOAD_LIMIT_BY_KIND` in `packages/common/src/constants/files/` — genutzt von Browser-Vorprüfung,
Upload-Route, CDN-Beschränkung der presigned PUT-URL und Finalisierung.

Limits gelten **je Endung** (die Art gruppiert nur Vorschau und Filter). Geprüft am 28.09.2026 gegen typische
reale Dateigrößen:

| Art (`asset_kind`) | Endung               |  Limit | Begründung (typische Größe)                                    | Vorschau im Browser                                     |
| ------------------ | -------------------- | -----: | -------------------------------------------------------------- | ------------------------------------------------------- |
| `document`         | pdf                  | 100 MB | Verträge < 5 MB, Brand-Guidelines mit Bildern 30–150 MB        | iframe                                                  |
| `document`         | pptx                 | 100 MB | normal < 20 MB, Decks mit Medien 50–200 MB                     | nur Download                                            |
| `document`         | docx, xlsx           |  50 MB | fast immer < 20 MB                                             | nur Download                                            |
| `document`         | txt, csv             |  10 MB | KB bis wenige MB; größere Textdateien frieren die Vorschau ein | Klartext (nie HTML), nur bis 1 MB; darüber Download     |
| `image`            | png, jpg, jpeg, webp |  40 MB | Handy 2–5 MB, Systemkamera 10–25 MB, PNG-Mockups bis 30+ MB    | `<img>`                                                 |
| `image`            | heic, heif           |  40 MB | 1–5 MB                                                         | Dateikachel                                             |
| `image`            | svg                  |   5 MB | Logos KB, Illustrationen mit Raster wenige MB                  | nur `<img>`; Download immer `attachment`                |
| `video`            | mp4, mov, webm       | 200 MB | ≈ 1 Min. 4K bzw. ≈ 3 Min. 1080p vom iPhone                     | mp4/webm `<video>`; mov als Download (meist nur Safari) |
| `font`             | otf, ttf, woff2      |  10 MB | 20 KB–2 MB                                                     | keine; nur Download                                     |
| `link`             | —                    |      — | —                                                              | keine; Server ruft die URL nie ab                       |

- Upload immer als **ein** presigned PUT (kein Multipart). Bewusste Entscheidung des Owners: Videos über 200 MB
  (längere 4K-Clips, Imagefilme) laufen über einen Link. Bricht ein Upload ab, startet er neu. Multipart wäre ein
  späterer, additiver Ausbau des Adapters (Start/Teile/Abschluss), den S3, R2 und MinIO ebenfalls unterstützen.
- **Content-Type kommt vom Server, nie vom Browser.** Browser melden Typen uneinheitlich (Windows: `.csv` als
  `application/vnd.ms-excel`; HEIC und Schriften oft leer). Die Upload-Route leitet den normalisierten Typ aus der
  Endung ab, schreibt ihn in die presigned PUT-URL (`allowedContentTypes`), und der Client sendet genau diesen Typ.
- Dauerhaft ausgeschlossen: html/htm, Archive (zip, rar, 7z …), Makro- und alte Binär-Office-Formate (doc, xls, ppt,
  docm, xlsm, pptm …), rtf, ausführbare Dateien, Audio, psd/ai/eps, tif/tiff, gif, avif, odt/ods/odp.
- Sammelupload: höchstens 20 Dateien und 1 GB je Vorgang (20 Fotos à 40 MB müssen passen; das Vorgangslimit liegt
  immer über dem größten Einzellimit). Browser erzwingt es; der Server begrenzt zusätzlich die Zahl gleichzeitig
  offener `pending`-Uploads je Actor.
- Größere Dateien laufen über einen Link.

### Datenmodell (Ansatz A: eine Tabelle)

Dateien und Links liegen in **einer** Tabelle `files`. Sichtbarkeit, Notiz, Scope, Zuordnung, Portalfilter und
Chat-Anhänge existieren dadurch genau einmal.

```txt
files
  id                                uuid PK
  customer_id                       uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id                        uuid NULL; FK (project_id, customer_id) → projects (id, customer_id)
  feedback_round_id                 uuid NULL, reserviert; FK, `feedback_item_id` und Scope-Regeln kommen in Ordner 16 (Task 58)
  source                            text NOT NULL  CHECK in FILE_SOURCE_VALUES ('upload','link')
  status                            text NOT NULL  CHECK in FILE_STATUS_VALUES ('pending','ready')
  asset_kind                        text NOT NULL  CHECK in ASSET_KIND_VALUES ('document','image','video','font','link')
  display_name                      text NOT NULL  CHECK (btrim <> '')      Originaldateiname bzw. Linkbezeichnung
  note                              text NULL      CHECK (length <= 200)
  visible_to_customer               boolean NOT NULL
  uploaded_by_side                  text NOT NULL  CHECK in UPLOAD_SIDE_VALUES ('internal','customer')
  uploaded_by_member_id             uuid NULL → workspace_members.id
  uploaded_by_portal_membership_id  uuid NULL → portal_memberships.id
  storage_key                       text NULL UNIQUE
  content_type                      text NULL      normalisiert, nicht der rohe Clientwert
  extension                         text NULL
  size_bytes                        bigint NULL    CHECK (> 0)
  inspection_status                 text NULL      CHECK in FILE_INSPECTION_STATUS_VALUES; v1 immer 'unscanned'
  url                               text NULL      CHECK (url LIKE 'https://%' AND length(url) <= 2048)
  orphaned_at                       timestamptz NULL   Storage-Löschung fehlgeschlagen
  version                           integer NOT NULL CHECK (> 0)
  created_at, updated_at            timestamptz NOT NULL
```

Constraints:

- `source = 'upload'` ⇔ `storage_key`, `content_type`, `extension`, `size_bytes`, `inspection_status` gesetzt und
  `url IS NULL`; `source = 'link'` ⇔ umgekehrt, zusätzlich `asset_kind = 'link'` und `status = 'ready'`.
- `asset_kind = 'link'` ⇔ `source = 'link'`.
- Genau eine Uploader-Spalte gesetzt (`num_nonnulls(...) = 1`), passend zu `uploaded_by_side`.
- `uploaded_by_side = 'customer'` ⇒ `visible_to_customer = true` (wie Kundenaufgaben).
- Indizes: `(customer_id, created_at desc) WHERE status = 'ready'`, `(project_id) WHERE project_id IS NOT NULL`,
  `(customer_id) WHERE visible_to_customer AND status = 'ready'`, `(status, created_at) WHERE status = 'pending'`
  (Aufräumjob in 20c).

Regeln:

- Keine Kategorie-Spalte. Die Einordnung wird abgeleitet: „Vom Kunden“ (`uploaded_by_side = customer`),
  „Freigegeben“ (intern + sichtbar), „Intern“ (intern + nicht sichtbar); später „Feedback“ über `feedback_round_id`.
- Interne Uploads sind standardmäßig **nicht** sichtbar; der Upload-Dialog hat einen Schalter, vorbelegt aus.
- Intern änderbar, versioniert über `updateVersioned`, je Änderung eine Activity: Sichtbarkeit (nur interne
  Einträge), Notiz, Projektzuordnung (inkl. „kundenweit“). Die Zuordnung ist eine reine DB-Änderung, weil der Key
  kein Projekt enthält.
- Keine Upload-Session-Tabelle: `ticket` legt eine `pending`-Zeile an, `complete` setzt `ready`. Doppeltes `complete`
  ist über den Statusübergang idempotent. Alle Listen, Portal- und Downloadpfade lesen nur `ready`.
- Nie finalisierte `pending`-Zeilen und ihre Objekte räumt der idempotente Job aus Ordner 20c nach 24 Stunden auf.
  Bis dahin sind sie unsichtbar und stören nicht.
- Erfolgreiche Dateien werden nie automatisch gelöscht.

### Storage-Paket `packages/storage`

App-neutral, ohne DB, ohne Domänen- und Portalwissen.

```ts
interface StorageAdapter {
  createUploadUrl(key, { contentType, maxBytes, expiresAt }): Promise<{ url; method; headers }>;
  head(key): Promise<{ size: number; contentType: string } | null>;
  readRange(key, start, endInclusive): Promise<Uint8Array>;
  createDownloadUrl(key, { expiresAt, disposition: "inline" | "attachment", filename }): Promise<string>;
  openReadStream(key): Promise<ReadableStream<Uint8Array>>;
  delete(key): Promise<void>; // idempotent: fehlendes Objekt gilt als gelöscht
}
```

| Bereich            | Entscheidung                                                                                                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Austauschbarkeit   | Nur Operationen, die jeder Objektspeicher kann (Blob, S3, R2, MinIO). Neuer Anbieter = ein Adapter + Fabrikeintrag                                                                                                                                                   |
| Vercel-Adapter     | Einzige Datei mit `@vercel/blob` (>= 2.3); **privater Store**; `issueSignedToken` wird bis kurz vor Ablauf gecacht; `presignUrl` für PUT und GET                                                                                                                     |
| In-Memory          | Nur für Tests; gemeinsamer Vertragstest läuft gegen In-Memory und gemockten Vercel-Adapter                                                                                                                                                                           |
| Lokale Entwicklung | Kein Dateisystem-Adapter. Lokal wird der Preview-Store per `vercel env pull` genutzt                                                                                                                                                                                 |
| Fabrik             | `STORAGE_PROVIDER`; fehlt die Konfiguration in Production, gibt es einen klaren Konfigurationsfehler, keinen stillen Fallback                                                                                                                                        |
| Key-Schema         | `customers/<customerId>/<fileId>/<sicherer-name.ext>` — kein Projekt im Key; letztes Segment = Downloadname                                                                                                                                                          |
| Dateinamen         | Bereinigt (keine Pfadanteile, Steuerzeichen, `..`; Unicode NFC; Umlaute bleiben; Länge begrenzt; Endung bewahrt)                                                                                                                                                     |
| URLs               | Upload-URL 10 min, Download-URL 5 min; nie in DTOs, Logs oder Activities                                                                                                                                                                                             |
| Spike zu Beginn    | Prüfen, ob presigned GET im privaten Store `Content-Disposition` (Name, `attachment`) erlaubt. Fallback: letzter Key-Segment als Name; SVG-Downloads laufen dann über eine eigene Route mit `Content-Disposition: attachment` und `Content-Security-Policy: sandbox` |

### Prüfung bei der Finalisierung (`complete`)

1. `head`: Objekt existiert; Größe ≤ Limit der Endung und gleich der angekündigten Größe; Content-Type gleich dem
   serverseitig aus der Endung abgeleiteten Typ.
2. Signatur über `readRange` der ersten 64 KB: Magic Bytes passen zur Endung (PDF, PNG, JPEG, WEBP, HEIC/HEIF-`ftyp`,
   MP4/MOV-`ftyp`, WEBM-EBML, OTF `OTTO`, TTF `0x00010000`/`true`, WOFF2 `wOF2`). TXT/CSV: gültiges UTF-8, keine
   NUL-Bytes.
3. Office (docx/xlsx/pptx): ZIP-Central-Directory per `readRange` am Dateiende; `[Content_Types].xml` und passender
   Hauptteil vorhanden, `vbaProject.bin` führt zur Ablehnung.
4. SVG: **vollständig** gelesen (nicht nur die ersten 64 KB — ein Skript kann am Dateiende stehen; bei 5 MB
   unkritisch); wohlgeformtes XML mit `<svg`-Wurzel; abgelehnt bei `<script`, `on…=`-Attributen, `javascript:`,
   `<foreignObject>`, externen Referenzen (`href`/`xlink:href` auf fremde URLs), `<!ENTITY`.
5. Fehler: Objekt löschen, `pending`-Zeile löschen, typisierter Fehlercode an den Client.

Akzeptiertes Risiko: kein Malware-Scanner in v1 (`inspection_status = 'unscanned'`, `FileInspectionAdapter` als
No-op). SHA-256 entfällt; ein späterer Scanner berechnet eigene Hashes, die Spalte kommt dann additiv.

### Endpunkte

Workspace (`/api/workspace/crm/…`; jeder Endpunkt in `CRM_ENDPOINT_ACCESS_RULES`, Queries über
`crmAccessCondition`, Schreiben über `canOn`; Permissions existieren bereits, scopebar auf Kunde und Projekt):

| Methode + Pfad                              | Permission     | Zweck                                                                            |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `POST customers/[customerId]/files/uploads` | `files.write`  | `pending`-Zeile + presigned PUT (Name, Größe, Typ, Projekt, Sichtbarkeit, Notiz) |
| `POST files/[fileId]/complete`              | `files.write`  | Prüfen → `ready`, Activity `file_uploaded`                                       |
| `POST customers/[customerId]/files/links`   | `files.write`  | Link anlegen (`ready`)                                                           |
| `GET customers/[customerId]/files`          | `files.read`   | Liste, paginiert; Filter Projekt, Art, Herkunft/Sichtbarkeit, Suche              |
| `GET files/[fileId]/download-url`           | `files.read`   | Kurzlebige URL, `inline` (Vorschau) oder `attachment`                            |
| `PATCH files/[fileId]`                      | `files.write`  | Sichtbarkeit / Notiz / Projekt, versioniert (409 mit `VersionConflictDto`)       |
| `DELETE files/[fileId]`                     | `files.delete` | Storage zuerst, dann Zeile; bei Storage-Fehler `orphaned_at`                     |
| `POST customers/[customerId]/files/archive` | `files.read`   | ZIP der gewählten IDs                                                            |

Portal (`/api/portal/[customerId]/…`, `withPortalActor`; Kunde nur aus der validierten Mitgliedschaft):

| Methode + Pfad                                       | Permission           | Zweck                                                                       |
| ---------------------------------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `GET files`                                          | `portal.files.read`  | Sichtbare, `ready` Dateien und Links; Reiter „Von uns“ / „Von dir“          |
| `GET files/[fileId]/download-url`                    | `portal.files.read`  | Nur sichtbar; fremde oder interne ID → 404                                  |
| `POST files/uploads`, `POST files/[fileId]/complete` | `portal.files.write` | Eigener Upload; optionales Projekt nur aus den für ihn sichtbaren Projekten |
| `POST files/links`                                   | `portal.files.write` | Eigener Link                                                                |
| `POST files/archive`                                 | `portal.files.read`  | ZIP nur aus sichtbaren Dateien                                              |

- Kein Portal-`PATCH` und kein Portal-`DELETE`.
- Portal- und Workspace-Handler bleiben getrennt. Geteilte, akteursneutrale Bausteine (Key-Bau, Validierung,
  Finalisierungsprüfung, Link-Validierung, ZIP-Streaming) liegen als Services unter `src/server/shared/files/`.
- Private Antworten: `Cache-Control: private, no-store`. Portal-Uploads schreiben eine Activity mit
  Mitgliedschafts-ID, nie mit E-Mail.

### Links

- Nur `https`, höchstens 2048 Zeichen, Bezeichnung Pflicht, Notiz optional.
- Der Server ruft die URL **nie** ab (kein Titel, keine Vorschau, kein Thumbnail) — SSRF.
- Anzeige: Symbol + Domain (`drive.google.com`), öffnen mit `rel="noopener noreferrer"` in neuem Tab.
- Formularhinweis: WeTransfer-Links verfallen nach 7 Tagen; lieber hochladen oder dauerhaften Link nutzen.
- Im ZIP erscheinen Links als `_LINKS.txt` (Bezeichnung + URL).

### ZIP (intern und Portal)

- `runtime = "nodejs"`, `fflate` im Streaming-Modus (bereits in `apps/web` genutzt), kein Puffern des Archivs.
- Pre-flight **vor dem ersten Byte**: Anzahl, `SUM(size_bytes)` und Zugehörigkeit zu genau einem Kunden → sonst 422
  als JSON.
- Videos sind ausgeschlossen (einzeln laden); Namenskonflikte mit Zählsuffix (`logo (2).png`); unlesbare Dateien in
  `_FEHLENDE-DATEIEN.txt`.
- Die Messung aus 14.4 gegen den privaten Preview-Store ergab 9,94 / 32,60 / 45,76 Sekunden für
  10 / 50 / 100 Dateien und 50 / 150 / 300 MiB. Daraus folgen `maxDuration = 120 s`, ein
  96-Sekunden-Zeitbudget sowie `MAX_ARCHIVE_FILES = 100` und `MAX_ARCHIVE_BYTES = 300 MiB`.
  Methodik und Einschränkungen stehen in [Task 54](./54-mehrfachauswahl-und-zip.md).

### UI

- **Drop-Zone** wird aus `import-leads-dialog.tsx` extrahiert nach `packages/ui/src/components/file-drop-zone/`
  (app-neutral, Workspace und Portal): Props `accept`, `multiple`, `disabled`, `onFilesSelected(files: File[])`,
  `label`, `hint`, `variant` (`large` | `compact`). Enthält verstecktes Input + Label (Tastatur, am Handy Galerie und
  Kamera), Drag-Zähler und Aktiv-Zustand als Hook im Paket; gibt nur `File[]` zurück und kennt weder Limits noch
  Upload. Redesign: klarer Aktiv-Zustand, sichtbarer Fokusring, beide Themes. Der Lead-Import wird umgestellt
  (`multiple = false`); seine Tests bleiben grün.
- **Vorprüfung** als seiteneffektfreier Helfer `classifyUploadCandidate(file)` in `common` (Art bestimmen oder
  Ablehnungsgrund), genutzt von der Upload-Warteschlange — nicht in der Drop-Zone.
- **Intern:** Abschnitt „Dateien“ im Kunden-Cockpit (alle Dateien, Projektfilter) und reduziert in der Projektansicht
  (vorbelegt auf das Projekt). Werkzeugleiste: Datei hochladen (Button + Drag-and-drop), Link hinzufügen, Suche,
  Filter Herkunft / Art / Projekt (Filter-State in der URL). Liste: Typ-Symbol, Name + Notiz, Projekt, Größe,
  Uploader, Datum, Sichtbarkeit als Symbol **und** Text. Aktionen: Vorschau, Download, Bearbeiten, Löschen mit
  Bestätigung, die den Namen nennt.
- **Upload-Warteschlange:** höchstens 3 parallel, XHR für Fortschritt, je Datei Fortschritt / Abbrechen / Erneut
  versuchen / Ablehnungsgrund; gemeinsame Angaben je Vorgang (Projekt, Sichtbarkeit, Notiz); Warnung beim Verlassen
  der Seite; Fortschritt über Live-Region.
- **Lightbox:** Bilder, PDF, TXT/CSV, mp4/webm; Pfeiltasten blättern nur über darstellbare Dateien, Escape schließt,
  Fokus kehrt zurück; mobil bildschirmfüllend.
- **Portal-Seite** `/portal/[customerId]/files` (noindex, force-dynamic): Reiter „Von uns“ und „Von dir“, große
  Upload-Fläche mobile-first, „Link hinzufügen“, optionale Projektwahl (Standard „Allgemein“), erklärende
  Empty-States, keine Lösch- oder Bearbeitungsbuttons. Dashboard-Widget `files` von Mock auf echte Daten. DE in
  Du-Form.
- **Chat-Anhänge:** 📎 im Composer beider Seiten → „Neue Datei hochladen“ oder „Vorhandene Datei wählen“ (Portal: nur
  sichtbare; intern: alle des Kunden). Intern erscheint vor dem Senden eines nicht freigegebenen Anhangs der Hinweis
  „Diese Datei wird für den Kunden freigegeben“; Senden setzt die Sichtbarkeit und schreibt eine Activity. Ein
  Kundenupload im Chat landet automatisch unter „Von dir“. Anhänge als Chips; bei entzogener Freigabe zeigt das
  Portal „Nicht mehr verfügbar“. Modell `message_files (message_id, file_id, customer_id)` mit UNIQUE
  `(message_id, file_id)` und zusammengesetzten FKs; Nachrichten bleiben unveränderlich.
- Alle Texte in `src/i18n/dictionaries/**` für DE und EN; Copy mit `copywriting`, UI mit `frontend-design`.

## Geänderte Entscheidungen (gegenüber 14/15/15a)

| Früher                                               | Jetzt                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Drei Ordner, Medien nachgelagert                     | Ein Ordner, sechs Teil-PRs, alle Formate in einem Rutsch                        |
| Öffentliche bzw. unspezifizierte Blob-Nutzung        | Privater Vercel-Blob-Store mit presigned PUT/GET                                |
| `category` (asset/deliverable/feedback/internal)     | Keine Kategorie; Einordnung abgeleitet, dazu optionale Notiz                    |
| `files` + `customer_asset_links` + `upload_sessions` | Eine Tabelle `files` mit `source` und `status`                                  |
| Key mit Projektanteil                                | Key ohne Projekt; Projektzuordnung ist reine DB-Änderung                        |
| SVG dauerhaft ausgeschlossen                         | SVG erlaubt (5 MB, Inhaltsprüfung, Vorschau nur `<img>`, Download `attachment`) |
| —                                                    | Neu: csv, webm, otf/ttf/woff2 (Art `font`)                                      |
| SHA-256 bei Finalisierung                            | Entfällt                                                                        |
| Portal: Löschanfrage                                 | Kunde entfernt nichts                                                           |
| Portalseiten `files` und `assets` getrennt           | Eine Portalseite `files` mit zwei Reitern; `portal.assets.write` entfällt       |
| Rasteransicht mit `next/image`-Thumbnails            | Liste + Lightbox; Thumbnails später clientseitig erzeugt                        |
| `images.remotePatterns` für die Blob-Domain          | Entfällt (kein `next/image` für private Dateien)                                |

Auswirkungen auf spätere Ordner:

- **15 Onboarding:** nutzt den Upload-Pfad dieses Ordners; `onboarding_answer_files` verweist auf `files` (Task 63/67).
- **16 Feedbackrunden (Neuzuschnitt 29.09.2026):** Der Kunde lädt über den Portal-Upload aus 14.5 hoch; die fertige
  (`ready`) Kundendatei wird danach über `feedback_round_id` + `feedback_item_id` an einen Feedback-Punkt gehängt
  (zusammengesetzte FKs, beide gesetzt oder beide `NULL`). „Feedback“ ergibt sich aus dem gesetzten
  `feedback_round_id`. Feedbackdateien lassen sich intern nicht umhängen und nach dem Einreichen nicht löschen
  (`FILE_FEEDBACK_BOUND`). ZIP über den bestehenden Archiv-Endpunkt aus 14.4. Details: `16-feedbackrunden/`.
- **20c Jobs:** Aufräumjob für `pending`-Zeilen älter als 24 h (Objekt löschen, dann Zeile); Blob-Volumen im Runbook.
- **21 Datenschutz/Purge:** Purge eines Kunden löscht erst alle Objekte unter `customers/<customerId>/`, dann DB.

## Merge-Gates (je Teil-PR zusätzlich zur Task-Datei)

- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
- [ ] Normale Testläufe kontaktieren keinen echten Anbieter. Der neue Blob-E2E-Test läuft nur mit `E2E_LIVE_BLOB=true` gegen den privaten Development-Store.
- [ ] Token, presigned URLs und Storage-Keys erscheinen nicht in Clientbundle, Logs, Activities oder DTOs.
- [ ] Negativtests: fremder Kunde, fremdes Projekt, fehlende Permission (Workspace und Portal) → 404/403.
- [ ] Portal kann interne Dateien weder listen noch per erratener ID signieren lassen.
- [ ] Je erlaubtem Typ ein Signaturtest; eine als `.png` benannte HTML-Datei und ein SVG mit `<script>` werden
      abgelehnt; `.docm`-Inhalt in `.docx` wird abgelehnt.
- [ ] Limitüberschreitung wird vor dem Upload abgelehnt (Browser) und zusätzlich an der CDN und bei `complete`.
- [ ] Doppeltes `complete` erzeugt genau eine `ready`-Zeile und genau eine Activity.
- [ ] Sichtbar gelieferte UI: Tastatur, Fokus, Live-Regionen, Dark/Light, mobil ab 360 px ohne horizontales Scrollen.
- [x] E2E (ab 14.5): interner Upload → freigeben → Kunde sieht und lädt; Kundenupload → intern sichtbar; interne
      Datei für den Kunden unsichtbar, auch per ID.

## Rollback

- 14.1/14.2: nichts sichtbar; Revert genügt.
- 14.3/14.4: Dateiabschnitt ausblenden (Revert der Einbindung); vorhandene Dateien bleiben erhalten.
- 14.5: `portal.files.read`/`portal.files.write` aus `portal_standard` und eigenen Portalrollen nehmen;
  Navigationseintrag und Endpunkte verschwinden, das Widget fällt weg.
- 14.6: Composer-Button entfernen; bestehende `message_files` bleiben lesbar.
- Kein Deployment-Rollback löscht Blobs.
