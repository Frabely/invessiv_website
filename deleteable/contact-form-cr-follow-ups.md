# Kontaktformular – CR-Nacharbeiten

- Projektrahmen wird für Discovery Calls validiert und als Pflichtwert in der DB gespeichert.
- Migration setzt vorhandene Call-Datensätze einmalig auf `unsure`; neue Einträge haben keinen Default und sind
  `NOT NULL`.
- Calendly erhält Nachricht über `a1` und Projektrahmen über `a2`.
- Discovery-Call-Persistenz ist zusätzlich per E2E-Test abgedeckt.
- Scope-Icons: keine Inline-Styles mehr, Asset-Pfade funktionieren aus dem CSS-Modul.
- Gemeinsame Kontaktidentität (Moritz / Invessiv / Kanäle) wird in Kontaktbereich und Footer wiederverwendet.
- Asset-Imports der Web-App einheitlich über `@/assets/...`.
- Formular-Analytics trennt Termin- und E-Mail-Ausgang korrekt; ungültige Calendly-URLs hinterlassen kein leeres Popup.
