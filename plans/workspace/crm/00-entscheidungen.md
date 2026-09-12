# CRM & Kundenportal — Entscheidungen und Gesamtüberblick

> **Scope:** `apps/workspace` (CRM-Bereich + Kundenportal), `packages/db`, `packages/common`,
> neue Pakete `packages/storage`, `packages/mail`
> **Umfang:** 30 Tasks in 7 Phasen, je ein PR
> **Status:** Planung abgeschlossen, Umsetzung nach Task-Reihenfolge

## Context

Das Lead-Management endet beim gewonnenen Lead. Alles danach — Kundenstammdaten, Ansprechpartner,
Projekt-Assets, Zugangsdaten, Aufgaben, Feedbackschleifen — lebt heute außerhalb des Tools in Mail,
Ordnern und Passwortmanagern.

Der CRM-Bereich schließt diese Lücke, dockt am Lead-Management an (gewonnener Lead wird Kunde) und
bringt ein schlankes Kundenportal mit, in dem der Kunde seinen Projektstatus sieht, offene
Bringschulden abhakt, Dateien gebündelt hochlädt und Feedback einreicht.

## Geklärte Entscheidungen

| Bereich             | Entscheidung                                                                              | Begründung                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Datenmodell         | Kunde ist die Klammer (Kontakte, Adresse, Zugangsdaten), darunter n Projekte              | Wiederkäufer und Retainer brauchen mehrere Aufträge unter einem Kunden; nachträgliches Einziehen der Ebene wäre eine Migration über fast alle Tabellen |
| Lead → Kunde        | Lead bleibt bestehen, bekommt `customer_id` + Status `converted`                          | Volle Nachvollziehbarkeit, keine Datenverluste, beidseitige Verlinkung                                                                                 |
| Kundenzugang        | Echter Login über Clerk, getrennte Route-Gruppe `(portal)`                                | Dauerhafter Zugang statt Einmal-Links; Clerk ist bereits im Einsatz                                                                                    |
| Portal-Umfang       | Dashboard + Upload + Freitext-Feedback. Kein Rechnungs- oder Vollzugriff                  | Kleine Angriffsfläche, klarer Nutzen, realistisch umsetzbar                                                                                            |
| Zugangsdaten        | AES-256-GCM, Envelope-Pattern, Klartext nur bei explizitem Anzeigen, Reveal wird geloggt  | Ein DB-Dump allein ist damit wertlos; fremde Kundenzugänge sind auch datenschutzrechtlich heikel                                                       |
| Storage             | Adapter-Interface in `packages/storage`, erste Implementierung Vercel Blob                | Wechsel auf R2 oder eigenen Server ist eine neue Adapter-Datei, kein Domänencode betroffen                                                             |
| Rechtesystem        | Rollen in der DB, Permissions als Const-Objekt im Code, zentrales `can()`                 | Typsicher, keine Zusatzkosten (Clerk-Custom-Roles brauchen in Production das B2B-Add-on), später auf DB-Permissions erweiterbar                        |
| Projektphasen       | Feste Sequenz als Array: `onboarding, design, development, feedback, launch, maintenance` | Zwischenschritt einfügen ist eine Zeile im Array plus CHECK-Migration; der Fortschritt rechnet über den Index automatisch neu                          |
| Stunden             | Buchungen mit Verlauf (Datum, Dauer, Beschreibung, kundensichtbar)                        | Der Kunde sieht nachvollziehbar, wofür Stunden weg sind — das erspart Diskussionen                                                                     |
| Aufgaben            | Eine Tabelle mit `responsible_side` + `visible_to_customer`                               | Eine Liste statt zwei; ein Haken vom Kunden landet direkt beim Bearbeiter                                                                              |
| Freitext-Feedback   | Postgres `text`, App-Limit 20.000 Zeichen per zod                                         | `text` ist in Postgres unbegrenzt (1 GB) und wird per TOAST ausgelagert, bläht die Haupttabelle also nicht auf; `varchar(n)` brächte keinen Vorteil    |
| Chat-Scope          | Ein durchlaufender Thread pro Kunde, `project_id` nullable schon mitangelegt              | Nichts geht unter, keine Auswahl vor dem Schreiben; projektbezogene Threads docken später ohne Migration an                                            |
| Chat-Aktualisierung | Laden beim Öffnen + Neuladen nach dem Senden, dazu Mail-Benachrichtigung                  | Kundenkommunikation läuft in Stunden, nicht Sekunden. Polling kostet dauerhaft Funktionsaufrufe, Echtzeit bräuchte auf Vercel einen externen Dienst    |
| Chat-Anhänge        | Keine — Dateien laufen über den Upload-Bereich                                            | Assets landen sortiert beim Projekt statt verstreut im Gesprächsverlauf                                                                                |
| Filter              | Bewusst spät (Task 30)                                                                    | Erst Status und Tags setzen können; die URL-State-Mechanik der Leads ist danach 1:1 übertragbar                                                        |

