# Ordner 20 — Stundenkontingente

> **Status:** läuft · **Abhängigkeiten:** 03, 04, 07, 07b, 08, 12a, 12b, 13 (alle im Code vorhanden)
> **Aufwand:** 7–9 Tage · **Reviewziel:** 20.1 ≈ 70–85 Dateien, 20.2 ≈ 65–80 Dateien, 20.3 ≈ 45–60 Dateien
>
> **Neuzuschnitt 08.10.2026 (mit dem Owner abgestimmt).** Ersetzt den früheren Stand „`retainers` + `time_entries`,
> Kontingent mit Zeitraum am Kunden“. Der interne Kundenverlauf (Task 29) gehört nicht mehr zu diesem Ordner und liegt
> unverändert als Skizze in `20e-kundenverlauf/`. Der Ordnername bleibt aus Pfadgründen `20-stunden-und-history`.

Diese README und die drei Task-Dateien sind so geschrieben, dass sie ohne Vorwissen aus dem Planungsgespräch
umsetzbar sind. Jede Pfadangabe ist gegen den Stand des Repositories am 08.10.2026 geprüft (Branch
`feat/crm-credentials-2-portal`, höchste Migration `0055`). Vor dem Start trotzdem lesen: `plans/crm/AGENTS.md`,
`plans/crm/00-entscheidungen.md` (Abschnitt „Renewals, Stunden und Aufbewahrung“) und die `AGENTS.md` am jeweiligen
Zielordner. Weicht der Code von einer Pfadangabe ab, gilt der Code; die Abweichung wird im PR genannt.

## Worum es geht

Kunden kaufen Stunden (z. B. 10 h Betreuung nach dem Launch). Bisher steht nirgends, wie viele davon noch übrig sind
und wofür sie verbraucht wurden. Künftig:

- trägt ein berechtigter Mitarbeiter gekaufte Stunden am Kunden ein und erhöht sie später,
- weist er freie Stunden einem Projekt zu; zugewiesene Stunden sind für andere Projekte geblockt,
- bucht das Team Zeit in 15-Minuten-Schritten auf ein Projekt, optional mit einer Aufgabe verknüpft,
- sieht der Kunde im Portal je Projekt und gesamt: gekauft, verbraucht, übrig und (je nach Recht) wofür.

## Begriffe und Rechnung

| Begriff     | Bedeutung                                                               | Berechnung                           |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Gekauft     | Summe aller Kaufbuchungen des Kunden (Korrekturen sind negativ)         | `Σ customer_hour_purchases.minutes`  |
| Zugewiesen  | Was einem Projekt zusteht (Zuweisungen minus Freigaben)                 | `Σ project_hour_allocations.minutes` |
| Frei        | Gekauft, aber noch keinem Projekt zugewiesen                            | Gekauft − Zugewiesen (alle Projekte) |
| Verbraucht  | Berechnete Zeitbuchungen (`billable = true`)                            | `Σ duration_minutes`                 |
| Kulanz      | Nicht berechnete Zeitbuchungen (`billable = false`); zählen nirgends ab | `Σ duration_minutes`                 |
| Projektrest | Kann negativ sein („überzogen“)                                         | Zugewiesen − Verbraucht (je Projekt) |
| Freigebbar  | Was ein Projekt zurückgeben kann                                        | `max(0, Projektrest)`                |
| Kundenrest  | Was der Kunde insgesamt noch hat; kann negativ sein                     | Gekauft − Verbraucht (alle Projekte) |

Alle Werte sind ganze Minuten, Vielfache von 15. Kein Wert wird gespeichert; alles wird aus den drei Tabellen
berechnet. Angezeigt wird `h:mm` (z. B. `1:30`, negativ `−1:00`).

**Rechenbeispiel (verbindlich, wird als Test abgebildet):**

