# Review: CRM-Stunden — Tasks 27 und 72

**Stand:** 08.10.2026, Branch `feat/crm-stunden-1-kontingent`, HEAD `ac36423d4cfeb60833b03794ba7c32f7d047a72b`. Grundlage ist das lokale Changeset einschließlich ungetrackter Dateien. Keine Codeänderungen vorgenommen.

**Auftrag:** Abgleich mit `plans/crm/20-stunden-und-history/27-kontingent-und-zuweisung.md`, `72-zeitbuchungen-und-aufgaben.md` und den zugehörigen Regeln.

**Gesamturteil:** Vor Merge nacharbeiten. Keine belegten P0-/P1-Findings; sieben P2-Findings und ein P3-Finding. Die zentralen Berechnungen, serverseitigen Zugriffsbereiche, Ledger-Serialisierung und atomaren Versionsupdates sind grundsätzlich schlüssig. Fehler liegen vor allem in erlaubten Randzuständen, Konfliktanzeigen und der Abnahmeabsicherung.

## Umfang und Architektur

- Vertikale Stundenpfade geprüft: vier API-Routendateien, Client-Service, fünf Commands, drei Query-Handler, Stunden-Services, View-Model, Listen-Hook und Formular-Patterns. Relevante bestehende Mechanismen `updateVersioned`, `useVersionedMutation`, `useTaskStatusChange` und `formatMomentDay` einbezogen.
- UI geprüft: alle neuen Stunden-Komponenten und deren CSS, Projekt-Canvas, Aufgabensektion/-zeile, Cockpit-View/-Dialog und CRM-Page; Anbindung an den neutralen `StatusRow` geprüft.
- Datenmodell geprüft: Migration `0056`, drei Drizzle-Modelle, zusammengesetzte Fremdschlüssel, Rollen-/Permission-Erweiterungen, Balances, Cursor und Stunden-Contracts. Seed-/Smoke-Erweiterungen und E2E gelesen.
- Tests geprüft beziehungsweise ausgeführt: Stunden-UI, Formular-Patterns, API-Routen, Mapper, Endpoint-Regeln und Common-Stunden-Patterns. DB-Integrationstests statisch auf fachliche Invarianten geprüft; nicht ausgeführt.
- Breite Infrastrukturdateien (Dictionary-Index, Endpoint-Katalog, Seed-/Smoke-Einstiegspunkte und bestehende Auth-Kataloge) hinsichtlich ihrer Änderungen und relevanten Aufrufer geprüft; keine Gesamtaudit dieser bestehenden Module. Kein Review des späteren Portal-Tasks 73.

Die Trennung von UI, Transport, Commands, Mappern und Persistenz passt zum Repository. Die Portal-/Workspace-Trennung bleibt bestehen; der frühzeitig gemeinsame Balance-Service ist ausdrücklich im Plan und der spezifischen `server/shared/AGENTS.md` erlaubt. Die Sperre `FOR NO KEY UPDATE` serialisiert Ledger-Schreiber, ohne normale referenzierende Inserts unnötig zu blockieren. Zeitbuchungen dürfen laut README gleichzeitig mit einer Freigabe zu Überziehung führen; das wurde nicht als Fehler gewertet. Die bewusste Neuladung der ersten Listenseite ist in der aktualisierten UI-AGENTS.md dokumentiert.

## Findings

### F01 · P2 · Kundensektion versteckt Verbrauch ohne vorherige Gutschrift

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/customer-hours-section/customer-hours-section.tsx:55` (`isEmpty`), Darstellung ab Zeile 110.
- **Problem und Auswirkung:** Zeitbuchungen ohne Zuweisung sind ausdrücklich erlaubt. Hat ein Kunde keine Kauf-/Zuweisungszeilen, aber beispielsweise 60 berechenbare Minuten, bleiben `purchasedMinutes === 0` und `hasLedger === false`: Die Sektion rendert ausschließlich den Empty-State, versteckt den Verbrauch, den Rest von −1:00 und sämtliche Projektzeilen. Auch reine Kulanzbuchungen werden so verborgen. Die Kennzahl im Cockpit kann gleichzeitig einen negativen Rest zeigen.
- **Empfehlung:** Empty-State nur verwenden, wenn auch Verbrauch und Kulanz null sind. Die Projekt-/Balanceanzeige bei vorhandenen Zeitbuchungen erhalten. UI-Test für Buchungen ohne Ledger ergänzen.

### F02 · P2 · Restprognose vermischt nach Konflikt alte Balance mit neuer Buchung

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/time-entry-form-dialog/time-entry-form-dialog.tsx:110`, `apps/workspace/src/common/patterns/crm/hours/time-entry-form-request.ts` (`remainingAfterTimeEntry`), `apps/workspace/src/hooks/workspace/use-versioned-mutation.ts`.
- **Problem und Auswirkung:** Ein Versionskonflikt aktualisiert `mutation.current`, aber nicht die dazugehörige Projektbalance. Beispiel: Zugewiesen 5:00, ursprüngliche Buchung 1:00, ursprünglicher Rest 4:00. Ein anderer Benutzer ändert die Buchung auf 2:00. Beim Konflikt und eigener Eingabe 1:30 rechnet die Anzeige jetzt `4:00 + 2:00 − 1:30 = 4:30`; nach dem Speichern bleiben tatsächlich 3:30. Die Anzeige kann eine Überziehung dadurch verdecken.
- **Empfehlung:** Balance und Referenzbuchung als zusammengehörigen Stand halten; beim Konflikt aktuelle Projektzahlen nachladen oder die alte Balance zunächst um die Änderung der Referenzbuchung korrigieren. Einen Konflikttest mit Assertion auf den prognostizierten Rest ergänzen; der vorhandene Test prüft nur Eingaben und neue Version.

