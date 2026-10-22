# Ordner 20-0 — Vollständige Kundendaten-Sicherung auf Neon Free

> **Status:** offen · **Priorität:** vor `20a-kundenzustaendigkeit` und weiteren Features
> **Abhängigkeiten:** bestehende produktive DB, Dateien und Credentials; unabhängig von Ordner 20c und 21
> **Branch:** `feat/crm-kundendaten-backup` · **Aufwand:** 3–5 Tage einschließlich erstem Restore
> **Entscheidung:** 22.10.2026 — Neon Free möglichst beibehalten; vollständigen wiederherstellbaren Stand sichern.

## Ziel

Eine Backup-ID führt Datenbank, sämtliche eigenen Blob-Dateien, Code, Migrationen und die passende
Konfiguration zu einem überprüften Wiederherstellungsstand zusammen. Besonders wichtig sind Onboarding-Bögen,
Assets, Feedback und gespeicherte Passwörter. Gesichert wird trotzdem die gesamte Anwendungsdatenbank inklusive
Beziehungen, Berechtigungen, verschlüsselten Credentials und Migrationshistorie.

Der Schlüssel für gespeicherte Passwörter muss ebenfalls wiederbeschaffbar sein. Er liegt zusammen mit den
übrigen Notfallzugängen in einem separaten geschützten Tresor; das Backup enthält die eindeutige Referenz auf
die passende Tresorversion. Ein gestohlenes Backup allein darf keine Passwörter entschlüsselbar machen.

Dies ist ein Umsetzungsplan. Es sind damit noch keine Sicherungen, Konten oder Workflows eingerichtet.

## Betriebsentscheidung

| Bereich           | Vorgabe                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Neon              | vorhandenen Free-Tarif zunächst weiter nutzen                                                                        |
| Ausführung        | eigener GitHub-Actions-Workflow, täglich z. B. 03:17 UTC und manuell auslösbar                                       |
| Ziel              | privater S3-kompatibler Objektspeicher bei separatem Anbieter/Konto außerhalb von Neon und Vercel                    |
| Verschlüsselung   | vor Upload; öffentlicher Empfängerschlüssel im Backupjob, privater Wiederherstellungsschlüssel im Tresor             |
| Aufbewahrung      | tägliche vollständige logische Generationen für 30 Tage; gemeinsame Blobs solange irgendeine Generation sie benötigt |
| Überwachung       | unabhängiger Heartbeat-Monitor; Alarm bei Fehler und bei mehr als 26 Stunden ohne vollständigen Stand                |
| Wiederherstellung | vor Abschluss einmal vollständig, danach monatlich und nach wesentlichen Backup-/Schemaänderungen                    |
| Ziele             | RPO ungefähr 24 Stunden bei erfolgreichen Tagesläufen; RTO höchstens 4 Stunden zunächst durch Drill nachzuweisen     |

GitHub-Zeitpläne können verspätet starten oder ausfallen. 24 Stunden sind daher keine garantierte Obergrenze;
Fehler und Verzögerungen vergrößern die Datenlücke. Ein strikteres RPO braucht häufigere Läufe oder längeren PITR-Verlauf.
Der persönliche Rechner muss für die Sicherung nicht laufen. Neon Free bedeutet nicht automatisch, dass
Objektspeicher, Dateitransfer, Actions-Minuten und Monitoring kostenlos sind. Vor Einrichtung Anbieter, Region,
Zugriffsrechte, Speicherbedarf und laufende Kosten dokumentieren; keine kostenpflichtigen Konten allein durch diesen Plan buchen.

## Automatischer Ablauf

1. Workflow vom geschützten Default-Branch starten, parallele Backup-/Migrationsläufe ausschließen.
   Produktions-Secrets niemals für Pull Requests oder fremden Code freigeben. Actions auf geprüfte Commit-SHAs pinnen.
2. Backup-ID, Startzeit und tatsächlich produktiv deployten Git-Commit bestimmen. Der aktuelle Repository-HEAD
   ist nicht automatisch der Produktionsstand. Laufende Deployments/Migrationen erkennen und den Lauf verschieben.
3. Vollständigen konsistenten `pg_dump` im Custom-Format über direkte TLS-Verbindung erstellen.
   Client-Version passend zum PostgreSQL-Server wählen; keine Tabellenfilter, kein Seed und kein Migration-Aufruf.
   Eine eigene Leseberechtigung muss alle benötigten Tabellen, Sequenzen und gegebenenfalls RLS-Daten tatsächlich erfassen.
4. Dump in temporärem isoliertem PostgreSQL wiederherstellen und daraus das Dateiinventar sowie die
   `schema_migrations` lesen. So stammen Inventar und Datensätze aus demselben DB-Stand.
   Temporäre Daten bleiben ausschließlich auf dem kurzlebigen Runner, niemals als Actions-Artefakt oder Cache.
