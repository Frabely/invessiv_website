# Desktop-Content-Raender Plan

## Kurzfassung

- Ziel ist ein konsistentes Desktop-Layout-System fuer alle Seiten und Sections, statt pro Bereich leicht abweichender Aussenkanten.
- Best Practice fuer grosse Desktop-Viewports ist: aeusserer Seitenrand konsistent halten, die eigentliche Lesbarkeit aber ueber innere Textmasse steuern. Breite Layout-Schienen und schmalere Textspalten werden getrennt behandelt.
- Fuer dieses Repo ist die Hauptursache klar: Auf grossen Screens wird das Layout aktuell kuenstlich verengt (`--max-content-width` faellt in der Wide-Monitor-Query auf `1140px`, zusaetzlich kommen Extra-Inset-Paddings dazu). Das erzeugt auf `1920x1080` und noch staerker auf `2560x1440` zu viel leeren Aussenraum.
- Die Umsetzung erfolgt abschnittsweise und ohne Commit, bis explizit freigegeben.

## Best-Practice-Zielbild

- Gemeinsame Aussenkante fuer Desktop:
  - `1920x1080`: Ziel-Rand pro Seite grob `80-120px`
  - `2560x1440`: Ziel-Rand pro Seite grob `96-160px`
- Gemeinsame Inhalts-Schiene:
  - Standard-Layout-Schiene fuer Marketing/Projects: ca. `1440-1680px`, je nach Viewport-Stufe
  - Keine Rueckstufung auf eine schmalere Wide-Monitor-Sonderbreite
- Lesbare Textmasse innerhalb dieser Schiene:
  - Fliesstext und Legal-Text auf `60-75ch`
  - Intro-/Lead-Texte meist `52-68ch`
  - Headlines nach Motiv, aber nicht die Aussenkante treiben lassen
- Gestaltungsregel:
  - Aussenrand gleich
  - innere Komposition unterschiedlich
  - Hero/Proof/Projects duerfen visuell grosszuegiger sein, aber ihre Content-Ausrichtung bleibt an derselben Desktop-Schiene

## Skills und Recherchebasis

- Lokal verpflichtend nutzen: `frontend-design`
  - passt zum Repo-Standard und zum visuellen Charakter der Aufgabe
- Nuetzliche externe Skills von `skills.sh`:
  - `frontend-design` von `am-will/codex-skills` (`1.3K` Weekly Installs): stark fuer hochwertige Frontend-/Spacing-Entscheidungen
  - `web-design-guidelines` von `vercel-labs/agent-skills` (`254.4K` Weekly Installs): gut fuer anschliessenden Review gegen aktuelle UI-/UX-Regeln
  - `ux-design` von `mindrally/skills` (`133` Weekly Installs): sinnvoll fuer Lesbarkeit, Hierarchie und Whitespace-Entscheidungen
- Relevante Quellen fuer die Breitenlogik:
  - Baymard: lesbare Textzeilen ideal grob `50-75` Zeichen, WCAG-orientiert maximal `80` Zeichen
  - web.dev: Layouts nicht auf feste Viewport-Breiten auslegen, sondern Container und Komponenten responsiv fuehren
  - Links:
    - https://baymard.com/blog/line-length-readability
    - https://web.dev/articles/new-responsive
    - https://skills.sh/am-will/codex-skills/frontend-design
    - https://skills.sh/vercel-labs/agent-skills/web-design-guidelines
    - https://skills.sh/mindrally/skills/ux-design

## Schritt-fuer-Schritt-Umsetzung

### 1. Baseline und Tokens festziehen [erledigt]

- Bestehende Breitenlogik zentral inventarisieren:
  - `src/app/globals.css`
  - `src/components/marketing/shared/layout-shell/*`
  - `src/components/marketing/site-header/*`
  - `src/components/marketing/home/sections/footer-section/*`
  - `src/components/legal/legal-document-layout/*`
- Neue Desktop-Tokens definieren:
  - gemeinsame aeussere Desktop-Gutter
  - gemeinsame maximale Content-Schiene
  - separate Text-Measures fuer schmale Lesespalten
- Wide-Monitor-Sonderregel neu aufsetzen:
  - bestehende Verengung auf `1140px` entfernen
  - grosse Screens nicht schmaler, sondern sinnvoll breiter behandeln

### 2. Shared Layout Shell zuerst korrigieren [erledigt]

- `LayoutShell` zur kanonischen Desktop-Schiene machen
- Logik so umbauen, dass Marketing-Seiten ab Desktop eine konsistente Aussenkante bekommen
- Keine komponentenspezifischen Workarounds in einzelnen Sections einfuehren, solange die Shell nicht sauber ist
- Ergebnis dieses Schritts:
  - Home-Sections, die `LayoutShell` nutzen, erben die neue Breite sofort kontrolliert

### 3. Header separat ausrichten [erledigt]

- `site-header` auf dieselbe Desktop-Aussenkante wie die Content-Schiene bringen
- Header visuell vollbreit lassen, aber die innere Navigation/Brand/CTA exakt an die neue Grid-Schiene koppeln
- Wide-Monitor-Insets im Header an die neue Token-Logik anbinden
- Pruefen:
  - Desktop bei `1920` nicht zu mittig-kompakt
  - Desktop bei `2560` nicht verloren oder ueberdehnt

