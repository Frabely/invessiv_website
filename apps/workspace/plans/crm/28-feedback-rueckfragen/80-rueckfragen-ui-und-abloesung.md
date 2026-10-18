# Task 80 — Rückfragen-UI und Ablösung der globalen Rückgabe (Teil 28.3)

> **Branch:** `feat/crm-feedback-rueckfragen` · **Basis:** Task 79 umgesetzt · **Aufwand:** L · **Dateien:** ≈ 65
> **Migration:** keine
> **Zuerst lesen:** `README.md` dieses Ordners (Abschnitte 1, 3, 4, 7.5, 7.6), Task 78 und 79,
> `apps/workspace/src/components/workspace/crm/AGENTS.md`,
> `apps/workspace/src/components/portal/AGENTS.md` (Abschnitt „Feedbackbogen“), `apps/workspace/src/client/AGENTS.md`,
> Skills `frontend-design` (UI) und `copywriting` (alle neuen Texte)

**Nach dem Merge:** Das Team stellt im Cockpit Rückfragen an einzelnen Punkten und schließt sie bei Bedarf mit
Hinweis. Der Kunde sieht offene Rückfragen schon während der laufenden Runde, springt über einen Hinweis zu den
betroffenen Punkten und antwortet direkt am Punkt, ohne die Runde neu einzureichen. Fortschritt und Abschlussdialog
zählen offene Rückfragen. Die globale Aktion „Zurück an den Kunden“ gibt es nicht mehr; bereits zurückgegebene Runden
funktionieren weiter. Ergebnisse bleiben bis zum Rundenabschluss für den Kunden verborgen.

**Vorlagen im Code:**

- Interne Dialoge: `components/workspace/crm/feedback-rounds/feedback-text-dialog/feedback-text-dialog.tsx`
  (generisch über `TEntity`, nutzt `FormDialog` und `useVersionedMutation` aus `hooks/workspace/use-versioned-mutation.ts`).
- Client-Muster: `client/crm/feedback-rounds-api-service.ts` (`versionedJsonMutationService.mutate`),
  `client/portal/portal-feedback-api-service.ts` (`send`, `readFailure`).
- Portal-Punktliste und Reader: `components/portal/feedback/feedback-item-list/`, `feedback-reader/`,
  `feedback-round-step/`, `feedback-round-notice/`, Live-Region in `feedback-page-view/`.
- Gemeinsame Darstellung: `components/shared/feedback/feedback-read-only-item-content/`, `feedback-item-text/`.
- Datumsformatierung: `lib/i18n/format-moment-day.ts` bzw. `format-calendar-day.ts`, Texte über `formatMessage`.

## Festlegungen für diesen Teil

- **Status je Punkt** kommt ausschließlich aus `getFeedbackItemProcessingState` (Task 79): Zeile, Fortschritt und
  Abschlussdialog zählen damit identisch. „Erledigt“ = Ergebnis und keine offene Rückfrage.
- **Antwort-Capability im Portal:** `feedback.canSubmit` (serverseitig: `portal.feedback.submit`, keine
  Owner-Ansicht; die Seite selbst ist schon an Lese- und Projektzugriff gebunden) **und** Rundenstatus in
  `RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES` **und** Rückfrage `open`. Die Kombination liegt als seiteneffektfreier
  Helfer `canAnswerFeedbackClarification` in `apps/workspace/src/common/patterns/portal/`. Der Command prüft alles
  erneut. Kein zusätzliches DTO-Feld.
- **Kennungen:** Jede explizite Aktion (Frage stellen, schließen, antworten) erzeugt eine `commandId` per
  `crypto.randomUUID()`. Sie bleibt bei Netzwerk-Retries und wird nach Konflikt oder Textänderung neu erzeugt.
- **Globale Rückgabe – Kompatibilität:** Ein noch geöffneter alter Tab kann `to: open` senden. Das Schema behält dafür
  einen dokumentierten Kompatibilitätszweig. Weil der Übergang fehlt, antwortet `canTransition` mit
  `INVALID_TRANSITION` und die UI zeigt den bestehenden Text `processingErrors.changed` („…du siehst jetzt den
  aktuellen Stand“). Der Zweig wird erst in einem späteren Cleanup entfernt.

## CRM-80-T1 — Client und Pfade

