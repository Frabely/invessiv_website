# Review: Task 73 – Stunden im Portal

**Stand:** 09.10.2026, Branch `feat/crm-stunden-3-portal`, HEAD `d6b11ad913eff4a01ab9831344e57eaa9bd8b5c5`. Gegenstand sind die lokalen Änderungen einschließlich neuer, noch ungetrackter Dateien für Plan `73-stunden-im-portal.md`. Kein Code geändert.

**Gesamturteil:** Zwei P2-Findings am Projektfilter und ein P3-Finding zur vorgegebenen Projektreihenfolge. In den geprüften Stunden-Lesepfaden kein belegter Cross-Customer-Zugriff oder Abfluss interner Mitarbeiterfelder. Die Ausführung der DB- und Browser-Akzeptanz bleibt offen.

## Abdeckung und Architektur

- **Portalfluss geprüft:** Dashboard-Seite, Widget-Registry/Sichtbarkeit, Dashboard und Dialog-Host, alle neuen Stunden-Komponenten und CSS-Module, Filter-/Paging-Hooks, Client-Service, API-Route und Fehlerabbildung, beide Query-Handler und Stunden-Services. Angrenzende Projektselektion und Portal-Zugriffshelfer wurden zur Bewertung verfolgt.
- **Gemeinsame Bausteine geprüft:** Stunden-DTOs, Query-/Result-/Row-Contracts, Permission-Katalog und Migration `0057`, Endpoint-/Query-Konstanten, Monatsgruppierung und Datumsformatierung, gemeinsame Saldenberechnung und Cursor-Paging.
- **CRM-Änderungen geprüft:** API-Service und Antwortschemas, Kunden-Stundensektion, Saldenanzeige, Listen-Hook, Listen-Handler und Ledger-Service samt verschobenen Eingabetypen. Die bestehende Delete-Route wurde mit dem neuen Antwortschema abgeglichen.
- **Tests und Integration geprüft:** neue Dialog-, Client-, Mapper-, Route- und Stunden-Integrationstests, geänderte Widget-/Endpoint-/Permission-Tests, neue Hours-E2E, Dashboard-E2E, vollständige E2E-Datenbank-Fixture und Pfade, Playwright-Konfiguration und Smoke-Einbindung. Bei der umfangreichen bestehenden Dashboard-Testsuite lag die Detailprüfung auf den geänderten Hours-Fällen; die gesamte Datei wurde durch den Testlauf ausgeführt. Dictionary-Änderungen in DE/EN und Plan-/E2E-Dokumentation wurden abgeglichen.
- **Regelbasis:** Root- und Workspace-Regeln sowie relevante Scopes für Portal-Routen/UI/Server, API, CRM-UI/Server, Client, Hooks, Common, Lib, Shared-Server, Packages/Common/DB und CRM-Pläne. Die gelesenen CLAUDE-Dateien verweisen auf AGENTS.md.

Die Trennung von Portal und Workspace bleibt in den neuen Produktivpfaden erhalten. Die gemeinsame Saldenabfrage vermeidet abweichende Rechnungen; das extrahierte Paging und der gemeinsame Listen-Hook vermeiden eine zweite Implementierung. Mapper selektieren bzw. liefern explizite Portal-Felder. Komponenten sind nach Verantwortung aufgeteilt, Texte liegen in DE/EN vor, Notizen und Beschreibungen werden als Text gerendert. Fehlendes Detailrecht verhindert das Mounten und Laden der Buchungsliste. Die API begrenzt ihre Abfrage auf den verifizierten Kunden und setzt auch bei Fehlern private/no-store.

## Findings

### F01 · P2 · Bei einem sichtbaren Projekt lässt sich ein gültiger Filter nicht zurücksetzen

