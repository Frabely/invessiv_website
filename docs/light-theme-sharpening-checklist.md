# Light Theme Sharpening Checklist

## Ziel

Diese Datei steuert die schrittweise Überarbeitung des bereits vorhandenen Light Themes.

Dark Theme bleibt visuell und technisch unverändert.
UI-Struktur, Seitenaufbau und Section-Reihenfolge bleiben im Wesentlichen unverändert.

Es geht ausschließlich um:

- saubere Initialisierung des Light Themes ohne kurzen Dark-Flash
- moderneren Theme-Switch
- schärfere, klarere Light-Farben
- vollständigeres und konsistenteres Light-Theming in allen Marketing-Sections
- Reduktion von Light-spezifischer Unschärfe, wo sie Lesbarkeit oder Präzision schwächt

## Feste Regeln

- Dark Theme nicht verändern.
- Keine strukturellen Redesigns der Sections.
- Keine Inhaltsumbauten.
- Keine Inline-Texte für neue UI-Labels; DE/EN-Dictionaries mitpflegen.
- Jede Änderung wird pro Section separat geprüft und abgenommen.
- Nach jedem Schritt muss klar testbar sein, was genau geändert wurde.

## Globale Abfolge

1. Theme-Bootstrap und Persistenz stabilisieren.
2. Theme-Switch visuell modernisieren.
3. Globale Light-Tokens schärfen.
4. Header/Menu im Light Theme prüfen und nachziehen.
5. Danach jede Section einzeln prüfen und verfeinern.
6. Projects-Route separat als eigene Light-Review behandeln.
7. Abschluss-Audit auf verbleibende Light-Lücken.

## Schritt 1: Theme-Bootstrap und Persistenz [Abgeschlossen]

### Ziel

Light Theme darf bei Reload oder Seitenwechsel nicht kurz als Dark erscheinen.

### Prüfen

- Hard-Reload auf `/de`
- Hard-Reload auf `/de/projects`
- Client-Navigation von `/de` nach `/de/projects`
- Client-Navigation zurück
- Verhalten mit gespeichertem `light`
- Verhalten ohne gespeichertes Theme bei heller Systempräferenz

### Umsetzen

- Theme serverseitig früh setzen
- gespeicherte User-Wahl priorisieren
- ohne gespeicherte Wahl Systempräferenz vor dem ersten sichtbaren Paint übernehmen
- Client-Provider nur noch zur Steuerung und Persistenz verwenden, nicht für den ersten sichtbaren Theme-Wechsel

### Abnahme

- kein sichtbarer Dark-Flash mehr
- `html[data-theme]` ist direkt korrekt
- Light bleibt beim Seitenwechsel stabil
- Dark-Verhalten bleibt unverändert

## Schritt 2: Theme-Switch modernisieren [Abgeschlossen]

### Ziel

Der vorhandene Switch bleibt funktional gleich, wirkt aber visuell aktueller und klarer.

### Prüfen

- Desktop Header
- Mobile Menu
- Fokuszustände
- Hover/Active-Zustände
- DE/EN-Labels
- Light/Dark-Umschaltung

### Umsetzen

- Textbutton durch klaren, modernen Pill-Switch ersetzen
- kompakte Sun/Moon-Ikonografie oder gleichwertige Zustandsmarkierung
- sichtbarer aktiver Zustand
- Light- und Dark-Darstellung sauber trennen
- keine strukturelle Änderung im Header-Layout

### Abnahme

- Switch ist sofort verständlich
- Light-Optik wirkt nicht wie ein utilitärer Fallback
- Fokus und Tastaturbedienung bleiben sauber
- Mobile und Desktop verhalten sich konsistent

## Schritt 3: Globale Light-Tokens schärfen [Abgeschlossen]

### Ziel

Light Theme soll klarer, kontrastreicher und präziser wirken, ohne das Dark Theme anzufassen.

### Prüfen

