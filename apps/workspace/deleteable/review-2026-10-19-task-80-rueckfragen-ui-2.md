# Review 2 – Task 80: Rückfragen-UI und Ablösung der globalen Rückgabe

Stand: 19.10.2026, Branch `feat/crm-feedback-rueckfragen`, HEAD `2618fba4`. Geprüft wurden alle lokalen Änderungen
gegenüber HEAD (56 geänderte, 24 neue Dateien/Ordner), Plan `plans/crm/28-feedback-rueckfragen/80-rueckfragen-ui-und-abloesung.md`.
Der erste Review (`review-2026-10-19-task-80-rueckfragen-ui.md`, F01/F02) ist laut Nachtrag behoben; die Behebung wurde hier
im Code nachvollzogen (Konflikt mit erledigter Frage → gesperrter Entwurf, Textarea während des Sendens schreibgeschützt)
und nicht erneut gemeldet.

**Gesamturteil:** Kein P0/P1/P2. Die Ablösung der globalen Rückgabe ist sauber (Übergänge, Write-/Task-Service, Dialogzweig,
Texte entfernt; Kompatibilitätszweig im Schema dokumentiert und getestet). Die Schichten passen zum Repo: Endpoint-Builder,
Client-Services, Contracts/Konstanten in `common`, gemeinsamer Verlauf unter `components/shared` ohne Portal-/Cockpit-Import,
Zählung über eine Zustandsableitung. Die Findings betreffen Zustandsabgleich im Portal, zwei fragile Stellen im Cockpit,
ein Logik-Duplikat sowie Kleinteile in Code und Copy.

## Findings

### F01 · P3 · Portal-Hinweis und Status rufen zum Antworten auf, auch wenn niemand antworten darf

- **Fundstelle:** `apps/workspace/src/components/portal/feedback/feedback-round-step/feedback-round-step.tsx:80` (Notice ohne `canSubmit`-Bezug);
  Texte `apps/workspace/src/i18n/dictionaries/portal/feedback/de.json:129` (`noticeHint`), `:137` (`thread.statusOpen`), EN analog.
- **Problem und Auswirkung:** Ein Kontakt ohne `portal.feedback.submit` und die Owner-Ansicht sehen „Wir haben eine Rückfrage an dich –
  Antworte direkt am Punkt“ samt Sprunglinks und am Punkt „Wartet auf deine Antwort“, finden dort aber kein Formular. Das ist der im
  Plan ausdrücklich vorgesehene Fall „Verlauf ohne Formular“; die Texte versprechen eine Aktion, die es für diese Betrachter nicht gibt.
- **Empfehlung:** `canSubmit` an `FeedbackClarificationNotice` durchreichen und für Nicht-Antwortende einen neutralen Hinweis/Status
  (z. B. „Rückfrage offen“) wählen; DE/EN parallel, Skill `copywriting`.

### F02 · P3 · Hinweis über der Liste und Punktliste lesen unterschiedliche Stände

- **Fundstelle:** `feedback-round-step.tsx:57` (`questioned` aus `round.items`) gegenüber
  `apps/workspace/src/components/portal/feedback/feedback-item-list/feedback-item-list.tsx:78` (`answers.itemFor`);
  `apps/workspace/src/hooks/portal/use-feedback-clarification-answers.ts:157` (Konfliktzweig ohne `router.refresh()`).
- **Problem und Auswirkung:** Bei `VERSION_CONFLICT` oder `clarification_not_open` mit `current` übernimmt der Hook den Punkt nur lokal
  und lädt die Seite nicht neu. Ist die Frage inzwischen erledigt, zeigt der Punkt „Beantwortet/Geschlossen“, der Hinweis darüber zählt
  sie aber weiter als offen und verlinkt auf einen Punkt ohne Formular – bis zum nächsten Refresh.
