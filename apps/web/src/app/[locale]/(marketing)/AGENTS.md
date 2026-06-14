# AGENTS.md - Web-Marketing-Routen

## Geltungsbereich

Diese Regeln gelten für alle öffentlichen Marketing-Routen unter `apps/web/src/app/[locale]/(marketing)/`, aktuell Home,
Projects und Service-Detailseiten wie `/[locale]/services/landing-page`.

## Routing

- Die Route-Gruppe `(marketing)` ist nur organisatorisch und darf nicht in sichtbaren URLs auftauchen.
- Service-Detailseiten verwenden englische Slugs. Die Landingpage-Detailroute ist kanonisch
  `/[locale]/services/landing-page`.
- Alte Landing-URLs (`/[locale]/landing`) bleiben ausschließlich als Redirect-Quelle in `next.config.ts` bestehen.
- `/[locale]/services` ist aktuell keine eigene Übersichtsseite und verweist per Redirect auf `/${locale}#services`.
- Neue interne Links müssen über `SITE_ROUTES` und zentrale Locale-Path-Helper aufgebaut werden, nicht über lokale
  Pfad-String-Konstruktion im JSX.

## SEO und Structured Data

- Jede Route definiert eigene Metadata inklusive Canonical und `alternates.languages`.
- Die Home bleibt breit auf Webentwicklung und digitale Lösungen positioniert; die Landingpage bleibt die fokussierte
  Service-Detailseite für Landingpages.
- Landingpage-spezifische Structured Data wird über `createLandingStructuredData` erzeugt. Generische
  Marketing-Structured-Data nur für breite Marketing-Seiten verwenden.
- Sprach- oder suchrelevante Texte gehören in Dictionaries, nicht in Route-Dateien oder SEO-Helper.
- Jede Landing/Service-Detailseite hat ein primäres Keyword-Cluster und eine klare Suchintention (
  informational/commercial); genau eine H1 pro Seite.
- OG-Bilder pro Offer/Template vorsehen (Fallback erlaubt), damit Shares konsistent bleiben.

## i18n und Copy

- Alle sichtbaren und suchrelevanten Texte werden für DE und EN parallel gepflegt.
- Bei Copy-, CTA-, Meta- oder Structured-Data-Textänderungen ist der Skill `copywriting` zu nutzen.
- Keine locale-basierten Inline-Ternaries für sprachabhängige Inhalte.

## Komponenten

- Route-Dateien orchestrieren nur und importieren fertige Komponenten aus `apps/web/src/components/marketing/**`.
- Landing-Komponenten bleiben unter `apps/web/src/components/marketing/landing/`; Home-Komponenten unter
  `apps/web/src/components/marketing/home/`.
- Interne Verlinkung zwischen Home und Service-Detailseiten muss crawlbar, tastaturbedienbar und ohne verschachtelte
  interaktive Elemente umgesetzt werden.
