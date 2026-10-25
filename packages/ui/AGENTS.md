# AGENTS.md — packages/ui

Gilt für `packages/ui/**` und für jeden Code, der Komponenten aus `@invessiv/ui` nutzt. Ergänzt die Root-`AGENTS.md`
und `packages/AGENTS.md` (Abschnitt `packages/ui`).

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Änderungen am Standardverhalten vorher abstimmen (verbindlich)

- Wird eine bestehende Komponente direkt geändert und verändert das ihr bisheriges Standardverhalten oder
  Standardaussehen, **vor der Umsetzung ausdrücklich fragen**, ob diese Änderung für alle betroffenen Verwendungen
  gelten soll. Das umfasst auch CSS, Hover-, Fokus- und Auswahlzustände, Maße, Prop-Defaults sowie Änderungen an
  geteilten Hooks, Stilen oder Tokens, die sich auf bestehende Komponenten auswirken.
- Vor der Rückfrage die Verwendungen in allen Apps und im UI-Paket ermitteln. Konkret erklären, was sich gegenüber
  bisher ändert, welche Stellen betroffen sind und wo das bisherige Verhalten weiter sinnvoll sein könnte.
  Ungeprüfte oder dynamische Verwendungen als Unsicherheit benennen.
- Die Entscheidung ausdrücklich anbieten: **bestehenden Standard überall ändern** oder **bisherigen Standard
  erhalten und die neue Darstellung bzw. das neue Verhalten über eine app-neutrale Prop/Variante gezielt aktivieren**.
  Ein Auftrag für eine einzelne Stelle oder einen Bereich ist keine Zustimmung zur Änderung aller Verwendungen.
- Bis zur ausdrücklichen Entscheidung keine Änderung am bestehenden Standard umsetzen. Wurde die konkrete Änderung
  samt ihrer Reichweite im laufenden Gespräch bereits ausdrücklich bestätigt, ist keine erneute Rückfrage nötig.
- Soll der bisherige Standard an einzelnen Stellen erhalten bleiben, eine passende gemeinsame Variante bzw. Prop
  verwenden und die betroffenen Aufrufer bewusst zuordnen; keine lokalen CSS-Overrides oder Komponenten-Kopien.

## Gemeinsamer Design-Kern (verbindlich)

- **Tokens:** `src/styles/tokens.css` hält Palette (Marken-, Highlight-, Aktions- und Neutralrollen), Schriftfamilien,
  Schriftgrößen, Layoutschiene und deren Breakpoints für **alle** Apps. Die Werte gehören dem Website-Design
  (`apps/web/DESIGN.md`); bei Abweichungen gewinnt die Website. `src/styles/base.css` hält Reset und
  Dokument-Defaults. Jede App importiert beide direkt nach Tailwind in ihrer `globals.css` und ergänzt dort nur eigene
  Tokens (Web: FAQ-/Hero-/Marketing-Tokens; Workspace: Control-, Status- und Widget-Tokens). Gemeinsame Tokens nicht
  in einer App-`globals.css` neu definieren.
- **Schriften:** Jede App lädt die Fonts selbst per `next/font` (Paket bleibt frei von `next/*`), mit denselben
  Variablennamen (`--font-figtree`, `--font-metrophobic`), die `tokens.css` erwartet.
- **Aktionsfarbe:** Der Orange-Blau-CTA-Verlauf liegt einmalig in `components/action-color/action-color.module.css`.
  Paket-Komponenten komponieren ihn relativ, App-CSS-Module über
  `composes: … from "@invessiv/ui/components/action-color/action-color.module.css"`. `ActionIcon` zeigt
  Font-Awesome-Icons im selben Verlauf.
- **Header-Controls:** `ThemeSwitch` und `LocaleSwitch` (inkl. `useDismissibleDetails`) sind die einzigen
  Theme-/Sprachumschalter aller Apps.

## Wer eine UI-Komponente nutzt, stylt sie nicht um (verbindlich)

