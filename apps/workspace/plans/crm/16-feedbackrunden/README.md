# Ordner 16 — Feedbackrunden

> **Status:** offen · **Abhängigkeiten:** 07, 08, 13, 13a, 14 (14.2 und 14.5 gemerged) · **Aufwand:** 13–16 Tage
> gesamt · **Reviewziel:** sechs Teil-PRs mit je 30–95 Dateien

> **Neuzuschnitt 29.09.2026 (mit dem Owner abgestimmt):** Ersetzt die bisherigen Task-Pläne 22
> (`22-portal-upload-feedback.md`) und 23 (`23-feedbackrunden-im-crm.md`) vollständig. Das frühere Modell (Runde
> entsteht beim Absenden, Entwurf nur im `localStorage`, Upload-Session, Zusatzrunden-Anfrage, ein Freitext mit
> 20.000 Zeichen) gilt nicht mehr. Abweichungen stehen in Abschnitt „Geänderte Entscheidungen“.

> **Portal-Fundament:** Seiten über `requirePortalActor(locale, customerId)` bzw. `requirePortalReader`, Endpunkte über
> `withPortalActor` bzw. `withPortalReader`, jede Portal-Query über `portalAccessCondition`, jede Portal-Mutation über
> `portalCanOn` (Task 49, `apps/workspace/src/server/portal/shared/`). Eigene Portal-Permissions dieses Ordners, in
> `portal_standard` ergänzt: `portal.feedback.read` (Runden, Punkte, Ergebnisse lesen) und `portal.feedback.submit`
> (Entwurf speichern, Dateien an Punkte hängen, einreichen, freigeben/abnehmen). Kein eigener Navigationseintrag;
> Einstieg über das Dashboard-Widget `feedback` und die Projektkarte.

## Bewusste Ausnahme: ein Ordner, sechs Merge-Einheiten

Die Regel „ein Ordner = ein PR“ (`plans/crm/AGENTS.md`) gilt hier **nicht**. Wie bei `14-dateien` liegt der gesamte
Feedbackbereich in einem Ordner, wird aber in sechs Teil-PRs geliefert. Jede Teil-Einheit hat einen eigenen Branch,
einen eigenen PR, einen eigenen Status in der Tabelle unten und hält `master` deploybar. Reine Fundamente bleiben
unsichtbar; sichtbare Funktionen werden vertikal vollständig geliefert.

| PR   | Task | Branch                                | Datei                                                                            | Nach Merge sichtbar                                                                     | Dateien | Umsetzung       | Status |
| ---- | ---- | ------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------: | --------------- | ------ |
| 16.1 | 57   | `feat/crm-feedback-1-prozessblock`    | [`57-feedbackblock-und-kontingent.md`](./57-feedbackblock-und-kontingent.md)     | Feedbackblock im Projekt-Editor, in CRM- und Portal-Leiste; Kontingent pflegbar         |   40–55 | Claude · max    | offen  |
| 16.2 | 58   | `feat/crm-feedback-2-datenmodell`     | [`58-datenmodell-und-fundament.md`](./58-datenmodell-und-fundament.md)           | nichts                                                                                  |   45–65 | GPT · max       | offen  |
| 16.3 | 59   | `feat/crm-feedback-3-api`             | [`59-server-api-uebergabe-und-bogen.md`](./59-server-api-uebergabe-und-bogen.md) | nichts (API ohne Aufrufer)                                                              |   60–80 | GPT · max       | offen  |
| 16.4 | 60   | `feat/crm-feedback-4-uebergabe-bogen` | [`60-ui-uebergabe-und-kundenbogen.md`](./60-ui-uebergabe-und-kundenbogen.md)     | Intern: Runde übergeben, Runde lesen. Portal: Feedbackbogen, Widget, aktive Leiste      |   70–95 | Claude · max    | offen  |
| 16.5 | 61   | `feat/crm-feedback-5-bearbeitung`     | [`61-bearbeitung-ergebnisse-abnahme.md`](./61-bearbeitung-ergebnisse-abnahme.md) | Intern: Gespräch, Umsetzung, Zurück, Ergebnisse, Abschluss. Portal: Ergebnisse, Abnahme |   70–90 | Claude · max    | offen  |
| 16.6 | 62   | `feat/crm-feedback-6-eingang`         | [`62-eingang-und-zaehler.md`](./62-eingang-und-zaehler.md)                       | Interner Feedback-Eingang mit Sidebar-Zähler                                            |   30–45 | Claude · mittel | offen  |

