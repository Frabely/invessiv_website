# Workspace-Dashboard (Akquise-Fokus) — MVP-Plan

## Context

Aktuell leitet `/[locale]` auf `/[locale]/leads` weiter — keine Dashboard-Seite vorhanden. Die Lead-Übersicht (Liste, Filter, Detail-Panel, Bulk-Aktionen) existiert bereits als eigener Tab und darf nicht dupliziert werden.

Der User hat **1 Kunden** und steht aktuell in der **Lead-Akquise-Phase**: Leads werden aufgenommen, kontaktiert, qualifiziert. Es gibt noch keine echten Angebote oder Closes — Stats für `proposal`/`won`/`lost`/Revenue sind daher **bewusst nicht im MVP**.

**Ziel:** Statisches Akquise-Dashboard auf `/[locale]/dashboard`, das dem User Feedback zu seinem Akquise-Tempo, seiner Conversion zwischen Pipeline-Stufen und seiner eigenen Outreach-Aktivität gibt. Alle Statistiken sind ab Start so gebaut, dass sie **Filterparameter** (Default: 30 Tage, später UI-überschreibbar) akzeptieren.

**Innovation:** Neben Volumen-/Funnel-Cards bekommt das Dashboard drei differenzierende Module — **Hot Leads Action Queue** (Priorisierungshilfe), **Funnel-Velocity** (Engpass-Sichtbarkeit), **Activity-Heatmap + Streak** (Arbeitsmuster + Motivation).

## Entscheidungen aus dem Brainstorming

| Thema                                      | Entscheidung                                                                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route                                      | Neue Route `/[locale]/dashboard`; Redirect von `/[locale]` zeigt auf `/[locale]/dashboard` statt `/[locale]/leads`                                                      |
| MVP-Module                                 | Akquise-Volumen, Funnel (4 Stufen mit Drop-Off), Source-Performance, Time-to-First-Contact, Outreach-Aktivität/Tag, Hot Leads, Funnel-Velocity, Activity-Heatmap+Streak |
| Default-Range                              | 30 Tage, mit Vergleichswert Vorperiode (vorherige 30 Tage)                                                                                                              |
| Status-Erweiterung                         | Neuer Status `responded` zwischen `contacted` und `qualified` (eigener Task 0)                                                                                          |
| Stale Leads                                | **Backlog** — Prerequisite: Lead-Feld `do_not_contact` (bool) + Status `not_interested`, weil UWG §7 wiederholten Kontakt ohne Einwilligung scharf reglementiert        |
| Header-Search + globaler Lead-Detail-Panel | **Folge-Plan**, nicht in diesem Scope. Hot-Leads-Klick navigiert zunächst auf `/leads/[id]`, wird im Folge-Plan transparent durch globalen Panel ersetzt                |
| Funnel-Stil                                | 4 KPI-Cards mit Drop-Off-% zwischen Stufen (kompakt, erweiterbar um Proposal/Won)                                                                                       |
| Doppelungen vermeiden                      | Kein Pipeline-Kanban, keine Recent-Inquiries-Liste, keine Lead-Such-/Aktions-UI im Dashboard — bleibt im Leads-Tab                                                      |

## Rechtslage „nochmal anschreiben" (Begründung für Stale-Leads-Backlog)

- **B2B-Email (UWG §7 Abs. 2 Nr. 3):** Ohne Einwilligung grundsätzlich unzulässig — auch „mutmaßliches Interesse" hat enge Schwelle. Keine Reaktion ≠ Einwilligung; wiederholte Mails erhöhen Belästigungsrisiko.
- **LinkedIn / DMs / Direct Outreach:** Plattform-AGB primär; max. 2–3 sinnvolle Versuche, nach explizitem „Nein" sofort stoppen.
- **DSGVO:** Speicherung über Art. 6 lit. f (berechtigtes Interesse) abdeckbar, solange Widerspruchsrecht respektiert wird. Sobald ein Lead aktiv ablehnt → `do_not_contact`-Flag setzen, sonst Bußgeld-Risiko.
- **Konsequenz:** Stale-Modul kommt erst ins MVP, wenn `do_not_contact` (bool) und Status `not_interested` existieren und das Modul diese hart ausfiltert.

## Geplante Skills (verbindlich pro Task)

