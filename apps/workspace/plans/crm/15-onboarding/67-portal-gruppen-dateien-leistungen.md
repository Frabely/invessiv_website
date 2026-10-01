# Task 67 — Gruppen, Dateien, Projektleistungen und Freigabe

> **Vor dem Start lesen:** [`README.md`](./README.md), [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md),
> [`65-bogen-anlegen-und-anpassen.md`](./65-bogen-anlegen-und-anpassen.md),
> [`66-portal-formular.md`](./66-portal-formular.md) (Portal-Rahmen, Autosave, Slot-Schreibweg, Lese-Renderer — hier
> erweitert), `../00-entscheidungen.md`, `../AGENTS.md`, `plans/crm/14-dateien/README.md` (Upload-Ablauf),
> scoped `AGENTS.md` unter `src/components/portal/`, `src/server/portal/`, `src/server/shared/`.

> **Status:** läuft · **Teil-PR:** 15.5 · **Branch:** `feat/crm-onboarding-5-portal-voll`
> **Abhängigkeiten:** Task 66 (15.4) gemerged · **Aufwand:** 3–4 T. · **Dateien:** 80–105
> **Migration:** keine

## Ziel

Der Bogen wird **vollständig**: wiederholbare Gruppen, Upload je Feld, Projektleistungen bestätigen, Bestätigungs-,
Farb- und Skalenfelder. Dazu kommt intern **„Freigeben“** (mit Sprachwarnung) und im Portal der Navigationseintrag
„Onboarding“ und das echte Dashboard-Widget. **Ab diesem Merge können Kunden Bögen ausfüllen und absenden.**

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gruppeneinträge         | Kunde fügt Einträge hinzu, entfernt und sortiert sie (↑/↓, `moveListItem` aus Task 63). Die ID erzeugt der Client (`crypto.randomUUID()`), damit Autosave der Unterfelder sofort funktioniert. Grenze `max_items`                                                                                                                                                                                                    |
| Unterfelder             | Speichern über denselben Slot-Endpunkt aus Task 66 mit `groupEntryId`. Unterfeld-Bedingungen werden je Eintrag ausgewertet (Funktion aus Task 63)                                                                                                                                                                                                                                                                    |
| Eintrag entfernen       | `ConfirmDialog`, wenn der Eintrag Werte oder Dateien hat. Werte fallen per Cascade weg; **Dateien bleiben** im Dateibereich des Kunden, nur die Verknüpfung entfällt                                                                                                                                                                                                                                                 |
| Upload je Feld          | Hochladen über den bestehenden Portal-Upload (`portalFilesApiService.uploadTransport(customerId, { projectId, note: null })`, `useUploadQueue`), danach **automatisch** `POST …/files` mit `{ fieldId, groupEntryId, fileId }`                                                                                                                                                                                       |
| Wiederverwendung Upload | `FeedbackItemAttachments` wird zu `components/portal/shared/portal-attachment-field/` verallgemeinert (Transport, `attach`, `detach`, Grenzen, `accept`, Texte als Props). Feedback nutzt danach die verallgemeinerte Komponente                                                                                                                                                                                     |
| Anhängbar               | Eigene Kundendatei (`uploaded_by_side = customer`), Status `ready`, desselben Kunden und desselben Projekts; `asset_kind` in `accepted_asset_kinds` (wenn gesetzt); `max_items` unter Sperre gezählt. Sonst `not_attachable`/`limit_reached`                                                                                                                                                                         |
| Vorbefüllte Dateien     | Aus dem Vorbogen übernommene Verknüpfungen (Task 65) dürfen zu einem anderen Projekt gehören; sie sind sichtbar, entfernbar, aber nicht erneut anhängbar                                                                                                                                                                                                                                                             |
| Große Videos            | Feldhilfe verweist auf das Linkfeld im Block (Katalog 64a, `video_links`); kein eigener Feldtyp                                                                                                                                                                                                                                                                                                                      |
| Datei löschen (intern)  | Der bestehende Datei-Löschpfad lehnt Dateien ab, die an einem Bogen hängen: `FILE_ONBOARDING_BOUND` (analog `FILE_FEEDBACK_BOUND`, Fehlercode in den bestehenden Datei-Fehlercodes ergänzen)                                                                                                                                                                                                                         |
| Projektleistungen       | Feldtyp `project_services` zeigt die aktuellen Projektleistungen nur lesend (Titel, Beschreibung, **ohne Preise**). Kunde wählt „Passt so“ oder „Ich habe eine Anmerkung“ (Pflicht-Textfeld, max. 2 000). Speichern über `POST …/services-confirmation`                                                                                                                                                              |
| Leistungen ändern sich  | Ändert das Team Projektleistungen nach der Bestätigung, bleibt die Bestätigung gültig; der Bogen zeigt intern „Leistungen seit Bestätigung geändert“ (Vergleich `project_line_items.updated_at` > `services_confirmed_at`), Klärung in der Prüfung (Task 68)                                                                                                                                                         |
| Bestätigung             | `confirmation`: Checkbox, gespeichert als `"true"`, Abwahl löscht den Slot                                                                                                                                                                                                                                                                                                                                           |
| Farbe                   | `color`: HEX-Eingabe mit nativer Farbwahl (`<input type="color">` gekoppelt), Vorschau-Chip, Validierung aus Task 63                                                                                                                                                                                                                                                                                                 |
| Skala                   | `scale`: Radiogruppe mit 5 Stufen zwischen den Pol-Beschriftungen (`low`/`high`), gespeichert als `"1"`…`"5"`, tastaturbedienbar                                                                                                                                                                                                                                                                                     |
| Freigeben               | Intern `POST /api/workspace/crm/onboarding/forms/[formId]/release` mit `{ expectedVersion, acknowledgeWarnings }`; Übergang `draft → open`, `released_at/_by`, Activity `status_change`, Chat-Systemnachricht an den Kunden                                                                                                                                                                                          |
| Vor dem Freigeben       | Blockierend: mindestens ein Block, jeder Block mit mindestens einem Feld, jede Gruppe mit mindestens einem Unterfeld (`QUESTIONNAIRE_INVALID_FIELD_CONFIG`)                                                                                                                                                                                                                                                          |
| Warnungen (bestätigbar) | (a) Texte fehlen in der `preferred_locale` eines aktiven Portalmitglieds des Kunden (`missingQuestionnaireLocales`, Task 63); (b) der Kunde hat noch kein aktives Portalmitglied. Ohne `acknowledgeWarnings` → 409 `ONBOARDING_RELEASE_WARNINGS` mit Liste; UI zeigt `ConfirmDialog`                                                                                                                                 |
| Navigation              | `PORTAL_NAV_ITEMS` + `{ section: PortalSection.Onboarding, requiredPermission: Permission.PortalOnboardingRead }`; Label existiert (`nav.items.onboarding`)                                                                                                                                                                                                                                                          |
| Widget                  | `PORTAL_WIDGET_LAYOUT` Eintrag `onboarding`: `mock: false`, `requiredPermission: PortalOnboardingRead`, `openMode: None` (Link statt Dialog), `onlyWithContent: true`. Zustände: offen/Nachforderung → Fortschritt + „Weiter ausfüllen“; abgesendet → „Abgesendet am … · Wir prüfen deine Angaben“; abgeschlossen (ab Task 70) → „Abgeschlossen am … · Ansehen“. Mehrere Bögen: der offene zuerst, sonst der jüngste |
| Mock-Texte              | Die Mock-Texte des Widgets in `dictionaries/portal/dashboard/{de,en}.json` werden ersetzt, `renderMock`/`mockDialog` für `onboarding` entfernt                                                                                                                                                                                                                                                                       |
| Intern sichtbar         | Bogenseite: Knopf „Freigeben“ im Kopf (nur `draft`, nur `projects.write`); nach Freigabe Status „Beim Kunden“ und Fortschritt; Projektbereich zeigt denselben Fortschritt                                                                                                                                                                                                                                            |

