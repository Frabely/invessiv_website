# AGENTS.md — Invessiv (Root)

Diese Datei enthält ausschließlich **projektweit gültige** Regeln, die immer bedacht werden müssen.
Scope- und detailspezifische Regeln stehen in der jeweils nächstgelegenen `AGENTS.md`/`CLAUDE.md` im Ordnerbaum
(siehe Index unten). Im Zweifel dort nachschlagen, nicht hier duplizieren.

## Sprachregel

- Der Inhalt aller `AGENTS.md`-Dateien im Projekt wird auf Deutsch gepflegt.

## Geltung & Vorrang

- Es gilt zuerst die `AGENTS.md` im jeweiligen Ordner oder im nächstgelegenen Elternordner; die **spezifischste** Datei
  im Pfad hat Vorrang.
- Liegen mehrere `AGENTS.md` im Pfad, werden sie von außen nach innen gelesen; die engere Datei ergänzt oder präzisiert
  die allgemeinere.
- Jeder Unterordner darf eine eigene `AGENTS.md`/`CLAUDE.md` haben; der Index unten listet die wichtigsten Scopes, ist
  aber nicht abschließend.

## Index der scope-spezifischen Dateien

| Scope                                            | Worum es geht                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/[locale]/(marketing)/`         | Marketing-Routen, Route-Gruppen, SEO, i18n, interne Service-Verlinkung                                          |
| `apps/web/src/components/`                       | UI-Komponenten: Ordnerstruktur, `*.module.css`, Client/Server-Schnitt                                           |
| `apps/web/src/client/`                           | Clientseitige Services                                                                                          |
| `apps/<app>/src/lib/`, `apps/<app>/src/hooks/`   | Logik/Hooks: exportierte Typen/Konstanten/Patterns nach `common`; rein lokale (nicht exportiert) dürfen bleiben |
| `apps/web/src/server/` (+ `linkedin-post/`)      | Server-Handler, Service-Objekte, DB-Grenze                                                                      |
| `apps/web/common/`                               | App-shared Contracts/Constants/Defaults                                                                         |
| `apps/workspace/src/app/[locale]/(auth)/`        | Öffentliche Clerk-Auth-Routen                                                                                   |
| `apps/workspace/src/app/[locale]/(app)/leads/`   | Geschützter Leads-Bereich: Auth-Gate, Allowlist, noindex/dynamic                                                |
| `apps/workspace/src/components/workspace/leads/` | Geschützte Workspace-Leads-UI                                                                                   |
| `apps/workspace/src/server/`                     | Workspace Command-/Query-Handler, Services, Persistenz-Grenze                                                   |
| `apps/workspace/src/common/`                     | Workspace-shared Contracts/Constants                                                                            |
| `packages/` (`common`, `db`, `ui`)               | Geteilte Pakete: Const-Objekt-Pattern, Error-Codes, DTOs, Drizzle-Schema, app-neutrale UI                       |

> Hinweis: Pfadangaben in dieser Datei beziehen sich auf die jeweilige App-Wurzel (`apps/<app>/src/…`) bzw. auf
> `packages/…`.

## Qualitäts-Gates (verbindlich)

- pnpm-Monorepo: vor Merge grün `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` sowie der App-Build (
  `pnpm --filter @invessiv/web build` bzw. `… @invessiv/workspace build`). Ein Root-`build`-Script existiert nicht.
- Generierter Code (Logik/Workflows) ist durch passende Tests abgedeckt (Unit/Integration/E2E je nach Risiko);
  Kernabläufe durch E2E.
- Kein Direkt-Merge auf `main`; mindestens ein Review. Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`. Small PRs
  mit klarem Scope.
- Security by default: least privilege, keine Secrets im Repo, keine PII in Logs/Analytics.
- Env-Änderungen sind explizit zu dokumentieren: neue Variablen in `.env.example` ergänzen, Server-only vs.
  `NEXT_PUBLIC_*` bewusst trennen und Vercel-/Deployment-Umgebungen synchron halten. Lokale Secret-Dateien (
  `.env*.local`) dürfen nicht als Quelle für committed Werte dienen.
