# Services-Section Rework

## Scope

- Home-Services-Section von Ziel-Auswahl auf Service-Auswahl umbauen.
- Hauptleistungen in stabiler Reihenfolge rendern: `landing`, `process`, `upgrade`, `web`.
- Aktive Hauptleistung als große Detailfläche zeigen; die drei anderen Hauptleistungen darunter als kompakte Rows.
- `maintenance` separat als ergänzende Leistung nach dem Launch anzeigen.
- Bestehende Invessiv-Farb- und Theme-Tokens beibehalten; keine neue Palette einführen.
- Bestehenden `cursor_spotlight_cards`-Effekt adaptieren, keine neue Animation ergänzen.

## Testplan

- Component-Test für Reihenfolge, Default-Auswahl, `process`-Auswahl, Alternativliste, Maintenance-Trennung und
  CTA-Daten aktualisieren.
- Dictionary-/Content-Test für identische DE/EN UI-Keys und Hauptservice-Reihenfolge ergänzen.
- Ausführen:
  - `npm run test -- services-section`
  - `npm run lint`
  - `npm run build`