- **`superpowers:writing-plans`** — nach Abschluss dieses Plan-Dokuments wird die Implementierung zu einem detaillierten Schritt-für-Schritt-Plan ausgebaut
- **`superpowers:test-driven-development`** — für jeden Server-Query-Handler und jede DTO-Validierung (rot/grün/refactor)
- **`frontend-design:frontend-design`** — verbindlich bei jedem UI-Modul (siehe Root-`AGENTS.md`, Frontend-Umbauten)
- **Animations-/Effects-Katalog-Check** — verbindlich vor jeder visuellen Modul-Implementierung: `animation_mockups/effects-catalog.json` prüfen, passende Effekte adaptieren statt neu bauen
- **`superpowers:systematic-debugging`** — bei jedem Fehlerbild
- **`superpowers:verification-before-completion`** — vor jeder „fertig"-Behauptung: `npm run lint` + `npm run build` + Vitest-Run + manueller Browser-Check
- **`superpowers:requesting-code-review`** — vor Merge größerer Tasks (insb. Task 0 wegen DB-Migration, Task 1 wegen Route-Architektur)

> **Verbindlich:** Tasks werden **einzeln** abgearbeitet — jeder Task ist ein eigener kleiner PR mit Tests, Lint+Build grün und manuellem Smoke-Check, bevor der nächste Task startet. Keine gebündelten „Mega-Commits".

## Architektur

### Routing & Page

- `apps/workspace/src/app/[locale]/(app)/dashboard/page.tsx` — Server Component, orchestriert nur (lädt Query-Handler-Resultate, übergibt an Module).
- `apps/workspace/src/app/[locale]/(app)/page.tsx` — Redirect aktualisieren: `redirect(\`/${locale}/dashboard\`)`statt`/leads`.
- Filter-State (`range`) via URL-Search-Params (`?range=30d` etc.), damit Server-Rendering möglich bleibt und State teilbar/bookmark-bar ist.

### Server-Layer

- `apps/workspace/src/server/workspace/dashboard/query-handler/*.query-handler.ts` — ein Query-Handler pro Modul. Alle akzeptieren `DashboardRangeInput { from: Date; to: Date }` plus modulspezifische Inputs.
- Aggregations via Drizzle direkt gegen `leads`, `lead_activities`, `lead_categories`. Keine Materialized Views nötig bei niedrigem Volumen.
- Bestehende Query-Helper aus `apps/workspace/src/server/workspace/leads/query-handler/*` wo möglich wiederverwenden (z. B. Joins, Mapping-Patterns aus `list-leads.query-handler.ts`).

### Shared Contracts

- `packages/common/src/contracts/dashboard/*.dto.ts` — DTO pro Modul-Output (camelCase).
- `packages/common/src/contracts/dashboard/rows/*-row.ts` — DB-Row-Shapes (snake_case), falls Query-Resultate von DTOs abweichen.
- `packages/common/src/constants/dashboard/dashboard-ranges.ts` — Const-Objekt `DashboardRange = { Last7Days, Last30Days, Last90Days } as const`, Default `Last30Days`.

### Client-Layer

- `apps/workspace/src/components/workspace/dashboard/` — ein Ordner pro Modul (`kpi-card`, `funnel-cards`, `source-performance`, `time-to-contact`, `outreach-activity`, `hot-leads-queue`, `funnel-velocity`, `activity-heatmap`, `dashboard-range-filter`).
- Konvention: `component-name/component-name.tsx` + lokales `.module.css` oder Tailwind-Klassen. Tests co-located (`component-name.test.tsx`).
- Charts: bestehende Lib evaluieren (falls bereits Recharts/Chartjs eingesetzt → nutzen; sonst Recharts wegen React-19-Kompatibilität).

### i18n

