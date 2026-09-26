# AGENTS.md — `(portal)` Route Group

Gilt für `apps/workspace/src/app/[locale]/(portal)/` und alle Subroutes darunter. Ergänzt die
Repo-Root-`AGENTS.md` und `apps/workspace/plans/crm/AGENTS.md`. Fachliche Grundlage:
`apps/workspace/plans/crm/12a-portal-fundament/49-portal-fundament.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Alle Kundenportal-Routen: `/portal` (Firmenweiche), `/portal/[customerId]` und jedes künftige
Portal-Modul darunter (Ordner 13 ff.). `layout.tsx` prüft die unterstützte Locale für die
gesamte Gruppe. Jede geschützte Portalseite prüft die Mitgliedschaft selbst.

## Verbindlich

- **Getrennt vom internen Bereich.** Keine Komponente aus `components/workspace/**` wird hier
  importiert, und keine Komponente aus `components/portal/**` wird im internen Bereich verwendet.
  `PortalShell` ist bewusst nicht `WorkspaceShell`: kein internes Branding, keine internen
  Navigationspunkte, keine Sidebar-Bereiche.
- **Jede Seite unter `/portal/[customerId]/**` ruft ihren Auth-Guard selbst auf** (react `cache()` dedupliziert
  innerhalb eines Renders); kein Handler bekommt eine ungeprüfte `customerId` aus der Route. Lesende Seiten nutzen
  `requirePortalReader(locale, customerId)` — Kundenkontakt oder Workspace-Owner in der Nur-Lese-Sicht (Banner statt
  Firmenwechsler). Seiten, die ausschließlich Kundenkontakte sehen dürfen, nutzen `requirePortalActor`.
- **Owner-Sicht schreibt nie.** Interaktive Elemente mit Schreibwirkung sind in der Owner-Sicht deaktiviert und
  verweisen ins CRM; der Schreibweg selbst ist über `withPortalActor` typseitig verschlossen.
- **`/portal` bestätigt nie eine fremde Mitgliedschaft.** Die Firmenweiche antwortet bei keiner
  aktiven Mitgliedschaft 404, bei genau einer redirectet sie dorthin, bei mehreren zeigt sie die
  Auswahl — nie einen stillen Default.
- **`PORTAL_NAV_ITEMS` ist die einzige Registrierungsstelle für Navigationspunkte.** Ein neues
  Portal-Modul ergänzt dort seinen Eintrag mit `requiredPermission`. `portal/[customerId]/layout.tsx`
  filtert über `listPermittedPortalNavItems(actor.permissions)` und reicht das Ergebnis als
  `nav`-Slot an `PortalShell`; ohne passende Einträge bleibt der Slot `null` und es entsteht keine
  leere Navigationsleiste.
- **Eigene Portal-DTOs.** Daten kommen aus `packages/common/src/contracts/portal/`, nie aus einem
  Workspace- oder Cockpit-DTO.
- **i18n ausschließlich aus** `src/i18n/dictionaries/portal/<modul>/{de,en}.json`. Keine
  Inline-Texte in Pages, Layouts oder Portal-Komponenten.
- **`noindex`/`force-dynamic`** auf jeder Seite, wie im gesamten geschützten Bereich.
- **Routen-Slugs englisch** (`projects`, `files`, `assets`, `messages`, `onboarding`, `services`),
  über `portalPathFor(locale, customerId, section?)` — nie String-Konkatenation.
- **Negativtests Pflicht:** fremde/geratene `customerId`, fehlende `portal.access` und widerrufene
  Mitgliedschaft.

## Skills

| Skill             |         Priorität | Wann nutzen                                  |
| ----------------- | ----------------: | -------------------------------------------- |
| `frontend-design` |   required bei UI | `PortalShell`, Firmenauswahl, Firmenwechsler |
| `copywriting`     | required bei Text | Shell-, Meta- und Picker-Dictionaries        |

## Was hier nicht hingehört

- Fachliche Portalinhalte als Markup (Widgets, Listen, Dialoge) — sie liegen unter `components/portal/`
  (Regeln dort in `AGENTS.md`); Seiten laden nur DTO und Dictionary und orchestrieren.
- Einladungs- und Einlöseflow (Ordner 12b).
- Interne Admin-Funktionen oder Mitarbeiter-Navigation.