```txt
apps/workspace/src/common/constants/feedback/feedback-api-paths.ts (+ .test.ts)   + Clarifications, Close, Answer
apps/workspace/src/common/patterns/crm/crm-api-endpoints.ts                        + crmFeedbackItemClarificationsEndpoint(itemId),
                                                                                    crmFeedbackItemClarificationCloseEndpoint(itemId, clarificationId)
apps/workspace/src/common/patterns/portal/portal-api-endpoints.ts                  + portalFeedbackClarificationAnswerEndpoint(customerId, { roundId, itemId, clarificationId })
apps/workspace/src/client/crm/feedback-rounds-api-service.ts                       + askClarification, closeClarification (VersionedJsonMutationResult<FeedbackRoundItemDto, FeedbackRoundErrorCode>)
apps/workspace/src/client/portal/portal-feedback-api-service.ts                    + answerClarification → eigener Punkt-Ergebnistyp
apps/workspace/src/common/contracts/portal/...                                     Punkt-Client-Ergebnis (ok/conflict/not_open mit current/failure), falls nicht vorhanden
```

- URLs nur über die Builder; keine Literale. Die Punkt-Antwort im Portal wird mit einem eigenen Leser für
  `PortalFeedbackItemDto` gelesen, nicht mit `readRound`.
- `clarification_not_open` und `CLARIFICATION_NOT_OPEN` liefern den aktuellen Punkt mit, damit die UI ihn ohne
  zusätzlichen Request zeigen kann.

## CRM-80-T2 — Gemeinsamer Verlauf

```txt
apps/workspace/src/components/shared/feedback/feedback-clarification-thread/feedback-clarification-thread.tsx        neu
apps/workspace/src/components/shared/feedback/feedback-clarification-thread/feedback-clarification-thread.module.css neu
apps/workspace/src/components/shared/feedback/feedback-clarification-thread/feedback-clarification-thread.test.tsx   neu
apps/workspace/src/common/contracts/feedback/...                                   benannter Labels-Typ, falls Portal und Cockpit unterschiedliche Dictionaries übergeben
```

- Rein darstellend. Props: `clarifications: readonly FeedbackItemClarificationDto[]`, `labels` (Rollen „Unser Team“
  / „Kunde“, Status, Ein-/Ausklappen), `locale`, optional `authorName(clarification, part)` für interne Namen und ein
  optionaler `children`-Slot unter der offenen Rückfrage (dort hängen Cockpit-Schließen bzw. Portal-Antwortformular).
- Reihenfolge nach `requestedAt`, `id` (bereits serverseitig sortiert). Die offene Rückfrage steht immer sichtbar.
  Abgeschlossene Paare liegen ab der zweiten in einer einklappbaren Gruppe „Frühere Rückfragen ({count})“
  (Disclosure-Button mit `aria-expanded`).
- Texte gehen über `feedback-item-text`, also reiner Text ohne HTML oder Markdown. Der Status steht als Text
  („Rückfrage offen“, „Beantwortet“, „Geschlossen“), nicht nur als Farbe. Eine geschlossene Rückfrage zeigt
  Schließungshinweis und Zeitpunkt.
- Keine Fachlogik und keine Schreibaktion in dieser Komponente. Kein Import aus `components/workspace/**` oder
  `components/portal/**`.

## CRM-80-T3 — Cockpit

```txt
components/workspace/crm/feedback-rounds/feedback-item-row/feedback-item-row.tsx (+ .module.css)
components/workspace/crm/feedback-rounds/feedback-item-result-select/feedback-item-result-select.tsx   disabled bei offener Rückfrage
components/workspace/crm/feedback-rounds/feedback-clarification-actions/feedback-clarification-actions.tsx   neu (Stellen/Schließen, öffnet FeedbackTextDialog)
components/workspace/crm/feedback-rounds/feedback-clarification-actions/feedback-clarification-actions.module.css neu
components/workspace/crm/feedback-rounds/feedback-clarification-actions/feedback-clarification-actions.test.tsx  neu
components/workspace/crm/feedback-rounds/feedback-result-progress/feedback-result-progress.tsx (+ css)   offene Rückfragen
components/workspace/crm/feedback-rounds/feedback-complete-dialog/feedback-complete-dialog.tsx           gesperrt bei offenen Rückfragen
components/workspace/crm/feedback-rounds/feedback-round-detail/feedback-round-detail.tsx                 Props-Durchreichung
components/workspace/crm/feedback-rounds/feedback-round-status-actions/feedback-round-status-actions.tsx Rückgabe entfernt
apps/workspace/src/i18n/dictionaries/workspace/crm/feedback-rounds/de.json, en.json
```

