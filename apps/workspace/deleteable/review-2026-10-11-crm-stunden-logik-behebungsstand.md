# Behebungsstand: Stunden-Review F01–F10

Stand: 11.10.2026, lokale Änderungen auf `feat/crm-stunden-3-portal`, HEAD `78501d42`.
Grundlage: `review-2026-10-11-crm-stunden-27-72-73-logik.md`.

- **F01:** Kundenstand und Projekte bleiben bei Verbrauch oder Kulanz ohne Kauf-/Zuweisungsledger sichtbar. Ein negativer Rest wird nicht verhindert oder automatisch ausgeglichen; Nachkauf beziehungsweise finanzieller Ausgleich bleiben fachliche Folgeaktionen des Betreuers.
- **F02:** Die Restprognose verwendet die Referenzbuchung aus demselben Snapshot wie die Projektbalance. Der neue Stand aus einem Versionskonflikt liefert die Version für den nächsten Schreibversuch, wird aber nicht mit der alten Balance verrechnet. Daueränderung und Wechsel der Berechenbarkeit im Konflikt sind getestet. Das ist keine laufende Echtzeitaktualisierung aller übrigen Projektbuchungen.
- **F03:** Anlegen und Bearbeiten/Löschen werden hinsichtlich Projektstatus getrennt. Aufgaben bieten auf archivierten oder abgebrochenen Projekten keine neuen Buchungen an; bestehende Buchungen bleiben bearbeitbar/löschbar. Vier Projektstatus sind im Canvas-Test geprüft.
- **F04:** Cursor validieren reale ISO-Datums-/Zeitwerte vor SQL-Casts. Unmögliche Monate, Tage, Uhrzeiten und ein gültiger Schalttag sind geprüft.
- **F05:** Nach abgelehnter Korrektur mit freiem Bestand null bleibt der Wechsel zur Gutschrift möglich; Eingabe und Idempotenzschlüssel bleiben erhalten. Regression prüft den anschließenden Kaufrequest.
- **F06:** CRM-E2E bedient die echten Spinbuttons, wählt eine Aufgabe, prüft konkrete Restwerte, ändert und löscht die Buchung und gibt Stunden frei. Die Stunden-Fixture verknüpft eine Buchung mit einer nicht abgebrochenen Aufgabe desselben Projekts. Voraussetzungen des E2E sind dokumentiert.
- **F07:** Einzelbuchungen für Zuweisung, Freigabe und Korrektur beachten zusätzlich zum verfügbaren Bestand `MaxLedgerMinutes`. Oberhalb dieser Grenze heißt die Schnellaktion „Maximum pro Buchung übernehmen“. Alle drei Richtungen sind gegen größere Gesamtbestände getestet.
- **F08:** Zuweisungszeitpunkte werden in Europe/Berlin formatiert; Regression um lokale Mitternacht grün.
- **F09:** Leerzustände, Buchungsbeschreibung und Löschbestätigung unterscheiden in DE/EN berechenbare Zeit und Kulanz fachlich korrekt.
- **F10:** „Frühere Projekte“ beschreibt in DE/EN neutral die nicht mehr einzeln angezeigten Projekte.

## Validierung

- Vollständiger lokaler Monorepo-Testlauf: **5.074 Tests bestanden**, 426 Workspace-Tests übersprungen (darunter DB-Integration); keine fachlichen Testfehler.
- `pnpm -r lint`: grün, zwei bestehende Warnungen in `sample-card.test.tsx` und `update-project.command-handler.test.ts`.
- Typechecks aller Pakete/Apps erfolgreich. Ein neuer Test hatte zunächst ein nicht unterstütztes Testing-Library-Optionsfeld; dieses wurde entfernt und der Workspace-Typecheck anschließend erfolgreich wiederholt.
- `pnpm --filter @invessiv/workspace build`: erfolgreich; bestehende Turbopack-Warnung zur breiten Umgebungsdateisuche in `packages/db/src/core/env.ts`.
- Playwright `hours.e2e.ts --list`: Suite wird erfolgreich geladen und gefunden. **Kein authentifizierter Browserlauf, kein DB-Seed oder schreibender DB-Smoke ausgeführt.** Die Browser-/DB-Abnahme bleibt offen.
- `git diff --check`: grün. Keine Migration, automatische Kontingentauffüllung oder Zahlungsverbuchung hinzugefügt.
