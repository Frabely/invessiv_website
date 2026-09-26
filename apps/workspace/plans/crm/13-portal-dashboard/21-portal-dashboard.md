# Task 21 — Portal-Dashboard (Umsetzungsplan)

> **Merge-Einheit:** Ordner 13 · **Branch:** `feat/portal-dashboard` (bereits ausgecheckt)
> **Aufwand:** L (≈ 5–7 Tage) · **Review-Scope:** ≈ 130 Dateien, ein PR (bewusst über 120 — im PR begründen)
> **Abhängigkeiten:** Task 49 (Portal-Fundament, Ordner 12a), Task 20 (Zugang, 12b), Task 10 (Projekte), Task 11
> (Aufgaben), Task 50 (Cockpit-Redesign, 12c)
> **Migration:** additiv — drei Portal-Permissions + `portal_standard`, Abschlussherkunft an `tasks`, neuer
> Security-Event-Typ

> **Neufassung 26.09.2026** — ersetzt den Stand vom 23.09.2026 vollständig. Alle Entscheidungen E1–E24 wurden mit
> dem Owner feature-weise geklärt. Dieser Plan ist so geschrieben, dass die Umsetzung **ohne weiteren
> Gesprächskontext** starten kann.

---

## 0. Goal

Ein sehr nutzerfreundliches, rein widget-basiertes Dashboard für Kunden, das alle für sie relevanten **und
freigegebenen** Daten zeigt — klickbar (Dialog / Vergrößern / Dock), passend zum bestehenden Workspace-Design. Am Ende
landen alle kundensichtbaren Core-Features aus `plans/crm` als Widget auf dem Dashboard.

## 1. Pflichtlektüre vor dem Start

In dieser Reihenfolge lesen (Regeln der spezifischsten Datei haben Vorrang):

1. `AGENTS.md` (Root), `apps/workspace/AGENTS.md` (Sprachregel: Doku DE, Code/Kommentare/Tests EN)
2. `apps/workspace/plans/crm/AGENTS.md` (Sicherheitsgrenzen, Architektur, DoD) + `00-entscheidungen.md`
3. `apps/workspace/src/app/[locale]/(portal)/AGENTS.md` — **kein Import aus `components/workspace/**`**, jede Page
   ruft ihren Auth-Guard selbst, DTOs nur aus `packages/common/src/contracts/portal/`, i18n nur aus
   `dictionaries/portal/<modul>`, noindex + `force-dynamic`, `portalPathFor` für Pfade, Negativtests Pflicht
4. `apps/workspace/src/server/portal/AGENTS.md` — kein Code mit `server/workspace/` teilen (nur über
   `server/shared/`), fail closed, fremde ID = 404, kein E-Mail-Abgleich, jede Query über `portalAccessCondition`,
   jede Mutation über `portalCanOn`
5. `apps/workspace/src/server/shared/AGENTS.md`, `apps/workspace/src/server/AGENTS.md`
6. `apps/workspace/src/components/workspace/crm/AGENTS.md` (Cockpit-Layout ab Task 50, Tasks-Regeln)
7. `packages/AGENTS.md`/`packages/common/AGENTS.md` (Const-Objekt-Pattern, Docstring je DTO-Feld),
   `packages/db/AGENTS.md`, `packages/db/src/record-configuration/crm/AGENTS.md`,
   `packages/db/src/record-configuration/auth/AGENTS.md`
8. `apps/workspace/src/hooks/AGENTS.md`, `apps/workspace/src/client/AGENTS.md`, `apps/workspace/src/common/AGENTS.md`

Skills bei der Umsetzung: **`impeccable`** (UI, am bestehenden Workspace-/Cockpit-Design ausrichten), **
`ui-ux-pro-max`** (Widget-/Raster-Details), **`copywriting`** (alle Texte DE/EN), `superpowers:test-driven-development`
für Server-Handler. MCP: `serena` für Symbol-Navigation/Refactoring, `webstorm` für Inspections, `context7` für
Next.js/Drizzle-Doku, Playwright-MCP für die manuelle Abnahme.

Kein Auto-Commit — der Owner reviewed und committet selbst.

## 2. Ausgangslage (verifiziert am 26.09.2026)

- `app/[locale]/(portal)/portal/[customerId]/page.tsx` ist Platzhalter (`<h1>{activeCompany?.displayName}</h1>`,
  Kommentar „Ordner 13 replaces this“, Tests `page.test.tsx`, `layout.test.tsx`).
- `…/[customerId]/layout.tsx` ruft `requirePortalActor(locale, customerId.toLowerCase())`, baut Nav über
  `listPermittedPortalNavItems(actor.permissions)` und rendert `PortalShell` + `CustomerSwitcher`.
- Portal-Server (`src/server/portal/`): `auth/portal-actor.ts` (`PortalActor`, `createPortalActor`),
  `auth/require-portal-actor.ts` (cache-dedupliziert, Unauthenticated → Redirect, NotMember → `notFound()`),
  `auth/with-portal-actor.ts` (401/404/503), `shared/portal-access-condition.ts`
  (`portalAccessCondition.forActor(actor, permission, { customerId })` → `eq` oder `sql\`FALSE\``),
`shared/portal-can-on.ts` (`portalCanOn.forActor (actor, permission, { customerId, projectId? })`).
- Einzige Portal-Permission: `portal.access` (`packages/common/src/constants/auth/permissions.ts`, Realm in
  `permission-definitions.ts`). `SystemRoleKey.PortalStandard` (id `7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04`) bekommt in
  `system-role-definitions.ts` automatisch `PORTAL_PERMISSION_VALUES`; die DB braucht die Migration.
- `packages/db/migrations/` endet bei `0038_create_portal_foundation.sql` → neue Migration voraussichtlich `0039_…`
  (**Nummer vor Anlage im Repo prüfen**). 0038 zeigt das Muster für Permission-Insert, `role_permissions`-Insert und
  das Neuschreiben von `security_events_type_check`.
- `tasks.ts`: `project_id` (kein `customer_id` → Join über `projects`), `status` open|in_progress|done|cancelled,
  `action_side` internal|customer, `visible_to_customer`, `due_on`, `completed_at`, `completed_by_member_id`;
  `TasksConstraintName.CompletionConsistencyCheck` verlangt heute bei `done` `completed_at` **und**
  `completed_by_member_id`.
- `projects.ts`: `status` planned|active|paused|completed|cancelled|archived, `process_steps text[]`,
  `current_process_step`, `preview_url`, `next_step_label`, `next_step_due_on`, `owner_member_id`,
  `included_feedback_rounds`; nie ins Portal: `budget_cents`, `hourly_rate_cents`.
- Owner-Anzeige: `customers.owner_member_id` / `projects.owner_member_id` → `workspace_members` → `users`
  (`display_name`, `primary_email` — Stammdaten, autorisiert nie).
- Owner-Erkennung: `WorkspaceActor` (`src/common/contracts/auth/workspace-actor.ts`) hat **kein** Owner-Flag. Owner =
  aktive Zuweisung der Systemrolle `SystemRoleKey.WorkspaceOwner` (Nutzung u. a. in
  `server/workspace/access/services/member-role-assignment-service.ts`,
  `server/workspace/auth/services/workspace-owner-invariant-service.ts`).
