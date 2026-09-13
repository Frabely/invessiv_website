# Ordner 03 — User, flexibles RBAC und fail-closed Auth

> **Status:** offen · **Branch:** `feat/crm-users-rbac` · **Abhängigkeiten:** Ordner 01 und Ordner 02 müssen gemergt
> sein
> **Review-Ziel:** 80–120 geänderte Dateien; bei absehbar größerem Scope vor Implementierungsbeginn aufteilen

## Ziel

Nach dem separaten Merge der Activity-Migration führt dieser Ordner eine persistierte Identität für alle menschlichen
Akteure und ein flexibles, rollenbasiertes Berechtigungsmodell ein.

- Jeder Mensch, der im Workspace oder später im Kundenportal handelt, besitzt genau einen Datensatz in `users`.
- Interne Zugehörigkeit und fachliche Zuständigkeit bleiben in `workspace_members` modelliert.
- CRM-Kontakte ohne Login bleiben in `people`; ein Login macht eine Person nicht automatisch zu einem CRM-Kontakt.
- Rollen sind persistierte, unabhängig verwaltbare Bündel von Berechtigungen.
- Bereiche und Aktionen verlangen Berechtigungen, niemals einen hart codierten Rollennamen.
- Systemjobs sind keine User und werden in Activities separat als Systemakteure erfasst.

## Bewusste Branch-Grenze

Die Activity-Migration aus Ordner 02 bleibt ein eigenständig mergebarer Changeset. In diesem Branch werden deshalb
keine `users`-, Rollen- oder Membership-Tabellen ergänzt und die Actor-Struktur wird nicht vorgezogen.

Ordner 03 startet erst auf dem gemergten Stand von Ordner 01 und 02. Die bereits gemergte Migration aus Ordner 01 wird
nicht verändert. Da alle in Ordner 01 angelegten Tabellen noch leer sind, erfolgt die Korrektur über eine neue
Ordner-03-Migration ohne Daten-Backfill und ohne dauerhaften Dual-Read.

## Zielmodell

### Identität und fachliche Beziehungen

- `users`: kanonische Identität eines Menschen mit UUID, Clerk-ID sowie Stammdaten wie Name und primärer E-Mail.
- `workspace_members`: interne Mitgliedschaft, Status und fachliche Referenz; erhält `user_id -> users.id`.
- `people`: fachlicher CRM-Kontakt. Die Tabelle bleibt nötig, weil Leads, Ansprechpartner oder Kontakte nicht zwingend
  einen Login besitzen und weil CRM-Daten nicht zur Authentifizierung verwendet werden dürfen.
- `portal_memberships` (Ordner 12): verbindet später `users`, `people` und `customers` für einen konkreten Portalzugang.

E-Mail-Adressen dienen nur als Stammdaten und Anzeige, nicht als Autorisierungsanker. Autorisierung läuft über stabile
UUID-Fremdschlüssel.

### Flexibles RBAC

- `permissions`: kanonischer, codebekannter Katalog atomarer Fähigkeiten.
- `roles`: persistierte Rollen mit Realm (`workspace` oder `portal`), Name und Lebenszyklus.
- `role_permissions`: ordnet einer Rolle Berechtigungen desselben Realms zu.
- `workspace_member_roles`: weist internen Mitgliedern beliebig viele Workspace-Rollen zu.
- `portal_membership_roles` (Ordner 12): weist Portalmitgliedschaften Portal-Rollen zu.

Effektive Berechtigungen sind die Vereinigung aller aktiven Rollenzuweisungen. Es gibt zunächst kein explizites
`deny`; fehlende Berechtigung bedeutet Ablehnung.

### Geschützte Systemrollen

- `workspace_owner`: unveränderliche Kernrolle mit allen Workspace-Berechtigungen; mindestens ein aktiver Owner muss
  erhalten bleiben.
- `workspace_member`: stabile Basisrolle für reguläre interne Mitglieder.
- `workspace_credentials_manager`: gezielt zuweisbare Systemrolle für `credentials.reveal`.

`is_system` schützt Name, Realm und Berechtigungsumfang einer gelieferten Rolle vor freier Bearbeitung. Die Rolle darf
je nach Policy weiterhin zugewiesen werden. Die Owner-Rolle besitzt zusätzlich Schutz vor eigener Entfernung,
Privilege Escalation und dem Entfernen des letzten aktiven Owners.