1. Kunde kauft 10:00. → Gekauft 10:00, Frei 10:00.
2. Projekt A bekommt 5:00, Projekt B 5:00. → Frei 0:00.
3. Auf A werden 2:30 gebucht, auf B 6:00. → A Rest 2:30, B Rest −1:00 (überzogen), Kundenrest 1:30.
4. B gleicht sich **nicht** automatisch aus A aus. Es bleibt überzogen, bis jemand ausdrücklich handelt:
   A gibt 1:00 frei (A zugewiesen 4:00, Frei 1:00), danach wird B 1:00 zugewiesen (B zugewiesen 6:00, Rest 0:00).
   Alternativ kauft der Kunde Stunden nach.
5. Eine Korrektur der Kaufbuchung um −1:00 wird in Schritt 2 abgelehnt (Gekauft 9:00 < Zugewiesen 10:00).

## Lesereihenfolge und Lieferung

| PR   | Status    | Branch                                                  | Task                                          | Nach dem Merge nutzbar                                                           |
| ---- | --------- | ------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| 20.1 | im Review | `feat/crm-stunden-1-kontingent`                         | [Task 27](./27-kontingent-und-zuweisung.md)   | Stunden am Kunden gutschreiben und korrigieren, Projekten zuweisen und freigeben |
| 20.2 | im Review | `feat/crm-stunden-1-kontingent` (noch nicht abgezweigt) | [Task 72](./72-zeitbuchungen-und-aufgaben.md) | Zeit auf Projekte buchen, ändern, löschen; Aufgabe verknüpfen; Kulanz            |
| 20.3 | im Review | `feat/crm-stunden-3-portal`                             | [Task 73](./73-stunden-im-portal.md)          | Portal-Widget „Stunden“ mit Stand je Projekt, Kaufhistorie und Buchungsliste     |

Nach jedem PR ist `master` deploybar. Das Schema aller drei Tabellen entsteht vollständig in 20.1; bis 20.2 bleibt
`project_time_entries` leer und „Verbraucht“ ist überall 0:00. Bis 20.3 bleibt das Portal-Widget `hours` ein Mock.

Status pflegen: beim Start `offen` → `läuft`, vor Übergabe `im Review`, nach Merge `gemerged` — hier in der Tabelle
und in der Merge-Tabelle von `00-entscheidungen.md` (Zeile 20).

## Entscheidungen (08.10.2026)

| Bereich             | Entscheidung                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kontingent          | Kaufbuchungen: jedes Gutschreiben ist eine eigene, unveränderliche Zeile am Kunden (Datum, Minuten, kundensichtbare Notiz, wer). Es gibt kein überschreibbares Feld „Stunden“                    |
| Verringern          | Nur als negative Korrekturzeile und nur so weit, dass Gekauft ≥ Zugewiesen bleibt                                                                                                                |
| Zuweisung           | Ebenfalls unveränderliche Zeilen: positiv = zuweisen, negativ = freigeben. Zuweisen höchstens bis „Frei“, Freigeben höchstens bis „Freigebbar“. Jederzeit möglich, auch im laufenden Projekt     |
| Kein Automatismus   | Ein überzogenes Projekt bedient sich nie aus einem anderen Projekt oder aus „Frei“. Ausgleich nur durch ausdrückliches Freigeben/Zuweisen oder eine neue Kaufbuchung                             |
| Zeitbuchung         | Immer auf genau ein Projekt. Dauer 0:15 bis 24:00 in 15-Minuten-Schritten, Datum nie in der Zukunft. Überziehung erlaubt und sichtbar ausgewiesen, nie blockiert                                 |
| Aufgabe             | Optional genau eine Aufgabe desselben Projekts, jeder Status außer `cancelled`. Eine Aufgabe kann beliebig viele Buchungen haben und braucht nie eine. Nichts an `tasks` wird Pflicht            |
| Beschreibung        | Jede Zeitbuchung hat eine eigene, kundensichtbare Beschreibung (Pflicht, 1–500 Zeichen). Mit Aufgabe ist sie mit dem Aufgabentitel vorbelegt und änderbar                                        |
| Kulanz              | `billable = false`: Die Buchung ist sichtbar (auch im Portal, als „nicht berechnet“), zählt aber nicht in „Verbraucht“                                                                           |
| Korrigieren         | Zeitbuchungen sind versioniert änder- und löschbar; jede Änderung schreibt eine Activity mit Vorher/Nachher. Das Projekt einer Buchung ändert sich nie                                           |
| Verfall             | Keiner. Kein Zeitraum, kein Ablaufdatum, keine Automatik                                                                                                                                         |
| Später anschließen  | `customer_hour_purchases.source` ist heute immer `manual`. Ordner 13c ergänzt `service_request`, die monatliche Wartungszubuchung (Ordner 20c) `recurring` — je eine additive Migration am CHECK |
| Portal-Sichtbarkeit | Es gibt keinen Schalter je Buchung: Jede Zeitbuchung und jede Kaufbuchung ist portalöffentlich. Formulare weisen darauf hin                                                                      |
| Portalrechte        | `portal.hours.read` (Stand und Kaufhistorie) und `portal.hours.entries.read` (Buchungen im Detail). Beide liegen in `portal_standard`; eine eigene Portalrolle kann das Detailrecht weglassen    |
| Preise              | Stundensatz, Budget und Preise erreichen nie ein Stunden-DTO. Stunden sind informativ, keine Rechnungsgrundlage und keine Lexware-Schnittstelle                                                  |
| Feature-Flag        | Keines. Das Repository hat keine Flag-Infrastruktur; sichtbar wird der Bereich über Rechte und (im Portal) über `mock: false` in der Widget-Registry                                             |