- Conversion-Flows vor Merge prüfen: Formulare haben valide Fehlerzustände (required/Format/Submit-Fehler, auch im
  Mock-Status), kein toter CTA (Ziel + Tracking-Event geprüft), A11y-Smoke mindestens für Startseite + primären
  Conversion-Flow (Keyboard, Fokus-Reihenfolge, Kontrast).

## Globale Qualitätsstandards

- **A11y:** WCAG 2.2 AA; sichtbare Fokus-Styles in allen interaktiven Komponenten.
- **Performance:** Core Web Vitals (LCP/CLS/INP) pro Release prüfen, Lighthouse mobil > 90 (Performance/Best
  Practices/SEO) als Zielwert; keine unnötigen Rendering-Blocker. Server Components als Default, `"use client"` nur bei
  Interaktivität. Bilder über `next/image`. Fonts zentral und sparsam laden; externe Skripte (Calendly, Tracking, Chat)
  nur lazy und nur auf benötigten Seiten.
- **Responsive:** Mobile-first bauen, dann Tablet/Desktop. Desktop-Header/Menu nutzt volle Breite; Gesamtlayout sonst
  zentriert (Ausnahme: Hero, Header/Menu). Desktop-only-Effekte auf Mobile deaktivieren oder ersetzen.
- **SEO/Indexierbarkeit:** semantische Struktur, genau eine H1 pro Seite, crawlbare interne Verlinkung. Pro Route eigene
  `metadata` (Title, Description, Canonical, OpenGraph, ggf. Robots), `sitemap.ts`/`robots.ts`, kontrollierter
  `noindex`. Structured Data (`Organization`, `Service`, `Product`, `FAQ`) wo sinnvoll.
- **Metadata-Title-Konvention:** Startseite `Brand | Kernversprechen`; alle Subseiten `Seitenthema | Brand` (z. B.
  `Projects | Invessiv`). Projektweit konsistent.
- **Theme:** Dark ist Default, Light ist gleichwertig nutzbar (`[data-theme="light"]`); beide Themes konsistent.
  Architektur so halten, dass weitere Themes ohne Umbau möglich sind.
- **CSS Custom Properties:** jede genutzte Variable ist vorher zentral (`:root`) oder im Scope definiert — keine
  impliziten Variablen.
- **UTF-8:** verpflichtend. Deutsche Zeichen (`ä ö ü ß`) als echtes UTF-8; keine ASCII-Umschreibungen (`ae/oe/ue`) in
  finalem UI-Text. Encoding-Artefakte (`�`, `Ã¤`) vor Abschluss bereinigen.
- **Kommentare/Docstrings:** Keine erklärenden Inline- oder Blockkommentare im Quellcode. Docstrings/JSDoc nur, wenn sie
  eine öffentliche API oder nicht offensichtliches Verhalten dokumentieren, und dann ausschließlich auf Englisch.
  Technisch notwendige Tool-Direktiven (z. B. `@vitest-environment`, ESLint- oder TypeScript-Direktiven) sind davon
  ausgenommen und werden nur so eng wie nötig eingesetzt.
- **Routen-Slugs** standardmäßig Englisch (`/terms`, `/privacy`, `/imprint`), auch bei deutschem UI-Text. Kanonischer
  AGB-Pfad ist immer `/terms` (nicht `/agb`).

## Design & Branding (verbindlich)

- Logo ist Pflichtinput; Farbgebung optional (ohne Vorgabe kontraststarke, thematisch passende Palette).
- Aktiv individuelles Design mit Wiedererkennungswert einbringen, Default-/Generic-Implementierungen vermeiden;
  Conversion- und Performance-orientiert arbeiten.
