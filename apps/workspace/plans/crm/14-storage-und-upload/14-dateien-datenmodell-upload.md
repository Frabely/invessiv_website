# Task 14 — Dateien Datenmodell und Upload

> **Merge-Einheit:** Ordner 14 · **Branch:** `feat/crm-storage-und-upload`
> **Aufwand:** L · **Abhängigkeiten:** Task 13 (Storage-Adapter), Task 09 (Projekte)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

In diesem Task sind nur Kunden- und Projekt-Scope erlaubt. Der Feedback-Scope wird in Task 22
additiv mit erweiterter Exactly-one-Constraint ergänzt. Eine Datei ist zunächst intern; Portalzugriff
entsteht ausschließlich über `visible_to_customer` in der SQL-Abfrage.

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
| Zuordnung                 | Drei nullbare Spalten mit **echtem Fremdschlüssel**: `customer_id` (immer gesetzt), `project_id`, `feedback_round_id`                                                                    |
| Warum kein `owner_type`   | Eine polymorphe `owner_id` ohne Fremdschlüssel lässt verwaiste Zeilen zu: das Löschen eines Projekts hinterließe Dateien mit toter Kennung, und die Datenbank könnte es nicht verhindern |
| Genau eine Ebene          | CHECK-Constraint: `project_id` und `feedback_round_id` nie beide gesetzt. Keins von beiden bedeutet „am Kunden"                                                                          |
| Warum `customer_id` immer | Damit jede Rechte- und Portalabfrage ohne Join filtern kann. Sicherheitsprüfungen sollen nicht von einem korrekten Join abhängen                                                         |
| Kategorie                 | `asset` (Material vom Kunden), `deliverable` (Ergebnis von uns), `feedback` (aus einer Feedbackrunde), `internal`                                                                        |
| Kundensichtbarkeit        | `visible_to_customer` boolean, Vorgabe `false`. Nur `deliverable`-Dateien werden üblicherweise freigegeben (Portal-Downloads, Task 22)                                                   |
| Uploader                  | `uploaded_by_side` (`internal`/`customer`) plus `uploaded_by_id`                                                                                                                         |
| Erlaubte Formate          | Ausschließlich `.pdf`, `.txt`, `.docx`, `.xlsx`, `.pptx`. Keine alten binären oder makrofähigen Office-Formate, keine Bilder, kein HTML, keine Archive                                   |
| Größenlimit               | 50 MB je Datei, zentral als Konstante                                                                                                                                                    |
| Session-Limit             | 20 Dateien und 300 MB je Upload-Session                                                                                                                                                  |
| Prüfung bei Finalisierung | Extension, normalisierter MIME-Typ, Magic Bytes beziehungsweise Container, Größe und SHA-256 — alle fünf, nicht eines davon                                                              |
| Warum Signatur            | Extension und gemeldeter MIME-Typ kommen beide vom Client. Nur die Dateisignatur sagt, was die Bytes tatsächlich sind                                                                    |
| Inspektion                | `inspection_status` (`unscanned` \| `pending` \| `clean` \| `rejected` \| `error`) plus `FileInspectionAdapter`. Version 1 nutzt einen No-op-Adapter und speichert `unscanned`           |
| Akzeptiertes Risiko       | Kein Malware-Scanner in Version 1. Das ist dokumentiert, nicht vergessen — die Adapter-Grenze hält den Nachrüstweg offen                                                                 |
| Löschen                   | Storage-Objekt zuerst, DB-Zuordnung danach. Schlägt das Storage-Löschen fehl, bleibt die Zeile stehen und wird als verwaist markiert — nie stille Inkonsistenz                           |
| Nie in einer Transaktion  | Blob-Löschungen laufen außerhalb der DB-Transaktion; sonst hängt ein Rollback von einem externen Dienst ab                                                                               |
| Kaskadiertes Löschen      | Beim Purge von Kunde oder Projekt räumt eine **explizite, idempotente Routine** die Storage-Objekte ab (Task 34). Postgres kann keine Blobs löschen                                      |
| Verwaiste Sessions        | Eine nie finalisierte Upload-Session darf nach 24 Stunden technisch bereinigt werden — als Outbox-Job aus Ordner 10, nicht als Handskript                                                |
| Erfolgreiche Dateien      | Werden **nie** automatisch gelöscht, unabhängig von Alter und Kontext                                                                                                                    |
| Versionierung             | Nicht enthalten. Gleichnamige Uploads sind eigenständige Dateien                                                                                                                         |

