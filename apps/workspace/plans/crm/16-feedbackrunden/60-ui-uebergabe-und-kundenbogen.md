# Task 60 — UI: Runde übergeben und Kundenbogen

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Fachmodell, Status, Limits, Rechte, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md` und die scoped `AGENTS.md` am Zielcode. Diese Task-Datei plus README sind
> vollständig; frühere Chat- oder Planstände (Task 22/23) gelten nicht.

> **Status:** offen · **Teil-PR:** 16.4 · **Branch:** `feat/crm-feedback-4-uebergabe-bogen`
> **Abhängigkeiten:** Task 59 (16.3) gemerged · **Aufwand:** 3–4 T. · **Dateien:** 70–95
> **Migration:** keine
> **Skills:** `frontend-design`, `copywriting` (Portal-Copy in Du-Form)

## Ziel

Der erste sichtbare Teil des Kreislaufs:

- **Intern:** In der Projektansicht erscheint die Feedback-Sektion (ersetzt die Mock-Karte „feedback“). Das Team
  übergibt Runde n, sieht Kontingent, Verlauf und die eingereichte Runde mit allen Punkten und Dateien.
- **Portal:** Der Kunde sieht im Dashboard-Widget, wer am Zug ist, öffnet den Feedbackbogen, legt Punkte an, hängt
  Dateien an, speichert zwischen, reicht ein — oder gibt ohne Änderungen frei.
- **Leiste:** Der Feedbackblock wird automatisch aktiv, sobald Runde 1 existiert.

**Bewusster Zwischenstand:** Eingereichte Runden bleiben bis Task 61 auf `submitted` (siehe README, Rollout-Gate:
noch keine Kunden eingeladen). Intern gibt es in diesem PR keine Statusbuttons, die ins Leere führen.

## Getroffene Entscheidungen

| Frage                       | Entscheidung                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ort intern                  | Sektion „Feedbackrunden“ in der Projektansicht des Kunden-Cockpits, an der Stelle der Mock-Karte (`PROJECT_FUTURE_AREAS` verliert `feedback`)                      |
| Übergabe ohne Voraussetzung | Button fehlt; stattdessen erklärender Text mit dem Grund (kein Block, nicht am Feedbackschritt, Projekt nicht aktiv, Kontingent erschöpft …)                       |
| Übergabe-Dialog             | Vorschau-Link (vorbelegt aus der letzten Runde bzw. `projects.preview_url`), „Was ist neu“, Frist, Bereiche als editierbare Chips (vorbelegt aus `feedback_areas`) |
| Ort Portal                  | Seite `/[locale]/portal/[customerId]/projects/[projectId]/feedback`; Einstieg über Widget `feedback` und die Projektkarte                                          |
| Autosave                    | Entprellt (ca. 1,5 s nach der letzten Eingabe) plus Button „Zwischenspeichern“; Status „Gespeichert · vor 1 Min.“ über Live-Region                                 |
| Konflikt                    | 409 lädt den aktuellen Stand und bietet den eigenen, nicht gespeicherten Text zum Kopieren/Wiederherstellen an — nie stilles Überschreiben                         |
| Zuletzt bearbeitet          | Zeigt „Zuletzt bearbeitet von {Name} am …“ (aus `draft_updated_by_portal_membership_id`), damit zwei Kontakte sich nicht überraschen                               |
| Einreichen                  | Dialog mit Zusammenfassung (Anzahl Punkte je Bereich, Dateien) und Hinweis „Danach kannst du nichts mehr ändern“                                                   |
| Freigeben ohne Änderungen   | Nur sichtbar, solange die Runde keine Punkte hat. Pflicht-Bestätigungsdialog mit Checkbox (siehe unten)                                                            |
| Dateien                     | Upload über den bestehenden Portal-Upload (Task 55) mit dem Projekt der Runde, danach automatisch an den Punkt gehängt                                             |
| Ohne `portal.files.write`   | Punkt hat keinen Upload-Button, nur Text                                                                                                                           |

### Bestätigungsdialog Freigabe/Abnahme (Portal)

```
Projekt freigeben?
Mit der Freigabe ist das Projekt von deiner Seite abgeschlossen. Die übrigen Feedbackrunden
verfallen, und wir bereiten den Launch vor. Das lässt sich nicht rückgängig machen.

[ ] Ich habe alles geprüft und gebe das Projekt frei.

                              [Abbrechen]   [Projekt freigeben]  ← erst aktiv mit Haken
