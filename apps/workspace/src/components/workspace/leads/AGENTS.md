# AGENTS.md — Komponenten Workspace Leads

Diese Datei gilt für `src/components/workspace/leads/` und alle Subordner darunter. Sie ergänzt die Repo-Root
`AGENTS.md`. Engere Regeln in tieferen Ordnern haben Vorrang.

## Codex-Arbeitsweise

- Bestehende Workspace-Konventionen und aktive Pläne unter `plans/workspace/leads/` zuerst lesen und respektieren.
- Komponenten klein, fokussiert und reviewbar halten. Keine Mega-Components.
- Server Components sind Default; `"use client"` nur, wenn echte Interaktivität (URL-Sync, Selection-State, Dialog,
  Form, Live-Updates) das erzwingt.
- Bei Unsicherheit über Datenfluss, Auth, Persistenz oder Caching stoppen und den Nutzer fragen, bevor Schutzmechanismen
  oder Architektur-Grenzen aufgeweicht werden.
- Wenn eine Architekturregel nicht sofort eingehalten werden kann, die konkrete Stelle mit Pfad, Regelbezug, Risiko und
  nächstem Schritt dokumentieren.

## Zweck und Geltungsbereich

- UI-Bausteine für die Workspace-Leads-Oberfläche und alle künftigen Erweiterungen rund um den Lead-Lebenszyklus (Liste,
  Filter, Detail-Panel, Lead-Forms, Bulk-Aktionen, Import-/Export-UI, Outbound-Messaging-UI, dedizierte Sub-Views).
- Konsumenten: ausschließlich Routen unterhalb `src/app/[locale]/leads/`. Keine Wiederverwendung außerhalb des
  Workspace-Leads-Bereichs.

## Begründung der gruppierten Subfolder-Struktur

Die Standard-Komponentenkonvention des Projekts legt eine flache Komponentenordner-Struktur nahe
(`<component-name>/<component-name>.tsx`). Für die Workspace-Leads-UI weichen wir bewusst ab und gruppieren
Komponenten in fachliche Subfolder (`shell/`, `toolbar/`, `table/`, `detail/`, `form/`, `shared/` und ggf. weitere).
Gründe:

- **Hohe Anzahl Komponenten in einem fachlichen Bereich.** Die Lead-UI besteht aus deutlich mehr als zehn produktiven
  Komponenten und wächst weiter (Import-UI, Messaging-UI, zusätzliche Sub-Views). Eine flache Struktur wäre
  unübersichtlich.
- **Klare Zuständigkeitsachsen.** Page-Shell, Toolbar-/Filter-Logik, Tabellen-Mechanik, Detail-Panel und Lead-Forms sind
  weitgehend voneinander entkoppelt und werden auch in unterschiedlichen Tickets/Plänen bearbeitet.
- **Reuse-Klarheit.** `shared/` macht explizit, welche Visuals (Status-/Source-Badges, Score-Bar, künftige
  domänenübergreifende Bausteine) lead-übergreifend wiederverwendet werden.

Diese Gruppierung ist eine Scope-spezifische Präzisierung der Standardregel und nur in `src/components/workspace/leads/`
zulässig. Andere Workspace-Bereiche bleiben bei der flachen Struktur, sofern es nicht ähnlich begründete Ausnahmen gibt.
Neue Subfolder-Gruppen werden über einen Plan eingeführt, nicht ad hoc.

## Mandatorische Regeln

1. **Gruppierte Subfolder als bewusste Scope-Präzisierung.** Komponenten liegen in fachlichen Gruppen (siehe oben),
   nicht direkt unter `leads/`. Neue Gruppen werden plan-getrieben angelegt und dokumentiert.

2. **Komponentenordner-Konvention bleibt gleich.** Innerhalb einer Gruppe gilt die Standardregel: jede Komponente lebt
   in `src/components/workspace/leads/<group>/<component-name>/<component-name>.tsx`. Die Hauptdatei trägt den
   Ordnernamen.