### F03 · P2 · Aufgaben bieten Zeitbuchung auf geschlossenen Projekten an

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx:150` (`canBookTime`), Weitergabe an `onBookTimeAction` ab Zeile 251; `apps/workspace/src/components/workspace/crm/tasks/project-tasks-section/project-tasks-section.tsx`.
- **Problem und Auswirkung:** `canBookTime` prüft das Schreibrecht, aber nicht `cancelled`/`archived`. Die Stunden-Sektion blendet ihren Buchungsbutton korrekt aus, Aufgaben desselben Projekts zeigen dagegen weiterhin „Zeit buchen“ und gegebenenfalls den Erledigt-Hinweis. Der Dialog lässt sich vollständig ausfüllen und scheitert erst am Server mit `PROJECT_CLOSED`. Das verletzt die Stunden-Regel in `src/components/workspace/crm/AGENTS.md` und die Vorgabe gegen tote Aktionen.
- **Empfehlung:** Schreibrecht für Bearbeiten/Löschen und Erlaubnis zum Anlegen unterscheiden. Den Statusfilter für neue Buchungen auch vor der Weitergabe an die Aufgaben anwenden; Canvas-Test für archivierte und abgebrochene Projekte ergänzen.

### F04 · P2 · Formal passende, ungültige Cursor enden als interner Fehler

- **Fundstelle:** `packages/common/src/patterns/crm/hours/time-entry-cursor.ts:22`, `apps/workspace/src/server/workspace/crm/query-handler/list-project-time-entries.query-handler.ts:77`, GET-Route `apps/workspace/src/app/api/workspace/crm/projects/[projectId]/time-entries/route.ts`.
- **Problem und Auswirkung:** Der Decoder prüft ausschließlich das Format, nicht die Gültigkeit der Datums-/Zeitwerte. `2026-13-40~2026-10-08T09:15:30.123Z~33333333-3333-4333-8333-333333333333` wird akzeptiert. Bei einem lesbaren Projekt scheitert anschließend der PostgreSQL-Cast auf `date`, und die Route liefert 500 `INTERNAL` statt 422 `VALIDATION_ERROR`. Ungültige Timestamp-Komponenten haben denselben Effekt.
- **Empfehlung:** Reale Kalendertage und gültige UTC-Zeitstempel vor dem SQL-Cast validieren; unmögliche Monate, Tage und Uhrzeiten im Decoder- und Routentest berücksichtigen.

### F05 · P2 · Abgelehnte Korrektur kann den Dialog in einer Sackgasse lassen

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/hour-purchase-dialog/hour-purchase-dialog.tsx:103`, Auswahl ab Zeile 131.
- **Problem und Auswirkung:** Benutzer wählt „Korrektur“, während freie Stunden vorhanden sind. Ein anderer Benutzer weist inzwischen den gesamten freien Bestand zu. Die Korrektur antwortet mit `BELOW_ALLOCATED_HOURS` und `freeMinutes: 0`. Nach `setCurrent` verschwindet die Auswahl der Buchungsart, `kind` bleibt aber `Correction` und das erlaubte Maximum wird null. Der Benutzer kann im geöffneten Dialog weder speichern noch wieder „Gutschrift“ wählen.
- **Empfehlung:** Die Auswahl bei bereits gewählter Korrektur erreichbar lassen und erklären, warum diese gerade nicht möglich ist; einen bewussten Wechsel zur Gutschrift ermöglichen. Konflikttest mit freiem Bestand null ergänzen.

### F06 · P2 · E2E deckt zentrale Abnahmekriterien der Stundenfunktion nicht ab

