# Paket A — Feedbackrunden und Projektschritt (High Prio)

> Teil von [README.md](./README.md) (Ziel, Entscheidungen, Reihenfolge, gemeinsame Regeln, Abnahme). **Status: im Review.**

**Ursache:** `feedbackRoundWriteService.complete`
(`src/server/shared/services/feedback/feedback-round-write-service.ts`) lässt `current_process_step` stehen. Nur die
Kundenfreigabe (`approve`) ruft `feedbackProjectStepService.advancePastFeedbackRound`. Die Anzeige rechnet in
`buildProjectProcessTrack` (`packages/common/src/patterns/crm/project-process-track.ts`) trotzdem einen Schritt weiter,
der Bearbeiten-Dialog zeigt den gespeicherten Wert. `isAtFeedbackStep` verlangt für Runde 2 den gespeicherten Schritt
„Entwicklung“, gespeichert ist „Design“. Deshalb ist die Übergabe nach „Später“ gesperrt.

- **A1 — Schritt beim Abschließen vorrücken (Server).**
  `complete` ruft `advancePastFeedbackRound` auf, aber nur, wenn die nächste enthaltene Runde nicht an derselben
  Position sitzt. Beispiel Schritte `[Onboarding, Design, Entwicklung, Launch, Wartung]`, Runden an `[2, 3, 3]`:
  nach Runde 1 wird „Entwicklung“ gespeichert; nach Runde 2 bleibt „Entwicklung“, weil Runde 3 direkt folgt; nach
  Runde 3 wird „Launch“ gespeichert. Die Regel „folgt direkt“ kommt als reine Funktion nach
  `packages/common/src/patterns/crm/feedback-round-state.ts`, damit Server und Dialog dieselbe nutzen.
  Kommentar in `change-feedback-round-status.command-handler.ts` („Phase and track stay untouched“) und Abschnitt in
  `src/server/shared/AGENTS.md` anpassen. Tests: `feedback-round-state.test.ts`,
  `feedback-round-processing.integration.test.ts` (drei Fälle oben, plus Runde hinter dem letzten Schritt).
- **A2 — Abschluss-Dialog folgt der Serverregel (UI).**
  `feedback-complete-dialog.tsx` entscheidet heute nur über `nextNumber <= included`. Neu: Folgt die nächste Runde
  direkt, bleiben „Später“ und „Runde n übergeben“. Liegt ein Schritt dazwischen, zeigt der Dialog „Weiter mit
  ‚Entwicklung‘“ und nur „Schließen“. Texte in `i18n/dictionaries/workspace/crm/feedback-rounds/{de,en}.json`
  (`copywriting`). Test in `project-feedback-section.test.tsx`.
- **A3 — Übergabe nach „Später“ prüfen.**
  Nach A1 ist `overview.canHandOver` wahr, sobald der gespeicherte Schritt passt; der Kopf-Button in
  `project-feedback-section.tsx` erscheint dann wieder. Integrationstest: Runde 1 abschließen, neu laden, Runde 2
  übergeben. Zusätzlich prüfen, dass Anzeige und Bearbeiten-Dialog (`project-editor-dialog.tsx`) denselben Schritt
  zeigen.
- **A4 — Bestandsdaten.** Projekte mit abgeschlossener Runde und zurückgebliebenem Schritt einmalig in der Dev-DB von
  Hand korrigieren; keine Migration (nur Testdaten betroffen). Im PR vermerken.

**Bestandsdatenprüfung (03.10.2026):** In der Dev-Datenbank wurden 0 betroffene Projekte gefunden; eine Korrektur war
nicht nötig. Es wurde keine Migration angelegt.
