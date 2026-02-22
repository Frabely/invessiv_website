# AGENTS.md - invessiv (GPT Codex Agents)

## Ziel

Dieses Repository wird mit Agenten-Workflows entwickelt, um:

- konsistente Qualit�t in UX, Code, Security und Compliance zu sichern
- Features in kleinen, �berpr�fbaren PRs auszuliefern
- Regressionen durch klare Tests und Release Gates zu vermeiden

## Grundprinzipien

## Branding & Variation (verbindlich)

- Logo ist Pflichtinput
- Farbgebung ist optional; ohne Vorgabe wird eine thematisch passende, kontraststarke Palette gesetzt
- Immer aktiv neue Ideen fuer individuelles Design mit Wiedererkennungswert einbringen und Default-Implementierungen vermeiden
- Gute neue Animations-/Interaktionsfunde immer in `animation_mockups/<effekt-name>/` als eigenes Einzel-Mockup ablegen (pro Effekt eigener Ordner mit eigener `index.html` und ggf. `styles.css`/`script.js`), statt mehrere Effekte in einer Sammeldatei zu mischen

- Small PRs mit klarem Scope und nachvollziehbaren Commits
- Design zuerst (UX/IA), dann Implementierung
- Accessibility (WCAG 2.2 AA) und Performance (Core Web Vitals) sind Pflicht
- Dark- und Light-Mode sind Pflicht; beide Themes muessen visuell konsistent und voll nutzbar sein
- Mehrsprachigkeit ist Pflichtfaehigkeit: Inhalte und Navigation i18n-ready strukturieren (mindestens DE/EN vorbereiten)
- Security by default (least privilege, keine Secrets im Repo)
- Generierter Code (insbesondere Logik und Workflows) muss durch passende Tests abgedeckt sein (mindestens Unit, Integration oder E2E je nach �nderungsumfang)

## Service-Webseiten Best Practices (Research-basiert)

- Above the fold muss sofort klar sein: Angebot, Zielgruppe und ein prim�rer CTA
- Prim�re Navigation schlank halten (max. 4-6 Hauptpunkte), klare Informationshierarchie
- Content scannbar schreiben: kurze Abs�tze, klare �berschriften, keine Textw�nde
- Vertrauen sichtbar machen: klare Kontaktoption, rechtliche Links, konsistente Sprache
- Prim�re Journey priorisieren: Erstkontakt/Anfrage mit minimalen Schritten
- Mobile-first umsetzen, dann Tablet/Desktop verfeinern; keine �berladenen Sektionen
- Interaktive Elemente mit klaren Zust�nden und sichtbaren Fokus-Styles
- Performance und Lesbarkeit vor dekorativen Effekten priorisieren

## Definition of Ready (DoR)

Ein Ticket ist erst startklar, wenn:

- Zielgruppe, Problem und gew�nschtes Ergebnis klar sind
- Akzeptanzkriterien testbar formuliert sind
- Nicht-Ziele explizit benannt sind
- Risiken/Abh�ngigkeiten dokumentiert sind

## Definition of Done (DoD)

Eine �nderung gilt erst als fertig, wenn:

- Akzeptanzkriterien erf�llt sind
- Unit/Integration/E2E (falls relevant) gr�n sind
- Security- und A11y-Auswirkungen gepr�ft wurden
- Monitoring/Logging f�r neue kritische Flows vorhanden ist
- Rollback-Pfad im PR beschrieben ist

---

## Rollen / Agenten

### 1) Product & UX Agent (`ux-lead`)

Aufgaben:

- Informationsarchitektur (Landing, Templates, Checkout, Legal)
- UX-Flows (Browse -> Details -> Buy -> Download -> Support)
- Copywriting (klar, technisch, vertrauensw�rdig)
- Accessibility Checks (Kontrast, Fokus, Keyboard, Screenreader-Basics)

Outputs:

- User Stories
- Akzeptanzkriterien
- UI States (loading, empty, error, success)

DoD:

- End-to-end-Flow ist dokumentiert
- Edge Cases sind beschrieben (Payment fehlgeschlagen, Refund, Mail nicht angekommen, Link abgelaufen)

### 2) Frontend Agent (`fe-engineer`)

Aufgaben:

- UI-Implementierung (Next.js, Tailwind, Komponenten)
- Performante Animationen und �berg�nge
- SEO (metadata, structured data)
- i18n-ready Architektur (externe Strings, locale routing vorbereitet)
- Responsive Umsetzung f�r Mobile, Tablet und Desktop inkl. sauberer Breakpoints und Layout-Checks

Qualit�tskriterien:

