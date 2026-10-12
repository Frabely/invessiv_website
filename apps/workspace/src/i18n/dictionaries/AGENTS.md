# AGENTS.md — Workspace-Dictionaries

Gilt für `apps/workspace/src/i18n/dictionaries/**`. Ergänzt die Regeln der
Repo-Root-`AGENTS.md` und `apps/workspace/AGENTS.md`.

## Benannte Dictionary-Typen (verbindlich)

- Jedes fachliche Dictionary erhält einen festen, benannten TypeScript-Typ in einer eigenen Datei
  unter `apps/workspace/src/common/contracts/<domain>/`, z. B. `PortalServiceRequestsDictionary`.
- Der Typ wird mit `typeof` aus der kanonischen DE-JSON-Datei abgeleitet. Diese wird ausschließlich
  per `import type` importiert. Die Dictionary-Felder werden nicht als separates Interface oder
  Objekt-Shape abgeschrieben.

```ts
import type dictionary from "@/i18n/dictionaries/portal/service-requests/de.json";

export type PortalServiceRequestsDictionary = typeof dictionary;
```

- Dictionary-Lader, Locale-Mappings und Verbraucher importieren den benannten Typ aus seiner
  Contract-Datei. Dictionary-Typen werden nicht im Lader oder in Komponenten definiert oder
  von dort erneut exportiert.
- Alle Sprachversionen eines Dictionaries verwenden denselben Contract; keine eigenen Typen
  je Locale. Locale-Mappings werden mit `Record<Locale, DictionaryType>` abgesichert.
- Benötigte Untertypen erhalten ebenfalls eigene benannte Contract-Dateien und werden direkt
  aus der JSON-Quelle abgeleitet, z. B. `typeof dictionary.form`. Keine konkreten Property-Typzugriffe
  wie `PortalServiceRequestsDictionary["form"]` und keine duplizierten Felddefinitionen.
- Diese Regel ist bei künftigen Dictionary-Arbeiten anzuwenden. Ihre Dokumentation allein löst
  keinen Umbau bestehender Dictionaries oder ihrer Verbraucher aus.