- **Im Regelfall kein eigenes CSS für eine Komponente aus `@invessiv/ui`.** Höhe, Innenabstand, Rahmen, Farben,
  Schrift und Zustände (Hover, Fokus, Disabled, Checked) gehören der Komponente. Der Aufrufer überschreibt sie nicht
  über `className`, `:global(button)`-Selektoren oder verdoppelte Klassen.
- **Braucht eine Stelle eine Abweichung, wird die Komponente erweitert**, nicht überschrieben: eine Prop oder Variante
  mit app-neutralem Namen (z. B. `size`, `variant`, `autoGrow`), die dann überall dasselbe bedeutet.
- **Eine Ausnahme braucht einen wirklich sinnvollen Grund** und einen Kommentar an der Regel, der ihn nennt. „Sieht
  hier besser aus“ ist kein Grund, sondern ein Hinweis, dass die Komponente die Variante braucht.
  - **Begrenzte Ausnahme: Portal-Zugangsdaten** (Nutzerentscheidung 18.10.2026). Ausschließlich
    `apps/workspace/src/components/portal/credentials/portal-credential-table-row/portal-credential-table-row.module.css`
    darf Innenabstände und untere Trennlinien der direkten Tabellenzellen dieser Credentials-Zeile anpassen.
    Die dichte Übersicht kombiniert Metadaten mit mehrzeiligen Geheimnissen, Countdown und eigenen Feldaktionen;
    die Trennlinien halten diese variabel hohen Einträge auseinander. Dafür wird keine bislang nur hier benötigte
    Variante im gemeinsamen UI-Paket eingeführt. Die Ausnahme gilt nur unter der lokalen `.row`-Klasse, nicht für
    andere Tabellen oder für Buttons, Fokus-, Hover- und Disabled-Zustände. Bei Wiederverwendung in einem weiteren
    Bereich erneut prüfen, ob eine app-neutrale Tabellenoption sinnvoll ist.
- **Layout bleibt beim Aufrufer und ist kein Override:** Raster, Abstände zwischen Komponenten, Breite, Ausrichtung,
  Ein- und Ausblenden je Breakpoint. Der Aufrufer bestimmt, wo eine Komponente steht, nicht wie sie aussieht.
- Bestehende Overrides werden beim Anfassen benannt und abgebaut, statt neue danebenzulegen.

## Formular-Bausteine sehen gleich aus (verbindlich)

- **Eine Höhe und ein Eckenradius für alle Controls:** `--control-height`, `--control-radius` und
  `--control-border-color` (zentral in `src/styles/tokens.css`, gleich für alle Apps). Texteingaben
  (`FormField`), Options-Kacheln (`OptionTile`) und Buttons in Formularen (`ButtonControl` mit `size="control"`)
  richten sich danach. Kein Control setzt eine eigene feste Höhe.
- **Gleiches Gerüst:** Label, Abstand Label → Control, Hinweis (`FormHint`) und Fehler sehen in `FormField` und
  `FormFieldset` gleich aus. Ein neuer Formular-Baustein übernimmt diese Werte, statt eigene zu wählen.
- **Label-Größe über Token:** `FormField` und `FormFieldset` lesen die Schriftgröße ihres Labels aus
  `--form-label-size`. Ohne Token gelten die bisherigen Werte. Ein Formular, dessen Fragen größer stehen sollen, setzt
  das Token in seinem Scope (z. B. der Portal-Bogen ab 1024 px), statt Label-Klassen zu überschreiben.
- **Radio und Checkbox** kommen aus `RadioControl` bzw. `CheckboxControl`; als Option einer Frage über `OptionTile`.
  Kein natives `<input type="radio|checkbox">` mit eigenem Stil in den Apps.