- **Fundstelle:** `apps/workspace/e2e/hours.e2e.ts:22`, Buchung ab Zeile 53, direkter Übergang zum Löschen ab Zeile 80; `packages/db/scripts/crm-fixture/seed-hours.ts` (alle `task_id: null`).
- **Problem und Auswirkung:** Der einzige E2E bucht ohne Aufgabe, prüft keinen numerischen Rest und überspringt das Bearbeiten vollständig. Task 72-T5 verlangt ausdrücklich Buchung mit Aufgabe, Restprüfung, Änderung und Löschung. API- und Dialog-Unit-Tests sichern die einzelnen Schichten, aber keine korrekte Aufgabenverknüpfung und Balanceaktualisierung durch den echten Gesamtflow. Die Stunden-Fixture enthält außerdem keine einzige Buchung mit Aufgabe, obwohl der Seed dies liefern soll.
- **Empfehlung:** E2E um Aufgabenauswahl, sichtbare Aufgabenzeit, konkrete Balance-Differenzen sowie eine Änderung ergänzen. Mindestens eine Seed-Buchung an eine Aufgabe desselben Projekts hängen. Den E2E erst mit belegtem Lauf als erfülltes Merge-Gate behandeln.

### F07 · P2 · Exportierter Cursor-Contract liegt in einer Pattern-Datei

- **Fundstelle:** `packages/common/src/patterns/crm/hours/time-entry-cursor.ts:6` (`TimeEntryCursor`).
- **Problem und Auswirkung:** Der neue öffentliche Datentyp wird aus `patterns/` exportiert. Nach Root-`AGENTS.md`, „Export entscheidet über den Ort“, und `packages/common/AGENTS.md`, „Eine Contract-Datei pro Contract“, muss ein exportierter Shape unter `contracts/` liegen. Damit hängt die öffentliche Cursor-API entgegen der Architekturregel an ihrem Implementierungsmodul.
- **Empfehlung:** `TimeEntryCursor` in eine eigene Datei unter `packages/common/src/contracts/crm/hours/` verschieben; Encoder und Decoder importieren den Typ von dort.

### F08 · P3 · Zuweisungshistorie zeigt den UTC-Tag statt des Geschäftstags

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/hours-history-list/hours-history-list.tsx:77`; bestehender Helfer `apps/workspace/src/lib/i18n/format-moment-day.ts`.
- **Problem und Auswirkung:** `createdAt.slice(0, 10)` entfernt die Uhrzeit vor der Umrechnung nach Europe/Berlin. Eine Zuweisung am 08.10. um 00:30 Uhr Berliner Zeit hat beispielsweise `createdAt = 2026-10-07T22:30:00.000Z` und erscheint in der Historie als 07.10. Das betrifft Buchungen nach lokaler Mitternacht bis 01:00 beziehungsweise 02:00 Uhr.
- **Empfehlung:** Zeitpunkte über den vorhandenen `formatMomentDay(createdAt, locale)` darstellen. `formatCalendarDay` weiterhin für echte DATE-Werte wie `purchasedOn` und `performedOn` nutzen.

## Prüfungen und Grenzen

- Workspace: fokussierter Vitest-Lauf mit Stunden-UI, Formular-Patterns, Stunden-/Zeitbuchungsrouten, Mapper und CRM-Endpoint-Regeln: **10 Dateien, 67 Tests grün**.
- Common: Stunden-Patterns, Stunden-Konstanten und Systemrollen: **6 Dateien, 51 Tests grün**.
- `pnpm --filter @invessiv/workspace typecheck`: **grün**.
- Beide Vitest-Läufe zunächst durch `spawn EPERM` in der Sandbox blockiert; nach Freigabe außerhalb der Sandbox erfolgreich wiederholt. Kein fachlicher Testfehler.
- DB-Integration, Migration, schreibende Constraint-Smokes, Seeds und authentifizierte E2E **nicht ausgeführt**. Keine Änderungen an externen Daten. Fremdzugriff und Nebenläufigkeit sind daher anhand des Codes und der vorhandenen Integrationstests bewertet, nicht durch einen neuen DB-Lauf bestätigt.
- Kein App-Build, vollständiger Monorepo-Lint-/Testlauf oder Browser-A11y-/Theme-/Responsive-Smoke. Dieses Review ist keine Bestätigung aller Merge-Gates. Keine Secrets oder lokale Secret-Dateien als Reviewquelle gelesen.
- Relevante Tests für die beschriebenen Auslöser fehlen; die grünen fokussierten Tests entkräften diese Findings deshalb nicht.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche dauerhafte Regel vorgeschlagen. Konflikt-Konsistenz, Datum-/Zeitzonenfälle, Exportorte und der Abgleich von Akzeptanzkriterien mit tatsächlichen Tests sind bereits durch den verwendeten `invessiv-workspace-review`-Skill abgedeckt. Der Skill bleibt unverändert.