5. Alle referenzierten Originale und `thumbnail_key`-Objekte aus dem privaten Blob-Store kopieren,
   einschließlich interner Dateien. Alle verwendeten Stores und zusätzlichen Blob-Verweise vorher inventarisieren.
   Storage-Inventar separat erfassen; nicht zugeordnete Objekte und laufende Uploads als solche dokumentieren.
6. Jedes Objekt auf Größe und SHA-256 prüfen, verschlüsseln und unter unveränderlichem Backup-Key ablegen.
   Vorhandene identische Objekte dürfen wiederverwendet werden, wenn ihre gesicherte Integrität geprüft ist.
   Kein blindes Spiegeln mit Löschweitergabe aus Produktion.
7. Codearchiv des Produktionscommits einschließlich Lockfile, aller SQL-Migrationen und Restore-Skripte sichern.
   Dump, Objektmanifest und Konfigurationsmanifest verschlüsselt hochladen und die abgelegten Artefakte prüfen.
8. Erst nach vollständiger Prüfung einen Abschlussmarker schreiben und den Erfolgs-Heartbeat senden.
   Teilstände bleiben ausdrücklich unvollständig; ein erfolgreicher Dump allein zählt nicht als Gesamterfolg.
9. Ablaufbereinigung separat ausführen: nur abgelaufene Generationen und nirgendwo mehr benötigte Objekte entfernen.
   Bei fehlgeschlagenem Backup den letzten vollständigen Stand nicht entfernen; Aufbewahrungsüberschreitung melden.

### Konsistenz von Datenbank und Blob-Store

Ein DB-Dump und ein Dateidownload bilden keine gemeinsame Transaktion. Während der Sicherung dürfen benötigte
Blob-Inhalte weder überschrieben noch physisch gelöscht werden. Bei der Umsetzung alle Löschpfade, Cleanupjobs
und Uploadabschlüsse prüfen: bevorzugt unveränderliche Keys und eine zeitlich begrenzte, von allen Löschpfaden
beachtete Backup-Lease verwenden. Falls das noch nicht zuverlässig möglich ist, ein kurzes dokumentiertes
Wartungsfenster für sämtliche betroffenen Schreib-/Löschpfade einsetzen; laufende Uploads vorher abschließen lassen.
Der Schutz muss bei Fehlern/Abbruch kontrolliert ablaufen und darf Löschungen nicht dauerhaft blockieren.

Fehlt eine im Dump benötigte Datei oder stimmt ihr Hash nicht, schlägt der Gesamtlauf fehl. Ein späterer Retry
behebt eine bereits verlorene Datei nicht. Unfertige Uploads werden gesondert ausgewiesen; sie dürfen nicht als
vollständig gesicherte Kundenassets erscheinen. Externe Medienlinks sichern nur die URL, nicht fremde Inhalte.

## Manifest: ein Einstiegspunkt für den gesamten Stand

Pro Backup-ID enthält das verschlüsselte Manifest:

- DB-Snapshotzeit, Laufbeginn/-ende, Quellprojekt/-branch, PostgreSQL-/Dump-Version, Dump-Hash und Dateigröße.
- Produktiven Git-Commit und Deployment-ID, Codearchiv-Hash, Runtime-/Paketmanager-Version und Lockfile.
- Inhalt von `schema_migrations` sowie Dateinamen und SHA-256 der zugehörigen SQL-Dateien.
- Quell-Store-IDs, Datei-ID, ursprünglichen Storage-Key, Backup-Key, Größe, Hash und gegebenenfalls Thumbnail-Zuordnung.
- Versionierte Konfiguration ohne Secretwerte, benötigte Secret-Namen und feste Tresor-Eintrags-/Versionsreferenzen.
- Benötigte Credential-Schlüsselversionen und Backup-Empfängerschlüssel-ID; kein entschlüsseltes Kundenpasswort.
- Vollständigkeitsstatus, bewusste externe Grenzen und die passende Version des Restore-Runbooks.

## Notfall-Tresor und Passwortschlüssel

Der vorhandene Serverwert heißt **`CRM_CREDENTIALS_KEYRING`** (`apps/workspace/.env.example`).
Er enthält versionierte Schlüssel; alle von aufbewahrten Backups benötigten Versionen müssen erhalten bleiben.

- Ein zentraler Eintrag „Invessiv Produktion — Wiederherstellung“ im unabhängig erreichbaren Passwortmanager
  verweist auf Backup-Speicher, Runbook, Providerzugänge und versionierte Secret-Einträge.