- **Farbe** kommt aus `ColorField`: Hex-Text mit Farb-Chip am Anfang (der native Farbwähler selbst, daher kein
  Inline-Style) und „Farbe wählen“ daneben. Ohne gültigen Wert ist der Chip schraffiert. `FormField` nimmt
  `type="color"` von seinen Texteingabe-Stilen aus; Start-Slot (`inputPrefix`) und Aktion neben dem Feld
  (`inputAction`) sind allgemeine `FormField`-Props.
- **Icon und Text im Button:** `.button` setzt selbst `gap: 0.5rem`. Aufrufer geben Icons keinen eigenen Abstand
  (`margin-right` o. Ä.).
- **Buttons:** `variant` wählt das Aussehen (`primary`, `ghost`, `quiet`), `size` die Größe (`default`, `control` in
  Formularen, `icon` für reine Icon-Buttons). Hover-Effekte gelten nur auf Geräten, die hovern können.
  `PrimaryCtaButton` ist die Hauptaktion, `SecondaryCtaButton` die zweite Aktion daneben oder eine einzelne Aktion,
  die nicht mit ihr konkurrieren soll. `primary` trägt den CTA-Verlauf der Website, `ghost` erhält beim Hover einen
  Verlaufsrahmen und Verlaufstext (Label-Span mit `gap: inherit`, damit Icon-Abstände bleiben).
- **Das Token muss ankommen:** Fehlt `--control-height` zur Laufzeit, fallen alle Controls still auf ihre Inhaltshöhe
  zurück und sind dann unterschiedlich hoch. Sieht ein Formular so aus, zuerst prüfen, ob das ausgelieferte globale
  Stylesheet das Token enthält (Dev-Server neu starten), bevor an den Komponenten gedreht wird.
- **Fokus im Aktionsverlauf:** Form-Controls (`FormField`, `CheckboxControl`, `RadioControl`, `OptionTile`,
  `CustomSelect`) zeigen den Fokus als Orange→Blau-Verlaufsring über `focusRing` aus
  `components/action-color/action-color.module.css`. Inputs und Textareas tragen keine Pseudo-Elemente, daher sitzt
  der Ring auf ihrer Hülle. Einfarbige Fokus-Outlines nutzen immer `--color-focus` (Verlaufsstart), nie `--color-cta`.
- **Pflicht-Kennzeichnung und Checked im Aktionsverlauf:** `FormRequiredMarker`, der Pflicht-Hinweis in `FormActions`
  und der Checked-Zustand von `CheckboxControl` nutzen den Aktionsverlauf statt Blau.
- **Web nutzt dieselben Bausteine:** Die Web-App hat keine eigenen Kopien von `FormField`, `FormActions`,
  `FormStatus`, `FormRequiredMarker` oder Buttons mehr. Next-Links laufen über `linkComponent={Link}`.

## Widgets (verbindlich)

- **Reiter statt Kopf-Icon:** Das Icon eines `Widget` sitzt auf einem farbigen Reiter, der über die obere Kartenkante
  ragt. Die Karte ist flach (kein Verlauf); Farbe tragen nur Reiter, Zähler und Rahmen. Die Farbe kommt über
  `accent` (`WidgetAccent`); die App definiert je Wert ein Token `--widget-accent-<wert>` pro Theme sowie
  `--widget-on-accent`.
- **Eine Aktionsleiste:** Jede Karte endet in derselben Zeile. Weitere Aktionen (`footer`) stehen vorn als
  `ButtonControl` mit `variant="quiet"`, `size="control"` und Icon **vor** dem Text. Die Öffnen-Aktion steht immer
  zuletzt, rechts, und ihr Icon **hinter** dem Text sagt, was passiert: `→` Seite (`openMode="page"`), `⤢` Dialog,
  Spalten für ein Seitenpanel, `⌄` aufklappen; externe Links tragen `↗`.
