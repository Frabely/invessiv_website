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

## API-Fehlerformat (verbindlich für alle Route-Handler)

Error-Codes und Message-Texte dürfen nie als String-Literale in Route-Dateien stehen. Die projektweite Konvention (Root
`CLAUDE.md` → „Error Codes & Messages") gilt für alle API-Routen unter `src/app/api/`:

- Error-Codes kommen aus einem `*ErrorCode`-Const-Objekt in `packages/common/src/constants/<domain>/`.
- Message-Texte stehen in einer einzigen `*-error.ts`-Datei neben den Route-Dateien der jeweiligen Domain.
- Route-Handler rufen ausschließlich den Helper auf — kein `Response.json({ error: "...", message: "..." })` direkt.

## Standardschnitt

- Wiederverwendbare UI nach `src/components`
- Server-Logik nach `src/server`
- Sprachdaten und Übersetzungshilfen nach `src/i18n`
