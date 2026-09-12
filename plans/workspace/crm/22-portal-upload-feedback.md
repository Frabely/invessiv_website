# Task 22 — Portal Upload und Feedback

> **Branch:** `feat/crm-portal-einreichung`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 21 (Dashboard), Task 14 (Dateien), Task 19 (Mail)
> **Migration:** `0030_create_customer_submissions.sql` (Planwert)

## Context

Der Kern des ganzen Portals: Der Kunde lädt gebündelt Dateien hoch und schreibt sein Feedback in ein
Freitextfeld. Beides landet als **eine Einreichung** im CRM — statt in fünf Mails mit Anhängen und
einem Kommentar irgendwo dazwischen.

Der Ablauf entspricht dem realen Review-Rhythmus: Man liefert eine Version, der Kunde sammelt seine
Anmerkungen, reicht sie zusammen mit Material ein und setzt damit den Status. Der Status ist an
beiden Enden sichtbar, sodass niemand nachfragen muss, ob etwas angekommen ist.

## Entscheidungen

| Bereich           | Entscheidung                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Einheit           | Eine `customer_submission` bündelt n Dateien und einen Freitext                                                                                                                                                                            |
| Status            | `draft`, `submitted`, `in_review`, `accepted`, `changes_requested`                                                                                                                                                                         |
| Wer setzt was     | Der Kunde setzt `draft` auf `submitted`. Alles Weitere setzt der Bearbeiter (Task 23)                                                                                                                                                      |
| Entwurf           | Eine offene Einreichung im Status `draft` sammelt Uploads, bis der Kunde absendet. So geht bei einem Abbruch nichts verloren                                                                                                               |
| Freitext          | Postgres `text`, Anwendungslimit 20.000 Zeichen                                                                                                                                                                                            |
| Warum `text`      | In Postgres ist `text` praktisch unbegrenzt (1 GB) und wird bei Überlänge automatisch ausgelagert und komprimiert. Die Haupttabelle bleibt schmal. `varchar(n)` brächte keinen Vorteil, nur eine spätere Migration bei Änderung des Limits |
| Entwurfssicherung | Der Text wird zusätzlich im `localStorage` gehalten, damit ein versehentlich geschlossener Tab nichts kostet                                                                                                                               |
| Dateien           | Über denselben Pfad wie intern (Task 14), mit `owner_type = submission`, `category = submission`                                                                                                                                           |
| Limits im Portal  | Strenger als intern: 50 MB je Datei, 30 Dateien je Einreichung                                                                                                                                                                             |
| Missbrauchsschutz | Datenbankgestütztes Limit: 5 Einreichungen je Stunde und Kunde                                                                                                                                                                             |
| Nach dem Absenden | Einreichung ist schreibgeschützt; Ergänzungen erfordern eine neue Einreichung                                                                                                                                                              |
| Benachrichtigung  | Mail an den internen Betreuer mit Zusammenfassung, ohne Anhänge                                                                                                                                                                            |

## Tabelle

```txt
customer_submissions
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE SET NULL
  portal_user_id uuid NULL  → customer_portal_users.id ON DELETE SET NULL
  title text NULL
  feedback_text text NULL
  status text NOT NULL DEFAULT 'draft'    CHECK in SUBMISSION_STATUS_VALUES
  submitted_at timestamptz NULL
  reviewed_at timestamptz NULL
  read_at timestamptz NULL                Ungelesen-Markierung fürs CRM
  created_at / updated_at
  INDEX (customer_id, created_at desc)
  INDEX (status) WHERE status = 'submitted'
  UNIQUE INDEX customer_submissions_open_draft_uidx
    ON (customer_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'))
    WHERE status = 'draft'
```

Der letzte Index erzwingt genau **einen** offenen Entwurf je Kunde und Projekt — sonst sammeln sich
halbfertige Einreichungen an, in denen Dateien verschwinden.

## Architektur

