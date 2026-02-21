# ROADMAP.md - invessiv

## Produktvision
invessiv verkauft hochwertige Developer-Templates (z. B. Markdown-Kits, Boilerplates, Snippets, Starterkits) als digitale Downloads.
Fokus: sofort nutzbar, sauber dokumentiert, klar lizenziert, vertrauenswürdig im Kaufprozess.

## Nordstern-Metriken
- Time to Template: Zeit von Landing bis erfolgreichem Download
- Checkout Conversion Rate
- Download Success Rate
- Refund Rate
- Support First Response Time

## Priorisierungsprinzipien
- Revenue-kritische Pfade vor Komfort-Features
- Security und Legal sind Blocker, keine Nice-to-have-Themen
- Operative Stabilität vor Feature-Breite

---

## Phase 0 - Foundation (MVP)
Ziel: erster verlässlicher Verkauf mit robustem Delivery-Flow.

Must-have:
- Landing Page (Value Proposition, Featured Templates)
- Template Catalog (Grid + Filter + Search)
- Template Detail:
  - Beschreibung, Features, Requirements, Version, Changelog
  - Preview (Markdown Render)
- Pricing: klare Preise pro Template
- Purchase: Stripe Checkout
- Delivery:
  - Download-Link nach Kauf und per E-Mail
  - Fallback-Supportkontakt
- Kontakt:
  - Calendly Link/Embed
  - Support E-Mail/Kontaktformular
- Legal (DE):
  - Impressum
  - Datenschutzerklärung
  - AGB/Terms
  - Widerruf + Digital-Inhalte-Hinweis
  - Cookie/Tracking-Hinweis (wenn relevant)

Nice-to-have:
- FAQ (Lizenz, Updates, Refunds)
- What's new/Changelog-Seite
- Privacy-friendly Analytics

Exit-Kriterien:
- Mindestens 1 erfolgreicher Produktivverkauf inkl. Webhook-Verarbeitung
- Download Success Rate >= 99% über 7 Tage
- Keine offenen Critical Security Findings
- Mobile UX ohne Blocker in Core Flows

---

## Phase 1 - Operational Excellence
Ziel: Betrieb stabil, nachvollziehbar, supportfähig.

- Admin-Flow: Templates verwalten (Titel, Preis, Datei, Version)
- Observability: Sentry + strukturierte Event Logs
- Support:
  - Ticketing light (E-Mail + Template-ID)
  - Self-service: Resend download link
- SEO Basics:
  - OpenGraph, sitemap, robots
  - Structured Data (Product)
- Performance-Pass (Core Web Vitals)

Exit-Kriterien:
- Alerting auf Checkout- und Webhook-Fehler aktiv
- Mean Time to Detect (MTTD) für kritische Fehler < 15 min
- Support Response SLA initial definiert und eingehalten

---

## Phase 2 - Accounts & Entitlements
Ziel: Käufe langfristig verwaltbar machen.

- Nutzerkonten (optional beim Kauf oder nachträglich)
- My Downloads Bereich
- Lizenz-/Entitlements-System:
  - Pro Purchase
  - Bundle
- Updates:
  - Käufer erhalten Updates automatisch
  - Version-Historie + Release Notes

Exit-Kriterien:
- Nutzer kann alle berechtigten Downloads im Account abrufen
- Entitlement-Prüfung serverseitig abgesichert
- Keine unautorisierte Download-Freigabe in Tests

---

## Phase 3 - Internationalisierung
Ziel: DE/EN sauber unterstützen.

- i18n-Infrastruktur (DE/EN zuerst)
- Lokalisierte Preise/Steuern (je nach Setup)
- Mehrsprachige Template-Docs

Exit-Kriterien:
- Vollständige DE/EN Core Journey (Landing -> Checkout -> Download)
- Keine hardcodierten UI-Strings in Core Components

---

## Phase 4 - Growth Features
Ziel: durchschnittlichen Warenkorb und Retention erhöhen.

- Bundles/Collections
- Subscription/Membership
- Affiliate/Referral
- Recommendations/Personalization (später)

Exit-Kriterien:
- Mindestens ein valides Upsell-Experiment abgeschlossen
- Messbare Uplift-Hypothese dokumentiert

---

## Phase 5 - Community & Plattform
Ziel: vom Shop zur Plattform entwickeln.

- Ratings/Reviews (moderiert)
- Public Roadmap + Feature Requests
- Creator Marketplace
- Team Accounts/B2B Licensing

Exit-Kriterien:
- Moderations- und Abuse-Prozesse definiert
- Rollen- und Rechtekonzept für externe Creator dokumentiert

---

## Querschnittsthemen (alle Phasen)
- Accessibility: WCAG 2.2 AA als Mindeststandard
- Security: Least Privilege, Signed URLs, Rate Limiting, Secret Hygiene
- Compliance: DSGVO-konforme Datensparsamkeit und Retention-Regeln
- Performance: Core Web Vitals aktiv überwachen

## Risiken und Mitigations
- Payment-/Refund-Edge-Cases:
  - Mitigation: klare Policy, idempotente Prozesse, Support-Playbook
- Download Abuse (Link Sharing):
  - Mitigation: signed URLs, expiry, rate limiting, optional account gating
- Legal/DSGVO-Risiko:
  - Mitigation: minimal tracking, Consent nur wenn nötig, Legal Review vor Release
- Template-Qualität schwankt:
  - Mitigation: Review-Checklist, QA-Gate, Versionierung, Changelog-Pflicht