## Architektur

```txt
Portal-API (Ergänzung zu Task 66)
  POST   /api/portal/[customerId]/onboarding/[formId]/group-entries                 { id, fieldId }
  DELETE /api/portal/[customerId]/onboarding/[formId]/group-entries/[entryId]
  POST   /api/portal/[customerId]/onboarding/[formId]/group-entries/[entryId]/move  { direction }
  POST   /api/portal/[customerId]/onboarding/[formId]/files                         { fieldId, groupEntryId, fileId }
  DELETE /api/portal/[customerId]/onboarding/[formId]/files/[answerFileId]
  POST   /api/portal/[customerId]/onboarding/[formId]/services-confirmation        { confirmed: true, note: string | null }

Workspace-API
  POST   /api/workspace/crm/onboarding/forms/[formId]/release                       projects.write + canOn

Server
  src/server/shared/services/onboarding/
    onboarding-group-entry-service.ts       anlegen/entfernen/sortieren (Positionen tauschen, deferrable Index)
    onboarding-attachment-service.ts        attach/detach mit den Regeln oben (Muster feedbackAttachmentService)
    onboarding-form-transition-service.ts   + release (Warnungen, Systemnachricht)
  src/server/portal/command-handler/ add/remove/move-portal-onboarding-group-entry, attach/detach-portal-onboarding-file,
                                     confirm-portal-onboarding-services
  src/server/workspace/crm/command-handler/ release-onboarding-form
  bestehender Datei-Löschpfad (intern)   + FILE_ONBOARDING_BOUND

Portal-UI (Ergänzung)
  src/components/portal/shared/portal-attachment-field/     verallgemeinert aus FeedbackItemAttachments
  src/components/portal/questionnaire/fields/
    onboarding-group-field/            Einträge als Karten, Unterfelder über questionnaire-field (rekursionsfrei: eine Ebene)
    onboarding-files-field/            portal-attachment-field + FeedbackAttachmentList-Kacheln
    onboarding-project-services-field/ Liste + „Passt so“ / Anmerkung
    onboarding-confirmation-field/
    onboarding-color-field/
    onboarding-scale-field/
  src/components/portal/dashboard/widgets/portal-onboarding-widget/   (Muster der bestehenden Widgets im Ordner)
Lese-Renderer (components/shared/onboarding) um Gruppen, Dateien (FeedbackAttachmentList/FileEntryRow/FileLightbox),
Leistungen, Bestätigung, Farbe, Skala erweitern — Portal-Leseansicht und CRM-Tab profitieren gleichermaßen.
CRM-UI
  src/components/workspace/crm/onboarding/form/onboarding-release-dialog/   ConfirmDialog mit Warnliste
```

