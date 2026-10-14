# Ordner 13c — Leistungsanfragen (Portal und Cockpit)

> **Status:** läuft · **Abhängigkeiten:** 07, 12b, 13, 16, 20 · **Aufwand:** 9–12 Tage · **Reviewziel:** ≈ 220 Dateien
> in drei Teil-PRs · **Plan neu geschnitten am 11.10.2026** (ersetzt die Skizze mit einem PR und 60–80 Dateien)

## Ziel und Stand nach Merge

Kunden fragen Zusatzleistungen heute per Mail oder Chat an; im CRM entsteht daraus von Hand eine Projektleistung,
bei Stunden zusätzlich eine separate Gutschrift. Ordner 13c macht daraus einen durchgehenden Ablauf:

1. Der Kunde fragt im Portal an — aus freigegebenen Katalogleistungen **ohne Preis** oder als Freitext.
2. Die Anfrage landet im Kunden-Cockpit und in einem globalen Eingang mit Sidebar-Zähler.
3. Intern: zuerst **„Angebot gesendet“** (der Kunde kennt bis dahin keinen Preis), sonst **Ablehnen**. Erst wenn
   der Kunde dem Angebot zugestimmt hat (vorerst per Mail, später im Portal), wird mit **„Kunde hat zugesagt“**
   angenommen. Annehmen weist die Leistung in einem Schritt einem bestehenden oder im selben Dialog neu angelegten
   Projekt zu; aus einer Freitext-Anfrage entsteht dabei auf Wunsch eine neue Katalogvorlage. Für Kulanz bleibt
   „Ohne Angebot annehmen“ als zurückhaltende Aktion mit ausdrücklicher Bestätigung (Nachtrag vom 12.10.2026).
4. Sonderfälle laufen automatisch mit der Zuweisung: **Stunden** (Menge → Gutschrift + Projektzuweisung) und
   **Zusatz-Feedbackrunde** (ein Rundenschritt mehr).

Die frühere Skizze (ein PR, Statusmodell ohne Rückzug, Seite `/services`) ist durch diesen Stand ersetzt.

## Teil-PRs

Der Ordner wird bewusst in drei Teil-PRs mit eigenen Branches geliefert (Ausnahme in `plans/crm/AGENTS.md`).
Intern kommt **vor** dem Portal: Kein Kunde kann anfragen, bevor die Bearbeitung existiert.

| PR    | Task                                            | Branch                                 | Inhalt                                                                 | Dateien | Status    |
| ----- | ----------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- | ------: | --------- |
| 13c.1 | [Task 74](./74-leistungsarten-und-zuweisung.md) | `feat/crm-leistungsanfragen-1-katalog` | Vorlagen-Arten, Projektbezug, Portal-Freigabe, Zuweisung mit Automatik |    ≈ 60 | im Review |
| 13c.2 | [Task 75](./75-leistungsanfragen-intern.md)     | `feat/crm-leistungsanfragen-1-katalog` | Tabelle, Cockpit-Sektion, Eingang, Angebot / Ablehnen / Annehmen       |   ≈ 138 | im Review |
| 13c.3 | [Task 76](./76-portal-leistungsanfragen.md)     | `feat/crm-leistungsanfragen-3-portal`  | Portal-Rechte, Widget, Dialog, Zurückziehen, Feedback-Verweis          |    ≈ 75 | im Review |

Statuswerte: `offen` → `läuft` → `im Review` → `gemerged`.

## Entscheidungen des Nutzers (11.10.2026)

| Bereich         | Entscheidung                                                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anfrageform     | **Hybrid:** freigegebene Katalogleistungen als Karten (Titel + Kundentext, nie Preis) und immer „Etwas anderes“ (Freitext)                                                                                                                                                                                                                    |
| Projektbezug    | **Vorlage gibt vor, intern wird entschieden.** Vorlage trägt `existing_project` oder `new_project`. Kunde wählt bei `existing_project` das Projekt; Freitext: Projekt, „Neues Vorhaben“ oder „Weiß ich nicht“. Final entscheidet der Annahme-Dialog                                                                                           |
| Status          | `requested → offered (Regelweg, siehe Nachtrag vom 12.10.2026) → accepted \| declined`, dazu `withdrawn` (Kunde, nur aus `requested`). Ablehnen verlangt einen kundensichtbaren Grund                                                                                                                                                         |
| Stunden         | Vorlagen-Art `hours`: Preis = Stundensatz, Menge beim Zuweisen/Annehmen. **Eine Transaktion:** Projektleistung mit Menge + Kaufbuchung + Zuweisung an das Projekt — oder, per Haken abwählbar, ohne Zuweisung als freie Stunden des Kunden (Nachtrag in Task 74). Gilt im Cockpit **und** für Anfragen. Gutschrift erst nach interner Annahme |
| Zusatzrunde     | Vorlagen-Art `feedback_round`: Zuweisung fügt genau einen Rundenschritt ein — hinter der letzten Runde, bzw. hinter dem aktuellen Schritt, wenn das Projekt schon weiter ist. Max. 20, nie nach einer Abnahme                                                                                                                                 |
| Intern sichtbar | Sektion im Kunden-Cockpit **und** globaler Eingang `/crm/service-requests` mit Sidebar-Zähler                                                                                                                                                                                                                                                 |
| Neues Projekt   | Direkt im Annahme-Dialog, in derselben Transaktion wie die Zuweisung                                                                                                                                                                                                                                                                          |
| Branch-Basis    | `master` (enthält Ordner 20 vollständig; geprüft: `0056`/`0057`, `hoursLedgerService`, `portalHoursService` liegen auf `master`)                                                                                                                                                                                                              |