```txt
Portal
  GET  /portal/einreichen                     Seite mit Entwurf
  POST /api/portal/submissions/draft          Entwurf holen oder anlegen
  POST /api/portal/submissions/[id]/files/ticket    Upload-Ticket (Portal-Limits)
  POST /api/portal/submissions/[id]/files/complete
  PATCH /api/portal/submissions/[id]          Freitext speichern (Zwischenstand)
  POST /api/portal/submissions/[id]/submit    absenden
        → Status submitted, submitted_at
        → customer_activities (submission_received)
        → Mail an den Betreuer
        → Rate-Limit prüfen
```

Alle Portal-Endpunkte über `withPortalApiAuth`; die Kundenkennung kommt aus der Sitzung, und jeder
Handler prüft zusätzlich, dass die Einreichung zu diesem Kunden gehört.

## Verzeichnisstruktur

```txt
packages/db/migrations/0030_create_customer_submissions.sql
packages/db/src/record-configuration/crm/customer-submissions.ts
packages/common/src/constants/crm/submission-statuses.ts
packages/common/src/constants/crm/portal-upload-limits.ts
packages/common/src/contracts/crm/submission.dto.ts

apps/workspace/src/app/api/portal/submissions/**
apps/workspace/src/server/portal/
  query-handler/get-open-submission.query-handler.ts
  command-handler/{create-submission-draft,update-submission-feedback,submit-submission}.command-handler.ts
  command-handler/{create-portal-file-ticket,complete-portal-file-upload}.command-handler.ts
  services/portal-submission-rate-limit-service.ts
  services/submission-notification-service.ts

apps/workspace/src/app/[locale]/(portal)/portal/einreichen/page.tsx
apps/workspace/src/components/portal/submission/
  submission-form/
  submission-drop-zone/
  submission-file-list/
  submission-feedback-field/
  submission-success/
  submission-history/
apps/workspace/src/hooks/portal/use-feedback-draft.ts
apps/workspace/src/i18n/dictionaries/portal/submission/{de,en}.json
```

## Tickets

### CRM-22-T1 — Migration, Modell, Konstanten