- `apps/workspace/src/i18n/dictionaries/workspace/dashboard/{de,en}.json` — alle Modul-Titel, KPI-Labels, leere Zustände, Filter-Labels, Vergleichs-Phrasen („+12 % vs. Vorperiode").
- Keine Inline-Strings in `page.tsx` oder Komponenten — Pflichtregel laut Root-`AGENTS.md`.

## Tasks (einzeln umzusetzen, in Reihenfolge)

> Jeder Task ist ein eigener PR. Kein Task startet, bevor der vorherige grün gemerged ist.

### Task 0 — Status `responded` einführen ✅ erledigt

**Warum zuerst:** Funnel-Cards (Task 3) brauchen den Status. Schema-Änderung muss vor allen UI-Modulen mergebar sein.

- `packages/common/src/constants/contact/contact-lead-statuses.ts`: `Responded: "responded"` zwischen `Contacted` und `Qualified` einfügen, Array-Reihenfolge konsistent halten.
- DB-Migration generieren (`packages/db/src/migrations/`): CHECK-Constraint `leads_lead_status_check` aktualisiert sich automatisch via `sqlCheckIn`, aber Migration ist explizit nötig.
- i18n: Label `responded` in allen workspace-Leads-Dictionaries (DE/EN) + Filter- und Bulk-Edit-Optionen.
- `lead-status-badge.tsx`: Farbe + Tone für `responded` definieren (z. B. Indigo, zwischen Contacted-Grau und Qualified-Grün).
- Tests: Constants-Test (`leads-constants.test.ts`) erweitern, Badge-Test, Status-Filter-Test.
- **Skills:** `test-driven-development`, `verification-before-completion`.

### Task 1 — Dashboard-Route + Skeleton + Range-Filter ✅ erledigt

- Neue Route `apps/workspace/src/app/[locale]/(app)/dashboard/page.tsx` mit `force-dynamic` und no-index Metadata.
- Redirect in `apps/workspace/src/app/[locale]/(app)/page.tsx` von `/leads` auf `/dashboard` umstellen.
- `DashboardRange`-Konstante + `dashboard-range-filter`-Client-Komponente (Dropdown mit 7d/30d/90d, schreibt in URL-SearchParam).
- Server-Helper `resolveDashboardRange(searchParams) → { from, to, label }` mit Vergleichszeitraum-Berechnung.
- i18n-Dictionaries angelegt (Skelett, ohne Modul-Inhalte).
- Layout-Skeleton: Header (Titel + Range-Filter rechts), Grid-Slots für Module (Module-Komponenten erstmal Placeholder).
- Loading.tsx + leerer State.
- Tests: Range-Resolver-Unit-Test, Route-Smoke (rendert ohne Crash).
- **Skills:** `frontend-design`, Animation-Effects-Katalog-Check, `test-driven-development`.

### Task 2 — KPI-Card-Component + Akquise-Volumen-Modul ✅ erledigt

- Wiederverwendbare `kpi-card`-Komponente: Titel, Hauptzahl, Vergleichswert (mit ±% und Trend-Pfeil), optionaler Sub-Text, optionaler Sparkline-Slot.
- Query-Handler `get-acquisition-volume.query-handler.ts`: Zählt Leads mit `created_at IN [from, to]`, exkludiert `pending_review` (separat ausgeworfen als „X warten auf Review"-Pill).
- DTO `AcquisitionVolumeDto { current: number; previous: number; pendingReview: number }`.
- Modul-Komponente bindet KPI-Card mit Daten.
- Tests: Query-Handler (Vitest + Test-DB), KPI-Card (jsdom), Modul-Render (jsdom).
- **Skills:** `frontend-design`, `test-driven-development`.

### Task 3 — Funnel-Cards (4 Stufen mit Drop-Off) ✅ erledigt

- Query-Handler `get-funnel-snapshot.query-handler.ts`: Counts pro Status (`new`, `contacted`, `responded`, `qualified`) im Zeitraum.
- DTO `FunnelSnapshotDto { stages: Array<{ key: ContactLeadStatus; count: number; dropOffFromPrev: number | null }> }`.
- `funnel-cards`-Komponente: 4 nebeneinander stehende KPI-Cards mit Pfeil-Verbindern und Drop-Off-% (z. B. „67 % weiter") zwischen Stufen.
- Responsive: Auf Mobile vertikal stapeln mit kleineren Pfeilen.
- Tests: Query-Handler, Drop-Off-Berechnung (Edge-Cases: 0 in Vorstufe = `null`), UI-Render.
- **Skills:** `frontend-design`, Animation-Effects-Katalog-Check, `test-driven-development`.

### Task 4 — Source-Performance

- Query-Handler `get-source-performance.query-handler.ts`: Pro `LeadSource` Volume + avg Score im Zeitraum.
- DTO `SourcePerformanceDto { sources: Array<{ source: LeadSource; count: number; avgScore: number | null }> }`.
- UI: Horizontale Balken-Liste oder kompakte Cards je Source, sortiert nach Volume.
- Tests: Query-Handler, UI-Render mit Empty-State.
- **Skills:** `frontend-design`, `test-driven-development`.

### Task 5 — Time-to-First-Contact

- Query-Handler `get-time-to-first-contact.query-handler.ts`: Median Tage zwischen `leads.created_at` und erster `lead_activities`-Zeile mit `type='status_change'` und Target-Status `contacted`. Range filtert auf `created_at`.
- DTO `TimeToFirstContactDto { medianDays: number | null; trend: Array<{ bucket: string; medianDays: number }> }` (Trend in 7-Tages-Buckets).
- UI: Große Zahl + Sparkline.
- Tests: Median-Berechnung (Edge: keine Daten → `null`), Bucket-Aggregation.
- **Skills:** `frontend-design`, `test-driven-development`.

### Task 6 — Outreach-Aktivität pro Tag

- Query-Handler `get-outreach-activity.query-handler.ts`: Pro Tag Anzahl `lead_activities` mit `type IN ('message_drafted', 'status_change', 'note')`.
- DTO `OutreachActivityDto { days: Array<{ date: string; messageDrafted: number; statusChange: number; note: number }> }`.
- UI: Gestapeltes Bar-Chart pro Tag, Legende, Hover-Tooltip.
- Tests: Tagesaggregation, leere Tage werden mit 0 gefüllt.
- **Skills:** `frontend-design`, Animation-Effects-Katalog-Check, `test-driven-development`.

### Task 7 — Hot Leads Action Queue

- Query-Handler `get-hot-leads.query-handler.ts`: Top-N (default 5) Leads mit Status `new` oder `pending_review`, sortiert nach `score` DESC, sekundär `created_at` DESC. Range filtert NICHT (Hot Leads sind aktuell, unabhängig von Range).
- DTO `HotLeadsDto { leads: Array<HotLeadEntryDto> }` mit minimalen Lead-Feldern (Display-Name, Score, Source, Status, ID).
- UI: Liste mit Score-Bar (existierende `lead-score-bar` wiederverwenden), Klick navigiert auf `/[locale]/leads?focus=<id>` (Folge-Plan ersetzt das durch globalen Panel).
- Tests: Sortier-Regel, Limit, Filter auf Status, UI-Klick-Test.
- **Skills:** `frontend-design`, `test-driven-development`.

### Task 8 — Funnel-Velocity

- Query-Handler `get-funnel-velocity.query-handler.ts`: Avg Tage, die Leads pro Status verbringen (zwischen aufeinanderfolgenden `status_change`-Activities). Range filtert auf `lead_activities.occurred_at`.
- DTO `FunnelVelocityDto { stages: Array<{ status: ContactLeadStatus; avgDaysInStage: number | null; sampleSize: number }> }`.
- UI: Horizontale Bar-Chart, jede Bar = avg Tage in Status, mit Sample-Size als Sub-Text.
- Tests: Activity-Paarung (Status-Change → nächste Status-Change), Edge: Lead aktuell noch in Status (kein „nächster" → wird ausgeschlossen oder mit „Now"-Berechnung optional inkludiert).
- **Skills:** `frontend-design`, `test-driven-development`.

### Task 9 — Activity-Heatmap + Streak

- Query-Handler `get-activity-heatmap.query-handler.ts`: Aggregiert `lead_activities` nach Wochentag × 4h-Bucket-Tageszeit, plus Streak-Counter (Tage in Folge mit mindestens 1 Activity, rückwärts ab heute).
- DTO `ActivityHeatmapDto { cells: Array<{ weekday: number; hourBucket: number; count: number }>; currentStreakDays: number; longestStreakDays: number }`.
- UI: 7×6 Heatmap-Grid (Mo–So × 0–4–8–12–16–20 Uhr), Color-Intensity nach `count`. Streak prominent als „🔥 12 Tage in Folge"-Pill (Emoji nur wenn User-zustimmt; sonst neutraler Indikator).
- Tests: Bucket-Zuordnung über Wochengrenze, Streak-Logik (gestern war kein Tag mit Activity → Streak = 0).
- **Skills:** `frontend-design`, Animation-Effects-Katalog-Check, `test-driven-development`.

### Task 10 — End-to-End-Test + Doc-Update

- Playwright Smoke: `/de/dashboard` und `/en/dashboard` laden, alle 8 Modul-Sektionen sichtbar, Range-Filter wechselt URL und triggert Re-Render, KPI-Werte werden gerendert.
- A11y-Smoke: Tab-Reihenfolge, Fokus-Styles, Kontrast.
- README/CLAUDE.md im Workspace-Bereich aktualisieren (Verweis auf Dashboard-Route).
- **Skills:** `verification-before-completion`, `requesting-code-review`.

## Backlog (nicht im MVP, explizit dokumentiert)

| Modul                                          | Prerequisite / Begründung                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stale Leads**                                | Neuer Status `not_interested` + Lead-Feld `do_not_contact` (bool). Grund: UWG §7 erlaubt wiederholten kalten B2B-Kontakt nur eng; ohne Tracking abgelehnter Leads droht Bußgeld-Risiko. Erst nach diesen Feldern darf Stale-Modul live, weil es sonst rechtlich riskante Follow-up-Empfehlungen geben würde. |
| **Score-Qualitäts-Trend**                      | Avg Lead-Score über Zeit. Sinnvoll, aber niedrige Priorität bei aktuellem Volumen — Trends werden erst ab ~50 Leads/Monat aussagekräftig.                                                                                                                                                                    |
| **Top-Branchen / Categories**                  | Sinnvoll, sobald Category-Tagging konsequent gepflegt wird. Aktuell wenig Daten.                                                                                                                                                                                                                             |
| **Won/Lost-/Proposal-Cards + Conversion Rate** | Wenn Closes laufen — Funnel-Cards von 4 auf 6 Stufen erweitern.                                                                                                                                                                                                                                              |
| **Revenue / Pipeline-Wert**                    | Lead-Feld `deal_value` einführen, dann Pipeline-Wert + Forecast.                                                                                                                                                                                                                                             |
| **Header-Search + globaler Lead-Detail-Panel** | Eigener Folge-Plan. Hot-Leads-Klick (Task 7) ersetzt sich dadurch transparent.                                                                                                                                                                                                                               |

## Kritische Dateien (zum Anfassen)

**Schema/Constants:**

- `packages/common/src/constants/contact/contact-lead-statuses.ts` (Task 0)
- `packages/db/src/record-configuration/leads.ts` (Migration Task 0)
- `packages/db/src/migrations/` (neue Migration in Task 0)

**Routes:**

- `apps/workspace/src/app/[locale]/(app)/page.tsx` (Redirect-Update Task 1)
- `apps/workspace/src/app/[locale]/(app)/dashboard/page.tsx` (neu, Task 1)

**Server (alle neu):**

- `apps/workspace/src/server/workspace/dashboard/query-handler/*.query-handler.ts` (Tasks 2–9)
- `apps/workspace/src/server/workspace/dashboard/services/range-resolver.ts` (Task 1)

**Shared Contracts (alle neu):**

- `packages/common/src/contracts/dashboard/*.dto.ts`
- `packages/common/src/constants/dashboard/dashboard-ranges.ts`

**Client (alle neu):**

- `apps/workspace/src/components/workspace/dashboard/<modul>/<modul>.tsx` pro Modul

**i18n (alle neu):**

- `apps/workspace/src/i18n/dictionaries/workspace/dashboard/{de,en}.json`

**Wiederverwendung (bestehend):**

- `apps/workspace/src/components/workspace/leads/shared/lead-score-bar/` — in Hot Leads
- `apps/workspace/src/components/workspace/leads/shared/lead-status-badge/` — in Funnel-Cards + Hot Leads
- `apps/workspace/src/components/workspace/leads/shared/lead-source-badge/` — in Source-Performance + Hot Leads
- Bestehende Query-Handler-Patterns aus `apps/workspace/src/server/workspace/leads/query-handler/list-leads.query-handler.ts`
- Activity-Type-Konstanten aus `packages/common/src/constants/leads/activity/lead-activity-types.ts`

## Verifizierung (Definition of Done für jeden Task)

1. `npm run lint` grün
2. `npm run build` grün
3. Vitest grün (neue Tests + Regression)
4. Manueller Browser-Smoke: Modul rendert mit Seed-Daten und mit leerer DB sauber (Empty-States vorhanden)
5. Range-Filter ändert sichtbar das Modul-Ergebnis (URL-SearchParam wird aufgelöst)
6. DE und EN beide funktional und sprachlich konsistent
7. A11y-Smoke: Tab-Navigation, sichtbare Fokus-Styles, ausreichender Kontrast in Dark + Light
8. PR-Beschreibung enthält Screenshot des Moduls (Dark + Light)

## Verifizierung (Definition of Done für das Gesamt-Feature)

- Alle 11 Tasks gemerged, jeder einzeln verifiziert
- Playwright Smoke `/de/dashboard` + `/en/dashboard` grün
- Backlog-Dokument (`apps/workspace/CLAUDE.md` oder eigener `dashboard/CLAUDE.md`) enthält Stale-Leads-Prerequisite-Notiz und Header-Search-Folge-Plan-Verweis
- Architektur-Gate (Root `AGENTS.md`): keine Regelverstöße — i18n korrekt, keine Inline-Texte, keine binären Locale-Fallbacks, Const-Objekt-Pattern, error-co-location, URL-Pfade aus `SITE_ROUTES`
