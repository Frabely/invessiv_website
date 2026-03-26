# Lead Table Implementation Plan

## Ziel
Kontaktformular-Anfragen sollen zusätzlich zum bestehenden Mailversand in einer neuen Datenbank persistiert werden. Die Umsetzung erfolgt in kleinen, reviewbaren Schritten, damit Architektur, Setup, Legal und QA sauber getrennt bleiben.

## Scope
- Persistierung aller submitbaren Kontaktformular-Anfragen über die bestehende Next.js API
- Neon/Postgres-Anbindung für Vercel
- Datenmodell für Leads und formularspezifische Detaildaten
- Nachpflege von Datenschutz und ggf. AGB
- Tests für Erfolg, Fehlerpfade und Regressionen

## Out of Scope
- Eigenes internes CRM-/Admin-UI
- Automatische Follow-up-Automationen
- Queue-/Retry-System für Mailzustellung
- Automatische Retention-Löschung per Cron, falls das nicht explizit zusätzlich beauftragt wird

## Aktueller Stand im Projekt
- Es gibt aktuell genau ein serverseitig submitbares Kontaktformular.
- Die API läuft über `src/app/api/public/contact/route.ts`.
- Die Formular-Orchestrierung sendet derzeit nur E-Mails über Resend.
- Eine Datenbank-Anbindung, `DATABASE_URL`, Neon/Postgres-Setup oder ORM existieren aktuell noch nicht.
- Datenschutz und AGB decken die aktuelle Website ab, aber noch nicht die geplante Lead-Speicherung.

---

## Schritt 0: Branch und Arbeitsmodus vorbereiten
### Ziel
Saubere Arbeitsgrundlage schaffen.

### Aufgaben
- Branch nach Repo-Konvention anlegen:
  - `feat/implement-lead-table`
- Prüfen, ob der Worktree sauber genug für die Umsetzung ist.
- Diese Plan-Datei aktuell halten, wenn sich Entscheidungen ändern.

### Done wenn
- Branch existiert
- Plan-Datei liegt im Repo
- Offene Entscheidungen sind sichtbar dokumentiert

---

## Schritt 1: Architektur und Ordnerstruktur festziehen
### Ziel
Bevor Logik oder Setup gebaut wird, müssen Verantwortung und Ablage klar sein.

### Zielstruktur
- `src/server/db/**`
  - DB-Verbindung
  - Query-Funktionen
  - Migrations- und Setup-Helfer
- `src/server/services/contact/**`
  - Orchestrierung des Submit-Flows
  - Persistierung + Mail + Status-Update
- `src/features/contact/**`
  - Zod-Schema
  - Request-/Response-Contracts
  - formularnahe Typen
- `docs/**`
  - Setup-Dokumentation
  - spätere Runbooks/Follow-up-Notizen

### Architekturentscheidungen
- Kein ORM in v1
- Leichtgewichtiger SQL-Layer für Neon/Postgres
- Bestehende API bleibt zentraler Entry Point
- Persistenz läuft serverseitig nach erfolgreicher Validierung
- Mailversand bleibt bestehen und wird nach DB-Insert ausgeführt

### Zu klärende Punkte
- Wie Versionsstände von Datenschutz/AGB zentral gepflegt werden
- Wie Migrationen lokal und auf Neon ausgeführt werden

### Done wenn
- Zielstruktur dokumentiert ist
- Verantwortlichkeiten pro Modul klar sind
- Keine offenen Architekturfragen mehr die Schritt 3 oder 4 blockieren

---

## Schritt 2: Datenmodell und Migrationsdesign definieren
### Ziel
Das Schema vollständig festlegen, bevor Neon/Vercel-Setup und Implementierung starten.

### Geplantes Datenmodell
#### Tabelle `leads`
Pflichtfelder:
- `id` UUID Primary Key
- `created_at`
- `updated_at`
- `request_id`
- `source_form`
- `locale`
- `full_name`
- `email`
- `message`
- `inquiry_type`
- `consent_accepted_at`
- `privacy_version`
- `terms_version`
- `submission_started_at`
- `mail_status`
- `mail_provider`
- `lead_status`
- `retention_until`

