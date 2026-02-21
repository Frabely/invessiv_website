# AGENTS.md - invessiv (GPT Codex Agents)

## Ziel
Dieses Repository wird mit Agenten-Workflows entwickelt, um:
- konsistente Qualität in UX, Code, Security und Compliance zu sichern
- Features in kleinen, überprüfbaren PRs auszuliefern
- Regressionen durch klare Tests und Release Gates zu vermeiden

## Grundprinzipien
## Branding & Variation (verbindlich)
- Logo ist Pflichtinput
- Farbgebung ist optional; ohne Vorgabe wird eine thematisch passende, kontraststarke Palette gesetzt
- Immer aktiv neue Ideen fuer individuelles Design mit Wiedererkennungswert einbringen und Default-Implementierungen vermeiden

- Small PRs mit klarem Scope und nachvollziehbaren Commits
- Design zuerst (UX/IA), dann Implementierung
- Accessibility (WCAG 2.2 AA) und Performance (Core Web Vitals) sind Pflicht
- Responsives Design ist Pflicht: Die Website muss auf Handy, Tablet und Desktop zuverlässig gut aussehen und nutzbar sein
- Security by default (least privilege, keine Secrets im Repo)
- Generierter Code (insbesondere Logik und Workflows) muss durch passende Tests abgedeckt sein (mindestens Unit, Integration oder E2E je nach Änderungsumfang)


## Service-Webseiten Best Practices (Research-basiert)
- Above the fold muss sofort klar sein: Angebot, Zielgruppe und ein primärer CTA
- Primäre Navigation schlank halten (max. 4-6 Hauptpunkte), klare Informationshierarchie
- Content scannbar schreiben: kurze Absätze, klare Überschriften, keine Textwände
- Vertrauen sichtbar machen: klare Kontaktoption, rechtliche Links, konsistente Sprache
- Primäre Journey priorisieren: Erstkontakt/Anfrage mit minimalen Schritten
- Mobile-first umsetzen, dann Tablet/Desktop verfeinern; keine überladenen Sektionen
- Interaktive Elemente mit klaren Zuständen und sichtbaren Fokus-Styles
- Performance und Lesbarkeit vor dekorativen Effekten priorisieren
## Definition of Ready (DoR)
Ein Ticket ist erst startklar, wenn:
- Zielgruppe, Problem und gewünschtes Ergebnis klar sind
- Akzeptanzkriterien testbar formuliert sind
- Nicht-Ziele explizit benannt sind
- Risiken/Abhängigkeiten dokumentiert sind

## Definition of Done (DoD)
Eine Änderung gilt erst als fertig, wenn:
- Akzeptanzkriterien erfüllt sind
- Unit/Integration/E2E (falls relevant) grün sind
- Security- und A11y-Auswirkungen geprüft wurden
- Monitoring/Logging für neue kritische Flows vorhanden ist
- Rollback-Pfad im PR beschrieben ist

---

## Rollen / Agenten

### 1) Product & UX Agent (`ux-lead`)
Aufgaben:
- Informationsarchitektur (Landing, Templates, Checkout, Legal)
- UX-Flows (Browse -> Details -> Buy -> Download -> Support)
- Copywriting (klar, technisch, vertrauenswürdig)
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
- Performante Animationen und Übergänge
- SEO (metadata, structured data)
- i18n-ready Architektur (externe Strings, locale routing vorbereitet)
- Responsive Umsetzung für Mobile, Tablet und Desktop inkl. sauberer Breakpoints und Layout-Checks

Qualitätskriterien:
- Lighthouse > 90 (mobile) für Performance/Best Practices/SEO
- Kein unnötiges JS, optimierte Bilder, sinnvolle Caching-Strategie
- Sichtbare Fokus-Styles in allen interaktiven Komponenten
- Visuelle und funktionale Konsistenz über Mobile/Tablet/Desktop in allen Core Flows

### 3) Backend Agent (`be-engineer`)
Aufgaben:
- Payments-Integration (Stripe Checkout + Webhook)
- Entitlements (wer darf welche Datei laden)
- Lizenzmodell (single purchase, bundle, subscription)
- Download-Security (signed URLs, rate limiting)

Qualitätskriterien:
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
- Regression Suite für Core Paths
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
3. `sec-legal`: Security-Relevanz prüfen
4. Merge

### Workflow C - Hotfix
1. Incident klassifizieren (Severity + Impact)
2. Minimal-invasive Korrektur + Smoke Test
3. Nachgelagerte Root-Cause-Analyse (RCA)
4. Follow-up Ticket zur nachhaltigen Behebung

---

## Branch-/PR-Konvention
- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- PR-Template enthält:
  - Was/Warum
  - Screenshots (bei UI)
  - Testplan
  - Risiko/Rollback
  - Security/Privacy Impact

## Repo Qualitäts-Gates
- Lint + Typecheck
- Generierter Code (Logik/Workflows) ist verpflichtend durch Unit-, Integration- oder E2E-Tests abgedeckt
- Playwright E2E (Checkout smoke)
- Dependency Audit
- Secret Scan (pre-commit + CI)

## Merge-Regeln
- Kein Direkt-Merge auf `main`
- Mindestens ein Review bei normalen PRs
- Zwei Reviews für Payment, Auth, Download-Security, Legal-Änderungen

