# AGENTS.md - apps/web/common

Dieser Ordner enthält app-lokale, zwischen Client und UI-Dictionaries geteilte Konstanten und Contracts für die Web-App.
Er ist strukturell an `packages/common/src` angelehnt, bleibt aber auf `apps/web` begrenzt.

## Sprachregel

- Inhalte von `AGENTS.md`-Dateien in diesem Projekt immer auf Deutsch pflegen.

## Geltungsbereich

- Nur geteilte Typen, Schlüssel und Konstanten für `apps/web`
- Keine UI-Komponenten, Hooks oder Route-Logik
- Keine serverseitige Persistenz oder API-Handler

## Ordnerstruktur

- `constants/` für benannte Konstanten
- `contracts/` für gemeinsam genutzte TypeScript-Typen
- Pro fachlicher Gruppe eine Datei, keine Sammeldateien ohne klaren Nutzen

## Konstanten-Regel

String-Union-Typen werden ausschließlich über das Const-Objekt + abgeleiteter Type-Pattern definiert. TypeScript
`enum` wird nicht verwendet.

## Dateien und Exporte

- Dateinamen in `kebab-case`
- Pro Shared-Contract möglichst eine Datei pro Typ
- Reine Reexport-Dateien nur als `index.ts`-Barriere, nicht für fachliche Umformungen
- Kein Mischen von UI-Dictionary-Typen mit Laufzeitlogik

## Tests

- Neue Konstanten erhalten einen kleinen Test, wenn daraus ein stabiler öffentliche Schlüssel oder eine Werte-Liste
  entsteht
- Reine Types brauchen keine eigenen Runtime-Tests, sind aber durch Typecheck abzusichern