## Datenmodell

Eine Migration in Task 27 (Nummer im Repository ermitteln: höchste bestehende plus eins). Keine Defaults außer den
Zeitstempeln, IDs erzeugt der Schreibpfad (`crypto.randomUUID()`), Regeln aus `packages/db/AGENTS.md`.

```txt
customer_hour_purchases                       unveränderlich (kein UPDATE, kein DELETE, keine version)
  id uuid PK
  customer_id uuid NOT NULL                   → customers.id ON DELETE CASCADE
  kind text NOT NULL                          CHECK in HOUR_PURCHASE_KIND_VALUES (purchase | correction)
  source text NOT NULL                        CHECK in HOUR_PURCHASE_SOURCE_VALUES (manual)
  minutes integer NOT NULL                    CHECK minutes <> 0 AND minutes % 15 = 0 AND abs(minutes) <= 600000
  purchased_on date NOT NULL
  note text NOT NULL                          kundensichtbar, leerer String erlaubt, length <= 200
  idempotency_key uuid NOT NULL               UNIQUE
  created_by_member_id uuid NOT NULL          → workspace_members.id (kein Cascade)
  created_at timestamptz NOT NULL DEFAULT now()

  CHECK  (kind = 'purchase' AND minutes > 0) OR (kind = 'correction' AND minutes < 0)
  INDEX  (customer_id, purchased_on DESC, created_at DESC)

project_hour_allocations                      unveränderlich
  id uuid PK
  customer_id uuid NOT NULL                   → customers.id ON DELETE CASCADE
  project_id uuid NOT NULL                    (project_id, customer_id) → projects (id, customer_id) ON DELETE CASCADE
  minutes integer NOT NULL                    CHECK minutes <> 0 AND minutes % 15 = 0 AND abs(minutes) <= 600000
                                              positiv = zugewiesen, negativ = freigegeben
  note text NOT NULL                          intern, leerer String erlaubt, length <= 200
  idempotency_key uuid NOT NULL               UNIQUE
  created_by_member_id uuid NOT NULL          → workspace_members.id
  created_at timestamptz NOT NULL DEFAULT now()

  INDEX  (customer_id, created_at DESC)
  INDEX  (project_id)

project_time_entries                          versioniert
  id uuid PK
  customer_id uuid NOT NULL                   → customers.id ON DELETE CASCADE
  project_id uuid NOT NULL                    (project_id, customer_id) → projects (id, customer_id) ON DELETE CASCADE
  task_id uuid NULL                           (task_id, project_id) → tasks (id, project_id), kein Cascade
  performed_on date NOT NULL
  duration_minutes integer NOT NULL           CHECK > 0 AND % 15 = 0 AND <= 600000
  description text NOT NULL                   kundensichtbar, CHECK btrim(description) <> '' AND length <= 500
  billable boolean NOT NULL
  performed_by_member_id uuid NOT NULL        → workspace_members.id
  version integer NOT NULL                    CHECK version > 0, Anlage schreibt 1
  created_at timestamptz NOT NULL DEFAULT now()
  updated_at timestamptz NOT NULL DEFAULT now()

  INDEX  (project_id, performed_on DESC, created_at DESC)
  INDEX  (customer_id, performed_on DESC, created_at DESC)
  INDEX  (task_id) WHERE task_id IS NOT NULL

tasks                                         bestehend
  + UNIQUE INDEX tasks_id_project_uidx (id, project_id)     Ziel des zusammengesetzten Fremdschlüssels
```

