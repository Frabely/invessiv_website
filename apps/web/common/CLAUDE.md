# CLAUDE.md - apps/web/common

Siehe auch [AGENTS.md](./AGENTS.md). Diese Datei ergänzt die dortigen Regeln um kurze Architekturhinweise für den
konkreten Common-Scope.

## Zweck

`apps/web/common` ist die app-lokale Shared-Schicht für die Web-App. Hier liegen Kontrakte und Konstanten, die sowohl
aus UI-Komponenten als auch aus Dictionary- oder Renderer-Schichten verwendet werden.

## Strukturprinzip

- `constants/<domain>/...` für Laufzeit-Konstanten
- `contracts/<domain>/...` für geteilte Typen
- Keine Sammeldatei, wenn die fachlichen Einheiten getrennt gelesen werden können
- Reine Reexports nur in `index.ts`

## Service-Section-Spezifikum

- `PROJECT_OFFER_CHANGE_EVENT` ist der kanonische Event-Name für den Austausch zwischen Services-Section und
  Kontaktformular
- Service-bezogene Offer-Keys werden direkt aus `@invessiv/common/constants/contact/contact-offer-keys` bezogen
- Typen für die Services-Section liegen getrennt pro Datei unter `contracts/marketing/`