## Tabelle

```txt
files
  id uuid PK
  customer_id       uuid NOT NULL → customers.id       ON DELETE CASCADE
  project_id        uuid NULL     → projects.id        ON DELETE CASCADE
  feedback_round_id uuid NULL     → feedback_rounds.id ON DELETE CASCADE   FK ab Task 22
  category text NOT NULL                  CHECK in ('asset','deliverable','feedback','internal')
  visible_to_customer boolean NOT NULL DEFAULT false
  original_filename text NOT NULL
  storage_key text NOT NULL UNIQUE
  content_type text NOT NULL              normalisiert, nicht der rohe Clientwert
  size_bytes bigint NOT NULL              CHECK (size_bytes > 0 AND size_bytes <= 52428800)
  sha256 text NOT NULL                    bei der Finalisierung berechnet
  inspection_status text NOT NULL DEFAULT 'unscanned'  CHECK in FILE_INSPECTION_STATUS_VALUES
  uploaded_by_side text NOT NULL          CHECK in UPLOAD_SIDE_VALUES ('internal','customer')
  uploaded_by_id text NULL
  orphaned_at timestamptz NULL            gesetzt, wenn das Storage-Objekt nicht gelöscht werden konnte
  created_at timestamptz NOT NULL DEFAULT now()
  CONSTRAINT files_exactly_one_scope CHECK (
    (project_id IS NOT NULL)::int + (feedback_round_id IS NOT NULL)::int <= 1
  )
  INDEX (customer_id, created_at desc)
  INDEX (project_id)        WHERE project_id IS NOT NULL
  INDEX (feedback_round_id) WHERE feedback_round_id IS NOT NULL
  INDEX (customer_id)       WHERE visible_to_customer
```

Der Scope ist genau einer: keine Zusatzspalte gesetzt bedeutet Kundenscope, `project_id` bedeutet
Projektscope, `feedback_round_id` bedeutet Feedbackrundenscope. Beide gleichzeitig sind verboten.
Die Constraint wird in Task 22 **erweitert**, nie verengt — bestehende Zeilen bleiben gültig.

`feedback_round_id` entsteht als Spalte schon hier, der Fremdschlüssel wird in Task 22 nachgezogen —
`feedback_rounds` existiert bis dahin nicht. Dasselbe Muster wie bei `activities.project_id`
(Task 01a/09).

Der letzte Index bedient die Portal-Abfrage „welche Dateien darf dieser Kunde herunterladen".

## Architektur

```txt
1) POST /api/workspace/crm/files/ticket
     → withPermission(FilesWrite)
     → zod: customerId + optional projectId oder feedbackRoundId, Dateiname, MIME, Größe
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
packages/db/migrations/<nr>_create_files.sql
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

- **Files:** `<nr>_create_files.sql`, `record-configuration/crm/files.ts`,
  `constants/crm/file-categories.ts` + Test, `contracts/crm/file.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben; `size_bytes` als `bigint`, im DTO als `number` (Dateien unter
  9 Petabyte sind in JavaScript sicher darstellbar)
- **Akzeptanz:**
  - Migration idempotent; doppelter `storage_key` wird abgelehnt
  - Eine Zeile mit gleichzeitig gesetztem `project_id` und `feedback_round_id` wird abgelehnt
  - Das Löschen eines Projekts entfernt dessen Datei-Zeilen per Cascade — **keine** Zeile mit toter
    Kennung bleibt zurück (das war mit der polymorphen Variante nicht garantierbar)

### CRM-14-T2 — Validierung und Besitzprüfung

- **Files:** `services/file-validation-service.ts`, `services/file-ownership-service.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - MIME-Allowlist: PDF/TXT/DOCX/XLSX/PPTX. Abgelehnt werden Bilder, Archive, HTML, Makro- und Binärformate unter
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
  - `listFiles({ customerId, projectId?, feedbackRoundId?, category?, visibleToCustomerOnly? })`
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
