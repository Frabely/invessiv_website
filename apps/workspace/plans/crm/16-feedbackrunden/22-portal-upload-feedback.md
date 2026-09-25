# Task 22 — Portal-Feedbackrunde und Upload

> **Merge-Einheit:** Ordner 16 · **Branch:** `feat/crm-feedbackrunden`
> **Aufwand:** L · **Abhängigkeiten:** Task 21 (Dashboard), Task 14 (Dateien),
> Outbox/Benachrichtigungen werden in Ordner 20c nachgezogen
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

## Context

Der Kern des Portals: Der Kunde lädt gebündelt Dateien hoch und schreibt sein Feedback in ein
Freitextfeld. Beides landet als **eine Feedbackrunde** im CRM — statt in fünf Mails mit Anhängen und
einem Kommentar irgendwo dazwischen.

Der Ablauf entspricht dem realen Review-Rhythmus: Man liefert eine Version, der Kunde sammelt seine
Anmerkungen, reicht sie zusammen mit Material ein. Eine abgesendete Runde ist ein unveränderlicher
Zeitstand — kein Dokument, das nachträglich wächst.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einheit                | Eine `feedback_round` bündelt n Dateien und einen Freitext                                                                                                             |
| Scope                  | `project_id` ist **Pflicht**. Eine Runde gehört immer zu genau einem Projekt                                                                                           |
| Warum                  | Feedback bezieht sich auf eine Lieferung, und eine Lieferung gehört zu einem Projekt. Kommunikation ohne Projektbezug läuft über den Chat                              |
| Rundennummer           | Fortlaufend je Projekt ab 1, lückenlos, serverseitig vergeben                                                                                                          |
| Kontingent             | `projects.included_feedback_rounds`, Default 2, bei Projektanlage und danach intern änderbar                                                                           |
| Warum kein fester Wert | Zwei Runden sind der Normalfall, kein Naturgesetz. Ein größeres Projekt startet mit 3 oder 4, ohne Migration und ohne Sonderpfad                                       |
| Einreichen erlaubt     | Solange `round_number <= included_feedback_rounds` und keine Runde des Projekts offen ist                                                                              |
| Darüber                | Das Formular wird durch eine Zusatzrunden-Anfrage ersetzt. Interne Freigabe erhöht das Kontingent um genau 1, mit protokollierter Begründung                           |
| Preis                  | Angebot und Abrechnung der Zusatzrunde liegen außerhalb des CRM. Das Portal nennt keinen Betrag                                                                        |
| Status                 | `submitted` → `in_progress` → `completed`. Der Kunde setzt nur `submitted`, alles Weitere intern (Task 23)                                                             |
| Kein Entwurf           | Es gibt keinen serverseitigen Entwurfsstatus. Eine Runde entsteht erst beim Absenden und ist danach unveränderlich                                                     |
| Warum                  | Ein Entwurf mit eigener Zeile und Unique-Index war die Quelle halbfertiger Einreichungen, in denen Dateien verschwanden                                                |
| Zwischenspeicher       | Der Freitext liegt bis zum Absenden im `localStorage` des Browsers — in `try/catch`, ohne Serverzeile und ohne Datei                                                   |
| Uploads vor Absenden   | Dateien laufen über eine Upload-Session aus Task 14 ohne Rundenbezug. Erst das Absenden verknüpft sie atomar mit der neuen Runde                                       |
| Woher der Pfad kommt   | Der rundenfreie Portal-Upload entsteht bereits in **Ordner 15a (Task 43)**. Diese Einheit baut keinen zweiten Pfad, sondern bindet die vorhandene Session an die Runde |
| Verwaiste Sessions     | Nicht abgesendete Upload-Sessions bleiben bis zum Cleanup-Job aus Ordner 20c nachvollziehbar und reparierbar                                                           |
| Freitext               | Postgres `text`, Anwendungslimit 20.000 Zeichen, serverseitig geprüft                                                                                                  |
| Warum `text`           | In Postgres praktisch unbegrenzt und bei Überlänge automatisch ausgelagert; `varchar(n)` brächte nur eine spätere Migration                                            |
| Externer Text          | Ausschließlich als Text gerendert. Kein HTML, kein Markdown, auch nicht in Mails und Benachrichtigungen                                                                |
| Dateien                | Über denselben Pfad wie intern (Task 14), mit `feedback_round_id` und `category = feedback`                                                                            |
| Limits im Portal       | Strenger als intern: 50 MB je Datei, 20 Dateien und 300 MB je Runde                                                                                                    |
| Missbrauchsschutz      | Datenbankgestütztes Limit: 5 Absendungen je Stunde und Kunde                                                                                                           |
| Leere Runde            | Weder Text noch Dateien wird abgelehnt                                                                                                                                 |
| Benachrichtigung       | Fachwrite erzeugt zunächst nur die Activity; Notification und gebündelte Mail werden in Ordner 20c ergänzt                                                             |
| Projektphase           | Wird durch Absenden und Abschluss **nie** automatisch verändert                                                                                                        |