**Umsetzung (Modell · Variante):** Empfehlung wie in `14-dateien`: GPT für Migrationen mit vielen Constraints,
Nebenläufigkeit und Autorisierungs-Negativtests; Claude für UI, Copy (`frontend-design`, `copywriting`) und
querschnittliche Refactorings. Review jeder Teil-PR durch das jeweils **andere** Modell.

**Reihenfolge ist zwingend:** 16.1 → 16.2 → 16.3 → 16.4 → 16.5 → 16.6. Jede Einheit setzt die vorherige als gemerged
voraus.

### Bewusster Zwischenstand nach 16.4

Nach 16.4 kann ein Kunde eine Runde einreichen, die interne Weiterbearbeitung (Gespräch, Umsetzung, Abschluss) kommt
erst mit 16.5. Eine eingereichte Runde bleibt bis dahin auf `submitted`: intern vollständig lesbar, die Sammelaufgabe
existiert, kein toter Button. Das ist vertretbar, weil zum Zeitpunkt der Planung (29.09.2026) **noch keine Kunden ins
Portal eingeladen** sind (Rollout-Gate). Werden vor dem Merge von 16.4 Kunden eingeladen, werden 16.4 und 16.5
gemeinsam gemergt.

## Ziel und Stand nach Abschluss

Der Ablauf bildet den echten Review-Rhythmus ab:

1. Wir bauen einen Stand und **übergeben Feedbackrunde n** an den Kunden: Vorschau-Link, kurze Notiz „Was ist neu“,
   optional eine Frist.
2. Der Kunde sammelt **Feedback-Punkte** (Bereich, optional Art, Text, Dateien) und speichert beliebig oft zwischen,
   auch über mehrere Tage, Geräte und Kontakte.
3. Der Kunde **reicht ein** („fertig“). Die Runde ist ab dann gesperrt; intern entsteht automatisch eine Sammelaufgabe.
4. Üblicherweise folgt eine **Abstimmung** (Call). Sie ist überspringbar; umgekehrt können wir mit ihr auch ein
   Gespräch anfordern.
5. Wir **setzen um** und vergeben je Punkt ein **Ergebnis** (umgesetzt / nicht umgesetzt / Zusatzleistung, die
   letzten beiden mit Antwort an den Kunden).
6. Wir **schließen ab**. Ist Kontingent übrig, übergeben wir direkt Runde n+1. Nach der letzten Runde **nimmt der
   Kunde ab** (Freigabe mit Bestätigung); das Projekt ist launchbereit.
7. In jeder offenen Runde kann der Kunde stattdessen **ohne Änderungen freigeben** — das ist dieselbe Abnahme; die
   restlichen Runden verfallen.

Kunde und Team sehen jederzeit, wie viele Runden enthalten, verbraucht und offen sind und wer am Zug ist — im
Portal-Widget, auf der Feedbackseite, in der Projektansicht und als **Feedbackblock** in der Prozessleiste.

## Getroffene Entscheidungen

### Rundenmodell

| Bereich                | Entscheidung                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wer erzeugt eine Runde | **Wir**, durch „Runde übergeben“. Nicht der Kunde beim Absenden                                                                                                                                      |
| Warum                  | Die Runde beschreibt, worauf sich das Feedback bezieht (Vorschau, Neuigkeiten). Ohne diesen Bezug weiß in Runde 2 niemand, welchen Stand Punkt 3 meinte                                              |
| Scope                  | Eine Runde gehört genau einem Projekt; `project_id` Pflicht, `customer_id` denormalisiert und per zusammengesetztem FK an das Projekt gebunden                                                       |
| Rundennummer           | Fortlaufend je Projekt ab 1, serverseitig vergeben, lückenlos                                                                                                                                        |
| Aktive Runde           | Höchstens eine Runde je Projekt in `open`, `submitted`, `in_discussion` oder `in_progress` (partieller Unique-Index)                                                                                 |
| Kontingent             | `projects.included_feedback_rounds` (existiert, 1–20, Default 2), ab 16.1 intern pflegbar (Zahlenfeld in der Blockzeile). Invariante: Kontingent ≥ höchste vergebene Rundennummer                    |
| Frühes Feedback        | Die Ausnahme (z. B. auf das Design) ist eine normale Runde und zählt ins Kontingent. Der Feedbackblock wird dafür in der Leiste nach vorn geschoben                                                  |
| Phase                  | Runden hängen **nicht** an `projects.phase`. Übergabe, Abschluss und Abnahme ändern die Phase nie                                                                                                    |
| Zusatzrunden           | Nicht in diesem Ordner. Später bucht der Kunde sie über 13c (Leistungsanfragen); bis dahin erhöht das Team das Kontingent intern. Das Portal nennt keinen Preis                                      |
| Übergabe erlaubt       | Projektstatus `active` **und** Feedbackblock vorhanden **und** Projekt steht am Feedbackschritt (siehe „Feedbackblock“) **und** keine aktive Runde **und** keine Abnahme **und** Nummer ≤ Kontingent |
| Abnahme                | Genau eine Runde je Projekt kann `approved` sein (partieller Unique-Index). Endgültig; **keine Rücknahme in v1**                                                                                     |
| Bestätigung Abnahme    | Vor Freigabe/Abnahme zwingend ein Dialog mit Checkbox („Mit der Freigabe ist das Projekt von deiner Seite abgeschlossen …“); der Server verlangt zusätzlich `confirmFinal: true`                     |
| Protokoll Abnahme      | `approved_at` + `approved_by_portal_membership_id` an der Runde; Activity; Chat-Systemnachricht                                                                                                      |
| Löschen                | Runden und Punkte werden nie gelöscht (nur per Kunden-Purge in Ordner 21)                                                                                                                            |