## Weitere Festlegungen des Plans

| Bereich            | Festlegung                                                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schnitt            | Drei Teil-PRs statt einem (≈ 220 Dateien gesamt, harte Grenze 200 je Ordner): **13c.1** Katalog-Arten + Zuweisung in einem Schritt, **13c.2** Anfragen intern, **13c.3** Portal                                                                   |
| Reihenfolge        | Intern **vor** Portal: Kein Kunde kann anfragen, bevor die Bearbeitung existiert. 13c.2 ist über Seed und Integrationstests prüfbar                                                                                                               |
| Task-Nummern       | Task 74 (13c.1), Task 75 (13c.2), Task 76 (13c.3) — aufsteigend in Umsetzungsreihenfolge. Die frühere Nummer 50 dieses Ordners entfällt (sie gehört dem Cockpit-Redesign, Ordner 12c)                                                             |
| Kundentext         | `portal_description` ist **Pflicht**, sobald `portal_requestable` gesetzt wird. Kein Fallback auf die interne Beschreibung (die Skizze sah einen vor; interne Texte sollen nicht versehentlich ins Portal)                                        |
| Sprache            | Katalogtitel und Kundentext sind einsprachig wie der interne Katalog. Übersetzungen kommen bei Bedarf additiv                                                                                                                                     |
| Automatik-Ort      | Stunden- und Runden-Automatik hängt an der **Zuweisung** (`projectLineItemAssignmentService`), nicht an der Anfrage. Cockpit und Annahme rufen dieselbe Methode; doppelte Wirkung ist ausgeschlossen, weil je Zuweisung genau eine Zeile entsteht |
| Stunden-Wert       | Eine `rate`-Leistung **mit** Menge zählt als Einmalwert (Satz × Stunden). Ohne Menge bleibt `rate` ein Konditionswert (ändert die Regel aus Task 42a nur für neue Stunden-Leistungen)                                                             |
| Automatik = fest   | Leistungen der Arten `hours` und `feedback_round` entstehen immer mit Status `confirmed`; Status, Menge und Preisart sind danach nicht änderbar. Korrekturen laufen über „Stunden gutschreiben → Korrektur“ bzw. den Projekt-Editor               |
| Runden-Position    | Folge der abgestimmten Regel: Sind die Runden vor „Launch“ verbraucht und steht das Projekt auf „Launch“, landet die Zusatzrunde **hinter** „Launch“. Sie ist im Projekt-Editor verschiebbar, solange sie nicht übergeben ist                     |
| Zähler             | Sidebar zählt offene Anfragen (`requested` und `offered`) im Zugriffsbereich (Nachtrag 12.10.2026). Kein Lesestempel                                                                                                                              |
| Kein Portal-Slug   | Keine Seite `/services` und kein `PORTAL_NAV_ITEMS`-Eintrag (README-Altstand): Das Portal hat keine Navigation, Module sind Widget + Dialog (`app/[locale]/(portal)/AGENTS.md`)                                                                   |
| Dashboard-Hinweis  | Der „Hinweis im Dashboard-Block“ aus der README entfällt zugunsten von Eingang + Zähler (das interne Dashboard ist vertagt)                                                                                                                       |
| Ownership-Registry | `service_requests` ist keine besitzbare Entität (kein Zuständiger); die Registry bleibt unverändert                                                                                                                                               |

## Datenmodell

Regeln aus `packages/db/AGENTS.md` gelten: keine DB-Defaults außer Zeitstempeln, additiv und idempotent, Modell und
Migration deckungsgleich, Constraint-Namen als Const-Objekt unter `packages/db/src/constraint-names/crm/`,
CHECKs für String-Unions über `sqlCheckIn`. Migrationsnummer immer im Repository ermitteln (aktuell höchste: `0057`).

**Neue Spalten an bestehenden Tabellen sind nullable** (die vorherige App-Version schreibt sie nicht). Der Mapper
liest `NULL` als Standardwert; der Schreibpfad setzt ab jetzt immer einen Wert. Vorbild: `project_line_items.status`.