- `globals.css` Light-Tokens
- Background
- Surface-Stufen
- Border
- Text
- Muted Text
- CTA-Farben
- Fokusfarbe
- globale Schatten und Overlays

### Umsetzen

- nur `[data-theme="light"]` neu kalibrieren
- zusätzliche semantische Light-Tokens ergänzen, falls Komponenten bisher auf harte Einzelwerte ausweichen
- Light-Hintergrund weniger verwaschen, Flächen besser getrennt
- Textkontraste sichtbarer und ruhiger machen
- CTA-Farben im Light Theme klarer vom Hintergrund absetzen

### Abnahme

- Light Theme wirkt schärfer und lesbarer
- Komponenten brauchen weniger Light-Sonderfälle
- Dark-Tokens bleiben unverändert

## Schritt 4: Header / Menu [Abgeschlossen]

### Ziel

Header und Navigation im Light Theme müssen präzise, kontrastklar und nicht ausgewaschen wirken.

### Prüfen

- Brand-Bereich
- Desktop Navigation
- Header im ungescrollten Zustand
- Header im gescrollten Zustand
- Locale Switch
- Theme Switch
- Mobile Menu Panel
- Mobile Menu Links
- CTA im Header

### Typische Schwachstellen

- zu schwache Borders
- zu milchige Hintergründe
- unklare Trennung zwischen Header und Seitenhintergrund
- Controls wirken im Light Theme zu grau oder zu flach

### Abnahme

- Header bleibt strukturell gleich
- Controls sind klar lesbar
- Scroll-Zustand ist im Light Theme präzise und hochwertig
- Mobile Menu wirkt nicht wie Dark-UI mit hellem Overlay

## Schritt 5: Hero [Abgeschlossen]

### Ziel

Hero bleibt strukturell gleich, die Überschriftenanimation bleibt erhalten, aber Light wirkt schärfer und weniger weichgezeichnet.

### Prüfen

- H1
- animierter Gradient der H1
- Description
- Tag/Kicker
- CTA-Row
- Hero-Visual
- Aurora/Glow-Layer
- Noise/Grid/Vignette
- gesamte Lesbarkeit im Light Theme

### Konkret anpassen

- Blur/Glow im Light Theme reduzieren
- weichzeichnende Schatten an der Headline entfernen oder stark senken
- Farben der animierten Headline im Light Theme schärfen
- Hero-Visual im Light Theme klarer vom Background trennen
- dekorative Layer nur behalten, wenn sie nicht weich oder milchig wirken

### Abnahme

- Animation der Überschrift bleibt erhalten
- keine unscharfe oder verwaschene H1 mehr
- Hero wirkt im Light Theme klar und hochwertig
- Dark Hero bleibt exakt wie bisher

## Schritt 6: Included Section [Abgeschlossen]

### Ziel

Cards und Content im Light Theme müssen klar getrennt und scharf lesbar sein.

### Prüfen

- Kartenflächen
- Border-Stärke
- Hint-Text
- Card Description
- dekorative Blur-Filter
- Kontrast von Labels und Text

### Konkret anpassen

- Light-Karten kontrastreicher staffeln
- Blur-Filter im Light Theme entfernen oder minimieren
- zu warme oder beige Light-Flächen neutralisieren, falls sie die Lesbarkeit schwächen

### Abnahme

- Karten sind klar voneinander getrennt
- Text ist sofort lesbar
- keine unnötige Unschärfe mehr

## Schritt 7: Proof Section [Abgeschlossen]

### Ziel

Proof-Elemente im Light Theme sollen hochwertig und ruhig wirken, nicht milchig oder zu kontrastarm.

### Prüfen

- Section Surface
- Featured Project Block
- Review Cards
- Ratings und Highlights
- Light-Hintergründe
- Text- und Border-Kontrast

### Konkret anpassen

- Glass- und Panel-Looks im Light Theme schärfen
- Review-Flächen klarer absetzen
- Akzentfarben dosieren, damit Light nicht cremig verschwimmt