3. **Ein Datei, eine Komponente.** Pro produktiver `.tsx`-Datei darf genau eine React-Komponente definiert sein.
   Hilfsfunktionen sind erlaubt, solange sie nur diese Komponente unterstützen. Mehrere Komponenten in einer Datei sind
   nicht zulässig.

4. **Lokales Styling über `*.module.css`.** Styles gehören in eine separate `<component-name>.module.css`-Datei neben
   der `.tsx`. Keine Inline-Styles in `.tsx`. Keine globalen Klassen in `globals.css` für lead-spezifische Komponenten.
   `globals.css` enthält nur Tailwind-Import, globale Tokens/Reset und Theme-Variablen. Wenn eine Komponente eigene
   Styles braucht, bekommt sie auch eine eigene CSS-Datei; nur vollständig stilfreie Komponenten dürfen ohne CSS
   bleiben.

5. **Server vs. Client.** Server Components sind Default. `"use client"` ist auf Komponenten beschränkt, die echte
   Interaktivität brauchen (URL-Sync via `next/navigation`, Selection-Provider, Dialog-Open-State, Form-State,
   Live-Updates). Animations-/Scroll-/Observer-Logik gehört nach `src/hooks/`, nicht in Render-Dateien.

6. **i18n ist Pflicht.** Alle sichtbaren Strings kommen aus `src/i18n/dictionaries/workspace/leads/`. Keine
   Inline-Strings in `.tsx`, keine `locale === "de" ? ... : ...`-Branches. Lookup-/Enum-Werte (Status, Kategorien,
   Plattformen, Aktivitätstypen) werden über stabile Schlüssel im Dictionary aufgelöst, nicht direkt aus der DB.
   Komponenten erhalten vorbereitete Inhalte als Props oder über Server-Component-Loader, nicht hartkodiert.

7. **Kontrakt-Grenzen.** Komponenten importieren nur aus `packages/common/src/contracts/leads/**` für DTOs und aus
   `src/i18n/dictionaries/workspace/leads/` für Texte. **Kein** Import aus `src/server/**` oder `@invessiv/db`.

8. **Mutationen über die API.** Client-Komponenten rufen `/api/workspace/leads/...` per `fetch` auf, nicht direkt
   Server-Actions oder DB-Funktionen. Nach erfolgreicher Mutation wird `router.refresh()` aufgerufen, damit der Server
   neu rendert. Optimistische Updates sind nur dort zulässig, wo das Risiko einer fehlenden Server-Bestätigung explizit
   vertretbar ist.

9. **Filter-State lebt in der URL.** Toolbar-Komponenten setzen Query-Params via `router.push()`/`router.replace()` aus
   `next/navigation`. Keine Insellösungen mit `useState` für Filter-, Such-, Pagination-, Sort- oder vergleichbaren
   Sub-View-State, die die URL umgehen.

10. **Detail-Panel-State lebt in der URL.** Tabellenzeilen öffnen das Panel via `?selected=<id>`. Schließen entfernt den
    Param. Kein eigener Modal-Provider, kein Layout-State für das Panel. Vergleichbare Side-Panel-/Drawer-UIs für andere
    Lead-Operationen folgen demselben URL-getriebenen Muster.

11. **Loading-States differenzieren.** Innerhalb der Page laufende Refreshes (Filter-Change, Such-Input, Pagination,
    Sort, Sub-View-Wechsel) zeigen lokale Loading-States (Row-Skeletons, dezente Overlays), damit umgebende UI sichtbar
    und bedienbar bleibt. Der initiale Route-Skeleton lebt in `loading.tsx` der Page.

12. **Selection-State zentral.** Bulk-Selection wird in einem dedizierten Client-Provider gehalten. Bei
    Filter-/Sort-/Sub-View-Wechsel wird die Selection geleert. Checkbox-Klicks stoppen Propagation, damit
    Row-Click-Handler nicht parallel feuern.

13. **Keine PII in Logs oder URLs.** E-Mails, Telefonnummern, Klartextnachrichten und Lead-Namen dürfen nicht in
    `console.*`-Aufrufen oder Query-Params landen. Lead-Daten kommen ausschließlich über DTOs in die Komponente.