```txt
line_item_templates  (13c.1)
  + kind text NULL                 standard | hours | feedback_round      NULL = standard
  + project_mode text NULL         existing_project | new_project         NULL = existing_project
  + portal_requestable boolean NULL                                       NULL = false
  + portal_description text NULL   Länge ≤ 2000; Pflicht bei portal_requestable = true
  CHECK kind = 'hours'          → pricing_mode = 'rate'
  CHECK kind = 'feedback_round' → pricing_mode = 'one_time'
  CHECK kind IN ('hours','feedback_round') → project_mode IS DISTINCT FROM 'new_project'
  CHECK portal_requestable IS NOT TRUE OR btrim(portal_description) <> ''

project_line_items  (13c.1)
  + kind text NULL                 Snapshot der Vorlagen-Art               NULL = standard
  + quantity_minutes integer NULL  > 0, % 15 = 0, ≤ 600000
  CHECK (quantity_minutes IS NOT NULL) = (kind = 'hours')   -- NULL-kind zählt als „nicht hours“ (IS NOT DISTINCT FROM)

customer_hour_purchases  (13c.1)
  CHECK source IN ('manual', 'project_line_item')           -- DROP CONSTRAINT IF EXISTS + ADD, nur erweitert

portal_memberships  (13c.2)
  + UNIQUE INDEX portal_memberships_id_customer_uidx (id, customer_id)   Ziel des zusammengesetzten Schlüssels

service_requests  (13c.2, präfixfrei)
  id uuid PK
  customer_id uuid NOT NULL → customers ON DELETE CASCADE
  line_item_template_id uuid NULL → line_item_templates ON DELETE SET NULL      NULL = Freitext oder Vorlage gelöscht
  kind text NOT NULL               Snapshot; Freitext = standard
  title text NOT NULL              Snapshot des Vorlagentitels bzw. Titel des Kunden; btrim <> '', ≤ 200
  note text NOT NULL               Kundentext, ≤ 2000, '' erlaubt bei Katalog-Anfragen
  requested_minutes integer NULL   nur bei kind = hours (CHECK wie quantity_minutes)
  project_wish text NOT NULL       existing | new | undecided
  requested_project_id uuid NULL   FK (requested_project_id, customer_id) → projects (id, customer_id) ON DELETE CASCADE
  requested_by_membership_id uuid NOT NULL
                                   FK (requested_by_membership_id, customer_id) → portal_memberships (id, customer_id)
  status text NOT NULL             requested | offered | accepted | declined | withdrawn
  decline_reason text NULL         ≤ 500
  offered_at timestamptz NULL
  decided_at timestamptz NULL      Annahme, Ablehnung oder Rückzug
  decided_by_member_id uuid NULL → workspace_members (ohne Cascade)
  project_id uuid NULL             Zielprojekt nach Annahme; FK (project_id, customer_id) → projects ON DELETE CASCADE
  project_line_item_id uuid NULL → project_line_items ON DELETE SET NULL
  idempotency_key uuid NOT NULL UNIQUE
  version integer NOT NULL CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()
  CHECK (project_wish = 'existing') = (requested_project_id IS NOT NULL)
  CHECK (requested_minutes IS NOT NULL) = (kind = 'hours')
  CHECK status <> 'accepted' OR (project_id IS NOT NULL AND decided_at IS NOT NULL AND decided_by_member_id IS NOT NULL)
  CHECK status <> 'declined' OR (btrim(decline_reason) <> '' AND decided_by_member_id IS NOT NULL)
  INDEX (customer_id, created_at DESC), INDEX (status, created_at DESC)
```

Permissions:

| Key                       | Realm     | scopable      | PR    | Rollen                                          |
| ------------------------- | --------- | ------------- | ----- | ----------------------------------------------- |
| `service_requests.read`   | workspace | ja, nur Kunde | 13c.2 | Owner (`…7a01`), Member (`…7a02`)               |
| `service_requests.write`  | workspace | ja, nur Kunde | 13c.2 | Owner, Member                                   |
| `portal.services.read`    | portal    | nein          | 13c.3 | `portal_standard` (`…7a04`), Owner-Portalsicht  |
| `portal.services.request` | portal    | nein          | 13c.3 | `portal_standard`; **nicht** in der Owner-Sicht |

Annehmen verlangt zusätzlich die Rechte seiner Teilschritte (siehe Task 75, T3).

## Merge-Gates

