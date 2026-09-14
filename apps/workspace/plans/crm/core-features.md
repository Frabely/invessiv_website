# CRM & Kundenportal — Funktionsumfang Version 1

Diese Übersicht beschreibt ausschließlich den verbindlichen Stand aus `00-entscheidungen.md`.
Details und Abnahmekriterien stehen in den 27 geordneten Merge-Einheiten.

## Internes CRM

- Kundenakte mit stabiler Nummer, Status, Primärkontakt, globalen Personen-Zuordnungen, Kategorie,
  Tags, Owner und Aktivitätsverlauf.
- Kundenliste mit URL-Filtern, normalisierter Suche und Ansichten für aktive, pausierte und
  archivierte Kunden.
- Lead-Konvertierung mit erneut bestätigtem Primärkontakt und optionalen Zusatzkontakten.
- Mehrere Projekte je Kunde mit Lebenszyklus, Workflow-Version, Owner und internen EUR-Planwerten.
- Flache Aufgaben mit einem Bearbeiter, Kontext, Handlungspflicht, Fälligkeit, Wiederholung und
  globaler Übersicht.
- Workspace-Glocke für Zuweisungen, Fälligkeiten, Portalereignisse, Renewals und Jobfehler.
- Renewals für Domain, Hosting, SSL, Lizenz und sonstige Laufzeiten.
- Informative Kunden-Stundenkontingente mit vollständig kundensichtbaren Buchungen.
- Verschlüsselte Standard-Zugangsdaten mit explizitem Reveal und Security-Audit.

## Kundenportal

- Explizite Clerk-Einladung; ein Konto kann mehrere Kundenfirmen sicher wechseln.
- Dashboard mit freigegebenen Projektdaten, Aufgaben, Dokumenten und Stunden.
- Gemeinsamer Kundenchat mit Lesestand je Kontakt und gebündelten E-Mail-Hinweisen.
- Zwei reguläre Feedbackrunden je Projekt; weitere Runde nur nach Anfrage und Freigabe.
- Upload erlaubter Dokumente und Download nur explizit freigegebener Dateien.
- Deutsch und Englisch mit persönlicher Sprachpräferenz.

## Betrieb und Sicherheit

- Fail-closed-Autorisierung, zwei interne Rollen und zusätzliche Credential-Freigabe.
- Zugriffsbereiche: Rollen in der UI an einzelne Kunden oder Projekte binden; der Workspace-Owner sieht immer alles.
- Optimistische Nebenläufigkeitskontrolle für bearbeitbare Kerndaten.
- Transaktionale Outbox und idempotenter Job-Runner.
- Vercel-Blob-Adapter, Upload-Sessions, Inhaltsprüfung und vorbereiteter Inspection-Adapter.
- Tägliche verschlüsselte DB-Sicherung, Dateikopie und quartalsweiser Restore-Test.
- Reversibles Archiv und nichtöffentlicher Owner-Purge mit Storage-Bereinigung.
- Der Zugangsstatus „Keine Berechtigung“ bietet zum Produktivrollout optional einen sicheren
  Kontaktweg zum zuständigen Administrator; ohne konfiguriertes Ziel bleibt die passive,
  handlungsfreie Statusmeldung erhalten.

## Nicht Teil von Version 1

Kein CRM-Mailclient, Mail-Eingang, Malware-Scanner, Dateiversionssystem, Rechnungssystem,
Lexware-Import, Mandantenbetrieb, CSV-Kundenimport oder frei konfigurierbarer Workflow-Editor.

Der frühere Detailplan für freies Mail-Senden bleibt als ausdrücklich zurückgestellte Option unter
`zurueckgestellt/31-mail-senden.md` erhalten.

## Abschluss nach dem CRM-Umbau

- Nach allen fachlichen CRM-, Portal-, Rollout- und Cleanup-Einheiten folgt als letzter Ordner 23 ein eigenständiger
  Web-PR. Er stellt die Website technisch auf alle in Ordner 03d zentralisierten Button- und Formularbausteine um und
  entwickelt deren Web-Darstellung weiter, ohne die Workspace-Optik oder CRM-Funktionalität zu verändern.