- Security-Events: `server/shared/services/security-event-service.ts` (`securityEventService.createSecurityEvent(tx,
…)`, append-only), Typen in `packages/common/src/constants/auth/security-event-types.ts` + DB-CHECK.
- Cockpit: kein eigene Route, Dialog auf `/crm?cockpit=<id>` (`CustomerCockpitDialog` → `CustomerCockpitView`), URL-
  Helfer `src/common/patterns/crm/customer-dialog-query.ts` (`buildCustomerCockpitHref`).
- Phasenleiste: inline in `components/workspace/crm/projects/project-overview/project-overview.tsx` (≈ Z. 91–147,
  `<ol className={styles.track}>`, `data-state` complete|current|upcoming, `aria-current="step"`, Check-Icon, Button
  nur mit `onEditAction`).
- Chat-Mock: `components/workspace/crm/detail/customer-chat-dock/customer-chat-dock.tsx`
  (`CustomerChatDock({ badgeLabel, className?, content })`, Rail-Button, `data-expanded`, `hidden`, Breakpoints 760 /
  1400 px). Texte: `i18n/dictionaries/workspace/crm/cockpit/{de,en}.json` → `chat.*`.
- Internes Dashboard-Raster: `components/workspace/dashboard/dashboard-grid/dashboard-grid.tsx` (lokales
  `DashboardModuleKey`, `MODULE_LAYOUT`, `data-{mobile,tablet,desktop}-span`, Breakpoints 768 / 1100 px).
- Fälligkeit: `src/lib/workspace/crm/task-due-state-service.ts` (`taskDueStateService`). Optimistik:
  `src/hooks/workspace/use-task-status-change.ts`. Initialen: `src/common/patterns/access/member-initials.ts`.
- `packages/ui/src/components/`: badge, button, checkbox-control, custom-select, data-table, detail, dialog (`Dialog`,
  `DialogSize`), empty-state, form, side-panel, skeleton, tab-list, table-row-actions, tree-view.
- API-Endpunkte: `src/common/constants/api-endpoints.ts` (`WorkspaceApiEndpoint`, enthält bereits
  `PortalInvitationRedeem`). Client-Services Portal: `src/client/portal/`.
- Portal-Dictionaries: `src/i18n/dictionaries/portal/index.ts` (meta, picker, shell, invitation).
- Seed: `packages/db/scripts/seed-crm-fixture.ts` (`db:seed:crm`).
- Keine DnD-Library, keine Layout-Persistenz.

## 3. Entscheidungen

| #       | Thema              | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1      | Unfertige Features | Mock-Widgets mit „Bald verfügbar“-Badge, **ohne Fantasiezahlen** (Skeleton-/Illustrationsinhalt). Zulässig wegen Rollout-Gate E20.                                                                                                                                                                                                                                                                          |
| E2      | Phasenleiste       | `processSteps`/`currentProcessStep` wie im CRM, 1:1 derselbe Stand. Extraktion nach `packages/ui`.                                                                                                                                                                                                                                                                                                          |
| E3      | Klickverhalten     | Wrapper-Widget mit `openMode`: `dialog` \| `expand` \| `dock` \| `none`; je Widget in der Registry.                                                                                                                                                                                                                                                                                                         |
| E4      | Geräte             | Mobil und Desktop gleichwertig; mobile-first, 12-Spalten-Raster.                                                                                                                                                                                                                                                                                                                                            |
| E5      | Aufgaben           | „Von Ihnen benötigt“ (`action_side = customer`, abhakbar mit `portal.tasks.complete`, projektübergreifend mit Projekt-Label). „Daran arbeiten wir“ (`action_side = internal AND visible_to_customer`, nur lesen, projektbezogen). Kein Bearbeitername, kein Status außer offen/erledigt.                                                                                                                    |
| E6/E22  | Ansprechpartner    | Kontakt-Widget: Kunden-Owner (Name, Initialen-Avatar, E-Mail als `mailto:`). Projekt-Widget zeigt Projekt-Owner als „Projektleitung“, nur wenn abweichend. Name + Mail bewusst portalöffentlich; keine Mitarbeiter-IDs, Rollen, Historie.                                                                                                                                                                   |
| E7      | Leistungen         | Gebuchte Projektleistungen **nicht** sichtbar. Mock-Widget „Leistung anfragen“ (Task 50/13a) — später nur Name/Beschreibung, nie Preis.                                                                                                                                                                                                                                                                     |
| E8      | Projekte           | Aktiv + pausiert im Projekt-Widget; mehrere → Tabs (`?project=<id>`); geplante mit Hinweis „startet bald“ als Tab; abgeschlossene im Widget „Abgeschlossene Projekte“ (expand, nur Titel, Abschluss-/Live-Link falls `preview_url`). Archiviert/abgebrochen nie.                                                                                                                                            |
| E9/E19  | Owner-Portalsicht  | Workspace-Owner öffnet **jedes** Kundenportal, auch produktiv. Lesen, öffnen, herunterladen — nicht schreiben. Deaktivierte Aktionen zeigen Hinweis + Link „Im CRM erledigen“ (`buildCustomerCockpitHref`). Banner „Portalansicht von <Firma>“. Security-Event je Aufruf. Einstieg: Button „Portal ansehen“ im Cockpit, nur für Owner. Kundenaufgaben erledigt der Owner im Cockpit (Mitarbeiter-Herkunft). |
| E10     | Chat               | `CustomerChatDock` → `packages/ui` `ChatDock` (Texte als Props); Cockpit + Portal nutzen ihn. Widget „Nachrichten“ (`openMode: dock`) öffnet den Dock. Mock bis Ordner 17/18.                                                                                                                                                                                                                               |
| E11/E17 | Stunden            | Widget nur bei laufendem Kontingent: verbraucht + übrig (`h:mm`); Dialog mit **allen** Buchungen. Mock bis Ordner 20.                                                                                                                                                                                                                                                                                       |
| E12/E16 | Dateien            | Reiter „Von Ihnen“ (eigene Uploads, Download, kein Löschen/Bearbeiten, Aktualisierung = neue Datei) und „Von uns“ (explizit freigegeben). Mock bis 15/15a.                                                                                                                                                                                                                                                  |
| E13     | Feedback           | Projektbezogen: übrige Runden, wer am Zug ist (Sie / wir), später „Feedback geben“ direkt aus dem Dashboard. Mock bis 16.                                                                                                                                                                                                                                                                                   |
| E14     | Onboarding         | Bogen-Fortschritt + Termin oben, volle Breite, prominent beim ersten Login; verschwindet nach Abschluss. Mock bis 15b/15c.                                                                                                                                                                                                                                                                                  |
| E15     | Renewals           | Intern, kein Widget.                                                                                                                                                                                                                                                                                                                                                                                        |
| E18     | Verschieben        | Nicht in diesem Ordner. Registry mit stabilen Keys, `order`, Spans → DnD später ohne Umbau. Schätzung: localStorage 1,5–2 T (~15–20 Dateien), DB je Portalmitgliedschaft 3–4 T (~35–45), freies Raster 5+ T.                                                                                                                                                                                                |
| E20     | Rollout-Gate       | Kein Feature-Flag. Kunden werden erst nach dem letzten kundensichtbaren Feature-Ordner eingeladen.                                                                                                                                                                                                                                                                                                          |
| E21     | Schnitt            | Ein PR.                                                                                                                                                                                                                                                                                                                                                                                                     |
| E23     | Neuigkeiten        | Kein Feed; folgt mit Benachrichtigungen (20c).                                                                                                                                                                                                                                                                                                                                                              |
| E24     | Kopf               | Kein Begrüßungsblock, keine Chips. „Hallo <Vorname>“ dezent im `PortalShell`-Header (Vorname der Person der Mitgliedschaft; fehlt er → nichts). H1 visuell versteckt: „Übersicht – <Firma>“.                                                                                                                                                                                                                |

