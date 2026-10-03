# Paket F — Projektwechsel im Portal

> Teil von [README.md](./README.md) (Ziel, Entscheidungen, Reihenfolge, gemeinsame Regeln, Abnahme). Umsetzung im Review, Merge offen.

**Stand:** Die Projektwahl gibt es nur als Tab im Projekt-Widget und als `?project=` auf dem Dashboard. Der Server
kennt sie nicht; Aufgaben „Von dir benötigt“, Feedback, Dateien, Onboarding und Ansprechpartner sind kundenweit. Die
Widget-Registry (`portal-widget-layout.ts`) trägt je Widget schon `scope: Customer | Project`, das Feld wird aber
nirgends gelesen.

- **F1 — Zentraler Projektumschalter.**
  Neuer `ProjectSwitcher` rechts im Kopf des Portals neben dem Theme-Switch mit `CustomSelect` aus `@invessiv/ui`.
  Sichtbar nur bei mehr als einem laufenden Projekt. Die Auswahl steht als `?project=<id>` in der
  URL; `buildPortalDashboardHref` wird zu einem allgemeinen Portal-Pfadhelfer, und die Navigation (Dateien,
  Onboarding, Nachrichten, Zurück-Link) reicht den Parameter weiter. Der Tab im Projekt-Widget entfällt.
- **F2 — Server kennt das Projekt.**
  `page.tsx` des Dashboards liest `searchParams.project`, prüft die Id über `portalProjectCondition` (unbekannt oder
  fremd → erstes Projekt, nie ein Fehler mit Datenabfluss) und gibt sie an die Lader. `getPortalDashboard` filtert
  Aufgaben und Runden in der Query auf das Projekt.
- **F3 — Widgets nach Registry-Scope.**
  Scope in `portal-widget-layout.ts` neu setzen: Projekt = Projekt, Onboarding, „Von dir benötigt“, „Daran arbeiten
  wir“, Feedback, Dateien, Ansprechpartner. Kunde = Abgeschlossene Projekte, Chat. `portal-dashboard.tsx` filtert
  nicht mehr von Hand je Widget.
  - Onboarding-Widget: Bogen des gewählten Projekts statt `pickPortalOnboardingWidgetForm` über alle.
  - Feedback-Widget: Runden des gewählten Projekts.
  - Ansprechpartner: Projektbetreuer, Rückfall Kundenbetreuer (gleiche Reihenfolge wie beim Buchungslink).
- **F4 — Dateien projektbezogen (bugs 9).**
  `listPortalFiles` und `portal-file-schemas.ts` bekommen `projectId`. Das Widget zeigt Dateien des Projekts plus
  firmenweite Dateien (`project_id IS NULL`, z. B. Logo). Die Seite `/files` filtert standardmäßig genauso und bietet
  den Umschalter „Dieses Projekt / Alle Projekte“ als URL-Parameter. Ein Upload aus der Projektansicht ist mit dem
  gewählten Projekt vorbelegt.
- **F5 — Ohne Projekt und mit einem Projekt.** Kein Umschalter, Verhalten wie heute. Tests für null, ein und mehrere
  Projekte sowie Cross-Customer-Negativtest mit fremder `project`-Id.

Der Chat bleibt bewusst kundenweit (eine Unterhaltung je Kunde).
