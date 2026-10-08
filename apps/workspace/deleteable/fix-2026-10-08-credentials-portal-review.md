# Behebung — Credentials-Portal-Review vom 08.10.2026

Umsetzung auf Auftrag „fixen“. Bezug: `review-2026-10-08-credentials-portal.md`. Der ursprüngliche Bericht bleibt als Aufnahme des geprüften Stands erhalten.

- **F01 behoben:** Der Portal-Dialog merkt sich den auslösenden Button über die Credential-ID beziehungsweise den Create-Schlüssel. Nach Abbrechen kehrt der Fokus unmittelbar zurück; nach Speichern wartet er auf die neue Metadatenliste. Umbenennen ändert das Fokusziel nicht. Fehlt der Eintrag oder ist seine Aktion gesperrt, wird der Schließen-Button fokussiert. Dafür nimmt der gemeinsame `Dialog` einen optionalen `closeButtonRef` entgegen. Der bereits vorhandene Fokus-Hook wurde unverändert nach `hooks/shared/` verschoben und wird von CRM und Portal verwendet. Der Portal-Listen-Hook meldet laufende Aktualisierungen separat, da währenddessen absichtlich die bisherige Liste sichtbar bleibt.
- **F02 behoben:** Overlay-Zustände und die Bestätigungsflags des Portal-Clients verwenden lokale Const-Objekte mit abgeleiteten Typen. Transportvertrag und Berechtigungen bleiben unverändert.

## Verifikation

- Betroffene Portal-/CRM-Dialog-, Zeilen- und Transporttests: **69 Tests grün**. Neue Regressionen sichern Fokus nach Abbrechen, Hinzufügen, verzögertem Reload mit geändertem Titel sowie verschwundenem oder gesperrtem Eintrag ab.
- Gemeinsame Dialogtests im UI-Paket: **3 Tests grün**.
- Workspace- und UI-Typecheck grün.
- Abschließendes `pnpm -r typecheck` und `pnpm -r lint` grün. Lint enthält bestehende Warnungen in unveränderten Web-/Workspace-Tests und Paket-Konfigurationshinweise; keine Fehler.
- Workspace- und UI-Lint ohne Fehler. Bekannte Workspace-Warnung zu `_omitted` in `update-project.command-handler.test.ts:189`; bestehender Next-Lint-Konfigurationshinweis im UI-Paket.
- Workspace-App-Build grün; bestehende Turbopack-Warnung zum breiten Env-Dateimuster in `packages/db/src/core/env.ts`.
- `git diff --check` grün.

Keine Datenbank-, Clerk-, Rollen-, Secret- oder Deployment-Änderung. Kein Commit oder Merge. Die ungeklärten Fehler des älteren vollständigen Portal-E2E-Laufs werden durch diese gezielten Fixes nicht als behoben behauptet; echte Session-/DB-E2E wurden hier nicht ausgeführt.
