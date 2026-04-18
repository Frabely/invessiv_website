# App Router

Dieser Ordner ist für Next.js-App-Router-Einstiegspunkte und die Routen-Orchestrierung gedacht.

## Was hier hingehört

- `page.tsx`, `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`
- Route-Handler und Metadaten-Generierung
- Seitenbezogene Zusammensetzung und serverseitige Routen-Orchestrierung

## Was hier nicht hingehört

- Wiederverwendbare Präsentationskomponenten
- Gemeinsame serverseitige Business-Logik
- Datenbank-Persistenz

## Benennung

- Routendateien sollen zum Pfadsegment passen, das sie bedienen.
- Route-lokale Helfer nur dann anlegen, wenn sie wirklich nur für genau diese Seite gelten.

## Standardschnitt

- Wiederverwendbare UI nach `src/components`
- Server-Logik nach `src/server`
- Sprachdaten und Übersetzungshilfen nach `src/i18n`