- Lighthouse > 90 (mobile) f�r Performance/Best Practices/SEO
- Kein unn�tiges JS, optimierte Bilder, sinnvolle Caching-Strategie
- Sichtbare Fokus-Styles in allen interaktiven Komponenten
- Visuelle und funktionale Konsistenz �ber Mobile/Tablet/Desktop in allen Core Flows

### 3) Backend Agent (`be-engineer`)

Aufgaben:

- Payments-Integration (Stripe Checkout + Webhook)
- Entitlements (wer darf welche Datei laden)
- Lizenzmodell (single purchase, bundle, subscription)
- Download-Security (signed URLs, rate limiting)

Qualit�tskriterien:

- Webhook idempotent, retry-safe und observierbar
- Keine PII in Logs, strukturierte Events
- Fehlerpfade getestet (timeout, duplicate events, payment pending)

### 4) Security & Compliance Agent (`sec-legal`)

Aufgaben:

- Threat Modeling (Stripe, Auth, Downloads, Abuse)
- DSGVO-Check (Cookies, Tracking, Consent, Retention)
- Rechtstexte (Impressum, Datenschutz, AGB/Terms, Widerruf, Haftung)
- Dependency- und Secret-Scanning

Outputs:

- Security Checklist pro Release
- Minimaler Tracking-Plan (privacy-first)

### 5) QA Agent (`qa`)

Aufgaben:

- Testplan (Unit + Integration + E2E)
- Checkout-E2E (happy path + failure path)
- Regression Suite f�r Core Paths
- A11y-Smoke-Tests

Outputs:

- Playwright Specs
- Release Gates

---

## Standard-Workflows

### Workflow A - Feature Delivery

1. `ux-lead`: User Story, Akzeptanzkriterien, UI States
2. `fe-engineer`/`be-engineer`: technische Spezifikation
3. Implementierung in kleinen PRs
4. `qa`: Tests + E2E + Regression
5. `sec-legal`: Security/Compliance Review
6. Merge + Release Notes

### Workflow B - Bugfix

1. `qa`: Repro Steps + minimal failing test
2. Engineer: Fix + Test
3. `sec-legal`: Security-Relevanz pr�fen
4. Merge

### Workflow C - Hotfix

1. Incident klassifizieren (Severity + Impact)
2. Minimal-invasive Korrektur + Smoke Test
3. Nachgelagerte Root-Cause-Analyse (RCA)
4. Follow-up Ticket zur nachhaltigen Behebung

---

## Branch-/PR-Konvention

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- PR-Template enth�lt:
  - Was/Warum
  - Screenshots (bei UI)
  - Testplan
  - Risiko/Rollback
  - Security/Privacy Impact

## Repo Qualit�ts-Gates

- Lint + Typecheck
- Generierter Code (Logik/Workflows) ist verpflichtend durch Unit-, Integration- oder E2E-Tests abgedeckt
- Playwright E2E (Checkout smoke)
- Dependency Audit
- Secret Scan (pre-commit + CI)

## Merge-Regeln

- Kein Direkt-Merge auf `main`
- Mindestens ein Review bei normalen PRs
- Zwei Reviews f�r Payment, Auth, Download-Security, Legal-�nderungen

## Prompt-Vorlagen

### Implement feature

- Scope:
- Akzeptanzkriterien:
- UI States:
- Data Model �nderungen:
- Testplan:
- Rollback:

### Security review

- Angriffsfl�chen:
- PII/DSGVO:
- Webhook/Payment Risiken:
- Rate limiting/abuse:
- Empfohlene Mitigations:

## Architektur- und Code-Standards (erg�nzend)

- App Router Struktur mit Route-Gruppen verwenden (`(marketing)`, `(legal)`, sp�ter `(app)`), um Verantwortlichkeiten klar zu trennen
- Projektstruktur immer aktiv sauber halten: keine ueberfuellten Ordner, stattdessen fachlich aufteilen und konsistent benennen
- Sobald ein Ordner zu viele Dateien/Verantwortlichkeiten aufnimmt, in Submodule (z. B. pro Feature/Domain) refactoren
- Keine Business-Logik in UI-Komponenten verstecken; Logik in klar benannte Funktionen/Module auslagern
- Strikte Typisierung nutzen: keine `any`-Workarounds ohne dokumentierten Grund
- Theme- und Sprachlogik zentralisieren (z. B. src/config, src/content, src/lib) statt in UI-Komponenten zu verteilen
- Feature-Flags f�r unfertige Flows nutzen, statt halbfertige Logik produktiv zu schalten
- �ffentliche und serverseitige Umgebungsvariablen strikt trennen (`NEXT_PUBLIC_*` nur f�r wirklich �ffentliche Werte)

