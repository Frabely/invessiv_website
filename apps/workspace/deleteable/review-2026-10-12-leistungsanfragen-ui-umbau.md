# Review: Leistungsanfragen intern – UI-Umbau und Paginator

## Umfang und Stand

- **Umfang:** das ungecommittete Changeset auf `feat/crm-leistungsanfragen-1-katalog` über `f0cd97d2`
  (32 geänderte, 3 gelöschte, 8 neue Dateien): Eingang als Tabelle mit Filterleiste und Paginator,
  Cockpit-Sektion auf `StatusRow`, Annahme-Dialog auf `FormFieldset`/`OptionTile`, serverseitiges Blättern.
- **Nicht im Umfang:** der übrige Inhalt von Commit `f0cd97d2` (Befehle, Annahme-Transaktion, API-Routen).
- **Gesamturteil:** Kein belegter Logikfehler, keine P0/P1-Findings. Der Umbau passt strukturell zu
  Aufgabenübersicht und Feedback-Eingang. Offen sind eine Testlücke am neuen DB-Pfad, mehrere Duplikate
  und kleinere Unsauberkeiten. Die Oberfläche wurde nie im Browser angesehen.

## Abdeckung

Vollständig gelesen:

- **Eingang:** `service-request-inbox`, `-inbox-table`, `-inbox-row`, `-inbox-toolbar` (jeweils tsx, CSS, Test),
  `crm/shared/list-page-header`, `app/[locale]/(app)/crm/service-requests/page.tsx`.
- **Cockpit und Dialoge:** `customer-service-requests-section`, `service-request-details`,
  `service-request-kind-badge`, `service-request-actions`, `service-request-accept-dialog`,
  `service-request-target-fields`, CSS des Ablehnen-Dialogs, `shared/status-row`.
- **Common und Server:** `service-request-inbox-query(.test).ts`, `service-request-inbox-query-params.ts`,
  `service-request-inbox-page-size.ts`, `service-request-project-wish-label.ts`,
  `list-service-request-inbox.query-handler.ts`, `service-request-access-service.ts`,
  `service-request-inbox.dto.ts`, beide Dictionaries.
- **Zum Abgleich gelesen:** `tasks-overview-table`, `task-overview-row`, `tasks-overview-toolbar`,
  `list-tasks.query-handler.ts`, `task-list-query-string.ts`, `FacetFilter`, `CollapsibleSection`,
  `ListPagination`, `resolveListPage`, `createServiceRequestAcceptForm`.
- **Nur als Diff gelesen:** E2E-Spec, Integrationstest, beide `AGENTS.md`, Plan zu Task 75.

## Architektur und Zusammenspiel

- Der Eingang folgt jetzt dem Muster der Aufgabenübersicht: Page liest URL-State, Query-Handler zählt und
  blättert, die Tabelle rendert über `DataTableLayout`. Zugriffsbedingung steht in der `WHERE`-Klausel und
  gilt für Zählung und Liste gleich (`inboxCondition`).
- Die Sortierung ist stabil (`Status-Gruppe`, `created_at`, `id`), Blättern liefert also keine Dopplungen.
- Server-Komponenten bleiben Server-Komponenten; nur die Filterleiste ist Client.
- Alle verwendeten CSS-Variablen sind zentral definiert; Dictionaries sind in DE und EN schlüsselgleich (97 Keys).

## Findings

### F01 · P2 · Geblätterter DB-Pfad ist ungetestet

- **Fundstelle:** `src/server/workspace/crm/query-handler/list-service-request-inbox.query-handler.ts:10`,
  `src/server/workspace/crm/services/service-requests/service-request-access-service.ts` (`countInbox`, `list` mit `window`),
  `src/server/tests/workspace/crm/service-requests.integration.test.ts:245`.
- **Problem und Auswirkung:** Der Integrationstest wurde nur um die drei neuen Felder ergänzt. Kein Test
  prüft `limit`/`offset`, die Klemmung einer zu hohen Seite oder dass `total` zum Filter passt. Lokal wird die
  Datei zudem übersprungen (9 Tests skipped), der neue SQL-Pfad lief also nie.