## Tickets

### CRM-67-T1 — Upload-Baustein verallgemeinern (reiner Refactor)

- **Files:** `components/portal/shared/portal-attachment-field/*`, `feedback-item-attachments` (nutzt neuen Baustein),
  Tests
- **Skills:** `best-practices`
- **Akzeptanz:** Feedback-Anhänge verhalten sich identisch (bestehende Tests unverändert grün)

### CRM-67-T2 — Server: Gruppen, Dateien, Leistungsbestätigung, Freigabe

- **Files:** Services, Portal- und Workspace-Handler, Routen, Endpunkt-Helfer, `CRM_ENDPOINT_ACCESS_RULES`,
  Fehlercodes (`ONBOARDING_RELEASE_WARNINGS`, `FILE_ONBOARDING_BOUND`), Datei-Löschpfad, Tests
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz:**
  - Fremde Datei (anderer Kunde), interne Datei, nicht `ready`, falscher `asset_kind`, über `max_items` → abgelehnt
    (Tests)
  - Gruppeneintrag eines anderen Bogens / Feldes, das keine Gruppe ist → 404/422
  - Entfernen eines Eintrags lässt die Dateien bestehen
  - Interne Datei-Löschung einer verknüpften Datei → 409 `FILE_ONBOARDING_BOUND`
  - Freigeben: leerer Bogen blockiert; Sprachwarnung und fehlender Portalzugang nur mit Bestätigung; zweites
    Freigeben → 409 `ONBOARDING_INVALID_TRANSITION`; ohne `projects.write`/fremdes Projekt → 403/404
  - Leistungsbestätigung mit Anmerkung ohne Text → 422; Bestätigung zählt für `project_services`-Pflicht
  - Cross-Customer-Negativtests mit echter Session für jeden neuen Portalendpunkt

### CRM-67-T3 — Portal-Felder, Navigation, Widget

- **Files:** Feldkomponenten, Widget, `PORTAL_NAV_ITEMS`, `PORTAL_WIDGET_LAYOUT`, `portal-dashboard.tsx` (Mock
  entfernt), Dictionaries (portal/onboarding, portal/dashboard), Lese-Renderer, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Upload je Feld mit Fortschritt; hochgeladene Datei nach Reload am Feld sichtbar; Fehler erscheinen am Feld
  - Gruppen: hinzufügen, sortieren, entfernen per Tastatur; Fokus landet auf dem neuen Eintrag
  - Farbe und Skala tastaturbedienbar, Kontrast der Farbvorschau mit Rahmen
  - Ohne Bogen kein Widget (`onlyWithContent`); Navigationseintrag nur mit `portal.onboarding.read`
  - Fortschritt in Widget, Formular und CRM identisch (dieselbe Funktion)
  - Dark/Light, mobil ohne horizontales Scrollen