### 4. Hero separat anpassen

- Hero nicht blind auf Textbreite begrenzen, sondern in zwei Ebenen fuehren:
  - Aussenkante/Content-Grid an die neue gemeinsame Desktop-Schiene
  - Textblock intern weiter auf lesbare Masse begrenzen
- Hero-Grid-Spalten neu ausbalancieren:
  - Copy darf leicht mehr Raum erhalten
  - Visual bleibt gross genug, ohne die Aussenkante wieder enger wirken zu lassen
- Hero-Only-Sonderfaelle dokumentieren:
  - wenn noetig eigene Maxima fuer Visual-Spalte
  - aber keine abweichende Gesamt-Aussenkante

### 5. Home-Sections einzeln abarbeiten

- Reihenfolge:
  1. `included`
  2. `services`
  3. `proof`
  4. `process`
  5. `faq`
  6. `contact`
  7. `footer`
- Fuer jede Section derselbe Ablauf:
  1. pruefen, ob sie die gemeinsame Shell korrekt nutzt
  2. innere Grids/Spalten an neue Desktop-Breite anpassen
  3. Textmasse auf Lesbarkeit begrenzen
  4. Medien-/Card-Grids breiter nutzen, ohne Text mitzuziehen
- Besondere Pruefungen:
  - `proof`: Review-/Project-Grid soll breiter wirken, Text aber kompakt bleiben
  - `process`: narrative Mittelachse und Step-Layout bei mehr Breite nicht zerfallen lassen
  - `contact`: Formular- und Info-Spalten auf Desktop balancieren
  - `footer`: Footer-Inhalt auf dieselbe Aussenkante wie Header/Home ausrichten

### 6. Projects-Seite separat umbauen

- `projects-page` an dieselbe gemeinsame Desktop-Schiene anbinden
- `pageHero`, `projectsGrid`, Projektkarten und Media-Framing einzeln nachziehen
- Projektkarten duerfen breiter und luftiger werden, aber:
  - Intro-/Summary-Texte bleiben begrenzt
  - Device-/Browser-Frames duerfen mehr Flaeche nutzen
- Besonderer Fokus:
  - Wechsel-Layouts (`default`/`reverse`) muessen bei `1920` und `2560` gleich stark wirken
  - Karten duerfen nicht wie schmale Inseln in zu viel Leerraum stehen

### 7. Legal-Seiten separat umbauen

- Gilt fuer:
  - `imprint`
  - `terms`
  - `privacy`
- `legal-document-layout` auf dieselbe aeussere Desktop-Schiene bringen
- Legal-Text nicht auf Marketing-Breite aufblasen:
  - aeussere Kante angleichen
  - innere Lesespalte klar schmal halten
- Breadcrumbs, Intro-Card und Dokumentinhalt getrennt behandeln:
  - Breadcrumbs an die gemeinsame Aussenkante
  - Intro-Card moderat breiter moeglich
  - Dokumenttext strikt lesbar halten

### 8. Cross-Page-Konsistenz und Desktop-QA

- Am Ende Desktop-QA fuer diese Zielbilder:
  - Home
  - Projects
  - Imprint
  - Terms
  - Privacy
- Vergleich in mindestens diesen Viewports:
  - `1920x1080`
  - `2560x1440`
- Pro Viewport pruefen:
  - gleiche Aussenkante Header/Main/Footer
  - kein Bereich wirkt schmaler als noetig
  - Textzeilen bleiben lesbar
  - Grids nutzen zusaetzliche Breite sichtbar aus
  - keine horizontalen Ueberlaeufe oder asymmetrischen Randfehler

## Test- und Abnahmekriterien

- Technisch:
  - `npm run lint`
  - `npm run build`
- Visuell pro Schritt:
  - Desktop-Check auf `1920x1080`
  - Desktop-Check auf `2560x1440`
  - Header, Content und Footer teilen dieselbe aeussere Schiene
- Inhaltlich:
  - Legal-/Lead-/Body-Text bleibt lesbar und wird nicht unnoetig breit
  - Hero, Proof, Services und Projects wirken auf grossen Screens bewusst grosszuegiger
  - Mobile/Tablet-Verhalten bleibt unveraendert, ausser wo Desktop-Tokens sauber entkoppelt werden muessen

## Annahmen und Defaults

- Default-Entscheidung: ein gemeinsames Desktop-Breiten-System fuer alle Seiten ist besser als sectionweise wechselnde Aussenraender.
- Unterschiede zwischen Sections entstehen primaer ueber innere Grids, Textmasse, Visual-Breiten und Komposition, nicht ueber andere Aussenkanten.
- Full-bleed Hintergruende, Glow-/Noise-Layer und Hero-Atmosphaere duerfen ausbrechen; inhaltliche Kanten nicht.
- Es wird abschnittsweise gearbeitet.
- Nach jedem Schritt bleibt das Changeset lokal und wird nicht committed, bis es ausdruecklich freigegeben wird.