### Status

```txt
            (Übergabe durch uns)
                    │
                    ▼
                  open ───────────────────────────────┐ Kunde: „ohne Änderungen freigeben“ (0 Punkte)
       Kunde:       │  ▲ intern: „Zurück an Kunden“    │
       einreichen   ▼  │                               ▼
               submitted ──► in_discussion         approved  (Abnahme, endgültig)
                    │              │                   ▲
                    └──────┬───────┘                   │ Kunde: Abnahme (nur höchste Runde)
                           ▼                           │
                      in_progress ──► completed ───────┘
                                          │
                                          └─► (Übergabe Runde n+1 durch uns, falls Kontingent)
```

| Status          | Kundensicht (Portal, Du-Form)               | Bedeutung                                                  |
| --------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `open`          | „Du bist dran“                              | Übergeben; Kunde sammelt Punkte, speichert zwischen        |
| `submitted`     | „Eingereicht – wir sichten dein Feedback“   | Gesperrt; wir sichten, planen ggf. den Call                |
| `in_discussion` | „Wir möchten dein Feedback kurz besprechen“ | Abstimmung/Call; optionaler Hinweis an den Kunden          |
| `in_progress`   | „In Umsetzung“                              | Wir arbeiten die Punkte ab                                 |
| `completed`     | „Umgesetzt“                                 | Alle Punkte haben ein Ergebnis; Kunde sieht die Ergebnisse |
| `approved`      | „Abgenommen am …“                           | Abnahme erteilt; Projekt launchbereit                      |

Die vollständige Übergangstabelle (wer, Bedingungen, Nebenwirkungen) steht in
[Task 58](./58-datenmodell-und-fundament.md) und ist als Const-Tabelle `FEEDBACK_ROUND_TRANSITIONS` die einzige
Quelle für Server und UI.

### Feedback-Punkte

| Bereich           | Entscheidung                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form              | Liste von Punkten statt eines großen Freitexts. Wer nicht strukturieren will, schreibt alles in einen Punkt „Allgemein“                            |
| Bereich           | Auswahl aus der Seitenliste des Projekts (`projects.feedback_areas`, Text-Array, z. B. „Startseite“, „Über uns“) plus immer „Allgemein“ (= `NULL`) |
| Snapshot          | Die Bereichsliste wird bei der Übergabe an die Runde kopiert (`area_options`); spätere Änderungen am Projekt ändern alte Runden nicht              |
| Art               | Optional `change_request` (Änderungswunsch) oder `bug` (Fehler). Hilft, Mängel von Änderungswünschen zu trennen                                    |
| Text              | Plaintext, höchstens 5.000 Zeichen je Punkt; im Entwurf darf er leer sein, Einreichen verlangt Text in jedem Punkt                                 |
| Dateien           | Je Punkt, über den bestehenden Portal-Upload (Task 55) hochgeladen und dann angehängt (`files.feedback_round_id` + `files.feedback_item_id`)       |
| Ergebnis (intern) | `implemented` · `not_implemented` · `additional_service`. Die letzten beiden verlangen eine Antwort an den Kunden                                  |
| Sichtbarkeit      | Ergebnisse und Antworten sieht der Kunde erst ab `completed`                                                                                       |
| Nicht enthalten   | Sektionsbaum je Seite, Pins/Annotationen auf der Seite, Kommentare je Punkt, Priorität, Zuweisung einzelner Punkte an Mitarbeiter                  |

