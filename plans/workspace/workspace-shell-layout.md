# Plan: Workspace Shell — Header, Sidebar, Background

## Context

Das Auth-/Routing-Skelett aus `plans/workspace/clerk-auth-and-workspace-shell.md` (Tickets 1–7) hat eine minimale `WorkspaceShell` produziert, die nur Headline + Sub-Copy auf `/[locale]/workspace` rendert. Dieser Plan baut die persistente visuelle Chrome (Header, Sidebar, Background) für den geschützten Workspace-Bereich. Sie wird im gemeinsamen `workspace/layout.tsx` angesiedelt, damit jede künftige Sub-Route automatisch dieselbe Hülle erbt.

**Ergebnis nach diesem Plan:**

- `/[locale]/workspace` zeigt sticky Header (Brand · Search · Theme · Locale · UserButton) und Sidebar (Desktop: Icon-Rail mit Hover-Expand auf Labels; Mobile: Hamburger + Drawer)
- Inhaltsbereich in der Mitte ist visuell leer, mit reduziertem Hero-Style-Background (Grid + dezente Orange-/Blau-Blobs)
- Brand führt zurück zu `/[locale]/workspace`
- Search-Input ist visuell vollwertig, aber `disabled` mit „Coming soon"-Hint — keine Funktionalität
- Sidebar enthält 2 visuelle Platzhalter-Einträge (`Leads`, `Übersicht`) als disabled/grayed Items
- Logout über Clerk `<UserButton>` rechts im Header
- DE und EN parallel im Workspace-Dictionary gepflegt
- Bestehender Auth-Gate (Layer 2 in `workspace/layout.tsx`) bleibt unangetastet

**Bewusst NICHT in Scope:**

- Echte Navigationsziele oder Sub-Routen (`/[locale]/workspace/leads` etc.)
- Funktionierende Lead-Suche (kommt mit Daten-Layer in eigenem Ticket)
- Persistierter Sidebar-Zustand (collapsed/expanded) zwischen Sessions — Hover reicht
- Rollen-/Permission-basiertes Filtern der Sidebar-Items
- Notification-Center, Avatar-Customization, Breadcrumbs
- Custom Clerk `appearance`-Theming für UserButton (Default akzeptieren, anheben sobald visuell stört)

---

## Bestätigte Entscheidungen aus den Rückfragen