Je PR: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/db db:smoke:crm`,
`pnpm --filter @invessiv/db db:smoke:rbac`, `pnpm --filter @invessiv/workspace db:smoke:crm`,
`pnpm --filter @invessiv/workspace build`; 13c.3 zusätzlich `pnpm --filter @invessiv/workspace test:e2e:portal`.
Prettier nur auf die geänderten Dateien anwenden (CRLF, `autocrlf=true`).

- [ ] Kein Portal-DTO, keine Portal-Antwort und kein Portal-Log enthält Preis, Preisart oder Intervall.
- [ ] Nur aktive, freigegebene Vorlagen sind im Portal sichtbar; Archivieren entzieht die Freigabe sofort.
- [ ] Eine Anfrage entsteht nur mit `portal.services.request`; die Firma kommt aus dem `PortalActor`.
- [ ] Kontakt A sieht nie Anfragen einer fremden Firma (Negativtests Query und beide Mutationen).
- [ ] Doppelklick erzeugt genau eine Anfrage; doppelte Annahme erzeugt nie eine zweite Gutschrift oder Runde.
- [ ] Interne Statuswechsel sind versioniert; ein Konflikt liefert 409 mit aktuellem Stand.
- [ ] Stunden-Zuweisung schreibt Leistung, Kaufzeile und Projektzuweisung gemeinsam oder gar nicht.
- [ ] Zusatzrunde nie nach einer Abnahme, nie über 20, mit Activity.
- [ ] Empty-States erklären den Zweck; „nichts freigegeben“ und „noch nichts angefragt“ sind unterscheidbar.
- [ ] Widget `serviceRequest`: `mock: false` plus `requiredPermission`; ohne Recht fehlt es vollständig.

## End-to-End-Abnahme (von Hand, nach 13c.3)

1. Im Katalog „Unterseite“ mit Kundentext freigeben; „Stundensatz“ (Art Stunden) und „Zusätzliche Feedbackrunde“
   ebenso.
2. Als Kontakt im Portal: „Unterseite“ für Projekt A anfragen → Bestätigung, Eintrag „Eingegangen“.
3. Intern: Sidebar-Zähler 1, Karte im Eingang und im Cockpit. „Angebot gesendet“ → Portal zeigt „Angebot unterwegs“.
4. „Kunde hat zugesagt“ → Leistung steht in Projekt A; Portal zeigt „Bestätigt“; im Chat stehen drei Systemnachrichten.
5. Freitext „Zweite Landingpage“ mit „Neues Vorhaben“ → intern annehmen mit „Neues Projekt“ und „Neue Vorlage“ →
   neues Projekt mit Leistung, neue Vorlage im Katalog.
6. 5 Stunden anfragen → intern annehmen → Stunden-Widget im Portal zeigt 5:00 mehr, Projekt A hat 5:00 zugewiesen.
7. Zusatzrunde für ein Projekt mit verbrauchtem Kontingent anfragen (über den Verweis auf der Feedback-Seite) →
   annehmen → Prozessleiste hat einen Rundenschritt mehr, „Runde übergeben“ ist möglich.
8. Eine Anfrage ablehnen (Grund im Portal sichtbar), eine offene im Portal zurückziehen.
9. Owner öffnet „Portal ansehen“: sieht Katalog und Anfragen, kann nichts senden.

## Rollback

Je PR im zugehörigen Task unter „Deploy-Sicherheit“. Grundsatz: Tabellen, Spalten und Permissions bleiben; zurück
geht es über Code-Revert (13c.1, 13c.2) bzw. über das Zurückstellen des Widgets auf `mock: true` und das Entfernen
der beiden Portal-Rechte aus `portal_standard` in Code **und** Migration (13c.3).

## Risiken und offene Punkte

- **Leistungen ohne Projekt** (Wartung über mehrere Websites, freie Stunden, Workshops) löst der Folgeplan
  [`../13d-leistungen-am-kunden/`](../13d-leistungen-am-kunden/README.md). Bis dahin hängt jede Leistung an einem
  Projekt; bei Stunden entscheidet der Haken aus Task 74 nur, ob sie dem Projekt zugewiesen werden.

- **Preis der Zusatzrunden-Vorlage** ist in der Migration 0; vor der Freigabe pflegen.
- **Runde hinter „Launch“** (siehe Festlegungen): fachlich so abgestimmt, optisch gewöhnungsbedürftig. Falls es
  stört, ist die Alternative „an die letzte Rundenposition und Projekt einen Schritt zurück“ eine Änderung allein
  in `nextExtraFeedbackRoundPosition` und `addExtraRoundStep`.
- **13c.2 umfasst 138 geänderte und neue Dateien:** Auf ausdrücklichen Wunsch wird Task 75 zusammen mit
  Task 74 auf dem bestehenden Branch `feat/crm-leistungsanfragen-1-katalog` umgesetzt. Die ursprünglich
  vorgesehene Abspaltung von T3 bei mehr als 120 Dateien wird damit für diese Umsetzung nicht vorgenommen.
  Der zusätzliche Umfang entsteht vor allem durch benannte Contracts, Komponenten mit eigenen CSS-Modulen
  sowie Unit-, API-, Integrations- und Browserprüfungen. Lesen und Schreiben sollten im Review getrennt geprüft werden.
- **Benachrichtigung:** Bis Ordner 20c erfährt das Team von neuen Anfragen über Sidebar-Zähler und
  Chat-Systemnachricht, der Kunde über Systemnachricht und Status im Widget. 20c ergänzt Glocke und Digest.

## Umsetzungsstand Task 75 — 11.10.2026

T1–T3 sind umgesetzt. Der Eingang liegt unter `/[locale]/crm/service-requests`; die Kundensektion steht vor
„Dateien“. Anfragen lassen sich als Angebot markieren, ablehnen und atomar mit Projektleistung annehmen.
Stunden und Zusatzrunden nutzen die Zuweisung aus Task 74. Rechte, Versionskonflikte, parallele Annahmen,
Rollback sowie Activity- und Systemnachrichten werden auf Serverebene geprüft. Kundentext wird als Text gerendert;
Activity-Metadaten enthalten weder Titel noch Notiz noch Ablehnungsgrund. DE und EN sind parallel gepflegt.

Die Migration des Ordners (`0058_add_service_requests.sql`, siehe unten) ist in Development angewandt. Der CRM-Seed erzeugt alle fünf
Statuswerte mit Katalog-, Freitext-, Stunden- und Zusatzrundenbeispielen und nutzt ausschließlich seine eigenen
Vorlagen. Neue Dependencies oder Umgebungsvariablen werden nicht benötigt. Die Credentials-Fixtures werden
bei fehlendem gültigem Keyring weiterhin übersprungen; Leistungsanfragen benötigen diesen Keyring nicht.

Prüfungen:

- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und Workspace-Build.
- `pnpm db:smoke:crm`: 304 Constraints und 443 Integrationstests in 39 Dateien bestanden.
- `pnpm db:smoke:rbac`: Datenbank- und Handler-Prüfungen bestanden.
- `pnpm db:seed:crm development`: bestanden, bestehende Credentials-Skip-Regel bleibt sichtbar.
- Task-75-Browserablauf mit echter Clerk-Manager-Sitzung: Angebot, Annahme, Ablehnung mit Pflichtgrund,
  Versionskonflikt mit erhaltenen Eingaben und fremde Cockpit-ID bestanden. DE/Dark/Desktop und EN/Light/Mobil
  visuell geprüft; Dialog per Escape geschlossen und horizontale Überläufe ausgeschlossen.

Der gezielte Browserlauf wurde mit
`pnpm --filter @invessiv/workspace test:e2e:portal workspace-service-requests.e2e.ts --no-deps`
ausgeführt. Dabei erfolgen Migration und Build; die bereits vorhandene authentifizierte Testfixture wird
wiederverwendet. Ein frischer globaler Portal-Setup-Lauf scheitert in dieser lokalen Umgebung an der
Blob-Bereinigung wegen fehlender Development-OIDC-Konfiguration. Das bleibt ein offenes Setup-Thema für die
vollständige Portal-Suite; der neue Feature-Test wurde erfolgreich ausgeführt und der Setup-Fehler wird nicht übersprungen.

Zwei veraltete bestehende Integrationsprüfungen wurden an den aktuellen Website-Onboarding-Katalog
(Migrationen 0052/0053) und den bereits beim Rundenabschluss erfolgenden Launch-Fortschritt angepasst.
Die Fachlogik dieser Bereiche wurde nicht geändert. Die CRM-Integration nutzt vier Worker und ein eigenes
Zeitbudget für echte Datenbank-Roundtrips.

Für Rollback gelten
die Vorgaben in Task 75: Code zurücknehmen, additive Tabelle und Berechtigungskatalog erhalten.

## Umsetzungsstand Task 76 — 12.10.2026

T1–T3 sind umgesetzt, T4 ist geschrieben, aber lokal nicht ausführbar (siehe unten). Das Widget „Leistung anfragen“
ist echt (`mock: false`, `portal.services.read`); der Dialog bietet freigegebene Katalogleistungen ohne Preis und
immer „Etwas anderes“, zeigt die eigenen Anfragen mit Status als Text und lässt eine offene Anfrage zurückziehen.
Bei erschöpftem Feedback-Kontingent verweist die Feedback-Seite auf die Zusatzrunde dieses Projekts. Es gibt
keinen Registry-Eintrag mit `mock: true` mehr; die drei Mock-Komponenten und ihre Texte sind entfernt.

Die Portal-Rechte stehen in derselben Migration `0058_add_service_requests.sql`. Neue Dependencies oder
Umgebungsvariablen werden nicht benötigt.

Abweichungen vom Plan (bewusst, jeweils die kleinere Änderung):

- **Stunden ohne Projekt:** Eine Stunden-Leistung darf immer mit „Kein bestimmtes Projekt“ angefragt werden, auch
  wenn ein Projekt wählbar wäre. Das folgt dem Nachtrag vom 11.10. in Task 74 und geht über Schritt 7 von
  `createPortalServiceRequest` hinaus. Die Regel steht einmal in `listPortalServiceProjectWishes`.
- **Fehlercode `internal`** ergänzt `PortalServiceRequestErrorCode` (500 bei einem unerwarteten Fehler, wie bei den
  Stunden); der Plan nannte nur die fünf Fachcodes.
- **Anonymer POST antwortet 401**, nicht 404: Das ist die bestehende Antwort von `withPortalActor` für alle
  Portal-Routen (so auch im Stunden-E2E). 404 bekommt, wer angemeldet ist, aber kein Recht an der Firma hat.
- **Bereichsname der Einladungsvorschau** liegt in `dictionaries/portal/shell` (`accessAreas.serviceRequest`), weil
  der Dialog seine Labels dort liest; `workspace/crm/portal-access` blieb unverändert.
- **`portal-service-request-error-text.ts` entfällt:** Das Dictionary trägt für jeden Code einen Text
  (`errors`, typgeprüft), ein Helfer hätte nur `texts[code]` zurückgegeben.
- **`projectTitle` einer Anfrage** nennt das Projekt, in dem sie gelandet ist, sonst das gewünschte.

Zentralisiert statt kopiert:

- `loadExtraFeedbackRoundBlockers` (`server/shared/services/feedback/`): die Rundenprüfung aus
  `listExtraFeedbackRoundBlockers`, jetzt von Cockpit und Portal genutzt; `FeedbackRoundTrackInput` zog mit.
- `ServiceRequestStatusBadge` liegt unter `components/shared/service-requests/` (vorher im CRM-Ordner), damit
  Portal und CRM dieselbe Symbol- und Farbzuordnung haben.
- `listPortalServiceProjectWishes`: eine Regel für Formular und Command.
- Der Client nutzt `versionedJsonMutationService.request` und `readApiErrorCode` statt eines eigenen `fetch`.

Prüfungen:

- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` (Workspace: 3766 Tests) und Workspace-Build.
- `pnpm --filter @invessiv/db db:smoke:rbac` (119 Prüfungen) und `db:smoke:crm` (304 Constraints).
- `pnpm --filter @invessiv/workspace db:smoke:crm`: 459 Integrationstests in 40 Dateien, darunter die 15 neuen
  mit echten Portal-Sessions (`src/server/tests/portal/service-requests`).

