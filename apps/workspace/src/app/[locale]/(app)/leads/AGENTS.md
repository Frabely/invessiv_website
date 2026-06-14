# AGENTS.md — Workspace Leads (UI)

Diese Datei gilt für `apps/workspace/src/app/[locale]/(app)/leads/` und alle Subroutes darunter. Sie ergänzt die
Repo-Root `AGENTS.md`. Engere Regeln in tieferen Ordnern haben Vorrang.

## Codex-Arbeitsweise

- Bestehende Workspace-Architektur, Lead-Datenmodell und aktive Pläne unter `plans/workspace/leads/` zuerst lesen und
  respektieren.
- Keine vorhandene Auth-, i18n-, SEO-/Caching-, Persistenz- oder Sicherheitslogik entfernen, nur weil ein neuer Weg
  einfacher wirkt.
- Änderungen klein und reviewbar halten: erst Scope, Abhängigkeiten und Risiken klären, dann gezielt implementieren.
- Bei Unsicherheit über Security, Auth, Caching oder Datenzugriff stoppen und den Nutzer fragen, bevor produktive
  Schutzmechanismen abgeschwächt werden.
- Wenn eine Architekturregel nicht sofort eingehalten werden kann, die konkrete Stelle mit Pfad, Regelbezug, Risiko und
  nächstem Schritt dokumentieren.

## Zweck und Geltungsbereich

- Allowlist-geschützte Lead-Übersicht und alle UI-Erweiterungen rund um den Lead-Lebenszyklus (Liste, Filter,
  Detail-Panel, Lead-Forms, Bulk-Aktionen, Import/Export-UI, Outbound-Messaging-UI, spätere Sub-Views).
- Single-Source-of-Truth für Inbound (Webform-Submissions) und Outbound (manuell, Import) im Workspace.
- Erweiterungen werden in `plans/workspace/leads/<feature-name>.md` geplant und können neue Subordner unterhalb
  `leads/` (z. B. weitere Routen, dedicated Sub-Views) einführen, sofern sie diese Regeln einhalten.

## Mandatorische Regeln

1. **Auth bleibt im Parent-Layout.** Pages und UI unter `leads/` rufen **nicht** `requireWorkspaceAccess(locale)` selbst
   auf. Das Workspace-Layout erledigt das. Keine doppelten Allowlist-Checks, keine page-level-Auth.

2. **Server-only Auth-Helper nicht in Client-Code importieren.** `src/lib/auth/*` ist server-only. In `"use client"`
   -Komponenten ausschließlich Clerk-Client-APIs (`useUser()`, `useAuth()`, `<UserButton>`) nutzen, falls überhaupt
   nötig.

3. **Pages orchestrieren nur.** Page-Files laden Filter aus `searchParams`, rufen Query-Handler aus
   `src/server/workspace/leads/**` auf und reichen Daten an Komponenten weiter. Keine Render-Switches, keine
   Inline-Business-Logic, keine Inline-Strings, keine locale-spezifischen String-Objekte in der Page.

4. **Filter- und Sub-View-State leben in der URL.** Status, Source, Kategorie, Suche, Score, Date-Range, Page, Sort
   sowie Detail-Panel-Selektion und vergleichbare UI-Modi werden ausschließlich als Query-Params (oder ggf. als
   Routensegment, wenn fachlich gerechtfertigt) transportiert. Keine globalen Stores oder `useState`-Insellösungen, die
   die URL umgehen.

5. **Keine Page-internen DB-Zugriffe.** Keine direkten Drizzle-Aufrufe in `page.tsx`, `loading.tsx` oder UI-Komponenten.
   Datenbankzugriff läuft ausschließlich über die Query-/Command-Handler im Server-Layer.

6. **Kontrakt-Grenzen einhalten.** UI darf nur `packages/common/src/contracts/leads/**` importieren. `src/server/**` und
   `packages/db/src/**` sind tabu. DB-nahe Records (`packages/db/src/records/leads/**`) und Persistenz-Inputs (
   `packages/db/src/contracts/leads/**`) bleiben server-intern.

7. **DTO-Trennung respektieren.** Schreib-Operationen verwenden getrennte Command-DTOs (z. B. `create-lead.dto.ts`,
   `update-lead.dto.ts`); gemeinsam genutzte schreibbare Felder liegen in `lead-write-fields.dto.ts`. **Kein**
   generisches `save-lead.dto.ts`, kein vermischtes Mega-DTO. Neue Mutations-Flows folgen demselben Muster.

8. **Private Seiten sind noindex und dynamisch.** Jede Page unter `leads/` setzt
   `metadata.robots = { index: false, follow: false, nocache: true }` und `export const dynamic = "force-dynamic"` (oder
   einen gleichwertigen Mechanismus, der Static Generation und Edge-Cache verhindert).

9. **i18n ist Pflicht.** Alle sichtbaren Strings kommen aus `src/i18n/dictionaries/workspace/leads/`. Keine
   Inline-Strings, keine `locale === "de" ? ... : ...`-Branches, auch nicht für Kategorie-, Status-, Aktivitäts- oder
   Plattform-Labels. Lookup-/Enum-Werte aus der DB werden über stabile Schlüssel (`label_key`, `slug`, Enum-Wert) im
   Dictionary aufgelöst, nicht direkt aus der DB. DE und EN immer parallel pflegen.

10. **Komponenten-Schnitt.** Workspace-Lead-Komponenten gehören nach
    `src/components/workspace/leads/<group>/<component-name>/<component-name>.tsx`, mit lokalem `*.module.css` für
    Styles. Keine inline-Styles, keine globalen Klassen in `globals.css` für lead-spezifische Komponenten. Server
    Components sind Default; `"use client"` nur bei echter Interaktivität (URL-Sync, Selection-State, Dialog, Form,
    Live-Updates).

