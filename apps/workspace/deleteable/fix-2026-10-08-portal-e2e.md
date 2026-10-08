# Portal-E2E korrigiert

Am 08.10.2026 wurden ausschließlich die vier E2E-Testdateien für Dashboard, Feedback, Dateien und Onboarding angepasst. Anwendungscode blieb unverändert.

- Dashboard: Owner-Hinweis auf Mobil im geöffneten Menü prüfen; Prozessschritte einschließlich ihrer Statusangaben erwarten.
- Dateien: kundenweiten Dateienabschnitt vor der Linkanlage aufklappen, auch im Chat-Anhang-Test.
- Onboarding: alle Dashboard-Einstiege explizit auf das Onboarding-Projekt richten; URL über vorhandene Pfad-/Query-Helfer bauen.
- Feedback: zugängliche Überschriften und Text-Locators im Hauptinhalt verwenden, exakte Options-/Badge-Namen prüfen, CustomSelect über Button und Option bedienen. Nach der Gesprächsanfrage auf den aktualisierten Rundenstatus warten. Für die abschließenden Dashboard-Prüfungen jeweils das abgenommene Projekt auswählen.

## Validierung

- Development-Migrationen aktuell; Development-Build erfolgreich über `test:e2e:portal`.
- Abschließender vollständiger Browserlauf: `pnpm --filter @invessiv/workspace exec playwright test --config playwright.portal.config.ts` auf diesem Build: **17 bestanden, 1 übersprungen, keine Fehler**. Setup mit frischen Clerk-Test-Sitzungen erfolgreich.
- Auch die bislang nicht erreichten Feedback-/Abnahme-Folgetests bestanden. Keine neuen Skips, Retry- oder Timeout-Erhöhungen.
- Einziger Skip: bereits vorhandener optionaler echter Blob-Upload (`E2E_LIVE_BLOB` nicht aktiviert). Der Onboarding-Ablauf einschließlich Feld-Upload bestand.
- Workspace-Typecheck, ESLint für alle vier geänderten E2E-Dateien und `git diff --check` erfolgreich. Vorhandene ESLint-/Turbopack-Konfigurationswarnungen bleiben.
- Die separaten Access-Scope-/Cockpit-Suiten aus `playwright.config.ts` wurden nicht ausgeführt; internes Credential-Anlegen/Bearbeiten über das Cockpit-Formular bleibt ein eigener Checklistenpunkt.

Die zuvor dokumentierten vier Portal-E2E-Abbrüche sind damit behoben. Dieser erfolgreiche Lauf ersetzt die rote E2E-Bewertung aus `review-2026-10-08-portal-e2e-merge.md` für die konfigurierte Portalsuite.