## Datenmodell

```txt
customers ──┬── customer_contacts        n Ansprechpartner, einer primär
            ├── customer_tags            freie Tags über Join-Tabelle
            ├── customer_credentials     verschlüsselt
            ├── customer_renewals        Domain/Hosting/SSL/Lizenz + Ablaufdatum
            ├── customer_activities      Timeline/History, analog lead_activities
            ├── customer_portal_users    Clerk-userId → customer, Portal-Rolle
            ├── conversations ── messages  Chat Kunde ↔ Bearbeiter (ein Thread je Kunde)
            ├── retainers ── time_entries  Stundenbuchungen
            └── projects ──┬── tasks                 responsible_side, visible_to_customer
                           ├── files                 polymorph: customer | project | submission
                           └── customer_submissions  Dateien + Freitext + Status

leads.customer_id  →  customers.id      Lead behält seine History
workspace_members                        interne User + Rolle
```

## Rechtekonzept

Drei Ebenen, strikt getrennt:

1. **Identität** — Clerk. Beantwortet nur „wer bist du" (`userId`, E-Mail). Keine Rollen in Clerk.
2. **Rolle** — DB. `workspace_members.role` (`owner | admin | member`) für interne User,
   `customer_portal_users.role` (`customer_owner | customer_member`) für Kunden, immer an genau
   einen Kunden gebunden. CHECK-Constraint aus dem Const-Objekt via `sqlCheckIn`.
3. **Permission** — Code. Const-Objekt in `packages/common/src/constants/crm/permissions.ts`,
   Zuordnung als `ROLE_PERMISSIONS satisfies Record<Role, readonly Permission[]>`.

Ein einziger Einstiegspunkt: `can(actor, permission, resource)`. Nirgends im Code ein
`if (role === "...")`. Damit ist ein späterer Umstieg auf DB-verwaltete Permissions der Austausch
einer Funktion, ohne Call-Sites anzufassen.

**Erweiterbarkeit**

- Neue Permission: eine Zeile im Const-Objekt plus Eintrag in der Rollen-Map. Der Compiler zeigt über
  `satisfies` jede Rolle, bei der sie fehlt. Kein DB-Zugriff nötig.
- Neue Rolle: eine Zeile im Rollen-Const, ein Eintrag in der Map, eine Mini-Migration für die
  CHECK-Constraint.

**Portal-Regel (hart)** — jeder Portal-Query bekommt die `customerId` aus der Session, nie aus
Request-Parametern. Fremdzugriff ist damit strukturell unmöglich, nicht nur durch einen Check verhindert.

## Wiederverwendete Muster

Nichts davon wird neu erfunden:

| Baustein              | Quelle                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Tabellendefinition    | `packages/db/src/record-configuration/leads.ts`                                                       |
| Migrationen           | `packages/db/migrations/0020_*.sql` + `scripts/run-migrations.ts`                                     |
| Enums                 | `packages/common/src/constants/contact/contact-lead-statuses.ts`                                      |
| Activity-Timeline     | `packages/db/src/record-configuration/lead-activities.ts`                                             |
| Schreibpfad           | `update-lead.command-handler.ts` + `api/workspace/leads/route.ts`                                     |
| Fehlercodes           | `packages/common/src/constants/leads/errors/lead-error-codes.ts`                                      |
| Listen-UI + URL-State | `components/workspace/leads/table/**`, `lead-list-query-params.ts`                                    |
| Create/Edit-Dialog    | `components/workspace/leads/form/lead-form-dialog/**`                                                 |
| Badges                | `components/workspace/shared/lead-badge/**`                                                           |
| Upload-Route          | `api/workspace/leads/import/route.ts`                                                                 |
| ZIP                   | `apps/web/src/client/linkedin-post/services/linkedin-post-zip-download-service.ts`                    |
| HMAC / Token          | `apps/web/src/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-key-service.ts` |
| DB-Rate-Limit         | `packages/db/src/linkedin-post/reserve-linkedin-post-generator-usage-limit.ts`                        |
| Mail                  | `apps/web/src/server/services/mail/**`                                                                |