### Abnahme

- Proof wirkt im Light Theme solide und glaubwürdig
- Karten lesen sich ohne Anstrengung
- keine verwaschenen Flächen

## Schritt 8: Services Section [Abgeschlossen]

### Ziel

Service Cards und deren Hierarchie müssen im Light Theme sauber und kontrolliert bleiben.

### Prüfen

- Goal Chips
- Service Cards
- Recommended State
- Delivery Badges
- Toggles
- Mehr-Elemente-Hinweise
- Secondary Service Cards

### Konkret anpassen

- aktive und empfohlene Zustände im Light Theme präziser definieren
- Border, Shadows und Highlight-Flächen klarer staffeln
- CTA-Elemente in Cards deutlicher vom Untergrund trennen

### Abnahme

- Kartenhierarchie ist im Light Theme klar
- Recommended- und Active-States sind auf einen Blick verständlich
- keine Stellen mehr, die wie unfertige Dark-zu-Light-Portierungen aussehen

## Schritt 9: Process Section [Abgeschlossen]

### Ziel

Die Prozessdarstellung soll im Light Theme dieselbe Klarheit haben wie im Dark Theme, ohne weich oder blass zu wirken.

### Prüfen

- Layout-Container
- Steps
- Step Header
- Step Number und Phase
- Description
- CTA-Endzustand
- Linien, Verbindungen und visuelle Führung

### Konkret anpassen

- Light-Step-Surfaces klarer definieren
- Outline- und Fokusfarben sauber abstimmen
- animierte Elemente nur behalten, wenn sie die Lesbarkeit nicht schwächen

### Abnahme

- Prozess bleibt gut scanbar
- Light Theme wirkt strukturiert, nicht blass
- CTA-Endpunkt ist klar erkennbar

## Schritt 10: FAQ / Q&A [Abgeschlossen]

### Ziel

FAQ im Light Theme soll ruhig und präzise sein.

### Prüfen

- Accordion oder Frageblöcke
- Antworttext
- Hint-Texte
- Hover- und Expanded-State
- Border und Hintergrundwechsel

### Konkret anpassen

- geöffnete Zustände klarer markieren
- Antwortflächen besser vom Rest trennen
- Light-Kontraste für längere Texte verbessern

### Abnahme

- Fragen und Antworten sind sauber voneinander getrennt
- Expanded State ist klar
- keine blassen Textflächen

## Schritt 11: Contact Section [Abgeschlossen]

### Ziel

Contact muss im Light Theme besonders vertrauenswürdig und klar wirken.

### Prüfen

- Intro
- Decision Intro
- Entry Panels
- Trigger Kicker
- Copy Buttons
- Email- und Call-Actions
- Formular
- Fehlermeldungen
- Fokuszustände
- Privacy-Link

### Konkret anpassen

- Light-Flächen für Form und Contact-Panels sauber staffeln
- Buttons und Kontakt-Actions klarer kontrastieren
- Error- und Helper-States im Light Theme präziser definieren

### Abnahme

- Formular und Kontaktwege wirken im Light Theme produktionsreif
- Eingabefelder haben klare Zustände
- keine Light-Stellen mehr mit zu schwacher Trennung

## Schritt 12: Footer [Abgeschlossen]

### Ziel

Footer soll im Light Theme bewusst gestaltet wirken und nicht wie ein invertierter Dark Footer.

### Prüfen

- Footer Background
- Columns
- Links
- Legal Links
- Placeholder- oder Disabled-States
- Bottom Note

### Konkret anpassen

- Footer-Fläche im Light Theme sauber vom Content trennen
- Link-Kontraste und Hover-Zustände nachschärfen
- Legal-Bereich klar lesbar halten

### Abnahme

- Footer fühlt sich als echter Teil des Light Themes an
- Links und rechtliche Navigation sind klar lesbar

## Schritt 13: Projects Route [Abgeschlossen]

### Ziel