Optionale Felder:
- `phone`
- `company`
- `role`
- `mail_error_code`
- `owner`
- `first_contacted_at`
- `last_activity_at`
- `internal_note`

#### Tabelle `lead_project_requests`
- `lead_id` FK auf `leads.id`
- `goal_key`
- `workflow_key`
- `budget_key`
- `preferred_start_key`
- `website`
- `page_keys`
- `pages_custom`

### Bewusste Nicht-Speicherung
- `websiteTrap`
- rohe Analytics-Daten
- IP/User-Agent in v1 nicht speichern, außer Scope ändert sich bewusst

### Zusätzliche Modellentscheidungen
- `mail_status`: `pending | sent | failed`
- `lead_status`: `new | contacted | qualified | won | lost | archived`
- `retention_until`: Default `created_at + 24 Monate`
- `source_form`: vorbereitend form-agnostisch, in v1 `project_request`

### Migrationen
Zu definieren:
- Wo die SQL-Dateien liegen
- Wie sie lokal angewendet werden
- Wie sie auf Neon/Produktion angewendet werden
- Wie Rollback oder Korrekturen gehandhabt werden

### Done wenn
- Tabellenstruktur steht vollständig
- Defaults, Constraints und Indizes sind definiert
- Migrationsablauf ist dokumentiert

---

## Schritt 3: DB-Erstellung und Neon/Vercel-Setup
### Ziel
Datenbank bereitstellen und Verbindung verlässlich nachweisen.

### In Neon einzurichten
- Neues Projekt oder neue DB für diese Website
- Zugriffsdaten für Server-Use-Case
- Verbindung über Connection String

### In Vercel einzurichten
- `DATABASE_URL`
- Sicherstellen, dass Environment-Variablen für Preview/Production korrekt gesetzt sind
- Prüfen, ob bestehende Mail-Variablen unverändert bleiben

### Im Projekt einzurichten
- Serverseitiges Env-Reading für `DATABASE_URL`
- Minimaler Connection-Test
- Kleines Smoke-Test-Skript oder Test-Query

### Funktionstest
- Verbindung zur DB erfolgreich
- Migrationen ausführbar
- Tabellen erreichbar
- Test-Insert oder Test-Select erfolgreich

### Done wenn
- DB erreichbar ist
- Env-Konfiguration steht
- Migrationen erfolgreich angewendet wurden
- Verbindungstest reproduzierbar dokumentiert ist

### Checkliste für Vercel und Neon
- Neon DB erstellt
- Connection String kopiert
- `DATABASE_URL` in Vercel gesetzt
- lokal `.env.local` ergänzt
- Test gegen API und DB erfolgreich durchgeführt

---

## Schritt 4: Persistenzlogik implementieren
### Ziel
Validierte Formularanfragen in die DB schreiben und Mailstatus nachführen.

### Geplanter Ablauf
1. Request kommt auf bestehende Contact-API
2. Zod-Validierung läuft wie bisher
3. Lead-Hauptdatensatz wird geschrieben
4. Formularspezifische Detailtabelle wird geschrieben
5. Mailversand wird ausgelöst
6. Bei Mail-Erfolg: `mail_status = sent`
7. Bei Mail-Fehler: `mail_status = failed`, `mail_error_code` setzen
8. API liefert bei Mail-Fehler weiterhin Fehlerantwort
9. Lead bleibt trotzdem gespeichert

### Fehlerregeln
- DB-Fehler:
  - kein Mailversand
  - API liefert Fehler
- Mail-Fehler:
  - Lead bleibt gespeichert
  - API liefert Fehler
- Validierungsfehler:
  - Verhalten bleibt unverändert
- Rate-Limit/Spam:
  - Verhalten bleibt unverändert

### Codebereiche
- `src/server/config/env.ts`
- `src/server/db/**`
- `src/server/services/contact/**`
- `src/features/contact/**` für ergänzende Typen

### Technische Details
- `request_id` weiterverwenden
- Consent-Zeitpunkt serverseitig setzen
- `privacy_version` und `terms_version` serverseitig setzen
- `updated_at` bei Statusänderungen pflegen

### Done wenn
- Erfolgreicher Submit erzeugt DB-Datensatz
- Mailstatus wird korrekt geschrieben
- Fehlerpfade verhalten sich wie spezifiziert
- Bestehende API-Contracts bleiben stabil