## 4. Zielbild

### 4.1 Raster (Desktop ≥ 1100 px, 12 Spalten; Tablet ≥ 768 px; mobil alles 12 in dieser Reihenfolge)

```txt
[Banner nur in Owner-Sicht: „Portalansicht von Kanzlei Müller · Nur ansehen“]
┌ onboarding (12) — nur solange offen ─────────────────────────────────────────┐
┌ project (12) [Relaunch | Shop (startet bald)] ───────────────────────────────┐
│ ✓ Onboarding ─ ✓ Design ─ ◉ Entwicklung ─ ○ Feedback ─ ○ Launch              │
│ Nächster Schritt: Erste Website-Version · 16.10.2026   [Vorschau öffnen ↗]   │
│ Projektleitung: Anna Beispiel (nur wenn ≠ Kunden-Owner)                      │
┌ customerTasks (6) ───────────────┐┌ ourTasks (6) ─────────────────────────┐
│ Von Ihnen benötigt (3)           ││ Daran arbeiten wir (2)                │
│ ☐ Kanzleifotos · Relaunch · 12.10││ • Startseite umsetzen                 │
│ ☐ Texte Arbeitsrecht             ││ • Kontaktformular                     │
│                 Alle ansehen ↗   ││                     Mehr anzeigen ⌄   │
┌ feedback (4) ┐┌ hours (4) ─────┐┌ contact (4) ───────┐
┌ messages (4) ┐┌ files (4) ─────┐┌ serviceRequest (4) ┐
┌ completedProjects (12) — nur wenn vorhanden, expand ────────────────────────┐
                                                             ▌ChatDock (rechts, mobil unten)
```

Tablet-Spans: `onboarding`, `project`, `completedProjects` 12; alle anderen 6. Mobil: alle 12.

### 4.2 Widget-Registry

| Key                 | order | Desktop | openMode | Scope    | Permission (Lesen)       | Datenstand in Ordner 13 | Ersetzt durch |
| ------------------- | ----- | ------- | -------- | -------- | ------------------------ | ----------------------- | ------------- |
| `onboarding`        | 10    | 12      | dialog   | customer | — (Mock ohne Permission) | Mock                    | 15b/15c       |
| `project`           | 20    | 12      | none     | project  | `portal.projects.read`   | echt                    | —             |
| `customerTasks`     | 30    | 6       | dialog   | customer | `portal.tasks.read`      | echt                    | —             |
| `ourTasks`          | 40    | 6       | expand   | project  | `portal.tasks.read`      | echt                    | —             |
| `feedback`          | 50    | 4       | dialog   | project  | — (Mock)                 | Mock                    | 16            |
| `hours`             | 60    | 4       | dialog   | customer | — (Mock)                 | Mock                    | 20            |
| `contact`           | 70    | 4       | none     | customer | `portal.access`          | echt                    | —             |
| `messages`          | 80    | 4       | dock     | customer | — (Mock)                 | Mock                    | 17/18         |
| `files`             | 90    | 4       | dialog   | customer | — (Mock)                 | Mock                    | 15/15a        |
| `serviceRequest`    | 100   | 4       | dialog   | customer | — (Mock)                 | Mock                    | 13a           |
| `completedProjects` | 110   | 12      | expand   | customer | `portal.projects.read`   | echt                    | —             |

Regeln:

- Mock-Einträge tragen `mock: true` in der Registry; der Folge-Ordner setzt `mock: false` + `requiredPermission`
  (seine eigene Portal-Permission) und liefert Daten. `requiredPermission` ist für Nicht-Mocks Pflicht (Typ erzwingt
  es über eine diskriminierte Union `{ mock: true } | { mock: false; requiredPermission: Permission }`).
- Ein Widget rendert nicht, wenn die Permission fehlt **oder** der Datenteil leer ist und das Widget als
  „nur mit Inhalt“ markiert ist (`completedProjects`, später `hours`, `onboarding` nach Abschluss).
- `customerTasks` rendert auch leer — mit bestätigender Meldung („Alles erledigt …“), weil das eine gute Nachricht ist.
- `order` in Zehnerschritten (Einfügen ohne Umnummerieren; Basis für DnD E18).

### 4.3 Öffnen/Zustände

- `dialog`: Klick auf den Widget-Kopf-Button („Alle ansehen“ / „Öffnen“) setzt `?widget=<key>`; der Dialog (`Dialog` aus
  `@invessiv/ui`, `DialogSize.Wide`, mobil vollflächig über bestehendes Dialog-Verhalten) liest den
  Parameter; Schließen entfernt ihn per `router.replace`. Back-Button schließt.
- `expand`: lokaler Zustand; Widget wechselt `data-expanded="true"` und spannt auf 12 Spalten; `aria-expanded` am
  Trigger.
- `dock`: Trigger öffnet den `ChatDock` (gemeinsamer Client-Zustand über einen kleinen Context im
  `PortalDashboard`, kein globaler Store).
- `none`: kein Öffnen-Trigger.
- **Kein Karten-weiter Klick-Overlay**, wenn das Widget interaktive Inhalte hat (Checkboxen, Links) — sonst
  verschachtelte interaktive Elemente. Die Öffnen-Aktion ist immer ein expliziter Button im Kopf/Fuß; Widgets ohne
  interaktiven Inhalt dürfen zusätzlich per „stretched link“-Pseudo-Element vollflächig klickbar sein (Prop
  `wholeCardClickable`).
- Projekt-Auswahl: `?project=<id>`; ungültige/fremde ID → erstes Projekt (kein Fehler, keine Existenzbestätigung).

## 5. Architektur

### 5.1 Wiederverwendung — verschieben statt kopieren