## Task-Übersicht

| Nr  | Task                           | Phase        | Aufwand |
| --- | ------------------------------ | ------------ | ------- |
| 01  | Datenmodell Kunden             | Fundament    | M       |
| 02  | Rechtesystem                   | Fundament    | M       |
| 03  | Kundenliste                    | Fundament    | M       |
| 04  | Kunde anlegen und bearbeiten   | Fundament    | M       |
| 05  | Kundendetail-Panel             | Fundament    | M       |
| 06  | Ansprechpartner                | Fundament    | S       |
| 07  | Status und Tags                | Fundament    | M       |
| 08  | Lead zu Kunde                  | Fundament    | L       |
| 09  | Projekte Datenmodell           | Projekte     | S       |
| 10  | Projekte UI                    | Projekte     | M       |
| 11  | Aufgaben                       | Projekte     | M       |
| 12  | Onboarding-Checkliste          | Projekte     | S       |
| 13  | Storage-Adapter                | Dateien      | M       |
| 14  | Dateien Datenmodell und Upload | Dateien      | L       |
| 15  | Dateien UI                     | Dateien      | L       |
| 16  | Bulk Upload und Download       | Dateien      | M       |
| 17  | Credentials Crypto             | Zugangsdaten | M       |
| 18  | Credentials UI                 | Zugangsdaten | L       |
| 19  | Mail-Package                   | Portal       | S       |
| 20  | Portal-Zugang                  | Portal       | L       |
| 21  | Portal-Dashboard               | Portal       | L       |
| 22  | Portal Upload und Feedback     | Portal       | L       |
| 23  | Submissions im CRM             | Portal       | M       |
| 24  | Nachrichten Datenmodell        | Chat         | M       |
| 25  | Chat im CRM                    | Chat         | M       |
| 26  | Chat im Portal                 | Chat         | M       |
| 27  | Stundenbuchungen               | Ergänzung    | M       |
| 28  | Renewal-Tracking               | Ergänzung    | M       |
| 29  | Aktivität und History          | Ergänzung    | M       |
| 30  | Filter und Suche               | Ergänzung    | M       |

Aufwand: S rund ein halber Tag, M rund ein Tag, L rund zwei Tage.
Jeder Task ist ein eigener PR auf Branch `feat/crm-<slug>`. Kein Task startet, bevor der vorherige
grün gemerged ist.

## Deploybarkeit (verbindlich)

Jeder Task muss **für sich allein deploybar** sein: nach dem Merge ist die App in einem konsistenten,
benutzbaren Zustand — kein halbfertiger Flow, kein toter Button, keine Route ins Leere. Jede Task-Datei
hat dafür einen Abschnitt `## Deploy-Sicherheit`, der drei Fragen beantwortet:

1. **Was ist nach dem Merge live sichtbar?** (oft: nichts — reine Fundament-Tasks)
2. **Warum bricht nichts Bestehendes?** (Migrationen additiv, keine bestehende Spalte geändert oder
   entfernt, keine Signatur eines genutzten Handlers verändert)
3. **Was fehlt noch und wie ist das abgesichert?** (Feature-Flag, „Coming soon"-Badge im Sidebar-Muster
   `path: null`, oder die Sektion wird schlicht noch nicht gerendert)

Daraus folgen drei Regeln für alle Tasks:

- **Migrationen sind additiv.** Neue Tabellen und `NULL`-bare Spalten mit Default. Kein `DROP`, kein
  `NOT NULL` auf eine bestehende befüllte Spalte, kein Umbenennen in demselben Task, der die Spalte
  noch liest. Rückbau erst, wenn der letzte Leser weg ist.
- **UI wird erst verlinkt, wenn sie funktioniert.** Ein neuer Sidebar-Eintrag oder Button erscheint im
  selben Task, der sein Ziel fertigstellt — sonst mit `path: null` als „Coming soon" (bestehendes
  Muster in `workspace-sidebar-items.ts`).
- **Unfertige Flows hinter Feature-Flag**, statt halbfertiger Produktivlogik (Projektregel aus der
  Root-`AGENTS.md`).

## Migrationen

Fortlaufend ab `0021` (höchste bestehende ist `0020_add_discovery_call_project_scope.sql`).
Alle sind **additiv**: neue Tabellen, neue nullable Spalten mit Vorgabewert, erweiterte (nie
verengte) CHECK-Constraints. Kein `DROP`, kein Umbenennen, kein `NOT NULL` auf eine bestehende
befüllte Spalte.