- **Empfehlung:** Entweder in beiden Konfliktzweigen zusätzlich `router.refresh()` auslösen (wie im `not_open`-Zweig ohne `current`)
  oder den Hook eine Ebene höher (Round-Step) halten und Hinweis wie Liste aus `itemFor` speisen.

### F03 · P3 · Verwaiste Entwürfe: gleicher Name wie das aktive Feld, nicht entfernbar, auch leer

- **Fundstelle:** `feedback-item-list.tsx:150` (Rendering von `staleDraftsOf` außerhalb des Verlaufs mit No-op-Handlern);
  `use-feedback-clarification-answers.ts:69` (`staleDraftsOf`), `:83` (`change` legt auch für leeren Text einen Entwurf an).
- **Problem und Auswirkung:** Wird nach einer erledigten Frage eine neue gestellt, stehen am Punkt zwei Textfelder mit identischem
  Namen „Deine Antwort auf Punkt N“ – eines bearbeitbar, eines schreibgeschützt. Für Screenreader sind sie nicht unterscheidbar
  (WCAG 2.4.6/1.3.1). Der alte Entwurf lässt sich nicht verwerfen und bleibt bis zum Verlassen der Seite. Hat der Kunde nur getippt
  und wieder gelöscht oder leer abgeschickt, erscheint ein leeres gesperrtes Feld mit Fehlermeldung.
- **Empfehlung:** Leere Entwürfe nicht als verwaist führen. Verwaiste Entwürfe mit eigenem Label (Bezug auf die frühere Frage) und einer
  Aktion „Entwurf verwerfen“ zeigen. Alternativ im Verlauf beim zugehörigen erledigten Eintrag einhängen (Slot je `clarificationId`
  statt nur für die offene Frage).

### F04 · P3 · Hook mischt Entwurf, Request-Zustand und Sperre in einem Feld

- **Fundstelle:** `apps/workspace/src/common/contracts/portal/feedback-answer-draft.ts:5`; `use-feedback-clarification-answers.ts:42`,
  `:80`, `:86`, `:116`; `feedback-clarification-answer.tsx:66`.
- **Problem und Auswirkung:** `problem === NotOpen` ist zugleich Fehlermeldung und Sperrflag (an drei Stellen abgefragt), und
  `staleDraftsOf` überschreibt `problem` beim Lesen. Wer später etwa ein Verwerfen (F03) oder einen weiteren Fehlerfall ergänzt,
  muss diese implizite Kopplung kennen. Zusätzlich nimmt der Hook `round: Pick<PortalFeedbackRoundDto, "id">`, nutzt aber nur die ID.
- **Empfehlung:** Sperre als eigenen, abgeleiteten Zustand führen (z. B. `locked: boolean` oder `answerable` aus Hook-Rückgabe), Problem
  nur für die Meldung; Parameter `roundId: string`. Kein neues Verhalten nötig.

### F05 · P3 · Rückfrage-Dialog hängt an Live-Props statt an der beim Öffnen gewählten Frage

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-clarification-actions/feedback-clarification-actions.tsx:45`
  (`open` aus `item`), `:83` und `:104` (Dialogwahl `dialogOpen && open` / `dialogOpen && !open`), `:92` (`open.id` im `send`).
- **Problem und Auswirkung:** Welcher Dialog offen ist und welche Frage geschlossen wird, wird bei jedem Render aus dem aktuellen
  `item` abgeleitet. Ändert sich das Prop, während ein Dialog offen ist (Refresh durch andere Aktion, künftiges Polling), wechselt der
  Dialog stillschweigend von „Schließen“ zu „Stellen“ und der getippte Text geht verloren. Nach einem 409 nutzt `send` zwar die neue
  Version aus `current`, schließt aber weiter die alte Frage-ID aus den Props; ist sie inzwischen beantwortet, folgt ein zweiter
  Fehlversuch mit „changed“.
- **Empfehlung:** Beim Öffnen Modus und `clarificationId` in den State legen (`{ mode: "ask" } | { mode: "close", clarificationId }`)
  und die offene Frage im `send` aus `current` bestimmen; bei fehlender offener Frage ohne Request mit „changed“ antworten.

### F06 · P3 · Fokus-Rückgabe über hochgezogenen Versions-State und Remount ist schwer nachvollziehbar

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-item-row/feedback-item-row.tsx:78`, `:133`, `:180`, `:261`;
  `feedback-clarification-actions.tsx:50`.
