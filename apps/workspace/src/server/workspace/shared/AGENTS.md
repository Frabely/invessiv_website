# AGENTS.md — Geteilte Workspace-Server-Bausteine

Gilt für `apps/workspace/src/server/workspace/shared/**`. Ergänzt `src/server/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Was hier hingehört

Serverseitige Bausteine, die **mehrere** Workspace-Domänen benutzen und keiner davon gehören.
Aktuell: das Concurrency-Muster und der Activity-Service.

Ein Baustein zieht erst hierher, wenn er **tatsächlich** einen zweiten Nutzer hat — nicht
vorsorglich. Domänenspezifisches bleibt bei der Domäne.

## `activityService` ist der einzige Schreibweg für Aktivitäten

`services/activity-service.ts` schreibt ausschließlich in `activities`. Kein Command-Handler fügt
selbst in `activities` ein, und niemand schreibt mehr in `lead_activities` — die Tabelle ist seit
dem Umzug in Ordner 02 stillgelegt und wird in Ordner 22 abgebaut.

- Ein Aufruf trägt `leadId` und/oder `customerId`; ohne beide ist er ein Typfehler.
- `createActivity(tx, …)` schreibt in der Transaktion des fachlichen Writes, `appendActivity(…)`
  öffnet eine eigene.
- Der Service protokolliert nichts und wirft keine Domänenfehler.
- Der Actor ist Pflicht (`ActivityActor`): Menschen als `{ type: user, userId }` mit `users.id`, Systemschreiber als
  `{ type: system, systemActorKey }`. `actor_id` und `actor_label` sind Legacy und werden nie mehr geschrieben; der
  fachliche Lead- oder Kunden-Owner ist nie der Actor.

## `update-versioned.ts` ist der einzige Weg für versionierte Updates

`updateVersioned` kapselt genau ein atomares
`UPDATE … SET version = version + 1 WHERE id = $1 AND version = $2`.

Der Grund für die Kapselung: die naheliegende Alternative — lesen, Version vergleichen, schreiben —
hat ein Race-Fenster zwischen den beiden Anweisungen und verliert dort still Daten. Sie sieht
korrekt aus und ist in fast allen Läufen unauffällig.

Das Modul bietet zusätzlich Varianten für bereits gesperrte Zeilen bzw. Aggregate:

- `updateLockedVersioned`: nutzt `updateVersioned` für eine ID mit erwarteter Version. Der Aufrufer hält in
  derselben Transaktion die Zeilen- oder zuständige Aggregatsperre und liest die Version unter dieser Sperre.
  Ein Fehlschlag ist eine verletzte Invariante und wirft einen Fehler zum Transaktionsabbruch statt einer 409.
- `updateLockedVersionedBy`: für einen zusammengesetzten Schlüssel, etwa `(form_id, block_id)` am Bogenschritt.
  Der Aufrufer hält die Aggregatsperre und übergibt ein eindeutiges, vollständiges `where` sowie die unter der
  Sperre gelesene `expectedVersion`. Schlüssel und Version werden atomar im `UPDATE` geprüft; kein Treffer wirft
  einen Fehler. Anders als `updateVersioned` setzt diese Variante `updated_at` nicht automatisch.
- `updateLockedVersionedSet`: ändert eine gezielt gefilterte Zeilenmenge innerhalb eines gesperrten Aggregats und
  erhöht jede betroffene Version **ohne Einzelversionsvergleich**. Nur für interne Folgeänderungen, deren
  konkurrierende Schreibwege dieselbe Aggregatsperre beachten, z. B. das Zurücksetzen angeforderter Blockprüfungen
  beim erneuten Absenden. Kein Ersatz für den Versionsvergleich eines Nutzerbefehls. Ein leeres Ergebnis ist
  zulässig; `updated_at` wird nicht automatisch gesetzt.

Die Sperrvarianten erwerben selbst keine Sperre. Bei `By` und `Set` muss der Aufrufer immer ein konkretes,
fachlich begrenztes `where` übergeben, niemals `undefined`. Fachliche Berechtigungs-, Status- und gegebenenfalls
Nutzer-Versionsprüfungen bleiben beim Aufrufer und erfolgen unter der zuständigen Sperre.

Verbindlich:

- Kein Command-Handler schreibt `version` selbst, und keiner baut sein eigenes Konflikt-Handling.
- Die Ablehnung wegen veralteter Version baut ausschließlich `versionConflict(currentVersion, current)`
  (`version-conflict.ts`); kein Handler schreibt das Konflikt-Objekt von Hand.
- Kein Datenbank-Trigger erhöht `version` — sonst springt sie für Aufrufer dieses Helpers um zwei.
- `not_found` und `version_conflict` bleiben unterscheidbar. Eine gelöschte Zeile darf der UI nicht
  als „jemand war schneller" erscheinen.
- Die Route gibt bei `version_conflict` den `VersionConflictDto` als Body zurück — mit
  `currentVersion` **und** `current`, damit der Client die Eingaben des Nutzers nicht verwerfen muss.
- Löschen und Statuswechsel sind ebenfalls Writes und tragen die Version mit.

Die Datenbank-Garantie dahinter (gleichzeitige Writes ergeben genau einen Gewinner) ist in
`packages/db/scripts/smoke-crm-constraints.ts` abgesichert. Zusätzlich führt
`update-versioned.integration.test.ts` den echten Helper gegen PostgreSQL aus; der schnelle
Unit-Test deckt seine Verzweigungen isoliert ab.

## CRM-Zugriffsfilter

`crmAccessCondition.forScope` ist der einzige Query-Builder für gebundene CRM-Rechte. Er wird
vor dem Laden oder Mapping der Daten direkt in die `WHERE`-Klausel eingebunden. Ein leerer Scope
ergibt eine deny-all-Bedingung; Rendering und Mapper dürfen Sichtbarkeit nie nachträglich filtern.