- **Empfehlung:** Einen Integrationsfall mit mehr als einer Seite ergänzen (Seite 2, Seite jenseits des Endes,
  `openOnly` gegen `total`) und die Datei einmal gegen die Dev-DB laufen lassen.

### F02 · P2 · `list` hat sechs Positionsparameter

- **Fundstelle:** `service-request-access-service.ts:61` (`list`), Aufruf in
  `list-service-request-inbox.query-handler.ts:25` mit `undefined, openOnly, undefined, {…}`.
- **Problem und Auswirkung:** Vier optionale Positionsparameter hintereinander sind am Aufrufer nicht
  lesbar; ein vertauschtes Argument (`customerId`/`requestId` sind beide `string`) fällt dem Typecheck nicht auf.
- **Empfehlung:** Ein benanntes Filterobjekt (`customerId`, `openOnly`, `requestId`, `window`) als dritten
  Parameter; der Typ gehört als server-only Contract in eine `*-types.ts` des Ordners.

### F03 · P2 · Seitenkopf jetzt dreifach vorhanden

- **Fundstelle:** `src/components/workspace/crm/shared/list-page-header/`,
  `crm/tasks/overview/tasks-overview-header/`, Kopf in `crm/feedback-rounds/feedback-inbox/`.
- **Problem und Auswirkung:** `ListPageHeader` wurde als geteilter Baustein angelegt, hat aber nur einen
  Nutzer; die beiden anderen Listenseiten behalten ihre Kopie. Das widerspricht `crm/AGENTS.md`, Abschnitt
  „Struktur“ (geteilte Bausteine erst bei tatsächlicher Wiederverwendung) und der Root-Regel gegen Duplikate.
- **Empfehlung:** Aufgabenübersicht und Feedback-Eingang auf `ListPageHeader` umstellen und deren Kopien löschen.

### F04 · P3 · Zwei Href-Bauer mit unterschiedlichem Standard

- **Fundstelle:** `src/common/patterns/crm/service-request-inbox-query.ts` (`buildServiceRequestInboxHref`,
  `buildServiceRequestInboxQueryString`).
- **Problem und Auswirkung:** Der eine lässt den Standardfilter weg, der andere schreibt `?filter=open`.
  Heute wird der Href-Bauer nur mit `All` aufgerufen, ein künftiger Aufruf mit `Open` erzeugt aber eine zweite
  Adresse für dieselbe Ansicht.
- **Empfehlung:** `buildServiceRequestInboxHref` auf `buildServiceRequestInboxQueryString` aufbauen, wie
  `buildTaskListHref`.

### F05 · P3 · Regel „bestehend oder neu“ steht an zwei Stellen

- **Fundstelle:** `service-request-target-fields.tsx:44` und `:125` (`canChoose`),
  `src/common/patterns/crm/service-requests/service-request-accept-form.ts:31` und `:39`.
- **Problem und Auswirkung:** Dieselbe Bedingung (Recht, Art `standard`, keine Katalogvorlage) entscheidet
  im Pattern über den Startwert und in der Komponente über die Sichtbarkeit der Wahl. Laufen beide
  auseinander, steht das Formular in einem Modus, den niemand umschalten kann.
- **Empfehlung:** Zwei benannte Helfer im Pattern (`canChooseServiceRequestProject`, `…Template`), die beide
  Stellen nutzen.

### F06 · P3 · Mobil-Label-CSS kopiert

- **Fundstelle:** `service-request-inbox-row.module.css:64–102`,
  `crm/tasks/overview/task-overview-row/task-overview-row.module.css` (`.mobileLabel`, `.metaCell`).
- **Problem und Auswirkung:** Das Kartenlayout der Mobilansicht ist praktisch unverändert kopiert; eine
  Korrektur an einer Tabelle erreicht die andere nicht.
- **Empfehlung:** Beschriftete Mobilzelle als Prop oder Variante in `DataTableCell` (`packages/ui`) aufnehmen.

### F07 · P3 · Ausgewählte Zeile nur farblich erkennbar

