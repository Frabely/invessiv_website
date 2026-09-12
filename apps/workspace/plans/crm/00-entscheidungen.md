# CRM & Kundenportal — Entscheidungen und Gesamtüberblick

> **Scope:** `apps/workspace` (CRM-Bereich + Kundenportal), `packages/db`, `packages/common`,
> neue Pakete `packages/storage`, `packages/mail`
> **Umfang:** 34 Tasks in **16 Merge-Einheiten** (Unterordner), ~39 Personentage
> **Status:** Planung abgeschlossen und überarbeitet, Umsetzung ordnerweise

## So wird umgesetzt

Jeder Unterordner ist **eine Merge-Einheit**: umsetzen → reviewen → in `master` mergen → nächster
Ordner. Jeder Ordner hat eine `README.md` mit Ziel, enthaltenen Tasks, geschätztem Review-Umfang,
Merge-Gate und dem, was bewusst noch offen bleibt.

Die **Ordnernummer ist die Merge-Reihenfolge**, die **Task-Nummer die Identität** — Task 08 heißt
überall Task 08, liegt aber in Ordner 04. Querverweise im Plan nennen immer die Task-Nummer.

Sortiert ist nach MVP-Nutzen: erst was den Alltag trägt (Kundenakte, Lead-Brücke, Projekte und
Aufgaben, Portal), dann was nachrüstbar ist (Filter, Mail senden). Ordner 16 kann ohne Folgen
entfallen.

Zielgröße je Ordner sind 30 bis 120 geänderte Dateien. Wo das nicht ging, weil einzelne Teile für
sich keinen Nutzen hätten (Ordner 09, Dateien) wurde die Größe bewusst in Kauf genommen — die
Alternative wären Merges ohne jeden Wert.

## Context

Das Lead-Management endet beim gewonnenen Lead. Alles danach — Kundenstammdaten, Ansprechpartner,
Projekt-Assets, Zugangsdaten, Aufgaben, Feedbackschleifen — lebt heute außerhalb des Tools in Mail,
Ordnern und Passwortmanagern.

Der CRM-Bereich schließt diese Lücke, dockt am Lead-Management an (gewonnener Lead wird Kunde) und
bringt ein schlankes Kundenportal mit, in dem der Kunde seinen Projektstatus sieht, offene
Bringschulden abhakt, Dateien gebündelt hochlädt, freigegebene Ergebnisse herunterlädt und Feedback
einreicht.

## Geklärte Entscheidungen

