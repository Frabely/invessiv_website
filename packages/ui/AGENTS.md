# AGENTS.md — packages/ui

Gilt für `packages/ui/**` und für jeden Code, der Komponenten aus `@invessiv/ui` nutzt. Ergänzt die Root-`AGENTS.md`
und `packages/AGENTS.md` (Abschnitt `packages/ui`).

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Wer eine UI-Komponente nutzt, stylt sie nicht um (verbindlich)

- **Im Regelfall kein eigenes CSS für eine Komponente aus `@invessiv/ui`.** Höhe, Innenabstand, Rahmen, Farben,
  Schrift und Zustände (Hover, Fokus, Disabled, Checked) gehören der Komponente. Der Aufrufer überschreibt sie nicht
  über `className`, `:global(button)`-Selektoren oder verdoppelte Klassen.
- **Braucht eine Stelle eine Abweichung, wird die Komponente erweitert**, nicht überschrieben: eine Prop oder Variante
  mit app-neutralem Namen (z. B. `size`, `variant`, `autoGrow`), die dann überall dasselbe bedeutet.
- **Eine Ausnahme braucht einen wirklich sinnvollen Grund** und einen Kommentar an der Regel, der ihn nennt. „Sieht
  hier besser aus“ ist kein Grund, sondern ein Hinweis, dass die Komponente die Variante braucht.
- **Layout bleibt beim Aufrufer und ist kein Override:** Raster, Abstände zwischen Komponenten, Breite, Ausrichtung,
  Ein- und Ausblenden je Breakpoint. Der Aufrufer bestimmt, wo eine Komponente steht, nicht wie sie aussieht.
- Bestehende Overrides werden beim Anfassen benannt und abgebaut, statt neue danebenzulegen.

## Formular-Bausteine sehen gleich aus (verbindlich)

- **Eine Höhe und ein Eckenradius für alle Controls:** `--control-height`, `--control-radius` und
  `--control-border-color` (in der
  `globals.css` der App definiert). Texteingaben
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
  die nicht mit ihr konkurrieren soll.
- **Das Token muss ankommen:** Fehlt `--control-height` zur Laufzeit, fallen alle Controls still auf ihre Inhaltshöhe
  zurück und sind dann unterschiedlich hoch. Sieht ein Formular so aus, zuerst prüfen, ob das ausgelieferte globale
  Stylesheet das Token enthält (Dev-Server neu starten), bevor an den Komponenten gedreht wird.
  **Kompatibilitätsausnahme:** `CustomSelect` bewahrt ohne diese Tokens seine bisherigen Werte (44 px Mindesthöhe,
  10 px Radius und bisherige Rahmenfarbe), damit die Web-App unverändert bleibt. Die vereinheitlichten Tokens
  werden aktuell nur im Workspace gesetzt; dafür keine Änderungen an `apps/web/src/app/globals.css` vornehmen.

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

- `FileEntryRow` mit `openOnRowClick`: Die ganze Zeile öffnet Vorschau oder Link (der Name streckt seine Klickfläche
  über die Zeile, Checkbox und Aktionen liegen darüber), der Name ist kein Textlink und es gibt keinen Auge-Button.
  Ohne die Prop bleibt das bisherige Verhalten (CRM).
- Wie eine Datei gezeigt wird (Bild, PDF, Video, Text, Laden, Fehler), steht nur in `files/file-preview-stage`; das
  Laden und rechtzeitige Erneuern der signierten URL nur in `hooks/use-file-preview-source`. `FileLightbox`
  (Vollbild, Variante `dialog`) und `FilePreviewPanel` (neben einer Liste, Variante `panel`) bauen darauf auf und
  rendern keine eigene Vorschau.
- Die Metazeile unter einem Dateinamen (Typ oder Link-Host, eigene Angaben, Größe, Datum) kommt nur aus
  `files/file-entry-meta`; Zeile und Panel nutzen sie gemeinsam. Der gemeinsame Eintragstyp ist `FileEntryItem`
  (`@invessiv/common/contracts/files/file-entry-item`).

## Bekannte Altlasten

- `ProcessTrack` setzt die Stile seiner Schritt-Buttons zurück, statt eine eigene Schaltfläche zu nutzen.
- Im Portal-Bogen macht der Prüfschritt aus `ButtonControl` optisch einen Textlink (`onboarding-submit-step`); dafür
  fehlt ein Text-Button-Baustein.