- **Buttons stehen beieinander:** Die Aktionsleiste richtet alle Buttons rechts als Gruppe aus. Reicht der Platz
  einer schmalen Karte nicht für zwei beschriftete Buttons, wird die Nebenaktion ein Icon-Button
  (`size="icon"`, `aria-label` und `title`) mit sprechendem Icon. Bricht die Zeile doch um (Aktionsleiste unter
  28 rem), füllt jeder beschriftete Button seine Zeile; Icon-Buttons bleiben quadratisch.
- **Viertel-Karten** (`desktop: 3`) laufen zwischen 1100 und 1439 px als Drittel, darunter ist ihre Aktionsleiste
  zu schmal.
- `openProminent` macht die Öffnen-Aktion zum Primary-Button, wenn der Leser dran ist; die Karte trägt dann
  `data-open-prominent`. Keine eigenen Link- oder Pill-Buttons in Widgets, immer `ButtonControl`/`ButtonLink`.

## Datei-Vorschau (verbindlich)

- Wie eine Datei gezeigt wird (Bild, PDF, Video, Text, Laden, Fehler), steht nur in `files/file-preview-stage`; das
  Laden und rechtzeitige Erneuern der signierten URL nur in `hooks/use-file-preview-source`. `FileLightbox`
  (Vollbild, Variante `dialog`) und `FilePreviewPanel` (neben einer Liste, Variante `panel`) bauen darauf auf und
  rendern keine eigene Vorschau. Steht das Panel `sticky` in einem Scrollbereich, begrenzt die Seite es auf dessen
  Höhe und setzt `--file-preview-panel-media-height` (Layout-Hook, Standard 65dvh), damit das Bild zuerst schrumpft.
- Die Metazeile unter einem Dateinamen (Typ oder Link-Host, eigene Angaben, Größe, Datum) kommt nur aus
  `files/file-entry-meta`; Zeile und Panel nutzen sie gemeinsam. Das Typwort selbst (Link-Host, Endung, sonst
  Typname) liefert `filePresentation.typeLabel` aus `@invessiv/common`, auch für Tabellen mit eigener Typ-Spalte.
  Der gemeinsame Eintragstyp ist `FileEntryItem` (`@invessiv/common/contracts/files/file-entry-item`).
- **Vorschaubild statt Typ-Symbol** nur über `files/file-thumbnail`: gleiche Fläche wie `FileKindIcon` (2.25rem),
  `loading="lazy"`, feste Maße, `alt=""`; ohne URL oder nach `onError` steht das Symbol da. Eine neue URL wird erneut
  versucht. Listen laden nie das Original. `FilePreviewStage` nimmt `placeholderSrc` (nur Bilder): Die Kleinversion
  steht sofort da, das Original blendet über, sobald es geladen ist; ein kaputtes Original zeigt den Fehlertext.
  `FilePreviewPanel` reicht `file.thumbnailUrl` selbst durch.

## Tabellen und Mehrfachauswahl (verbindlich)

- `DataTableLayout` trägt Seitenwechsel über `pagination` (Links) oder eigenes Nachladen über `footer` (z. B.
  „Weitere laden“); beides steht unter dem Scrollbereich im Rahmen. Die Tabelle scrollt in ihrem Rahmen; Kopf (sticky)
  und `pagination`/`footer` bleiben dabei stehen. Mobile-Cards über `mobileCard`/`mobileCardSlot`.
- Eine Aktionsleiste für gewählte Einträge ist immer `SelectionActionBar`: Pille unten mittig mit Anzahl (fertiger
  Text), optionalem Hinweis und den Aktionen des Aufrufers. Seiten mit eigener Leiste am unteren Rand heben sie über
  `--selection-action-bar-offset` an (Layout, kein Override). Keine zweite Bulk-Leiste in einer App.

## Bekannte Altlasten

- `ProcessTrack` setzt die Stile seiner Schritt-Buttons zurück, statt eine eigene Schaltfläche zu nutzen.
- Im Portal-Bogen macht der Prüfschritt aus `ButtonControl` optisch einen Textlink (`onboarding-submit-step`); dafür
  fehlt ein Text-Button-Baustein.