| Baustein       | Von                                                   | Nach                                                                             | Hinweise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raster         | `components/workspace/dashboard/dashboard-grid/`      | `packages/ui/src/components/widget-grid/widget-grid.tsx` (+ `.module.css`, Test) | Generisch: `WidgetGrid<Key>({ layout, slots, className? })`. Das interne `MODULE_LAYOUT` + `DashboardModuleKey` wandern nach `apps/workspace/src/common/constants/dashboard/dashboard-widget-layout.ts` bzw. `dashboard-module-keys.ts`. `DashboardGrid` wird zum dünnen Wrapper oder durch `WidgetGrid` ersetzt (bevorzugt ersetzen, Aufrufer anpassen). Sonderregel `acquisitionVolume` (max 330 px) bleibt im internen Dashboard (co-located CSS am Modul), nicht im generischen Raster. |
| Wrapper-Widget | neu                                                   | `packages/ui/src/components/widget/widget.tsx` (+ `.module.css`, Test)           | Siehe 5.2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Phasenleiste   | inline in `project-overview.tsx`                      | `packages/ui/src/components/process-track/process-track.tsx` (+ CSS, Test)       | Props: `steps: readonly string[]`, `currentIndex`, `label` (aria), `renderSummary?`/`summary` (Text „Schritt 3 von 5“ kommt formatiert vom Aufrufer), `onStepAction?(step, index)`, `scrollCurrentIntoView?`. Ohne `onStepAction` rein darstellend. `ProjectOverview` nutzt sie danach; Verhalten und Optik unverändert.                                                                                                                                                                    |
| Chat-Dock      | `components/workspace/crm/detail/customer-chat-dock/` | `packages/ui/src/components/chat-dock/chat-dock.tsx` (+ CSS, Test)               | Props: `content` (typisierte Text-Shape aus `packages/common/src/contracts/ui/chat-dock-content.ts`), `badgeLabel?`, `expanded?`/`onExpandedChange?` (kontrollierbar, damit das `messages`-Widget ihn öffnen kann), `children?` (Thread-Slot; ohne children Mock-Skeleton), `className?`. Cockpit-Aufruf auf `ChatDock` umstellen, alte Datei löschen.                                                                                                                                      |
| Fälligkeit     | `src/lib/workspace/crm/task-due-state-service.ts`     | `apps/workspace/src/common/patterns/tasks/task-due-state.ts`                     | Reine Funktion(en), seiteneffektfrei → `common/patterns`. Alle Importe umstellen (serena `find_referencing_symbols`). Tests mitziehen. Prüfen, ob Konstanten (Due-State-Werte) schon in `common/constants` liegen.                                                                                                                                                                                                                                                                          |
| Optimistik     | `src/hooks/workspace/use-task-status-change.ts`       | neuer `src/hooks/use-optimistic-change.ts`                                       | Generisch: `useOptimisticChange<TValue>({ submit, announce })` mit `valueOf`, `change`, `isPending`, `announcement`; Versions-Basis wie heute (`baseVersion`). `useTaskStatusChange` wird darauf umgebaut (Verhalten gleich, Tests grün), `usePortalTaskCompletion` (`src/hooks/portal/`) ebenso. Rückgabe-/Options-Typen nach `src/common/contracts/hooks/…` (Hook-AGENTS).                                                                                                                |
| Initialen      | `src/common/patterns/access/member-initials.ts`       | bleibt                                                                           | Wird im Kontakt-Widget genutzt.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Geteilte Typen/Konstanten:

- `packages/common/src/constants/ui/widget-open-modes.ts` — `WidgetOpenMode = { Dialog, Expand, Dock, None }` +
  Typ.
- `packages/common/src/constants/ui/widget-column-spans.ts` — `WidgetColumnSpan` (4 | 6 | 8 | 12 als Const-Objekt).
- `packages/common/src/contracts/ui/widget-layout.ts` — `WidgetResponsiveSpan`, `WidgetLayoutEntry<Key>` (`key`,
  `order`, `span`).
- `packages/common/src/contracts/ui/chat-dock-content.ts`, `…/widget-content.ts` (Texte des Widget-Rahmens: Mock-
  Badge, Öffnen, Schließen, Mehr/Weniger).

`CollapsibleSection`, `SectionCollapseToggle`, `MockSectionCard` bleiben im CRM (Portal braucht sie nicht — YAGNI).

### 5.2 `Widget` (packages/ui)

```ts
type WidgetProps = {
  title: string;
  icon?: IconDefinition;
  count?: number; // shown as a quiet counter next to the title
  meta?: ReactNode; // e.g. project label, due hint
  mock?: { badgeLabel: string }; // renders badge + data-mock="true", body stays illustrative
  openMode: WidgetOpenMode;
  openLabel?: string; // required for dialog/dock/expand (type-level via union)
  onOpenAction?: () => void; // dialog → set URL param, dock → open dock
  expanded?: boolean; // expand mode, controlled or uncontrolled
  onExpandedChange?: (next: boolean) => void;
  wholeCardClickable?: boolean;
  footer?: ReactNode;
  children: ReactNode; // summary body
  headingLevel?: 2 | 3;
  className?: string;
};
```

- Semantik: `<section aria-labelledby>` mit echter Überschrift (Default `h2`), Öffnen-Button mit
  `aria-haspopup="dialog"` (dialog) bzw. `aria-expanded` + `aria-controls` (expand/dock).
- Zustände nur über `data-*` (`data-open-mode`, `data-expanded`, `data-mock`), Farben nur über Tokens aus
  `apps/workspace/src/app/globals.css` (`--color-surface-1/2`, `--color-border`, `--color-text-muted`, `--color-cta`
  …). Sichtbarer Fokus. `prefers-reduced-motion` respektieren.
- Keine Texte im Baustein — alles über Props.

### 5.3 Portal-Registry (apps/workspace)

- `src/common/constants/portal/portal-widget-keys.ts` — `PortalWidgetKey` Const-Objekt (11 Keys aus 4.2).
- `src/common/constants/portal/portal-widget-scopes.ts` — `PortalWidgetScope = { Customer, Project }`.
- `src/common/contracts/portal/portal-widget-definition.ts` — Typ der Registry-Zeile (erweitert
  `WidgetLayoutEntry<PortalWidgetKey>` um `openMode`, `scope`, Mock/Permission-Union, `onlyWithContent`).
- `src/common/constants/portal/portal-widget-layout.ts` — `PORTAL_WIDGET_LAYOUT` (readonly, nach `order` sortiert;
  Test prüft Eindeutigkeit von Key/Order und Pflicht-Permission für Nicht-Mocks).
- `src/common/patterns/portal/list-visible-portal-widgets.ts` — reine Funktion `(layout, permissions, contentFlags) →
entries` (analog `list-permitted-portal-nav-items.ts`), getestet.
- `src/common/patterns/portal/portal-dashboard-query.ts` — `readPortalDashboardWidget(searchParams)`,
  `readPortalDashboardProject(searchParams)`, `buildPortalDashboardHref(…)`, Konstante
  `PortalDashboardQueryParam = { Widget: "widget", Project: "project" }` in
  `src/common/constants/portal/portal-dashboard-query-params.ts`. Analog `customer-dialog-query.ts`.

### 5.4 Server

#### Migration `packages/db/migrations/00NN_add_portal_dashboard.sql` (Nummer prüfen; additiv, idempotent,

`--> statement-breakpoint`)

1. Permissions (`INSERT … ON CONFLICT (key) DO NOTHING`, Realm `portal`, `delegable TRUE`, `scope_assignable FALSE`):
   `portal.projects.read` („See released project status, steps and next step.“), `portal.tasks.read`,
   `portal.tasks.complete`.
2. `role_permissions` für `portal_standard` (`7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04`) nach 0038-Muster. Eigene
   Portalrollen bekommen sie **nicht** automatisch.
3. `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by_portal_membership_id uuid REFERENCES
portal_memberships(id)` (ON DELETE-Verhalten wie `completed_by_member_id`; prüfen) + Index nur, falls gelesen wird
   (CRM-Anzeige liest pro Zeile ohnehin mit → kein Index nötig; bewusst dokumentieren).
