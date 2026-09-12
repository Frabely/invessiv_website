# AGENTS.md — Geteilte Workspace-Server-Bausteine

Gilt für `apps/workspace/src/server/workspace/shared/**`. Ergänzt `src/server/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Was hier hingehört

Serverseitige Bausteine, die **mehrere** Workspace-Domänen benutzen und keiner davon gehören.
Aktuell: das Concurrency-Muster.

Ein Baustein zieht erst hierher, wenn er **tatsächlich** einen zweiten Nutzer hat — nicht
vorsorglich. Domänenspezifisches bleibt bei der Domäne.

## `updateVersioned` ist der einzige Weg

`update-versioned.ts` kapselt genau ein atomares
`UPDATE … SET version = version + 1 WHERE id = $1 AND version = $2`.

Der Grund für die Kapselung: die naheliegende Alternative — lesen, Version vergleichen, schreiben —
hat ein Race-Fenster zwischen den beiden Anweisungen und verliert dort still Daten. Sie sieht
korrekt aus und ist in fast allen Läufen unauffällig.

Verbindlich:

- Kein Command-Handler schreibt `version` selbst, und keiner baut sein eigenes Konflikt-Handling.
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