- **Files:** `0030_create_customer_submissions.sql`, `record-configuration/crm/customer-submissions.ts`,
  `constants/crm/{submission-statuses,portal-upload-limits}.ts` + Tests, `contracts/crm/submission.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben inklusive des Entwurfs-Unique-Index
- **Akzeptanz:** Migration idempotent; ein zweiter Entwurf für dieselbe Kombination wird von der
  Datenbank abgelehnt

### CRM-22-T2 — Entwurf und Freitext

- **Files:** `get-open-submission.query-handler.ts`, `create-submission-draft.command-handler.ts`,
  `update-submission-feedback.command-handler.ts`, Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Entwurf holen oder anlegen, mit `ON CONFLICT DO NOTHING` gegen parallele Tabs
  - Freitext speichern mit Limit 20.000 Zeichen, serverseitig geprüft
  - Abgesendete Einreichungen sind nicht mehr änderbar
- **Akzeptanz:**
  - Test: zwei parallele Anfragen erzeugen genau einen Entwurf
  - Test: Änderung nach dem Absenden ergibt 409
  - Test: 20.001 Zeichen werden abgelehnt, 20.000 akzeptiert
  - Test: ein Text mit Umlauten und Emoji kommt unverändert zurück

### CRM-22-T3 — Portal-Upload

- **Files:** `create-portal-file-ticket.command-handler.ts`,
  `complete-portal-file-upload.command-handler.ts`, Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Nutzt die Bausteine aus Task 14, aber mit den strengeren Portal-Limits
  - `owner_type = submission`, `category = submission`, `uploaded_by_side = customer`
  - Anzahl der Dateien je Einreichung begrenzt
- **Akzeptanz:**
  - Test: Portal-Limit greift, auch wenn das interne Limit höher liegt
  - Test: Upload in eine fremde Einreichung ergibt 404
  - Test: Upload in eine abgesendete Einreichung ergibt 409
  - Test: die 31. Datei wird abgelehnt

### CRM-22-T4 — Absenden mit Limit und Benachrichtigung

- **Files:** `submit-submission.command-handler.ts`, `portal-submission-rate-limit-service.ts`,
  `submission-notification-service.ts`, Route + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Datenbankgestütztes Limit nach dem Muster aus
    `reserve-linkedin-post-generator-usage-limit.ts` (atomar, ein Roundtrip)
  - Leere Einreichung (weder Text noch Dateien) wird abgelehnt
  - Mail mit Kundenname, Projekt, Anzahl Dateien und den ersten Zeilen des Feedbacks —
    **ohne** Anhänge
  - Schlägt die Mail fehl, bleibt die Einreichung abgesendet; der Fehler wird protokolliert
- **Akzeptanz:**
  - Test: sechste Einreichung binnen einer Stunde ergibt 429 mit `Retry-After`
  - Test: leere Einreichung ergibt 422
  - Test: fehlgeschlagener Mailversand verhindert das Absenden nicht
  - Test: genau eine Activity je Absendung

### CRM-22-T5 — Portal-Oberfläche

- **Files:** `components/portal/submission/**`, `hooks/portal/use-feedback-draft.ts`,
  `(portal)/portal/einreichen/page.tsx`, `dictionaries/portal/submission/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Ablagezone plus Dateiauswahl-Button, Liste der bereits hochgeladenen Dateien mit Entfernen
  - Freitextfeld mit automatischer Höhe, Zeichenzähler ab 80 Prozent, Entwurfssicherung im
    `localStorage` (in `try/catch`, funktioniert auch in privaten Fenstern)
  - Absenden erst möglich, wenn Text oder Dateien vorhanden sind; Sicherheitsfrage mit Zusammenfassung
  - Erfolgsseite mit Bestätigung und dem, was als Nächstes passiert
  - Verlauf früherer Einreichungen mit Status
  - Tonfall durchweg erklärend: Der Kunde bedient kein Werkzeug, er reicht etwas ein
- **Akzeptanz:**
  - Entwurf überlebt das Neuladen der Seite
  - Verlassen bei laufendem Upload oder ungespeichertem Text warnt
  - Tastaturbedienung vollständig, Fortschritt über Live-Region
  - Mobil ab 360 px bedienbar, Berührungsziele ausreichend groß
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Portalbereich „Einreichen"; im Dashboard erscheinen jetzt die
   Schnellzugriffe „Dateien hochladen" und „Feedback geben".
2. **Bricht nichts:** eine neue Tabelle, neue Portal-Endpunkte. Der interne Dateibereich bleibt
   unverändert — Einreichungsdateien nutzen denselben Speicher, sind aber über `owner_type`
   abgegrenzt und tauchen im internen Dateibereich unter eigener Kategorie auf, nicht vermischt.
3. **Offen:** die Bearbeitersicht auf eingegangene Einreichungen (Task 23). Solange sie fehlt, sind
   Einreichungen nur über den Dateibereich und die Mail-Benachrichtigung sichtbar — deshalb ist die
   Mail in **diesem** Task enthalten und nicht später: Ohne sie ginge eine Einreichung unter.

## End-to-End-Akzeptanz

1. Der Kunde lädt mehrere Dateien hoch und schreibt Feedback; beides bleibt beim Neuladen erhalten.
2. Absenden setzt den Status und sperrt die Einreichung.
3. Der Betreuer erhält eine Mail mit Zusammenfassung.
4. Die Dateien erscheinen im CRM beim richtigen Kunden und Projekt, mit Kategorie „Einreichung".
5. Zu große Dateien, zu viele Dateien und zu langer Text werden verständlich abgelehnt.
6. Eine leere Einreichung lässt sich nicht absenden.
7. Mehr als fünf Einreichungen je Stunde werden begrenzt.
8. Kein Zugriff auf fremde Einreichungen, auch nicht mit geratener Kennung.
9. Der Verlauf zeigt frühere Einreichungen mit Status.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