- **Rückfrage stellen** (Font-Awesome-Icon, z. B. `faCircleQuestion`): Die Aktion steht an jedem bearbeitbaren Punkt
  ohne offene Rückfrage (`editable` wie bisher). `FeedbackTextDialog<FeedbackRoundItemDto>` mit `required`, Texten
  `clarification.ask.*` und einem Hinweis, wenn ein Ergebnis besteht („Das Ergebnis … wird zurückgenommen und bleibt
  im Verlauf“). Die Schnittstelle des Dialogs bleibt generisch; gibt es dort Fehler- oder DTO-Annahmen, die nur für
  Ergebnisse gelten, werden sie über Props gelöst, nicht dupliziert.
- **Offene Rückfrage:** Der Statustext „Rückfrage“ steht im Status-Slot der Zeile. Das Select ist deaktiviert und
  zeigt einen Hinweistext. Der Verlauf erscheint am Punkt, darunter „Rückfrage schließen“ (Dialog mit Pflichthinweis,
  Texte `clarification.close.*`).
- **Fortschritt:** `feedback-result-progress` zählt „{done} von {total} erledigt“ plus „{count} Rückfragen offen“.
  Segmente nutzen `data-state` aus `getFeedbackItemProcessingState`.
- **Abschluss:** Der Dialog sperrt bei offenen Rückfragen mit eigenem Text, sonst wie bisher bei fehlenden
  Ergebnissen. Der Servercode `CLARIFICATIONS_OPEN` wird über `feedbackProcessingError` auf den neuen Schlüssel
  `clarificationsOpen` abgebildet (in `feedback-processing-errors.ts` samt `VALUES` und Dictionary).
- **Fokus und Ansagen:** Nach Stellen oder Schließen bleibt der Fokus am Punkt (Rückfrage-Aktion bzw. Statustext).
  Die Ansage läuft über die bestehende Live-Region (`announcements.clarificationAsked`, `clarificationClosed`).
- **Status-Aktionen:** Das Ziel `open` und sein Dialogzweig (`notice.return`) entfallen. „Gespräch anfordern“
  (`in_discussion`) bleibt.

## CRM-80-T4 — Portal

```txt
components/portal/feedback/feedback-item-list/feedback-item-list.tsx (+ css)          Verlauf, Antwortformular, Anker
components/portal/feedback/feedback-clarification-answer/feedback-clarification-answer.tsx         neu
components/portal/feedback/feedback-clarification-answer/feedback-clarification-answer.module.css  neu
components/portal/feedback/feedback-clarification-answer/feedback-clarification-answer.test.tsx    neu
components/portal/feedback/feedback-clarification-notice/feedback-clarification-notice.tsx         neu (Anzahl + Sprungliste)
components/portal/feedback/feedback-clarification-notice/feedback-clarification-notice.module.css  neu
components/portal/feedback/feedback-round-step/feedback-round-step.tsx                 reicht Antwort-Kontext durch
components/portal/feedback/feedback-reader/feedback-reader.tsx                         reicht canSubmit, customerId, onAnnounceAction durch
components/portal/feedback/feedback-page-view/feedback-page-view.test.tsx              Leser mit/ohne Antwortrecht
apps/workspace/src/hooks/portal/use-feedback-clarification-answers.ts                  neu (+ .test.ts)
apps/workspace/src/common/patterns/portal/can-answer-feedback-clarification.ts         neu (+ .test.ts)
apps/workspace/src/i18n/dictionaries/portal/feedback/de.json, en.json                  Du-Form
apps/workspace/src/components/portal/AGENTS.md                                         Abschnitt Feedbackbogen ergänzen
```

- **Hinweis über der Punktliste:** Er erscheint nur, wenn die angezeigte Runde offene Rückfragen hat. Text etwa „Wir
  haben {count} Rückfrage(n) an dich“ (`formatCountMessage`), dazu Links „Punkt {n}“ auf `#feedback-item-{itemId}`.
  Ein Klick setzt den Fokus auf die Punktüberschrift (stabile ID je Punkt-ID, `tabIndex={-1}`), ohne Umsortierung.
  Der bestehende Rundenhinweis (`feedback-round-notice`, inkl. `states.returned` für Altfälle) bleibt unverändert.
