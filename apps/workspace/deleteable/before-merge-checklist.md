Ein weiteres Review ist nicht nötig. Vor dem Merge:

- [x] **Checks grün:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` auf dem letzten Stand.

  Geprüft am 08.10.2026:
  - [x] `pnpm -r lint`: erfolgreich, keine Fehler; vorhandene Warnungen.
  - [x] `pnpm -r typecheck`: erfolgreich in allen Paketen und Apps.
  - [x] `pnpm -r test`: erfolgreich in allen Paketen und Apps; Workspace: 3395 bestanden, 397 übersprungen, keine Fehler.
    - CRM-Seitentest: Credential-Projekt-Handler gemockt, damit kein echter DB-Zugriff erfolgt.
    - Credentials-Test: kontrollierte Testuhr für die 30-Sekunden-Frist; Fokusprüfungen warten auf den abgeschlossenen Effekt.
    - Cockpit-Test: erwartet nur den verbleibenden Stunden-Platzhalter und prüft, dass Zugangsdaten ohne übergebenen Zugriff fehlen.
  - [x] `pnpm --filter @invessiv/workspace build`: erfolgreich; Turbopack-Warnung zum breiten Env-Dateipattern in `packages/db/src/core/env.ts`.

- [ ] **Credentials kurz durchspielen:** im Cockpit und Portal anlegen, bearbeiten, Geheimnis/Notiz anzeigen; Freigabe und fehlende Berechtigungen prüfen.
  - [x] Credentials-E2E mit echten Clerk-Development-Sitzungen: interne Anlage/Freigabe per API; Portal-Anlegen und -Bearbeiten im Browser; Passwort/Notiz anzeigen, Kopieren, Fremdzugriffe, Owner-Leseansicht, Versionskonflikt, Freigaberücknahme und Rollenentzug erfolgreich. Owner-Ansicht in DE/EN, Dark/Light und auf Mobil/Desktop geprüft.
  - [ ] Anlegen/Bearbeiten über das Cockpit-Formular separat durchspielen; der vorhandene Credentials-E2E nutzt für interne Schreibaktionen die API.
- [x] **Portal-E2E klären:** Tests korrigiert und die konfigurierte Portalsuite erfolgreich ausgeführt.
  - Abschließender Lauf am 08.10.2026: `pnpm --filter @invessiv/workspace exec playwright test --config playwright.portal.config.ts` auf dem erfolgreich gebauten Development-Stand: **17 bestanden, 1 übersprungen, keine Fehler**.
  - Erfolgreich: Setup mit frischen Clerk-Test-Sitzungen, Credentials, Portalzugang, Dashboard, Dateien/Links und Chat-Anhang-Freigabe, vollständige Feedback- und Abnahmeabläufe, Onboarding und Aufgaben.
  - Die vier vorherigen Fehler und weitere zuvor nicht erreichte veraltete Teststellen sind behoben; Details unter `fix-2026-10-08-portal-e2e.md`. Keine Änderungen am Anwendungscode.
  - Einziger Skip: vorhandener optionaler echter Blob-Upload, da `E2E_LIVE_BLOB` nicht aktiviert ist. Kein Nachweis für diesen optionalen Flow.
  - Die separaten Access-Scope-, Cockpit-Aufgaben- und Cockpit-Onboarding-Suiten aus `playwright.config.ts` wurden nicht ausgeführt.
- [ ] **Deployment vorbereiten:** benötigte Migrationen und Encryption-Konfiguration in der Zielumgebung prüfen; Clerk-Prod-Umzug separat abstimmen, falls er mit diesem Deployment erfolgen soll.
- [ ] **Finalen Diff prüfen:** keine Secrets, temporären Dateien oder unbeabsichtigten Änderungen; anschließend über den reviewten PR mergen.