- Vollständigen Credential-Keyring und den privaten Backup-Entschlüsselungsschlüssel dort getrennt hinterlegen.
  Keyring vor erster Nutzung einer neuen Version sichern; alte Version erst entfernen, wenn weder Live-Daten noch
  eine aufbewahrte Generation sie benötigt. Dasselbe gilt für rotierte Backup-Entschlüsselungsschlüssel.
- DB-, Blob- und Backup-Zugänge, Clerk-Konfiguration, sonstige benötigte Server-Secrets sowie MFA-Recoverycodes
  und Wiederherstellungsweg des Tresors dokumentieren. Eine geschützte Offline-Notfallkopie verhindert Zirkelschlüsse.
- `BLOB_STORE_ID` und Zugriffsverfahren sichern; kurzlebige `VERCEL_OIDC_TOKEN` nicht als dauerhaft nutzbaren Zugang
  behandeln. Neue Store-Tokens müssen im Notfall aus dem gesicherten Kontozugang erzeugt werden können.
- Backupjob braucht den Credential-Keyring nicht: Er kopiert dessen verschlüsselte DB-Werte unverändert.
  Kein privater Backup-Schlüssel im täglichen Workflow. Secrets weder ins Git noch in Manifest-Klartext, Logs oder Artefakte.
- Vor Abschluss den Tresorzugriff von einem zweiten Gerät und ohne bestehende Vercel-/Neon-Sitzung prüfen.

„Kompletter Stand“ bedeutet ein zusammengehöriges Wiederherstellungspaket plus den getrennt geschützten Tresor.
Clerk-Konten, externe E-Mail-Dienste und Anbieteraccounts sind nicht Bestandteil eines PostgreSQL-Dumps.
Erhalt der bestehenden Clerk-Instanz und ein dokumentierter Wiederanbindungs-/Neueinladungsweg sind deshalb
Teil des Runbooks; keine automatische Wiederherstellung fremder Login-Passwörter versprechen.

## Migrationen und Wiederherstellung

Das Repository nutzt `packages/db/scripts/run-migrations.ts` und die Tabelle **`schema_migrations`**.
Der Runner überspringt registrierte Dateinamen; deshalb gehören zusätzlich SQL-Prüfsummen ins Backupmanifest.

1. Gewünschte vollständige Backup-ID wählen, Schlüssel aus dem Tresor holen, Prüfsummen prüfen und entschlüsseln.
2. Leere isolierte Datenbank mit kompatibler PostgreSQL-Version und benötigten Extensions anlegen.
   Rollen/Rechte separat rekonstruieren: Ein einzelner `pg_dump` sichert keine vollständige Clusterkonfiguration.
3. Dump einschließlich Schema, Daten, Sequenzen und `schema_migrations` wiederherstellen. **Nicht zunächst das
   heutige Schema migrieren und danach einen alten Dump darüberlegen.**
4. Dateien in einen neuen privaten Restore-Store zurückkopieren. Wenn Keys/Store-URLs nicht identisch bleiben,
   alle Referenzen kontrolliert anhand Manifest umschreiben und Downloads über den Storage-Adapter prüfen.
   Niemals durch einen Restore-Lauf Produktionsobjekte überschreiben.
5. App aus dem gesicherten Produktionscommit mit dessen Lockfile und passendem Keyring starten.
   Migrationen/Seeds laufen nicht automatisch. Mailversand, Outbox, Cron, Webhooks und externe Schreibaktionen
   bleiben gesperrt; keine echten Kundensessions für den Test freischalten.
6. Erst den ursprünglichen Stand prüfen: Onboardingantworten, Feedbackverlauf, Originaldateien, Thumbnails,
   Berechtigungen und tatsächlicher Reveal eines zuvor angelegten ungefährlichen Test-Credentials.
   Nur das Testergebnis protokollieren, niemals den Passwortwert.
7. Bei Upgrade auf den heutigen Code zuerst eine Kopie des wiederhergestellten Stands erstellen, dann nur
   ausstehende Migrationen mit dem vorgesehenen Runner anwenden. Registrierte SQL-Dateien nicht ändern,
   neu einspielen oder aus `schema_migrations` löschen. Hashabweichungen und unbekannte Migrationen stoppen den Ablauf.
8. Smoke-/Integrationstests erneut ausführen. Rückweg bleibt die unangetastete restaurierte Ausgangskopie;
   destruktive Migrationen besitzen keinen pauschal sicheren Down-Migrationsweg.
9. Erst nach expliziter Freigabe im Notfall Writes stoppen, seit dem Sicherungszeitpunkt fehlende Änderungen
   bewerten und DB/Store/Secrets gemeinsam umschalten. Bereits gesendete Jobs nicht blind erneut ausführen.
   Zwischenzeitliche Löschungen, Zugangssperren und widerrufene Mitgliedschaften vor Portalöffnung erneut durchsetzen.

