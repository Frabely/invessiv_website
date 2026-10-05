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

## Bekannte Altlasten

- `ProcessTrack` setzt die Stile seiner Schritt-Buttons zurück, statt eine eigene Schaltfläche zu nutzen.
- Im Portal-Bogen macht der Prüfschritt aus `ButtonControl` optisch einen Textlink (`onboarding-submit-step`); dafür
  fehlt ein Text-Button-Baustein.
