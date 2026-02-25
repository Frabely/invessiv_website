# Landingpage Go-Live Checkliste (Invessiv)

Stand: 25.02.2026
Ziel: Alle offenen Punkte schließen, damit die Landingpage technisch, inhaltlich und visuell live-fähig ist.

## 0) Launch-Blocker (muss vor Go-Live erledigt sein)

- [ ] **Rechtstexte ohne Platzhalter finalisieren** (`imprint`, `privacy`, `terms`): alle `[PLATZHALTER: ...]` entfernen und juristisch prüfen.
- [ ] **KI-Transparenzhinweis klären und festhalten**: falls rechtlich, vertraglich oder compliance-seitig notwendig, sichtbar dokumentieren, dass die Seite mit KI-Unterstützung erstellt wurde (z. B. im Footer, Impressum oder in der Projektdokumentation).
- [ ] **Social-Links final setzen**: LinkedIn/X/Instagram dürfen nicht mehr auf `placeholder`-Anker zeigen.
- [ ] **Kontaktdaten final verifizieren**: Telefonnummer und Mail konsistent in Landingpage, Impressum, Privacy, JSON-LD.
- [ ] **Alle CTAs mit echtem Ziel verknüpfen**: kein „Self-Link“ ohne Mehrwert (z. B. Discovery/Kickoff-Call aktuell auf `#contact`).
- [ ] **Mobile Icon-Bug beheben**: `.services-title-icon-image` ist auf Mobile aktuell zu groß (`104px`) und muss auf mobile-gerechte Größe reduziert werden.
- [ ] **Preise auf Service-Ebene ersetzen**: alle aktuellen Paketpreise durch „ab X“ je Leistung ersetzen.

## 1) Content-Finalisierung (Conversion-relevant)

- [ ] **Service-Angebote schärfen**: pro Leistung klarer Scope, Ergebnis, typische Dauer, „ab X“-Preis.
- [ ] **Proof/KPI-Claims belegen**: Zahlen wie `5 Tage`, `92%` mit realer Datengrundlage oder wording abschwächen.
- [ ] **„Live-Beispiel auf Anfrage“ ersetzen**: mindestens 1–3 konkrete Referenzen oder anonymisierte Cases pro Kernleistung.
- [ ] **CTA-Copy vereinheitlichen**: „Projekt anfragen“, „Kennenlern-Call“, „Kickoff-Call“ konsistent benennen.
- [ ] **DE/EN inhaltlich angleichen**: gleiche Angebotslogik, gleiche Preise, gleiche Kontaktwege.
- [ ] **Footer-/Copyright-Text prüfen**: Jahr und Sprachversionen konsistent halten.

## 2) Entscheidung: Leistungen und Preise trennen oder zusammenführen

- [ ] **Entscheidung treffen und dokumentieren.**
- [ ] **Empfehlung (für den aktuellen Zielzustand „Preis je Leistung ab X“): `Leistungen` + `Preise` zusammenführen** zu einer Section „Leistungen & Preise“.
- [ ] **Falls getrennt behalten:** Titles und Zweck klar differenzieren:
- [ ] `Leistungen` = Outcome, Deliverables, Use-Cases.
- [ ] `Preise` = Preismodell, Umfangsstufen, Add-ons, optional Vergleich.

## 3) Mobile-First UI (1. Prio) + Tablet (2. Prio)

- [ ] **Services-Icons auf Mobile skalieren** (Icon-Container + SVG-Größe), damit Card-Header nicht brechen.
- [ ] **Hero auf Mobile prüfen**: Zeilenumbrüche in H1, CTA-Stacking, ausreichender Abstand zu Header.
- [ ] **Services-Cards auf Mobile prüfen**: einheitliche Innenabstände, keine überlaufenden Chips/Bullets.
- [ ] **Pricing-/Leistungs-Cards auf Mobile prüfen**: CTA-Buttons full width, klare vertikale Hierarchie.
- [ ] **Contact-Karten auf Mobile prüfen**: Textlängen, Umbrüche, Touch-Ziele.
- [ ] **Tablet (768–1024px) prüfen**: Grid-Übergänge, Rhythmus zwischen Sections, keine „halbfertigen“ Layouts.
- [ ] **Visuelle QA in Breakpoints**: 360, 390, 430, 768, 834, 1024, 1280 px.

