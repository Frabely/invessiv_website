# KI-Workflows Landingpage — Plan Stub

> **Zweck:** Allgemeine Marketing-Landingpage unter `/[locale]/services/ai-workflows`.
> Dies ist die offizielle "AI Workflows"-Seite, die aus der Homepage verlinkt wird.
> Sie präsentiert Invessivs KI-Workflow-Optimierungsangebot inkl. Pricing.
>
> **Abgrenzung zur LinkedIn-Post-Page:**
> `/services/linkedin-post` ist eine spitze Kampagnen-Page mit Lead-Magnet-Generator.
> `/services/ai-workflows` ist die allgemeine Angebotsseite für KI-gestützte
> Workflow-Optimierung — ähnlich in Struktur und Tonalität zu `/services/landing-page`.

---

## Zielbild

**Route:** `/[locale]/services/ai-workflows`

**Zielgruppe:** Solo-Dienstleister, Berater, Agenturen und kleine B2B-Teams, die wiederkehrende
Arbeitsabläufe (Content, Reporting, Kundenkommunikation, Recherche etc.) mit KI effizienter
gestalten wollen.

**Angebot:** Invessiv baut individuelle KI-gestützte Workflows — von einem kleinen Pilot (ab 1.500 €)
bis hin zu ausgebauten, dokumentierten Prozessen (ab 5.000 €).

**Conversion-Ziel:** Unverbindliche Anfrage / Erstgespräch buchen.

**Nicht-Ziel:** Kein SaaS, kein Login, kein Tool-Demo auf dieser Page. Kein Upload.

---

## Seitenstruktur

```
SiteHeader
├── Hero-Section          (neu — allgemeiner KI-Workflow-Fokus)
├── Problem-Section       (angepasst aus linkedin-post — breiter: nicht nur LinkedIn)
├── Offer-Section         (wiederverwendet aus linkedin-post — ggf. minimale Copy-Anpassung)
├── Pricing-Section       (neu — die 4 Pilot-Tiers)
├── Privacy-Note-Section  (wiederverwendet oder angepasst)
FooterSection
```

---

## Wiederverwendbare Komponenten

| Komponente                      | Herkunft        | Änderungsbedarf                                           |
| ------------------------------- | --------------- | --------------------------------------------------------- |
| `OfferSection`                  | `linkedin-post` | Copy-Anpassung: Fokus auf allgemeine Workflow-Optimierung |
| `ProblemSection`                | `linkedin-post` | Copy-Anpassung: Beispiele breiter fassen                  |
| `SiteHeader`, `FooterSection`   | global          | keine                                                     |
| `EyebrowPill`, `PrimaryCtaLink` | global          | keine                                                     |

> **Import-Hinweis:** `OfferSection` liegt nach dem Rename unter
> `@/components/marketing/linkedin-post/offer-section/offer-section`. Direkt importieren,
> nicht kopieren.

---

## Neue Komponenten

### Hero-Section (neu)

**Fokus:** Allgemeine KI-Workflow-Optimierung.

**Content-Shape:** `tag`, `title`, `description`, `primaryCta`, `secondaryCta`, `trustChips`.

**Copy-Richtung DE:**

- Tag: `KI-WORKFLOW OPTIMIERUNG`
- H1: Richtung "Weniger Routine. Mehr Wirkung." oder "Deine Workflows — automatisiert mit KI."
- Primary CTA: "Workflow anfragen" → scrollt zu `#pricing` oder direkt zur Kontaktmöglichkeit

**Zu entscheiden beim Bau:** Animation aus `animation_mockups/` prüfen.
`aurora_gradient_hero` ist ein naheliegender Kandidat.

---

### Pricing-Section (neu)

**Tiers:**

| Tier                   | Preis               | Scope                                                                 |
| ---------------------- | ------------------- | --------------------------------------------------------------------- |
| Kostenloser Kurz-Check | 0 €                 | Prozessdiagnose + 1-2 Workflow-Ideen + Pilot-Empfehlung               |
| Mini-Pilot             | ab 1.500 € netto    | ein Prozess, ein Input-Format, ein Ziel-Output, 1-2 Testläufe         |
| Erweiterter Pilot      | 2.500–3.500 € netto | zweiter Output oder einfache Freigabe-/Übergabelogik                  |
| Ausbau                 | ab 5.000 € netto    | stabilerer Workflow, mehrere Varianten, Dokumentation, Tool-Anbindung |

**Design:** `gradient_border_grain` für den Mini-Pilot als empfohlenen Einstieg.
Mobile-first: gestapelte Karten, klare Scope-Grenzen, kein "unbegrenzter Content".

**Hinweis:** "Alle Preise netto. Scope wird vorab verbindlich vereinbart."

---

## Minimaler Umsetzungsplan

