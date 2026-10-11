# Nachprüfung: CRM 73 – Behebungsstand

**Stand:** 11.10.2026, HEAD `d6b11ad9`, lokale Änderungen einschließlich ungetrackter Stunden-Dateien. Umfang ausschließlich F01–F03 aus `review-2026-10-09-crm-73-stunden-portal.md`; kein erneutes vollständiges Feature-Review. Kein Produktivcode geändert.

**Ergebnis:** Alle drei Findings sind im aktuellen lokalen Code behoben.

- **F01:** `portal-time-entry-list.tsx` zeigt die Projektfilter bei `projects.length > 0`, einschließlich „Alle Projekte“. Die Dialogtests prüfen Auswahl und Zurücksetzen bei einem Projekt mit früheren Buchungen, auch mit vorgefiltertem Link.
- **F02:** `use-portal-time-entries.ts` leitet den Filter bei jedem Render aus `useSearchParams` und den aktuell erlaubten Projekt-IDs ab. Der effektive Filter ist Teil des Paging-Keys. Hooktests prüfen URL-Wechsel ohne Remount, unbekannte IDs sowie entfernte Projekte einschließlich Pagination und Retry.
- **F03:** `portal-hours-mapping-service.ts` verwendet vor dem DTO-Mapping `comparePortalCurrentProjects`. Die vorherige Umkehr erhält die Reihenfolge neuester Projekte innerhalb jeder Statusgruppe. Der Mappertest prüft Statusgruppen, Reihenfolge innerhalb der Gruppen und unveränderte Eingabedaten.

**Abdeckung:** Betroffene Implementierungen und Regressionstests geprüft; gemeinsamer Projektvergleich und Paging-Hook einbezogen. Die Korrekturen verwenden bestehende gemeinsame Bausteine und halten Filterzustand in der URL.

**Validierung:** Die drei betroffenen Vitest-Suites erneut ausgeführt: **3 Dateien, 25 Tests grün**. Der erste Versuch scheiterte am Sandbox-Start (`spawn EPERM`); der freigegebene Lauf war erfolgreich.

**Grenzen:** Keine Aussage über Commit-, Merge- oder Deploymentstand. Build, vollständige Merge-Gates, DB-/Clerk-E2E und produktive Buchungsbeschreibungen wurden nicht geprüft. Die im ursprünglichen Bericht separat genannten offenen Punkte (401 gegenüber geplanter 404 und Beschreibungscheck) werden durch die drei Fixes nicht geschlossen.

**Vorschläge zur Skill-Verbesserung:** Keine zusätzliche allgemeine Regel erforderlich.
