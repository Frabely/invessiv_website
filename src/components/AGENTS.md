# Components

Dieser Ordner ist für wiederverwendbare UI-Komponenten gedacht.

## Was hier hingehört

- Gemeinsame React-Komponenten
- Client- und Server-Komponenten, die über mehrere Routen wiederverwendet werden
- Präsentationsbausteine für Seiten und Layouts

## Was hier nicht hingehört

- Orchestrierung auf Routenebene
- Datenbankzugriff
- Übersetzungsquellen

## Benennung

- Aussagekräftige, domänenbezogene Komponentennamen bevorzugen.
- Datei- und Ordnernamen sollen zum Zweck der Komponente passen.

## Error-Darstellung (Client)

Wenn eine Komponente Fehlerzustände anzeigt (Form-Validation, Toast, Inline-Error), gilt dieselbe Konvention wie
server-seitig:

- **Error-Codes** kommen aus dem zugehörigen `*ErrorCode`-Const-Objekt in `src/common/constants/<domain>/` — kein
  String-Literal direkt in der Komponente.
- **Message-Texte** werden in einer einzigen co-located `*-error.ts`- oder `*-messages.ts`-Datei auf die Codes gemappt (
  z. B. `src/lib/<domain>/<domain>-error-messages.ts`).
- Komponenten rufen den Message-Lookup auf (`getLeadErrorMessage(code)`) — keine Inline-Strings.
- Wenn Messages i18n-pflichtig sind, kommt der Text aus Dictionaries; der Code bleibt trotzdem der typisierte
  Lookup-Key.
- Das Pattern sichert, dass jeder Fehlertext genau einmal steht und Refactoring (z. B. neue Codes, Übersetzungen) keine
  Streuung über Komponenten-Dateien erzeugt.

## Standardschnitt

- View-Logik nach `src/components`
- Routen-Zusammensetzung nach `src/app`
- Sprachdaten nach `src/i18n`