- **Effektbibliothek (Ressource, keine Pflicht):** Unter `animation_mockups/` (Katalog: `effects-catalog.json`) liegen
  wiederverwendbare Animations-/Interaktions-Mockups. Bei klarem Fit bevorzugt adaptieren statt zwanghaft neu zu bauen —
  kein Pflicht-Check pro Task und kein Vorrang vor besserem, maßgeschneidertem Design. Konventionen & Wann-nutzen:
  `apps/web/src/components/AGENTS.md`.
- **Pflicht-Skills:** Bei Frontend-Umbauten mindestens `frontend-design`; bei Text-/Copy-/Marketing-/SEO-Änderungen
  projektweit `copywriting` (inkl. UI-Texte, CTAs, Microcopy, Meta-/OpenGraph, strukturierte Content-Daten).
- Mockups sind nur Zwischenartefakte; Ziel ist die produktionsreife Umsetzung. Große Tasks in kleine, prüfbare
  Teilaufgaben splitten; jede Section einzeln planen.
- Mock-/Platzhalter-States immer sichtbar kennzeichnen (`Mock`, `Coming Soon`); kein irreführendes Verhalten.

## Architektur-Prinzipien (global)

Detailregeln stehen in den scope-spezifischen Dateien (siehe Index). Global gilt:

- Struktur sauber und modular halten: keine überfüllten Sammelordner; bei steigender Dichte nach Verantwortung
  aufteilen.
- Verantwortlichkeiten trennen: UI, Domain-Logik, Konfiguration und Telemetrie nicht vermischen. Keine Business-Logik in
  UI-Komponenten verstecken.
- Route-Dateien (`page.tsx`) orchestrieren nur — keine großen Render-Switches, keine sprach-/datenlastige Inline-Logik.
  Wiederkehrende UI-Interaktionslogik (Scroll/Pointer/Observer/Motion) in Hooks (`src/hooks/**`) kapseln.
- Lange/monolithische Dateien frühzeitig in kleine, klar abgegrenzte Einheiten aufsplitten.
- **Export entscheidet über den Ort von Typen/Konstanten/Patterns.** Ein Typ, eine Konstante, eine Objekt-Map oder ein
  Pattern darf lokal in der eigenen Datei (Komponente, `lib/`, `hooks/`, `client/`, `server/`) stehen, **solange er nur
  dort genutzt und nicht exportiert wird** (z. B. der eigene `XxxProps`-Type einer Komponente, ein rein lokaler
  Helfer-Type oder eine datei-interne Map). **Sobald ein `export` nötig wird (Nutzung in einer anderen Datei), wird der
  Baustein vorher nach `common` verschoben** — kein `export` von Typen/Konstanten/Patterns aus Komponenten- oder
  Logik-Dateien. Ziel ist `packages/common` (app-übergreifend) bzw. `apps/<app>/common` (app-spezifisch):
  `contracts/` für Typen/DTOs/Shapes, `constants/` für String-Unions/Werte/Maps, `defaults/` für Defaults,
  `patterns/` für seiteneffektfreie Helfer. String-Unions/Enums ausschließlich per **Const-Objekt + abgeleitetem Type**
  (kein `enum`). Details & Beispiele: `apps/web/src/components/AGENTS.md`, `packages/common/AGENTS.md`.
- **Error-Codes** als Const-Objekt in `…/constants/<domain>/`, Message-Texte nur in co-located `*-error.ts` der
  Nutzungsschicht. **URL-Pfade** ausschließlich aus typisierten Konstanten (`SITE_ROUTES` in `src/config/routes.ts`) /
  Pfad-Helfern zusammenbauen, nie aus mehreren String-Literalen.
- **Styling:** kein Inline-Styling und keine neuen globalen Komponentenklassen; neue Komponenten nutzen co-located
  `*.module.css` oder triviale Tailwind-Utilities. `globals.css` bleibt schlank (Tokens, Reset/Base, globale Utilities).
  Token zentral definieren.
