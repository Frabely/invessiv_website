# Strukturreview: Stunden-Branch

## Behebungsstand vom 11.10.2026

**S01–S11 sind in den lokalen Änderungen auf HEAD `313da408` behoben.** Die ursprünglichen Findings und Fundstellen weiter unten dokumentieren den Zustand vor diesem Refactoring.

| Finding | Umsetzung                                                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01     | Persistenz-Inputs nach `packages/db/src/contracts/crm/hours/` verschoben; Ledger-Service nutzt DB-Package-Imports.                                                                                        |
| S02     | `TimeEntryCursor` und `ProjectHoursSums` jeweils als eigener Common-Contract abgelegt.                                                                                                                    |
| S03     | Allgemeinen Dauerformatter samt Tests nach `packages/common/src/patterns/time/` verschoben; sämtliche Verbraucher umgestellt.                                                                             |
| S04     | Stundeninteraktion in Canvas-Komponente, Hook, Kontext-Contract und reinen Kontext-Builder aufgeteilt. Aufgaben und Stunden nutzen weiterhin einen gemeinsamen Buchungsdialog.                            |
| S05     | Listen- und Access-Viewmodels, Cockpit-Laden und Cockpit-Darstellung getrennt. Die CRM-Page orchestriert auf 197 Zeilen; neue Cockpit-Dateien bleiben jeweils unter 150 Zeilen.                           |
| S06     | Projekt-DTO-Mapping in `hoursMappingService.toCustomerProjectDto` zentralisiert und mit einer überzogenen Projektbilanz getestet.                                                                         |
| S07     | Aktionsfähigkeiten über `projectHoursActions` vereinheitlicht; abgeschlossene Projekte bleiben buchbar, geschlossene Projekte behalten die Korrekturmöglichkeiten. Status- und Rechtefälle sind getestet. |
| S08     | Vorhandenen Fehlercode-Helfer für sämtliche Stundenmutationen wiederverwendet.                                                                                                                            |
| S09     | Ungenutzten `stepDurationInput` samt ausschließlich zugehörigen Tests entfernt; Eingabevalidierung und UI-Stepper bleiben erhalten.                                                                       |
| S10     | Kauf-, Zuweisungs- und History-Tests bei ihren Komponenten abgelegt. Abschnittstest prüft weiterhin Rechte, Sichtbarkeit und das Öffnen beider Dialoge.                                                   |
| S11     | Aktuelle Pläne, DTO-Kommentar und CRM-UI-Regeln an technische Dauergrenze und Package-Eingabekomponente angepasst; widersprüchlichen Finished-Kommentar entfernt.                                         |

Zusätzlich wurde der Listen-State-Renderblock von `ProjectHoursSection` nach `project-time-entry-content.tsx` ausgelagert. Benannte Prüfungen und frühe Rückgaben machen Aufgabenanzeige, leere Listen und Freigabeaktionen leichter lesbar. Der Kontext-Builder ist auch gegen fehlende Aufgabenleserechte getestet.