4. `CompletionConsistencyCheck` ersetzen (DROP IF EXISTS / ADD): `(status = 'done') = (completed_at IS NOT NULL AND
num_nonnulls(completed_by_member_id, completed_by_portal_membership_id) = 1)` — genau eine Herkunft.
   Vorher prüfen, dass bestehende Zeilen die neue Bedingung erfüllen (tun sie: bisher immer Member).
   Zusätzlich: Portal-Herkunft nur bei `action_side = 'customer'` (eigener CHECK
   `tasks_portal_completion_customer_side_check`).
5. `security_events_type_check` um `portal_owner_view_opened` erweitern (vollständige Liste neu schreiben wie 0038).

Drizzle deckungsgleich: `packages/db/src/record-configuration/crm/tasks.ts` (+ Spalte, + Constraint-Namen in
`TasksConstraintName` / zugehörigen Constants), Barrel prüfen. `permissions.ts`: `PortalProjectsRead`,
`PortalTasksRead`, `PortalTasksComplete`; `permission-definitions.ts` (Realm Portal, Beschreibung); Tests
`permissions.test.ts`, `system-role-definitions.test.ts` anpassen. `security-event-types.ts`: `PortalOwnerViewOpened`

- `SECURITY_EVENT_TYPE_VALUES` + Test. Katalog-Check/`db:smoke:rbac` grün.

Seed `packages/db/scripts/seed-crm-fixture.ts`: je Beispielkunde mit Portalmitgliedschaft mind. 3 kundensichtbare
Kundenaufgaben (eine überfällig, eine erledigt über Portal-Herkunft), 2 sichtbare Wir-Aufgaben, 1 unsichtbare interne
Aufgabe (Negativfall), ein pausiertes, ein geplantes, ein abgeschlossenes Projekt; Projekt-Owner ≠ Kunden-Owner bei
einem Projekt. Weiterhin optional aufrufbar.

#### Lesekontext `PortalReader` (`src/server/portal/auth/`)

- `portal-owner-view.ts` — gebrandeter Typ `PortalOwnerView extends PermissionHolder` (`userId`, `customerId`,
  `permissions` = alle Portal- **Lese**-Permissions aus `PERMISSION_DEFINITIONS` mit Realm Portal ohne
  schreibende; Liste als Konstante `PORTAL_READ_PERMISSION_VALUES` in `packages/common/src/constants/auth/`).
  Konstruktor `createPortalOwnerView` nur im Resolver.
- `portal-reader.ts` — `type PortalReader = PortalActor | PortalOwnerView`; Type-Guard `isPortalOwnerView`.
- `resolve-portal-owner-view.ts` — prüft: Clerk-Session → `users`-Zeile → aktives `workspace_members` mit aktiver
  Systemrolle `workspace_owner` → Kunde existiert (nicht gelöscht; archiviert erlaubt? → **ja, lesend**, Owner soll
  prüfen können). Owner-Lookup als Service in `src/server/shared/services/workspace-owner-lookup-service.ts`
  (portal + workspace dürfen ihn nutzen, AGENTS `server/shared`). Fail closed: jeder DB-/Auth-Fehler → Unavailable
  (503-Seite), nie Zugriff. Schreibt pro Aufruf Security-Event `PortalOwnerViewOpened` (subject = Kunde, metadata ohne
  PII) — Dedupe innerhalb eines Renders über `cache()`.
- `require-portal-reader.ts` — `requirePortalReader(locale, customerId)`: zuerst Portal-Mitgliedschaft
  (`authenticatePortalRequest`); `NotMember` → Owner-Versuch; sonst `notFound()`. Unauthenticated → Sign-in-Redirect
  wie heute. Owner mit eigener Portal-Mitgliedschaft beim selben Kunden → Actor (echte Kundensicht).
- `…/[customerId]/layout.tsx` + `page.tsx` auf `requirePortalReader` umstellen; Nav/Switcher für Owner-Sicht:
  Switcher ausblenden (Owner hat keine Mitgliedschaften), stattdessen Banner.
- `withPortalActor` bleibt unverändert für **alle Schreibrouten** → Owner-Sicht kann typseitig nicht schreiben.
- `portal-access-condition.ts` + `portal-can-on.ts`: um `forReader(reader, permission, …)` ergänzen, die für
  `PortalOwnerView` dieselbe Firmenbindung (`eq(customerId, reader.customerId)`) und Permission-Prüfung macht.
  `forActor` bleibt. Tests für beide Pfade.
- AGENTS-Präzisierung (in diesem PR): `src/server/portal/AGENTS.md` + `(portal)/AGENTS.md` — „Lese-Handler nehmen
  `PortalReader`; die Owner-Sicht ist ein Portal-Konstrukt, kein Workspace-Handler; Schreib-Handler nehmen nur
  `PortalActor`“. Das ersetzt die frühere T2a-Vorschau-Idee (Vorschau = Owner-Sicht).

#### Query `src/server/portal/query-handler/get-portal-dashboard.query-handler.ts`

- Signatur `getPortalDashboard(reader: PortalReader, today: string): Promise<PortalDashboardDto>` — keine
  `customerId` als Parameter.
- Lädt (max. 4 Queries, keine N+1):
  1. Kunde (`display_name`) + Kunden-Owner (`users.display_name`, `users.primary_email`) — Join, gefiltert über
     `portalAccessCondition.forReader(reader, PortalAccess, …)`.
  2. Projekte des Kunden mit `status IN (planned, active, paused, completed)` + Projekt-Owner-Name/Mail (Left Join),
     sortiert: aktiv/pausiert nach `created_at desc`, dann geplant, abgeschlossene separat — nur mit
     `portal.projects.read`, sonst `[]`.
  3. Aufgaben über Join `tasks → projects` mit `projects.customer_id` gefiltert,
     `visible_to_customer = true`, `status <> 'cancelled'`, Projektstatus nicht archiviert/abgebrochen — nur mit
     `portal.tasks.read`. Aufteilung nach `action_side` im Mapping. Erledigte Kundenaufgaben: nur die letzten 20
     (Limit dokumentieren).
- Mapping `src/server/portal/services/portal-dashboard-mapping-service.ts` (getestet): Rows → DTO, Due-State über
  `common/patterns/tasks/task-due-state.ts`, `projectOwner` nur wenn ≠ Kunden-Owner.
- DTO `packages/common/src/contracts/portal/portal-dashboard.dto.ts` (+ `rows/` falls Row-Typen nötig), Docstring **je
  Feld**:
  - `customer: { displayName }`, `contact: { displayName, email } | null`, `greetingName: string | null`
  - `projects: PortalProjectDto[]` (`id`, `title`, `status`, `processSteps`, `currentProcessStep`,
    `nextStep: { label, dueOn } | null`, `previewUrl: string | null`, `projectLead: { displayName } | null`)
  - `completedProjects: { id, title, completedOn?, previewUrl }[]`
  - `customerTasks: PortalTaskDto[]` (`id`, `projectId`, `projectTitle`, `title`, `description?`, `dueOn`,
    `dueState`, `done`, `completedAt`, `version`)
  - `ourTasks: PortalTaskDto[]` (ohne `version`, nicht abhakbar)
  - `capabilities: { canCompleteTasks: boolean; isOwnerView: boolean }`
  - **Nie**: `budget*`, `hourlyRate*`, Preise, Leistungen, `ownerMemberId`, `assigneeMemberId`, interne Notizen,
    `billing_model`, `workflow_key`.

