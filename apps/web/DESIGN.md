---
name: Invessiv
description: "Ein ruhiges, hochwertiges und conversion-orientiertes Designsystem für klare digitale Angebote."
colors:
  graphite: "#191a1c"
  dark-surface: "#222426"
  dark-surface-raised: "#2c2e31"
  dark-text: "#f4f3ef"
  dark-text-muted: "#b9bcc2"
  trust-blue: "#86ace6"
  trust-blue-hover: "#9cbbeb"
  trust-blue-active: "#729bd7"
  brand-orange: "#e38a3c"
  brand-orange-muted: "#d9b08c"
  light-canvas: "#f6f5f2"
  light-surface: "#ffffff"
  light-surface-soft: "#eeede9"
  light-text: "#232526"
  light-text-muted: "#5a5d62"
  light-trust-blue: "#3568ad"
  light-brand-orange: "#af581f"
  light-brand-orange-muted: "#925d3e"
  danger: "#d92d20"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "clamp(2.35rem, 5.4vw, 4.1rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.048em"
  headline:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "clamp(2.05rem, 3.35vw, 2.85rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "clamp(1.18rem, 1.2rem + 0.45vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  control: "12px"
  field: "15px"
  card: "16px"
  card-comfort: "24px"
  card-large: "28px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  section: "clamp(5.5rem, 9.6vw, 9.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.trust-blue}"
    textColor: "#18212f"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  button-ghost:
    backgroundColor: "{colors.dark-surface-raised}"
    textColor: "{colors.dark-text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "46px"
  input:
    backgroundColor: "{colors.dark-surface-raised}"
    textColor: "{colors.dark-text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.9rem 1rem"
    height: "50px"
  card:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  eyebrow:
    backgroundColor: "{colors.dark-surface-raised}"
    textColor: "{colors.dark-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
---

# Design System: Invessiv

## Overview

**Creative North Star: "Klarer Signalweg"**

Invessiv führt Besucher ruhig und ohne Umwege vom ersten Eindruck zur nächsten sinnvollen Entscheidung. Die Gestaltung wirkt hochwertig und technisch kompetent, ohne sich wie eine austauschbare SaaS-Oberfläche anzufühlen. Orange ist die primäre Markenfarbe und prägt Abschnittsmarkierungen, feine Linien und inhaltliche Details in beiden Themes. Blau ist die zweite Akzentfarbe für CTAs, Aktionen, aktive Zustände und einzelne Hervorhebungen.

Das System ist standardmäßig dunkel, besitzt aber ein gleichwertiges helles Theme. Komponenten wirken sanft geschichtet und leicht taktil: Konturen, Tonwerte und zurückhaltende Schatten trennen Ebenen, während Bewegung ausschließlich Orientierung oder Interaktionsfeedback unterstützt.

Diese Designautorität gilt für die Invessiv-Oberflächen in `apps/web`. Der vollständig isolierte Bereich `src/references/**`, insbesondere KlarKompass Coaching, folgt bewusst einer eigenen Designsprache und darf weder als Quelle noch als Ziel dieses Systems behandelt werden.

**Key Characteristics:**

- Ruhige, conversion-orientierte Führung statt aggressiver Sales-Inszenierung
- Neutraler Anthrazitgrund beziehungsweise warmes Offwhite mit wiederkehrenden orangefarbenen Markendetails und eindeutig blauen Aktionen
- Markante Display-Typografie, kombiniert mit sehr lesbarer UI- und Fließtexttypografie
- Großzügige Layoutschienen, fokussierte Textmaße und mobile Vollbreiten-CTAs
- Sanft geschichtete Oberflächen mit klaren Fokus- und Zustandswechseln

## Colors

Die Palette verbindet matte, weitgehend neutrale Flächen mit dem Orange und Blau des farbigen Logos. Beide Themes verzichten auf großflächige Farbwolken. Markenfarbe entsteht durch erkennbare Details statt durch permanente Hintergrundbeleuchtung.

### Primary

- **Markenorange:** Wiederkehrende Abschnittsmarkierungen, Prozessführung, feine Trennlinien und ausgewählte inhaltliche Details.
- **Orange im hellen Theme:** Für die Lesbarkeit abgedunkelte Variante derselben Farbfamilie; kleine Texte nutzen einen zusätzlichen kontraststarken Orangeton.
- **Textbetonungen:** Gedämpftes Blau aus der zweiten Markenfarbe, im hellen Theme kontrastangepasst. Abschnittsmarkierungen bleiben dadurch zurückhaltender als die primären Aktionen. Kleine Markenmarker und dekorative Details dürfen weiterhin Orange tragen.

### Secondary

- **Vertrauensblau:** Primäre CTAs, Aktionen, aktive Zustände und einzelne Hervorhebungen. Die Farbfamilie stammt aus dem farbigen Logo.
- **Blau im hellen Theme:** Dunklere, kontrastangepasste CTA- und Interaktionsfarbe.

### Neutral

- **Anthrazit:** Neutraler Standardhintergrund des dunklen Themes ohne braunen Farbstich.
- **Dunkle Oberflächen:** Karten, Formulare, Navigation und gestaffelte Container im dunklen Theme.
- **Helle Leinwand:** Leicht warmes Offwhite ohne blauen oder orangefarbenen Verlauf.
- **Helle Oberflächen:** Weiße und neutral abgetönte Ebenen für Karten und Eingaben.
- **Text und gedämpfter Text:** Hoher Kontrast für Aussagen, kontrolliert reduzierte Kontraste für Erklärungen und Metadaten.
- **Gefahr:** Ausschließlich für Fehler- und destruktive Zustände.

**The Signal Rule.** Vertrauensblau gehört an Entscheidungen und Zustände. Es darf nicht zur großflächigen Dekoration werden.

**The Orange Identity Rule.** Orange trägt die Markenidentität in beiden Themes. Die Hintergrundfläche bleibt ruhig; Blau kennzeichnet vor allem Handlungen. Der plastische Verlauf des Logos bleibt dem Logo vorbehalten.

Die Hero-Headlines auf Home, Landingpage, Generator und Referenzseite tragen denselben sanft animierten Orange-Blau-Verlauf (fünf Sekunden pro Richtung). Die gemeinsame Komponente `components/shared/gradient-text/` definiert Farben, Textmaskierung und Animation einmalig. Die Farben sind deutlich entsättigt: weiches Apricot und Graublau im dunklen Theme, kontrastangepasste gedämpfte Varianten im hellen Theme. Bei reduzierter Bewegung bleibt der vollständige Verlauf statisch. Rechte Besucher-Bubbles im Home-Chat nutzen ein gedämpftes Blaugrau zur Unterscheidung von den neutralen Antworten; Orange bleibt dort einzelnen Textbetonungen vorbehalten.

Die Verlaufs-Komponente besitzt eine sichtbare Textfarbe als Grundzustand. Transparente Textfüllung wird nur bei unterstützter Textmaskierung und Farbmischung aktiviert. Fehlende neuere Palette-Variablen fallen auf bestehende Rollen beziehungsweise die Textfarbe zurück, damit ein gemischter CSS-Stand beim lokalen Neuladen die Headline nicht unsichtbar macht.

### Farbbasis und Rollen

Buttons, Text-CTAs und der Chat-Sendepfeil teilen sich den Orange-Blau-Verlauf aus `components/shared/action-color/action-color.module.css`. Die Verlaufsenden und ihre Hover-/Active-Zustände stammen ausschließlich aus den Aktionsrollen. Die Leistungsauswahl und die Leistungsmodelle im Kontaktformular verwenden bei Auswahl einen auf sechs Prozent gedämpften Verlauf und Text im vollen CTA-Verlauf. Nicht ausgewählte Optionen erhalten beim Hover beziehungsweise Tastaturfokus einen Verlaufsrahmen und Text im CTA-Verlauf. Kontakt- und Social-Icons zeigen auch mobil dauerhaft den CTA-Verlauf, während Kreisflächen und Rahmen im Normalzustand blau bleiben. Beim Desktop-Hover beziehungsweise Fokus erhalten auch Fläche und Rahmen den CTA-Verlauf. Die Formen stammen aus Font Awesome.

`components/shared/text-cta/` definiert die dritte und vierte CTA-Stufe gemeinsam für Links, Buttons und native Zitat-Aufklapper. `tertiary` zeigt den CTA-Verlauf im Text und in einer Linie ausschließlich unter dem Text; der optionale Pfeil bleibt außerhalb der Linie. Dazu gehören „Mehr zu Landingpages“ und „Projekt im Detail ansehen“. `quaternary` zeigt blauen Text mit einer Unterstreichung im CTA-Verlauf; erst bei Desktop-Hover oder Tastaturfokus übernimmt auch der Text den Verlauf. Dazu gehören „Ganzes Zitat lesen“, der direkte Mail-Link, Datenschutz- und weitere Inhaltslinks. Farbdefinition und Fokusverhalten bleiben in der gemeinsamen Komponente.

Header-Navigation und Footer-Textlinks verwenden `components/shared/navigation-link/`: Ab 901 px und ausschließlich bei `hover: hover` mit `pointer: fine` erhalten sie beim Hover Text im CTA-Verlauf und eine über 240 ms von links einlaufende Verlaufsunterstreichung. Auf Touch-Geräten und im mobilen Layout bleibt der Effekt aus. Bei reduzierter Bewegung erscheint die Linie ohne Übergang; Tastaturfokus bleibt über eine sichtbare Kontur erkennbar.

Theme- und Sprachumschalter teilen ihren Desktop-Hover über `components/shared/header-control/`: Rahmen und Icons wechseln zum CTA-Verlauf, beim Sprachumschalter auch der aktuelle Sprachcode und die DE/EN-Auswahl. Das Sprachmenü schließt bei Außenklick beziehungsweise Touch, beim Verlassen per Tastatur und mit Escape; Escape setzt den Fokus auf den Auslöser zurück. Die Dismiss-Logik liegt in `hooks/shared/use-dismissible-details.ts`.

Inaktive Prozesskarten (bereits durchlaufen und noch bevorstehend) nehmen sich durch Flächen nahe am Seitenhintergrund, schwache Konturen und gedämpfte, kontrastgeprüfte Texte zurück. Der aktive Schritt bleibt klar hervorgehoben. Die animierte Verbindung behält ihren gewünschten Markenverlauf. Die Unterstreichungen der Referenzfragen verwenden wieder einheitlich Highlight-Blau. Informative Highlight-Icons, Trennlinien und Zitat-Anführungszeichen bleiben bei ihrer separaten Highlight-Rolle.

Auf der Landingpage verwenden Vertrauens- und Zielgruppen-Abschnitt, Ablauf und Starter-Karte die blaue Highlight-Rolle einschließlich ihrer Flächen und Konturen. Die Starter-Checkliste nutzt einfache blaue Font-Awesome-Haken ohne Kreis. Der aktive Demo-Rahmen, tatsächliche CTA-Buttons und die Chat-Aktion verwenden den CTA-Verlauf; die FAQ-Pluszeichen zeigen ihn dauerhaft. Home- und Landingpage-FAQ teilen den aufklappbaren Button unter `components/shared/disclosure-button/`, einschließlich Pfeil, Fokus und Hover-Verlauf. Beide Chat-Aktionen verwenden auch beim Hover den CTA-Rahmen statt einer rein blauen Kontur.

Die verbindlichen Laufzeitwerte stehen in `src/app/globals.css`. `DESIGN.md` beschreibt die Gestaltung; die Palette wird nicht aus diesem Dokument geladen.

`--color-highlight` ist die semantische Farbe für Hervorhebungen ohne Aktion. Sie leitet sich aus `--color-highlight-base` ab und besitzt die Varianten `--color-highlight-surface` für dezente Flächen und `--color-highlight-border` für Konturen und Trennlinien. Trust-Points einschließlich „Direkter Ansprechpartner“, Problem-Icons und Lösungssatz, Leistungs- und Zeitraum-Icons, Empfehlungstext, Aufzählungspunkte und Leistungstrennlinien verwenden diese Rolle. Abschnittsmarkierungen, Chat-Betonungen und Ergebnislabels nutzen dieselbe Basis. In beiden Themes bleibt das zuletzt gewählte gedämpfte Blau erhalten.

Klickbare CTAs, Links, Hover, Fokus und aktive Auswahlen verwenden weiterhin die Aktionsrollen. Die Highlight-Rolle erhält selbst keine Hover- oder Active-Variante. Logos, illustrative Markenverläufe und die Hero-Verläufe bleiben bewusst eigenständige Markenmotive. Neue rein informative Hervorhebungen verwenden die Highlight-Rolle statt eigener Orange- oder Blautöne. Der Browser-Test prüft, dass eine Änderung der Highlight-Basis die informativen Elemente gemeinsam aktualisiert, ohne CTA oder Auswahlzustände umzufärben.

- `--color-brand-primary` trägt die primäre Markenfarbe, `--color-brand-secondary` die zweite Markenfarbe. Beide besitzen je einen kontrastangepassten Wert pro Theme.
- `--color-highlight-base` mischt die zweite Markenfarbe mit gedämpftem Text zu einem zurückhaltenden Blau. Abschnittsmarkierungen, Chat-Betonungen und Empfehlungslabels verwenden dieselbe Textrolle. Deren bestehende Aliasnamen `--color-accent-orange-text` und `--color-accent-orange-text-hover` bleiben kompatibel; ihre Werte sind jetzt blau. `--color-brand-primary-muted` trägt separat das weiche Orange der Headline, damit Textbetonungen und Headline-Wärme unabhängig bleiben.
- `--color-action-base` verweist standardmäßig auf die zweite Markenfarbe. CTA, Hover, Active, Fokus, aktive Auswahlen und weitere Aktionszustände werden davon abgeleitet. `--color-action-accent` bildet das orangefarbene Ende des CTA-Verlaufs und verweist standardmäßig auf die primäre Markenfarbe. Ein späteres grünes Aktionsschema benötigt nur einen passenden Basiswert je Theme; das orangefarbene Verlaufsende bleibt unabhängig steuerbar.
- Chatflächen folgen der zweiten Markenfarbe über eine lokale `--bubble-accent`-Rolle. Die vier Headline-Verlaufsfarben werden lokal aus Marken-, Hervorhebungs- und Textfarben gemischt. Beide bleiben bei einer isolierten Änderung der Aktionsfarbe erhalten.
- Komponenten dürfen Mischverhältnisse, Transparenz und lokale Rollen festlegen. Eigene feste Orange- oder Blautöne für diese Rollen werden nicht hinterlegt. Neutrale Masken- und Schattenwerte sowie eigenständige Referenzdesigns gehören nicht zur Aktionspalette.

Bei einer Änderung von Blau zu Grün wird `--color-action-base` in `:root` und `[data-theme="light"]` überschrieben. Soll die gesamte zweite Markenfarbe wechseln, wird stattdessen `--color-brand-secondary` angepasst; dann folgen standardmäßig auch Aktionen, Chatflächen und Headline. Der E2E-Test `e2e/theme-colors.e2e.ts` prüft die getrennte Aktionsänderung in beiden Themes. Neue Basisfarben müssen weiterhin auf ausreichenden Kontrast geprüft werden; eine beliebige helle oder dunkle Farbe garantiert keinen lesbaren Buttontext.

Die Website verwendet `public/brand/invessiv-logo-mehr-abstand.svg` für Logo und dekoratives Markenmotiv. Der gemeinsame Pfad und die Abmessungen liegen in `common/constants/brand/brand-assets.ts`; die app-neutrale `BrandLockup`-Komponente nimmt sie über `logoSrc`, `logoWidth` und `logoHeight` entgegen. Das Logo besitzt ein breiteres Seitenverhältnis als das bisherige Icon. Ersetzte Varianten werden entfernt; das Standardlogo bleibt für den gemeinsamen Komponenten-Fallback bestehen.

## Typography

**Display Font:** Bricolage Grotesque mit Plus Jakarta Sans als Fallback
**Body Font:** Plus Jakarta Sans mit Segoe UI als System-Fallback

**Character:** Bricolage Grotesque gibt den großen Aussagen eine eigenständige, leicht handwerkliche Präzision. Plus Jakarta Sans hält Navigation, Formulare und längere Texte ruhig, modern und schnell erfassbar.

### Hierarchy

- **Display:** Ausschließlich für Hero-Aussagen und wenige große Conversion-Momente; kompakt, kräftig und eng gesetzt.
- **Headline:** Sektionsüberschriften mit klarer Hierarchie und balancierten Zeilenumbrüchen.
- **Title:** Karten-, Panel- und Angebotstitel; deutlich, aber nicht lauter als die Seitenstruktur.
- **Body:** Fließtext und Erklärungen mit großzügiger Zeilenhöhe; Standardmaß maximal etwa 72 Zeichen.
- **Label:** Bedienelemente, Feldbezeichnungen, Chips und kurze Metadaten; hohe Lesbarkeit vor dekorativer Wirkung.

**The One Display Voice Rule.** Bricolage Grotesque trägt Überschriften, nicht Formulare, Navigation oder längere Fließtexte.

## Layout

Die zentrale Layoutschiene ist auf breite Desktopdarstellung ausgelegt und bleibt mit einer maximalen Inhaltsbreite von 1520px zentriert. Horizontale Ränder reagieren fließend auf den Viewport; ab 1200px verdichtet sich das Gutter, bei großen Desktopflächen wird es deutlich großzügiger. Inhaltstexte bleiben in fokussierten Lesemaßen von ungefähr 58–72 Zeichen.

Sektionen nutzen einen großzügigen, responsiven Vertikalrhythmus. Desktoplayouts dürfen asymmetrische Zweispaltenraster verwenden, wenn eine klare inhaltliche Priorität erhalten bleibt. Unter 900px werden Navigation, Hero und Inhaltsraster konsequent einspaltig; zentrale CTAs nehmen auf kleinen Geräten die volle verfügbare Breite ein. Dekorative Seitenakzente werden mobil entfernt, wenn sie keinen funktionalen Wert besitzen.

**The Guided Rail Rule.** Breite Flächen schaffen Atmosphäre, aber Copy und Aktionen bleiben auf einer klaren, zentrierten Führungsschiene.

## Elevation & Depth

Das System ist sanft geschichtet. Tonale Oberflächen und feine Konturen leisten den Großteil der Trennung; Schatten unterstützen nur Navigation, wichtige Karten, CTAs und Hoverzustände. Glasartige Unschärfe ist auf den gescrollten Desktop-Header begrenzt und wird auf Mobile deaktiviert.

### Shadow Vocabulary

- **Ambient Card:** `0 10px 24px rgba(8, 10, 15, 0.2)` – ruhige Trennung wichtiger Karten vom Hintergrund.
- **Action Lift:** `var(--shadow-action)` – kleiner neutraler Schlagschatten an primären Aktionen, ohne farbigen Glow.
- **Header Float:** `0 10px 24px rgba(6, 8, 12, 0.24)` – ausschließlich für den gescrollten Header im dunklen Theme.
- **Ambient Card (Light):** `0 8px 18px rgba(36, 55, 90, 0.08)` – Pendant zu _Ambient Card_ im hellen Theme; kühler und
  deutlich zurückhaltender, damit Karten auf hellem Grund nicht schweben.

**The Layered, Not Floating Rule.** Flächen werden zuerst durch Tonwert und Kontur getrennt. Schatten bestätigen Hierarchie, sie erzeugen sie nicht allein.

## Shapes

Die Formensprache ist freundlich-präzise: Bedienelemente besitzen kompakte, weich gerundete Ecken; Eingabefelder sind etwas großzügiger; Inhaltskarten verwenden deutlichere Radien. Vollständig runde Pillen bleiben kurzen Status-, Zeit- und Kategorieangaben vorbehalten.

Konturen sind fein und kontrastarm. Stärkere farbige Begrenzungen erscheinen nur bei Auswahl, Fokus oder einer klar empfohlenen Option. Seitenhintergründe sind einfarbig; großflächige Radialverläufe, farbige Halos und dekorative Linienfelder sind kein Standardmotiv. Neutrale Bildüberlagerungen dürfen die Lesbarkeit sichern.

## Components

Komponenten wirken präzise und souverän: klare Zustände, leicht taktiles Feedback und keine verspielten Effekte.

### Buttons

- **Shape:** Kompakt weich gerundet mit mindestens 44px großer Interaktionsfläche.
- **Primary:** Schräger Orange-Blau-Verlauf nach dem farbigen Logo, kräftige Labeltypografie und kleiner neutraler Action-Lift. Die gemeinsame Button-Komponente definiert den Verlauf einmalig; Hover und Active leiten beide Verlaufsenden aus ihren Basisfarben ab.
- **Hover / Focus:** Höchstens ein Pixel Anhebung; sichtbarer Zwei-Pixel-Fokusring mit Abstand.
- **Ghost:** Tonale Oberfläche und feine Kontur; der Hover erhält nur einen leichten Blauanteil.

### Chips

- **Style:** Vollständig runde Form, kurze Inhalte, fein getönte Oberfläche und präzise Kontur.
- **State:** Auswahl wird über Kontur, Tonwert und Textkontrast gezeigt; niemals allein über Farbe.

### Cards / Containers

- **Corner Style:** Großzügig gerundet, mit stärkerem Radius als Bedienelemente.
- **Background:** Matte, tonale Theme-Oberflächen; Prozess- und Kontaktkarten sind deckend und ohne Spotlight oder Glasunschärfe.
- **Shadow Strategy:** Sanft geschichtet; stärkere Schatten nur für Hover oder klare Priorität.
- **Border:** Feine Standardkontur, Akzentkontur nur für empfohlenen oder aktiven Zustand.
- **Internal Padding:** Typischerweise großzügig und auf Desktop leicht erweitert.

### Inputs / Fields

- **Style:** Tonal gefüllte Felder, klare Labels, großzügige Höhe und lesbarer Hilfetext.
- **Focus:** Sichtbarer Fokusring plus leichte Akzentkontur.
- **Error / Disabled:** Fehler werden textlich und farblich erklärt; deaktivierte Elemente verlieren Kontrast und Bewegung, bleiben aber erkennbar.

### Navigation

Die Desktopnavigation sitzt mittig zwischen Marke und Aktionen. Im Ausgangszustand bleibt der Header transparent; beim Scrollen erhält er eine ruhige, geschichtete Oberfläche. Mobile Navigation nutzt 44px große Controls und ein klar begrenztes Menüpanel ohne Hintergrundunschärfe.

### Eyebrow Pill

Kurzer orangefarbener Orientierungspunkt vor wichtigen Überschriften. Die bestehende Abschnittsmarkierung greift die primäre Markenfarbe auf und bleibt visuell unterhalb des CTA.

## Do's and Don'ts

### Do:

- **Do** eine Handlung pro visueller Hierarchie eindeutig mit Vertrauensblau markieren.
- **Do** beide Themes als gleichwertige Systeme behandeln und Zustände in beiden prüfen.
- **Do** großzügige Abstände und begrenzte Textmaße für schnelle Erfassung nutzen.
- **Do** Fokuszustände sichtbar halten und reduzierte Bewegung respektieren.
- **Do** die Referenzbereiche unter `src/references/**` vollständig von Invessiv-Designentscheidungen trennen.

### Don't:

- **Don't** generisches SaaS-Neon, großflächige Glow-Effekte oder aggressive Sales-Optik einführen.
- **Don't** Glassmorphism als allgemeine Materiallogik verwenden.
- **Don't** dekorative Raster, Linienfelder oder Gradient-Text als wiederkehrende Signatur einsetzen.
- **Don't** Markenorange und Aktionsblau gleichzeitig um dieselbe Aufmerksamkeit konkurrieren lassen.
- **Don't** KlarKompass oder andere isolierte Referenzdesigns in dieses System übernehmen.