```

Der Request sendet `confirmFinal: true`; ohne Haken ist der Button deaktiviert, und der Server lehnt ohne Flag ab.
Derselbe Dialog wird in Task 61 für die Abnahme nach der letzten Runde wiederverwendet (Text ohne „übrige Runden
verfallen“, wenn keine übrig sind).

## Oberflächen

### Intern

```txt
apps/workspace/src/components/workspace/crm/feedback-rounds/
  project-feedback-section/        Kontingent „Runde x von N“, aktive Runde, Verlauf, Übergabe-Button oder Grund
  feedback-handover-dialog/        Formular der Übergabe (Dialogbausteine aus packages/ui)
  feedback-area-chips/             editierbare Bereichsliste (Hinzufügen, Entfernen, max. 30)
  feedback-round-detail/           Kopf (Status, Vorschau-Link, Frist, eingereicht von/am), Punktliste, ZIP
  feedback-item-row/               ein Punkt: Bereich, Art-Badge, Text, Anhänge
apps/workspace/src/components/workspace/shared/status-row/   domänenneutraler Zeilenbaustein (siehe T1)
apps/workspace/src/client/crm/feedback-rounds-api-service.ts
apps/workspace/src/common/contracts/crm/feedback-rounds-view-model.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/feedback-rounds/{de,en}.json
```

- Die Cockpit-Seite lädt die Runden des gewählten Projekts serverseitig (`list-project-feedback-rounds`) und übergibt
  ein View-Model.
- **Projektwahl und Runden-Detail werden URL-State** (Pflicht laut `plans/crm/AGENTS.md`, heute ist die Projektwahl
  in `customer-projects-section.tsx` noch `useState`): `CustomerListQueryParam`
  (`apps/workspace/src/common/constants/crm/list/customer-list-query-params.ts`) bekommt `Project: "project"` und
  `FeedbackRound: "feedbackRound"` (+ `CUSTOMER_LIST_QUERY_PARAM_VALUES` und Test). `ProjectSwitcherTabs` liest und
  schreibt `project=<uuid>` (ungültige oder fremde ID → erstes Projekt, wie heute); `feedbackRound=<uuid>` öffnet das
  Runden-Detail. Links entstehen nur über einen Pfadhelfer (z. B.
  `apps/workspace/src/common/patterns/crm/customer-cockpit-href.ts`: `buildCustomerCockpitHref({ customerId,
projectId?, feedbackRoundId? })` auf Basis von `SITE_ROUTES` und `createLocalePathname`), nie aus String-Literalen.
  Task 62 und die Chat-Systemnachrichten verlinken darüber.
- **Aktueller Schritt im Projekt-Editor:** Sobald das Projekt Runden hat und nicht abgenommen ist, ist das Select
  „Aktueller Schritt“ deaktiviert und erklärt „Wird gerade durch Feedbackrunde {k} bestimmt“ (der Wert würde ohnehin
  ignoriert). Der Server lässt das Feld weiterhin zu, damit nach der Abnahme normal weitergepflegt werden kann.
- Kundentext nur als Text; Links über `splitMessageLinks` (`packages/common/src/patterns/ui/split-message-links.ts`),
  neuer Tab mit `rel="noopener noreferrer"`. Absätze bleiben erhalten; sehr lange Punkte klappen auf.
- Anhänge über `FileEntryRow`/`FileLightbox` (bestehende Dateibausteine), ZIP über den bestehenden internen
  Archiv-Endpunkt `POST customers/[customerId]/files/archive` mit den Datei-IDs der Runde — nur mit `files.read`.
- Ohne `projects.write` fehlt „Runde übergeben“ vollständig (nicht nur deaktiviert).
- Regeln in `apps/workspace/src/components/workspace/crm/AGENTS.md` ergänzen (Abschnitt Feedbackrunden: keine
  Fachlogik im Client, Buttons nur aus `canTransition`).

### Portal

```txt
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/projects/[projectId]/feedback/
  page.tsx, loading.tsx (+ loading.module.css), page.test.tsx       noindex, force-dynamic, requirePortalActor/Reader