## Tabellen

```txt
feedback_rounds
  id uuid PK
  project_id uuid NOT NULL  → projects.id ON DELETE CASCADE
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE   denormalisiert
  round_number integer NOT NULL
  submitted_by_membership_id uuid NULL → portal_memberships.id ON DELETE SET NULL
  feedback_text text NULL
  status text NOT NULL DEFAULT 'submitted'   CHECK in FEEDBACK_ROUND_STATUS_VALUES
  submitted_at timestamptz NOT NULL
  started_at timestamptz NULL
  completed_at timestamptz NULL
  read_at timestamptz NULL                   Ungelesen-Markierung fürs CRM
  version integer NOT NULL DEFAULT 1
  created_at / updated_at
  UNIQUE INDEX feedback_rounds_project_number_uidx ON (project_id, round_number)
  UNIQUE INDEX feedback_rounds_open_uidx ON (project_id) WHERE status <> 'completed'
  INDEX (customer_id, submitted_at desc)
  INDEX (status) WHERE status = 'submitted'
  CONSTRAINT feedback_rounds_customer_matches_project
    FOREIGN KEY (project_id, customer_id) REFERENCES projects(id, customer_id)

feedback_round_requests
  id uuid PK
  project_id uuid NOT NULL  → projects.id ON DELETE CASCADE
  requested_by_membership_id uuid NULL → portal_memberships.id ON DELETE SET NULL
  reason text NULL                           Freitext des Kunden, Plaintext
  status text NOT NULL DEFAULT 'open'        CHECK in ('open','approved','declined')
  decided_by uuid NULL      → workspace_members.id
  decided_at timestamptz NULL
  decision_note text NULL                    interne Begründung, nie portalöffentlich
  created_at / updated_at
  UNIQUE INDEX feedback_round_requests_open_uidx ON (project_id) WHERE status = 'open'
```

`projects.included_feedback_rounds` (Default 2, `CHECK BETWEEN 1 AND 20`) entsteht bereits in
Task 09 und wird hier nur gelesen beziehungsweise durch die Freigabe erhöht.

`customer_id` liegt denormalisiert an der Runde, damit Portalabfragen ohne Join auf `projects`
filtern können. Der zusammengesetzte Fremdschlüssel erzwingt, dass Projekt und Kunde übereinstimmen —
eine Runde kann nicht auf ein Projekt eines anderen Kunden zeigen. Das setzt einen Unique-Index auf
`projects (id, customer_id)` voraus, der in Task 09 mitangelegt wird.

`feedback_rounds_open_uidx` erlaubt genau eine nicht abgeschlossene Runde je Projekt. Damit ist
„erst abschließen, dann neu einreichen" auf DB-Ebene erzwungen und nicht nur im Handler.

Zusätzlich wird hier der Fremdschlüssel für `files.feedback_round_id` nachgezogen (die Spalte
entstand in Task 14, als diese Tabelle noch nicht existierte), und die Exactly-one-Scope-Constraint
an `files` wird um den neuen zulässigen Scope **erweitert**, nie verengt:

```sql
ALTER TABLE files ADD CONSTRAINT files_feedback_round_id_fkey
  FOREIGN KEY (feedback_round_id) REFERENCES feedback_rounds(id) ON DELETE CASCADE;
```

## Architektur

