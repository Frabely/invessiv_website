# Review: Portal-Onboarding-Changeset

Nacharbeit am 05.10.2026: F01 wurde vom Nutzer bewusst akzeptiert, da die Migrationen nur in Dev aktiv sind; keine Migrationsänderung im Rahmen der Nacharbeit. F02 wurde behoben. Zusätzlich werden besuchte und verlassene Schritte innerhalb der Editor-Sitzung auch ohne Antworten erfasst, einschließlich direkter Schrittklicks und Browser-History. Die ursprünglichen Review-Findings unten dokumentieren den Stand vor dieser Nacharbeit.

Stand: 05.10.2026, Branch `feat/portal-onboarding-layout`, HEAD `01d1f99d3292d15779c1061bef38da49ec4f254a`. Geprüft wurden die lokalen Änderungen gegen HEAD einschließlich neuer, ungetrackter Dateien. Inventar vor diesem Bericht: 61 Dateien mit inhaltlichem Diff und 34 ungetrackte Dateien; zusätzliche Git-Status-Einträge ohne inhaltlichen Diff wurden nicht als eigene Änderungen gewertet.

**Gesamturteil:** Zwei P2-Findings sollten vor dem Merge behoben werden. Keine belegten P0-/P1-Findings im geprüften Umfang. Die Formularbausteine sind sinnvoll aufgeteilt; die Trennung von Füllstand und fachlicher Vollständigkeit ist grundsätzlich konsistent. Die neue Gesamtanzeige im Prüfschritt und die Auslieferung der Katalogkorrekturen sind noch fehlerhaft.

## Findings

### F01 · P2 · Katalogkorrekturen erreichen bereits migrierte Datenbanken nicht

- **Fundstellen:** `packages/db/migrations/0052_replace_onboarding_standard_catalog.sql:731`, `packages/db/migrations/0053_add_onboarding_extra_catalog_blocks.sql:364`; Migrationsrunner `packages/db/scripts/run-migrations.ts:102`.
- **Problem und Auswirkung:** Die verkürzten DE-/EN-Auswahltexte werden ausschließlich in bestehenden INSERT-Migrationen geändert. Beide Dateien sind bereits in HEAD committet; die Pläne D und D2 dokumentieren außerdem ihre Anwendung in der Dev-DB. Der Runner prüft nur den Dateinamen in `schema_migrations` und überspringt registrierte Dateien. Ein normales Update behält dort die alten Texte, während eine frisch angelegte Datenbank die neuen Texte erhält. Die Ausnahme für ausschließlich lokale, noch nicht committete Migrationen greift daher nicht.
- **Regelbezug:** `packages/db/AGENTS.md`, Abschnitt „Migrationen“: registrierte Dateien nicht nachträglich ändern; Korrekturen als neue Migration. Ebenso `apps/workspace/plans/crm/AGENTS.md`, „Architektur und Migration“.
- **Empfehlung:** Bestehende Migrationen unverändert lassen und die gewünschten Katalogübersetzungen durch eine neue, gezielte Datenmigration aktualisieren. Dabei bestehende Bogenkopien und individuell gepflegte Inhalte bewusst berücksichtigen; `0052` nicht erneut ausführen, da sie den Katalog ersetzt.

### F02 · P2 · Prüfschritt signalisiert Erfolg trotz ungültiger optionaler Eingabe

- **Fundstelle:** `apps/workspace/src/components/portal/onboarding/onboarding-step-track/onboarding-step-track.tsx:76`.
- **Auslöser:** Alle Pflichtangaben ausfüllen und in ein sichtbares optionales URL-, E-Mail- oder Farbfeld einen ungültigen Wert eingeben, beispielsweise `blue` statt eines Hex-Werts.
- **Problem und Auswirkung:** `onboardingAnswerDrafts.toAnswers` lässt ungültigen Text aus der Vollständigkeitsberechnung weg. Beim optionalen Feld bleibt deshalb `completeness.missing` leer. Der neue Prüfschritt setzt ausschließlich anhand dieser Liste `ratio: 1` und `tone: success`, obwohl `invalidBlockIds` nicht leer ist und `autosave.flush()` das Absenden verhindert. Damit widerspricht die grüne Prüfanzeige dem roten betroffenen Schritt und der Kopfzusammenfassung, die `invalid` korrekt einbezieht. Es handelt sich um einen Anzeigefehler; die Absendeprüfung wird nicht umgangen.
- **Empfehlung:** Den Erfolgszustand des Prüfschritts zusätzlich an `invalidBlockIds.size === 0` binden und bei ungültigen Eingaben einen entsprechenden Status einschließlich zugänglicher Beschreibung darstellen. Den Fall „Pflicht vollständig, optionale Eingabe ungültig“ in den vorhandenen Formularansicht-Tests absichern.