| Frage                                 | Entscheidung                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Shell-Position                        | `src/app/[locale]/workspace/layout.tsx` wickelt `{children}` in `<WorkspaceShell>` ein                                            |
| Was passiert mit Headline + Sub-Copy? | **Komplett entfernen** (Variante a). Workspace-Mitte bleibt visuell leer; nur Background sichtbar                                 |
| Header-Inhalte                        | Brand · Search (disabled) · **Theme-Switch** · Locale-Switch · **Clerk `<UserButton>`**                                           |
| Brand-Link Ziel                       | `/[locale]/workspace` (locale-aware)                                                                                              |
| Search-Bar                            | Visuell vollwertig (Input + Lupe + Placeholder + „Coming soon"-Hint), `disabled`, kein Form-Submit, Copy aus Dict                 |
| Sidebar Desktop (≥1024px)             | Icon-Rail (~64 px), auf `:hover` / `:focus-within` Expand auf ~240 px mit Labels                                                  |
| Sidebar Mobile (<1024px)              | Off-Canvas Drawer, Hamburger-Button im Header, schließt per Backdrop/Escape                                                       |
| Sidebar-Items                         | 2 visuelle Platzhalter, disabled (gray), `aria-disabled="true"`, Copy aus Dict (`Leads`, `Übersicht`)                             |
| Background                            | Reduzierte Hero-Variante: Grid + dezente Orange-/Blau-Blobs (niedrige Opacity), **kein Mask-Fade**, **kein Hero-Visual-Shot**     |
| i18n                                  | Erweiterung des bestehenden Workspace-`page`-Dicts um `shell.*`-Namespace (Header, Sidebar, Search, Main); DE+EN im selben Commit |
| Skills                                | Nutzer ruft `frontend-design` / `copywriting` / `accessibility` selbst auf, sobald implementiert wird; dieser Plan ist Skill-frei |

---

## Ziel-Ordnerstruktur (Δ)

```
src/
├── app/
│   └── [locale]/
│       └── workspace/
│           ├── layout.tsx                          # ÄNDERUNG — wrappt children in <WorkspaceShell>
│           └── workspace/
│               └── page.tsx                       # ÄNDERUNG — keine Headline/Sub-Copy mehr, leerer main
│
├── components/
│   ├── workspace/
│   │   ├── workspace-shell/                       # ÄNDERUNG
│   │   │   ├── workspace-shell.tsx                # akzeptiert children, rendert Background-Divs inline + Header/Sidebar/Main
│   │   │   └── workspace-shell.module.css         # Grid-Layout (Sidebar | Main), Header sticky, Background-Klassen
│   │   ├── workspace-header/                      # NEU
│   │   │   ├── workspace-header.tsx               # client wrapper (Hamburger-Toggle), komponiert Brand/Search/Actions
│   │   │   └── workspace-header.module.css
│   │   ├── workspace-search/                      # NEU
│   │   │   ├── workspace-search.tsx               # disabled <input>, Lupen-Icon, „Coming soon"-Hint
│   │   │   └── workspace-search.module.css
│   │   └── workspace-sidebar/                     # NEU
│   │       ├── workspace-sidebar.tsx              # client (hover/focus-within, Drawer)
│   │       ├── workspace-sidebar.module.css       # Desktop Icon-Rail + Mobile Drawer
│   │       └── workspace-sidebar-items.ts         # statische Items + Lucide/Inline-SVG-Icons
│
├── hooks/
│   └── workspace/
│       └── use-workspace-sidebar-drawer.ts        # NEU — open/close-State, Escape-Listener, Body-Scroll-Lock
│
└── i18n/
    └── dictionaries/
        └── workspace/
            └── page/
                ├── de.json                        # ÄNDERUNG — `shell.*` ergänzt; `headline`/`subCopy` entfernt
                └── en.json                        # ÄNDERUNG — selbe Keys
```

**Begründung:**

- **Mehrere kleine Komponenten statt Monolith**: Header und Sidebar haben unabhängige Lifecycles und Reuse-Pfade (Sidebar bekommt später Items, Header bekommt UserButton-Erweiterungen). Die `WorkspaceShell` bleibt ein dünner Compositor.
- **Background NICHT als eigene Komponente**: 3 dekorative Divs (2 Blobs + Grid) ohne Logik, ohne Props, einmal verwendet. Eigener Folder + `.tsx` + `.module.css` wäre Over-Engineering. Markup landet inline in `workspace-shell.tsx`, Styles in `workspace-shell.module.css`. Falls die CSS-Datei zu groß wird, später nach `workspace-shell-background.module.css` extrahieren.
- **Hook für Drawer-State**: Hamburger-Button im Header und Drawer in Sidebar müssen synchronisieren. Zwei Optionen — gemeinsamer State im `<WorkspaceShell>` per `useState` und Prop-Drilling, oder Hook + Context. Wir nehmen **Prop-Drilling**, weil die Komponenten direkt nebeneinander leben und ein Context für einen Boolean Overkill ist. Der Hook kapselt nur Escape-Listener + Body-Scroll-Lock.
- **`workspace-sidebar-items.ts` statisch**: Items sind heute Platzhalter, später echte Routen. Eigene Datei vermeidet, dass Render-File und Daten-Definition vermischen.

---

## i18n-Plan

### Erweiterung `src/i18n/dictionaries/workspace/page/de.json`

```json
{
  "shell": {
    "header": {
      "brandLabel": "Invessiv",
      "brandLogoAlt": "Invessiv Logo",
      "brandHomeAriaLabel": "Zum Workspace-Start",
      "search": {
        "label": "Leads suchen",
        "placeholder": "Leads suchen…",
        "comingSoonBadge": "Bald verfügbar",
        "disabledHint": "Lead-Suche kommt mit dem nächsten Release."
      },
      "localeMenuLabel": "Sprache wählen",
      "localeSwitchLabel": "Sprache wechseln",
      "themeSwitch": {
        "actionLabel": {
          "dark": "Hellen Modus aktivieren",
          "light": "Dunklen Modus aktivieren"
        }
      },
      "userMenuLabel": "Konto und Abmelden",
      "mobileMenuOpenLabel": "Navigation öffnen",
      "mobileMenuCloseLabel": "Navigation schließen"
    },
    "sidebar": {
      "navAriaLabel": "Workspace-Navigation",
      "comingSoonBadge": "Bald verfügbar",
      "items": {
        "leads": "Leads",
        "overview": "Übersicht"
      }
    },
    "main": {
      "ariaLabel": "Workspace-Inhalt"
    }
  }
}
```

### Erweiterung `src/i18n/dictionaries/workspace/page/en.json`

```json
{
  "shell": {
    "header": {
      "brandLabel": "Invessiv",
      "brandLogoAlt": "Invessiv logo",
      "brandHomeAriaLabel": "Back to workspace home",
      "search": {
        "label": "Search leads",
        "placeholder": "Search leads…",
        "comingSoonBadge": "Coming soon",
        "disabledHint": "Lead search arrives with the next release."
      },
      "localeMenuLabel": "Select language",
      "localeSwitchLabel": "Switch language",
      "themeSwitch": {
        "actionLabel": {
          "dark": "Switch to light mode",
          "light": "Switch to dark mode"
        }
      },
      "userMenuLabel": "Account and sign out",
      "mobileMenuOpenLabel": "Open navigation",
      "mobileMenuCloseLabel": "Close navigation"
    },
    "sidebar": {
      "navAriaLabel": "Workspace navigation",
      "comingSoonBadge": "Coming soon",
      "items": {
        "leads": "Leads",
        "overview": "Overview"
      }
    },
    "main": {
      "ariaLabel": "Workspace content"
    }
  }
}
```

**Wichtig:**

- **`headline` und `subCopy` werden komplett entfernt**, weil sie ab diesem Ticket nicht mehr gerendert werden. Type `WorkspacePageContent` leitet sich von `de.json` ab — Tests/Components, die noch auf die Felder zugreifen, müssen mit angepasst werden.
- Keine Locale-Branches im Code: Theme-/Locale-Strings werden über `Record<SupportedLocale, ...>` Konsum oder direkten Dict-Zugriff aufgelöst.

---

## Implementierungs-Tickets

> Alle Tickets folgen `plans/workspace/clerk-auth-and-workspace-shell.md` Abschnitt 2 (ein Ticket pro Schritt, Plan-Modus zuerst, Commits nur auf Ansage).

### Ticket 1 — Workspace-Copy strukturieren

- `src/i18n/dictionaries/workspace/page/{de,en}.json`: den `shell`-Namespace ergänzen und `headline` sowie `subCopy` entfernen.
- `src/i18n/dictionaries/workspace/index.ts`: keine API-Änderung nötig; `WorkspacePageContent` bleibt aus `de.json` abgeleitet.
- Verbleibende Zugriffe auf `content.headline` und `content.subCopy` identifizieren und für die Folge-Tickets markieren, mindestens in `workspace-shell.tsx`, `workspace/page.tsx` und den zugehörigen Tests.
- **Acceptance:** `npm run typecheck` zeigt nur die erwarteten Fehlerstellen in den Dateien, die in Ticket 5 angepasst werden. DE und EN haben dieselbe Key-Struktur.

### Ticket 2 — `WorkspaceSearch`

- Neue Komponente `src/components/workspace/workspace-search/workspace-search.tsx` (kann Server Component bleiben — keine Interaktion).
- Markup: `<form role="search">` (kein Action), darin `<label class="sr-only">` + `<input type="search" disabled aria-disabled="true">` + `<span>` mit „Coming soon"-Badge.
- Lupen-Icon als inline SVG.
- Styling: gefülltes Surface, sichtbarer Disabled-Zustand (Opacity ~0.7, kein Cursor-Pointer), Badge in dezenter Akzentfarbe (orange tint).
- Copy aus `content.shell.header.search` durchreichen.
- **Acceptance:** Input ist nicht fokussierbar, Screen-Reader liest Label + Hint, visuell klar als „inaktiv" erkennbar, Hint sichtbar oder als Tooltip via `title`-Attribut.

### Ticket 3 — `useWorkspaceSidebarDrawer` Hook

- `src/hooks/workspace/use-workspace-sidebar-drawer.ts`:
  - Exportiert `{ isOpen, open(), close(), toggle() }`.
  - Bei `isOpen === true`: Escape-Key schließt; `document.body` bekommt `overflow: hidden` (Body-Scroll-Lock).
  - SSR-safe (kein direkter `document`-Zugriff im Render).
- Unit-Test `use-workspace-sidebar-drawer.test.ts` (Vitest + Testing Library): open/close/toggle, Escape, Body-Lock-Effect.
- **Acceptance:** Tests grün, Hook hat keine Memory-Leaks (Cleanup im `useEffect`).

### Ticket 4 — `WorkspaceSidebar`

- `src/components/workspace/workspace-sidebar/workspace-sidebar-items.ts`:
  - Statisches Array `[{ id, labelKey, iconSvg }]` für `leads` und `overview`.
  - Icons als inline SVG-Komponenten (analog `LocaleSwitch`).
- `src/components/workspace/workspace-sidebar/workspace-sidebar.tsx` (`"use client"`):
  - Props: `{ content, isOpen, onCloseAction }` (Drawer-State kommt vom Header via `WorkspaceShell`).
  - Markup: `<aside>` mit `<nav aria-label={content.shell.sidebar.navAriaLabel}>`.
  - Items als `<a aria-disabled="true" tabindex="-1" role="link">` mit Icon + Label + „Coming soon"-Badge.
  - Mobile-Drawer: `role="dialog" aria-modal="true"` wenn offen; Backdrop schließt; Close-Button mit `aria-label`.
- `workspace-sidebar.module.css`:
  - Desktop: `position: fixed; inset: 0 auto 0 0; width: 64px;`, auf `:hover` / `:focus-within` `width: 240px` mit Transition (`transform`/`width` — bevorzugt `width`, weil Items darunter den Platz brauchen).
  - Label-Visibility: Opacity-Übergang an `width`-Wechsel gekoppelt (oder via `:where(.sidebar:hover) .label`).
  - Mobile: standardmäßig `transform: translateX(-100%)`, mit Backdrop. Bei `data-open="true"`: `translateX(0)`.
  - `@media (prefers-reduced-motion: reduce)`: keine Width-/Transform-Transitions.
- **Acceptance:** Desktop-Hover/Focus klappt expand sauber, Mobile-Drawer öffnet/schließt via Hamburger und Backdrop, Items sind nicht klickbar (disabled), Tab-Reihenfolge skipt sie.

### Ticket 5 — `WorkspaceHeader`

- `src/components/workspace/workspace-header/workspace-header.tsx` (`"use client"`, da `useLanguage`/`useTheme` Hooks verbraucht):
  - Props: `{ content, locale, onMobileMenuToggleAction, isMobileMenuOpen }`.
  - Layout: Brand links · Search mittig (flex-grow auf Desktop, ausgeblendet auf <640 px) · Actions rechts (ThemeSwitch, LocaleSwitch, UserButton).
  - Hamburger-Button nur sichtbar `<1024 px`.
  - Brand: `<a>` mit `next/image` (`/brand/icon.png`, 26×26, `priority`) + Span. `href={\`/${locale}/workspace\`}`.
  - LocaleSwitch: identisch zu Marketing-Header (eigene `handleLocaleSelect`-Logik analog `site-header.tsx`).
  - ThemeSwitch: identisch zu Marketing-Header.
  - UserButton: `<UserButton afterSignOutUrl={\`/${locale}\`} />`aus`@clerk/nextjs`.
  - Sticky: `position: sticky; top: 0; z-index: 20;` mit Backdrop-Filter (analog Marketing-Header).
- `workspace-header.module.css`:
  - Eigene Tokens für Surface-Background, Border-Bottom, Padding.
  - Hamburger-Icon analog Marketing-Header (drei Striche, animiert zu „X" wenn `isMobileMenuOpen`).
- **Acceptance:** Alle 5 Slots sichtbar/funktional auf Desktop; auf Mobile zeigt nur Brand + LocaleSwitch + UserButton + Hamburger; Theme- und Locale-Wechsel funktionieren; UserButton-Menü zeigt Clerk-Default mit „Sign out".

### Ticket 6 — `WorkspaceShell` als Wrapper (inkl. Background)

- Refactor `src/components/workspace/workspace-shell/workspace-shell.tsx`:
  - Wird `"use client"` (wegen Drawer-State).
  - Props: `{ content: WorkspacePageContent, locale: Locale, children: ReactNode }`.
  - `useWorkspaceSidebarDrawer()` für Drawer-State.
  - Komposition:
    ```tsx
    <div className={styles.shell}>
      <div aria-hidden="true" className={styles.background}>
        <div className={styles.blobOrange} />
        <div className={styles.blobBlue} />
        <div className={styles.grid} />
      </div>
      <WorkspaceHeader
        content={content}
        locale={locale}
        isMobileMenuOpen={isOpen}
        onMobileMenuToggleAction={toggle}
      />
      <WorkspaceSidebar
        content={content}
        isOpen={isOpen}
        onCloseAction={close}
      />
      <main
        id="main-content"
        aria-label={content.shell.main.ariaLabel}
        className={styles.main}
      >
        {children}
      </main>
    </div>
    ```
- `workspace-shell.module.css`:
  - `.shell` als Grid-Container mit `grid-template-columns: 64px 1fr` auf Desktop, `1fr` auf Mobile; `min-height: 100dvh`; `position: relative; overflow-x: hidden;` für die Background-Container.
  - `.background`: `position: absolute; inset: 0; z-index: 0; pointer-events: none;`.
  - `.blobOrange` / `.blobBlue`: Radial-Gradient-Blobs (orange/blau analog Hero-Tokens), Opacity ≤ 0.22 dark / ≤ 0.16 light, langsame Drift-Animation, `pointer-events: none`. Keine 3. Blob-Lage, kein Hero-Visual-Shot, kein Mask-Fade.
  - `.grid`: 58 px Raster aus `linear-gradient` mit `color-mix(--color-border)`, Opacity 0.10 dark / 0.08 light.
  - `[data-theme="light"]`-Override für Token-Werte (analog `hero-visual.module.css`).
  - `@media (prefers-reduced-motion: reduce)`: keine Drift-Animationen.
  - `.main` bekommt `padding: clamp(...)` analog Marketing-Sektionen, ist relativ positioniert (z-index ≥ 1, damit über Background).
  - Sticky-Header sitzt `position: sticky` innerhalb der Grid-Spalte.
- Bestehende Headline/SubCopy-Klassen werden entfernt.
- **Acceptance:** Shell rendert mit beliebigen `children`, Layout stabil bei Sidebar-Hover (Sidebar `position: fixed`, kein Layout-Shift), `main` ist erreichbar via Skip-Link, Background sichtbar mit korrekten Theme-Tokens, prefers-reduced-motion deaktiviert Drift.

### Ticket 7 — Layout + Page integrieren

- `src/app/[locale]/workspace/layout.tsx`:
  - Nach `await requireWorkspaceAccess(activeLocale)` Dictionary laden: `const content = getWorkspacePageContent(activeLocale);`
  - `<WorkspaceShell content={content} locale={activeLocale}>{children}</WorkspaceShell>` zurückgeben.
  - Bisherige `<main id="main-content">{children}</main>` wird entfernt — der `<main>` lebt jetzt **innerhalb** der Shell.
- `src/app/[locale]/workspace/page.tsx`:
  - `<WorkspaceShell content={...} />` Aufruf entfernen.
  - Render-Output: `null` oder leeres Fragment. Page ist jetzt rein für Metadata + zukünftigen Content da; die Shell kommt aus dem Layout.
- **Acceptance:** `/de/workspace` und `/en/workspace` zeigen die Shell mit leerer Mitte; `noindex` bleibt; `dynamic = "force-dynamic"` bleibt; Auth-Gate bleibt aktiv.

### Ticket 8 — Tests + Pre-merge Gates

- `src/hooks/workspace/use-workspace-sidebar-drawer.test.ts`: open/close/toggle, Escape, Body-Lock.
- Bestehender Test `workspace-shell.test.*` (falls vorhanden) anpassen oder löschen — neue, kleinere Tests:
  - `workspace-search.test.tsx`: Disabled-State, Hint sichtbar, kein Submit möglich.
  - `workspace-sidebar.test.tsx`: Mobile-Drawer-Toggle via Prop, disabled Items skippen Tab-Order.
- E2E (optional, nur wenn schnell machbar): `e2e/workspace-shell.e2e.ts` — eingeloggter Owner sieht Header + Sidebar, Hamburger toggelt.
- Gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test` grün.
- **Acceptance:** Alle Gates grün, manueller Smoke-Test (siehe Testplan) bestanden.

---

## Testplan

### Manuelle Test-Szenarien (lokal mit Owner-Account)

| #   | Szenario                                           | Erwartetes Verhalten                                                                                      |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Owner einloggen → `/de/workspace`                  | Header (Brand + Search disabled + Theme + Locale + UserButton) sichtbar; Sidebar als Icon-Rail links      |
| 2   | Sidebar mit Maus hovern (Desktop)                  | Sidebar expandiert auf 240 px, Labels „Leads" / „Übersicht" werden sichtbar; Items sind disabled (gray)   |
| 3   | Tab-Navigation durchgehen                          | Disabled Sidebar-Items werden übersprungen; Search-Input bekommt keinen Fokus; Brand und Actions fokusbar |
| 4   | Locale-Switch DE → EN                              | URL bleibt `/workspace`, alle Header-/Sidebar-Texte werden Englisch, kein Layout-Sprung                   |
| 5   | Theme-Switch dark → light                          | Background-Tokens, Header-Surface, Sidebar-Surface wechseln; Animationen bleiben smooth                   |
| 6   | UserButton klicken → „Sign out"                    | Clerk-Logout läuft, Redirect zu `/de` (oder gewählter Locale-Home)                                        |
| 7   | Mobile (<1024 px) öffnen                           | Sidebar nicht sichtbar, Hamburger-Button im Header sichtbar                                               |
| 8   | Hamburger klicken                                  | Drawer slidet von links rein, Backdrop sichtbar, Body scrollt nicht mehr                                  |
| 9   | Backdrop klicken oder Escape drücken               | Drawer schließt, Body-Scroll wieder aktiv                                                                 |
| 10  | Brand-Klick                                        | Navigiert zu `/[currentLocale]/workspace`                                                                 |
| 11  | View-Source `/de/workspace`                        | `<meta name="robots" content="noindex,nofollow">` weiterhin gesetzt                                       |
| 12  | DevTools → `prefers-reduced-motion: reduce`        | Background-Blobs driften nicht mehr, Sidebar/Drawer öffnen sich ohne Slide-Animation                      |
| 13  | Nicht eingeloggter User → `/de/workspace`          | Redirect zu `/de/sign-in?redirect_url=...` (Auth-Gate aus Layer 1 unverändert)                            |
| 14  | Eingeloggter User ohne Allowlist → `/de/workspace` | HTTP 404 (Auth-Gate aus Layer 2 unverändert)                                                              |

### Automatisierte Gates

- `npm run lint` → grün
- `npm run typecheck` → grün
- `npm run test` → grün (inkl. neue Hook- und Component-Tests)
- `npm run build` → grün, kein Static-Generation-Versuch für Workspace-Page
- `npm run test:e2e` → bestehende Tests grün

---

## Risiken & Mitigation

| Risiko                                                                                     | Schwere | Mitigation                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | ------: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Clerk `<UserButton>` ignoriert lokales Theme und sieht im Dark-Mode fremd aus              |  mittel | Default akzeptieren; falls visuell stark störend: `appearance`-Prop in eigenem Folge-Ticket setzen (siehe geplante Erweiterungen)             |
| Sidebar-Hover-Expand triggert auf Touch-Geräten nie                                        | niedrig | Mobile bekommt sowieso Drawer + Hamburger. Touch-Laptop-Edge-Case akzeptiert (man kann auf Item tappen → keine Aktion, kein Schaden)          |
| Body-Scroll-Lock bricht iOS-Safari (klassisches Bug-Pattern)                               |  mittel | Im Hook `overflow: hidden` UND `position: fixed` mit gemerktem `scrollY` setzen; Cleanup restauriert. Test auf iPhone-Simulator               |
| Background-Blobs ziehen Aufmerksamkeit von späteren Charts/Tabellen                        | niedrig | Opacity klein halten (≤ 0.22 dark, ≤ 0.16 light), `pointer-events: none`. Falls Charts kommen: Background ggf. weiter dimmen                  |
| `headline`/`subCopy`-Removal bricht bestehende Tests                                       | niedrig | Tests in Ticket 1 mit anpassen; Type-Errors leiten direkt zu allen Verwendern                                                                 |
| z-index-Konflikte (Sidebar/Drawer/Header/Background)                                       | niedrig | Klare Stacking-Order dokumentieren: Background `z-index: 0`, Main `1`, Sidebar (Desktop) `10`, Header `20`, Drawer-Backdrop `29`, Drawer `30` |
| Sticky-Header verdeckt Skip-Link-Target                                                    | niedrig | `scroll-padding-top` auf `<html>` analog Marketing-Layout setzen oder `<main>` mit `scroll-margin-top` versehen                               |
| Locale-Switch im Workspace wechselt Pfad nicht korrekt (`/de/workspace` ⇄ `/en/workspace`) |  mittel | Logik aus `site-header.tsx` 1:1 übernehmen (Pfad-Segment-Replace). Manuell testen in Szenario 4                                               |

---

## Geplante Erweiterungen (vorbereiten, NICHT bauen)

| Feature                                 | Trigger                                                     | Wo                                                                              |
| --------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Echte Sidebar-Routen                    | Sobald erste Sub-Route existiert (z. B. `/workspace/leads`) | `workspace-sidebar-items.ts` mit Hrefs befüllen, `aria-disabled` entfernen      |
| Funktionierende Lead-Suche              | Sobald Lead-DB-Schema und API stehen                        | `workspace-search.tsx` zu `"use client"` mit Debounce + Server-Action           |
| Custom Clerk `appearance` (UserButton)  | Sobald Default visuell stört                                | `<ClerkProvider appearance={...}>` in `app-providers.tsx`                       |
| Persistierter Sidebar-Collapsed-Zustand | Sobald Owner ihn explizit fordert                           | `localStorage` + Hook + CSS-Variable für Width                                  |
| Breadcrumbs in Header                   | Sobald >1 Sub-Route navigierbar ist                         | Eigene Komponente `workspace-breadcrumbs/`, in Header zwischen Brand und Search |
| Notifications / Activity-Feed           | Wenn echte Events anfallen                                  | Eigene Komponente, rechts neben Search im Header                                |
| Rollen-basierte Sidebar-Filterung       | Sobald Rollen existieren                                    | Filter über `requireRole()`-Helper aus `permissions.ts`                         |

---

## Verweise

- Repo-Root `CLAUDE.md` und `AGENTS.md` — generelle Architektur, i18n, SEO
- `src/app/[locale]/workspace/CLAUDE.md` — Workspace-Architektur, Schutz-Layer, geplante Erweiterungen
- `src/app/[locale]/workspace/AGENTS.md` — Workspace-Pflichtregeln (Auth, i18n, Komponenten)
- `src/components/CLAUDE.md` — Komponenten-Konventionen (Folder-per-Component, separates CSS, Server-by-Default)
- `src/i18n/CLAUDE.md` — Dictionary-Regeln (DE+EN parallel, kein Locale-Branching)
- `plans/workspace/clerk-auth-and-workspace-shell.md` — Vorgänger-Plan, Auth-/Routing-Skelett
- Hero-Background-Referenz: `src/components/marketing/hero-visual/hero-visual.module.css` und `home/sections/hero-section/hero-section.module.css`
- Marketing-Header-Referenz: `src/components/marketing/site-header/site-header.tsx` (Locale-Switch-Pfad-Logik, Theme-Switch, Mobile-Menu-Pattern)