Offen:

- **Browserlauf (T4):** `e2e/portal-services.e2e.ts` und die Katalog-Fixture sind geschrieben, liefen aber nicht.
  Der globale Portal-Setup scheitert lokal weiter an der Blob-Bereinigung („OIDC is enabled for this project, but
  not for the development environment“). Ein Lauf mit `--no-deps` hilft hier nicht, weil die Fixture neue
  Katalogeinträge braucht. `test:e2e:portal` ist damit als Merge-Gate für 13c.3 noch offen.
- **Sichtprüfung** von Widget, Dialog und Feedback-Verweis in beiden Themes und mobil.
- **Vor der Freigabe im Katalog:** Kundentexte und der Preis der Zusatzrunden-Vorlage (in der Migration 0).
- `db:seed:crm` gibt weiterhin keine Vorlage fürs Portal frei; zum Ausprobieren eine Vorlage im Katalog freigeben.

### Review-Korrekturen Task 76 — 12.10.2026

Die vier Findings aus `deleteable/review-2026-10-12-task76-logik-plan.md` sind umgesetzt:

- Der Dialog hält den Pending-State beim Senden und sperrt Tabs, Auswahlwechsel und Schließen. Wiederholen nach
  einem Fehler verwendet denselben Idempotenzschlüssel; späte Antworten nach externer Navigation werden ignoriert.