### Entwürfe

- Der Entwurf liegt **serverseitig**: die Runde im Status `open` mit ihren Punkten. Kein `localStorage`.
- Speichern ist versioniert (`updateVersioned` auf der Runde): Bearbeitet ein zweiter Kontakt parallel, bekommt der
  spätere 409 mit aktuellem Stand; die UI bietet seinen eigenen Text zur Wiederherstellung an.
- Die UI speichert entprellt automatisch und zusätzlich über „Zwischenspeichern“; der Speicherstatus wird über eine
  Live-Region angesagt. Vor Upload und Einreichen wird ein ausstehender Stand zuerst gespeichert.
- Eingereichte Runden sind unveränderlich. Nachträge laufen über den Chat oder in die nächste Runde; nur das Team kann
  eine Runde aus `submitted`/`in_discussion` mit Hinweis „Zurück an den Kunden“ geben.

### Sammelaufgabe

- Beim Einreichen entsteht in derselben Transaktion eine **interne** Aufgabe „Feedbackrunde n umsetzen“, typisiert über
  `tasks.feedback_round_id` (keine Titel-Erkennung). Höchstens eine Aufgabe je Runde (partieller Unique-Index).
- Bearbeiter: Projekt-Owner, falls aktiv; sonst Kunden-Owner; sonst keine Aufgabe (geloggt, das Einreichen scheitert
  nie an der internen Besetzung). Titel in `DEFAULT_LOCALE`, danach wie jeder Titel änderbar.
- Synchronisation, jeweils nur aus dem erwarteten Ausgangsstatus (manuelle Änderungen werden nie überschrieben):
  Umsetzung starten → Aufgabe `in_progress`; Abschluss → `done`; „Zurück an Kunden“ → `cancelled`; erneutes Einreichen
  → dieselbe Aufgabe wieder `open`.
- Bewusst **nicht**: je Punkt eine Aufgabe (Aufgabenflut, Statusmodell passt nicht, Portal-Dopplung). Das ist später
  additiv möglich, weil Punkte eigene Zeilen sind.

### Feedbackblock in der Prozessleiste

Die Prozessleiste (`projects.process_steps`, `current_process_step`) bleibt **Freitext wie heute**. Neu ist ein
**vordefinierter Schritt „Feedbackblock“**, der im Projekt-Editor statt eines Freitext-Schritts eingefügt wird
(„Schritt hinzufügen → Freitext | Feedbackblock“). Er steht als eigene Zeile zwischen den Freitext-Schritten, lässt
sich wie diese verschieben und entfernen und ist der **einzige** Schritt mit Logik.

| Bereich             | Entscheidung                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speicherung         | `projects.feedback_block_position INTEGER NULL`: der Block steht vor `process_steps[p]`; `p = cardinality(process_steps)` = am Ende; `NULL` = kein Block                                           |
| Anzahl              | Höchstens ein Block je Projekt (ergibt sich aus der Spalte)                                                                                                                                        |
| Freitext „Feedback“ | Legt der Mitarbeiter einen Freitext-Schritt „Feedback“ an, ist das ein normaler Schritt **ohne** Logik. Es gibt nirgends eine Label-Erkennung                                                      |
| Editor-UI           | Zwei getrennte Wege: „Schritt hinzufügen“ (Freitext) und „Feedbackblock einfügen“; Blockzeile unverwechselbar mit fester Beschriftung und Kontingentfeld; ↑/↓ für alle Zeilen (Details in Task 57) |
| Entfernen           | Frei, solange das Projekt keine Runde hat; ab der ersten Runde serverseitig gesperrt (`PROJECT_FEEDBACK_BLOCK_IN_USE`, Task 58)                                                                    |
| Darstellung         | Lokalisiert „Feedbackrunde 1 … N“ mit N = Kontingent; nach Abnahme in Runde k nur 1 … k. Der Block speichert keine eigene Zahl                                                                     |
| Aktueller Schritt   | Abgeleitet: Abnahme vorhanden → Block erledigt. Sonst mindestens eine Runde → Block aktiv, Runde k (höchste) hervorgehoben, `current_process_step` ignoriert. Sonst gilt `current_process_step`    |
| Am Feedbackschritt  | Für Runde 1: `current_process_step` ist der letzte Freitext-Schritt vor dem Block (Block an Position 0: der erste Schritt). Für Runde ≥ 2 ist der Block durch Runden bereits aktiv                 |
| Nach der Abnahme    | Derselbe Command setzt `current_process_step = process_steps[p]` (der Schritt direkt nach dem Block, z. B. „Launch“), falls vorhanden, in derselben Transaktion                                    |
| Neue Projekte       | Vorbelegte Schritte aus den Phasen **ohne** das Freitext-Label „Feedback“; der Block steht an dessen Stelle (vor „Launch“)                                                                         |
| Bestand             | Es gibt keine Produktivdaten: kein Backfill, keine Label-Heuristik                                                                                                                                 |
| Verworfen           | jsonb-Schrittmodell (Umbau aller fertigen Stellen für einen einzigen Logikschritt), Parallel-Array (zwei Arrays synchron halten), eigene Tabelle (überdimensioniert)                               |