## 4) Links & Buttons vollständig verknüpfen

- [ ] **Header-Links**: alle Nav-Anker existieren und scrollen korrekt.
- [ ] **Hero-CTAs**: primär auf echten Kontaktflow (Form/Call), sekundär auf Services.
- [ ] **Services-Card-CTA**: je Card sinnvolles Ziel (eigener Service-Anchor oder Kontakt mit vorausgefülltem Kontext).
- [ ] **Process-CTA („Kickoff/Call“) auf echten Terminlink** (z. B. Calendly) oder dedizierten Anfrageflow.
- [ ] **Contact-Channel „Kennenlern-Call“ auf echtes Buchungssystem verlinken**.
- [ ] **Footer Service-Links nicht pauschal auf `#pricing`**: auf konkrete Service-Anker verweisen.
- [ ] **Legal-Links testen**: `/imprint`, `/privacy`, `/terms` öffnen ohne Placeholder-Inhalte.
- [ ] **Externe Links mit korrektem Target/Rel** prüfen.

## 5) SEO, Struktur & technische Sichtbarkeit

- [ ] **Metadata je Route final prüfen** (Title, Description, Canonical, OpenGraph).
- [ ] **OG-Bild ergänzen** (Fallback + ggf. DE/EN Variante).
- [ ] **Structured Data aktualisieren** (Service-Preise, Kontaktdaten konsistent, keine Platzhalter).
- [ ] **Sitemap/Robots gegen Live-Routen prüfen** (inkl. `/de`, `/en`, Legal-Seiten).
- [ ] **Nur indexierbare, fertige Seiten freigeben** (keine Platzhalter-Seiten indexieren).

## 6) A11y, Performance, Best Practices

- [ ] **Lighthouse Mobile**: Performance, Accessibility, SEO, Best Practices jeweils Ziel > 90.
- [ ] **Fokuszustände für alle interaktiven Elemente prüfen** (Keyboard-Navigation).
- [ ] **Kontrastprüfung** für Text, Buttons, Badges in Dark/Light.
- [ ] **Motion-Reduktion** (`prefers-reduced-motion`) auf kritische Animationen anwenden.
- [ ] **Core Web Vitals vor Launch messen** (LCP, CLS, INP) und dokumentieren.

## 7) Conversion-Tracking & Betriebsfähigkeit

- [ ] **CTA-Events tracken** (Hero, Services, Pricing/Leistungen, Contact, Footer).
- [ ] **Kontakt-Conversion tracken** (E-Mail-Klick, Call-Buchung, Formular-Submit).
- [ ] **Fehlerfälle tracken** (Formularfehler, fehlgeschlagene externen Links/Flows).
- [ ] **Privacy-konforme Tracking-Logik sicherstellen** (inkl. Rechtsgrundlage/Consent falls nötig).

## 8) Vor dem Livegang (technischer Abschluss)

- [ ] `npm run lint` erfolgreich.
- [ ] `npm run build` erfolgreich.
- [ ] Relevante Tests erfolgreich (`npm run test` bzw. definierte Test-Suite).
- [ ] Cross-Browser Smoke-Test (mind. Chrome, Safari, Firefox, Mobile Safari/Chrome).
- [ ] Finaler Link-Check ohne 404/placeholder Ziele.
- [ ] Deployment-Check: Domain, HTTPS, Caching, Redirects.

## 9) Finaler „Nichts vergessen“-Recheck

- [ ] **Keine Platzhalter mehr im gesamten `src/`** (`PLATZHALTER`, `placeholder`, `on request`, `auf Anfrage` nur falls bewusst).
- [ ] **Keine Dummy-Preise mehr**: alle Leistungen mit finalem „ab X“.
- [ ] **Keine unklaren CTA-Ziele**: jeder Button erfüllt exakt die Erwartung aus dem Label.
- [ ] **Mobile zuerst visuell abgenommen**, Tablet zweitpriorisiert abgenommen.
- [ ] **Legal + Content + UI + Links gemeinsam final gegengeprüft** (eine komplette End-to-End-Testsession).