- Die Anfrage-Liste zeigt alle offenen Anfragen und die letzten 20 abgeschlossenen, zusammen nach Anlagezeit
  sortiert. Beide Teile werden in einem SQL-Statement gelesen, damit ein gleichzeitiger Statuswechsel weder
  Duplikate noch Lücken erzeugt. Der Historienhinweis in DE/EN beschreibt die neue Grenze.
- Ein firmenübergreifender gleichzeitiger Idempotenzschlüssel-Konflikt wird am Unique-Index abgefangen und
  anschließend als `validation` beantwortet. Nur die tatsächlich eingefügte Anfrage erhält Events.
- Der Owner-Anfrage-Button ist deaktiviert; der bestehende CRM-Verweis bleibt erreichbar.

Zusätzliche Regressionstests prüfen verzögerte Antworten, Schließen/Tabwechsel während des Sendens, Wiederholen
mit demselben Schlüssel, externe Navigation, alte offene Anfragen und einen erzwungenen gleichzeitigen
firmenübergreifenden Insert. Die fokussierten Portal-/UI-Tests und alle 17 Portal-Service-Integrationstests gegen
Development sind grün. Monorepo-Lint, Typecheck und Unit-Tests (5.285 bestanden, davon 3.772 im Workspace) sowie
der Workspace-Build sind grün. Das oben dokumentierte Browser-E2E-Gate bleibt offen.

### Nachtrag Ablauf „Angebot zuerst“ — 12.10.2026

Der Kunde sieht im Portal nie einen Preis; eine Annahme direkt nach dem Eingang hätte ihn ohne Angebot gebunden.
Die Aktionen im Cockpit folgen deshalb dem Status:

- **Eingegangen:** Hauptaktion „Angebot gesendet“, daneben als Nebenaktionen (`ghost`) „Ohne Angebot annehmen“ und
  „Ablehnen“.
- **Angebot gesendet:** Hauptaktion „Kunde hat zugesagt“ (öffnet den Annahme-Dialog), daneben „Ablehnen“.
- **Ohne Angebot annehmen** öffnet denselben Dialog mit eigenem Titel und einem Hinweis, dass der Kunde den Preis
  nicht kennt. „Annehmen und zuweisen“ bleibt gesperrt, bis der Haken „Ich nehme bewusst ohne Angebot an“ gesetzt
  ist.

Der Server setzt das durch: `AcceptServiceRequestRequestDto.acceptWithoutOffer` ist Pflichtfeld. Steht die Anfrage
noch auf `requested` und ist das Feld nicht `true`, antwortet `acceptServiceRequest` mit `OFFER_REQUIRED` (409)
und schreibt nichts; nach einem Angebot wird das Feld nicht ausgewertet. Geprüft wird unter der Zeilensperre nach
Übergang und Version. Übergangstabelle und Datenbank sind unverändert. Ob ohne Angebot angenommen wurde, zeigt
`offered_at IS NULL` an einer angenommenen Anfrage. Die Zusage des Kunden kommt vorerst per Mail; eine Zusage im
Portal ist ein späterer Ausbau (dann als Kundenübergang `offered → accepted`).

### Review-Korrekturen gesamter Branch — 12.10.2026

Die 14 Findings aus `deleteable/review-2026-10-12-branch-leistungsanfragen-gegen-master.md` sind umgesetzt.

**Ablauf (F01, F02, F12)**

- `offered → withdrawn` gibt es jetzt für beide Seiten: Der Kunde zieht im Portal auch nach dem Angebot zurück,
  intern trägt „Kunde hat abgesagt“ die Absage ein (ohne Grund, mit Bestätigungsdialog). „Ablehnen“ bleibt die
  Absage durch das Team mit kundensichtbarem Grund.
- „Angebot gesendet“ öffnet einen Dialog und hält fest, was angeboten wurde: Preis, bei Stunden Stundensatz und
  Menge (Spalten `offered_price_cents` / `offered_minutes`). Die Werte bleiben intern; das
  Portal zeigt weiterhin keinen Preis. Der Annahme-Dialog startet mit ihnen statt mit dem Katalogpreis.
- Der Sidebar-Zähler zählt alle offenen Anfragen, also auch Angebote ohne Antwort. Anfrage und Eingang zeigen
  „Angebot vom {Datum}: {Betrag}“.

**Rechte und Regeln (F03, F04, F05)**