### Benachrichtigung

- Bis Ordner 20c **ausschließlich** Chat-Systemnachrichten über `messageService.appendSystemMessage` (Savepoint,
  fehlertolerant, erhöhen keinen Ungelesen-Zähler; Muster `announcePhaseChange` in
  `update-project.command-handler.ts`): Übergabe, Eingereicht, Gespräch angefordert, Zurück an Kunden, Abschluss,
  Abnahme.
- Der Fachwrite scheitert nie an einer Systemnachricht.
- Mail und Glocke folgen in 20c (siehe „Auswirkungen auf spätere Ordner“).

### Limits (`FEEDBACK_LIMITS` in `packages/common/src/constants/crm/feedback-limits.ts`)

| Wert                                     | Limit |
| ---------------------------------------- | ----: |
| Punkte je Runde                          |    30 |
| Zeichen je Punkt                         | 5.000 |
| Zeichen je Bereich                       |    80 |
| Bereiche je Projekt/Runde                |    30 |
| Zeichen Übergabenotiz/Hinweise/Antworten | 2.000 |
| Dateien je Punkt                         |    10 |
| Dateien je Runde                         |    50 |

Datei-Limits je Endung bleiben `UPLOAD_LIMIT_BY_KIND` (14-dateien).

### Rechte

- **Portal:** Lesen `portal.feedback.read` + `portal.projects.read`; Speichern, Anhängen, Einreichen, Freigeben
  `portal.feedback.submit`; Hochladen zusätzlich `portal.files.write`. Die Owner-Sicht (`requirePortalReader`) liest,
  schreibt aber nie.
- **Intern:** keine neue Permission. Lesen `projects.read`, Übergabe/Status/Ergebnisse `projects.write`, jeweils über
  `canOn` auf das Projekt (scopebar); ZIP zusätzlich `files.read`. Jeder Endpunkt steht in `CRM_ENDPOINT_ACCESS_RULES`,
  jede Query filtert über `crmAccessCondition`.
- Fremder Kunde, fremdes Projekt, geratene ID → 404.
- Externer Text wird nur als Text gerendert (kein HTML, kein Markdown); Links über `splitMessageLinks`, neuer Tab mit
  `rel="noopener noreferrer"`.

## Geänderte Entscheidungen (gegenüber Task 22/23)

| Früher                                                             | Jetzt                                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Runde entsteht beim Absenden durch den Kunden                      | Runde entsteht bei der Übergabe durch uns (`open`)                                     |
| Kein serverseitiger Entwurf, Text im `localStorage`                | Serverseitiger, versionierter Entwurf in der offenen Runde                             |
| Upload-Session ohne Rundenbezug                                    | Bestehender Portal-Upload (Task 55), danach Anhängen an einen Punkt                    |
| Ein Freitext bis 20.000 Zeichen                                    | Feedback-Punkte mit Bereich, Art, Text (≤ 5.000) und Dateien                           |
| Status `submitted → in_progress → completed`                       | `open → submitted → (in_discussion) → in_progress → completed`, dazu `approved`        |
| Keine Kundenfreigabe                                               | Freigabe ohne Änderungen und Abnahme nach der letzten Runde, mit Bestätigung           |
| `feedback_round_requests` (Zusatzrunden-Anfrage, interne Freigabe) | Entfällt; Zusatzrunden über 13c, bis dahin Kontingent intern erhöhen                   |
| Antworttext beim Statuswechsel                                     | Ergebnis und Antwort je Punkt; Hinweis an den Kunden bei Gespräch und Zurück           |
| Keine Verbindung zur Prozessleiste                                 | Vordefinierter Feedbackblock in der Leiste                                             |
| Keine Aufgabe                                                      | Typisierte Sammelaufgabe je Runde                                                      |
| Rate-Limit 5 Absendungen je Stunde                                 | Entfällt: Runden entstehen nur durch uns, je Runde genau ein Einreichen                |
| Portal-Dateiseite in Task 22                                       | Bereits durch Task 55 geliefert                                                        |
| „`files_exactly_one_scope`-CHECK“                                  | Existiert nicht; der Scope an `files` ist hierarchisch (Kunde ⊃ Projekt ⊃ Runde/Punkt) |

