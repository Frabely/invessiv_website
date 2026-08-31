---
name: Invessiv
description: "Ein ruhiges, hochwertiges und conversion-orientiertes Designsystem für klare digitale Angebote."
colors:
  graphite-brown: "#1d1a18"
  dark-surface: "#282320"
  dark-surface-raised: "#312b27"
  dark-text: "#f4f7fd"
  dark-text-muted: "#d2dae8"
  trust-blue: "#4e83e6"
  trust-blue-hover: "#6899f0"
  trust-blue-active: "#3d6fcb"
  copper-glow: "#e79a49"
  light-canvas: "#eef4fb"
  light-surface: "#ffffff"
  light-surface-soft: "#e2ebf6"
  light-text: "#162033"
  light-text-muted: "#445775"
  light-trust-blue: "#285fc1"
  light-copper: "#cb7728"
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
  card: "24px"
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
    textColor: "{colors.graphite-brown}"
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

Invessiv führt Besucher ruhig und ohne Umwege vom ersten Eindruck zur nächsten sinnvollen Entscheidung. Die Gestaltung wirkt hochwertig und technisch kompetent, ohne sich wie eine austauschbare SaaS-Oberfläche anzufühlen. Klare Leserichtung, großzügige Abstände und präzise Zustände geben komplexeren Angeboten Ruhe; Vertrauensblau markiert die Handlung, Kupferglut bringt Persönlichkeit und Wärme.

Das System ist standardmäßig dunkel, besitzt aber ein gleichwertiges helles Theme. Komponenten wirken sanft geschichtet und leicht taktil: Konturen, Tonwerte und zurückhaltende Schatten trennen Ebenen, während Bewegung ausschließlich Orientierung oder Interaktionsfeedback unterstützt.

Diese Designautorität gilt für die Invessiv-Oberflächen in `apps/web`. Der vollständig isolierte Bereich `src/references/**`, insbesondere KlarKompass Coaching, folgt bewusst einer eigenen Designsprache und darf weder als Quelle noch als Ziel dieses Systems behandelt werden.

**Key Characteristics:**

- Ruhige, conversion-orientierte Führung statt aggressiver Sales-Inszenierung
- Warmer Graphitgrund mit seltenen Kupferakzenten und eindeutigem Vertrauensblau
- Markante Display-Typografie, kombiniert mit sehr lesbarer UI- und Fließtexttypografie
- Großzügige Layoutschienen, fokussierte Textmaße und mobile Vollbreiten-CTAs
- Sanft geschichtete Oberflächen mit klaren Fokus- und Zustandswechseln

## Colors

Die Palette verbindet warme, fast materielle Neutraltöne mit einem seriösen Blau für Handlungen und einer bewusst sparsamen Kupferwärme für Orientierung und Persönlichkeit.

### Primary

- **Vertrauensblau:** Primäre CTAs, aktive Zustände, Fokusführung und klar bestätigte Interaktionen.
- **Helles Vertrauensblau:** Kontrastangepasste CTA- und Interaktionsfarbe im hellen Theme.

### Secondary

- **Kupferglut:** Eyebrows, kleine Marker, ausgewählte Hervorhebungen und warme atmosphärische Akzente.
- **Helles Kupfer:** Kontrastangepasste warme Akzentfarbe im hellen Theme.

### Neutral

- **Graphitbraun:** Standardhintergrund des dunklen Themes und visuelle Basis der Marke.
- **Dunkle Oberflächen:** Karten, Formulare, Navigation und gestaffelte Container im dunklen Theme.
- **Helle Leinwand:** Kühler, ruhiger Grund des hellen Themes.
- **Helle Oberflächen:** Weiße und weich blaugraue Ebenen für Karten und Eingaben.
- **Text und gedämpfter Text:** Hoher Kontrast für Aussagen, kontrolliert reduzierte Kontraste für Erklärungen und Metadaten.
- **Gefahr:** Ausschließlich für Fehler- und destruktive Zustände.

**The Signal Rule.** Vertrauensblau gehört an Entscheidungen und Zustände. Es darf nicht zur großflächigen Dekoration werden.

**The Copper Restraint Rule.** Kupferglut markiert Persönlichkeit und Orientierung, konkurriert aber nie mit dem primären CTA.

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
- **Action Lift:** `0 10px 24px rgba(31, 70, 137, 0.3)` – primäre Handlung im Ruhezustand; beim Hover leicht verstärkt.
- **Header Float:** `0 10px 24px rgba(6, 8, 12, 0.24)` – ausschließlich für den gescrollten Header im dunklen Theme.
- **Ambient Card (Light):** `0 8px 18px rgba(36, 55, 90, 0.08)` – Pendant zu _Ambient Card_ im hellen Theme; kühler und
  deutlich zurückhaltender, damit Karten auf hellem Grund nicht schweben.

**The Layered, Not Floating Rule.** Flächen werden zuerst durch Tonwert und Kontur getrennt. Schatten bestätigen Hierarchie, sie erzeugen sie nicht allein.

## Shapes

Die Formensprache ist freundlich-präzise: Bedienelemente besitzen kompakte, weich gerundete Ecken; Eingabefelder sind etwas großzügiger; Inhaltskarten verwenden deutlichere Radien. Vollständig runde Pillen bleiben kurzen Status-, Zeit- und Kategorieangaben vorbehalten.

Konturen sind fein und kontrastarm. Stärkere farbige Begrenzungen erscheinen nur bei Auswahl, Fokus oder einer klar empfohlenen Option. Organische Radialverläufe dürfen Atmosphäre schaffen, geometrische Raster oder dekorative Linienfelder sind kein Standardmotiv.

## Components

Komponenten wirken präzise und souverän: klare Zustände, leicht taktiles Feedback und keine verspielten Effekte.

### Buttons

- **Shape:** Kompakt weich gerundet mit mindestens 44px großer Interaktionsfläche.
- **Primary:** Vertrauensblauer Verlauf, kräftige Labeltypografie und kontrollierter Action-Lift.
- **Hover / Focus:** Höchstens ein Pixel Anhebung; sichtbarer Zwei-Pixel-Fokusring mit Abstand.
- **Ghost:** Tonale Oberfläche und feine Kontur; der Hover erhält nur einen leichten Blauanteil.

### Chips

- **Style:** Vollständig runde Form, kurze Inhalte, fein getönte Oberfläche und präzise Kontur.
- **State:** Auswahl wird über Kontur, Tonwert und Textkontrast gezeigt; niemals allein über Farbe.

### Cards / Containers

- **Corner Style:** Großzügig gerundet, mit stärkerem Radius als Bedienelemente.
- **Background:** Tonale Theme-Oberflächen, bei Bedarf mit einem sehr zurückhaltenden Spotlight.
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

Kurzer, warmer Orientierungspunkt vor wichtigen Überschriften. Die Pill kombiniert Kupferglut, eine kleine Statusmarke und kompakte Großbuchstaben, bleibt aber visuell deutlich unterhalb des CTA.

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
- **Don't** Kupferglut und Vertrauensblau gleichzeitig um dieselbe Aufmerksamkeit konkurrieren lassen.
- **Don't** KlarKompass oder andere isolierte Referenzdesigns in dieses System übernehmen.