Begründungen:

- **`customer_id` an allen drei Tabellen** (anders als `tasks`): Die Summen je Kunde sind die häufigste Abfrage, und
  der zusammengesetzte Fremdschlüssel `(project_id, customer_id)` macht eine Zeile an einem fremden Projekt in der
  Datenbank unmöglich. Vorlage: `packages/db/src/record-configuration/crm/files.ts` (`ProjectCustomerForeignKey`);
  das Ziel `projects_id_customer_uidx` existiert.
- **`(task_id, project_id)`** bindet die Aufgabe an dasselbe Projekt. `tasks` hat keinen Löschpfad; eine Aufgabe
  verschwindet nur mit ihrem Projekt, und dann fällt die Zeitbuchung über ihren eigenen Projekt-Cascade mit weg. Ein
  `SET NULL` am zusammengesetzten Schlüssel würde auch `project_id` leeren und ist deshalb ausgeschlossen.
- **Unveränderliche Buchungszeilen** statt eines Zählers: Ein gespeicherter Stand und sein Verlauf können
  auseinanderlaufen, eine Summe über Zeilen nicht. Der Kunde sieht außerdem, wann er wie viel gekauft hat.
- **`idempotency_key`**: Ein Doppelklick darf keine Stunden verdoppeln. Der Client erzeugt den Schlüssel beim Öffnen
  des Dialogs; derselbe Schlüssel am selben Kunden liefert die bestehende Zeile als Erfolg, an einem anderen Kunden
  `VALIDATION_ERROR`. Zeitbuchungen haben keinen Schlüssel: Eine doppelte Buchung ist sichtbar und löschbar.
- **Tabellennamen** folgen der Präfix-Regel (`packages/db/src/record-configuration/crm/AGENTS.md`): Kindtabellen
  tragen den Namen ihres Aggregats. Die früher in `00-entscheidungen.md` genannten Namen `retainers` und
  `time_entries` sind damit ersetzt.

**Nebenläufigkeit:** Jede Kaufbuchung und jede Zuweisung/Freigabe sperrt zuerst die Kundenzeile
(`SELECT id FROM customers WHERE id = $1 FOR UPDATE`), liest dann die Summen und prüft die Regel. Zwei parallele
Zuweisungen können „Frei“ so nie gemeinsam überziehen. Zeitbuchungen sperren nichts: Überziehung ist erlaubt, und
eine Buchung, die gleichzeitig mit einer Freigabe eintrifft, führt höchstens zu einem überzogenen Projekt — einem
gültigen Zustand.

## Rechte

Drei neue interne Permissions (Task 27) und zwei neue Portal-Permissions (Task 73).

| Permission                  | Realm     | Bindbar an     | Systemrollen                          | Erlaubt                                               |
| --------------------------- | --------- | -------------- | ------------------------------------- | ----------------------------------------------------- |
| `hours.read`                | workspace | Kunde, Projekt | `workspace_owner`, `workspace_member` | Stand, Kaufhistorie, Zuweisungen, Zeitbuchungen sehen |
| `hours.write`               | workspace | Kunde, Projekt | `workspace_owner`, `workspace_member` | Zeitbuchungen anlegen, ändern, löschen                |
| `hours.manage`              | workspace | Kunde          | nur `workspace_owner`                 | Kaufbuchungen und Korrekturen, Zuweisen und Freigeben |
| `portal.hours.read`         | portal    | —              | `portal_standard`                     | Stand je Projekt und gesamt, Kaufhistorie             |
| `portal.hours.entries.read` | portal    | —              | `portal_standard`                     | Zeitbuchungen mit Datum, Dauer, Beschreibung, Aufgabe |