#### Command `complete-customer-task`

- `src/server/portal/command-handler/complete-customer-task.command-handler.ts` —
  `completeCustomerTask(actor: PortalActor, taskId: string): Promise<Result>`; Result-Union
  `{ ok: true; alreadyDone: boolean } | { ok: false; code: PortalTaskErrorCode.NotFound }`.
- Ablauf in einer Transaktion: `UPDATE tasks SET status='done', completed_at=now(), completed_by_portal_membership_id=
actor.membershipId, version=version+1 FROM projects WHERE tasks.id=$1 AND tasks.project_id=projects.id AND
projects.customer_id=actor.customerId AND tasks.action_side='customer' AND tasks.visible_to_customer AND
tasks.status IN ('open','in_progress') RETURNING …` — atomar, kein SELECT-dann-UPDATE (Muster wie
  `updateVersioned`, aber versionsfrei, weil Abhaken idempotent ist; Abweichung im Code-Kommentar begründen).
  0 Zeilen → zweite Lesequery unterscheidet „bereits erledigt & sichtbar & eigene Firma“ (→ `ok, alreadyDone`) von
  allem anderen (→ `NotFound`). `portalCanOn.forActor(actor, PortalTasksComplete, { customerId, projectId })` vor dem
  Update (Projekt-ID aus der Lesequery). Activity (`ActorType.Customer`, Typ „task completed“) in derselben
  Transaktion; keine PII in Metadata.
- Error-Codes `packages/common/src/constants/portal/portal-task-error-codes.ts` (Const-Objekt), Message-Map nur im
  Route-File (nicht exportiert).
- Route `src/app/api/portal/[customerId]/tasks/[taskId]/complete/route.ts` — `POST`, `withPortalActor(customerId,
…)`, UUID-Validierung (zod), Statuscodes über `HttpResponseCode`; jeder Fehlschlag 404.
- Endpunkt-Konstante: `WorkspaceApiEndpoint` enthält schon Portal-Einträge → Helfer
  `portalTaskCompletePath(customerId, taskId)` in `src/common/patterns/portal/portal-api-paths.ts` auf Basis einer
  neuen Konstante `PortalApiEndpoint.Base = "/api/portal"` (prüfen, ob eine Trennung `PortalApiEndpoint` sinnvoller
  ist; keine URL-Literale im Client).
- Client `src/client/portal/portal-tasks-api-service.ts` — `completeTask(customerId, taskId)` → Result, Muster wie
  `portal-invitation-api-service.ts`.
- Hook `src/hooks/portal/use-portal-task-completion.ts` auf `useOptimisticChange`.

#### CRM-Anpassungen

- Task-DTO (`packages/common/src/contracts/crm/task.dto.ts`) um `completedByCustomer: boolean` ergänzen (kein
  Portal-ID-Leak ins CRM nötig); Mapping im CRM-Task-Service; `task-row-details` zeigt „vom Kunden erledigt“ (Dictionary
  `workspace/crm/tasks`). Tests.
- Interne Statusänderung (`changeTaskStatus`) von `done` weg setzt beide Herkunftsspalten auf `NULL`; auf `done` setzt
  sie `completed_by_member_id` und leert die Portalspalte — CHECK-konform. Test ergänzen.
- Cockpit: Button „Portal ansehen“ (`ButtonLink`, öffnet `portalPathFor(locale, customerId)` im neuen Tab) im Kopf der
  `CustomerCockpitView`, nur wenn der Server `canOpenPortalView` (Owner) liefert. Owner-Prüfung serverseitig in
  `crm/page.tsx` über `workspaceOwnerLookupService`. Dictionary `workspace/crm/cockpit`.

### 5.5 UI (`src/components/portal/`)

```txt
components/portal/
  AGENTS.md                                 neu: Regeln Portal-UI (Widgets, Mock, kein workspace-Import, Tokens)
  CLAUDE.md                                 @AGENTS.md
  dashboard/
    portal-dashboard/                       "use client"-Orchestrierung: Registry → WidgetGrid, Dock-Context, Dialog-Host
    portal-owner-banner/                    Banner Owner-Sicht (server)
    portal-widget-dialog-host/              liest ?widget, rendert passenden Dialog-Inhalt
    widgets/
      portal-onboarding-widget/             Mock
      portal-project-widget/                Tabs (TabList aus @invessiv/ui), ProcessTrack, nächster Schritt, Preview-Link
      portal-customer-tasks-widget/         Summary (max 3 offene) + Dialog-Inhalt (alle, „Erledigt (N)“ eingeklappt)
      portal-our-tasks-widget/              Summary + Expand-Liste
      portal-feedback-widget/               Mock
      portal-hours-widget/                  Mock
      portal-contact-widget/                Initialen-Avatar, Name, mailto
      portal-messages-widget/               Mock, öffnet Dock
      portal-files-widget/                  Mock mit Reitern (TabList)
      portal-service-request-widget/        Mock
      portal-completed-projects-widget/     Expand-Liste
    portal-task-checkbox/                   Checkbox ≥ 44×44 px, optimistisch, Live-Region, Owner-Hinweis bei disabled
    portal-dashboard-empty-state/           Kunde ohne Projekt: freundlich + Kontakt (EmptyState aus @invessiv/ui)
```

- Jede Komponente co-located `*.module.css`; keine Inline-Styles; `*Props` dürfen exportiert werden, sonst keine
  Typ-/Konstanten-Exporte.
- Summary-Teil und Dialog-Teil je Widget als getrennte Dateien, wenn der Dialog > ~40 Zeilen wird.
- Server/Client-Schnitt: `page.tsx` (Server) lädt DTO + Dictionary und übergibt serialisierbare Props;
  interaktive Widgets (Checkbox, Tabs, Expand, Dock) sind Client-Komponenten, rein darstellende (Kontakt, Mock-Inhalte)
  Server-tauglich.
- Owner-Sicht: `capabilities.isOwnerView` → Checkboxen `disabled` + Tooltip-/Hinweistext „Als Owner im CRM erledigen“
  mit Link `buildCustomerCockpitHref` (Pfad über `SITE_ROUTES`/`createLocalePathname`-Konventionen der App prüfen).
- `PortalShell`: neuer optionaler Prop `greeting?: string | null` im Header (dezent). Nav bleibt (heute leer).
- Seite `…/[customerId]/page.tsx`: `requirePortalReader` → `getPortalDashboard` → `getPortalDashboardDictionary` →
  `<h1 className="sr-only…">` (globale Utility prüfen, sonst Modul-CSS) + `<PortalDashboard …/>`; `loading.tsx` mit
  `Skeleton`-Kacheln im gleichen Raster. `generateMetadata` noindex wie bisher (Titel „Übersicht | Invessiv“ o. ä. —
  Title-Konvention Root-AGENTS).
- Dictionaries: `src/i18n/dictionaries/portal/dashboard/{de,en}.json` + Getter in `portal/index.ts`
  (`getPortalDashboardDictionary`). Namespaces: `meta`, `page`, `widgets.<key>.{title,open,empty,…}`, `mock`,
  `tasks.announce.*`, `ownerView.*`, `chat.*`. Chat-Texte des Cockpits bleiben im Cockpit-Dictionary; beide erfüllen
  `ChatDockContent`. Anrede „Sie“, freundlich, ohne Fachjargon („Bringschuld“ nie im UI).