- **Fundstelle:** `apps/workspace/src/components/portal/hours/portal-time-entry-list/portal-time-entry-list.tsx:77` (Filter nur bei `projects.length > 1`); `apps/workspace/src/hooks/portal/use-portal-time-entries.ts:22` (Initialfilter aus der URL).
- **Problem und Auswirkung:** Ein Kunde mit einem sichtbaren Projekt und Buchungen früherer Projekte kann das sichtbare Projekt nicht separat auswählen. Öffnet er dagegen einen gültigen Link mit `?widget=hours&hoursProject=<einziges Projekt>`, wird dieser Filter angewendet, aber sämtliche Filterbuttons einschließlich „Alle Projekte“ fehlen. Die Buchungen früherer Projekte bleiben dadurch verborgen, ohne dass der Kunde den Filter im Dialog erkennen oder zurücksetzen kann.
- **Empfehlung:** Filter samt „Alle Projekte“ auch bei einem einzelnen angebotenen Projekt anzeigen, mindestens jedoch bei aktivem Filter. Den Fall „ein sichtbares Projekt plus frühere Buchungen“ und einen vorgefilterten Link mit einem Projekt absichern. Grundlage: Task 73, CRM-73-T3, Projektfilter als URL-State und vollständige Buchungsliste.

### F02 · P2 · Der Filter wird nur beim Mounten aus URL und Projektliste validiert

- **Fundstelle:** `apps/workspace/src/hooks/portal/use-portal-time-entries.ts:19–25`; beteiligt: `apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.tsx` (Dialog ohne Filter-/Projekt-Key) und `apps/workspace/src/server/portal/query-handler/list-portal-time-entries.query-handler.ts` (ungültiger Projektfilter → validation).
- **Problem und Auswirkung:** `requested` wird bei jedem Render gelesen, aber ausschließlich als `useState`-Initialwert verwendet. Ändert sich `hoursProject` bei bestehen bleibendem Dialog, zeigt und lädt die Liste weiterhin den alten Filter. Wird das gewählte Projekt zwischenzeitlich archiviert und die Dashboard-Daten bei offenem Dialog aktualisiert, bleibt ebenfalls die alte ID aktiv, obwohl sie nicht mehr in `projectIds` vorkommt. Nachladen oder „Erneut versuchen“ sendet dann diese ungültige ID und scheitert mit 422; ein Reload würde denselben Zustand korrekt als ungefiltert behandeln.
- **Empfehlung:** Den effektiven Filter bei jedem Render aus dem aktuellen URL-Wert und den aktuellen erlaubten Projekt-IDs ableiten; `replaceState` bleibt der Schreibweg. Alternativ beide Änderungen ausdrücklich synchronisieren. Rerender mit geändertem URL-Filter sowie Entfernung des ausgewählten Projekts testen. Regelbezug: `apps/workspace/src/components/portal/AGENTS.md`, „Stunden“, und `apps/workspace/plans/crm/AGENTS.md`, „URL-State statt React-State“.

### F03 · P3 · Die Stunden-Projekte folgen nicht der Dashboard-Reihenfolge

- **Fundstelle:** `apps/workspace/src/server/portal/services/hours/portal-hours-mapping-service.ts:86–90`; Vergleich: `apps/workspace/src/server/portal/services/portal-project-service.ts` (`toCurrent`) und `apps/workspace/src/common/patterns/portal/compare-portal-current-projects.ts`.
- **Problem und Auswirkung:** Der neue Mapper kehrt lediglich die nach Erstellungszeit sortierten Summen um. Die Dashboard-Projektwahl gruppiert dagegen aktive vor pausierten vor geplanten Projekten und sortiert erst innerhalb dieser Gruppen nach Alter. Beispielsweise steht ein neueres pausiertes Projekt im Stunden-Dialog vor einem älteren aktiven, während der Projektwechsler die umgekehrte Reihenfolge zeigt. Der DTO-Vertrag und Task 73 verlangen ausdrücklich die Dashboard-Projektreihenfolge; der Mapper-Kommentar behauptet diese Gleichheit fälschlich.
- **Empfehlung:** Den vorhandenen Projektvergleich auf den noch statusführenden Summenzeilen wiederverwenden, bevor der DTO-Mapper den Status entfernt. Einen Fall mit unterschiedlichen Status und Erstellungszeiten absichern.

## Prüfungen und Ergebnisse

