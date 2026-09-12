# Task 14 — Dateien Datenmodell und Upload

> **Branch:** `feat/crm-dateien-upload`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 13 (Storage-Adapter), Task 09 (Projekte)
> **Migration:** `0029_create_files.sql` (Planwert)

## Context

Die Metadatenschicht über dem Storage: Welche Datei gehört zu wem, wer hat sie hochgeladen, welcher
Art ist sie. Der Storage kennt nur Schlüssel und Bytes — alles andere lebt in der Datenbank.

Der Upload läuft in zwei Schritten, weil Serverless-Funktionen bei großen Dateien an Limits stoßen:
Der Server stellt ein Upload-Ticket aus, der Browser lädt direkt beim Anbieter hoch, danach bestätigt
der Browser dem Server die Fertigstellung. Erst dann entsteht die Datenbankzeile — so gibt es keine
Einträge zu Dateien, die nie ankamen.

Kein UI in diesem Task: Es entstehen Schema, Handler und Routen, prüfbar über Tests. Die Oberfläche
folgt in Task 15.

## Entscheidungen

| Bereich                   | Entscheidung                                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zuordnung                 | Drei nullbare Spalten mit **echtem Fremdschlüssel**: `customer_id` (immer gesetzt), `project_id`, `submission_id`                                                                        |
| Warum kein `owner_type`   | Eine polymorphe `owner_id` ohne Fremdschlüssel lässt verwaiste Zeilen zu: das Löschen eines Projekts hinterließe Dateien mit toter Kennung, und die Datenbank könnte es nicht verhindern |
| Genau eine Ebene          | CHECK-Constraint: `project_id` und `submission_id` nie beide gesetzt. Keins von beiden bedeutet „am Kunden"                                                                              |
| Warum `customer_id` immer | Damit jede Rechte- und Portalabfrage ohne Join filtern kann. Sicherheitsprüfungen sollen nicht von einem korrekten Join abhängen                                                         |
| Kategorie                 | `asset` (Material vom Kunden), `deliverable` (Ergebnis von uns), `submission` (aus einer Einreichung), `internal`                                                                        |
| Kundensichtbarkeit        | `visible_to_customer` boolean, Vorgabe `false`. Nur `deliverable`-Dateien werden üblicherweise freigegeben (Portal-Downloads, Task 22)                                                   |
| Uploader                  | `uploaded_by_side` (`internal`/`customer`) plus `uploaded_by_id`                                                                                                                         |
| Größenlimit               | 100 MB je Datei als Startwert, zentral als Konstante                                                                                                                                     |
| MIME-Prüfung              | Allowlist; ausführbare Typen und HTML werden abgelehnt                                                                                                                                   |
| Löschen                   | Datenbankzeile und Storage-Objekt gemeinsam. Schlägt das Storage-Löschen fehl, bleibt die Zeile stehen und wird als verwaist markiert — nie stille Inkonsistenz                          |
| Kaskadiertes Löschen      | Beim harten Löschen von Kunde oder Projekt räumt eine **explizite Routine** die Storage-Objekte ab (Task 05, Task 10). Postgres kann keine Blobs löschen                                 |
| Verwaiste Objekte         | Ein Upload, der nie bestätigt wird, hinterlässt ein Storage-Objekt ohne Zeile. Aufräumen über ein Wartungsskript, kein Cron im MVP                                                       |
| Versionierung             | Nicht enthalten. Gleichnamige Uploads sind eigenständige Dateien                                                                                                                         |

## Tabelle

```txt
files
  id uuid PK
  customer_id   uuid NOT NULL → customers.id           ON DELETE CASCADE
  project_id    uuid NULL     → projects.id            ON DELETE CASCADE
  submission_id uuid NULL     → customer_submissions.id ON DELETE CASCADE   ab Task 22
  category text NOT NULL                  CHECK in ('asset','deliverable','submission','internal')
  visible_to_customer boolean NOT NULL DEFAULT false
  original_filename text NOT NULL
  storage_key text NOT NULL UNIQUE
  content_type text NOT NULL
  size_bytes bigint NOT NULL
  uploaded_by_side text NOT NULL          CHECK in RESPONSIBLE_SIDE_VALUES
  uploaded_by_id text NULL
  orphaned_at timestamptz NULL            gesetzt, wenn das Storage-Objekt nicht gelöscht werden konnte
  created_at timestamptz NOT NULL DEFAULT now()
  CHECK (project_id IS NULL OR submission_id IS NULL)
  INDEX (customer_id, created_at desc)
  INDEX (project_id)    WHERE project_id IS NOT NULL
  INDEX (submission_id) WHERE submission_id IS NOT NULL
  INDEX (customer_id)   WHERE visible_to_customer
```