- Datumsformat über Locale (`Intl.DateTimeFormat` mit `Record<Locale,…>`-Konstante, falls nicht vorhanden unter
  `packages/common/src/constants/i18n/`). Überfällig: sichtbar, aber ohne Drohton.

## 6. Umsetzungsschritte (Reihenfolge = Commit-/Review-Reihenfolge)

Jeder Schritt endet mit grünem `pnpm --filter @invessiv/workspace typecheck` + betroffenen Tests.

Modell-Empfehlung in Klammern hinter jedem Schritt: Claude bei Security-kritischen Pfaden und UI (Skills `impeccable`,
`ui-ux-pro-max`, `copywriting` sowie serena/webstorm/Playwright-MCP sind in Claude Code eingerichtet), GPT bei
klar spezifizierter, mechanischer oder SQL-lastiger Arbeit. Einschätzung nach Aufgabenart, nicht nach Benchmarks.

### S0 — Doku (nur Plan-/Regeldateien) (Claude · Opus 5.5 — erledigt)

- [x] README `13-portal-dashboard/README.md`: Status „läuft“, Inhalte/Merge-Gate an E1–E24 anpassen (Owner-Sicht,
      Mock-Widgets, Rollout-Gate E20, Widget-Registry, beide Aufgabenseiten, Ansprechpartner).
- [x] `00-entscheidungen.md`: Statuszeile 13 → „läuft“; neue Entscheidungen: Owner-Portalsicht (nur lesen, Security-
      Event), Mock-Widgets + organisatorisches Rollout-Gate, Owner-Name/Mail portalöffentlich, alle Stundenbuchungen
      sichtbar (ohne Schalter), Renewals intern, Widget-Registry als einziger Einhängepunkt für Portal-Karten.
- [x] Folge-READMEs je ein Merge-Gate „Portal-Widget `<key>` von Mock auf echte Daten umgestellt (Registry
      `mock: false` + Permission)“ plus 2–3 Zeilen Widget-Beschreibung aus E-Tabelle:
      `13a` (`serviceRequest`, ohne Preis), `15` (`files` Reiter „Von uns“), `15a` (`files` Reiter „Von Ihnen“,
      Medien), `15b`/`15c` (`onboarding`, verschwindet nach Abschluss), `16` (`feedback` inkl. „wer ist am Zug“ und
      Einreichen aus dem Dashboard), `18` (`messages` + `ChatDock` mit echtem Thread), `20` (`hours`, nur mit
      Kontingent, alle Buchungen).
- [x] Widersprüche bereinigen: `20-stunden-und-history/27-stundenbuchungen.md` (Schalter je Buchung entfernen),
      Karten-Zusagen in 13a/15/15a auf Registry-Widget vereinheitlichen.
- [x] `apps/workspace/deleteable/planregeln-fuer-plan-skill.md` existiert bereits (nicht committen, temporär).

### S1 — Extraktion geteilter Bausteine (keine Verhaltensänderung) (GPT · GPT-6 Sol — erledigt)

- [x] `packages/common`: `widget-open-modes.ts`, `widget-column-spans.ts`, `contracts/ui/widget-layout.ts`,
      `contracts/ui/chat-dock-content.ts` (+ Exports in Package-`exports`, falls nötig).
- [x] `WidgetGrid` nach `packages/ui` (Test: Slots ohne Inhalt fallen weg, `data-*-span` gesetzt); internes Dashboard
      (`app/[locale]/(app)/dashboard/page.tsx` und Module) auf `WidgetGrid` + ausgelagertes Layout umstellen;
      `dashboard-grid/` löschen; bestehende Dashboard-Tests grün.
- [x] `ProcessTrack` nach `packages/ui`; `ProjectOverview` umstellen; Scroll-in-View des aktuellen Schritts erhalten;
      CRM-Tests grün, visuell unverändert (Screenshot vorher/nachher).