- **Punkt:** Unter dem Inhalt steht der gemeinsame Verlauf. An der offenen Rückfrage hängt das Antwortformular, wenn
  `canAnswerFeedbackClarification` wahr ist. Ein Kontakt ohne Schreibrecht und die Owner-Ansicht sehen den Verlauf
  ohne Formular. Ergebnisse erscheinen weiter erst nach Abschluss (Server-DTO, unverändert).
- **Antwortformular:** Textarea mit `FormField` aus `@invessiv/ui`. Grenze `FEEDBACK_LIMITS.noteMaxLength` mit
  Zähler, Trim-Pflicht, Fehler `role="alert"`, Senden-Button mit Busy-Zustand. Keine Anhänge.
- **Hook `useFeedbackClarificationAnswers(customerId, round)`:** Er hält die Entwürfe als `Map<itemId, { text,
commandId }>`, getrennt nach Kunde und Runde.
  - Ein Refresh oder Konflikt an einem Punkt verwirft keine Entwürfe an anderen Punkten.
  - Nach Erfolg übernimmt er den Punkt aus der Antwort sofort, leert nur diesen Entwurf und ruft `router.refresh()`.
  - Bei Versionskonflikt bleibt der Text erhalten und eine neue Kennung entsteht.
  - Bei `clarification_not_open` bleibt der Text erhalten, das Absenden ist gesperrt und der aktuelle Verlauf wird
    angezeigt. Die Antwort wird nie einer neueren Frage zugeordnet.
- **Ansage** über die bestehende Live-Region der `feedback-page-view` (`announcements.clarificationAnswered`).
  Danach bleibt der Fokus am Punkt.
- **Texte (DE/EN, Du-Form, `copywriting`):** `clarifications.{notice, jumpTo, thread.*, answer.label, answer.hint,
answer.submit, answer.submitting, answer.required, answer.tooLong, answer.conflict, answer.notOpen}`,
  `errors.clarificationNotOpen`, `errors.commandIdReused`, `announcements.clarificationAnswered`.

## CRM-80-T5 — Globale Rückgabe entfernen, Bestand erhalten

```txt
packages/common/src/constants/crm/feedback-round-transitions.ts       − submitted→open, − in_discussion→open (internal)
packages/common/src/constants/crm/feedback-round-statuses.ts          INTERNAL_FEEDBACK_ROUND_TARGET_STATUS_VALUES ohne Open
packages/common/src/constants/crm/feedback-constants.test.ts          angepasst
packages/common/src/patterns/crm/feedback-round-state.test.ts         neue Übergangstabelle
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-schemas.ts   to: open nur noch als Kompatibilitätszweig
apps/workspace/src/server/workspace/crm/command-handler/change-feedback-round-status.command-handler.ts   case Open entfernt
apps/workspace/src/server/shared/services/feedback/feedback-round-write-service.ts     returnToCustomer entfernt
apps/workspace/src/server/shared/services/feedback/feedback-round-task-service.ts      cancelForReturn entfernt, falls ungenutzt
apps/workspace/src/server/shared/AGENTS.md                                             Rückgabe-Absätze auf Bestandsfall umschreiben
apps/workspace/src/i18n/dictionaries/workspace/crm/feedback-rounds/de.json, en.json    actions.open, notice.return entfernen
apps/workspace/src/server/tests/shared/services/feedback/feedback-services.integration.test.ts   returnToCustomer-Fälle → Bestandsfall
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-round-detail/feedback-round-detail.test.tsx  Rückgabe-Fälle ersetzt
```

**Bleibt bestehen:**

- der Rundenstatus `open`, die `customer_notice`-Anzeige im Cockpit und im Portal (`states.returned`) und
  `FeedbackRoundReturned` samt Chatübersetzungen in beiden Message-Dictionaries;
- der Legacy-Reset in `feedbackRoundItemService.updateItem` (seit Task 78 historisiert);
- das erneute Einreichen einer bereits zurückgegebenen Runde.

Vor dem Entfernen per Grep prüfen, dass kein weiterer Aufrufer existiert: `returnToCustomer`, `cancelForReturn`,
`notice.return`, `actions.open`. Ein Test belegt, dass `to: open` aus `submitted` oder `in_discussion` jetzt
`INVALID_TRANSITION` liefert.

## CRM-80-T6 — E2E und Dokumentation

```txt
apps/workspace/e2e/portal-feedback.e2e.ts
apps/workspace/plans/crm/00-entscheidungen.md            Abschnitt „Feedbackrunden“
apps/workspace/plans/crm/core-features.md                Feedbackrunden
apps/workspace/plans/crm/28-feedback-rueckfragen/README.md   Status, Teilschritte, Checkliste
```