- **Problem und Auswirkung:** Dasselbe Element `clarificationActions` wird je nach Zustand an zwei Baumpositionen gerendert (Slot im
  Verlauf bzw. unter der Antwort). Beim Wechsel wird die Komponente neu gemountet; damit der Fokus trotzdem folgt, liegt
  `focusAfterVersion` in der Zeile und ein Effekt in der Kindkomponente fokussiert, sobald eine höhere Version ankommt. Kommt der
  Refresh nicht an, bleibt die Anforderung stehen und greift bei einer späteren, fremden Versionserhöhung – der Fokus springt dann
  unerwartet. Der Zusammenhang erschließt sich nur über drei Stellen.
- **Empfehlung:** Mechanismus in einen kleinen Hook (`hooks/workspace/…`) mit kurzem Kommentar zum Remount kapseln und die
  Anforderung beim Unmount/nach dem nächsten Render verwerfen; alternativ die Aktion an stabiler Position rendern, sodass kein Remount
  nötig ist.

### F07 · P3 · „Offene Rückfrage am Punkt finden“ steht sechsmal im Code

- **Fundstelle:** `packages/common/src/patterns/crm/feedback-item-processing-state.ts:8`, `feedback-item-list.tsx:80`,
  `feedback-round-step.tsx:58`, `feedback-clarification-actions.tsx:45`,
  `apps/workspace/src/components/shared/feedback/feedback-clarification-thread/feedback-clarification-thread.tsx:85`,
  `use-feedback-clarification-answers.ts:16`.
- **Problem und Auswirkung:** Root-`AGENTS.md`, „Keine Logik-Duplikate“. Dieselbe Bedingung `status === Open` über
  `clarifications` ist mehrfach kopiert; Round-Step zählt sogar am Status vorbei, obwohl laut Plan alle Zählungen aus
  `getFeedbackItemProcessingState` kommen sollen.
- **Empfehlung:** `findOpenFeedbackClarification(item)` (bzw. `(clarifications)`) in `packages/common/src/patterns/crm/` neben
  `getFeedbackItemProcessingState` anlegen und dort selbst verwenden; Round-Step über den Processing-State filtern.

### F08 · P3 · Kleinteile: tote Attribute, veraltete Doku, Komponentenname

- **Fundstelle:** `apps/workspace/src/components/portal/feedback/feedback-clarification-answer/feedback-clarification-answer.tsx:61`
  (`formId` ohne Referenz), `:83` (`data-blocked` ohne CSS/Test-Nutzung); `feedback-item-list.tsx:38` (Doc: „can no longer be
  edited“, jetzt mit Antwortformular); `feedback-result-progress` zeigt jetzt den Bearbeitungsstand, Name und Prop `items` sprechen
  noch von Ergebnissen.
- **Problem und Auswirkung:** Kein Fehlverhalten, aber Lesende suchen Verwendungen, die es nicht gibt, bzw. lesen eine überholte
  Beschreibung.
- **Empfehlung:** `formId`/`data-blocked` entfernen (oder `data-blocked` im CSS nutzen), Docstring anpassen; Umbenennung der
  Fortschrittskomponente optional beim nächsten Anfassen.

### F09 · P3 · Copy im Portal-Verlauf uneinheitlich

- **Fundstelle:** `apps/workspace/src/i18n/dictionaries/portal/feedback/de.json:135` (`thread.customer: "Eure Antwort"`) mit
  `byline: "{name} am {date}"`; `:129` und `:145` (gleicher Satz „Die Runde musst du dafür nicht neu einreichen.“ in Hinweis und Feldhinweis).