Validierung nach Umsetzung: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r --workspace-concurrency=1 test` und `pnpm --filter @invessiv/workspace build` erfolgreich. Insgesamt **5.082 Tests bestanden**, davon 3.600 im Workspace; 426 Workspace-Tests sowie weitere optionale Integrationssuiten übersprungen. Bekannte Lint-Warnungen zum Web-Testbild und einer ungenutzten Testvariable sowie die bestehende Turbopack-Warnung zur Umgebungsdateisuche bleiben bestehen. `git diff --check` ohne Fehler. Migration, schreibender DB-Smoke/Seed und authentifizierter Browser-E2E wurden nicht ausgeführt.

## Ursprüngliches Review

Stand: 11.10.2026, Branch `feat/crm-stunden-3-portal`, HEAD `78501d42`, einschließlich der lokalen Behebungen F01–F10. Vergleichsbasis: `4c496a79`, vor Einführung des Stundenfeatures. Dieses Review verändert keinen Produktivcode.

## Gesamturteil und Umfang

Die fachliche Grundstruktur ist sinnvoll: getrennte Workspace- und Portal-Handler, gemeinsame Summen- und Paging-Services, eigenständige Ledger-/Zeitbuchungsmodelle, kleine Client-Service-APIs und fachlich gruppierte UI. Die allgemeine Dauereingabe liegt richtig in `packages/ui`. Es bleiben **sechs P2- und fünf P3-Findings** zur Ablage, Verantwortungsverteilung und Wartbarkeit. Keine zusätzlichen bestätigten P0-/P1-Findings in diesem Strukturreview.

Der gesamte Branch-Diff wurde nach Dateiverantwortung, Ablage, Exporten und Importgrenzen inventarisiert. Die Stunden-Produktionspfade wurden anhand vollständiger Dateien und ihrer Aufrufer geprüft: CRM/Portal-API, Client-Services, Common-Contracts/Patterns, Handler/Services, UI/Dialoge, Paging-Hooks, Modelle/Migrationen und Dictionaries. Die großen betroffenen CRM-/Portal-Orchestrierungsdateien wurden vollständig gelesen; bestehende Vergleichswege für Files, Credentials, Aufgaben und versionierte Mutationen wurden einbezogen. Die Logikprüfung und ihre Regressionen aus der vorherigen Runde fließen ein.

Bei den großen bestehenden Test-/Seed-/Smoke-Sammeldateien wurden die Stunden-Erweiterungen und ihre Einbindung geprüft; eine erneute vollständige fachliche Prüfung sämtlicher älterer Tests und Fixtures anderer CRM-Features ist **nicht** Bestandteil dieser strukturellen Aussage. Die kleinen Const-/Contract-Tests und Feature-Tests wurden auf Zuständigkeit und Aussagekraft geprüft. Historische Reviewberichte sind Kontext, keine erneut abzuarbeitende Fehlerliste. Generierter Code, Dependencies, Secret-Dateien und Binärartefakte wurden ausgeschlossen.

Geltende Root-, App-, Server-, Portal-, CRM-, API-, Hooks-, Lib-, Common-, Shared-UI- und Package-Regeln wurden berücksichtigt; die gelesenen `CLAUDE.md` verweisen auf die jeweilige `AGENTS.md`. Die vom Nutzer erlaubte direkte Änderung der nur in Dev ausgeführten Migration und die aufgehobene 24-Stunden-Grenze gelten ausdrücklich als autorisierte Entscheidungen.

## Findings

### S01 · P2 · Persistenz-Inputs liegen im Client/Server-Paket

- **Fundstellen:** `packages/common/src/contracts/crm/hours/insert-hour-purchase-input.ts:4`, `packages/common/src/contracts/crm/hours/insert-hour-allocation-input.ts:1`; einzige produktive Verbraucher sind die Insert-Methoden in `apps/workspace/src/server/workspace/crm/services/hours/hours-ledger-service.ts:61` und `:82`.
- **Problem und Auswirkung:** Diese Shapes beschreiben interne Persistenz mit Autor und Idempotenzschlüssel, keine geteilte API. `packages/common/AGENTS.md`, „Was hier nicht hingehört“, schließt serverseitige Persistenz-Inputs ausdrücklich aus; `apps/workspace/src/server/AGENTS.md`, „Strukturregeln“, verlangt dafür DB-Contracts. Die jetzige Ablage verwischt API- und Persistenzgrenze.
- **Empfehlung:** Nach `packages/db/src/contracts/crm/hours/` verschieben und über die DB-Package-Exports importieren. Request-DTOs und fachliche Result-Unions bleiben in Common. Dafür weder Handler noch SQL-Service vorsorglich umziehen.

### S02 · P2 · Öffentliche reine Typen stehen außerhalb von Contracts

- **Fundstellen:** `packages/common/src/patterns/crm/hours/time-entry-cursor.ts:8` (`TimeEntryCursor`); `apps/workspace/src/server/shared/services/hours/hours-balance-types.ts:4` (`ProjectHoursSums`), verwendet vom gemeinsamen Balance-Service und Portal-Mapper.
- **Problem und Auswirkung:** Der Cursor-Contract lebt zwischen Funktionen. Der Summen-Contract enthält nur primitive Werte und `ProjectStatus`, keine DB- oder Server-only-Typen. Root-`AGENTS.md`, „Export entscheidet über den Ort“, verlangt Contracts in Common; die Server-Ausnahme für Typdateien mit DB-/Server-only-Abhängigkeiten greift hier nicht. Die öffentlichen Datenformen sind dadurch an zwei unterschiedlichen, unerwarteten Orten zu suchen.
- **Empfehlung:** Je eine Datei unter `packages/common/src/contracts/crm/hours/`, etwa `time-entry-cursor.ts` und `project-hours-sums.ts`. Encoder/Decoder bleiben im Pattern; Summenabfragen bleiben im gemeinsamen Server-Service. Komponenten-Props und rein lokale Hilfstypen sind ausdrücklich kein Finding.

### S03 · P2 · Allgemeine UI hängt an einer CRM-Feature-Domäne

- **Fundstelle:** `packages/ui/src/hooks/use-duration-input.ts:4` importiert `@invessiv/common/patterns/crm/hours/format-duration`.
- **Problem und Auswirkung:** `DurationInput` ist mit `minuteStep`, `maxMinutes` und Labels bereits sinnvoll allgemein gehalten, sein Hook hängt aber weiterhin am CRM-Stundenpfad. `packages/AGENTS.md`, „packages/ui“, verbietet Feature-Domänenimporte. Ein weiteres Produkt muss dadurch einen CRM-Baustein als Grundlage seines allgemeinen Controls übernehmen.
- **Empfehlung:** Den fachlich neutralen Minutenformatter samt Tests nach `packages/common/src/patterns/time/format-duration.ts` verschieben und die Nutzer darauf umstellen. CRM-Limits und Validierungsregeln bleiben beim CRM; keine zweite Formatter-Implementierung im UI-Paket.

### S04 · P2 · Projekt-Canvas sammelt Stundeninteraktion und mehrere Fachbereiche

- **Fundstellen:** `apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx:119`–`:183`, `:252`, `:264`, `:350` (insgesamt 382 Zeilen).
- **Problem und Auswirkung:** Zur Projektwahl und zum Projekteditor kommen Dialogzustand, Listenrevision, aktive Stundenprojektauswahl, Task-Optionen und Buchbarkeit hinzu. Derselbe Dreifach-Guard `hours && hoursContent && activeHoursProject` steht an drei Renderstellen; Task-, Stunden- und Dialogintegration werden gemeinsam mit fünf weiteren Fachbereichen bearbeitet. Das erschwert, den Stunden-Datenfluss und die Abhängigkeit vom aktiven Projekt isoliert zu verstehen. Root-`AGENTS.md`, „Verantwortlichkeiten trennen“, „Keine Logik-Duplikate“ und „Lange/monolithische Dateien … aufsplitten“, sind hier relevant; nicht allein die Zeilenzahl.
- **Empfehlung:** Stunden-Dialogzustand und Revision nach `src/hooks/workspace/crm/use-project-hours-canvas.ts` ziehen. Einen vorbereiteten Stundenkontext mit Aufgabenoptionen und getrennten Fähigkeiten für Anlegen bzw. Bearbeiten liefern; dessen Contract gehört nach `src/common/contracts/crm/hours/`. Stunden-Sektion/Dialog in eine co-locatete Canvas-Stundenkomponente auslagern. Ein gemeinsamer Buchungsdialog für Taskzeilen und Stundensektion bleibt erhalten. Benannte `canShowTasks`/`hasHoursContext`-Prüfungen ersetzen wiederholte JSX-Bedingungsketten.

### S05 · P2 · CRM-Route baut Zugriffs-Viewmodels im Renderbaum

- **Fundstellen:** `apps/workspace/src/app/[locale]/(app)/crm/page.tsx:274`, `:293`, `:381`, `:457` (488 Zeilen).
- **Problem und Auswirkung:** Die Route bündelt Ladeergebnisse, ermittelt Owner-/Zuständigkeitsdarstellung und erzeugt innerhalb der umfangreichen Cockpit-Props unter anderem `ownerHasAccess` per `Object.fromEntries` samt Negation einer Zugriffsmengenprüfung. Das ist bereits vor dem Stundenfeature angelegt; der Branch erweitert diese Datei erneut. Fachliche Datenaufbereitung und Routing sind dadurch schwer getrennt zu prüfen. Die engere CRM-Route-`AGENTS.md`, Regel 3 „Pages orchestrieren nur“, und die Root-Regel zu Route-Orchestrierung sind maßgeblich.
- **Empfehlung:** Access- und Verantwortungsdarstellung in `src/lib/workspace/crm/customer-access-view-model.ts` vorbereiten; anschließend einen Cockpit-Ladehelfer unter demselben Lib-Scope nutzen, der vorhandene Feature-Viewmodel-Builder bündelt. Die Page behält Auth-Gate, URL-Auswertung und Komposition. Kein neuer fachfremder Sammelservice und keine Änderung der Berechtigungsentscheidung.

### S06 · P2 · Ein Projekt-DTO wird im Query-Handler gebaut

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/query-handler/get-customer-hours.query-handler.ts:84`; vorhandener Zielort: `services/hours/hours-mapping-service.ts`.
- **Problem und Auswirkung:** Kauf-, Zuweisungs- und Zeitbuchungsdaten laufen durch den Mapper, die aus der Summenabfrage stammende Projektzeile wird dagegen inline in `CustomerHoursProjectDto` übersetzt. `apps/workspace/src/server/AGENTS.md`, „Mapping-Services — Pflichtstruktur“, verlangt die Trennung vom Handler. Änderungen an diesem DTO müssen momentan neben dem Mapper auch im Query gesucht und geprüft werden.
- **Empfehlung:** `hoursMappingService.toCustomerProjectDto` ergänzen und direkt testen. Der Mapper verwendet weiterhin `computeProjectHoursBalance`; der Handler mappt nur über diese Methode. Kein eigener Service mit nur dieser einen Methode nötig.