- Das Portal nennt Projekte nur noch mit `portal.projects.read`. Ohne das Recht fragt der Kontakt ohne Projekt
  an; eine Zusatzrunde wird ihm nicht angeboten.
- Die Annahme bindet eine Kataloganfrage an ihre Vorlage, solange die aktiv ist und dieselbe Art hat; eine neue
  Vorlage gibt es nur für Freitext. Verstoß: `VALIDATION_ERROR`.
- Annehmen verlangt `line_item_templates.read`. Ohne das Recht antwortet der Server mit `CATALOG_NOT_READABLE`
  (403), der Dialog nennt den Grund statt „keine passende Vorlage“.

**Struktur (F06–F11, F13, F14)**

- `projectLineItemAssignmentService` ruft `loadExtraFeedbackRoundBlockers` direkt; der Hüllen-Handler
  `list-extra-feedback-round-blockers` ist entfernt.
- Der Annahme-Dialog bekommt die Texte der Leistungsfelder als Prop (`lineItemsContent`).
- Test-Typen und -Konstanten liegen unter `src/test/contracts` und `src/test/constants` statt in `common`
  (Regel in `apps/workspace/AGENTS.md`).
- Eine Komponente je Ordner: `line-item-identity-fields`, `line-item-pricing-fields`,
  `service-request-project-fields`, `service-request-template-fields`, dazu `service-request-mode-choice`.
- `isServiceRequestWithoutOffer` liegt in `@invessiv/common` und gilt für Server und Client.
- Fehlercodes der Zuweisung laufen über eine typisierte Map.
- Server-, Portal-, UI- und DB-`AGENTS.md` beschreiben den neuen Stand, einschließlich der Löschregeln der
  Fremdschlüssel.

Zurückziehen fremder Anfragen derselben Firma ist bestätigt gewollt: Anfragen gehören der Firma.

### Eine Migration für den Ordner — 12.10.2026

Die vier Migrationen des Branches (`0058_add_line_item_kinds`, `0059_create_service_requests`,
`0060_add_portal_service_permissions`, `0061_add_service_request_offer`) sind zu
`0058_add_service_requests.sql` zusammengefasst; die Angebotsspalten stehen direkt im `CREATE TABLE`. Das war
zulässig, weil die Einzeldateien nur in Development angewandt und nie gemergt waren. Preview und Produktion
bekommen ausschließlich die zusammengefasste Datei. **Development und Preview werden vor dem Anwenden
zurückgesetzt**, falls dort die Einzeldateien oder eine frühere Fassung der zusammengefassten Datei bereits
registriert sind. Das `CREATE TABLE IF NOT EXISTS` ergänzt eine bestehende Anfragetabelle nicht um neue Spalten
oder geänderte CHECKs; der Runner überspringt bereits registrierte Dateinamen. Produktion darf keine frühere
Migration dieses Branches enthalten. Für diese vereinbarte Ausgangslage ist keine zusätzliche Upgrade-Migration
vorgesehen.

### Weitere Review-Korrekturen — 12.10.2026

- Anfragetitel übernehmen das Kataloglimit von 200 Zeichen; der CHECK ist direkt in der bestehenden Migration
  angepasst. Freigegebene Katalogtitel mit 161–200 Zeichen lassen sich dadurch anfragen.
- Eine Zusatzrunden-Anfrage prüft zuerst die Projektsichtbarkeit und Eignung, dann eine vorhandene offene Anfrage.
  Ohne Projektleserecht, bei fremden oder unsichtbaren Projekten antwortet sie einheitlich mit `validation`.
- Die beiden internen Statushandler erzeugen Versionskonflikte über den gemeinsamen `versionConflict`-Helfer.

### Review-Nacharbeit vom 13.10.2026

Die Findings F01–F08 aus dem Branch-Review sind umgesetzt:

- **F01/F06:** Ein Angebot erfasst Betrag, Preisart und Abrechnungsintervall gemeinsam. Die interne Anzeige und Annahme verwenden diesen Snapshot. Ein Vorlagenwechsel erhält die bereits eingetragenen Angebotskonditionen; ausdrückliche Änderungen bleiben in den Preisfeldern möglich. Bei älteren Angeboten ohne Konditions-Snapshot weist der Dialog auf die nötige Prüfung anhand des gesendeten Angebots hin. Historische Konditionen werden nicht aus heutigen Katalogwerten rückwirkend gespeichert.
- **F02:** Ein ungeklärter Sendeversuch hält seinen Payload und Idempotenzschlüssel fest. Felder, Vorlagenwechsel, Tabs und Schließen bleiben bis zur Klärung gesperrt; der Sende-Button wiederholt denselben Versuch. Eine eindeutige fachliche Ablehnung gibt die Bearbeitung wieder frei.
- **F03:** Das CRM-Gate akzeptiert eigenständige Anfrage-Leserechte. Der Cockpit-Leser ermöglicht dafür den minimalen Kundencontainer auch bei globalen Anfrage-Rechten; Ansprechpartner, E-Mail und Owner bleiben ohne Kundenleserecht verborgen. Angebote und Ablehnungen bleiben am kundenbezogenen Anfrage-Schreibrecht gebunden.
- **F04:** Leistungsbereich und Anfrage-Annahme verwenden gemeinsam `listLineItemAssignmentProjects`. Die Zuweisungsprüfung lädt nur die nötigen Spurdaten und prüft dasselbe Projektschreibrecht wie der Command. Ein vollständiges Projekt-DTO wird dadurch nicht freigegeben.
- **F05:** Das Projekttitellimit von 160 Zeichen ist zentral in `ProjectFieldLimits` definiert und wird in Schema, Annahmefeld und Clientprüfung verwendet. Eine längere Vorbelegung bleibt sichtbar, zeigt einen Feldfehler und erhält beim Absenden den Fokus; der ursprüngliche Anfragetitel bleibt erhalten.
- **F07/F08:** Das Projektleistungs-Statusfeld ist ein gemeinsamer CRM-Baustein. Beide Browserabläufe verwenden die zentralen HTTP-Konstanten.