- Workspace: fokussierter Vitest-Lauf über Stunden-Dialog, Dashboard-Tests, Portal-Route/Mapper, beide API-Services sowie Portal-Konstanten und Patterns: **34 Dateien, 242 Tests grün**.
- Common: betroffene Permission-, Systemrollen-, Hours-Error-Code- und DTO-Tests: **4 Dateien, 26 Tests grün**.
- `pnpm --filter @invessiv/workspace typecheck`: **grün**.
- `pnpm --filter @invessiv/workspace lint`: **0 Fehler**, eine Warnung für `_omitted` in der unveränderten `src/server/tests/workspace/crm/command-handler/update-project.command-handler.test.ts:189`.
- Die ersten Vitest-Versuche wurden durch Sandbox-`spawn EPERM` blockiert; die danach freigegebenen Läufe waren erfolgreich. Die Findings wurden anhand der vollständigen betroffenen Implementierungen und ihrer Aufrufer statisch abgesichert; keine neuen Tests oder Reproduktionen ins Repository geschrieben.
- **Nicht ausgeführt:** DB-Migrationen, DB-Smokes/Integrationstests mit echter Datenbank, Clerk-E2E und App-Build; vollständige monorepoweite Merge-Gates ebenfalls nicht ausgeführt. Die DB-/E2E-Skripte verändern externe Testdaten und wurden im reinen Review nicht gestartet. Keine Aussage über visuell geprüfte Browserdarstellung, tatsächlichen DB-Katalogstand oder Produktionstexte.

## Offene Punkte

- Task 73 nennt für einen anonymen Listenaufruf 404; die neue E2E erwartet 401. Die Route übernimmt bewusst den bestehenden `withPortalReader`-/`portalApiAuthError`-Pfad, der anonymen Aufrufen 401 gibt. Das bestätigt keinen Kunden und wurde daher nicht als neue Sicherheitslücke gewertet; die Abweichung zur Plan-Akzeptanz sollte vor Abnahme dokumentiert werden.
- Der vorgegebene Deploy-Check auf bereits vorhandene, möglicherweise intern formulierte Buchungsbeschreibungen bleibt offen; produktive Daten wurden nicht gelesen.

## Behebungsstand 10.10.2026

- **F01 behoben:** Projektfilter einschließlich „Alle Projekte“ erscheint auch bei einem einzelnen sichtbaren Projekt. Regressionstests prüfen frühere Buchungen sowie Auswahl und Zurücksetzen mit und ohne vorgefilterten Link.
- **F02 behoben:** Der effektive Filter wird bei jedem Render aus `useSearchParams` und den aktuell angebotenen Projekt-IDs abgeleitet; `replaceState` bleibt der Schreibweg. Regressionstests prüfen URL-Wechsel ohne Remount, unbekannte IDs und die Entfernung des ausgewählten Projekts einschließlich Nachladen und erneutem Versuch.
- **F03 behoben:** Die noch statusführenden Summenzeilen werden vor dem DTO-Mapping mit `comparePortalCurrentProjects` sortiert, nach Umkehr der ursprünglichen Erstellungsreihenfolge. Der Regressionstest prüft unterschiedliche Status und mehrere Projekte pro Status sowie die unveränderte Eingabereihenfolge.
- **Validierung:** Betroffene Dialog-, Hook- und Mapper-Suites: 3 Dateien, 25 Tests grün. `pnpm -r typecheck` und `pnpm -r lint` grün; zwei bestehende Lint-Warnungen in unveränderten Dateien (`sample-card.test.tsx`, `update-project.command-handler.test.ts`).
- App-Build, vollständiger Monorepo-Testlauf, DB-/Clerk-E2E und produktiver Beschreibungscheck wurden im Rahmen dieser fokussierten Behebung nicht ausgeführt. Die oben dokumentierten offenen Punkte bleiben bestehen.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche allgemeine Regel vorgeschlagen: URL-State, Filter-Grenzfälle, veralteter Clientzustand und Abgleich mit bestehenden Features sind bereits Bestandteil des Review-Skills.
