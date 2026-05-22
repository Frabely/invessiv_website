# SEO-Sanierung Landing-Seite + Home-Repositionierung

## Context

Die Landing-Seite unter `invessiv.com/de/landing` (und `/en/landing`) wird von Google kaum bis gar nicht erkannt. Drei
strukturelle SEO-Probleme verstärken sich gegenseitig:

1. **Keyword-Kannibalisierung Home ↔ Landing.** Beide Seiten optimieren auf „Landingpage" + „Anfragen":
   - Home-Title: „Invessiv | Landingpages für mehr passende Anfragen", H1: „Landingpages, die passende Anfragen
     bringen."
   - Landing-Title: „Landingpage klar auf Anfragen ausgerichtet | Invessiv", H1: „Eine Landingpage, die dein Angebot
     klar verkauft …"
   - Google wählt eine Seite — strukturell die Home (höhere Autorität, Sitemap-Priorität 0.9) — und de-prioritisiert
     die andere.

2. **Landing-Seite ist orphaned.** Repo-weiter Grep zeigt: **kein einziger interner Link** zeigt auf `/de/landing` oder
   `/en/landing`. Die Seite existiert nur in `sitemap.ts`. Ohne eingehende interne Links ist sie für Google eine
   isolierte Insel ohne PageRank-Signal.

3. **Generisches Structured Data.** `createMarketingStructuredData` wird auf Home **und** Landing identisch aufgerufen (
   `apps/web/src/lib/seo/marketing-structured-data.ts`). Beide Seiten geben denselben `Organization` + `WebSite` +
   generischen `Service` aus → keine semantische Differenzierung. Pricing- und FAQ-Daten der Landing werden nicht als
   Schema ausgegeben (verschenkte Rich Snippets).

Ziel: Home semantisch verbreitern, Landing als Detail-Service positionieren, intern verlinken, mit eigenem
Service/Offer/FAQ-Schema ausstatten. URL wandert auf `/services/landing-page`. Datei-Struktur reorganisiert zu
`(marketing)` Route-Gruppe.

## Bestätigte Entscheidungen

| Frage               | Entscheidung                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Home-Positionierung | Breit: „Webentwicklung & digitale Lösungen für KMU"                                                                             |
| Interne Verlinkung  | Service-Card → `/services/landing-page` **+** Footer-Spalte „Leistungen" **+** Inline-Link in Home Q&A                          |
| URL-Slug            | `/services/landing-page` (gleicher Slug DE + EN); `/services` bleibt ohne eigene Seite und redirectet zur Home-Services-Section |
| Datei-Struktur      | Route-Gruppe `(marketing)` für alle Marketing-Routen (Home, Services, Projects)                                                 |
| Schema-Preis        | `priceRange: "ab 999 €"` im Service/Offer JSON-LD ausgeben                                                                      |

---

## Phase 1 — Home-Repositionierung (Content + Metadata)

Verantwortlich: Skill `copywriting` für finalen Wortlaut. Hier nur die Stellen + Richtung.

### Dateien

- `apps/web/src/i18n/dictionaries/marketing/home-meta.de.json` — Title + Description neu
- `apps/web/src/i18n/dictionaries/marketing/home-meta.en.json` — parallel DE/EN-Pflicht
- `apps/web/src/i18n/dictionaries/marketing/home.ts` — `HOME_SECTIONS[0].copy.{de,en}.title` und `.description` (
  Zeilen ~373–382)

### Richtung (Wortlaut über `copywriting`-Skill final festziehen)

- **Title DE**: „Invessiv | Webentwicklung & digitale Lösungen für KMU"
- **Title EN**: „Invessiv | Web Development & Digital Solutions for SMBs"
- **H1 DE**: „Klare digitale Auftritte, die deine Kunden wirklich erreichen."
- **H1 EN**: parallel formulieren
- **Description**: Verbreitern auf „Webseiten, Landingpages, Upgrades und Tools für Dienstleister & KMU" — Wort
  „Landingpage" darf vorkommen, aber als **eine von mehreren** Leistungen, nicht als Hauptbegriff.

### Akzeptanzkriterium

Home-Title enthält _nicht_ das Wort „Landingpage" als zentralen Begriff. Description listet mindestens drei
Leistungsbereiche. Keine sprachabhängige Inline-Logik in `page.tsx` (i18n-Konventionen wahren).

---

## Phase 2 — URL- & Datei-Struktur-Migration

### 2.1 Neue Route-Gruppe `(marketing)` anlegen