apps/workspace/src/components/portal/feedback/
  feedback-page-view/            Orchestrierung der Seite
  feedback-round-intro/          „Feedbackrunde 1 von 2 · Du bist dran · bis 14.10.“, Vorschau-Link, „Was ist neu“
  feedback-item-editor/          Bereich (Select: Bereiche + „Allgemein“), Art (optional), Text mit Zähler ab 80 %
  feedback-item-attachments/     Upload (FileDropZone kompakt) + Liste mit „Entfernen“ (lösen)
  feedback-draft-status/         Speicherstatus, zuletzt bearbeitet von, Konflikt-Hinweis
  feedback-submit-dialog/
  feedback-approve-dialog/       Bestätigung mit Checkbox (siehe oben)
  feedback-round-history/        frühere Runden mit Status und Punkten
  feedback-quota-notice/         Kontingent, erschöpft → „Schreib uns im Chat“ (Link zum Chat)
apps/workspace/src/components/portal/dashboard/widgets/portal-feedback-widget/
apps/workspace/src/hooks/portal/use-feedback-draft.ts
apps/workspace/src/client/portal/portal-feedback-api-service.ts
apps/workspace/src/i18n/dictionaries/portal/feedback/{de,en}.json   (+ Registrierung im Portal-Dictionary-Index)
```

Pfad der Seite: `/portal/[customerId]/projects/[projectId]/feedback` nutzt das vorhandene Segment
`PortalSection.Projects` (`apps/workspace/src/common/constants/portal/portal-sections.ts`) plus ein neues Segment
`feedback`. Links darauf (Widget, Projektkarte, Systemnachricht) entstehen ausschließlich über einen neuen Pfadhelfer
`apps/workspace/src/common/patterns/portal/portal-feedback-path.ts` (`buildPortalFeedbackPath({ customerId, projectId })`
auf Basis von `SITE_ROUTES.PORTAL` und `createLocalePathname`, mit Test). Kein eigener Eintrag in `PORTAL_NAV_ITEMS`.

Seitenaufbau (mobil zuerst):

```
Feedbackrunde 1 von 2 · Du bist dran · bitte bis 14.10.       [Vorschau öffnen ↗]
Was ist neu: „Erste komplette Version aller Seiten“

┌ Punkt 1 ─ Bereich [Startseite ▾]  Art [Änderungswunsch ▾] ────────── ✕ ┐
│ Hero-Bild wirkt zu dunkel, lieber das Teamfoto                          │
│ 📎 screenshot-hero.png   [+ Datei]                                      │
└─────────────────────────────────────────────────────────────────────────┘
[+ Punkt hinzufügen]
Gespeichert · vor 1 Min. · zuletzt bearbeitet von Anna