| Nr   | Datei                               | Task |
| ---- | ----------------------------------- | ---- |
| 0021 | `create_customers`                  | 01   |
| 0022 | `create_workspace_members`          | 02   |
| 0023 | `create_customer_tags`              | 07   |
| 0024 | `link_leads_to_customers`           | 08   |
| 0025 | `create_projects`                   | 09   |
| 0026 | `create_tasks`                      | 11   |
| 0027 | `create_files`                      | 14   |
| 0028 | `create_customer_credentials`       | 18   |
| 0029 | `create_customer_portal_users`      | 20   |
| 0030 | `create_customer_submissions`       | 22   |
| 0031 | `create_conversations`              | 24   |
| 0032 | `add_notification_columns`          | 26   |
| 0033 | `create_retainers_and_time_entries` | 27   |
| 0034 | `create_customer_renewals`          | 28   |
| 0035 | `add_customer_search_index`         | 30   |

Die Nummern sind Planwerte. Wird ein Task umsortiert, wird die Nummer beim Schreiben der Migration
neu vergeben — nie blind aus dem Plan übernehmen.

## Neue Dependencies

Bewusst sparsam, jeweils in genau einem Paket:

| Paket              | Dependency     | Task | Begründung                                                          |
| ------------------ | -------------- | ---- | ------------------------------------------------------------------- |
| `packages/storage` | `@vercel/blob` | 13   | Einziger Ort mit Anbieterkenntnis; Austausch ist eine Adapter-Datei |
| `apps/workspace`   | `fflate`       | 16   | In `apps/web` bereits im Einsatz, keine unbekannte Abhängigkeit     |

Verschlüsselung (Task 17) läuft bewusst über Node `crypto` aus der Standardbibliothek — keine
zusätzliche Abhängigkeit für sicherheitskritischen Code.

## Bewusst zurückgestellt

| Thema                                               | Begründung                                                                                                                          | Wieder aufnehmen wenn                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Dokumente, Angebote, Rechnungen                     | Soll perspektivisch über die Lexware-Office-API laufen statt als eigene Ablage; aktuell nicht relevant                              | Lexware angebunden wird oder Belege doch im CRM liegen sollen |
| Annotationen im Bild (Kommentar-Pins)               | Laut Recherche der größte Hebel gegen Revisionsschleifen, aber eigenes Viewer-UI mit Koordinatensystem und Zoom — eine eigene Phase | Feedbackrunden über Freitext hinaus präzisiert werden müssen  |
| Datei-Versionierung                                 | `files` bekommt in Task 14 bereits einen eigenen `storage_key` pro Objekt; Versionen wären eine zusätzliche Tabelle                 | Mehrfach-Uploads derselben Datei zu Verwechslungen führen     |
| Kommentare pro Datei / Einzelfreigabe               | Sammelfeedback pro Runde reicht für den aktuellen Ablauf                                                                            | Mehr als rund zehn Dateien pro Runde üblich werden            |
| DSGVO-Löschkonzept (Auskunft, Löschfristen, Export) | Kein Blocker für den MVP, aber Pflicht sobald echte Kundendaten und Portalnutzer produktiv sind                                     | **Vor dem ersten echten Kunden im Portal**                    |

## Architektur-Gate

Bewusste Abweichungen und Punkte, die beim Bauen aktiv geprüft werden:

- **`record-configuration/` wächst stark** (heute 9 Modelle, durch das CRM rund 14 weitere). Deshalb
  Unterordner `record-configuration/crm/` mit eigenem Barrel — bewusste Abweichung von der bisher
  flachen Struktur.
- **Zwei Auth-Welten in einer App.** `(app)` und `(portal)` teilen die Clerk-Instanz, aber nie einen
  Query-Handler. Portal-Handler liegen unter `src/server/portal/`.
- **`proxy.ts` lässt `/api/*` komplett durch.** Portal-Routen müssen ihre Prüfung selbst mitbringen.
- **Neue Dependencies:** `@vercel/blob` (Task 13), `fflate` (Task 16, in `apps/web` bereits vorhanden).
  Verschlüsselung bewusst ohne neue Dependency über Node `crypto`.
- **Neue AGENTS.md** für `(app)/crm/`, `components/workspace/crm/`, `(portal)/` und
  `packages/storage/`, plus Eintrag dieser Scopes in die Index-Tabelle der Root-`AGENTS.md`.
