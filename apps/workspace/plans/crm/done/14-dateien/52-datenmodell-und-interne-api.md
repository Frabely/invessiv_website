# Task 52 — Datenmodell und interne Datei-API

> **Status:** gemerged · **Teil-PR:** 14.2 · **Branch:** `feat/crm-dateien-2-datenmodell`

## Gelieferter Scope

- Migration `0041_create_files.sql`, kanonisches Drizzle-Modell und benannte Constraints: eine Tabelle für
  Uploads und Links, zusammengesetzter Projekt-/Kunden-Fremdschlüssel, exklusive Uploader-Herkunft,
  Sichtbarkeitsregel, Metadaten-Konsistenz und vier partielle Indizes gemäß README.
- Alle sieben internen API-Operationen aus der README, zusätzlich die authentifizierte Download-Proxyroute.
  ZIP folgt in Task 54; Portal-Endpunkte und Portal-Permissions folgen in Task 55.
- Strikte HTTP-Schemas, geteilte DTOs, Listenfilter und Pagination, explizites Mapping ohne Storage-Key.
  Notiz, Sichtbarkeit und Projektzuordnung werden ausschließlich über `updateVersioned` verändert.
- Optionale Seed-Erweiterung mit zwei als Mock bezeichneten Links; keine künstlichen Blob-Objekte.
- Keine sichtbare UI; Task 53 schließt diese API an.

## API-Vertrag für Task 53

| Operation                           | Request / Antwort                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `POST customers/[id]/files/uploads` | `CreateFileUploadRequestDto`; Antwort `{ file, ticket: { url, method, headers } }`, HTTP 201                            |
| `POST files/[fileId]/complete`      | Kein Body; Antwort `FileDto`, auch bei wiederholtem Abschluss                                                           |
| `POST customers/[id]/files/links`   | `CreateFileLinkRequestDto`; Antwort `FileDto`, HTTP 201                                                                 |
| `GET customers/[id]/files`          | `page`, `pageSize` (max. 100), `projectId`, `assetKind`, `origin`, `search`; Antwort `{ files, total, page, pageSize }` |
| `GET files/[fileId]/download-url`   | `disposition=attachment` (Standard) oder `inline`; Antwort `{ url }`                                                    |
| `PATCH files/[fileId]`              | `version` plus mindestens eines von `note`, `visibleToCustomer`, `projectId`; Antwort `FileDto`                         |
| `DELETE files/[fileId]`             | JSON-Body `{ version }`; Antwort `{ deleted: true }`                                                                    |
| `GET files/[fileId]/download`       | Authentifizierter Stream als Attachment, CSP `sandbox`, `nosniff`                                                       |

`projectId=null` als Querywert filtert kundenweite Einträge; ohne Parameter werden alle erlaubten Scopes gelesen.
`origin` ist `internal`, `shared` oder `customer`. Suche ist eine literale Teilzeichenfolge in Name und Notiz;
Prozent- und Unterstrichzeichen sind keine Wildcards. Listen sind nach Erstellungszeit und ID absteigend stabil
sortiert.

Alle Antworten einschließlich Auth- und Fehlerantworten tragen `Cache-Control: private, no-store`.
Fehler liefern `{ code, message }`, Versionskonflikte unverändert `VersionConflictDto<FileDto>` mit HTTP 409.
Die spätere UI übersetzt Fehlercodes über ihre Dictionaries. Signierte URLs sind nur kurzlebige Transferantworten,
niemals Felder von `FileDto`, persistierte Werte oder Activity-Inhalte. Die Transfer-URL kann technisch den
Storage-Pfad enthalten; ein separates `storageKey`-Feld wird nie ausgegeben.

## Autorisierung, Nebenläufigkeit und Fehlerfälle

- Jede Route ist in `CRM_ENDPOINT_ACCESS_RULES` erfasst; Queries verwenden `crmAccessCondition`, Mutationen zusätzlich
  `canOn`. Projektrollen eröffnen keine kundenweiten Einträge. Reassignment prüft Ausgangs- und Zielscope sowie den
  gemeinsamen Kunden. Fremde Datensätze und fremde Filterziele liefern 404.
- Ticket-Erstellung sperrt die Mitgliedszeile. Höchstens 20 offene Pending-Uploads je Mitglied, über alle Kunden hinweg;
  parallele Requests umgehen das Limit nicht. Fehlende Storage-Konfiguration oder fehlgeschlagenes Signieren verbraucht
  keinen Slot. MIME-Typ und CDN-Limit stammen ausschließlich aus der Endungspolicy von Task 51.
- `complete` verlangt den ursprünglichen Uploader und dessen aktuelle Schreibberechtigung. Eine Zeilensperre
  serialisiert
  Abschluss, Bearbeitung und Löschung; `pending → ready` und genau eine `file_uploaded`-Activity erfolgen atomar.
  Wiederholter Abschluss eines fertigen Uploads prüft Storage nicht erneut. Technische Storagefehler lassen Pending
  unverändert, damit ein Retry möglich bleibt.
