# Paket B — Kleine Cockpit-Korrekturen

> Teil von [README.md](./README.md) (Ziel, Entscheidungen, Reihenfolge, gemeinsame Regeln, Abnahme). Nur Plan, nichts umgesetzt.

- **B1 — Projekt anlegen: Fehler am Namensfeld (bugs 1).**
  `project-editor-dialog.tsx` bricht bei leerem Titel still ab. Neu nach dem Muster von
  `task-form-dialog.tsx` / `customer-form-dialog.tsx`: Validierungsfunktion in
  `src/common/patterns/crm/project-form.ts`, `errors`-State, `FormField errorMessage`, Fokus auf das erste Feld mit
  `aria-invalid="true"`. Die Fokus-Zeile existiert bereits in `customer-form-dialog.tsx`; sie wird als gemeinsamer
  Helfer ausgelagert statt kopiert. Neuer Text `projects.titleRequired` in DE/EN. Komponententest.
- **B2 — Bereiche standardmäßig zugeklappt (bugs 7).**
  `defaultExpanded` entfernen in `project-tasks-section.tsx`, `project-feedback-section.tsx`,
  `project-onboarding-section.tsx`, `customer-files-section.tsx`. Ausnahme, damit kein Link ins Leere führt: Der
  Feedback-Bereich öffnet sich, wenn die URL `feedbackRoundId` trägt oder gerade übergeben wurde.
- **B3 — Prüfung filtern (bugs 4).**
  `onboarding-review-tab.tsx` bekommt eine Filterleiste „Alle / Offen / Vollständig / Rückfrage“ mit Anzahl je Status
  (Zahlen aus `summarizeOnboardingReview`, Labels aus `review.status` sind vorhanden). Filter als URL-Parameter
  (Regel „URL-State statt React-State“). Zwei Leerzustände: „noch nichts zu prüfen“ und „kein Block in diesem Status“.
- **B4 — Projektwerte im Cockpit (bugs 5): keine Änderung.**
  Vom Owner am 03.10.2026 bestätigt: Das Verhalten ist richtig und bleibt. Die Summe zählt nur bestätigte Leistungen
  (`project-line-item-value.ts`); neue Leistungen entstehen als `planned` und zählen erst nach der Bestätigung. Der
  Preis einer Leistung ist ihr eigener Snapshot, nie der Vorlagenpreis. Kein Task.