Drei bestehende Marketing-Routen ziehen in die neue Gruppe um:

| alt                                                    | neu                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `apps/web/src/app/[locale]/page.tsx`                   | `apps/web/src/app/[locale]/(marketing)/page.tsx`                       |
| `apps/web/src/app/[locale]/projects/page.tsx`          | `apps/web/src/app/[locale]/(marketing)/projects/page.tsx`              |
| `apps/web/src/app/[locale]/(landing)/landing/page.tsx` | `apps/web/src/app/[locale]/(marketing)/services/landing-page/page.tsx` |

Begleitend: zugehörige `page.test.tsx`-Dateien mitziehen, alte `(landing)`-Route-Gruppe leer machen und entfernen.

### 2.2 Metadata-Anpassungen in der neuen Landing-Route

In `apps/web/src/app/[locale]/(marketing)/services/landing-page/page.tsx`:

- `canonicalPath` von `/${locale}/landing` → `/${locale}/services/landing-page`
- `createLocaleAlternates({ de: "/de/landing", en: "/en/landing" })` →
  `{ de: "/de/services/landing-page", en: "/en/services/landing-page" }`
- `createMarketingStructuredData(...)` bleibt in PR 1 zunächst bestehen; der Austausch auf
  `createLandingStructuredData(activeLocale)` erfolgt erst in Phase 4/PR 4

### 2.3 Sitemap aktualisieren

`apps/web/src/app/sitemap.ts`: Einträge `/de/landing` + `/en/landing` ersetzen durch `/de/services/landing-page` +
`/en/services/landing-page` (Priorität 0.8 beibehalten).

### 2.4 301-Redirects einrichten

`apps/web/next.config.ts` (oder gleichwertig) um `redirects()` erweitern:

```ts
async redirects() {
  return [
    { source: "/de/landing", destination: "/de/services/landing-page", permanent: true },
    { source: "/en/landing", destination: "/en/services/landing-page", permanent: true },
    { source: "/de/services", destination: "/de#services", permanent: true },
    { source: "/en/services", destination: "/en#services", permanent: true },
  ];
}
```

Hinweis: Für die alten Landing-URLs muss in Tests explizit geprüft werden, dass der Redirect als HTTP 301 ausgeliefert
wird. Für `/services` ist der Redirect bewusst ein UX-/SEO-Fallback, weil keine Services-Übersichtsseite implementiert
wird.

### 2.5 Routes-Konstante anpassen

`apps/web/src/config/routes.ts`: `LANDING: "/landing"` → `LANDING_PAGE_SERVICE: "/services/landing-page"` (Naming nach
Const-Objekt-Pattern aus AGENTS.md). Alle Importe ziehen.

### Akzeptanzkriterium

- `/de/landing` und `/en/landing` antworten mit HTTP 301 auf den neuen Pfad
- `/de/services` und `/en/services` antworten mit HTTP 301 auf die jeweilige Home-Services-Section
- Neue Route rendert vollständig; alle Tests (`landing-page.test.tsx` und ggf. E2E) grün
- Sitemap enthält nur die neuen URLs
- Keine String-Literale `"/landing"` mehr im Code (außer im Redirect-Source)

---

## Phase 3 — Interne Verlinkung

### 3.1 Service-Card „Landingpages" auf der Home verlinken

Die Landingpages-Card wird aktuell als `FeaturedServiceCard` gerendert, nicht als normale `ServiceCard`. Entscheidend
ist daher
`apps/web/src/components/marketing/home/sections/services-section/featured-service-card/featured-service-card.tsx` (CTA
aktuell `SECTION_HREFS.contact`).

- Neuer optionaler Prop `serviceDetailHref?: string`
- Wenn gesetzt: CTA-Button verlinkt auf `serviceDetailHref` statt `#contact` (für die `landing`-Card)
- `ServiceCard` kann denselben Prop ebenfalls erhalten, damit das Pattern konsistent bleibt; für den SEO-Link ist aber
  `FeaturedServiceCard` verpflichtend
- Locale kommt über `marketing-home-page-client.tsx` (Zeile 26, `useLanguage()`)
- Konstruktion via `SITE_ROUTES.LANDING_PAGE_SERVICE` aus `apps/web/src/config/routes.ts` zusammen mit einem zentralen
  Locale-Path-Helper — **kein** String-Literal `/${locale}/services/landing-page` direkt im JSX (AGENTS-Pflicht:
  URL-Pfade aus typisierten Konstanten).

