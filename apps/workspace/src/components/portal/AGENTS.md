# AGENTS.md — Portal-UI

Gilt für `apps/workspace/src/components/portal/**`. Ergänzt die Root-`AGENTS.md`,
`apps/workspace/src/app/[locale]/(portal)/AGENTS.md` und `apps/workspace/plans/crm/AGENTS.md`.
Fachliche Grundlage des Dashboards: `apps/workspace/plans/crm/13-portal-dashboard/21-portal-dashboard.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Verbindlich

- **Kein Import aus `components/workspace/**`** und keine Portal-Komponente im internen Bereich. Geteilte Bausteine
  kommen aus `@invessiv/ui` (`Widget`, `WidgetGrid`, `ProcessTrack`, `ChatDock`, `TabList`, `Dialog`, …). Braucht das
  Portal eine Workspace-Komponente, wandert sie app-neutral nach `packages/ui`, statt importiert oder kopiert zu werden.
- **Daten nur aus Portal-DTOs** (`packages/common/src/contracts/portal/`). Keine Komponente leitet Sichtbarkeit oder
  Rechte selbst ab: Was sie zeigt, hat der Server gefiltert; Schreibrechte kommen aus `capabilities`.
- **Widgets registrieren sich ausschließlich in `PORTAL_WIDGET_LAYOUT`** (`src/common/constants/portal/`). Sichtbarkeit
  läuft über `listVisiblePortalWidgets` (Permission + `onlyWithContent`). Ein neuer Folge-Ordner stellt sein Mock-Widget
  um (`mock: false` + `requiredPermission`), statt eine zweite Karte zu bauen.
- **Mock-Widgets** tragen das Badge „Bald verfügbar“ (`mock`-Prop am `Widget`) und zeigen **keine erfundenen Werte** —
  nur Skeleton-/Illustrationsinhalt und eine Beschreibung, was dort entstehen wird.
- **Öffnen nur über explizite Buttons** (`Widget`-`openMode`). Dialoge hängen am URL-Parameter `?widget=<key>`,
  Projekt-Tabs an `?project=<id>` (`portal-dashboard-query.ts`); Schließen entfernt den Parameter.
- **Owner-Sicht** (`capabilities.isOwnerView`): jede Schreibaktion ist deaktiviert und verweist mit Link ins CRM.
- **Texte** ausschließlich aus `src/i18n/dictionaries/portal/<modul>/{de,en}.json`, Anrede „du“ (wie im restlichen
  Portal), freundlich, kein
  Fachjargon („Bringschuld“ nie im UI). Überfälliges wird sichtbar, aber ohne Drohton formuliert.
- **Styling:** co-located `*.module.css`, nur Theme-Tokens aus `app/globals.css`, Zustände über `data-*`, sichtbarer
  Fokus, `prefers-reduced-motion` respektieren, Klickflächen ≥ 44 × 44 px. Keine verschachtelten Karten.
- Client-Zustand, der Daten einer Firma hält, wird über `key={customerId}` an die Firma gebunden, damit zwei Firmen nie
  gemischt erscheinen.
- `*Props`-Typen dürfen exportiert werden, sonst keine Typ- oder Konstantenexporte aus Komponenten.
