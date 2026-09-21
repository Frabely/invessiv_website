# AGENTS.md — Workspace CRM (Server)

Gilt für `apps/workspace/src/server/workspace/crm/**`. Ergänzt `src/server/AGENTS.md`; bei
Widerspruch gewinnt die spezifischere Datei. Die Umsetzungsregeln des Vorhabens stehen in
`apps/workspace/plans/crm/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Abgrenzung

- Hier liegt ausschließlich der **interne** CRM-Serverpfad: Command-Handler, Query-Handler,
  Services und Schemas.
- Portalcode gehört nach `src/server/portal/**` und wird **nie** von hier importiert oder
  wiederverwendet — auch nicht mit einem Parameter, der entscheidet, wer fragt.
- DTOs und Konstanten gehören nach `packages/common`, nicht hierher. Sobald ein Typ, eine Konstante
  oder ein Pattern exportiert wird, wandert es vorher dorthin.

## Verbindliche Invarianten

- **Ein Kunde hat immer genau einen Primärkontakt.** Die Datenbank erzwingt höchstens einen (partieller Unique-Index),
  der atomare Create-Command mindestens einen. Ein Handler, der eine
  Zuordnung löst, prüft vorher, dass danach noch ein Primärkontakt existiert.
- `CustomerSummaryDto.primaryContactName` ist non-nullable. Der Mapper wirft
  `MissingPrimaryContactError`, statt einen fehlenden Primärkontakt still darzustellen.
  `primaryContactEmail` ist dagegen nullable: Ein gültiger Primärkontakt kann Name und Telefon,
  aber keine E-Mail besitzen.
- Kontakt-Contracts führen `personVersion` und `assignmentVersion` getrennt. Ein einzelnes
  `version`-Feld darf die unabhängigen Versionsstände der globalen Person und ihrer
  kundenspezifischen Zuordnung nicht vermischen.
- **Kein Löschpfad für Kunden.** Archivierung ist ausschließlich `status = 'archived'` und
  reversibel. Der einzige echte Löschweg ist der Owner-Purge aus Task 34.
- **Eine Projektleistung gehört zu genau einem Projekt.** `project_line_items` hat bewusst keine Kundenspalte:
  der Kunde wird über das Projekt abgeleitet. Kein Handler nimmt eine `customerId` für diesen Pfad entgegen, und es
  gibt weder kundenweite Positionen noch eine Tabelle `customer_packages`.
- **Eine Projektleistung ist ein vollständiger Snapshot.** Titel, Beschreibung, Preis, Preisart und Intervall werden
  beim Zuweisen kopiert. `source_line_item_template_id` ist ausschließlich Herkunftsnachweis, wird nie mitgeschrieben
  und wird beim Löschen des Templates auf null gesetzt. Es gibt keine Synchronisation in beide Richtungen.
- **Zuweisen geht nur aus einem aktiven Template.** Archivierte oder unbekannte Templates werden im Command
  abgewiesen, nicht erst in der UI ausgeblendet.
- **Kein Löschpfad für Projektleistungen.** Eine Position verschwindet nur mit ihrem Projekt (`ON DELETE CASCADE`).
- Kundennummern haben Lücken. Das ist gültig; keine Nummer wird wiederverwendet, und es gibt keine
  Logik, die Lücken „reparieren" will.

## Schreibpfad

- Client-`fetch` → Route Handler → Command-Handler. Keine Server Actions.
- Handler liefern Result-Unions und werfen nicht für erwartete Fachfehler. Die Route mappt
  Fehlercodes über eine nicht-exportierte Message-Map auf `HttpResponseCode`.
- **Versionierte Writes ausschließlich über `updateVersioned`** aus
  `src/server/workspace/shared/update-versioned.ts`. Kein SELECT-dann-UPDATE, kein eigenes
  `version`-Handling.
- Jede Mutation an einer bearbeitbaren Entität nimmt `VersionedWriteInput` an. Ohne Version ist es
  ein Contract-Fehler, kein „optional".

## Datenbank

- Zugriff über die kanonischen Drizzle-Modelle aus
  `packages/db/src/record-configuration/crm/**`. Keine Tabellen- oder Spaltennamen als freie
  SQL-Strings.
- Mehrschrittige Writes laufen in einer Transaktion. Kunde und Primärkontakt entstehen gemeinsam
  oder gar nicht.
- Sichtbarkeitsfilter gehören in die `WHERE`-Klausel, nie ins Rendering.
- **Zugriffsbereiche:** Jede CRM-Query erhält den `WorkspaceActor` und grenzt ihre Daten über
  `accessScope` und `crmAccessCondition` in der `WHERE`-Klausel ein. Jeder ressourcenbezogene
  Command prüft `canOn`; fremde Kunden und Projekte verhalten sich wie nicht vorhanden (404),
  nicht wie ein Berechtigungsfehler.
