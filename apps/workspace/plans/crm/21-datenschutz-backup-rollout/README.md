# Ordner 21 — Datenschutz, Backup und Produktivrollout

> **Status:** offen · **Abhängigkeiten:** 01–20 · **Aufwand:** 4–5 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`34-export-purge-backup.md`](./34-export-purge-backup.md) — DSGVO-Export, Purge-Saga,
  Backup-Rotation, Restore-Drill und Rollout-Gates.

Version 1 erfüllt den definierten operativen Datenschutz- und Wiederherstellungsweg. Der Owner kann
einen Kundendatenexport und einen kontrollierten Purge ohne öffentliche UI ausführen. Datenbank und
Dateien werden automatisiert gesichert und testweise wiederhergestellt. Danach ist die direkte
Freigabe für alle einzeln geprüften Kunden möglich.

## Datenexport

- Interne Owner-only CRM-Oberfläche startet einen Exportjob mit Inhaltsvorschau und Audit. Der
  Purge-Command bleibt dagegen bewusst ohne UI.
- ZIP enthält strukturierte JSON/CSV-Daten und zugehörige freigegebene wie interne Dokumente;
  Zugangsdaten enthalten nur Metadaten und niemals entschlüsselte Werte.
- Exportobjekt ist kurzlebig, verschlüsselt gespeichert, signiert abrufbar und wird nach
  dokumentierter kurzer Frist technisch entfernt.
- Exportfehler sind wiederholbar und hinterlassen keinen teilweise veröffentlichten Download.

## Purge ohne CRM-Button

- Owner startet einen internen Command mit Kundennummer und erneuter Bestätigung.
- Vorschau nennt Portalzugriffe, Projekte, Aufgaben, Nachrichten, Feedback, Dateien, Credentials,
  Renewals, Stunden und Activities.
- Saga setzt `purge_pending`, widerruft Portalzugriffe, friert Writes ein, erstellt Manifest und
  löscht alle Primär-Blobs idempotent. Erst danach löscht eine DB-Transaktion die Fachzeilen.
- Teilfehler bleiben als Job sichtbar und erneut ausführbar; DB-Zuordnung wird nie vor Blob-Erfolg
  zerstört.
- Backupkopien werden nicht umgeschrieben, sondern bleiben gesperrt bis zum regulären Fristablauf.

## Backup und Restore

- GitHub Actions erstellt täglich verschlüsselten `pg_dump` in separatem Vercel-Blob-Store.
- Rotation: täglich 30 Tage, monatlich 12 Monate; Dateikopien 90 Tage.
- Manifest enthält Datei-ID, Storage-Key, Größe, SHA-256 und Sicherungszeitpunkt.
- Tokens für Primär- und Backup-Store sind getrennt und minimal berechtigt.
- Quartalsweise isolierter Restore von DB und Dateien; Ziel RPO 24 Stunden, RTO 4 Stunden.
- Runbook dokumentiert Neon-Free-Einschränkung, gemeinsames Vercel-Kontorisiko, Verantwortlichen,
  Eskalation, Restore, Validierung und Rückkehr in Produktion.

## Produktivabnahme

- Clerk Restricted, Redirects, erlaubte Domains und DE/EN-Mails prüfen.
- Der Status „Keine Berechtigung“ erhält einen optionalen Kontaktweg zum zuständigen Administrator.
  Das Ziel wird serverseitig bestimmt; persönliche Admin-Kontaktdaten werden nicht ungefragt
  offengelegt. Ist kein sicheres Ziel konfiguriert, bleibt die bestehende Statusmeldung ohne toten
  CTA sichtbar. Ein absendender Flow braucht DE/EN-Erfolgs- und Fehlerzustände, Rate-Limit und
  PII-arme Protokollierung.
- Portalvorschau ist vor jeder ersten Firmeneinladung verpflichtend.
- Direkter Rollout an alle Kunden ist erlaubt, aber immer einzeln nach bestätigter Vorschau.
- Security-, Privacy-, A11y- und Mobile-Smoke über Kunde → Projekt → Aufgabe → Portal → Datei →
  Feedback → Chat → Stunden.
- Dashboards/Alerts für Jobstau, permanente Fehler, Uploadfehler, Auth-Anomalien und Backupalter.

## Merge-Gate

- [ ] Export enthält alle erwarteten Daten und keine entschlüsselten Credentials.
- [ ] Purge-Test hinterlässt keine aktive DB-Zeile oder Primärdatei des Kunden.
- [ ] Unterbrochener Purge ist sicher fortsetzbar.
- [ ] Isolierter Restore erfüllt RPO/RTO und Hashprüfung; Ergebnis ist protokolliert.
- [ ] Backup-/Restore-Secrets erscheinen nicht in Logs oder PR-Artefakten.
- [ ] Der optionale Admin-Kontaktweg ist mit und ohne konfiguriertes Ziel geprüft; er legt keine
      persönlichen Kontaktdaten offen und erzeugt keinen toten CTA.
- [ ] Vollständige Repo-Gates und Workspace-Build sind grün.
- [ ] PR enthält finalen Risiko-, Rollback-, Security- und Betriebsabschnitt.

## Rollback

Produktivfreigabe stoppen, Einladungen deaktivieren und letzte bekannte gute App-Version deployen.
Additive Daten bleiben erhalten. Bei Datenkorruption wird ausschließlich nach Runbook in eine
isolierte Umgebung restored und erst nach Validierung umgeschaltet.