Frei erstellte Rollen dürfen nur delegierbare Berechtigungen enthalten. Hochkritische Rechte wie Rollenverwaltung,
Mitgliederverwaltung, Datenexport, Datenlöschung und Security-Audit bleiben nicht delegierbar und damit an die
geschützte Owner-Rolle gebunden.

## Activities und Akteure

Ordner 03 ergänzt Activities additiv um eine echte User-Referenz:

- menschliche Änderung: `actor_user_id -> users.id`, Actor-Typ `user`
- Systemjob: kein Fake-User, sondern Actor-Typ `system` plus stabiler `system_actor_key`
- bestehende Legacy-Felder bleiben während der Migration lesbar und werden erst in einem späteren Cleanup entfernt

Damit wird bei einem Bulk Edit der tatsächlich angemeldete Bearbeiter persistiert, nicht der fachlich zuständige
Lead-Owner. Ob dieser User Owner, Mitarbeiter oder Kunde ist, ergibt sich aus seinen Memberships und Rollen.

## Umsetzung

1. Migration mit einer harten Leerheitsprüfung für alle von Ordner 01 eingeführten Tabellen beginnen; bei einem
   unerwarteten Datensatz ohne Änderung abbrechen.
2. `users`, Permission-Katalog, Rollen, Rollenberechtigungen und Workspace-Zuweisungen anlegen.
3. `workspace_members` direkt um den verpflichtenden Fremdschlüssel `user_id -> users.id` erweitern. Die ungenutzten
   Legacy-Spalten bleiben vorerst bestehen, damit die unmittelbar vorherige App-Version mit dem Schema kompatibel ist;
   die neue Auth liest sie nicht mehr.
4. Den ersten User, seine Workspace-Mitgliedschaft und die Owner-Rolle beim Bootstrap atomar erzeugen.
5. Auth-Kontext auf die persistierte `users.id` und effektive Berechtigungen umstellen.
6. Command- und Query-Grenzen fail-closed über Berechtigungen absichern.
7. Rollenverwaltung mit Schutzregeln und Audit-Activities bereitstellen.
8. Activities um `actor_user_id` und Systemakteure erweitern und die Schreibpfade migrieren.
9. Die leeren Legacy-Spalten erst nach erfolgreichem Rollout in einem kleinen Cleanup-Changeset entfernen.

## Rollback- und Kompatibilitätsstrategie

- Die Migration erweitert ausschließlich leere Ordner-01-Tabellen und bricht andernfalls vor der ersten Änderung ab.
- Neue querschnittliche Tabellen und Activity-Spalten werden additiv angelegt.
- Der alte Allowlist-Pfad bleibt nur für den kurzen Migrationszeitraum als explizit markierter Fallback bestehen.
- Weil es keine zu migrierenden Mitgliederdaten gibt, existiert weder eine E-Mail-Zuordnung noch ein Identity-Backfill.
- Die alten Spalten bleiben bis zum separaten Cleanup vorhanden. Dadurch kann die vorherige App-Version während des
  Rollouts weiterhin gegen das erweiterte Schema betrieben werden.

## Nicht Teil dieses Ordners

- Portal-Einladung und `portal_memberships` (Ordner 12)
- vollständige Credential-Verschlüsselung und Reveal-UI (Ordner 19)
- Enterprise-IdP-/SCIM-Synchronisation
- attributbasierte Regeln oder explizite Deny-Regeln
- Migration bereits vorhandener Ordner-01-Produktivdaten; ein unerwarteter Bestand blockiert die Migration
- Entfernung der Legacy-Spalten aus `workspace_members`; sie folgt als kleines Cleanup nach erfolgreichem Rollout

## Verbindliches Post-03-Cleanup

Die Entfernung der Übergangsfelder ist als eigene Merge-Einheit
[`03a-workspace-member-legacy-cleanup`](../03a-workspace-member-legacy-cleanup/README.md) direkt nach diesem Ordner
eingeplant. Ordner 04 beginnt erst nach deren Merge.

## Vertiefung

- [`02-rechtesystem.md`](./02-rechtesystem.md) — Tabellen, Invarianten, Autorisierungsablauf und Akzeptanzkriterien