- Strikte Typisierung; keine `any`-Workarounds ohne dokumentierten Grund. Feature-Flags für unfertige Flows statt
  halbfertiger Produktivlogik. `NEXT_PUBLIC_*` nur für wirklich öffentliche Werte.
- Neue Dependencies nur bei klarem Nutzen hinzufügen: zuerst vorhandene Plattform-, Repo- und Package-APIs prüfen,
  Bundle-/Security-Auswirkungen abwägen und unnötige Überschneidungen mit bestehenden Libraries vermeiden.
- Import-Grenzen respektieren: Apps importieren geteilte Bausteine über Package-Exports oder definierte Aliases, nicht
  über relative Pfade in `packages/**`; app-spezifischer Code wird nicht aus `packages/**` importiert.

### Architektur-Gate (verbindlich)

- Beim Entwickeln/Refactoring aktiv prüfen, ob die Regeln eingehalten sind. Verstößt eine geplante Änderung gegen eine
  Regel, **nicht stillschweigend weiterbauen**: zuerst den Nutzer fragen, ob sofort beheben oder bewusst verschieben.
- Bei Verschiebung: Stelle mit Dateipfad, Regelbezug, Risiko und nächstem Schritt dokumentieren.

## i18n / Dictionaries (verbindlich)

- Dictionaries liegen in `src/i18n/dictionaries/<locale>.json` (pro App); Laden serverseitig über
  `src/i18n/get-dictionary.ts` (`server-only`).
- Sämtliche sprachabhängigen UI-/SEO-Texte liegen ausschließlich in Dictionaries — keine Inline-Texte in `page.tsx`,
  Layouts oder Komponenten.
- Neue/geänderte Copy immer für **alle** unterstützten Sprachen parallel pflegen; kein Merge mit veralteten
  Sprachständen.
- **Keine binären Locale-Branches** (`locale === "de" ? … : …`) für Inhalte, SEO/Structured-Data oder
  Drittanbieter-Configs (z. B. Clerk `deDE`/`enUS`). Stattdessen locale-keyed Dictionaries oder
  `Record<SupportedLocale, …>`-Mappings mit identischen Keys, damit >2 Sprachen ohne Umbau möglich sind.
- Wird ein Sprachfile zu groß, fachlich aufteilen (`legal`, `home`, `services`, `footer`, …). Key-Konvention: Namespace
  pro Seite/Domain, konsistente Unterteilung in `meta`/`page`/`sections`/`labels`/`values`.
- **Neue Sprache hinzufügen:** Locale in `SUPPORTED_LOCALES` (`src/config/i18n.ts`) ergänzen → Dictionary mit
  identischen Keys anlegen → prüfen, dass `alternates.languages`, Language-Switch und Metadata korrekt aufgelöst werden.

## Arbeitsweise & Reviews

- Senior-Vorgehen: erst Scope/Abhängigkeiten/Risiken festziehen, dann in kleinen reviewbaren Schritten liefern; Tests
  früh anlegen; Refactoring kontinuierlich einplanen.
- Lokal fokussiert testen (betroffene Unit-/Integration-/E2E-Tests zuerst); vor PR/Merge gelten die vollständigen
  Qualitäts-Gates aus dieser Datei.
- Temporäre Artefakte (Mockups, Screenshots, Reports, Exporte, Pläne) nur committen, wenn sie fachlich gebraucht werden.
  Sonst außerhalb des Produktivcodes halten oder vor Abschluss bereinigen.
- PR enthält: Was/Warum, Screenshots (bei UI), Testplan, Risiko/Rollback, Security/Privacy-Impact.
- Definition of Done: Akzeptanzkriterien erfüllt, relevante Tests grün, Security-/A11y-Auswirkungen geprüft,
  Monitoring/Logging für neue kritische Flows vorhanden, Rollback-Pfad im PR beschrieben.
- Kritische User-Flows mit strukturierten Events versehen (CTA-Klick, Formular-Submit) und Fehlerpfade observierbar
  halten; jede neue kritische Integration mit dokumentiertem Fallback.