- **Fundstelle:** `src/components/workspace/shared/status-row/status-row.module.css:22`, `status-row.tsx:55`.
- **Problem und Auswirkung:** `selected` setzt nur Randfarbe und Hintergrund. Wer per Link aus dem Eingang
  kommt und Farben nicht unterscheidet oder einen Screenreader nutzt, erfährt nicht, welche Anfrage gemeint ist
  (`crm/AGENTS.md`: Zustände nie über Farbe allein).
- **Empfehlung:** Zusätzlich `aria-current="true"` am `li` setzen.

### F08 · P3 · Kleinere Unsauberkeiten

- **`describeServiceRequestProjectWish` ohne eigenen Test** (`src/common/patterns/crm/service-requests/service-request-project-wish-label.ts`);
  der Zweig „Projekt nicht sichtbar“ ist nirgends geprüft.
- **Zwei Dictionary-Namespaces für eine Leiste:** `filters` und `toolbar` speisen beide
  `service-request-inbox-toolbar.tsx`; zusammenlegen.
- **Gleiches Symbol, zwei Bedeutungen:** `faLayerGroup` steht für die Art (`service-request-kind-badge.tsx`) und
  für den Filter „Alle“ (`service-request-inbox-toolbar.tsx:65`).
- **Klasse auf UI-Baustein:** `.reset` setzt `gap` auf `ButtonControl` (`service-request-inbox-toolbar.tsx:78`).
  Die Aufgabenübersicht macht dasselbe (`.barButton`); es bleibt Styling eines `packages/ui`-Bausteins von außen.
- **Seite ohne `loading.tsx` und `page.test.tsx`** (`app/[locale]/(app)/crm/service-requests/`), anders als
  `tasks` und `feedback`; stammt aus dem Commit, nicht aus dem Umbau.
- **Indexed-Access-Typ** `typeof viewModel.requests` in `customer-service-requests-section.tsx:61` statt
  `readonly ServiceRequestDto[]` (Root-`AGENTS.md`, „Benannte Typen“); ebenfalls aus dem Commit übernommen.

## Prüfungen

- `tsc --noEmit` in `apps/workspace`: sauber.
- `eslint` auf den betroffenen Ordnern: sauber.
- `vitest` auf Leistungsanfragen, `status-row`, Inbox-Query und `app/[locale]/(app)/crm`: 9 Dateien, 49 Tests grün.
- Key-Parität DE/EN: gleich.
- **Nicht ausgeführt:** Integrationstest (übersprungen), E2E, `pnpm -r lint/typecheck/test`, App-Build,
  Sichtprüfung in Dark/Light und mobil.

## Offene Fragen

- Passt das Status-Badge „Angebot gesendet“ in die 7,5–8,5 rem breite Statusspalte der `StatusRow`, und
  wie verhalten sich drei Aktionen in der schmalen Kundenspalte? Nur im Browser zu klären.
- Der Filter kennt weiter nur „Offen“ und „Alle“. Ob Filter je Status oder Kunde gewünscht sind, ist offen.

## Vorschläge zur Skill-Verbesserung

- **Anlass:** F01 – ein übersprungener Integrationstest sah im Testlauf wie „grün“ aus.
- **Vorschlag für „Findings absichern“:** „Übersprungene Tests (skipped) ausdrücklich als nicht ausgeführt
  melden und prüfen, ob sie den geänderten Pfad abdecken würden.“

## Stand der Behebung (12.10.2026, ungecommittet)

- **Behoben:** F01 bis F07 sowie aus F08 der Helfer-Test, die Dictionary-Namespaces, das doppelte Symbol,
  `loading.tsx`/`page.test.tsx` und der Indexed-Access-Typ.
- **Offen aus F08:** `.reset` setzt weiter `gap` auf `ButtonControl`. `.button` in `packages/ui` hat keinen
  Abstand zwischen Symbol und Text; ein Abstand dort träfe alle Buttons beider Apps und braucht eine eigene Entscheidung.
- **Geprüft:** Typecheck (`apps/workspace`, `packages/ui`), Lint, 132 Testdateien / 777 Tests der betroffenen
  Bereiche, Integrationstest Leistungsanfragen gegen die Dev-DB (10 Tests grün).