- Ungültiger Inhalt wird zuerst im Storage, danach in der DB entfernt. Schlägt die Storage-Löschung fehl, bleibt die
  Zuordnung mit `orphaned_at` erhalten. Listen, Download und Abschluss lesen keine solchen Einträge.
- Löschfehler eines fertigen Uploads erhöhen über `updateVersioned` die Version und markieren `orphaned_at`.
  Ein erneutes DELETE mit alter Version liefert 409 einschließlich aktuellem Stand; mit aktueller Version ist es
  wiederholbar. Das endgültige Entfernen der Zeile erfolgt erst nach erfolgreicher Objektlöschung.
- Keine verteilte Transaktion mit Storage: Scheitert der DB-Commit nach erfolgreicher Objektlöschung, bleibt eine
  reparierbare DB-Zuordnung; der nächste Löschversuch behandelt das fehlende Objekt idempotent.
- Pro tatsächlich geändertem Fachfeld entsteht eine Activity ohne Freitext, Dateiname, URL oder Storage-Key.
  Providerfehler werden nur als neutraler Fehlercode geloggt.
- Pending-Bereinigung nach 24 Stunden und Wiederaufnahme markierter Objekte folgen in Ordner 20c. Bis dahin belegen
  abgebrochene Uploads nur so lange einen Pending-Slot, wie ihr Upload-Ticket gültig ist (`UPLOAD_URL_TTL_MS`); danach
  zählt die Zeile nicht mehr zum Limit (seit Task 55, gilt für CRM und Portal). Erfolgreiche Dateien werden nie
  automatisch gelöscht.

## Ergänzende Gate-Korrekturen am bestehenden Chat

Die vollständigen DB-Smokes deckten zwei bestehende Chatfehler und einen Katalogrückstand auf:

- `message-service.ts`: durch Zeilenumbrüche getrennte SQL-Cast-Doppelpunkte machten Cursor-Pagination ungültig;
  ersetzt durch `cast(… as …)` bei unveränderter Mikrosekundenpräzision.
- Der Cross-Customer-Redaction-Test bekommt das vorausgesetzte globale `chat.redact`, damit er tatsächlich die
  fehlende kundenspezifische Leseberechtigung prüft, statt schon am Permission-Gate zu scheitern.
- Die zusätzlichen Statements am Ende von `0041_create_files.sql` ergänzen ausschließlich den fehlenden bestehenden
  Katalogeintrag und dessen Owner-Zuordnung. Bereits registrierte Migration `0040` bleibt unverändert. Ist alles
  vorhanden, sind die Statements folgenlos. (Ursprünglich als eigene Migration `0042` angelegt, dann in `0041`
  zusammengeführt, da beide Migrationen ausschließlich lokal in Development angewendet und nirgends committet waren.)

## Prüfung und Übergabe

- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und
  `pnpm --filter @invessiv/workspace build`: grün. Die bestehende `no-img-element`-Warnung im Marketing-Test bleibt.
- 50 gezielte Datei-Tests mit PostgreSQL, HTTP-Autorisierung und Mapper: grün. Zusätzliche Konstanten- und
  Modell-/Migrationsabgleich-Tests ebenfalls grün.
- `pnpm db:smoke:crm`: 105 DB-Constraint-Checks und 86 Integrationstests grün.
- `pnpm db:smoke:dev`: Tabelle, Migrationen und Permission-Katalog grün.
- `pnpm db:smoke:activities`: 13 Migrationschecks und 2 Integrationstests grün.
- `pnpm db:smoke:rbac`: 117 Checks und 7 Integrationstests grün; 1 bestehender Test übersprungen.
- Dateitests verwenden In-Memory-Storage, niemals einen echten Anbieter. Die PostgreSQL-Tests nutzen ausschließlich
  Entwicklungs-Fixtures und räumen sie anschließend ab. `db:smoke:crm` enthält die neuen Datei-Integrationstests
  dauerhaft. Die normale Testsuite überspringt DB-Integrationen bewusst; die genannten Smokes führen sie separat aus.
- Keine sichtbare UI verändert; deshalb kein neuer Browser-/A11y-Smoke. Review gemäß Ordner-README durch das andere
  Modell steht noch aus.

## Deployment und Rollback

- Migrationen vor der neuen App-Version anwenden. Auf Development wurde `0041` angewendet; Preview und Production
  wurden nicht verändert.
- Keine neuen Environment-Variablen gegenüber Task 51. Die manuelle [Vercel-Checkliste](./VERCEL-SETUP.md)
  einschließlich privatem Preview-Store und echtem CDN-Test bleibt ein Merge-Gate; sie wurde hier nicht als erledigt
  vorausgesetzt.
- Rollback: API-/App-Änderung zurücknehmen; additive Tabelle und Katalogeintrag können bestehen bleiben.
  Kein Rollback löscht Dateien oder Blobs. Kein automatischer Commit oder Merge.