**Migration und Deployment:** Die Nacharbeit ist auf ausdrücklichen Wunsch in die Branch-Migration `0058_add_service_requests.sql` integriert: nullable Angebotsspalten und Checks für Preisart/Intervall sowie das Titellimit von 200 Zeichen stehen direkt im `CREATE TABLE`. Die separaten Dateien `0059_capture_service_request_offer_pricing.sql` und `0060_expand_service_request_title_limit.sql` entfallen. In Development wurden beide Änderungen bereits angewendet; die Datenbank wird durch diese Dateikonsolidierung nicht verändert. Auf weiteren Zielumgebungen muss die konsolidierte `0058` vor Auslieferung der neuen App angewendet werden. Eine dort bereits registrierte ältere `0058` wird vom Runner übersprungen und benötigt einen gesonderten Schemaabgleich. Es gibt keine neuen Umgebungsvariablen.

**Security/Privacy:** Anfrage- und Stammdatenrechte bleiben getrennt. Angebotskonditionen werden ausschließlich intern gelesen und geschrieben; Portal-DTOs erhalten keine Preisfelder. **Rollback:** App-Version zurücksetzen; die additiven Spalten und erweiterten Checks bleiben bestehen.

**Validierung der Nacharbeit:**

- `pnpm -r lint` und `pnpm -r typecheck`: bestanden; nur bestehende Lint-Warnungen.
- `pnpm -r --workspace-concurrency=1 test`: 5.338 Tests bestanden, 473 standardmäßig deaktivierte Integrationstests übersprungen.
- Abschließender fokussierter Workspace-Lauf: 219 Tests bestanden, 36 DB-Tests im Standardmodus übersprungen.
- Drei fokussierte Suiten im Modus `crm-integration`: 48 echte DB-Integrationstests bestanden, einschließlich Anfrage-Rechten ohne Stammdatenrechte, beiden Zuweisungswegen ohne Projektleserecht und Monatsangebot nach Katalogänderung.
- `pnpm --filter @invessiv/db db:smoke:crm`: alle 313 Constraint-Prüfungen bestanden, einschließlich Angebotskonditionen und 200-Zeichen-Anfragetitel.
- `pnpm --filter @invessiv/workspace build`: bestanden; bestehende Turbopack-Warnung zur dynamischen Env-Dateisuche.
- Die beiden Browserabläufe wurden über `playwright.portal.config.ts` gestartet. Das gemeinsame Setup scheitert weiterhin an „Vercel Blob: OIDC is enabled for this project, but not for the development environment“. Beide Fachtests wurden deshalb nicht gestartet; Browser-/A11y-Smoke bleibt offen.

### Abschlussreview-Nacharbeit vom 14.10.2026

Die Findings F01–F04 aus `deleteable/review-2026-10-14-leistungsanfragen-abschluss.md` sind im Arbeitsbaum behoben:

- Bei einem Versionskonflikt übernimmt die Annahme ein inzwischen erfasstes Angebot in unberührte Preis-/Intervall-/Mengenfelder. Bewusst geänderte Konditionen bleiben erhalten; weichen sie vom neuen Angebot ab, ist die Annahme bis zu einer ausdrücklichen Bestätigung gesperrt. Projektauswahl, Vorlage und sonstige Eingaben bleiben erhalten.
- Bei angebotenen Freitextanfragen erhält auch der Rückwechsel von bestehender zu neuer Vorlage die Angebotskonditionen.
- Fehlende Projekt- und Ersatzvorlagenauswahl zeigen eine eigene Feldmeldung. Die Selects verknüpfen die Meldung für Screenreader; der gemeinsame Fokushelfer berücksichtigt ihre bestehende `data-invalid`-Kennzeichnung.
- Die deutschen Retry- und Legacy-Angebotshinweise enthalten wieder echte UTF-8-Umlaute. Neue Hinweistexte sind parallel in DE und EN gepflegt.

Validierung: 264 fokussierte Workspace-Tests und 28 gemeinsame UI-Tests bestanden; 55 DB-Integrationstests im Standardmodus übersprungen. Typecheck und Lint für Workspace/UI bestanden, mit bestehenden Lint-Warnungen. Regressionen prüfen insbesondere Konflikt → neue Konditionen → Annahme, erhaltene Benutzeränderungen mit Bestätigung, angebotene Stundenmengen, Vorlagen-Rückwechsel und Feldmeldung/Fokus. Keine Migration, keine neuen Umgebungsvariablen und keine neue Dependency erforderlich. Die Projektpflicht bleibt bis Folgeplan 13d bestehen. Die oben dokumentierte Browser-/E2E-Prüfgrenze bleibt offen.