- **E2E:** Der Test „processes round 1, hands over round 2, takes it back and approves after it“ nutzt heute „Zurück
  an den Kunden“ (Zeilen ≈ 330–340). Er wird auf Rückfragen umgestellt und bekommt einen neuen Namen. Der Kernablauf
  aus README §5 kommt als eigener Test dazu: **Frage stellen (Cockpit) → beantworten (Portal, Manager-Session) →
  Ergebnis setzen → „Noch offen“ → erneut setzen → Runde abschließen**. Der Test prüft außerdem, dass der Kunde vor
  dem Abschluss kein Ergebnis sieht und dass der Hinweis zur offenen Rückfrage zum Punkt springt.
  Aufruf: `pnpm --filter @invessiv/workspace test:e2e:portal` (Blob-/Auth-Voraussetzungen wie in `e2e/run-portal-e2e.mjs`).
- **`00-entscheidungen.md`:** Der Satz „Das Team kann eine Runde aus `submitted`/`in_discussion` mit Hinweis an den
  Kunden zurückgeben“ wird ersetzt durch Rückfragen pro Punkt mit folgenden Eckpunkten:
  - sofort sichtbar, Antwort ohne erneutes Einreichen, höchstens eine offene Rückfrage je Punkt;
  - Abschluss erst ohne offene Rückfragen;
  - „Noch offen“ jederzeit wählbar, interne Ergebnishistorie.
    Dazu kommt ein Verweis auf diesen Ordner. „Gespräch anfordern“ bleibt.
- **`core-features.md`:** wird entsprechend ergänzt.
- **README:** Status auf `im Review`. Die Checkliste §8.3 wird mit dem tatsächlichen Stand abgeglichen.

## Tests

- **UI Cockpit:**
  - „Rückfrage stellen“ auch bei bewertetem Punkt (Hinweis sichtbar), Select gesperrt bei offener Rückfrage;
  - Schließen nur mit Hinweis, Verlauf mit mehreren Einträgen, Fortschritt und Abschlussdialog mit offenen Rückfragen;
  - kein Button „Zurück an den Kunden“ mehr.
- **UI Portal:**
  - Formular in `submitted`, `in_discussion` und `in_progress`; kein Formular ohne Schreibrecht, in der Owner-Ansicht
    und nach dem Abschluss;
  - leere und zu lange Eingabe, Versionskonflikt mit erhaltenem Text, `not_open` mit gesperrtem Absenden;
  - Entwürfe an zwei Punkten bleiben nach einer Antwort erhalten;
  - Hinweis mit Anzahl und Sprung inkl. Fokus, Ansage in der Live-Region, geschlossene Rückfrage ohne Formular.
- **Patterns:** `canAnswerFeedbackClarification` und Endpoint-Builder.
- **Bestand:** Eine zurückgegebene Altrunde (Fixture mit `customer_notice`) ist im Portal bearbeitbar und lässt sich
  erneut einreichen; historische Chatmeldung `feedbackRoundReturned` wird weiter übersetzt angezeigt.
- **E2E** wie oben.

## Abnahme

- [ ] Kernablauf aus README §5 per E2E grün. Wird der Lauf blockiert (z. B. Blob-OIDC), steht das im PR, und der
      Ablauf wird manuell geprüft.
- [ ] Keine vorzeitige Veröffentlichung interner Ergebnisse oder der Historie (Portal-Read, Portal-Antwort,
      Portal-Konflikt).
- [ ] Abschluss bei offenen Punkten oder Rückfragen gesperrt; andere Punkte bleiben bearbeitbar.
- [ ] A11y-Smoke: Tastaturbedienung von Dialogen, Disclosure, Sprunglinks und Antwortformular. Fokus bleibt am
      betroffenen Punkt. Status steht als Text. Sichtbarer Fokus überall.
- [ ] Beide Themes, mobile und Desktop, im Cockpit und im Portal geprüft.
- [ ] Keine toten Buttons, keine verwaisten Rückgabe-Bausteine. Historische Leser und Übersetzungen bleiben erhalten.
- [ ] `00-entscheidungen.md`, `core-features.md`, die Scope-`AGENTS.md` und die README sind synchron.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`, `pnpm --filter @invessiv/workspace build` grün.
- [ ] Der PR dokumentiert Migrationen (aus 78/79), Security/Privacy, Monitoring, Rollback (README §8.2) und
      Screenshots.