### 3.2 Footer-Spalte „Leistungen" mit Landing-Link

`apps/web/src/i18n/dictionaries/marketing/home.ts` — `footerColumns`-Array (Zeilen 1478–1555):

- Neue Spalte zwischen „Menü" und „Kontakt" einfügen:
  `{ title: "Leistungen", links: [{ label: "Landingpage erstellen lassen", href: "/services/landing-page" }] }`
- DE + EN parallel pflegen (Label EN: „Get a landing page built")
- Skalierbar: spätere Services-Detailseiten können hier ergänzt werden
- Bestehender Footer-Href-Resolver lokalisiert aktuell nur Legal-Pfade (`/imprint`, `/privacy`, `/terms`). Er muss so
  erweitert werden, dass auch `SITE_ROUTES.LANDING_PAGE_SERVICE` locale-fähig wird (`/de/services/landing-page`,
  `/en/services/landing-page`), ohne einen zweiten Resolver parallel zu implementieren

### 3.3 Inline-Link in Home Q&A

`apps/web/src/i18n/dictionaries/marketing/home.ts` Zeilen ~862–866 (Q&A „Wie läuft der Projektstart ab?"):

- Antwort um einen Satz erweitern: „Für klassische Einzel-Landingpages gibt es einen eigenen Ablauf auf der
  Landingpage-Detailseite."
- Q&A-Item-Typ um optionalen Link erweitern (analog `LandingFaqItem.link` in
  `apps/web/src/i18n/dictionaries/landing/faq/index.ts:17-22`)
- Vor dem Link muss `q-and-a-accordion.tsx` semantisch korrigiert werden: Der Toggle-Button darf nur die
  Frage/Disclosure enthalten; das Antwortpanel wird außerhalb des Buttons gerendert, damit ein echter `<a>`-Link ohne
  verschachtelte Interaktivität möglich ist
- DE + EN parallel pflegen

### Akzeptanzkriterium

- Repo-weiter Grep `"/services/landing-page"` findet ≥ 3 Verweis-Stellen (Service-Card, Footer, Q&A) zusätzlich zu
  Route, Sitemap, Redirects
- Keine inline locale-Strings: alle Pfade kommen aus `SITE_ROUTES`, zentralen Locale-Path-Helpern oder
  `createLocaleAlternates`
- Q&A-Link ist per Tastatur erreichbar und erzeugt kein verschachteltes `<button><a /></button>`-Markup

---

## Phase 4 — Structured Data

### 4.1 Neuer Helper `createLandingStructuredData`

Neue Datei: `apps/web/src/lib/seo/landing-structured-data.ts`

Funktion:

```ts
export function createLandingStructuredData(locale: Locale);
```

Quellen:

- `getLandingMetaContent(locale)` aus `apps/web/src/i18n/dictionaries/landing/meta` → `description`
- `getLandingPricingContent(locale)` aus `apps/web/src/i18n/dictionaries/landing/pricing/index.ts` → `card.priceValue`,
  `card.durationValue`
- `getLandingFaqContent(locale)` aus `apps/web/src/i18n/dictionaries/landing/faq/index.ts` → `items`
- `COMPANY` aus `apps/web/src/config/company.ts` (Organization-Wiederverwendung mit `@id`)

Ausgabe-Struktur (`@graph`):

1. **Organization** (gleiche `@id` wie bestehend: `${SITE_URL}#organization` — vermeidet Duplikate gegenüber Home)
2. **Service**
   - `@id`: `${SITE_URL}/${locale}/services/landing-page#service`
   - `name`: „Landingpage erstellen lassen" (DE) / „Landing page development" (EN) — lokalisiert
   - `serviceType`: „Landingpage-Entwicklung" / „Landing page development"
   - `provider`: `{ "@id": "${SITE_URL}#organization" }`
   - `areaServed`: `{ "@type": "Country", "name": "DE" }`
   - `audience`: `{ "@type": "BusinessAudience", "audienceType": ... }` (lokalisiert)
   - `description`: aus `getLandingMetaContent(locale).description`
   - `offers`: siehe 4.2
3. **FAQPage** (siehe 4.3)
4. **BreadcrumbList** (siehe 4.4)

### 4.2 Offer-Block aus Pricing-Dictionary

```json
{
  "@type": "Offer",
  "name": "Landingpage Starter",
  "priceCurrency": "EUR",
  "priceRange": "ab 999 €",
  "availability": "https://schema.org/InStock",
  "deliveryLeadTime": {
    "@type": "QuantitativeValue",
    "minValue": 3,
    "maxValue": 7,
    "unitCode": "DAY"
  },
  "itemOffered": { "@id": "...#service" }
}
```

Wichtig: `priceValue` und `durationValue` werden geparst, **nicht hardcodiert**. Helper-Funktionen:

- `parsePriceRange("ab 999 €") → "ab 999 €"` (passthrough, aber im Helper isoliert für Wartbarkeit)
- `parseLeadTime("3–7 Tage") → { minValue: 3, maxValue: 7, unitCode: "DAY" }` (Regex auf Zahlen + Lokalisierung der
  Einheit DE/EN)

Lokalisierungs-Mapping über `Record<Locale, ...>`-Pattern (keine `locale === "de" ? ... : ...`-Inline-Verzweigung —
AGENTS-Pflicht).

### 4.3 FAQPage-Schema

Aus `getLandingFaqContent(locale).items` automatisch generieren:

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "<question>",
      "acceptedAnswer": { "@type": "Answer", "text": "<answer>" }
    }
  ]
}
```

### 4.4 BreadcrumbList-Schema

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Start",
      "item": "${SITE_URL}/${locale}"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Leistungen",
      "item": "${SITE_URL}/${locale}#services"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Landingpage erstellen lassen",
      "item": "${SITE_URL}/${locale}/services/landing-page"
    }
  ]
}
```