Alle fünf sind `delegable: true`. `hours.manage` gelangt an weitere Mitarbeiter über eine eigene Rolle
(Settings → Rollen), wie `credentials.write`.

| Aktion                           | Intern                                        | Portal (ab 20.3)                                              |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Kundenstand und Kaufhistorie     | `hours.read` am Kunden                        | `portal.hours.read`                                           |
| Stand eines Projekts             | `hours.read` im Zugriffsbereich des Projekts  | `portal.hours.read`, Projekt im Portal sichtbar               |
| Zeitbuchungen lesen              | `hours.read` im Zugriffsbereich des Projekts  | `portal.hours.entries.read`                                   |
| Zeit buchen, ändern, löschen     | `hours.write` im Zugriffsbereich des Projekts | —                                                             |
| Stunden gutschreiben/korrigieren | `hours.manage` am Kunden                      | —                                                             |
| Zuweisen und freigeben           | `hours.manage` am Kunden                      | —                                                             |
| Owner-Portalsicht                | —                                             | beide Leserechte; das Portal schreibt bei Stunden ohnehin nie |

Eine Projektbindung von `hours.read` zeigt nur den Stand und die Buchungen dieses Projekts, nicht den Kundenstand
(Gekauft, Frei) und nicht die Kaufhistorie. Fremde Kunden und fremde Projekte verhalten sich wie nicht vorhanden (404).

## Was bewusst nicht enthalten ist

| Thema                              | Wohin                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Stunden über eine Leistungsanfrage | Ordner 13c: Die Übernahme einer angenommenen Anfrage ruft `hoursLedgerService.insertPurchase` mit `source = service_request` |
| Monatliche automatische Zubuchung  | Ordner 20c (Jobs): Job legt Kaufbuchungen mit `source = recurring` an; braucht eine Regel je Kunde                           |
| Verfall von Stunden                | Nicht geplant. Käme als eigene Buchungsart (`kind = expiry`) an derselben Tabelle                                            |
| Warnung bei wenig Rest             | Ordner 20c (Glocke, Kundenmail). Überziehung ist ab 20.2 bereits im Cockpit und ab 20.3 im Portal sichtbar                   |
| CSV-Leistungsnachweis              | Eigener kleiner Ordner nach 20.3; die Listen-Query aus Task 72 ist dafür wiederverwendbar                                    |
| Stoppuhr / Timer                   | Nicht geplant                                                                                                                |
| Abrechnung, Preise, Lexware        | Bleibt außerhalb der Anwendung                                                                                               |
| Export und Purge                   | Ordner 21 nimmt die drei Tabellen in Export und Owner-Purge auf (Hinweis dort beim Start ergänzen)                           |

## Merge-Gate 20.1

