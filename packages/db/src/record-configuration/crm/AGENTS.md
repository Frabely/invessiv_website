# AGENTS.md — CRM-Drizzle-Modelle

Gilt für `packages/db/src/record-configuration/crm/**`. Ergänzt `packages/db/AGENTS.md`.

Die Regeln, die für **alle** Tabellen gelten, stehen dort und werden hier nicht wiederholt:
DB-Defaults sind die Ausnahme, Migration und Modell sind deckungsgleich, CHECK-Constraints über
`sqlCheckIn`, Migrationsregeln. Diese Datei enthält nur, was am CRM anders ist.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Warum ein eigener Unterordner

`record-configuration/` war flach, wächst durch das CRM aber um rund ein Dutzend Modelle. Der
Unterordner mit eigenem Barrel ist eine bewusste Abweichung von der flachen Struktur, damit
Lead- und CRM-Modelle nicht in einem Sammelordner verschwimmen.

`activities.ts` gehört bewusst **nicht** hierunter: die Tabelle bedient Leads und Kunden gemeinsam (Ordner 02) und ist
damit keine CRM-Kindtabelle.

## Verbindlich

- Tabellennamen folgen der Präfix-Regel aus `plans/crm/00-entscheidungen.md`: Kindtabellen eines
  Aggregats tragen dessen Namen als Präfix (`customer_contact_assignments`), eigenständige und
  querschnittliche Tabellen nicht (`people`, `customers`, `workspace_members`).
- Jedes Modell wird im Barrel `crm/index.ts` re-exportiert, das `record-configuration/index.ts`
  weitergibt. Das Barrel speist automatisch die Tabellenliste des DB-Smokes (`scripts/contact-table-names.ts`) — ein
  fehlender Export fällt dort auf.
- Bearbeitbare Tabellen haben `version integer NOT NULL CHECK (version > 0)`; der anlegende
  Schreibpfad setzt `1` explizit, und nur `updateVersioned` erhöht sie danach.

## Fragebogen-Baukasten und Onboarding (Ordner 15)

- **Zwei Präfixe:** Die Definitionstabellen des Baukastens sind fachneutral und heißen `questionnaire_*`
  (`questionnaire_templates`, `_template_blocks`, `_blocks`, `_block_translations`, `_fields`, `_field_translations`,
  `_field_choices`, `_choice_translations`). Bogen, Prüfung, Antworten, Gruppeneinträge, Datei-Verknüpfung und
  Leistungs-Snapshot gehören zum Onboarding und heißen `onboarding_*`.
- **Katalog und Bogen teilen die Definitionstabellen.** `questionnaire_blocks.owner_form_id IS NULL` ist ein
  Katalogblock, sonst gehört der Block genau einem Bogen (tiefe Snapshot-Kopie). Es gibt kein zweites Schema für
  „Vorlage“ und „Kopie“; `onboarding_form_blocks` bindet einen Schritt per zusammengesetztem Schlüssel
  `(block_id, form_id) → questionnaire_blocks (id, owner_form_id)` an einen Block desselben Bogens.
- **Tabellenübergreifende Regeln sichert der Schreibpfad**, nicht die Datenbank (ohne Trigger nicht ausdrückbar):
  Vorlagen referenzieren nur Katalogblöcke, Bedingungen zeigen auf ein Auslöserfeld im selben Block auf derselben
  Ebene mit kleinerer Position, Antworten/Dateien/Gruppeneinträge hängen nur an Feldern desselben Bogens, genau eine
  Gruppenebene. Was die Datenbank selbst erzwingt, deckt `scripts/crm-smoke/onboarding-checks.ts` ab; die übrigen
  Regeln brauchen Integrationstests am jeweiligen Schreibpfad.
- **Bedingung als ein zusammengesetzter Schlüssel** `(condition_choice_id, condition_field_id) →
questionnaire_field_choices (id, field_id)`: Er bindet die Option an das Auslöserfeld und leert beim Löschen der
  Option (oder des Auslöserfelds samt Optionen) beide Spalten gemeinsam, sodass `condition_pair_check` nie bricht.
  Zwei einzelne `SET NULL`-Schlüssel würden nur eine Spalte leeren und den Löschvorgang abbrechen.
- `questionnaire_fields` und `questionnaire_field_choices` referenzieren sich gegenseitig; ihre Extra-Config ist deshalb
  mit `PgTableExtraConfigValue[]` annotiert, sonst bricht die Typinferenz.
- Übersetzungstabellen (`*_translations`) haben einen Primärschlüssel `(element_id, locale)`; mindestens eine Zeile je
  Element prüft der Schreibpfad.

## Bewusst nicht vorhanden

- Kein Unique-Index auf `customers.company_name`: zwei echte „Müller GmbH" in verschiedenen Städten
  sind ein gültiger Zustand.
- Kein Unique-Index auf `people.primary_email`: die Adresse autorisiert nie und ist kein
  Dubletten-Schutz. Dubletten verhindert die Personensuche im Dialog.
- Kein `deleted_at`. Archivierung läuft über den Status und ist reversibel.
- Kein `archived_at` an `projects`: Archivierung ist ausschließlich ein Status.

## Sammelaufgaben (`tasks`)

- Eine Aufgabe hat höchstens eine Herkunft: `feedback_round_id` (Task 58) oder `onboarding_form_id` (Task 68,
  Migration `0049`), abgesichert durch `tasks_single_origin_check`. Beide sind immer intern
  (`*_side_check`), je Runde bzw. Bogen einmalig (partieller Unique-Index) und über einen zusammengesetzten
  Schlüssel an dasselbe Projekt gebunden. Der Fremdschlüssel auf den Bogen kaskadiert nicht.