- **Problem und Auswirkung:** Die Byline ergibt „Eure Antwort am 12.10.2026“ neben „Unser Team am …“ – Rolle vs. Text, dazu „eure“
  neben „deine“ im Feldlabel. Der doppelte Satz steht auf derselben Seite direkt untereinander, sobald das Formular sichtbar ist.
- **Empfehlung:** Rollenlabel als Person formulieren („Du“ bzw. „Ihr“, EN „You“) und den Satz nur an einer Stelle führen;
  Skill `copywriting`, Du-Form beibehalten.

## Architektur und Struktur

- **Ablage:** Neue Konstanten (`FeedbackClarificationPart`, `FEEDBACK_CLARIFICATION_STATUS_BADGES`, `FeedbackAnswerProblem`), Contracts
  (`FeedbackAnswerDraft`, `PortalFeedbackItemClientResult`, `FeedbackProcessingSummary`, Labels-Typ, `FeedbackProgressDictionary`) und
  Patterns liegen regelkonform in `apps/workspace/src/common`, jeweils mit Test. Hook ohne exportierte Typen. Badge-Map folgt dem
  bestehenden Muster `feedback-item-result-badges.ts`.
- **Schnitt:** `FeedbackTextDialog` bleibt generisch (Hinweis und `commandId` über Props), `mutateItem` verhindert drei Kopien im
  CRM-Client; der Portal-Client liest einen Punkt mit eigenem `isItem`. Kompatibilitätszweig `to: open` ist im Schema, im Handler-Typ
  (`Exclude`) und in Tests konsistent.
- **Server:** `returnToCustomer`/`cancelForReturn` ohne verbliebene Aufrufer entfernt; Legacy-Zustand wird in Tests über
  `returnRoundAsLegacy` hergestellt. Antwort-Route liefert `current` bei `CLARIFICATION_NOT_OPEN` nur mit Leserecht – passend zur
  Client-Annahme `item: null`.
- **Dictionaries:** DE/EN schlüsselgleich (per Skript geprüft); `actions.open`/`notice.return` entfernt, `states.returned` und
  Chat-Übersetzungen bleiben.

## Prüfungen

- `vitest run` über Hook, Portal-Feedback-Komponenten, gemeinsamen Verlauf, CRM-Feedback-Komponenten, `common/patterns`,
  `common/constants/feedback|portal`: **126 Dateien / 618 Tests grün**.
- `packages/common`: `feedback-round-state.test.ts`, `feedback-constants.test.ts`: **117 Tests grün**;
  `feedback-round-schemas.test.ts`: **12 Tests grün**.
- DE/EN-Schlüsselabgleich der beiden geänderten Dictionaries: keine Abweichung.
- Nicht ausgeführt: Lint, Typecheck, Build, DB-Integration/`db:smoke:crm`, E2E (Angaben im Plan stammen aus der Umsetzung).
  Keine Codeänderungen.

## Offene Fragen und Lücken

- Erfolg ohne Leserecht (`item: null`): Der Entwurf wird geleert, das Formular der weiter offen angezeigten Frage steht bis zum
  Refresh leer da; ein zweites Absenden endet in `not_open`. Praktisch nur mit reinem Schreibrecht ohne Lesen – ob diese Kombination
  vorkommt, wurde nicht geprüft.
- E2E-Kernablauf enthält eine Screenshot-Schleife über Themes/Breiten (nur Overflow wird geprüft). Bewusst für die Sichtprüfung;
  bei längerer Laufzeit in einen eigenen visuellen Test auslagern.
- Integrationstests der Task-79-Server-Handler wurden nur über ihre Änderungen und Querverweise geprüft, nicht erneut vollständig.
- Manuelle Sichtprüfung und Tastatur-Smoke stehen laut Plan aus.

## Vorschläge zur Skill-Verbesserung

Ein wiederkehrendes Muster: UI-Zustand (Dialogmodus, Zielobjekt) wird bei jedem Render aus Live-Props abgeleitet statt beim
Öffnen festgehalten (F05). Vorschlag für „Verhalten und Logikfehler“:

> „Dialoge und Formulare, die auf ein bestimmtes Objekt zielen (Frage, Eintrag, Version), auf festgehaltenes Ziel beim Öffnen
> prüfen: Wechselt Modus oder Ziel, wenn sich Props während des offenen Dialogs ändern?“

Vom Nutzer am 19.10.2026 bestätigt und in die Claude- und Codex-Fassung des Skills übernommen (Abschnitt „Verhalten und Logikfehler“).

## Behebung nach Review (19.10.2026)

Auf Nutzerauftrag umgesetzt, dazu eine Layoutänderung im Portal:

- **F01:** Der Round-Step berechnet `canAnswer` einmal je Runde und gibt es an Hinweis und Liste. Wer nicht antworten
  kann, liest `noticeHintReadOnly` und den neutralen Status „Rückfrage offen“; nur Antwortberechtigte sehen
  „Wartet auf deine Antwort“ (`clarifications.statusWaiting`).
- **F02:** Der Hook ruft auch nach Konflikt und `not_open` mit aktuellem Punkt `router.refresh()`.
- **F03/F04:** `FeedbackAnswerDraft.locked` ist das Sperrflag (Helfer `locked()` im Hook); leere Entwürfe gelten nicht
  als verwaist. Gesperrte Entwürfe tragen ein eigenes Label („Nicht gesendete Antwort auf eine frühere Rückfrage zu
  Punkt n“) und „Entwurf verwerfen“ (`discard`). Der Hook nimmt `roundId: string`.
- **F05:** `feedback-clarification-actions` hält beim Öffnen fest, ob gefragt oder welche Frage geschlossen wird, und
  prüft im `send` den `current`-Stand; zeigt der Konflikt die Frage erledigt, geht kein zweiter Request raus.
- **F06:** Fokus-Rückgabe über den neuen Hook `useFocusAfterVersion` (`hooks/shared/`, mit Test); `focusAfterVersion`
  und der Effekt in der Kindkomponente sind entfernt.
- **F07:** `findOpenFeedbackClarification` in `packages/common/src/patterns/crm/` (mit Test), genutzt von
  Processing-State, Verlauf, Portal-Liste, Round-Step, Hook und Cockpit-Aktionen.
- **F08:** `formId` und `data-blocked` entfernt, Docstring der Liste angepasst. Die Umbenennung von
  `feedback-result-progress` ist bewusst nicht umgesetzt (optional, berührt Plan-Dokumente).
- **F09:** Rollenlabel „Euer Team“/„Your team“, Feldhinweis ohne den doppelten Satz. Zusätzlich EN-Texte der
  Rückfragen von „item“ auf „point“ umgestellt, wie im übrigen Portal-Feedback.
- **Layout:** Punkte mit Rückfragen stellen Verlauf und Antwortformular ab 44rem Kartenbreite (Container Query)
  rechts neben den Punkt; schmaler darunter. Unser Ergebnis schließt die Karte über die volle Breite.
- Scope-`AGENTS.md` (Portal, CRM-UI) nachgezogen. Skill-Regel nach Zustimmung ergänzt.
- **E2E ergänzt:** Der Kernablauf schließt jetzt eine zweite Rückfrage mit Pflichthinweis (leerer Hinweis abgelehnt,
  Fokus auf „Rückfrage stellen“, Ergebnis wieder wählbar) und prüft im Portal Status „Geschlossen“, den Hinweis,
  „Frühere Rückfragen (1)“ und kein Antwortfeld. Lauf grün (5/5). Beobachtung: Der Test „processes round 1 …“ schlug
  in zwei von fünf Läufen bei „1 von 2 Punkten erledigt“ fehl (PATCH 200, Refresh kam an, Zeile blieb im
  Pending-Zustand); der Schritt ist unverändert seit Task 78, Ursache nicht geklärt.