`submission_id` entsteht als Spalte schon hier, der Fremdschlüssel wird in Task 22 nachgezogen —
`customer_submissions` existiert bis dahin nicht. Dasselbe Muster wie bei `activities.project_id`
(Task 01a/09).

Der letzte Index bedient die Portal-Abfrage „welche Dateien darf dieser Kunde herunterladen".

## Architektur

```txt
1) POST /api/workspace/crm/files/ticket
     → withPermission(FilesWrite)
     → zod: customerId + optional projectId oder submissionId, Dateiname, MIME, Größe
     → Limits und Allowlist prüfen, Besitz prüfen
     → storage.createUploadTicket(key, ...)
     → { ticket, storageKey }

2) Browser lädt direkt beim Anbieter hoch

3) POST /api/workspace/crm/files/complete
     → withPermission(FilesWrite)
     → Existenz beim Anbieter prüfen (Größe abgleichen)
     → files insert
     → activities: file_uploaded
     → FileDto

GET    /api/workspace/crm/files/[fileId]/url   signierte URL, kurzlebig
DELETE /api/workspace/crm/files/[fileId]       Storage + Zeile
```

Der Abgleich der Größe in Schritt 3 verhindert, dass ein manipulierter Client eine 2-GB-Datei meldet,
die als 1 KB angekündigt war.

## Verzeichnisstruktur

```txt
packages/db/migrations/0029_create_files.sql
packages/db/src/record-configuration/crm/files.ts
packages/common/src/constants/crm/file-categories.ts
packages/common/src/contracts/crm/file.dto.ts

apps/workspace/src/app/api/workspace/crm/files/ticket/route.ts
apps/workspace/src/app/api/workspace/crm/files/complete/route.ts
apps/workspace/src/app/api/workspace/crm/files/[fileId]/route.ts
apps/workspace/src/app/api/workspace/crm/files/[fileId]/url/route.ts

apps/workspace/src/server/workspace/crm/
  command-handler/{create-file-ticket,complete-file-upload,delete-file}.command-handler.ts
  query-handler/list-files.query-handler.ts
  services/file-validation-service.ts
  services/file-ownership-service.ts        prüft, dass Projekt/Einreichung zum Kunden gehört
  services/file-storage-cleanup-service.ts  Aufräumroutine für Task 05 und Task 10
apps/workspace/src/client/crm/file-upload-service.ts
```

## Tickets

### CRM-14-T1 — Migration, Modell, Konstanten

- **Files:** `0029_create_files.sql`, `record-configuration/crm/files.ts`,
  `constants/crm/file-categories.ts` + Test, `contracts/crm/file.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben; `size_bytes` als `bigint`, im DTO als `number` (Dateien unter
  9 Petabyte sind in JavaScript sicher darstellbar)
- **Akzeptanz:**
  - Migration idempotent; doppelter `storage_key` wird abgelehnt
  - Eine Zeile mit gleichzeitig gesetztem `project_id` und `submission_id` wird abgelehnt
  - Das Löschen eines Projekts entfernt dessen Datei-Zeilen per Cascade — **keine** Zeile mit toter
    Kennung bleibt zurück (das war mit der polymorphen Variante nicht garantierbar)

### CRM-14-T2 — Validierung und Besitzprüfung

- **Files:** `services/file-validation-service.ts`, `services/file-ownership-service.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - MIME-Allowlist: Bilder, PDF, gängige Office-Formate, Text, Archive. Abgelehnt werden unter
    anderem `text/html`, `application/x-msdownload`, `application/x-sh`
  - Größenprüfung gegen die Konstante aus `packages/storage`
  - Besitzprüfung: das angegebene Projekt oder die Einreichung gehört wirklich zu diesem Kunden