- [ ] Rechenbeispiel Schritt 1, 2 und 5 als Integrationstest grün.
- [ ] Zwei parallele Zuweisungen, die zusammen „Frei“ überschreiten: genau eine gelingt.
- [ ] Derselbe `idempotencyKey` zweimal: eine Zeile, zweimal Erfolg; an fremdem Kunden `VALIDATION_ERROR`.
- [ ] Korrektur unter die zugewiesene Summe, Zuweisung über „Frei“, Freigabe über „Freigebbar“: je eigener Fehlercode, 409.
- [ ] Ohne `hours.manage` fehlen Gutschreiben, Zuweisen und Freigeben vollständig; die Endpunkte antworten 403 bzw. 404.
- [ ] Negativtests: fremder Kunde, fremdes Projekt, Projekt eines anderen Kunden im Request → 404.
- [ ] Projektgebundenes `hours.read` sieht weder Kundenstand noch Kaufhistorie.
- [ ] Mock-Karte „Stunden & Verlauf“ und Mock-Kennzahl „Stunden übrig“ sind ersetzt; ohne `hours.read` fehlt beides.
- [ ] `db:seed:crm`, Constraint-Smoke und `db:smoke:rbac` erweitert; neue Integrationstests in `db:smoke:crm` der App eingetragen.
- [ ] Drizzle-Modelle deckungsgleich zur Migration (Review-Punkt im PR).
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/db db:smoke:crm`,
      `pnpm --filter @invessiv/db db:smoke:rbac`, `pnpm --filter @invessiv/workspace db:smoke:crm`,
      `pnpm --filter @invessiv/workspace build` grün.

## Merge-Gate 20.2

- [ ] Rechenbeispiel Schritt 3 und 4 als Integrationstest grün; kein Schreibpfad gleicht ein überzogenes Projekt automatisch aus.
- [ ] Dauer 0, 10, 20 und 600015 Minuten werden abgelehnt; 15 und 600000 angenommen. Datum von morgen wird abgelehnt.
- [ ] Aufgabe eines anderen Projekts und abgebrochene Aufgabe: `TASK_NOT_LINKABLE`. Aufgabe ohne Buchung bleibt gültig.
- [ ] Kulanzbuchung ändert „Verbraucht“ und alle Reste nicht.
- [ ] Ändern und Löschen mit veralteter Version: 409 mit `VersionConflictDto`.
- [ ] Jede Zeitbuchung schreibt genau eine `created`-Activity; Ändern je Feld eine `field_change`, Löschen eine. Keine Activity enthält die Beschreibung.
- [ ] Negativtests: fremder Kunde, fremdes Projekt; projektgebundenes `hours.write` erreicht kein Schwesterprojekt.
- [ ] Formular und Bestätigung kennzeichnen die Beschreibung als kundensichtbar.
- [ ] Dieselben Befehle wie in 20.1 grün.

## Merge-Gate 20.3

- [ ] Portal-Widget `hours` von Mock auf echt (`mock: false`, `requiredPermission: portal.hours.read`,
      `onlyWithContent: true`); ohne Kauf- und ohne Zeitbuchung fehlt es, ohne Recht ebenfalls.
- [ ] Die Summen im Portal stimmen mit dem Cockpit überein (ein Test rechnet beide aus denselben Zeilen).
- [ ] Ohne `portal.hours.entries.read`: Stand sichtbar, Buchungsliste und ihr Endpunkt nicht (404).
- [ ] Projekte in nicht portal-sichtbarem Status erscheinen nur als Sammelzeile ohne Titel; die Summe geht trotzdem auf.
- [ ] Aufgabentitel nur bei `visible_to_customer` **und** `portal.tasks.read`.
- [ ] Kein Portal-DTO enthält Mitglieds-IDs, interne Zuweisungsnotizen, Stundensatz oder Budget (Typtest und Test über die serialisierte Antwort).
- [ ] Cross-Customer-Negativtests mit echten Portal-Sessions für Stand und Buchungsliste.
- [ ] Owner-Portalsicht sieht Stand und Buchungen lesend.
- [ ] `pnpm --filter @invessiv/workspace test:e2e:portal` mit neuer Suite `portal-hours.e2e.ts` grün; dazu die Befehle aus 20.1.

## Rollback

Es gibt kein Feature-Flag. Die Tabellen und Katalogzeilen bleiben in jedem Fall stehen (additive Migrationen) und
verlieren nichts.

- **20.3:** Kein vollständiger Revert, sondern ein Folge-PR, der den Registry-Eintrag `hours` wieder auf `mock: true`
  stellt. Die beiden Portal-Permissions bleiben in Code und Datenbank (ein Revert des Katalogs im Code würde
  `db:smoke:rbac` brechen, weil die Migration nicht zurückgenommen wird) und sind dann wirkungslos.
- **20.2:** Revert entfernt Buchungsformular und Projektsektion. Bereits gebuchte Zeilen zählen weiter in die Summen
  der Kundensektion aus 20.1.
- **20.1:** Die Sektion im Cockpit nicht mehr rendern (Folge-PR). Die drei internen Permissions bleiben aus
  demselben Grund wie bei 20.3 im Katalog. Daten bleiben erhalten.