| Bereich             | Entscheidung                                                                                          | Begründung                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datenmodell         | Kunde ist die Klammer (Kontakte, Adresse, Zugangsdaten), darunter n Projekte                          | Wiederkäufer und Retainer brauchen mehrere Aufträge unter einem Kunden; nachträgliches Einziehen der Ebene wäre eine Migration über fast alle Tabellen         |
| Kundennummer        | Ganzzahl aus einer Sequenz, Anzeige als `K0001`; sortiert wird auf der Zahl                           | Sprechbar und tippbar am Telefon, auf der Rechnung, im Ordnernamen. Die `uuid` bleibt Primärschlüssel. Belege tragen das Jahr (`AG2026-001`), Stammdaten nicht |
| Kundentyp           | `company` \| `individual`; `display_name` ist Pflicht, `company_name` optional                        | Privatkunden und Freiberufler haben keinen Firmennamen. Ohne den Typ stünde ein Personenname im Feld Firmenname                                                |
| Firmenname          | **Kein** Unique-Index, stattdessen Duplikat-Warnung im Dialog                                         | Zwei echte „Müller GmbH" in verschiedenen Städten sind gültig. Eine Constraint erzwingt sonst verfälschte Namen, und die sind nicht zu reparieren              |
| Kundenstatus        | `onboarding, active, maintenance, on_hold, archived` als Const-Objekt im Code                         | Fünf strukturelle Werte, an denen Logik hängt (archiviert ausblenden). Kein `prospect` — ein Kunde entsteht aus einem gewonnenen Lead. `on_hold` wie bei Leads |
| Status als Tabelle  | Bewusst **nicht** jetzt; `lead_status` bleibt vollständig unangetastet                                | Exhaustiveness-Prüfung, Badge-Töne und Übersetzungen bleiben compile-sicher. Der Umstieg auf eine Tabelle wäre später additiv (Vorlage: `lead_categories`)     |
| Kategorie           | `customers.category_id` auf die **bestehende** Tabelle `lead_categories`                              | Ein Vokabular für Leads und Kunden — Task 08 übernimmt die Kategorie bei der Konvertierung, „Kanzlei" bleibt „Kanzlei"                                         |
| Löschen             | Soft-Delete über `deleted_at`, nur an `customers` und `projects`                                      | Zeitbuchungen sind Abrechnungsgrundlage, Einreichungen Freigabe-Nachweise. Kind-Abfragen sind ohnehin über den Parent gescopet — 14 Spalten wären Overhead     |
| Hartes Löschen      | Nur aus `archived` heraus, mit expliziter Aufräumroutine für Storage-Objekte                          | Postgres kann keine Blobs löschen. Ein reiner Cascade lässt sie für immer liegen, und danach ist ihre Zuordnung nicht mehr rekonstruierbar                     |
| Aktivitäten         | **Eine** generische `activities`-Tabelle für Leads und Kunden; `lead_activities` zieht um             | Aus einem Lead wird ein Kunde — die Historie soll durchlaufen. Zwei Tabellen plus zwei Timelines wären dieselbe Sache doppelt                                  |
| Activity-Service    | Entsteht in Task 01a, **vor** dem ersten schreibenden Handler                                         | Sonst hätte Task 29 sechs Handler nachträglich umstellen müssen — eingeplante Nacharbeit, die so entfällt                                                      |
| Lead → Kunde        | Lead bleibt bestehen, bekommt `customer_id`. **Kein** neuer Lead-Status                               | `customer_id IS NOT NULL` ist die Tatsache selbst und kann nicht abdriften. Ein 18. Status hätte Migration, Badge-Ton und zwei Dictionaries gekostet           |
| Lead-Zusatzkontakte | Bleiben am Lead, werden nicht kopiert; die Kundenakte verlinkt zurück                                 | Der Lead existiert weiter, es geht nichts verloren. Kopieren erzeugte Dubletten                                                                                |
| Beträge             | `default_hourly_rate_cents` am Kunden, `budget_cents` und `hourly_rate_cents` am Projekt              | Lexware macht die Rechnung — die Vorschau („offene Projekte: 12.400 €") lebt nur im CRM                                                                        |
| Dateien             | Drei nullbare Spalten mit echtem Fremdschlüssel statt `owner_type` + `owner_id`                       | Eine polymorphe Kennung ohne Fremdschlüssel lässt verwaiste Zeilen zu; die Datenbank könnte es nicht verhindern                                                |
| Kundenzugang        | Echter Login über Clerk, getrennte Route-Gruppe `(portal)`, Clerk auf „Restricted"                    | Dauerhafter Zugang statt Einmal-Links; Clerk ist bereits im Einsatz. Ohne „Restricted" könnte jeder über `/sign-up` ein Konto anlegen                          |
| Portal-Login        | E-Mail **pro Kunde** eindeutig, Auflösung liefert eine Liste                                          | Task 06 hält fest, dass eine Person bei zwei Kunden Kontakt sein kann. Nachträglich müsste jeder Portal-Handler angefasst werden                               |
| Portal-Umfang       | Dashboard, Upload, Freitext-Feedback **und Download freigegebener Ergebnisse**. Kein Rechnungszugriff | Ohne Downloads bleibt das Portal einseitig — Ergebnisse zu holen ist meist der Grund, warum ein Kunde es öffnet                                                |
| Zugangsdaten        | AES-256-GCM, Envelope-Pattern, Klartext nur bei explizitem Anzeigen, Reveal wird geloggt              | Ein DB-Dump allein ist damit wertlos; fremde Kundenzugänge sind auch datenschutzrechtlich heikel                                                               |
| Hauptschlüssel      | Zusätzlich im eigenen Passwortmanager hinterlegt, bevor der erste Datensatz entsteht                  | Der Plan kann Schlüssel rotieren, aber nicht verlieren: eine geleerte Vercel-Env macht alle Zugangsdaten dauerhaft unlesbar                                    |
| Storage             | Adapter-Interface in `packages/storage`, erste Implementierung Vercel Blob                            | Wechsel auf R2 oder eigenen Server ist eine neue Adapter-Datei, kein Domänencode betroffen                                                                     |
| ZIP-Grenzen         | 100 Dateien und 300 MB je Archiv                                                                      | Die bindende Schranke ist die Function-Laufzeit, nicht der Speicher. 2 GB laufen zuverlässig in den Timeout — mitten im Download                               |
| Rechtesystem        | Rollen in der DB, Permissions als Const-Objekt im Code, zentrales `can()`                             | Typsicher, keine Zusatzkosten (Clerk-Custom-Roles brauchen in Production das B2B-Add-on), später auf DB-Permissions erweiterbar                                |
| Zugangsregel        | Eine `workspace_members`-Zeile genügt, auch ohne Allowlist-Eintrag                                    | Sonst bliebe die Env-Allowlist das eigentliche Gate und die Rollen-Tabelle Dekoration; ein zweiter Nutzer erforderte einen Deploy                              |
| Projektphasen       | Feste Sequenz als Array: `onboarding, design, development, feedback, launch, maintenance`             | Zwischenschritt einfügen ist eine Zeile im Array plus CHECK-Migration; der Fortschritt rechnet über den Index automatisch neu                                  |
| Stunden             | Buchungen mit Verlauf (Datum, Dauer, Beschreibung, kundensichtbar)                                    | Der Kunde sieht nachvollziehbar, wofür Stunden weg sind — das erspart Diskussionen                                                                             |
| Aufgaben            | Eine Tabelle mit `responsible_side` + `visible_to_customer`, **kein** `sort_order`                    | Eine Liste statt zwei; ein Haken vom Kunden landet direkt beim Bearbeiter. Eine Spalte ohne Endpunkt und Bedienung wäre toter Ballast                          |
| Aufgabenübersicht   | Eigene Route über alle Kunden plus Dashboard-Block                                                    | Ohne sie bliebe nach allen Tasks „was ist diese Woche fällig" unbeantwortet — und die Tagesplanung außerhalb des Tools                                         |
| Vorlagen-Aufgaben   | Speichern ihren `title_key`, nicht nur den aufgelösten Text                                           | Sonst sähe ein Kunde mit englischem Portal deutsche Aufgabentitel, weil beim Anwenden die Locale des Anwendenden gilt                                          |
| Freitext-Feedback   | Postgres `text`, App-Limit 20.000 Zeichen per zod                                                     | `text` ist in Postgres unbegrenzt (1 GB) und wird per TOAST ausgelagert, bläht die Haupttabelle also nicht auf; `varchar(n)` brächte keinen Vorteil            |
| Chat-Scope          | Ein durchlaufender Thread pro Kunde, `project_id` nullable schon mitangelegt                          | Nichts geht unter, keine Auswahl vor dem Schreiben; projektbezogene Threads docken später ohne Migration an                                                    |
| Chat-Aktualisierung | Laden beim Öffnen + Neuladen nach dem Senden, dazu Mail-Benachrichtigung                              | Kundenkommunikation läuft in Stunden, nicht Sekunden. Polling kostet dauerhaft Funktionsaufrufe, Echtzeit bräuchte auf Vercel einen externen Dienst            |
| Chat-Anhänge        | Keine — Dateien laufen über den Upload-Bereich                                                        | Assets landen sortiert beim Projekt statt verstreut im Gesprächsverlauf                                                                                        |
| Mail senden         | Beide Richtungen, protokolliert, **ohne** Mail-Eingang. Letzter Task, niedrigste Priorität            | Der Chat bleibt der primäre Kanal. Eine Mail muss trotzdem möglich sein — mit Spur im CRM, im Gegensatz zum eigenen Postfach                                   |
| Geteilte Listen-UI  | Generische Komponenten der Leads wandern vor Task 03 nach `components/workspace/shared/`              | Sonst wären sieben Komponenten doppelt und würden auseinanderlaufen. Der Umzug ist risikoarm, solange es genau einen Aufrufer gibt                             |
| Suche               | `pg_trgm` mit GIN-Index statt generierter `tsvector`-Spalte                                           | Volltextsuche matcht nur Wortstämme — „part" fände „Partner GmbH" nicht. Genau das war als Kriterium versprochen                                               |
| Filter              | Bewusst spät (Task 30)                                                                                | Erst Status, Tags und Kategorie setzen können; die URL-State-Mechanik der Leads ist danach 1:1 übertragbar                                                     |

## Datenmodell

```txt
activities ──┬── leads.id        (Akquise-Historie)
             └── customers.id    (ab der Konvertierung beides)

customers ──┬── customer_contacts        n Ansprechpartner, einer primär
            ├── customer_tags            freie Tags über Join-Tabelle
            ├── customer_credentials     verschlüsselt
            ├── customer_renewals        Domain/Hosting/SSL/Lizenz + Ablaufdatum
            ├── customer_portal_users    Clerk-userId → customer, Portal-Rolle
            ├── conversations ── messages  Chat Kunde ↔ Bearbeiter (ein Thread je Kunde)
            ├── retainers ── time_entries  Stundenbuchungen
            ├── files                    customer_id | project_id | submission_id (echte FKs)
            └── projects ──┬── tasks                 responsible_side, visible_to_customer
                           └── customer_submissions  Dateien + Freitext + Status

customers.category_id  →  lead_categories.id    geteiltes Vokabular mit den Leads
leads.customer_id      →  customers.id          Lead behält seine History
workspace_members                                interne User + Rolle
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

Die Env-Allowlist ist ab Task 02 **nur noch Bootstrap** für den ersten Owner. Eine vorhandene
`workspace_members`-Zeile öffnet den Zugang auch ohne Allowlist-Eintrag — sonst wäre die Rollen-Ebene
wirkungslos und jeder neue Mitarbeiter bräuchte einen Deploy.

**Portal-Regel (hart)** — jeder Portal-Query bekommt die `customerId` aus der Session, nie aus
Request-Parametern. Fremdzugriff ist damit strukturell unmöglich, nicht nur durch einen Check verhindert.

## Wiederverwendete Muster

Nichts davon wird neu erfunden:

| Baustein              | Quelle                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Tabellendefinition    | `packages/db/src/record-configuration/leads.ts`                                                         |
| Migrationen           | `packages/db/migrations/0020_*.sql` + `scripts/run-migrations.ts`                                       |
| Enums                 | `packages/common/src/constants/contact/contact-lead-statuses.ts`                                        |
| Kategorien-Tabelle    | `packages/db/src/record-configuration/lead-categories.ts` (wird **mitgenutzt**, nicht kopiert)          |
| Activity-Service      | `apps/workspace/src/server/workspace/leads/services/lead-activity-service.ts`                           |
| Schreibpfad           | `update-lead.command-handler.ts` + `api/workspace/leads/route.ts`                                       |
| Fehlercodes           | `packages/common/src/constants/leads/errors/lead-error-codes.ts`                                        |
| Ausblenden per Filter | `lead-filter.query-handler.ts:43-48` (dort für `archived`, wird für konvertierte Leads erweitert)       |
| Listen-UI + URL-State | `components/workspace/leads/table/**`, `lead-list-query-params.ts` — wandern in Task 02a nach `shared/` |
| Create/Edit-Dialog    | `components/workspace/leads/form/lead-form-dialog/**`                                                   |
| Badges                | `components/workspace/shared/lead-badge/**`                                                             |
| Upload-Route          | `api/workspace/leads/import/route.ts`                                                                   |
| ZIP                   | `apps/web/src/client/linkedin-post/services/linkedin-post-zip-download-service.ts`                      |
| HMAC / Token          | `apps/web/src/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-key-service.ts`   |
| DB-Rate-Limit         | `packages/db/src/linkedin-post/reserve-linkedin-post-generator-usage-limit.ts`                          |
| Mail                  | `apps/web/src/server/services/mail/**`                                                                  |

## Merge-Einheiten

| #   | Status | Ordner                    | Tasks               | Aufwand   | Review | Nach dem Merge live                                  |
| --- | ------ | ------------------------- | ------------------- | --------- | ------ | ---------------------------------------------------- |
| 01  | offen  | `01-fundament`            | 01, 01a, 02, 02a    | ~4 Tage   | ~90    | nichts — reines Fundament, Verhalten identisch       |
| 02  | offen  | `02-kundenliste`          | 03                  | ~1 Tag    | ~45    | Sidebar „CRM", leere Kundenliste mit Empty-State     |
| 03  | offen  | `03-kundenakte`           | 04, 05              | ~2 Tage   | ~55    | Anlegen, Bearbeiten, Detailpanel, Löschen            |
| 04  | offen  | `04-lead-bruecke`         | 08                  | ~2 Tage   | ~30    | gewonnener Lead wird Kunde, Historie wandert mit     |
| 05  | offen  | `05-kontakte-status-tags` | 06, 07              | ~1,5 Tage | ~65    | Ansprechpartner, Statuswechsel, Tags                 |
| 06  | offen  | `06-projekte-aufgaben`    | 09, 10, 11, 11a, 12 | ~4 Tage   | ~120   | Projekte mit Phasen, Aufgaben, „Fällig diese Woche"  |
| 07  | offen  | `07-mail-package`         | 19                  | ~0,5 Tage | ~20    | nichts — Refactoring, Kontaktformular unverändert    |
| 08  | offen  | `08-portal-zugang`        | 20, 21              | ~4 Tage   | ~75    | Kunde loggt sich ein und sieht sein Dashboard        |
| 09  | offen  | `09-dateien`              | 13, 14, 15, 16      | ~6 Tage   | ~120   | Dateibereich mit Upload, Vorschau, ZIP, Freigabe     |
| 10  | offen  | `10-portal-einreichungen` | 22, 23              | ~3 Tage   | ~90    | Kunde reicht ein und lädt Ergebnisse, Eingang im CRM |
| 11  | offen  | `11-zugangsdaten`         | 17, 18              | ~3 Tage   | ~45    | verschlüsselte Zugangsdaten mit Reveal-Protokoll     |
| 12  | offen  | `12-chat`                 | 24, 25, 26          | ~3 Tage   | ~100   | Unterhaltung auf beiden Seiten, Benachrichtigungen   |
| 13  | offen  | `13-renewals`             | 28                  | ~1 Tag    | ~40    | Ablaufdaten, Dashboard-Widget, täglicher Cron        |
| 14  | offen  | `14-stunden-und-verlauf`  | 27, 29              | ~2 Tage   | ~80    | Stundenkontingent und sichtbare Timeline             |
| 15  | offen  | `15-filter-und-suche`     | 30                  | ~1 Tag    | ~35    | Filterleiste und Suche über der Kundenliste          |
| 16  | offen  | `16-mail-senden`          | 31                  | ~1 Tag    | ~25    | Mail aus Akte und Portal — **optional**              |

Status-Werte: `offen` · `läuft` · `im Review` · `gemerged`. Die Spalte wird beim Merge eines Ordners
gepflegt (Regel 5 in `AGENTS.md`) — sie ist die einzige Stelle, an der eine frische Session ablesen
kann, wo es weitergeht.

Aufwand: S rund ein halber Tag, M rund ein Tag, L rund zwei Tage. „Review" ist die geschätzte Zahl
geänderter Dateien — ein Planwert, keine Messung.

Jeder Ordner ist ein PR auf Branch `feat/crm-<ordner-slug>`; die einzelnen Tasks darin sind Commits.
Kein Ordner startet, bevor der vorherige grün gemerged ist. Details und Merge-Gate je Ordner in
dessen `README.md`.

**Zur Reihenfolge**

- **Task 08 (Lead-Brücke) steht früh**, vor Kontakten und Tags: er braucht nur die Tabelle
  `customer_contacts` aus Task 01, nicht die Kontakte-Oberfläche — und die Lead-Konvertierung ist
  die erste Funktion mit echtem Alltagsnutzen.
- **Das Portal hat Vorrang** vor Zugangsdaten, Chat, Stunden und Renewals. Die Kette dorthin
  (Kontakte → Projekte/Aufgaben → Mail → Portal → Dateien → Einreichungen) wird deshalb nicht von
  unabhängigen Features unterbrochen.
- **Ordner 07, 11 und 13 sind unabhängig** und könnten jederzeit dazwischen laufen, falls sich die
  Priorität verschiebt. Ordner 07 muss lediglich vor 08, 10 und 13 liegen.
- **Ordner 13 vor 14**, weil Task 29 `recordFieldChanges` in `update-renewal` aus Task 28 verdrahtet.
- **Ordner 16 ist optional.** Erweist sich der Chat als ausreichend, endet der Plan nach Ordner 15.

## Deploybarkeit (verbindlich)

Jeder **Ordner** muss für sich allein deploybar sein: nach dem Merge ist die App in einem
konsistenten, benutzbaren Zustand — kein halbfertiger Flow, kein toter Button, keine Route ins Leere.
Die meisten einzelnen Tasks sind es ebenfalls; wo nicht (Ordner 09 und 12), ist genau das der Grund,
warum sie zusammen in einem Ordner liegen.

Jede Task-Datei hat dafür einen Abschnitt `## Deploy-Sicherheit`, der drei Fragen beantwortet:

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

Zwei Tasks fassen bestehenden Code in der Tiefe an — **01a** (Aktivitäten ziehen um) und **02a**
(Listen-Komponenten ziehen um). Bei beiden ist der Nachweis derselbe: Die bestehenden Tests bleiben
**inhaltlich unverändert** und grün. Angepasst werden ausschließlich Importpfade.

## Migrationen

Fortlaufend ab `0021` (höchste bestehende ist `0020_add_discovery_call_project_scope.sql`).
Alle sind **additiv**: neue Tabellen, neue nullable Spalten mit Vorgabewert, erweiterte (nie
verengte) CHECK-Constraints, nachgezogene Fremdschlüssel. Kein `DROP`, kein Umbenennen, kein
`NOT NULL` auf eine bestehende befüllte Spalte.

Die Nummern folgen der **Merge-Reihenfolge der Ordner**, nicht der Task-Nummer — Migrationen laufen
in der Reihenfolge, in der sie in `master` landen:

| Nr   | Datei                               | Task | Ordner |
| ---- | ----------------------------------- | ---- | ------ |
| 0021 | `create_customers`                  | 01   | 01     |
| 0022 | `create_activities`                 | 01a  | 01     |
| 0023 | `create_workspace_members`          | 02   | 01     |
| 0024 | `link_leads_to_customers`           | 08   | 04     |
| 0025 | `create_customer_tags`              | 07   | 05     |
| 0026 | `create_projects`                   | 09   | 06     |
| 0027 | `create_tasks`                      | 11   | 06     |
| 0028 | `create_customer_portal_users`      | 20   | 08     |
| 0029 | `create_files`                      | 14   | 09     |
| 0030 | `create_customer_submissions`       | 22   | 10     |
| 0031 | `create_customer_credentials`       | 18   | 11     |
| 0032 | `create_conversations`              | 24   | 12     |
| 0033 | `add_notification_columns`          | 26   | 12     |
| 0034 | `create_customer_renewals`          | 28   | 13     |
| 0035 | `create_retainers_and_time_entries` | 27   | 14     |
| 0036 | `add_customer_search_index`         | 30   | 15     |

Die Nummern sind Planwerte. Wird ein **Ordner** umsortiert, werden die Nummern beim Schreiben der
Migration neu vergeben — nie blind aus dem Plan übernehmen. Vor dem Schreiben prüfen, welche Nummer
im Repository tatsächlich die höchste ist.

**Nachgezogene Fremdschlüssel** (weil die Zieltabelle beim Anlegen der Spalte noch nicht existierte):
`activities.project_id` in Task 09, `files.submission_id` in Task 22.

## Neue Dependencies

Bewusst sparsam, jeweils in genau einem Paket:

| Paket              | Dependency     | Task | Begründung                                                          |
| ------------------ | -------------- | ---- | ------------------------------------------------------------------- |
| `packages/storage` | `@vercel/blob` | 13   | Einziger Ort mit Anbieterkenntnis; Austausch ist eine Adapter-Datei |
| `apps/workspace`   | `fflate`       | 16   | In `apps/web` bereits im Einsatz, keine unbekannte Abhängigkeit     |

Verschlüsselung (Task 17) läuft bewusst über Node `crypto` aus der Standardbibliothek — keine
zusätzliche Abhängigkeit für sicherheitskritischen Code. Die Suche (Task 30) nutzt die
Postgres-Extension `pg_trgm`, also ebenfalls keine neue npm-Abhängigkeit.

## Vor dem ersten echten Kunden (verbindlich)

Diese Punkte sind kein Code, aber blockierend, sobald ein Kunde Task 20 erreicht:

- **Clerk auf „Restricted"** stellen, sonst kann jeder über `/sign-up` ein Konto anlegen.
- **Hauptschlüssel für die Zugangsdaten** zusätzlich im eigenen Passwortmanager sichern (Task 17).
- **DSGVO-Grundlagen**: Auskunfts- und Löschkonzept, Löschfristen, Datenexport. Kein MVP-Blocker,
  aber Pflicht, sobald echte Kundendaten und Portalnutzer produktiv sind — und das passiert **in**
  diesem Plan, nicht danach.
- **`apps/workspace/vercel.json`** am richtigen Ort (Root Directory des Vercel-Projekts), sonst läuft
  der Renewal-Cron nie an (Task 28).

## Bewusst zurückgestellt

| Thema                                      | Begründung                                                                                                                          | Wieder aufnehmen wenn                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Dokumente, Angebote, Rechnungen            | Soll perspektivisch über die Lexware-Office-API laufen statt als eigene Ablage; aktuell nicht relevant                              | Lexware angebunden wird oder Belege doch im CRM liegen sollen     |
| **Mail-Eingang** (BCC-Postfach, Zuordnung) | Task 31 sendet nur. Eingehende Mails einem Kunden zuzuordnen wäre ein eigenes Vorhaben; `messages.type` hält den Weg offen          | Der Chat im Alltag nicht angenommen wird und Kunden weiter mailen |
| Kundenwechsler im Portal                   | Eine Person bei zwei Kunden ist schemaseitig vorbereitet (Unique pro Kunde), die Oberfläche fehlt bewusst                           | Die erste Person tatsächlich bei zwei Kunden Zugang braucht       |
| `lead_status` als Tabelle                  | `lead_status` wird in diesem Plan gar nicht angefasst. Der Umstieg wäre additiv, Vorlage `lead_categories`                          | Die Pipeline häufiger geändert wird als ein Deploy vertretbar ist |
| Handsortierung von Aufgaben                | `sort_order` gestrichen, weil es weder Endpunkt noch Bedienung gäbe. Nachträglich ergänzen ist eine additive Migration              | Die Reihenfolge in der Bringschuld-Checkliste Aussage bekommt     |
| Annotationen im Bild (Kommentar-Pins)      | Laut Recherche der größte Hebel gegen Revisionsschleifen, aber eigenes Viewer-UI mit Koordinatensystem und Zoom — eine eigene Phase | Feedbackrunden über Freitext hinaus präzisiert werden müssen      |
| Datei-Versionierung                        | `files` bekommt in Task 14 bereits einen eigenen `storage_key` pro Objekt; Versionen wären eine zusätzliche Tabelle                 | Mehrfach-Uploads derselben Datei zu Verwechslungen führen         |
| Kommentare pro Datei / Einzelfreigabe      | Sammelfeedback pro Runde reicht für den aktuellen Ablauf                                                                            | Mehr als rund zehn Dateien pro Runde üblich werden                |
| Gespeicherte Filteransichten               | Der URL-State ist teilbar und damit als Lesezeichen schon fast dasselbe                                                             | Dieselben Filterkombinationen täglich wiederkehren                |
| Eigene Aufgaben-Vorlagen pflegen (UI)      | Solange eine Person pflegt, ist die Code-Konstante der günstigere Weg                                                               | Jemand anderes Vorlagen pflegen soll                              |

## Architektur-Gate

Bewusste Abweichungen und Punkte, die beim Bauen aktiv geprüft werden:

- **`record-configuration/` wächst stark** (heute 9 Modelle, durch das CRM rund 14 weitere). Deshalb
  Unterordner `record-configuration/crm/` mit eigenem Barrel — bewusste Abweichung von der bisher
  flachen Struktur. `activities.ts` liegt bewusst **nicht** darunter, weil die Tabelle Leads und
  Kunden gemeinsam bedient.
- **Zwei Auth-Welten in einer App.** `(app)` und `(portal)` teilen die Clerk-Instanz, aber nie einen
  Query-Handler. Portal-Handler liegen unter `src/server/portal/`.
- **`proxy.ts` lässt `/api/*` komplett durch.** Portal- und Cron-Routen müssen ihre Prüfung selbst
  mitbringen.
- **Zwei Tasks fassen Bestandscode an** (01a, 02a). Beide sind reine Umzüge mit unveränderten Tests
  als Nachweis — sie stehen früh, damit danach nichts mehr doppelt gebaut wird.
- **Neue Dependencies:** `@vercel/blob` (Task 13), `fflate` (Task 16, in `apps/web` bereits vorhanden).
  Verschlüsselung bewusst ohne neue Dependency über Node `crypto`.
- **Neue AGENTS.md** für `(app)/crm/`, `components/workspace/crm/`, `components/workspace/shared/`,
  `(portal)/`, `components/portal/` und `packages/storage/`, plus Eintrag dieser Scopes in die
  Index-Tabelle der Root-`AGENTS.md`.