- **Akzeptanz:**
  - Tests: abgelehnte MIME-Typen, Überschreitung des Limits, fremdes Projekt wird abgewiesen
  - Die Besitzprüfung ist eine eigene Funktion mit eigenen Tests, nicht in den Handler eingestreut

### CRM-14-T3 — Ticket- und Abschluss-Handler

- **Files:** `command-handler/{create-file-ticket,complete-file-upload}.command-handler.ts`,
  beide Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Ticket-Handler baut den Schlüssel über `buildStorageKey` und gibt ihn signiert zurück
  - Abschluss-Handler prüft die tatsächliche Größe beim Anbieter, schreibt die Zeile und die Activity
  - Unbestätigte Tickets erzeugen **keine** Zeile
- **Akzeptanz:**
  - Tests laufen gegen den In-Memory-Adapter, nie gegen einen echten Anbieter
  - Test: gemeldete und tatsächliche Größe weichen ab, der Abschluss wird abgelehnt und das Objekt
    wieder entfernt
  - Test: genau eine Activity je erfolgreichem Upload

### CRM-14-T4 — Lesen, signierte URL, Löschen

- **Files:** `query-handler/list-files.query-handler.ts`,
  `command-handler/delete-file.command-handler.ts`, zwei Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `listFiles({ customerId, projectId?, submissionId?, category?, visibleToCustomerOnly? })`
  - Signierte URL mit kurzer Gültigkeit (fünf Minuten), `Permission.FilesRead`
  - Löschen: erst Storage, dann Zeile. Schlägt Storage fehl, wird `orphaned_at` gesetzt und ein
    Fehler gemeldet — keine stille Inkonsistenz
  - Zusätzlich `purgeStorageObjectsForCustomer` und `…ForProject` im `file-storage-cleanup-service`:
    sammelt die Schlüssel ein und löscht die Objekte. Das ist die Routine, die Task 05 und Task 10
    vor dem harten Löschen aufrufen — die Datenbank kann Blobs nicht mitlöschen
- **Akzeptanz:**
  - Test: Löschfehler im Storage hinterlässt eine als verwaist markierte Zeile, keine gelöschte
  - Test: die Aufräumfunktion entfernt alle Objekte eines Kunden bzw. Projekts (In-Memory-Adapter)
  - Test: schlägt ein Objekt fehl, meldet die Funktion die betroffenen Schlüssel und löscht nichts
    halb — der Aufrufer bricht daraufhin ab
  - Signierte URL läuft ab; abgelaufene URL ergibt keinen Zugriff

### CRM-14-T5 — Client-Upload-Service

- **Files:** `apps/workspace/src/client/crm/file-upload-service.ts` + Test
- **Skills:** `best-practices`
- **Inhalt:**
  - Benanntes Service-Objekt, das den dreistufigen Ablauf kapselt und Fortschritt meldet
  - Abbruch über `AbortSignal`
  - Antworten über Type-Guards validiert, keine blinden Casts
- **Akzeptanz:** Test mit nachgebildetem `fetch` deckt Erfolg, Abbruch und Fehler in jedem der drei
  Schritte ab

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Es gibt keine Oberfläche, die diese Endpunkte aufruft.
2. **Bricht nichts:** eine neue Tabelle, vier neue Routen. Kein bestehender Pfad verändert. Ohne
   gesetzten Storage-Token arbeitet die Fabrik im Entwicklungsmodus gegen In-Memory — in Produktion
   ohne Token liefern die Endpunkte einen klaren Konfigurationsfehler statt eines Absturzes.
3. **Offen:** die gesamte Oberfläche (Task 15). Endpunkte ohne Aufrufer sind durch `withPermission`
   abgesichert und nicht öffentlich erreichbar.

## End-to-End-Akzeptanz

1. Der dreistufige Ablauf funktioniert im Test von Ticket bis Datenbankzeile.
2. Eine zu große oder unerlaubte Datei wird bereits beim Ticket abgelehnt — vor dem Hochladen.
3. Eine gemeldete Größe, die nicht stimmt, verhindert den Abschluss.
4. Eine Datei eines fremden Projekts lässt sich nicht anlegen.
5. Signierte URLs sind kurzlebig und danach wirkungslos.
6. Löschen entfernt Storage-Objekt und Zeile; ein Storage-Fehler führt zu einer markierten, nicht zu
   einer verlorenen Zeile.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