### S07 · P3 · Buchbarkeit und Ledger-Aktionen haben parallele Definitionen

- **Fundstellen:** `customer-projects-section.tsx:155` prüft `Cancelled`/`Archived` unmittelbar; `project-hours-section.tsx:82` verwendet die zentrale Statusliste. Die Zuweisungs-/Freigabefähigkeiten stehen praktisch identisch in `hours-project-list.tsx:39` und `project-hours-section.tsx:85` (jeweils unter `apps/workspace/src/components/workspace/crm/`).
- **Problem und Auswirkung:** Aktuell stimmen die Regeln nach F03, aber eine Status- oder Aktionsänderung kann Taskzeilen, Kundenübersicht und Projektsektion auseinanderlaufen lassen. Root-`AGENTS.md`, „Keine Logik-Duplikate“, betrifft genau diese mehrfachen Bedingungen. Die direkte Statusprüfung entstand im lokalen F03-Fix und gehört ebenfalls zur zweiten Runde.
- **Empfehlung:** Mindestens die zentrale Statusliste überall nutzen. Gemeinsame Aktionsfähigkeiten als reinen Helfer unter `src/common/patterns/crm/hours/project-hours-actions.ts` ableiten. Neue Buchungen und Bearbeiten/Löschen bestehender Buchungen bleiben getrennt; der Completed-Hinweis ist eine andere Regel als die Schließung eines Projekts.