`/projects` bekommt eine eigene Light-Review, weil dort viele hart kodierte dunkle Werte verwendet werden.

### Prüfen

- Page Hero
- Hero Aside
- Project Cards
- Browser- und Phone-Frames
- Chrome- und Statusleisten
- Detail Lists
- Closing CTA
- Page Background und Accents

### Konkret anpassen

- harte dunkle Farben auf Light-Tokens umstellen
- Browser- und Device-Frames im Light Theme eigenständig definieren
- Card-Surfaces und Metallic- oder Glass-Anmutung im Light Theme schärfen
- Links, CTA und Meta-Bereiche kontraststabil machen

### Abnahme

- `/de/projects` wirkt im Light Theme vollständig durchgestaltet
- keine dunklen Restwerte dominieren versehentlich die Light-Darstellung
- Reload und Navigation bleiben ohne Dark-Flash

## Schritt 14: Rest-Audit

### Ziel

Am Ende müssen verbliebene Light-Lücken systematisch gefunden und bereinigt werden.

### Prüfen

- alle Marketing-Komponenten auf harte `#...`, `rgba(...)` und schwache `[data-theme="light"]`-Overrides
- dekorative Blur- und Glow-Effekte
- unklare Border- und Shadow-Kombinationen
- Buttons, Links, Inputs, Badges und Chips
- Mobile-Ansicht separat

### Abnahme

- Light Theme ist konsistent
- Dark Theme ist unverändert
- keine auffälligen halb-fertigen Light-Sonderfälle mehr

## Testvorgehen pro Schritt

Für jeden Schritt dokumentieren:

- betroffene Datei(en)
- konkret geänderte Light-Tokens oder Light-Styles
- sichtbare Auswirkung im UI
- wie geprüft wurde
- ob Dark auf Regression geprüft wurde

## Mindest-Checks nach jedem Schritt

- Light auf `/de`
- Light auf `/de/projects`, falls betroffen
- Dark-Schnellcheck auf denselben Screens
- Tastatur-Fokus für neu angefasste Controls
- `npm run lint` vor Abschluss eines größeren Blocks
- relevante Tests, wenn Theme-Logik oder interaktive UI geändert wurde

## Definition of Done für diese Initiative

- Dark Theme unverändert
- Light Theme sichtbar geschärft
- kein Dark-Flash mehr bei Light
- Theme-Switch modernisiert
- jede Marketing-Section geprüft und dokumentiert
- Projects-Route im Light Theme vollständig nachgezogen

## Schritt 15: Legal-Check f�r Theme-Cookie

### Ziel

Pr�fen, ob das Lesen/Setzen des Theme-Cookies in der Datenschutzerkl�rung erg�nzt werden muss und ob dadurch ein Cookie-Banner erforderlich ist.

### Pr�fen

- Datenschutzerkl�rung bez�glich Theme-Switch und Theme-Cookie
- Rechtsgrundlage f�r das Speichern der Theme-Pr�ferenz
- Abgrenzung zwischen technisch erforderlich und einwilligungspflichtig
- Bedarf f�r Cookie-Banner oder Preference-Hinweis

### Abnahme

- Entscheidung dokumentiert
- Datenschutzerkl�rung bei Bedarf erweitert
- klar, ob f�r das Theme-Cookie ein Cookie-Banner n�tig ist oder nicht

### Aktuelle Einsch�tzung

- Theme-Cookie aktuell als Pr�ferenz-Cookie einordnen
- Datenschutzerkl�rung sehr wahrscheinlich kurz um Theme-Switch bzw. Theme-Cookie erg�nzen
- Cookie-Banner nur wegen dieses Cookies eher wahrscheinlich nicht
- rechtlich sensibler Punkt: das Cookie wird nicht nur nach aktivem Switch-Klick, sondern bereits im laufenden Seitengebrauch gesetzt bzw. fortgeschrieben
- finalen Legal-Check und konkrete Datenschutz-Anpassung bewusst als letzten Schritt vor Go-Live durchf�hren
