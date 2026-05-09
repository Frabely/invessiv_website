# I18n

Dieser Ordner ist für Sprachdaten, Wörterbücher und Übersetzungshilfen gedacht.

## Was hier hingehört

- Wörterbücher und sprachspezifische Inhalte
- Übersetzungshilfen
- Metadateninhalte, die nach Sprache geschlüsselt sind

## Was hier nicht hingehört

- UI-Komponenten
- Routen-Orchestrierung
- Datenbank-Persistenz

## Benennung

- Sprachdateien und Sprachschlüssel klar und explizit halten.
- Stabile Sprachtypen statt stringlastigem Zugriff bevorzugen.

## Standardschnitt

- UI-Zusammensetzung nach `src/app` und `src/components`
- Server-Logik nach `src/server`