- [x] `ChatDock` nach `packages/ui`; Cockpit umstellen; alte Komponente + CSS löschen.
- [x] `task-due-state` nach `common/patterns/tasks/`; Importe umstellen; alte Datei löschen.
- [x] `useOptimisticChange` + `useTaskStatusChange` darauf umbauen; Tests grün.
- [x] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` grün.

### S2 — `Widget` in packages/ui (Claude · Opus 5.5 — erledigt)

- [x] Komponente + CSS + Tests: je `openMode` richtige ARIA, Mock-Badge + `data-mock`, `wholeCardClickable` nur ohne
      interaktive Kinder (Doku im Docstring), Tastatur (Enter/Space), Fokus sichtbar, Expand toggelt `data-expanded`.
- [x] Export in `packages/ui/src/index.ts`.
- Umsetzungshinweise: Props als diskriminierte Union je `openMode` (Dialog/Dock verlangen `openLabel` +
  `onOpenAction`, Dock zusätzlich `controlsId` + `expanded`, Expand `openLabel`/`closeLabel` + `expandedContent`);
  Callbacks heißen `…Action` (Next-Client-Prop-Regel). `WidgetGrid` spannt Slots mit `data-expanded="true"` per
  `:has()` auf 12 Spalten. `contracts/ui/widget-content.ts` bewusst nicht angelegt — Texte laufen als einzelne Props;
  erst anlegen, wenn S7 eine gemeinsame Text-Shape braucht.

### S3 — Migration, Permissions, Seed (GPT · GPT-6 Astra)

- [ ] Migrationsnummer ermitteln; SQL wie 5.4; zweimal laufen lassen (idempotent).
- [ ] Drizzle-Modell `tasks.ts` + Constraint-Namen; `permissions.ts`, `permission-definitions.ts`,
      `PORTAL_READ_PERMISSION_VALUES`, `security-event-types.ts`; Tests.
- [ ] Seed erweitern (5.4); `db:seed:crm` läuft.
- [ ] DB-Smokes (`db:smoke:rbac`, Katalog-Check) grün; negativer DB-Test: Done ohne/mit zwei Herkünften scheitert.

### S4 — PortalReader / Owner-Sicht (Claude · Opus 5.5)

- [ ] `workspace-owner-lookup-service.ts` (server/shared) + Test (aktiv/inaktiv/ohne Rolle/DB-Fehler → fail closed).
- [ ] `PortalOwnerView`, `PortalReader`, `resolve-portal-owner-view.ts`, `require-portal-reader.ts` + Tests:
      Mitglied → Actor; Owner ohne Mitgliedschaft → OwnerView + Security-Event; Nicht-Owner-Workspace-Mitglied → 404;
      nicht angemeldet → Redirect; fremde/nicht existente customerId → 404; DB-Fehler → Unavailable.
- [ ] `portalAccessCondition.forReader`, `portalCanOn.forReader` + Tests.
- [ ] Layout/Page umstellen; `layout.test.tsx`/`page.test.tsx` anpassen; Banner-Komponente.
- [ ] AGENTS-Präzisierungen (server/portal, (portal)).

### S5 — Dashboard-Query (GPT · GPT-6 Astra)

- [ ] DTO (Docstrings), Query-Handler, Mapping-Service; Tests (Integration gegen Test-DB, Muster der bestehenden
      Portal-Handler-Tests):
      interne/unsichtbare Aufgaben nie; fremde Firma nie (Person mit zweiter Mitgliedschaft); ohne
      `portal.tasks.read` keine Aufgaben; ohne `portal.projects.read` keine Projekte; archiviert/abgebrochen fehlen;
      Kunde ohne Projekt → leeres, gültiges DTO; Owner-Sicht liefert identisches DTO wie Vollrechte-Mitglied (außer
      `capabilities`); Anzahl Queries ≤ 4 bei 3 Projekten; DTO-Schlüssel-Snapshot ohne Finanz-/Notiz-/ID-Felder.

### S6 — Abhaken (Claude · Opus 5.5)

- [ ] Error-Codes, Command-Handler, Route, Client-Service, Hook; CRM-Vermerk + Statuswechsel-Anpassung.
- [ ] Tests: fremde Firma → 404; interne Aufgabe derselben Firma → 404; unsichtbare → 404; ohne
      `portal.tasks.complete` → 404; widerrufene Mitgliedschaft → 404; Doppelklick/Retry → genau ein Abschluss
      (`alreadyDone`); Activity geschrieben; Owner-Sicht hat keinen Schreibweg (Route verlangt `PortalActor`);
      CRM zeigt „vom Kunden erledigt“; Wiederöffnen im CRM leert die Portalherkunft.

### S7 — Portal-UI (Claude · Opus 5.5)

- [ ] `components/portal/AGENTS.md` + `CLAUDE.md`.
- [ ] Registry-Konstanten/Patterns + Tests (5.3).
- [ ] Dictionaries DE/EN mit `copywriting`; identische Keys (Test/Typ über `typeof de`).
- [ ] Widgets (echt + Mock), Dialog-Host über `?widget`, Projekt-Tabs über `?project`, Dock-Context, Checkbox,
      Empty-State, Banner, `loading.tsx`, `PortalShell`-Greeting — mit `impeccable` + `ui-ux-pro-max` gestalten (ruhig,
      großzügig, Wiedererkennung zum Cockpit über Tokens/Radien/Typo, kein verkleinertes CRM).
- [ ] Komponententests: Registry-Filter (Permission fehlt → Widget fehlt), Mock-Badge sichtbar, Checkbox optimistisch
  - Rollback + Live-Region, Owner-Sicht deaktiviert Checkbox mit Hinweis-Link, leere Kundenaufgaben → Bestätigung,
    Dialog öffnet/schließt per URL.

### S8 — Cockpit-Einstieg (GPT · GPT-6 Luna)

- [ ] Owner-Flag in `crm/page.tsx` ermitteln, Button „Portal ansehen“ in `CustomerCockpitView`, Dictionary DE/EN,
      Test (Nicht-Owner sieht keinen Button).

### S9 — Verifikation & PR (Claude · Sonnet 5; Gegenreview GPT-6 Astra)

- [ ] Vollständige Gates (Abschnitt 8), Playwright-Abnahme, Screenshots (Desktop/Tablet/360 px × Dark/Light, Owner-
      Banner, Dialog, Dock, leerer Kunde), PR-Text: Was/Warum, Review-Scope-Begründung (> 120 Dateien), Testplan,
      Security/Privacy (Owner-Sicht, DTO-Whitelist, 404-Politik), Monitoring (Security-Event, Activity), Rollback.

## 7. Merge-Gate (Ordner 13)

- [ ] Portal-DTO und HTML enthalten keinerlei Finanz-, Leistungs-, Notiz-, Mitarbeiter-ID- oder Rollendaten.
- [ ] Unsichtbare oder interne Aufgaben sind auch über direkte ID nicht abhakbar (404).
- [ ] Ohne `portal.tasks.complete` kein Abhaken (Endpunkt 404, Checkbox fehlt bzw. read-only); fremde Firma 404.
- [ ] Ohne `portal.projects.read` bzw. `portal.tasks.read` fehlt das jeweilige Widget vollständig.
- [ ] Doppelklick/Retry schließt genau einmal ab.
- [ ] Zwei Firmen in zwei Tabs zeigen nie gemischte Daten (Client-Zustand nach `customerId` geschlüsselt).
- [ ] Owner-Sicht: nur Owner, nur lesend, Banner, Security-Event je Aufruf; Nicht-Owner 404.
- [ ] Mock-Widgets sind eindeutig als „Bald verfügbar“ gekennzeichnet und zeigen keine erfundenen Werte.
- [ ] Extraktionen ändern Cockpit und internes Dashboard nicht sichtbar (Screenshot-Vergleich).
- [ ] Responsive (360 px ohne horizontales Scrollen), Keyboard, Fokus, DE/EN, Dark/Light geprüft.
- [ ] Drizzle-Modell deckungsgleich zur Migration (expliziter Review-Punkt).

## 8. Verifikation

```bash
pnpm -r lint
pnpm -r typecheck
pnpm -r test
pnpm --filter @invessiv/db db:migrate        # zweimal ausführen → idempotent (Script-Namen im package.json prüfen)
pnpm --filter @invessiv/db db:smoke:rbac
pnpm --filter @invessiv/db db:seed:crm
pnpm --filter @invessiv/workspace build
```

Manuell (Playwright-MCP, `pnpm --filter @invessiv/workspace dev`):

1. Als Owner: `/crm?cockpit=<id>` → „Portal ansehen“ → Banner, alle Widgets, Mock-Badges, Checkboxen deaktiviert mit
   Link zurück ins Cockpit.
2. Als eingeladener Testkontakt (Seed/Testeinladung): Aufgabe abhaken → sofort erledigt, Live-Region; CRM-Aufgabe
   zeigt „vom Kunden erledigt“. Netzwerkfehler simulieren → Haken springt zurück mit Erklärung.
3. `?widget=customerTasks` direkt aufrufen → Dialog offen; Back → zu. `?project=<fremde-id>` → erstes Projekt.
4. Kontakt mit Rolle ohne `portal.tasks.read` → Aufgaben-Widgets fehlen.
5. 360 px, 768 px, 1280 px × Dark/Light; Tab-Reihenfolge; Chat-Dock mobil unten.
6. Zwei Firmen in zwei Tabs (Person mit zwei Mitgliedschaften).

## 9. Deploy-Sicherheit & Rollback

- **Live sichtbar:** für den Owner über das Cockpit; Kunden werden bis zum Rollout-Gate (E20) nicht eingeladen.
- **Bricht nichts:** Migration additiv (Permissions, eine Spalte, erweiterte CHECKs); ein neuer Portal-Endpunkt
  (Abhaken) über Permission + Zugriffsbereich; Extraktionen verhaltensneutral.
- **Rollback:** die drei Permissions aus `portal_standard`/eigenen Portalrollen entfernen → Widgets und Endpunkt
  verschwinden; Owner-Sicht über Revert des Layout-Guards (`requirePortalActor` statt `requirePortalReader`). Spalte
  und CHECK bleiben (additiv, rückwärtskompatibel).

## 10. Später (nicht in diesem Ordner)

- Widgets verschieben (E18) — eigener Ordner, Varianten siehe Schätzung.
- Neuigkeiten/Benachrichtigungen für Kunden (E23, mit 20c).
- Jeder Mock wird im genannten Folge-Ordner über dessen Merge-Gate auf echte Daten umgestellt; erst danach Rollout
  (Einladung der Kunden).