```txt
Portal
  GET  /portal/[customerId]/files                        freigegebene Ergebnisse zum Download
  GET  /api/portal/[customerId]/files/[fileId]/url         signierte URL, nur bei visible_to_customer
  POST /api/portal/[customerId]/files/archive              ZIP der freigegebenen Dateien

  GET  /portal/[customerId]/projects/[projectId]/feedback  Verlauf, Kontingent, Formular oder Anfrage
  POST /api/portal/[customerId]/upload-sessions            Upload-Session ohne Rundenbezug (Task 14)
  POST /api/portal/[customerId]/upload-sessions/[id]/files/ticket
  POST /api/portal/[customerId]/upload-sessions/[id]/files/complete

  POST /api/portal/[customerId]/projects/[projectId]/feedback-rounds      absenden
        Idempotenzschlüssel erforderlich
        → Kontingent und offene Runde prüfen
        → round_number = max + 1 in derselben Transaktion
        → Upload-Session-Dateien an die Runde binden
        → Activity; Notification und gebündelte Mail folgen in Ordner 20c
        → Rate-Limit atomar reservieren

  POST /api/portal/[customerId]/projects/[projectId]/feedback-round-requests   Zusatzrunde anfragen
```

Alle Portal-Endpunkte über `withPortalActor`; die Kundenkennung kommt aus der Sitzung, und jeder
Handler prüft zusätzlich, dass das Projekt zu diesem Kunden gehört.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_feedback_rounds.sql
packages/db/src/record-configuration/crm/feedback-rounds.ts
packages/db/src/record-configuration/crm/feedback-round-requests.ts
packages/common/src/constants/crm/feedback-round-statuses.ts
packages/common/src/constants/crm/portal-upload-limits.ts
packages/common/src/contracts/crm/feedback-round.dto.ts
packages/common/src/constants/crm/errors/feedback-round-error-codes.ts

