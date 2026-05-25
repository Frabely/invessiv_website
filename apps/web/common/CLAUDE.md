# CLAUDE.md - apps/web/common

## Zweck

`apps/web/common` ist die app-lokale Shared-Schicht für die Web-App. Hier liegen Kontrakte und Konstanten, die sowohl
aus UI-Komponenten als auch aus Dictionary- oder Renderer-Schichten verwendet werden.

## Strukturprinzip

- `constants/<domain>/...` für Laufzeit-Konstanten
- `contracts/<domain>/...` für geteilte Typen
- Keine Sammeldatei, wenn die fachlichen Einheiten getrennt gelesen werden können
- Reine Reexports nur in `index.ts`

## Arbeitsregeln

- Neue Shared-Typen werden nach fachlicher Verantwortung geschnitten, nicht nach Import-Bequemlichkeit
- `apps/web/common` soll die gleiche Klarheit wie `packages/common/src` haben, aber ohne monorepo-weite Übertragung
- Keine UI-Strings oder Komponentenlogik hier ablegen
- Wenn ein Typ nur in einem Teilbereich gebraucht wird, gehört er in genau diesen Bereich unter `contracts/` oder
  `constants/`

## Service-Section-Spezifikum

- `PROJECT_OFFER_CHANGE_EVENT` ist der kanonische Event-Name für den Austausch zwischen Services-Section und
  Kontaktformular
- Service-bezogene Offer-Keys werden direkt aus `@invessiv/common/constants/contact/contact-offer-keys` bezogen
- Typen für die Services-Section liegen getrennt pro Datei unter `contracts/marketing/`