Vor jeder produktiven Migration zusätzlich einen vollständigen manuellen Sicherungslauf mit Erfolg abwarten.
Deployment und Backup teilen eine nachweislich wirksame Sperre; eine GitHub-Concurrency-Gruppe allein sperrt
keine separat gestartete Vercel-Deployment- oder lokale Migrationsausführung.

## Umsetzungspakete und Abnahme

### CRM-34a-T1 — Inventar und Wiederherstellungszugänge

- [ ] DB, alle Blob-Stores/-Referenzen, Produktionscommit, Konfiguration und externe Dienste inventarisiert.
- [ ] Backupanbieter/-region und Kosten geprüft; getrenntes Konto, MFA und private Zugriffsregeln eingerichtet.
- [ ] Tresor samt Keyring, Backupschlüssel und Offline-Recovery vollständig und unabhängig erreichbar.
- [ ] Geplante neue Server-/Workflow-Variablen ohne Werte dokumentiert; keine Secrets in öffentlichen Variablen.

### CRM-34a-T2 — Automatisierung und Konsistenz

- [ ] Geplanter und manueller Lauf; direkte DB-Verbindung, vollständiger Dump und unveränderliche Dateikopien.
- [ ] Konkurrenz mit Deployment, Migration, Upload, Löschung und Cleanup durch Tests abgedeckt.
- [ ] Fehlende Dateien, Hashfehler, Dump-/Uploadabbruch und Wiederholung erzeugen keinen falschen Erfolgsmarker.
- [ ] Code-, Migrations-, Konfigurations- und Dateimanifest bilden eine eindeutig vollständige Generation.
- [ ] Backupjob darf Sicherungen anlegen, aber keine alten Generationen löschen; Retention hat separate Berechtigung.
- [ ] Rotation erhält alle von verbleibenden Generationen benötigten Dateien und Schlüssel.

### CRM-34a-T3 — Überwachung und Free-Limits

- [ ] Externer Monitor alarmiert auch, wenn GitHub gar nicht startet oder keine Secrets mehr verfügbar sind.
- [ ] Sofortiger Fehleralarm und fehlender Erfolgs-Heartbeat praktisch getestet; keine CRM-Outbox-Abhängigkeit.
- [ ] Neon-Compute, DB-Größe und Transfer einschließlich täglicher Dumps überwacht; Speicher-/Actions-Kosten erfasst.
- [ ] Benachrichtigungen enthalten nur Backup-ID, Phase und technische Fehlerklasse, keine Kundendaten.

### CRM-34a-T4 — Vollständiger Restore und Freigabe

- [ ] DB plus Blob-Dateien plus gesicherter App-/Schema-Stand aus genau einer Backup-ID wiederhergestellt.
- [ ] Passwort-Test mit richtigem Keyring erfolgreich; fehlender/falscher Schlüssel wird als Fehler erkannt.
- [ ] Ältere Generation zunächst mit passendem Code, anschließend auf Kopie mit neueren Migrationen getestet.
- [ ] Gemessene Dauer, Datenlücke, Hashprüfung, externe Grenzen und Wiederanbindungsweg dokumentiert.
- [ ] Monatlicher Drill terminiert; Moritz ist Betriebsverantwortlicher und Alarmempfänger.
- [ ] Relevante Tests und Repository-Gates grün; Runbook ohne geheimes Vorwissen ausführbar.

## Abgrenzung und Rollback

Backupautomation und erster Restore werden aus Task 34/Ordner 21 vorgezogen. Datenschutzexport, Purge und
weitere Produktivabnahmen bleiben dort; sie verwenden diese Sicherung und erweitern sie bei Bedarf.
Die früher geplanten zwölf Monatskopien und isolierte 90-Tage-Dateifrist werden durch die gemeinsame
30-Tage-Aufbewahrung ersetzt. Eine spätere längere Frist muss DB, Dateien und Schlüssel gemeinsam verlängern.

Bei fehlerhaftem Workflow Rotation pausieren, letzte vollständige Generation erhalten und Sicherung manuell
nach Runbook ausführen. Kein Zurücksetzen der produktiven Datenbank als Rollback einer Backupänderung.

## Technische Quellen

- [Neon-Pläne](https://neon.com/docs/introduction/plans): Free bietet derzeit sechs Stunden History,
  einen manuellen Snapshot und keine geplanten Snapshots; konkrete Kontolimits vor Einrichtung prüfen.
- [GitHub-Zeitpläne](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule):
  Ausführung vom Default-Branch, mögliche Verzögerungen; daher unabhängige Ausfallüberwachung.
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html): konsistenter logischer
  Datenbankexport, Custom-Format und Grenzen bei Clusterobjekten.
