@AGENTS.md

# CLAUDE.md - packages

Architekturhinweis: `packages/**` ist die geteilte Grundlage des Monorepos.

- `common` enthält allgemeine Contracts, Constants, Defaults und Patterns ohne UI-, Server- oder
  DB-Runtime-Abhängigkeit.
- `db` enthält allgemeine Datenbankinhalte: Schema/Record-Konfiguration, Migrationen, DB-Clients, SQL-Helfer und
  Persistenzfunktionen.
- `ui` enthält global verfügbare, app-neutrale UI-Komponenten wie `CustomSelect`.

Neue Paketinhalte müssen zuerst gegen diese Grenzen geprüft werden. Wenn ein Baustein App-spezifische Texte, Routes,
Analytics, i18n oder Feature-Wissen braucht, bleibt er in der App und konsumiert höchstens generische Package-Bausteine.