11. **Loading-States differenzieren.** `loading.tsx` ist nur der initiale Route-Skeleton. Innerhalb der Page laufende
    Refreshes (Filter-Change, Such-Input, Pagination, Sort, Sub-View-Wechsel) zeigen lokale Loading-States, damit
    umgebende UI (Header, Toolbar, Bulk-Bar, Detail-Panel) sichtbar und bedienbar bleibt.

12. **Mutationen nur über die API-Routen.** Komponenten rufen `/api/workspace/leads/...` auf, nicht direkt
    Server-Actions, Server-only-Module oder DB-Funktionen. Nach erfolgreicher Mutation `router.refresh()` aufrufen,
    damit der Server neu rendert. Optimistische Updates sind nur dort erlaubt, wo das Risiko einer fehlenden
    Server-Bestätigung explizit vertretbar ist.

13. **Keine PII in Logs, Aktivitäten oder URLs.** E-Mails, Telefonnummern, Klartextnachrichten und andere
    Kontakt-/Inhaltsdaten dürfen nicht in `console.*`, in Activity-/Audit-`metadata`, in Actor-Feldern oder in
    Query-Params stehen. Lead-Daten bleiben in den fachlichen Tabellen.

14. **Tests gehören zur Definition of Done.** Validation-, Filter-, Query- und Command-Logik bekommen
    Unit-/Integrationstests im Server-Layer. Kritische User-Flows (z. B. Lead anlegen, Detail-Panel öffnen, Status
    ändern, archivieren, Import/Export auslösen, Outbound-Nachricht generieren) bekommen E2E-Coverage unter `e2e/`.

## Routing-Konvention

| Pfad-Schema                              | Zweck                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/[locale]/leads`                        | Lead-Übersicht (server-rendered)                                                                                                                       |
| `/[locale]/leads?<filters>`              | Filter-/Such-/Sort-/Pagination-State über Query-Params, SSR-friendly, deep-linkbar                                                                     |
| `/[locale]/leads?selected=<id>`          | Detail-Side-Panel öffnet rechts (Server-Component, kein eigenes Routing-Segment)                                                                       |
| `/[locale]/leads/<sub-view>` (zukünftig) | Eigene Routensegmente nur, wenn sie eine fachlich eigenständige Sicht abbilden (z. B. Import-Pipeline-UI). Sub-Views erben Auth aus dem Parent-Layout. |

Detail-State lebt im `selected`-Query-Param. Neue Sub-Views erfordern eine bewusste Plan-Entscheidung und keine
Auth-Duplikation.

## i18n-Struktur

```
apps/workspace/src/i18n/dictionaries/workspace/leads/
  bulk/{de,en}.json
  delete/{de,en}.json
  detail/{de,en}.json
  form/{de,en}.json
  import/{de,en}.json
  meta/{de,en}.json
  outreach/{de,en}.json + outreach/index.ts
  pagination/{de,en}.json
  shared/{de,en}.json
  shell/{de,en}.json
  table/{de,en}.json
  toolbar/{de,en}.json
  index.ts
```

`index.ts` stellt typisierte Loader bereit (`getLeadsMetaDictionary(locale)`, `getLeadsShellDictionary(locale)`,
`getLeadsTableDictionary(locale)`, `getLeadsSharedDictionary(locale)`, `getLeadsOutreachDictionary(locale)`, …).
Neue Sektionen ergänzen bestehende Unterordner oder legen neue Subordner unterhalb `leads/` an.
Komponenten konsumieren vorbereitete Inhalte und enthalten keine sprachabhängige Rest-Copy.

## SEO und Caching

- `metadata.robots = { index: false, follow: false, nocache: true }`.
- `export const dynamic = "force-dynamic"` (oder `revalidate = 0`).
- Keine externen Links, keine Sitemap-Einträge.

## Workflow für neue Lead-UI-Features

1. Plan in `plans/workspace/leads/<feature-name>.md` schreiben oder bestehenden Plan aktualisieren.
2. Dictionaries unter `src/i18n/dictionaries/workspace/leads/` für DE und EN im selben Commit anlegen oder erweitern.
3. UI unter `src/components/workspace/leads/<group>/<component-name>/` bauen, mit lokalem `*.module.css` und typisierten
   Props.
4. Page bzw. Sub-View dünn halten: Filter/Params parsen, Query-Handler aufrufen, Komponenten zusammensetzen.
5. Mutationen über API-Routen unter `/api/workspace/leads/*` durchreichen, danach `router.refresh()`.
6. Tests ergänzen: Unit für Validation/Filter/Command, Integration für Query-Handler, E2E für kritische User-Flows.
7. Vor Merge `pnpm lint`, `pnpm typecheck`, `pnpm test` und `pnpm build:workspace` grün halten.

## Was hier nicht hingehört

- Marketing-, Legal- oder andere Workspace-Pages.
- Eigene Auth-, Allowlist- oder Permission-Logik.
- DB-Zugriff oder Drizzle-Queries in Pages oder UI-Komponenten.
- Globale CSS-Klassen für lead-spezifische Komponenten.
- Inline-Strings, locale-Branches in `.tsx`, mehrere Komponenten in einer Datei.

## Verweise

- Repo-Root `AGENTS.md`.
- `apps/workspace/src/components/workspace/leads/AGENTS.md` — Komponenten-Regeln.
- `apps/workspace/src/app/api/workspace/leads/README.md` — API-Contract.
- Aktive und kommende Pläne: `plans/workspace/leads/`.