> Dieser Stub wird zu einem vollständigen Step-by-Step-Plan ausgebaut,
> sobald `/services/linkedin-post` V1 live ist.

### Task P0: Route-Scaffold + Navigation

- [ ] `SITE_ROUTES.AI_WORKFLOWS_SERVICE = "/services/ai-workflows"` bestätigen (bereits reserviert).
- [ ] Route `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx` anlegen.
- [ ] Orchestrator-Component `ai-workflows-page.tsx` anlegen (nur Section-Rendering).
- [ ] Navigation mit Section-IDs `problem`, `offer`, `pricing`, `contact`.
- [ ] Verify: `/de/services/ai-workflows` erreichbar.
- [ ] Commit — `feat(ai-workflows): scaffold route and navigation`

### Task P1: Hero-Section (neu)

- [ ] DE/EN-Dictionaries mit Copy für allgemeine KI-Workflow-Optimierung.
- [ ] `animation_mockups/` auf geeigneten Hero-Effekt prüfen (Empfehlung: `aurora_gradient_hero`).
- [ ] Komponente `hero-section/hero-section.tsx` + CSS Module.
- [ ] Primary CTA → `#pricing`, Secondary CTA → `#offer`.
- [ ] Verify 360 px.
- [ ] Commit — `feat(ai-workflows): add hero section`

### Task P2: Problem-Section anpassen

- [ ] Copy breiter fassen: nicht nur LinkedIn, sondern allgemeine Workflow-Reibung.
- [ ] Option A: `ProblemSection` aus `linkedin-post` direkt importieren + eigene Dictionaries.
- [ ] Option B: Komponente kopieren wenn strukturelle Unterschiede nötig.
- [ ] Commit — `feat(ai-workflows): add adapted problem section`

### Task P3: Offer-Section einbinden

- [ ] `OfferSection` aus `linkedin-post` importieren.
- [ ] Eigene DE/EN-Dictionaries mit angepasster Copy (allgemeine Workflow-Deliverables).
- [ ] Steps-Zeile: "Prozess beschreiben → Workflow-Ideen erhalten → Pilot-Scope entscheiden".
- [ ] Commit — `feat(ai-workflows): add offer section`

### Task P4: Pricing-Section (neu)

- [ ] DE/EN-Dictionaries für alle 4 Tiers (Heading, Preis, Scope-Bullets, Disclaimer).
- [ ] Design: mobile-first gestapelte Karten, `gradient_border_grain` für Mini-Pilot.
- [ ] Klare Scope-Grenzen; kein "unbegrenzter Content".
- [ ] Commit — `feat(ai-workflows): add pilot pricing section`

### Task P5: Kontakt-CTA / Abschluss

- [ ] Einfacher Abschluss-Block: Headline + CTA "Erstgespräch anfragen" →
      Calendly oder bestehendes Kontaktformular.
- [ ] Kein eigenes Heavy-Formular auf dieser Page in V1.
- [ ] Commit — `feat(ai-workflows): add contact cta section`

### Task P6: Metadata + Structured Data

- [ ] Title: `KI-Workflow Optimierung | Invessiv` / `AI Workflow Optimization | Invessiv`
- [ ] Canonical, Alternates, OG.
- [ ] `Service` Structured Data.
- [ ] Commit — `feat(ai-workflows): add metadata and structured data`

### Task P7: Homepage-Verlinkung

- [ ] Crawlbarer Link aus der Homepage auf `/services/ai-workflows` ergänzen.
- [ ] Ggf. Navigation-Item hinzufügen.
- [ ] Sitemap/Robots prüfen.
- [ ] Commit — `feat(ai-workflows): add homepage link and sitemap entry`

### Task P8: QA

- [ ] `npm run lint && npm run typecheck && npm run build`
- [ ] A11y-Smoke: Keyboard, Kontrast, Dark/Light, Mobile 360 px.
- [ ] Pricing-Cards: alle Scope-Texte lesbar und korrekt auf Mobile.

---

## Technische Hinweise

- Dictionaries für `ai-workflows` liegen in `apps/web/src/i18n/dictionaries/ai-workflows/**`
  (eigenständig, keine Abhängigkeit auf `linkedin-post`-Dictionaries).
- Pricing-Section ist eine neue Komponente unter
  `apps/web/src/components/marketing/ai-workflows/pricing-section/`.

---

## Akzeptanzkriterien

- Route `/de|/en/services/ai-workflows` erreichbar und indexierbar.
- Alle 4 Pricing-Tiers mit klaren Scope-Grenzen sichtbar.
- Mobile 360 px: kein Überlauf, alle Preisangaben vollständig lesbar.
- `OfferSection` erfolgreich wiederverwendet (kein Duplikat).
- Homepage-Link vorhanden und crawlbar.
- Metadata, Canonical, Alternates, Structured Data korrekt.
- Dark Mode default, Light kompatibel.