apps/workspace/src/app/api/portal/[customerId]/projects/[projectId]/feedback-rounds/route.ts
apps/workspace/src/app/api/portal/[customerId]/projects/[projectId]/feedback-round-requests/route.ts
apps/workspace/src/app/api/portal/[customerId]/upload-sessions/**
apps/workspace/src/server/portal/
  query-handler/list-project-feedback-rounds.query-handler.ts
  command-handler/submit-feedback-round.command-handler.ts
  command-handler/request-additional-feedback-round.command-handler.ts
  services/portal-feedback-rate-limit-service.ts

apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/projects/[projectId]/feedback/page.tsx
apps/workspace/src/components/portal/feedback/
  feedback-round-form/
  feedback-drop-zone/
  feedback-file-list/
  feedback-text-field/
  feedback-round-history/
  feedback-quota-notice/
  additional-round-request/
  feedback-success/
apps/workspace/src/hooks/portal/use-feedback-draft.ts
apps/workspace/src/i18n/dictionaries/portal/feedback/{de,en}.json
```

## Tickets

### CRM-22-T1 — Migration, Modelle, Konstanten

- **Files:** Migration, `record-configuration/crm/feedback-rounds.ts`,
  `feedback-round-requests.ts`, `constants/crm/{feedback-round-statuses,portal-upload-limits}.ts`,
  `contracts/crm/feedback-round.dto.ts`, `constants/crm/errors/feedback-round-error-codes.ts` + Tests
- **Inhalt:** Tabellen wie oben, nachgezogener Fremdschlüssel und erweiterte Scope-Constraint an
  `files`. `projects.included_feedback_rounds` existiert bereits aus Task 09 und wird hier nur gelesen
- **Akzeptanz:**
  - Migration idempotent; Drizzle-Modell deckungsgleich
  - Bestehende `files`-Zeilen bleiben gültig; die Scope-Constraint ist erweitert, nicht verengt
  - Zwei Runden mit derselben Nummer im selben Projekt sind unmöglich
  - Zwei nicht abgeschlossene Runden im selben Projekt sind unmöglich
  - Eine Runde mit Projekt und Kunde aus verschiedenen Kunden ist unmöglich
  - `included_feedback_rounds = 0` und `> 20` werden abgelehnt

### CRM-22-T2 — Absenden einer Runde

- **Files:** `submit-feedback-round.command-handler.ts`,
  `portal-feedback-rate-limit-service.ts`, Route + Tests
- **Inhalt:**
  - Eine Transaktion: Kontingent prüfen, `round_number = max + 1`, Runde anlegen,
    Upload-Session-Dateien binden und Activity schreiben; Outbox-Eintrag folgt in Ordner 20c
  - Idempotenzschlüssel erforderlich; Wiederholung liefert dieselbe Runde statt einer zweiten
  - Datenbankgestütztes Limit nach dem Muster aus
    `reserve-linkedin-post-generator-usage-limit.ts` (atomar, ein Roundtrip)
  - Freitext auf 20.000 Zeichen begrenzt; leere Runde abgelehnt
- **Akzeptanz:**
  - Test: zwei parallele Absendungen erzeugen genau eine Runde und eine Nummer
  - Test: Absenden bei erschöpftem Kontingent ergibt einen eigenen Fehlercode, nicht 500
  - Test: Absenden bei offener Runde ergibt 409
  - Test: dieselbe Idempotenz-Kennung zweimal ergibt eine Runde
  - Test: sechste Absendung binnen einer Stunde ergibt 429 mit `Retry-After`
  - Test: leere Runde ergibt 422; 20.001 Zeichen abgelehnt, 20.000 akzeptiert
  - Test: Umlaute und Emoji kommen unverändert zurück
  - Test: Fehler beim Binden der Dateien rollt die Runde vollständig zurück
  - Test: Fachwrite und Activity existieren gemeinsam oder gar nicht; Outbox-Integration folgt in Ordner 20c

### CRM-22-T3 — Portal-Upload ohne Rundenbezug

- **Files:** Upload-Session-Handler für das Portal, Routen + Tests
- **Inhalt:**
  - Nutzt die Bausteine aus Task 14, aber mit den strengeren Portal-Limits
  - `uploaded_by_side = customer`, `visible_to_customer = false`, `category = feedback`
  - Session gehört der Mitgliedschaft; fremde Sessions sind nicht erreichbar
- **Akzeptanz:**
  - Test: Portal-Limit greift, auch wenn das interne Limit höher liegt
  - Test: Upload in eine fremde Session ergibt 404
  - Test: die 21. Datei und das Überschreiten von 300 MB werden abgelehnt
  - Test: eine nicht abgesendete Session ist nach 24 Stunden durch den Cleanup entfernt

### CRM-22-T4 — Zusatzrunden-Anfrage

- **Files:** `request-additional-feedback-round.command-handler.ts`, Route,
  interner Freigabe-Command (Task 23 nutzt ihn weiter) + Tests
- **Inhalt:**
  - Anfrage nur möglich, wenn das Kontingent erschöpft ist und keine offene Anfrage existiert
  - Freigabe erhöht `included_feedback_rounds` um genau 1 und protokolliert Actor, Zeitpunkt und
    interne Begründung
  - Ablehnung ist ein eigener Endzustand; der Kunde sieht den Status, nicht die interne Begründung
- **Akzeptanz:**
  - Test: zwei parallele Freigaben erhöhen das Kontingent um 1, nicht um 2
  - Test: zwei parallele Anfragen erzeugen eine offene Anfrage
  - Test: Anfrage bei freiem Kontingent wird abgelehnt
  - Test: die interne Begründung erscheint in keiner Portalantwort

### CRM-22-T5 — Freigegebene Dateien im Portal

- **Files:** `server/portal/query-handler/list-customer-visible-files.query-handler.ts`,
  `api/portal/[customerId]/files/[fileId]/url/route.ts`, `api/portal/[customerId]/files/archive/route.ts`,
  `(portal)/portal/[customerId]/files/page.tsx`, `components/portal/files/**`,
  `dictionaries/portal/files/{de,en}.json` + Tests
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Abfrage nimmt die Kundenkennung **ausschließlich** aus der Sitzung und erzwingt
    `visible_to_customer = true` in der `WHERE`-Klausel — nicht im Rendering
  - Liste nach Projekt gruppiert, mit Name, Größe, Typ und Datum; Vorschau für PDF/TXT, sonst Download
  - Einzeldownload über kurzlebige signierte URL, dazu ein ZIP über die Grenzen aus Task 16
  - Ohne freigegebene Dateien erscheint der Bereich **nicht** — kein leerer Kasten, kein toter Link
- **Akzeptanz:**
  - Test: eine nicht freigegebene Datei ist über keinen Portal-Endpunkt erreichbar, auch nicht mit
    geratener Kennung (404, keine Existenzbestätigung)
  - Test: die Datei eines fremden Kunden ergibt 404
  - Test: das Portal-Archiv enthält ausschließlich freigegebene Dateien
  - Downloads funktionieren auf Mobil, Tastaturbedienung vollständig
  - Alle Texte in DE und EN

### CRM-22-T6 — Portal-Oberfläche

- **Files:** `components/portal/feedback/**`, `hooks/portal/use-feedback-draft.ts`,
  `(portal)/portal/[customerId]/projects/[projectId]/feedback/page.tsx`,
  `dictionaries/portal/feedback/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Kontingent-Hinweis nennt verbleibende Runden im Klartext („Runde 2 von 2")
  - Ablagezone plus Dateiauswahl-Button, Liste der hochgeladenen Dateien mit Entfernen
  - Freitextfeld mit automatischer Höhe, Zeichenzähler ab 80 Prozent, Entwurfssicherung im
    `localStorage` (in `try/catch`, funktioniert auch in privaten Fenstern)
    - Absenden erst möglich, wenn Text oder Dateien vorhanden sind; Sicherheitsfrage mit
      Zusammenfassung und dem Hinweis, dass die Runde danach unveränderlich ist
    - Bei erschöpftem Kontingent ersetzt das Anfrageformular das Einreichformular — keine zwei
      gleichzeitig sichtbaren Wege
    - Verlauf früherer Runden mit Status, Antwort und verknüpften Dateien
  - Tonfall durchweg erklärend: Der Kunde bedient kein Werkzeug, er reicht etwas ein
- **Akzeptanz:**
  - Entwurfstext überlebt das Neuladen der Seite; blockiertes `localStorage` bricht die Seite nicht
  - Verlassen bei laufendem Upload oder ungespeichertem Text warnt
    - Empty-State erklärt, wofür der Bereich gedacht ist, nicht nur „keine Daten"
  - Tastaturbedienung vollständig, Fortschritt über Live-Region
  - Mobil ab 360 px bedienbar, Berührungsziele ausreichend groß
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** Portalbereiche „Feedback" je Projekt und „Dateien"; im Dashboard erscheinen die
   Schnellzugriffe „Feedback geben" und — sofern etwas freigegeben ist — „Dateien herunterladen".
2. **Bricht nichts:** zwei neue Tabellen, eine additive Spalte mit Default an `projects`, neue
   Portal-Endpunkte. Die Scope-Constraint an `files` wird nur erweitert; bestehende Zeilen bleiben
   gültig. Der interne Dateibereich bleibt unverändert.
3. **Offen:** die interne Bearbeitersicht (Task 23). Solange sie fehlt, ist eine Runde über
   Notification und gebündelte Mail sichtbar — deshalb liegt die Benachrichtigung in **diesem** Task.

## End-to-End-Akzeptanz

1. Der Kunde lädt mehrere Dateien hoch und schreibt Feedback; der Text überlebt das Neuladen.
2. Absenden erzeugt genau eine Runde mit Nummer 1 und sperrt sie gegen Änderung.
3. Solange Runde 1 nicht abgeschlossen ist, kann keine Runde 2 eingereicht werden.
4. Nach Abschluss von Runde 1 ist Runde 2 möglich; nach Runde 2 erscheint die Zusatzrunden-Anfrage.
5. Ein Projekt mit `included_feedback_rounds = 4` erlaubt vier Runden ohne jede Anfrage.
6. Freigabe einer Anfrage erlaubt exakt eine weitere Runde; doppelte Freigabe nicht zwei.
7. Der Projekt-Owner erhält Notification und gebündelte Mail, ohne Anhänge und ohne Volltext.
8. Die Dateien erscheinen im CRM beim richtigen Kunden und Projekt, Kategorie „Feedback".
9. Zu große Dateien, zu viele Dateien und zu langer Text werden verständlich abgelehnt.
10. Kein Zugriff auf Runden, Dateien oder Anfragen eines fremden Kunden, auch nicht mit geratener
    Kennung.
11. Ohne freigegebene Dateien erscheint der Bereich „Dateien" gar nicht.
12. Die Projektphase ist nach Absenden und Abschluss unverändert.
13. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