## Prompt-Vorlagen

### Implement feature
- Scope:
- Akzeptanzkriterien:
- UI States:
- Data Model Änderungen:
- Testplan:
- Rollback:

### Security review
- Angriffsflächen:
- PII/DSGVO:
- Webhook/Payment Risiken:
- Rate limiting/abuse:
- Empfohlene Mitigations:




## Architektur- und Code-Standards (ergänzend)
- App Router Struktur mit Route-Gruppen verwenden (`(marketing)`, `(legal)`, später `(app)`), um Verantwortlichkeiten klar zu trennen
- Shared UI in `src/components`, Routing-/Site-Konstanten in `src/config`, reine Hilfslogik in `src/lib` halten
- Keine Business-Logik in UI-Komponenten verstecken; Logik in klar benannte Funktionen/Module auslagern
- Strikte Typisierung nutzen: keine `any`-Workarounds ohne dokumentierten Grund
- Inhalte und Copy i18n-ready anlegen (externe Content-Dateien statt harte Strings in vielen Komponenten)
- Feature-Flags für unfertige Flows nutzen, statt halbfertige Logik produktiv zu schalten
- Öffentliche und serverseitige Umgebungsvariablen strikt trennen (`NEXT_PUBLIC_*` nur für wirklich öffentliche Werte)

## Performance- und Rendering-Standards (ergänzend)
- Server Components als Default, Client Components nur bei Interaktivität
- Bilder ausschließlich über `next/image` (mit klaren Größen und sinnvollen `alt`-Texten)
- Fonts zentral und sparsam laden; keine unnötigen externen Skripte im kritischen Pfad
- Jede neue Seite mit Mobile-Layout zuerst bauen und danach Tablet/Desktop erweitern
- Core Web Vitals pro Release kurz prüfen (LCP/CLS/INP) und Auffälligkeiten im PR dokumentieren

## Monitoring- und Betriebsstandards (ergänzend)
- Kritische User-Flows mit strukturierten Events versehen (z. B. CTA-Klick, Formular-Submit, Checkout-Start)
- Fehlerpfade observierbar halten (z. B. Sentry oder gleichwertig) bevor Payment/Auth live gehen
- Keine PII in Logs oder Analytics Events speichern
- Jede neue kritische Integration mit Fallback-Verhalten dokumentieren (z. B. Mail-Ausfall, Payment-Timeout)

## Content- und Produktpaket-Standards (ergänzend)
- Verkaufbare Pakete versionieren (`vX.Y.Z`) und mit Changelog ausliefern
- Auslieferungsartefakte unveränderlich speichern (pro Version ein eindeutiges Bundle)
- Claims in Landing-Copy nur mit belegbaren Quellen/Kennzahlen verwenden
- Mock-States immer sichtbar kennzeichnen (`Mock`, `Coming Soon`), kein irreführendes Verhalten

## Next.js + Tailwind Landing-Standards (verbindlich)
- Für jede Route eigene `metadata` definieren (Title, Description, Canonical, OpenGraph, ggf. Robots)
- Strukturierte Daten (JSON-LD) für `Organization` und passende `Service`/`Product`-Typen einplanen
- `sitemap.ts` und `robots.ts` im App Router bereitstellen, sobald mehr als 1 indexierbare Seite live geht
- Interaktive Landing-Elemente nur als Client Components; statische Sections als Server Components belassen
- Keine Inline-Styles für produktive Komponenten; Styling konsistent über Tailwind-Klassen und Design-Tokens
- Farb-, Spacing- und Radius-Tokens zentral in `globals.css`/Theme definieren, nicht ad hoc pro Komponente
- Komponentenvarianten (z. B. Button/Card/Badge) standardisieren, um visuelle Drift zwischen Seiten zu vermeiden
- Externe Skripte (Calendly, Tracking, Chat) nur lazy und nur auf benötigten Seiten laden

## Content- und SEO-Workflow (Landing-spezifisch)
- Copy nicht direkt in Komponenten pflegen; Inhalte über strukturierte Content-Dateien oder klaren Config-Layer verwalten
- Jede Landing erhält ein primäres Keyword-Cluster und eine klare Suchintention (informational/commercial)
- Genau eine H1 pro Seite; H2/H3 nur zur inhaltlichen Gliederung, nicht rein für visuelle Größen
- OG-Bilder pro Template/Offer vorsehen (Fallback erlaubt), um Shares konsistent zu halten
- Für Template-/Paketseiten klare Preis- und Leistungsangaben ohne versteckte Bedingungen darstellen

## QA- und Release-Gates (Landing-spezifisch)
- Vor Merge: `npm run lint` und `npm run build` verpflichtend grün
- A11y-Smoke mindestens für Startseite + primären Conversion-Flow (Keyboard, Fokus-Reihenfolge, Kontrast)
- PageSpeed/Lighthouse mobil dokumentieren; Abweichungen gegenüber Zielwerten im PR begründen
- Formulare müssen valide Fehlerzustände haben (required, Format, Submit-Fehler), auch im Mock-Status
- Jeder CTA-Link wird auf Ziel und Tracking-Event geprüft (kein toter CTA)


