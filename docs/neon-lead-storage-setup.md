# Neon Lead Storage Setup

Stand: 26.03.2026

## Ziel
Die Website speichert validierte Kontaktanfragen zusätzlich zum Mailversand in Neon/Postgres.

## 1. Neon vorbereiten
- In Neon ein neues Projekt oder eine dedizierte Datenbank für `invessiv_website` anlegen.
- Den Serverless/Postgres Connection String kopieren.
- Sicherstellen, dass der Connection String Schreibrechte für die Ziel-Datenbank hat.

## 2. Lokal konfigurieren
- In `.env.local` `DATABASE_URL=...` ergänzen.
- Falls noch nicht geschehen, bestehende Mail-Variablen gesetzt lassen:
  - `CONTACT_MAIL_PROVIDER`
  - `CONTACT_MAIL_FROM`
  - `CONTACT_MAIL_TO`
  - `RESEND_API_KEY`

## 3. Migrationen ausführen
- `npm run db:migrate`

Erwartung:
- Tabelle `schema_migrations`
- Tabelle `leads`
- Tabelle `lead_project_requests`

## 4. DB-Smoketest ausführen
- `npm run db:smoke`

Erwartung:
- Ausgabe mit Datenbankname
- Anzahl angewendeter Migrationen
- Bestätigung, dass `leads` und `lead_project_requests` vorhanden sind

## 5. Vercel konfigurieren
- In Vercel `DATABASE_URL` für die relevanten Environments setzen:
  - Development
  - Preview
  - Production
- Darauf achten, dass die Werte zu den jeweiligen Neon-Datenbanken passen.
- Aktueller empfohlener Zustand:
  - `Development` zeigt auf einen dedizierten Neon-Branch `development`
  - `Preview` zeigt auf einen dedizierten Neon-Branch `preview`
  - `Production` bleibt auf der Live-Datenbank

## 6. Nach Deployment verifizieren
- Nach dem Deploy ein Testformular absenden.
- In Neon prüfen, dass ein Datensatz in `leads` und `lead_project_requests` angelegt wurde.
- Prüfen, dass `mail_status` nach erfolgreichem Versand auf `sent` steht.
- Einen Mail-Fehlerfall nur kontrolliert testen; dabei muss der Lead gespeichert bleiben und `mail_status = failed` erhalten.

## 7. E2E-Verifikation in der QA-Kette
- Für den echten Browser- und DB-Check steht `npm run test:e2e:contact` zur Verfügung.
- Der Test sendet eine reale Anfrage über das Kontaktformular, prüft den Datensatz in Neon und löscht den Test-Lead anschließend wieder.
- Dieser Test sollte nur gegen eine dedizierte Development- oder Staging-Datenbank laufen, nicht gegen Production.
- Falls CI den Test ausführen soll, sollten dafür separate E2E-Secrets und idealerweise eine eigene Test-Mailbox verwendet werden.
- Der lokale E2E-Pfad wurde gegen die getrennte `Development`-Datenbank erfolgreich verifiziert.

## Hinweise
- Ohne `DATABASE_URL` bleibt der bestehende Mail-Flow aktiv, aber es erfolgt keine Lead-Persistierung.
- Die Persistierung ist aktuell für das bestehende Projektanfrage-Formular umgesetzt und über `source_form = project_request` gekennzeichnet.
- Die früheren integrationsverwalteten `INVESSIV_DATABASE_*`-Variablen können parallel existieren, der Code priorisiert jedoch `DATABASE_URL`.
