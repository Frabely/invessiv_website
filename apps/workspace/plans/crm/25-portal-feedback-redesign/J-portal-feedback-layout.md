# J – Feedbackbereich im Portal neu (Layout wie Onboarding)

Stand: 16.10.2026 · Branch `feat/portal-ui-optimierung`

## Ziel

Der Kunde sieht jederzeit, in welcher Feedbackrunde das Projekt steht, wer dran ist und was als Nächstes passiert.
Frühere Runden sind über denselben Stepper wie im Onboarding erreichbar und nur lesbar.

## Entscheidungen (mit dem Nutzer abgestimmt)

- **Stepper zeigt alle enthaltenen Runden** (`max(included, used)`): vergangene mit Haken und lesbar, die laufende
  mit Füllung nach Status, kommende ausgegraut und nicht klickbar. Runden nach einer Abnahme heißen „entfällt“.
- **Abnahme in der neuesten Runde.** Vor der letzten Runde ein ruhiger Abschnitt, der ausdrücklich sagt, wie viele
  Runden verfallen; der Dialog mit Pflicht-Haken bestätigt. Nach der letzten Runde ist „Projekt abnehmen“ die
  Hauptaktion in der Fußleiste.
- **Eine Karte je Punkt** mit Kopfzeile „Punkt n“ und Löschen-Icon-Button (`ButtonSize.Icon`, `quiet`), sichtbaren
  Labels für Bereich, Art und Text. Gelesene Runden zeigen dieselbe Karte mit dem Ergebnis unten.
- **„Zwischenspeichern“ entfällt.** Der Autosave speichert nach 1,5 s; der Button rief nur `flush()` auf, das bei
  gespeichertem Stand sofort zurückkehrt. Die Fußleiste zeigt stattdessen die Speicherzeile.
- **Keine handgebauten Pillen-Links.** Vorschau, Chat, Termin und Zusatzrunde laufen über `ButtonLink`.

## Schnitt

- Schritt-Bausteine aus `onboarding/` wandern nach `shared/` (`portal-step-frame`, `portal-step-header`,
  `portal-step-bar`, `portal-step-heading`) und werden von Onboarding und Feedback genutzt.
- `ProcessTrackStep.disabled` (packages/common + ui): nicht wählbarer Schritt.
- `feedbackRoundSteps` (`common/patterns/portal/`) leitet die Schritte aus dem Seiten-DTO ab.
- `useFeedbackRoundNavigation` (`src/hooks/portal/`): gewählte Runde, Fokus auf Überschrift, Scroll nach oben.
- `feedback-page-view` entscheidet nur noch Editor (`feedback-editor`, Zustand `sheet`) oder Reader
  (`feedback-reader`); beide nutzen `feedback-page-frame` und `feedback-round-read`.
- Entfallen: `feedback-round-history`, `feedback-round-intro`, `feedback-team-notice` (ersetzt durch
  `feedback-round-head` und `feedback-state-notice`).

## Offen

- Vollständige Sichtprüfung Desktop/Mobil.

## Nachprüfung · 16.10.2026

- Die sechs Findings aus `apps/workspace/deleteable/review-2026-10-16-portal-feedback-redesign.md` sind korrigiert.
- Portal-E2E `portal-feedback.e2e.ts`: alle vier Tests grün, einschließlich Reload und Browser-Zurück/Vorwärts.
- Monorepo-Tests, Lint und Typecheck sowie Workspace-Build grün; ergänzte Regressionstests für Upload-Erhalt,
  Speicherfehler, Konflikte und lokale History-Navigation ebenfalls grün.
