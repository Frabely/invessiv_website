# AGENTS.md - Web-Marketing-Routen

## Geltungsbereich

Diese Regeln gelten für alle öffentlichen Marketing-Routen unter `apps/web/src/app/[locale]/(marketing)/`, aktuell Home,
References und Service-Detailseiten wie `/[locale]/services/landing-page`.

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
- Metadata, OpenGraph und Structured Data müssen die unten definierte Positionierung der jeweiligen Route abbilden;
  Inhalte eines anderen Produkts oder einer anderen Route dürfen nicht als SEO-Vorlage übernommen werden.
- Die Home verwendet die Title-Konvention `Invessiv | Kernversprechen` und fokussiert das Keyword-Cluster Webdesign,
  Chemnitz, KMU/Dienstleister und Anfragen. Breite Begriffe wie digitale Lösungen, interne Tools oder Prozessoptimierung
  sind keine primäre Home-Positionierung.
- Die Landingpage-Detailroute verwendet landingpage-spezifische Metadata und Structured Data über
  `createLandingStructuredData`. Ihr Keyword-Cluster bleibt Landingpage-Erstellung, Conversion und Anfragen innerhalb
  derselben persönlichen Invessiv-/Moritz-Hecht-Positionierung.
- Generische Marketing-Structured-Data darf auf der Home nur verwendet werden, wenn Service-Typ und Beschreibung mit der
  aktuellen Webdesign-Positionierung übereinstimmen; veraltete Sammelangebote dürfen nicht über Schema.org
  fortgeschrieben werden.
- Sprach- oder suchrelevante Texte gehören in Dictionaries, nicht in Route-Dateien oder SEO-Helper.
- Jede Landing/Service-Detailseite hat ein primäres Keyword-Cluster und eine klare Suchintention (
  informational/commercial); genau eine H1 pro Seite.
- OG-Bilder pro Offer/Template vorsehen (Fallback erlaubt), damit Shares konsistent bleiben.
- Die sprachspezifischen OG-Bilder für Home und References werden reproduzierbar mit
  `apps/web/scripts/generate-og-images.mjs` erzeugt. Bei Änderungen an Hero-/Referenzbildern, OG-Copy oder deren Layout
  dieses Script anpassen und anschließend bei laufender Web-App mit
  `node apps/web/scripts/generate-og-images.mjs` neu ausführen. Als Quellen dienen die jeweiligen Meta-Dictionaries und
  bestehenden Bildassets; die Ergebnisse liegen unter `apps/web/public/og/home-{de,en}.png` und
  `apps/web/public/og/references-{de,en}.png`. DE und EN immer gemeinsam aktualisieren und alle Ausgaben im Format
  1200 × 630 visuell prüfen.

## Verbindliche Positionierung und Produktabgrenzung

### Home (`/[locale]`)

- Kernpositionierung: persönliches Webdesign für KMU und Dienstleister aus Chemnitz und Umgebung.
- Moritz Hecht ist der direkte Ansprechpartner; dieser persönliche Bezug ist ein Vertrauensmerkmal, keine anonyme
  Agenturpositionierung.
- Kernnutzen: Angebote verständlich vermitteln, Vertrauen schaffen und Interessenten gezielt zu Anfragen führen.
- Softwareentwicklung darf als fachlicher Background und Vertrauenssignal genannt werden, aber nicht als gleichrangiges
  Hauptangebot der Home.
- Interne Tools, Prozessoptimierung, KI-Workflows und allgemein formulierte „digitale Lösungen“ sind keine Quelle für
  neue Home-Copy. Noch vorhandene Abschnitte mit dieser breiten Ausrichtung gelten ausschließlich als schrittweise zu
  migrierender Bestand und nicht als freigegebener Markenstandard.

### Landingpage-Service (`/[locale]/services/landing-page`)

- Die Route ist die fokussierte Angebotsseite für verkaufspsychologisch durchdachte, conversion-orientierte Landingpages
  und bleibt unter derselben persönlichen Positionierung von Invessiv und Moritz Hecht.
- Sie konkretisiert das Home-Versprechen für ein einzelnes Angebot: klare Kommunikation, Vertrauen und mehr passende
  Anfragen. Sie wird nicht als separate Software-, Tool- oder Prozessoptimierungsmarke formuliert.
- Landingpage-spezifische Aussagen zu Ablauf, Preislogik, CTA-Strategie und SEO richten sich zusätzlich nach dem Skill
  `invessiv-landing`.
- Diese Landingpage-Regeln sind keine Home-Defaults: Preis, Haupt-CTA und Ein-Angebot-Funnel dürfen nicht ungeprüft auf
  die Home übertragen werden.

### Unabhängige Bereiche

- Der LinkedIn-Post-Generator unter `/[locale]/services/linkedin-post` ist ein eigenständiges Produkt. Seine Copy,
  Positionierung, SEO-Daten und Serverregeln definieren weder die Home noch die Landingpage-Service-Route.
- Inhalte aus LinkedIn-Post-, Workspace-, Lead- oder internen Tool-Bereichen werden nicht auf Home oder Landingpage
  übertragen, solange der Nutzer dies nicht ausdrücklich beauftragt.

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