## Architektur, Zusammenspiel und Abdeckung

| Bereich                 | Prüfung                                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portal-Onboarding       | Editor, Formularansicht, Block-/Schrittanzeige, neue Kopf-/Zusammenfassungs-/Rasterkomponenten, Feld-Dispatcher und Feldkomponenten einschließlich Styles und relevanter Tests geprüft. Autosave und Entwurfsabbildung zur Absende- und Validierungslogik verfolgt. |
| Gemeinsame Logik        | Vollständigkeitsberechnung, neue Zähler, Status-/Spaltenhelfer, Contracts und Konstanten geprüft. Pflichtprüfung, bedingte Felder, Gruppeneinträge und verborgene Dateiverknüpfungen berücksichtigt.                                                                |
| Gemeinsame UI           | `ProcessTrack`, Buttons, `FormField`, `FormFieldset`, `FormHint`, `OptionTile`, `RadioControl`, Select-Styles und Paketexports geprüft. Bestehende positionsbasierte Schrittanzeigen bleiben über die optionale API erhalten.                                       |
| Portal-Shell            | Mobiler Menü-Dialog, Firmen-/Projektwechsler, Dialog-/Select-Anbindung, Back-Link, Dashboard-Dock und Speicherstatus-Styles geprüft.                                                                                                                                |
| Texte und Dokumentation | Änderungen der DE-/EN-Dictionaries, Portal-/UI-Regeln und Layoutplan geprüft; Katalogdokumentation mit Migrationen und Runner abgeglichen.                                                                                                                          |
| Web-App                 | Neue globale Control-Tokens und Auswirkungen der gemeinsamen Formularstyles statisch betrachtet; kein vollständiger Review der Marketing-App.                                                                                                                       |
| SQL                     | Geänderte Übersetzungszeilen, Migrationshistorie, dokumentierter Anwendungsstand und Runner geprüft. Unveränderte umfangreiche Katalogdefinitionen wurden nicht erneut als vollständiges fachliches Katalogaudit geprüft.                                           |

Die neuen UI-Bausteine sind app-neutral, die Fachtexte bleiben in der App und exportierte neue Status-/Spaltenwerte liegen in `common`. Der Editor verwendet weiterhin die zentrale Vollständigkeitsberechnung und die vorhandenen Speicher-Hooks. Keine neu eingeführte, belegte Umgehung von Berechtigungen oder Portal-/Workspace-Grenzen gefunden. Ein vollständiges Server-/Autorisierungsaudit war nicht Teil dieses UI-Changeset-Reviews.

## Ausgeführte Prüfungen

- Workspace: fokussierte Tests für Portal-Onboarding, Portal-Shell und Onboarding-Patterns/-Konstanten — **11 Dateien, 107 Tests bestanden**.
- UI: Tests für Formulare, RadioControl, Buttons und ProcessTrack — **5 Dateien, 17 Tests bestanden**.
- Common: Tests für Vollständigkeit und die vier neuen UI-Konstantengruppen — **5 Dateien, 56 Tests bestanden**.
- Typecheck für `@invessiv/workspace`, `@invessiv/ui` und `@invessiv/common` — **bestanden**.
- Lint für dieselben drei Pakete — **keine Fehler**. Workspace meldet eine Warnung im unveränderten `update-project.command-handler.test.ts:189` (`_omitted`); UI/Common melden den ESLint-Konfigurationshinweis zum fehlenden Next-Pages-Verzeichnis.
- Teststarts innerhalb der Sandbox scheiterten zunächst an `spawn EPERM`; die anschließend freigegebenen Wiederholungen außerhalb der Sandbox waren erfolgreich.

## Grenzen und offene Verifikation

- Keine Browser-Sichtprüfung, kein E2E-Lauf, kein App-Build und keine vollständigen monorepoweiten Merge-Gates ausgeführt. Insbesondere Sticky-Elemente, Fokusposition nach Feldsprüngen, mobile Tastatur, Dark/Light und Layout anderer Nutzer der gemeinsamen Controls bleiben im Browser zu prüfen. jsdom bestätigt keine CSS-Geometrie.
- Keine Datenbankverbindung, Migration oder DB-Smokes ausgeführt. Der registrierte Zustand konkreter Deployment-Datenbanken wurde nicht ausgelesen; F01 ist durch Runner, Git-Historie und dokumentierten Dev-Anwendungsstand belegt.
- Keine Secret-Dateien oder externen Kundendaten gelesen. Keine Fixes, neuen Tests, Commits oder Änderungen an Regeln vorgenommen; dieser Bericht ist die einzige neue Review-Datei.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel erforderlich: Die bestehenden Prüfschwerpunkte decken Migrationsauslieferung, widersprüchliche UI-Zustände und Testgrenzen bereits ab. Der Skill bleibt unverändert.
