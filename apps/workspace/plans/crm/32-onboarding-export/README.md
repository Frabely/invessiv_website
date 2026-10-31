# Ordner 32 — Onboarding-Export

Status: im Review auf `feat/onboarding-export`.

## Ziel

Aus dem Onboardingbogen im Cockpit entsteht jederzeit (jeder Status von `draft` bis `completed`) ein ZIP, das
an eine KI übergeben wird, um daraus Designvorgaben, Grundstruktur, Tonalität und weitere Projektvorgaben
abzuleiten.

## Entscheidungen

- **Daten nur als JSON**, keine Markdown-Ansicht der Antworten und kein fest eingebauter KI-Auftrag. JSON trägt
  Typ, Pflicht, Optionen und stabile Keys eindeutig.
- **Formatbeschreibung im ZIP:** `README.md` (englisch) erklärt jede Property und jeden Wert von
  `onboarding.json` für Menschen und KI. Quelle ist `ONBOARDING_EXPORT_README`
  (`server/workspace/crm/services/onboarding/onboarding-export-readme.ts`). Für das Team steht dieselbe Erklärung
  auf Deutsch in `docs/guides/onboarding-export.md`. `onboarding-export-readme.test.ts` bricht, sobald der Export
  eine Property oder einen Statuswert enthält, den eine der beiden Beschreibungen nicht erklärt.
- **Alle Fragen** stehen im Export, auch unbeantwortete und per Bedingung ausgeblendete (`visible: false`).
  Auswahlfragen listen immer alle Optionen mit `selected`. Gruppen listen ihre Unterfragen unter `questions`, auch
  ohne Eintrag.
- **Dateien im ZIP**, das JSON verweist per relativem Pfad darauf. Der Export scheitert nie an Dateien: Videos,
  Links, Dateien über dem Byte-Limit, nicht lesbare oder nach dem Zeitbudget übersprungene Dateien stehen mit
  ihrem `status` im JSON.
- **Feste Deadline:** 96 Sekunden ab Request-Beginn einschließlich Vorbereitung. Auch laufende Dateiübertragungen
  werden beendet, damit Antworten, README und ZIP-Abschluss noch geschrieben werden. Abgebrochene und noch nicht
  gestartete Uploads tragen `timeout` ohne `path`. Teilanhänge können im ZIP bleiben und dürfen nur mit
  `status: included` als nutzbar gelten. Öffnet der Storage einen Stream erst nach dem Abbruch, wird dieser
  nachträglich geschlossen.
- **Mehrfach genutzte Dateien** werden einmal unter `files/shared/` gepackt und einmal auf das Limit angerechnet.
  Jede Frage nennt die Datei weiter vollständig, mit derselben `fileId`, demselben `path` und `usedIn` (alle
  Fragen der Datei in Bogenreihenfolge).
- Ordner- und Dateinamen sowie JSON-Keys sind englisch.
- Lesen genügt (`projects.read`, Projektscope); Dateien folgen `files.read` wie im Antworten-Tab.

## Aufbau

```
onboarding-<projekt>-<YYYY-MM-DD>.zip
├ README.md
├ onboarding.json
└ files/
   ├ <block_key>/<field_key>/<datei>
   ├ <block_key>/<group_key>/entry-<n>/<child_key>/<datei>
   └ shared/<datei>
```

`onboarding.json` folgt `OnboardingExportDto` (`packages/common/src/contracts/crm/onboarding/export/`), Version
`ONBOARDING_EXPORT_SCHEMA_VERSION`. Ändert sich die Form, steigt die Version und die README wird angepasst.

## Schnitt

| Teil       | Ort                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------ |
| Contracts  | `packages/common/src/contracts/crm/onboarding/export/`                                     |
| Konstanten | `packages/common/src/constants/crm/onboarding/onboarding-export-*.ts`                      |
| Mapping    | `server/workspace/crm/services/onboarding/onboarding-export-mapping-service.ts`            |
| README     | `server/workspace/crm/services/onboarding/onboarding-export-readme.ts`                     |
| Handler    | `server/workspace/crm/query-handler/export-onboarding-form.query-handler.ts`               |
| ZIP        | `server/shared/files/file-archive-service.ts` (Ordner je Eintrag, Texte, Manifest zuletzt) |
| Route      | `app/api/workspace/crm/onboarding/forms/[formId]/export/route.ts` (GET)                    |
| UI         | Button „Antworten exportieren“ im Kopf von `onboarding-form-page-view`                     |

Der Kontext (Kunde, Projekt, Vorlage) kommt über `onboardingFormAccessService.findReadableContext`, den Seite und
Export teilen.

## Offen

- Sichtprüfung im Cockpit (Entwurf und abgeschlossener Bogen), ZIP entpacken, README und JSON einmal an eine KI
  geben.