Hinweis: `/services` selbst wird bewusst nicht als Übersichtsseite implementiert. Der Breadcrumb verweist deshalb auf
die crawlbare Home-Services-Section (`/${locale}#services`) statt auf eine nicht existierende Zwischenseite.

### 4.5 Test

Neue Datei: `apps/web/src/lib/seo/landing-structured-data.test.ts`

Test-Cases:

- Output enthält genau diese vier `@graph`-Einträge: `Organization`, `Service`, `FAQPage`, `BreadcrumbList`
- `Service.offers.priceRange` matcht den Wert aus dem Pricing-Dictionary (kein Hardcoding-Drift)
- `FAQPage.mainEntity.length === getLandingFaqContent(locale).items.length`
- `Organization.@id` identisch mit dem aus `createMarketingStructuredData` (Wiederverwendung)
- Lokalisierung: DE und EN liefern unterschiedliche `name`/`description`/`audienceType`, gleichen `priceRange` (Preis
  sprachunabhängig)
- Datenschutz-Assertion: kein „Moritz Hecht" o.Ä. im Output (analog `marketing-structured-data.test.ts`)
- Breadcrumb-Test prüft, dass Position 2 auf `/${locale}#services` und nicht auf `/${locale}/services` zeigt

### 4.6 Aufruf-Stelle

`apps/web/src/app/[locale]/(marketing)/services/landing-page/page.tsx` Zeile ~68:

- `createMarketingStructuredData(activeLocale, description)` → `createLandingStructuredData(activeLocale)`
- `description` wird intern im neuen Helper geholt (nicht mehr von außen reingereicht)

### Akzeptanzkriterium

