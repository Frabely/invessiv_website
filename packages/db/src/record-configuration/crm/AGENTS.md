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

## Ergebnishistorie (Ordner 28)

- `feedback_round_item_result_history` hält unveränderliche Folgezustände je Punktversion. `baseline` dokumentiert
  den vorhandenen Stand vor der ersten Änderung, `set` ein Ergebnis und `reset` den geleerten Zustand.
- Keine eigene bearbeitbare Version, kein `updated_at`, kein Update-Pfad. Nur die Löschung des Punkts kaskadiert
  seine Historie. Entfernte Portalmitgliedschaften leeren den Autorbezug; interne Mitgliedsreferenzen bleiben geschützt.
- `(item_id, item_version)` ist eindeutig, `(item_id, command_id)` bei gesetzter Kennung ebenfalls.
  Alle Fachwerte kommen vom Schreibpfad; nur `created_at` hat einen DB-Default.

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
- `created_by_portal_membership_id` (Migration `0051`) markiert eine Aufgabe, die ein Kundenkontakt im Portal
  angelegt hat. Sie ist keine Sammelaufgabe und fällt nicht unter `tasks_single_origin_check`; der Fremdschlüssel
  kaskadiert nicht, damit die Mitgliedschaftshistorie referenzierbar bleibt.

## Stunden (Ordner 20)

Plan: `apps/workspace/plans/crm/20-stunden-und-history/README.md`.

- Drei Tabellen: `customer_hour_purchases` (gekaufte Stunden, Korrekturen negativ), `project_hour_allocations`
  (positiv = zugewiesen, negativ = freigegeben) und `project_time_entries` (Zeitbuchungen). Stände werden nie
  gespeichert, sondern immer als Summe über diese Zeilen berechnet.
- **Die beiden Buchungstabellen sind unveränderlich:** keine `version`, kein `updated_at`, kein Update- und kein
  Löschpfad. Ein Fehler wird durch eine Gegenzeile ausgeglichen. Nur `project_time_entries` ist versioniert.
- Alle drei tragen `customer_id`; Zuweisungen und Zeitbuchungen hängen zusätzlich über
  `(project_id, customer_id) → projects (id, customer_id)` am Projekt. Eine Zeile an einem fremden Projekt ist damit
  in der Datenbank unmöglich.
- `project_time_entries.task_id` bindet über `(task_id, project_id) → tasks (id, project_id)` an eine Aufgabe
  desselben Projekts; das Ziel ist der Unique-Index `tasks_id_project_uidx`. Der Schlüssel kaskadiert nicht: Aufgaben
  verschwinden nur mit ihrem Projekt, und dann fällt die Buchung über ihren eigenen Projektschlüssel weg.
- **Regeln über mehrere Zeilen sichert der Schreibpfad**, nicht die Datenbank: Zuweisen höchstens bis zum freien
  Bestand, Freigeben höchstens bis zum unverbrauchten Teil, Korrektur nie unter die zugewiesene Summe. Der Schreibpfad
  sperrt dafür die Kundenzeile. Was die Datenbank selbst erzwingt, deckt `scripts/crm-smoke/hours-checks.ts` ab.
- `idempotency_key` (unique) an beiden Buchungstabellen: Ein wiederholter Request ist dieselbe Zeile, keine zweite.
- `source` an der Kaufbuchung ist `manual` oder seit Task 74 `project_line_item` (siehe „Leistungsarten“). Weitere
  Herkünfte (monatliche Zubuchung) erweitern Const-Objekt und CHECK in einer eigenen additiven Migration.

## Leistungsarten (Ordner 13c, Task 74)

- `line_item_templates` trägt `kind`, `project_mode`, `portal_requestable` und `portal_description`,
  `project_line_items` trägt `kind` und `quantity_minutes`. **Alle sechs Spalten sind bewusst nullable:** Die
  vorherige App-Version schreibt sie nicht. `NULL` heißt Standard, bestehendes Projekt bzw. nicht freigegeben; die
  CHECKs sind deshalb NULL-sicher geschrieben (`IS DISTINCT FROM`, `IS NOT DISTINCT FROM`).
- Eine Menge gibt es genau bei `kind = hours` (`project_line_items_kind_quantity_check`).
- `customer_hour_purchases.source` kennt zusätzlich `project_line_item`: gutgeschrieben zusammen mit einer
  Stunden-Leistung, deren ID der `idempotency_key` ist.
- Was die Datenbank selbst erzwingt, deckt `scripts/crm-smoke/line-item-checks.ts` ab; die Regeln, die das Projekt
  oder den Stundenbestand brauchen, sichert `projectLineItemAssignmentService`.

## Leistungsanfragen (Ordner 13c, ab Task 75)

- `service_requests` bindet Wunsch- und Ergebnisprojekt sowie die anfragende Portalmitgliedschaft
  über zusammengesetzte Fremdschlüssel an denselben Kunden. `portal_memberships` besitzt dafür
  zusätzlich den eindeutigen Schlüssel `(id, customer_id)`.
- Fachwerte sind explizit: Art, Titel, Kundentext, Projektwunsch, Mitgliedschaft, Status,
  Idempotenzschlüssel und Version haben keine DB-Defaults. Stundenmengen sind positiv, in
  Viertelstunden und auf die Ledger-Grenze begrenzt; andere Arten tragen keine Menge.
- Vorlagen und zugewiesene Leistungen dürfen als Herkunft entfallen (`ON DELETE SET NULL`).
  Annahme benötigt Ergebnisprojekt und interne Entscheidung; Ablehnung einen nicht leeren Grund.
- **Angebot:** `offered_price_cents` und `offered_minutes` sind nullable: Vor einem Angebot und bei einer
  Annahme ohne Angebot gibt es keinen Wert. Der Preis ist nicht negativ; angebotene Stunden gibt es nur bei
  Art `hours`, mit denselben Grenzen wie die angefragte Menge.
- **Bewusste Löschregeln, heute ohne Löschpfad im Code:** Ein gelöschtes Projekt löscht per `CASCADE` alle
  Anfragen, die es gewünscht oder erhalten haben, samt Verlauf. Eine Portalmitgliedschaft mit Anfragen lässt
  sich dagegen nicht löschen (Fremdschlüssel ohne `ON DELETE`), ebenso wenig ein Mitglied, das entschieden hat.
  Wer einen Löschpfad für Projekte, Mitgliedschaften oder Kontakte baut, entscheidet diese Regeln vorher neu
  (Verlauf erhalten heißt: `SET NULL` statt `CASCADE`, bzw. Mitgliedschaft deaktivieren statt löschen).
- Die Migration ergänzt `service_requests.read/write` für Owner und Member.
  Die Rechte sind intern und kundenbezogen bindbar.