[Zwischenspeichern]                         [Feedback einreichen]
Keine Änderungen nötig?  [Projekt ohne Änderungen freigeben]   ← nur ohne Punkte
```

Zustände: keine Runde übergeben („Sobald wir dir einen Stand zeigen, kannst du hier Feedback geben“); Runde `open`
(Bogen); `submitted` („Eingereicht – wir sichten dein Feedback“, Punkte nur lesend); abgenommen („Abgenommen am …“);
Kontingent erschöpft. „Noch keine Runde“ und „alle Runden erledigt“ sind unterscheidbar.

### Hook `use-feedback-draft`

- Hält Punkte lokal, speichert entprellt über `portal-feedback-api-service` (`versioned-json-mutation-service.ts`),
  übernimmt die neue `version`.
- `flush()` vor Upload, Einreichen und Freigeben.
- Bei 409: aktuellen Stand übernehmen, eigene ungespeicherte Punkte als Wiederherstellungsangebot behalten.
- Warnung beim Verlassen, solange ungespeicherte Änderungen oder laufende Uploads existieren.
- Speicherstatus über `aria-live="polite"`.

### Widget und Leiste

- `apps/workspace/src/common/constants/portal/portal-widget-layout.ts`: `feedback` → `mock: false`,
  `requiredPermission: portal.feedback.read`.
- `portal-feedback-widget`: je sichtbarem Projekt mit Block „Runde x von N“, wer am Zug ist („Du bist dran“ /
  „Wir sind dran“ / „Abgenommen“), Frist, Link „Feedback geben“ bzw. „Ansehen“. Ohne Runden und ohne Block erklärt es,
  wofür der Bereich gedacht ist.
- Dashboard-Query (`get-portal-dashboard.query-handler.ts`) liefert `PortalFeedbackSummaryDto` und ergänzt
  `PortalProjectFeedbackBlockDto` um `latestRoundNumber` und `approvedRoundNumber`; CRM-Projektansicht analog. Die
  Leisten nutzen `buildProjectProcessTrack` (Task 57) mit `roundProgress`.

## Tickets

### CRM-60-T1 — Geteilter Zeilenbaustein

- **Files:** `components/workspace/shared/status-row/**` (tsx, module.css, Test), `crm/tasks/task-row/**` umgestellt
- **Inhalt:** domänenneutrale Teile aus `task-row` extrahieren (Grid, Status-Slot, Detail-Button, `data-pending`/
  `data-tone`, Container-Query). Texte und Fachannahmen bleiben beim Nutzer (`components/workspace/shared/AGENTS.md`)
- **Akzeptanz:** bestehende Aufgaben-Tests grün; visuell unverändert (Screenshot im PR)

### CRM-60-T2 — Interne Sektion und Übergabe

- **Files:** `crm/feedback-rounds/**`, Client-Service, View-Model, Cockpit-Einbindung, `customer-list-query-params.ts`,
  `project-switcher-tabs/**`, Pfadhelfer `customer-cockpit-href.ts`, Dictionaries, AGENTS-Abschnitt
- **Akzeptanz:** `?cockpit=<kunde>&project=<projekt>&feedbackRound=<runde>` öffnet genau diese Runde, auch nach
  Neuladen; Projektwechsel aktualisiert die URL; fremde Runde → Detail bleibt zu; Übergabe mit allen Feldern; jeder Sperrgrund als Text; Doppelklick → eine Runde (Antwort
  `ROUND_ALREADY_ACTIVE` zeigt die bestehende Runde); eingereichte Runde lesbar mit Anhängen und ZIP; `<script>` als
  Text; ohne `projects.write` kein Button; Empty-State erklärt den Zweck

### CRM-60-T3 — Portal-Feedbackseite

- **Files:** Seite, `components/portal/feedback/**`, Hook, Client-Service, Dictionaries
- **Akzeptanz:** Entwurf überlebt Neuladen (Server); Autosave und manuelles Speichern; Konflikt zeigt
  Wiederherstellung; Upload hängt Datei an den Punkt; Einreichen sperrt die Seite; Freigabe nur mit Haken und nur ohne
  Punkte; Tastatur vollständig; 360 px; Dark/Light; alle Texte DE/EN in Du-Form

### CRM-60-T4 — Widget und aktive Leiste

- **Files:** Widget-Registry, `portal-feedback-widget/**`, Dashboard-Query/Mapping, DTO-Ergänzung, CRM-Projektansicht
- **Akzeptanz:** ohne `portal.feedback.read` fehlt das Widget vollständig; nach Übergabe zeigt die Leiste
  „Feedbackrunde 1“ als aktuell, auch wenn `current_process_step` davor steht; nach Freigabe steht der Schritt nach dem
  Block als aktuell

### CRM-60-T5 — E2E

- **Files:** `apps/workspace/e2e/portal-feedback.e2e.ts` (Muster `portal-files.e2e.ts`, Clerk-Testsitzungen)
- **Akzeptanz:** Übergabe → Kontakt A speichert → Kontakt B bekommt Konflikt → A reicht ein → intern sichtbar,
  Aufgabe im Cockpit → fremder Kunde bekommt 404

## Deploy-Sicherheit

1. **Live sichtbar:** interne Feedback-Sektion mit Übergabe; Portal-Widget und Feedbackseite; aktive Leiste.
2. **Bricht nichts:** keine Migration; Mock-Karte wird ersetzt; `task-row` visuell unverändert.
3. **Offen:** Weiterbearbeitung eingereichter Runden und Abnahme nach Abschluss (Task 61), Eingang (Task 62).

## End-to-End-Akzeptanz

1. Das Team übergibt Runde 1; der Kunde sieht „Du bist dran“ im Widget und in der Leiste.
2. Der Kunde legt drei Punkte in zwei Bereichen an, hängt einen Screenshot an, lädt neu — alles ist da.
3. Einreichen sperrt den Bogen; intern ist die Runde mit Punkten und Datei lesbar, die Sammelaufgabe steht im Cockpit
   des Projekt-Owners, im Chat erscheint die Systemnachricht.
4. Ein zweites Projekt: Freigabe ohne Punkte nur mit Haken; danach „Abgenommen“ im Widget, Leiste hinter dem Block.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün; E2E grün.