### CRM-67-T4 — Freigeben im CRM

- **Files:** `onboarding-release-dialog`, Kopf der Bogenseite, Client-Service, Dictionaries, Tests
- **Skills:** `frontend-design`, `copywriting`
- **Akzeptanz:**
  - Warnungen werden einzeln genannt (welche Sprache fehlt in welchem Block; kein Portalzugang)
  - Nach Freigabe ist der Aufbau weiter änderbar (Status `open`), der Hinweis im Editor nennt, dass der Kunde
    Änderungen sofort sieht

## Merge-Gate 15.5

- [ ] Kunde kann einen vollständigen Bogen (alle 14 Feldtypen) ausfüllen und absenden; E2E-Test des Kernablaufs
      „Starten → Freigeben → Ausfüllen inkl. Upload und Gruppe → Absenden“.
- [ ] Feedback-Anhänge und Feedback-Speicherstatus unverändert (Regressionstests).
- [ ] Widget und Navigation hinter `portal.onboarding.read`; ohne Bogen kein Widget.
- [ ] A11y-Smoke für den Portal-Bogen (Tastatur, Fokusreihenfolge, Kontrast).
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.

## Umsetzungsnotizen (Abweichungen vom Plan, 01.10.2026)

Bei der Umsetzung nachgezogen; der Plan oben bleibt als Entstehungsstand stehen, maßgeblich ist der Code.

### T1 — Upload-Baustein

- `PortalAttachmentField` nimmt `FeedbackAttachmentDto` als Dateiform; `QuestionnaireAttachment` hat dieselben
  Felder. `maxFiles` ist eine Pflichtzahl.

### T2 — Server

- **Antworten der neuen Portal-Endpunkte:** Die drei Gruppenbefehle antworten mit allen Einträgen der Gruppe
  (`QuestionnaireGroupEntryDto[]`, weil sich Positionen verschieben), Anhängen mit der Verknüpfung
  (`QuestionnaireAnswerFileDto`), Lösen und die Leistungsbestätigung mit `{ savedAt, savedByName }` für die Statuszeile.
- **`QuestionnaireAnswerFileDto.id`** ergänzt (ID der Verknüpfung): `DELETE …/files/[answerFileId]` adressiert sie,
  nicht die Datei.
- **Anhängen und Lösen verlangen zusätzlich `portal.files.read`** (wie bei den Feedbackrunden); ohne das Recht
  antworten beide 404. Sonst könnte ein Kontakt Dateien anhängen, die er danach nicht sieht.
- **„Desselben Projekts“ gilt streng:** Eine Kundendatei ohne Projekt ist `not_attachable` (anders als bei den
  Feedbackrunden, die sie ins Projekt ziehen). Der Portal-Upload aus T3 setzt das Projekt.
- **Gruppeneintrag mit fremder ID:** eine ID, die schon zu einem anderen Feld oder Bogen gehört, ist `validation`
  (422); dieselbe ID am selben Feld erneut ist ein Erfolg (Wiederholung eines Requests).
- **Leistungsbestätigung** erhöht die Bogenversion (`updateLockedVersioned`, einziger versionierter Schreibweg). Ohne
  `project_services`-Feld im Bogen antwortet sie 422, liegt das Feld in keinem für den Kunden offenen Block 409.
  `note: null` heißt „Passt so“; eine Anmerkung wird getrimmt gespeichert.
- **Freigeben:** Der Übergang wird vor der Version geprüft, damit ein zweites Freigeben mit veralteter Version
  `ONBOARDING_INVALID_TRANSITION` antwortet und keinen Versionskonflikt. Die Warnungen stehen in der 409-Antwort unter
  `details.warnings` (`OnboardingReleaseWarningDto`: `missing_translation` mit `blockId` und `locale`,
  `no_portal_access`). Ohne Portalkontakt entfällt die Sprachwarnung: Es gibt niemanden, dessen Sprache fehlen könnte.
  „Aktives Portalmitglied“ heißt: Mitgliedschaft ohne `revoked_at`.
- **Regeln als Pattern:** `isOnboardingFormReleasable` und `listOnboardingReleaseWarnings`
  (`packages/common/src/patterns/crm/onboarding/onboarding-release-check.ts`), damit T4 dieselben Regeln lesen kann.