- Schema-Validator (https://validator.schema.org/) bestätigt alle vier Typen ohne Fehler
- Google Rich Results Test ist optionaler Smoke, aber kein Gate: FAQ-Rich-Results sind laut Google aktuell stark auf
  bekannte autoritative Government-/Health-Websites eingeschränkt
- Test grün, Coverage des neuen Helpers ≥ 80 %

---

## Phase 5 — Skill & Docs nachziehen

### 5.1 Skill `invessiv-landing` aktualisieren

`.claude/skills/invessiv-landing/SKILL.md`:

- Alle Vorkommen von `/de/landing` → `/de/services/landing-page`
- Alle Vorkommen von `/en/landing` → `/en/services/landing-page`
- Sektion „Routing & Dateistruktur" auf neue Pfade umstellen
- Sektions-Index-Tabelle: Komponentenpfade bleiben (`src/components/marketing/landing/...`), nur die
  Page-Orchestrator-Pfadangabe aktualisieren
- Skill-Name selbst (`invessiv-landing`) **nicht** umbenennen — er ist eine interne Identität und nicht in der URL
  sichtbar

### 5.2 AGENTS.md erweitern

`AGENTS.md` (Root) um einen Eintrag in der Bereichs-Tabelle ergänzen: Pfad `apps/web/src/app/[locale]/(marketing)/`,
Beschreibung der Route-Gruppen-Konvention für Marketing-Routen. Eventuell ein neues
`apps/web/src/app/[locale]/(marketing)/AGENTS.md` anlegen, das die Marketing-Routen-Konventionen kapselt (analog zum
bestehenden `(auth)`-AGENTS).

### 5.3 Memory `project_architecture.md` aktualisieren

`C:\Users\MoritzDesktop\.claude\projects\C--Users-MoritzDesktop-IdeaProjects-invessiv-website\memory\project_architecture.md`:
falls Pfade zur Landing-Route hinterlegt sind, auf neue Struktur ziehen.

### Akzeptanzkriterium

- Skill-Doku referenziert nur noch die neuen Pfade
- Repo-weiter Grep `"/de/landing"` oder `"/en/landing"` findet keine Treffer mehr außerhalb der Redirect-Source

---

## Verification (End-to-End)

### Build & Lint

```pwsh
npm run lint
npm run typecheck
npm run build
```

Alle drei müssen grün sein.

### Unit & Component Tests

```pwsh
npm run test -- landing-structured-data
npm run test -- landing-page
npm run test -- home-meta
```

### E2E (Playwright)

- Smoke-Test für `/de/services/landing-page` und `/en/services/landing-page`
- Redirect-Smoke: Aufruf `/de/landing` → erwarte 301 nach `/de/services/landing-page`
- Redirect-Smoke: Aufruf `/de/services` → erwarte 301 nach `/de#services`
- Service-Card-Smoke: Klick auf „Landingpages"-Card auf der Home navigiert zu `/de/services/landing-page`
- Footer-Smoke: Footer-Spalte „Leistungen" enthält Link auf `/de/services/landing-page`

### Schema-Validierung (manuell)

Mit `npm run dev`:

1. `/de/services/landing-page` aufrufen
2. JSON-LD aus dem Quelltext extrahieren
3. https://validator.schema.org/ → keine Fehler
4. https://search.google.com/test/rich-results → optional prüfen; Ergebnis dokumentieren, aber nicht als Merge-Gate
   verwenden

### Lighthouse

Lighthouse-Mobile-Audit auf `/de/services/landing-page`: SEO-Score ≥ 95 (vorher: <Wert messen vor Start>).

### Manuelles SERP-Tracking

Nach Deployment Google Search Console:

- Alte URL `/de/landing` aus dem Index entfernen (URL-Removal-Tool optional, sonst über Redirect natürlich)
- Neue URL `/de/services/landing-page` über „URL prüfen" → „Indexierung beantragen"
- Suchquery „landingpage erstellen lassen" und „invessiv landingpage" über 2–4 Wochen beobachten

---

## Reihenfolge & PR-Schnitt (Vorschlag)

Vier PRs, klein und reviewbar (AGENTS-Pflicht „Small PRs mit klarem Scope"):

1. **PR 1 — Datei-Migration & Redirects** (Phase 2): Route-Umzug nach `(marketing)/services/landing-page`, 301-Redirects
   für alte Landing-URLs und `/services`, Sitemap, Routes-Konstante. Kein Content-/Schema-Change;
   `createMarketingStructuredData` bleibt bis PR 4 bestehen. Nach Merge sofort prüfbar in Production, ob Redirects
   greifen.
2. **PR 2 — Home-Repositionierung** (Phase 1): Title/H1/Description neu, DE + EN parallel. Skill `copywriting` für
   finale Wortwahl.
3. **PR 3 — Interne Verlinkung** (Phase 3): Service-Card-Link, Footer-Spalte, Q&A-Link.
4. **PR 4 — Structured Data** (Phase 4): Neuer `createLandingStructuredData`-Helper + Tests + Aufruf-Stelle.

Phase 5 (Skill & Docs) fließt jeweils in den passenden PR ein (Skill-Update in PR 1, Memory-Update in PR 4).

---

## Risiken & Rollback

- **Risiko**: Google indexiert die neue URL nicht schnell genug → Sichtbarkeits-Dip in den ersten Wochen.
  **Mitigation**: 301-Redirects sind zwingend, neue URL über Search Console aktiv zur Indexierung anstoßen. Risiko ist
  bei aktuell ohnehin schlecht rankender Seite minimal.
- **Risiko**: Footer-Link-Erweiterung bricht Layout auf Mobile.
  **Mitigation**: Visuell prüfen, ggf. Spalte unter „Kontakt" verschieben.
- **Rollback** PR 1: Route zurück nach `(landing)/landing/`, Redirects entfernen, Sitemap zurück.
- **Rollback** PR 2–4: Standard `git revert` einzeln möglich (jede PR isoliert).