### S08 · P3 · Client-Service wiederholt bereits vorhandenen Fehlercode-Helfer

- **Fundstellen:** `apps/workspace/src/client/crm/hours-api-service.ts:71`, `:107`, `:123`.
- **Problem und Auswirkung:** Kauf und Zuweisung wiederholen denselben `json.readErrorCode(payload, HOURS_ERROR_CODE_VALUES, HoursErrorCode.Internal)`-Block; weiter unten existiert dafür bereits `readErrorCode`, das nur Zeitbuchungen verwenden. Das ist ein belegtes Duplikat nach Root-`AGENTS.md`, „Keine Logik-Duplikate“, und erhöht die Zahl der Stellen für Änderungen an der Fehlerzuordnung.
- **Empfehlung:** Den vorhandenen lokalen Helfer auch in beiden Ledger-Methoden verwenden. Die unterschiedlichen Erfolgs-DTOs und mitgelieferten Bestandsdaten bleiben eigenständige Methoden; keine generische Mutation-Fabrik einführen.

### S09 · P3 · Alter Dauer-Stepper ist nur noch durch eigene Tests erreichbar

- **Fundstellen:** `apps/workspace/src/common/patterns/crm/hours/duration-input.ts:31`; einzige Aufrufe in `duration-input.test.ts:37`–`:47`. Produktives Stepping läuft in `packages/ui/src/hooks/use-duration-input.ts`.
- **Problem und Auswirkung:** Nach dem Umzug bleibt eine exportierte Implementierung des früheren Textfeld-Steppers samt separatem Formatierungsimport erhalten. Ihre Tests sind grün, prüfen aber kein aktuelles Produktverhalten. Zwei ähnlich benannte Stepping-Wege erschweren das Auffinden der tatsächlich wirksamen Implementierung.
- **Empfehlung:** `stepDurationInput` und ausschließlich zugehörige Tests/Imports entfernen. `readDurationInput` samt Validierungstests behalten; den generischen UI-Stepper weiterhin im UI-Paket testen.