14. **Tests bei interaktiven Komponenten.** Komponenten mit Interaktionslogik (Selection-Provider, Toolbar mit URL-Sync,
    Forms mit Client-Side-Validation, Bulk-Aktionen, Live-Updates) bekommen co-locatete Tests (
    `<component-name>.test.tsx`). Reine Präsentationskomponenten (Badges, Score-Bar, Empty-State) brauchen keine eigenen
    Tests, sofern sie via E2E abgedeckt sind.

15. **Reuse vor Neuanlage.** Visuals und Bausteine in `shared/` werden über die gesamte Lead-UI hinweg wiederverwendet (
    Tabelle, Detail-Panel, Activity-Stream, künftige Views). Keine doppelten Implementierungen in unterschiedlichen
    Subfoldern; bei wiederkehrendem Bedarf gehört der Baustein nach `shared/`.

## Subfolder-Übersicht (Stand)

| Subfolder   | Zweck                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `shell/`    | Page-Shell, Page-Header, Loading-Skeleton                                                        |
| `toolbar/`  | Filter-Toolbar (Tabs, Suche, Status-/Source-/Kategorie-/Score-/Date-Filter, künftige Filter)     |
| `table/`    | Tabelle, Row, Selection-Provider, Bulk-Action-Bar, Pagination, Empty-State, Loading-State        |
| `detail/`   | Lead-Detail-Side-Panel und Activity-/Timeline-Komponenten                                        |
| `form/`     | Lead-Forms (Add, Edit)                                                                           |
| `delete/`   | Lösch-Bestätigungs-Dialog                                                                        |
| `import/`   | Import-Dialog, Column-Mapping-UI                                                                 |
| `outreach/` | Outreach-Trigger und Outreach-Dialog                                                             |
| `shared/`   | Status-/Source-/Plattform-Badges, Score-Bar, weitere lead-übergreifend wiederverwendbare Visuals |

Neue Subfolder-Gruppen (z. B. `messaging/`, `analytics/`) werden plan-getrieben eingeführt und in dieser Tabelle
ergänzt.

## Form-DTO-Regel

- Form-Komponenten in `form/` mappen ihren UI-State vor dem `fetch` auf explizite Request-DTOs aus
  `packages/common/src/contracts/leads/`.
- Der Mapper benennt die Zielrolle klar, zum Beispiel `mapAddLeadFormValuesToCreateLeadRequestDto`.
- Serverinterne Persistenz-Shapes, DB-Records und Handler-Inputs werden nicht direkt im Client gebaut.

## Workflow für neue Lead-Komponenten

1. Plan oder Ticket aktualisieren (Komponentenname, Subfolder, Props, Daten- und Mutations-Quelle, Reuse-Punkte).
2. Dictionaries unter `src/i18n/dictionaries/workspace/leads/` (DE + EN) im selben Commit ergänzen.
3. Komponente unter `src/components/workspace/leads/<group>/<component-name>/<component-name>.tsx` anlegen, dazu
   `<component-name>.module.css`.
4. Prop-Typen aus `packages/common/src/contracts/leads/**` ziehen, keine eigenen Lead-Shapes erfinden.
5. Falls interaktiv: Tests co-locatieren (`<component-name>.test.tsx`).
6. Vor Merge `pnpm lint && pnpm typecheck && pnpm test && pnpm build:workspace` grün halten.

## Was hier nicht hingehört

- DB-Zugriff oder Drizzle-Queries (gehören in `src/server/workspace/leads/**`).
- Eigene Auth-, Allowlist- oder Permission-Logik.
- Marketing-, Legal- oder andere Workspace-Komponenten (diese liegen in ihren eigenen Bereichen).
- Globale CSS-Klassen für lead-spezifische Komponenten.
- Inline-Strings, locale-Branches, mehrere Komponenten in einer Datei.

## Verweise

- Repo-Root `AGENTS.md`.
- `apps/workspace/src/app/[locale]/(app)/leads/AGENTS.md` — Routen-/Page-Regeln.
- `apps/workspace/src/app/api/workspace/leads/README.md` — API-Contract.
- Aktive und kommende Pläne: `plans/workspace/leads/`.