- **`FILE_ONBOARDING_BOUND` gilt unabhängig vom Bogenstatus.** Task 63 nannte „solange der Bogen nicht `completed`
  ist“; die README verlangt aber, dass ein abgeschlossener Bogen dauerhaft mit allen Anhängen lesbar bleibt. Der
  Löschpfad lehnt deshalb jede verknüpfte Datei ab; erst nach dem Lösen ist sie löschbar.
- **Systemnachricht `onboardingReleased`** (Portal: „Dein Onboarding für … ist bereit. Du bist dran.“) und der
  Fehlertext `FILE_ONBOARDING_BOUND` sind in allen vier Dictionaries gepflegt.
- **Nicht in T2:** `PortalOnboardingFormDto` trägt weiter nur `servicesConfirmed`; die Leistungsliste, die Anmerkung
  und der interne Hinweis „Leistungen seit Bestätigung geändert“ gehören zu den Feldkomponenten in T3/T4. Kein
  Seed-Zuwachs (kein neues Schema).

### T3 — Portal-Felder, Navigation, Widget

- **Portal-DTO erweitert:** `services` (`PortalOnboardingServiceDto`, ohne Preis und ohne ID der Projektleistung),
  `servicesNote` und `canAttach`. `canUpload` berechnet die Seite wie beim Feedbackbogen (`portal.files.write`, nie
  die Owner-Sicht).
- **Slot-Schlüssel statt Feld-ID:** Entwürfe, Speicherzustände und DOM-IDs laufen über
  `onboardingAnswerDrafts.slotKey(fieldId, groupEntryId)`. Der Sprung aus der Liste fehlender Angaben trägt den
  Slot-Schlüssel im bestehenden URL-Parameter `field`, damit er auch ein Unterfeld in einem bestimmten Eintrag trifft.
- **Zweiter Hook `useOnboardingFormState`** für Gruppeneinträge, Datei-Verknüpfungen und Leistungsbestätigung. Er
  meldet Fehler je Feld; die Statuszeile des Bogens fasst ihn mit dem Autosave zusammen.
- **Neuer Eintrag vor der Serverantwort:** Der Eintrag erscheint sofort; das Speichern seiner Unterfelder wartet, bis
  der Server ihn angelegt hat. Verschieben und Entfernen zeigen sich erst mit der Serverantwort.
- **`moveListItem` wird nicht gebraucht:** Die Reihenfolge kommt aus der Serverantwort, der Client tauscht nicht
  selbst.
- **Leistungsbestätigung ohne eigenen Knopf:** „Passt so“ speichert beim Auswählen, eine Anmerkung beim Verlassen des
  Textfelds (wie jedes andere Textfeld des Bogens). Ohne Text bleibt die Bestätigung unverändert und das Feld nennt den
  Grund.
- **Grenzen neutral formuliert** („Maximale Anzahl an Einträgen: 1“), weil der Wert 1 sonst falsche Mehrzahl ergäbe.
- **Farbvorschau** ist der native Farbwähler selbst (mit Rahmen); in der Leseansicht ein SVG mit `fill`-Attribut,
  weil Inline-Styles nicht erlaubt sind.
- **Widget-Daten:** Die Dashboard-Seite ruft `listPortalOnboardingForms` auf und reicht die Liste durch; der
  `PortalDashboardDto` bleibt unverändert. Das Widget zeigt genau einen Bogen (`pickPortalOnboardingWidgetForm`).
  Der Zustand „abgeschlossen“ ist schon gebaut, entsteht aber erst mit Task 70.
- **Upload-Auswahl:** `uploadAcceptForKinds` (`packages/common`) schränkt den Dateidialog auf die Endungen der
  zugelassenen Arten ein; entschieden wird weiter auf dem Server.
- **Schrittleiste:** Ein Schritt zählt auch als angefangen, wenn er nur eine Datei oder einen Gruppeneintrag enthält.
- **CRM-Tab „Antworten“** zeigt die Dateien mit Download und Vorschau (`useFileDownloads`, `filesApiService`); die
  Seite reicht dafür das Datei-Dictionary durch.
- **Nicht in T3:** der interne Hinweis „Leistungen seit Bestätigung geändert“ (braucht ein Feld im internen DTO,
  gehört zur Bogenseite in T4), der E2E-Kernablauf (braucht „Freigeben“ aus T4) und eine Sichtprüfung im Browser.