---

## Schritt 5: Datenschutz und ggf. AGB nachziehen
### Ziel
Die neue Verarbeitung rechtlich sauber abbilden.

### Datenschutz erweitern
Mindestens ergänzen:
- Speicherung in einer Lead-Datenbank
- Zweck der Speicherung
- Datenkategorien
- Empfänger und Dienstleister
- Speicherdauer
- Nachverfolgung und Bearbeitungsstatus
- Hinweis auf unveränderten Analytics-Umfang
- Drittlandbezug nur falls für Neon-Setup tatsächlich relevant

### AGB prüfen und ggf. ergänzen
Sinnvoll falls nötig:
- Kontaktformular-Anfragen sind unverbindliche Anfragen
- Kein Vertragsschluss durch Formularabsendung
- Interne Dokumentation zur Bearbeitung und Angebotserstellung

### Sprachregeln
- DE und EN parallel anpassen
- `updatedAt` aktualisieren
- Keine Inline-Texte, nur Dictionaries

### Done wenn
- Datenschutz vollständig nachgezogen ist
- AGB nur dort ergänzt wurden, wo es fachlich nötig ist
- Beide Sprachen synchron sind

---

## Schritt 6: QA und Release-Check
### Ziel
Regressionen vermeiden und die neue Funktion belastbar absichern.

### Tests
#### Unit
- Mapping Request -> DB Insert
- Retention-Berechnung
- Mailstatus-Übergänge

#### Integration
- Erfolgreicher API-Submit schreibt Lead + Detaildaten
- DB-Fehler blockiert Mailversand
- Mail-Fehler hinterlässt gespeicherten Lead mit `failed`

#### Legal/UI
- Tests für neue Inhalte in Datenschutz/AGB
- Prüfen, dass Consent-Links weiterhin korrekt sind

#### Bestehende Checks
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Manuelle QA
- Testformular absenden
- DB-Datensatz prüfen
- Mailversand prüfen
- Fehlerfall prüfen
- Legal-Seiten visuell und inhaltlich prüfen

### Done wenn
- Alle relevanten Tests grün sind
- Kernflow und Fehlerpfade geprüft sind
- Legal-Änderungen sichtbar und korrekt sind

---

## Wichtige Defaults
- Branchname: `feat/implement-lead-table`
- DB-Ansatz: leichtgewichtiger SQL-Layer, kein ORM
- Retention für nicht-konvertierte Leads: 24 Monate
- Kein Admin-UI in diesem Scope
- Kein Queue-/Retry-System in v1
- Lead bleibt bei Mail-Fehler gespeichert

---

## Offene Punkte / Falls Scope wächst
- Automatische Löschung per Cron/Job
- Internes Admin-UI für Leads
- Retry-Mechanismus für fehlgeschlagene Mails
- Zusätzliche Kontaktformulare mit eigenen Detailtabellen
- Export-/CSV- oder CRM-Schnittstelle

---

## Session-Log
### Hinweis
Wenn die Umsetzung nicht in einer Session abgeschlossen wird, hier nach jedem Schritt ergänzen:
- Datum
- abgeschlossener Schritt
- getroffene Entscheidungen
- offene Punkte
- nächster Schritt

### Einträge
- Datum: 2026-03-26
  - Abgeschlossen: Schritte 0 bis 6 im Code umgesetzt; Neon/Vercel-Setup dokumentiert, aber lokal noch nicht gegen eine echte DB ausgeführt
  - Entscheidungen: Branch-Name `feat/implement-lead-table`, DB-Ansatz ohne ORM, Neon-HTTP-Client `@neondatabase/serverless`, Hybrid-Schema mit `leads` und `lead_project_requests`, Retention `24 Monate`, Legal-Versionen `2026-03-26`
  - Offene Punkte: `DATABASE_URL` in Neon/Vercel setzen, `npm run db:migrate` und `npm run db:smoke` gegen die echte Datenbank ausführen, echten Formular-Submit gegen Neon verifizieren
  - Nächster Schritt: DB lokal oder in Vercel anbinden und die neuen Setup-Commands ausführen