## Performance- und Rendering-Standards (erg�nzend)

- Server Components als Default, Client Components nur bei Interaktivit�t
- Bilder ausschlie�lich �ber `next/image` (mit klaren Gr��en und sinnvollen `alt`-Texten)
- Fonts zentral und sparsam laden; keine unn�tigen externen Skripte im kritischen Pfad
- Jede neue Seite mit Mobile-Layout zuerst bauen und danach Tablet/Desktop erweitern
- Core Web Vitals pro Release kurz pr�fen (LCP/CLS/INP) und Auff�lligkeiten im PR dokumentieren

## Monitoring- und Betriebsstandards (erg�nzend)

- Kritische User-Flows mit strukturierten Events versehen (z. B. CTA-Klick, Formular-Submit, Checkout-Start)
- Fehlerpfade observierbar halten (z. B. Sentry oder gleichwertig) bevor Payment/Auth live gehen
- Keine PII in Logs oder Analytics Events speichern
- Jede neue kritische Integration mit Fallback-Verhalten dokumentieren (z. B. Mail-Ausfall, Payment-Timeout)

## Content- und Produktpaket-Standards (erg�nzend)

- Verkaufbare Pakete versionieren (`vX.Y.Z`) und mit Changelog ausliefern
- Auslieferungsartefakte unver�nderlich speichern (pro Version ein eindeutiges Bundle)
- Claims in Landing-Copy nur mit belegbaren Quellen/Kennzahlen verwenden
- Mock-States immer sichtbar kennzeichnen (`Mock`, `Coming Soon`), kein irref�hrendes Verhalten

## Next.js + Tailwind Landing-Standards (verbindlich)

- F�r jede Route eigene `metadata` definieren (Title, Description, Canonical, OpenGraph, ggf. Robots)
- Strukturierte Daten (JSON-LD) f�r `Organization` und passende `Service`/`Product`-Typen einplanen
- `sitemap.ts` und `robots.ts` im App Router bereitstellen, sobald mehr als 1 indexierbare Seite live geht
- Interaktive Landing-Elemente nur als Client Components; statische Sections als Server Components belassen
- Keine Inline-Styles f�r produktive Komponenten; Styling konsistent �ber Tailwind-Klassen und Design-Tokens
- Farb-, Spacing- und Radius-Tokens zentral in `globals.css`/Theme definieren, nicht ad hoc pro Komponente
- Komponentenvarianten (z. B. Button/Card/Badge) standardisieren, um visuelle Drift zwischen Seiten zu vermeiden
- Externe Skripte (Calendly, Tracking, Chat) nur lazy und nur auf ben�tigten Seiten laden

## Content- und SEO-Workflow (Landing-spezifisch)

- Copy nicht direkt in Komponenten pflegen; Inhalte �ber strukturierte Content-Dateien oder klaren Config-Layer verwalten
- Jede Landing erh�lt ein prim�res Keyword-Cluster und eine klare Suchintention (informational/commercial)
- Genau eine H1 pro Seite; H2/H3 nur zur inhaltlichen Gliederung, nicht rein f�r visuelle Gr��en
- OG-Bilder pro Template/Offer vorsehen (Fallback erlaubt), um Shares konsistent zu halten
- F�r Template-/Paketseiten klare Preis- und Leistungsangaben ohne versteckte Bedingungen darstellen

## QA- und Release-Gates (Landing-spezifisch)

- Vor Merge: `npm run lint` und `npm run build` verpflichtend gr�n
- A11y-Smoke mindestens f�r Startseite + prim�ren Conversion-Flow (Keyboard, Fokus-Reihenfolge, Kontrast)
- PageSpeed/Lighthouse mobil dokumentieren; Abweichungen gegen�ber Zielwerten im PR begr�nden
- Formulare m�ssen valide Fehlerzust�nde haben (required, Format, Submit-Fehler), auch im Mock-Status
- Jeder CTA-Link wird auf Ziel und Tracking-Event gepr�ft (kein toter CTA)

## Senior-Entwickler Vorgehen (verbindlich)

- Vor Implementierung erst Scope, Abhaengigkeiten und Risiken kurz festziehen; dann in kleinen, reviewbaren Schritten liefern
- Erst Struktur, dann Features: Module/Ordner nach Verantwortung schneiden, keine Sammelordner mit zu vielen Dateien
- Pro Aenderung klare Verantwortlichkeit: UI, Domain-Logik, Konfiguration und Telemetrie getrennt halten
- Bei neuer Logik oder Workflows frueh passende Tests anlegen (Unit/Integration/E2E je nach Risiko)
- Refactoring kontinuierlich einplanen, sobald Komplexitaet oder Dateidichte ansteigt