### S10 · P3 · Abschnittstest ist zum Test-Sammelpunkt mehrerer Komponenten geworden

- **Fundstellen:** `apps/workspace/src/components/workspace/crm/hours/customer-hours-section/customer-hours-section.test.tsx:144`, `:191`, `:275`, `:389`, `:496` (532 Zeilen).
- **Problem und Auswirkung:** Die Datei testet inzwischen neben Sichtbarkeit, Berechtigungen und Abschnittsdaten auch Kauf-/Korrekturformular, Zuweisungsgrenzen, Wiederholungen, Dauer-Stepping und Datumsausgabe des History-Bausteins. Die lokalen Regressionen haben diese Entwicklung verstärkt. Das ist kein Problem der Testzahl, sondern mehrerer eigenständig veränderlicher Komponenten in einer Suite mit gemeinsamen API-/Router-Mocks.
- **Empfehlung:** Kauf-/Korrekturfälle nach `hour-purchase-dialog/hour-purchase-dialog.test.tsx`, Zuweisungsfälle nach `hour-allocation-dialog/hour-allocation-dialog.test.tsx`, Datumsdarstellung nach `hours-history-list/hours-history-list.test.tsx`. Im Abschnittstest verbleiben Sichtbarkeit, Rechte und das Öffnen der richtigen Dialoge. Wenige echte Zusammenspieltests behalten; keine identischen Assertions kopieren.

### S11 · P3 · Kommentare und aktuelle Featurepläne beschreiben überholte Invarianten

- **Fundstellen:** `packages/common/src/contracts/crm/hours/time-entry.dto.ts:11` („at most one day“); `apps/workspace/plans/crm/20-stunden-und-history/72-zeitbuchungen-und-aufgaben.md:38`, `:117`, `:147` und `27-kontingent-und-zuweisung.md:52` (1440-Grenze); `project-hours-section.tsx:49` behauptet, nach allen `FINISHED_PROJECT_STATUSES` werde nichts mehr gebucht, enthält aber auch `Completed`.
- **Problem und Auswirkung:** Das widerspricht der ausdrücklich gewünschten unbegrenzten Stundenanzahl innerhalb der technischen Grenze und der weiterhin erlaubten Buchung auf Completed-Projekte. Die Typ-Tooltips und als Umsetzungsvorgabe genutzten Pläne können spätere Arbeiten zur alten Logik zurückführen. Dies verlangt keine Rücknahme der Nutzerentscheidungen.
- **Empfehlung:** Aktuelle Pläne und DTO-Kommentar auf `HoursLimits.MaxEntryMinutes` beziehungsweise die technische Grenze abstimmen. Den Finished-Kommentar auf den Hinweis zu ungenutzten Stunden beziehen, getrennt von der Closed-Regel. Historische Reviews dürfen ihren damaligen Stand behalten.

## Weitere Einordnung von Größe und Lesbarkeit