## Auswirkungen auf spätere Ordner

- **13c Leistungsanfragen:** Zusatzrunde als anfragbare Leistung. Die Übernahme einer angenommenen Anfrage erhöht
  `included_feedback_rounds` um 1 (≤ 20, Activity mit Actor, nie nach einer Abnahme). Die Portal-Feedbackseite
  verlinkt bei erschöpftem Kontingent auf die Anfrage statt auf den Chat.
- **20c Jobs und Benachrichtigungen:** Mail/Glocke für Übergabe, Gespräch angefordert, Zurück an Kunden und Abschluss
  (an die Portal-Kontakte des Kunden) sowie Eingereicht und Abnahme (an den Projekt-Owner); optional Fristerinnerung
  für `due_on`. Die Chat-Systemnachrichten bleiben bestehen.
- **21 Datenschutz/Purge:** Export und Purge umfassen `feedback_rounds` und `feedback_round_items`; Feedbackdateien
  sind normale `files`-Zeilen und folgen der bestehenden Reihenfolge (Objekte vor DB-Zeilen).
- **Später optional:** typisierte Leiste mit mehreren Feedbackblöcken, Aufgaben aus einzelnen Punkten, Abnahme
  zurücknehmen (protokolliert). Alles additiv, weil Runden und Punkte eigene Tabellen haben.

## Merge-Gates (je Teil-PR zusätzlich zur Task-Datei)

- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün;
      `pnpm db:smoke:crm` grün ab 16.1.
- [ ] Drizzle-Modell deckungsgleich zur Migration (Spalten, Typen, Constraints, Indizes) — expliziter Review-Punkt.
- [ ] Negativtests: fremder Kunde, fremdes Projekt, fehlende Permission, gebundene Rolle ohne Projektrecht (Workspace
      und Portal) → 404/403.
- [ ] Nebenläufigkeit: zwei parallele Übergaben → eine Runde; zwei parallele Entwurfsspeicherungen → einmal Erfolg,
      einmal 409 mit aktuellem Stand; doppeltes Einreichen → eine Runde, eine Aufgabe.
- [ ] Eine eingereichte Runde und ihre Punkte/Dateien sind über keinen Portalpfad mehr änderbar.
- [ ] Freigabe/Abnahme ohne `confirmFinal: true` wird abgelehnt.
- [ ] Übergabe, Abschluss und Abnahme ändern `projects.phase` nie.
- [ ] Externer Text (`<script>`, Markdown) erscheint überall als Zeichenfolge.
- [ ] Sichtbar gelieferte UI: Tastatur, Fokus, Live-Regionen, Dark/Light, mobil ab 360 px ohne horizontales Scrollen;
      Empty-States erklären den Zweck; Portal-Copy in Du-Form; alle Texte DE und EN.
- [ ] `db:seed:crm` um realistische Beispieldaten erweitert (ab 16.1 bzw. 16.2).

## Rollback

- 16.1: Revert; die Spalte `feedback_block_position` bleibt ungenutzt stehen (additiv).
- 16.2/16.3: nichts sichtbar; Revert genügt.
- 16.4/16.5: `portal.feedback.*` aus `portal_standard` und eigenen Portalrollen nehmen; Widget und Feedbackseite
  verschwinden. Interne Sektion per Revert ausblenden; vorhandene Runden bleiben in der DB erhalten.
- 16.6: Sidebar-Eintrag per Revert entfernen.

## Hinweis

Die Task-Nummer 50 ist im Plan-Baum doppelt vergeben (`13c-portal-leistungsanfragen/50-…` und
`done/12c-cockpit-dashboard/50-…`). Das wird hier nicht behoben; neue Nummern dieses Ordners beginnen bei 57.