- Die neuen einzelnen Stunden-Handler liegen ungefähr bei 80–150 Zeilen und folgen gut lesbaren frühen Rückgaben. Eine Existenz-/Rechteprüfung mit gemeinsamem Not-found-Ergebnis muss nicht allein wegen zweier Bedingungen künstlich zerlegt werden.
- `TimeEntryFormDialog` (301 Zeilen) trennt fachliche Request-/Prognoseberechnung bereits in Patterns und verwendet den gemeinsamen Mutation-Hook. Ein eigener Formularhook ist als nächste Vereinfachung sinnvoll, aber die Dateilänge allein begründet keinen zusätzlichen bestätigten Fehler.
- `ProjectHoursSection` enthält bei `:217` einen vierteiligen Listen-State-Renderblock und darin einen weiteren Empty-State-Ternary. Bei der nächsten Bearbeitung diesen Block als `project-time-entry-content.tsx` neben der Sektion schneiden, leeren Erklärungstext vorher benannt ableiten und `showInlineRelease = canRelease && !showFinishedHint` einmal bilden. Gleichartige Zustände im Portal haben andere Texte und Darstellung; nicht vorschnell in eine gemeinsame Fachkomponente pressen.
- `PortalDashboard` (435 Zeilen) ist groß, nutzt aber bereits einen eigenen Dialog-Host und eigenständige Widgets. Die neue Stundenintegration folgt diesem Muster. Optional kann die Widget-Komposition weiter in `portal-dashboard-widgets.tsx` getrennt werden; dafür besteht hier kein belegter neuer Regelverstoß.
- DB-Smoke und CRM-Seed sind bestehende große Sammeldateien. Der Branch lagert die neue Stundenverantwortung bereits nach `scripts/crm-smoke/hours-checks.ts` und `scripts/crm-fixture/seed-hours.ts` aus. Diese Einbindung ist sinnvoll; die alten Gesamtlängen allein sind kein Stunden-Finding.
- Die Common-Row-Ablage wird nicht pauschal beanstandet: Die spezifische Common-Regel und Server-Mapping-Regel erlauben SELECT-Shapes unter `contracts/<domain>/rows/`. Lokale nicht exportierte Maps, Typen und die Props-Ausnahme wurden ebenfalls berücksichtigt.
- Dictionaries sind in fachliche Stundenmodule für DE/EN getrennt. Portal und Workspace importieren keine gegenseitigen Handler. UI-Gesten liegen in Package-Hooks; Styling bleibt in CSS Modules. Kein Anlass, diese gelungenen Grenzen durch weitere Sammelabstraktionen zu ersetzen.

## Prüfungen und Grenzen

- Fix-Validierung vor diesem Review: 5.074 lokale Tests bestanden; 426 Workspace-Tests übersprungen, darunter DB-Integration. Lint und sämtliche Typechecks erfolgreich, Workspace-Build erfolgreich. Bestehende Lint-/Turbopack-Warnungen siehe separaten Behebungsstand.
- Während des Strukturreviews: read-only Dateianalyse, vollständige relevante Produktionsdateien, Aufruf-/Import-/Exportsuche, Vergleich mit Scope-Regeln und `git diff --check` ohne Fehler. Keine strukturellen Änderungen oder neuen Tests vorgenommen.
- `hours.e2e.ts --list` lädt den erweiterten Test. Authentifizierter Browserlauf, schreibender DB-Smoke/Seed und Migration wurden nicht ausgeführt; das Review ersetzt diese Abnahme nicht. Keine Aussage über die reale Produktivdatenbank.
- Offene Planabweichung aus der ersten Runde: Das allgemeine Portal-Auth-Gate antwortet anonym mit 401, während Plan 73 für den Test 404 nennt. Das ist von diesem Strukturreview getrennt zu klären; kein neuer vermeintlicher Stunden-Datenleck-Fund.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel vorgeschlagen. Der bestehende Skill deckt Exportorte, bewusste Ausnahmen, Duplikate, große Dateien und belegte Aufteilungsempfehlungen bereits ab. Der Skill bleibt unverändert.
