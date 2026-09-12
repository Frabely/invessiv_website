# CRM & Kundenportal — verbindliche Entscheidungen

> **Scope:** Planung für `apps/workspace`, `packages/db`, `packages/common`, `packages/storage`
> und `packages/mail`.
>
> **Stand:** 12. September 2026 · geprüft und entscheidungsvollständig.
>
> **Umfang:** 20 einzeln merge- und deploybare Einheiten, insgesamt **67–87 Personentage**
> inklusive Tests, Reviewkorrekturen, Migrationen und Betriebsdokumentation.

## Ziel und Lieferprinzip

Ein produktionsreifes, ausschließlich von Invessiv genutztes CRM für zunächst zwei bis fünf
interne Nutzer. Es führt Kunden, globale Personen, Projekte, Aufgaben, Dokumente, Feedback,
Portalnachrichten, Zugangsdaten, Renewals und informative Stundenkontingente zusammen.

Jeder nummerierte Ordner ist ein eigenständiger PR. Nach seinem Merge muss `master` vollständig
baubar, migrierbar und produktiv nutzbar bleiben. Dafür gilt je Ordner:

- Schemaänderungen sind mit der vorherigen App-Version kompatibel.
- Neue UI wird erst verlinkt, wenn ihr vollständiger Happy Path und ihre Fehlerzustände funktionieren.
- Noch nicht nutzbare Funktionen bleiben unsichtbar oder hinter einem serverseitigen Feature-Flag.
- Abhängige Tabellen, Handler und UI werden entweder gemeinsam geliefert oder bewusst erst später
  aktiviert.
- Jeder Ordner besitzt eigene Tests, Rollback-Hinweise und ein explizites Merge-Gate.
- Ziel sind **50–100 geänderte Dateien** einschließlich Tests und Migration. Ab 120 Dateien ist vor
  Beginn zu prüfen, ob sich die Einheit ohne Zwischenzustand teilen lässt. **200 geänderte Dateien
  sind eine harte Obergrenze**; darüber darf der Ordner nicht umgesetzt werden.

## Verbindliche Entscheidungen

### Produktgrenze und Rollen

- Strikt Single-Tenant ohne `tenant_id` und ohne vorbereitete Mandantenabstraktion.
- Interne Rollen: `owner` und `member`.
- Alle internen Mitglieder sehen normale CRM-Daten.
- Zugangsdaten benötigen für Mitglieder eine zusätzliche globale Freigabe; der Owner hat sie immer.
- Datenexport, Purge und vollständiges Security-Audit sind Owner-only.
- Clerk bleibt Identitätsanbieter. MFA ist optional und wird nicht durch die App erzwungen.
- Die Env-Allowlist dient nur zum atomaren Bootstrap des ersten Owners. Bei DB-Fehlern bleibt der
  Zugang geschlossen; es gibt keinen Allowlist-Fallback.

### Kunden und Personen

- Ein Kunde ist die Klammer für mehrere Projekte.
- Kundenstatus: `active`, `paused`, `archived`.
- Archiv ist reversibel und der einzige UI-Zustand zum Ausblenden; kein Papierkorb und kein
  Löschbutton in Version 1.
- Kundennummer als Sequenz, Anzeige `K0001`; stabil und eindeutig, aber nicht lückenlos.
- Kundentyp `company | individual`; `display_name` ist Pflicht.
- Firmenname, Domain und USt-ID sind nicht unique. Die UI warnt nur vor möglichen Dubletten.
- Kein Merge-Flow; seltene Dublettenbereinigung erfolgt kontrolliert über die Datenbank.
- Personen sind globale Datensätze. `customer_contact_assignments` ordnet eine Person beliebig
  vielen Kunden zu.
- Funktion, Rolle sowie abweichende geschäftliche E-Mail und Telefonnummer liegen an der Zuordnung.
- Jeder Kunde benötigt bei Anlage genau einen Primärkontakt. Kunde und Zuordnung entstehen atomar.
- Jeder Kunde besitzt genau einen internen Owner.
- Beim Owner-Wechsel gehen alle offenen Projekte, Aufgaben und Renewals atomar an den neuen Owner;
  abgeschlossene Datensätze behalten die historische Zuordnung.
- Jedes aktive interne Mitglied darf Kunden, Projekte und Aufgaben neu zuweisen; jede Änderung wird
  mit Actor, Alt- und Neuzuweisung protokolliert.
- Vor Deaktivierung eines Mitglieds ist die Übergabe sämtlicher aktiver Zuständigkeiten Pflicht.

### Projekte und Aufgaben

- Projektstatus: `planned`, `active`, `paused`, `completed`, `cancelled`, `archived`.
- Projektstatus und fachliche Phase sind getrennt.
- Feste Phasenfolge: `onboarding`, `design`, `development`, `feedback`, `launch`, `maintenance`.
- Zusätzlich `workflow_key = standard_web_v1`, damit weitere Abläufe später additiv entstehen.
- Ein Projekt hat genau einen Owner und übernimmt bei Anlage den Kunden-Owner.
- Abrechnungsart: `fixed_price`, `hourly`, `retainer`, `internal`; ausschließlich EUR.
- Budget und Stundensatz sind niemals portalöffentlich.
- Aufgaben sind flache Einzelobjekte ohne Parent, Unteraufgaben, Checklisten oder Handsortierung.
- Jede Aufgabe hat genau einen internen Bearbeiter.
- Kontext ist genau einer aus intern, Kunde oder Projekt. Bei Projektkontext erzwingt eine
  zusammengesetzte Constraint die Übereinstimmung von Projekt und Kunde.
- `action_side` (`internal | customer`) bestimmt, wer als Nächstes handeln muss. Der interne
  Bearbeiter bleibt auch bei Kundenaufgaben verantwortlich.
- `visible_to_customer` bleibt getrennt; `action_side = customer` erzwingt Sichtbarkeit.
- Jeder aktive Portal-Kontakt der Firma darf eine Kundenaufgabe erledigen. Nutzer und Zeitpunkt
  werden protokolliert. Nur intern darf wieder geöffnet werden.
- Wiederholung: täglich, wöchentlich, monatlich oder jährlich. Jede Wiederholung erzeugt ein neues,
  flaches Aufgabenobjekt; der Rhythmus bleibt am ursprünglichen Termin verankert.
- Serienänderungen gelten wahlweise nur aktuell oder für zukünftige Exemplare.
- Fälligkeit als Datum mit optionaler Uhrzeit; Speicherung in UTC, Geschäftszeitzone Europe/Berlin.
- Überfälligkeit erzeugt einmalig eine In-App-Meldung und bleibt sichtbar markiert.

### Portal und Kommunikation

- Zugang nur über explizite, einmalige Einladung an eine vorhandene Personenzuordnung.
- Einladungstoken nur gehasht speichern, sieben Tage gültig, nach Nutzung oder Widerruf ungültig.
- Ein Clerk-Konto kann mehrere Firmen sicher wechseln; der Firmenwechsler gehört zu Version 1.
- Der aktive Firmenkontext wird serverseitig gegen die Mitgliedschaft geprüft. Portal-Handler
  akzeptieren keine ungeprüfte `customerId` als Autorisierung.
- Alle Portalmitglieder einer Firma erhalten denselben Portalumfang.
- Widerruf wirkt sofort; historische Nachrichten und Audit-Einträge bleiben erhalten.
- Vor der ersten Einladung bestätigt ein Mitarbeiter eine Vorschau aller sichtbaren Projekte,
  Aufgaben, Dateien und Stunden.
- Portalsprache wird pro Person gespeichert (`de | en`).
- Ein gemeinsamer Chat pro Kunde; Lesestände immer pro Portalmitglied.
- Nachrichten sind unveränderlich. Nur der Owner darf rechtswidrige Inhalte protokolliert ausblenden.
- Chatnachrichten referenzieren nur vorhandene, explizit portalöffentliche Dateien.
- Kunden erhalten gebündelte E-Mail-Hinweise, höchstens einmal je 15 Minuten.
- Keine freien CRM-Mails und kein Mail-Eingang in Version 1.
- Systemmails nutzen eine Invessiv-Reply-To-Adresse. Versand und Fehler werden gespeichert; kein
  Öffnungs- oder Klicktracking.

### Feedbackrunden

- Jede Runde ist ein eigener, nach Absenden unveränderlicher Zeitstand.
- Status: `submitted` → `in_progress` → `completed`.
- Interner Abschluss bedeutet vollständig umgesetzt und erneut durch den Kunden prüfbar.
- Zwei Runden sind regulär erlaubt. Danach zeigt das Portal eine Anfrage für eine kostenpflichtige
  Zusatzrunde. Erst interne Freigabe erzeugt die nächste Runde.
- Feedbackabschluss verändert die Projektphase niemals automatisch.

### Dateien

- Vercel Blob hinter einem anbieterneutralen `StorageAdapter`.
- Erlaubt: `.pdf`, `.txt`, `.docx`, `.xlsx`, `.pptx`. Keine alten binären oder makrofähigen
  Office-Formate, Bilder, HTML oder Archive.
- 50 MB je Datei; 20 Dateien und 300 MB je Sammelupload. Ein ZIP-Download umfasst höchstens 100
  Dateien und 300 MB.
- Flache Ablage mit Kategorien statt Ordnerhierarchie.
- Jede Datei gehört exakt einem Kunden-, Projekt- oder Feedbackrundenkontext.
- Neue Dateien sind intern; Portalzugriff erst nach expliziter Freigabe in der DB-Abfrage.
- Keine Versionierung. Erneute Uploads sind unabhängige Dateien.
- Portalnutzer stellen Löschanfragen, löschen aber nicht selbst.
- Prüfung von Erweiterung, normalisiertem MIME-Typ, Dateisignatur, Größe und SHA-256.
- `FileInspectionAdapter` mit `unscanned | pending | clean | rejected | error`; Version 1 nutzt
  einen No-op-Adapter und speichert `unscanned`. Das akzeptierte Risiko wird dokumentiert.
- Abgebrochene, keinem Datensatz zugeordnete Upload-Sessions dürfen nach 24 Stunden technisch
  bereinigt werden. Erfolgreiche Kundendokumente werden nie automatisch gelöscht.

### Zugangsdaten

- Felder: Titel, Login-URL, Benutzername, Passwort, verschlüsselte Notiz.
- AES-256-GCM mit zufälligem Nonce, Auth-Tag, Schlüsselversion und AAD aus Kunde, Credential-ID,
  Feldname und Formatversion.
- Master-Key serverseitig in Vercel und identisch offline im Passwortmanager gesichert.
- Schlüsselrotation entschlüsselt mit alter und verschlüsselt mit neuer Version; ein Adapter hält
  späteren Wechsel zu einem externen Secret-Manager offen.
- Listen und Exporte entschlüsseln nie. Klartext nur über Einzel-Reveal.
- Anzeigen, Kopieren und Ändern werden ohne Geheimwert protokolliert.
- Keine TOTP-Secrets und niemals Portalzugriff.

### Renewals, Stunden und Aufbewahrung

- Renewal-Typen: Domain, Hosting, SSL, Lizenz und `other` mit Pflichtbezeichnung.
- Jeder Eintrag hat einen Bearbeiter, initial den Kunden-Owner.
- In-App-Erinnerung bei 30, 14 und 7 Tagen sowie einmalig bei Überfälligkeit; keine normalen
  internen Reminder-Mails.
- Stundenkontingent gehört zum Kunden; eine Buchung kann optional ein Projekt referenzieren.
- Stunden sind informativ, keine Rechnungsgrundlage und keine Lexware-Schnittstelle.
- Alle Buchungen sind portalöffentlich. Das Formular weist ausdrücklich darauf hin. Änderungen und
  Löschungen werden mit Vorher-/Nachher-Werten protokolliert.
- Pausierte Kunden nach 180 Tagen, archivierte nach 90 Tagen zur manuellen Aufbewahrungsprüfung
  vorschlagen. Frist pro Kunde überschreibbar; keine automatische Löschung.
- Kein Purge-Button. Ein getesteter Owner-Command bietet Vorschau, widerruft Zugriffe, entfernt
  Blobs idempotent und löscht danach DB-Daten. Fehler bleiben als wiederholbarer Job sichtbar.

### Jobs, Outbox und Backup

- Transaktionale DB-Outbox für Systemmails, Benachrichtigungen, Aufgabenserien, Renewals,
  Uploadbereinigung und Purges.
- Jobs haben Idempotenzschlüssel, Status, Versuchsanzahl, nächsten Versuch, Lease und letzten Fehler.
- Workspace-Glocke mit Lesestand pro internem Mitglied. Nur dauerhaft fehlgeschlagene kritische
  Jobs und Sicherheitsprobleme erzeugen interne E-Mails.
- Neon bleibt im vorhandenen kostenlosen, über Vercel angebundenen Tarif.
- Täglicher verschlüsselter DB-Dump über GitHub Actions in einen getrennten Vercel-Blob-Store.
- Tägliche Dumps 30 Tage, monatliche 12 Monate, Dateikopien 90 Tage.
- Getrennte Store-Tokens; gemeinsames Vercel-Kontorisiko wird als akzeptiert dokumentiert.
- Ziel: RPO 24 Stunden, RTO 4 Stunden. Quartalsweiser isolierter Restore mit Manifest- und
  SHA-256-Prüfung.

## Datenmodell auf Domänenebene

```text
workspace_members
  ├── owner/member, active, credentials_access
  └── notifications / job ownership

people
  ├── preferred_locale
  └── customer_contact_assignments ── customers
                                      ├── projects ── tasks / task_series
                                      ├── portal_memberships ── conversation_reads
                                      ├── conversations ── messages ── message_files
                                      ├── feedback_rounds
                                      ├── credentials
                                      ├── renewals
                                      └── retainers ── time_entries

files ── genau ein Scope: customer | project | feedback_round
activities ── Lead- und CRM-Historie
outbox_jobs ── zuverlässige asynchrone Seiteneffekte
```

## Contracts und Fehlerverhalten

- Exportierte String-Unions als Const-Objekt plus abgeleitetem Typ.
- Bearbeitbare DTOs tragen `version`; veraltete Writes liefern 409 mit aktuellem Stand.
- Commands liefern Result-Unions. Routes mappen zentral auf 400/401/403/404/409/422/500.
- Fremde Portalressourcen antworten 404.
- Mutationen verlangen einen Idempotenzschlüssel, wenn Wiederholung realistisch ist.
- Keine Business-Logik in Route- oder UI-Dateien.

## Migrationen

- Nummer zur Umsetzung als höchste vorhandene Nummer plus eins bestimmen.
- Activity-Umzug als Expand → Dual-Write → Backfill → Read-Cutover → späterer Cleanup.
- Ein Backfill erhält eine neue registrierte Migration oder einen separat versionierten Job. Eine
  bereits in `schema_migrations` gespeicherte Datei wird niemals verändert.
- Jede Merge-Einheit bleibt kompatibel zur unmittelbar vorherigen App-Version.
- Denormalisierte Kundenbezüge erhalten zusammengesetzte Constraints oder werden abgeleitet.
- Blob-Löschungen sind nie Teil einer DB-Transaktion. Purges laufen als idempotente Saga und
  entfernen DB-Zuordnungen erst nach erfolgreicher Storage-Bereinigung.

## Merge-Einheiten

| #   | Status | Ordner                            | Nach dem Merge vollständig nutzbar                                              | Dateien | Aufwand |
| --- | ------ | --------------------------------- | ------------------------------------------------------------------------------- | ------: | ------: |
| 01  | offen  | `01-kernschema-und-contracts`     | Additives Kunden-/Personen-Kernschema ist unsichtbar deployt; Leads unverändert |   50–80 |  3–4 T. |
| 02  | offen  | `02-activity-migration`           | Bestehende Lead-Timeline arbeitet verlustfrei auf dem neuen Modell              |   40–70 |  3–4 T. |
| 03  | offen  | `03-mitglieder-und-auth`          | Owner kann Mitglieder sicher verwalten; Auth ist fail-closed                    |   50–80 |  3–4 T. |
| 04  | offen  | `04-personen-und-kundenakte`      | Kunden samt Pflichtkontakt, Owner, Archiv und Detail vollständig nutzbar        |  80–100 |  4–5 T. |
| 05  | offen  | `05-kundenliste-und-zuweisung`    | Liste, Suche, Filter, Übergabe und Aufbewahrungshinweise nutzbar                |  60–100 |  3–4 T. |
| 06  | offen  | `06-lead-konvertierung`           | Leads können sicher neu oder zu bestehenden Kunden konvertiert werden           |   40–70 |  2–3 T. |
| 07  | offen  | `07-projekte`                     | Projektanlage, Status, Workflow und Owner-Zuweisung vollständig nutzbar         |  60–100 |  3–4 T. |
| 08  | offen  | `08-aufgaben`                     | Flache Aufgaben, Kundenpflicht und globale Übersicht nutzbar                    |  80–100 |  4–5 T. |
| 09  | offen  | `09-aufgabenserien-und-reminder`  | Wiederholungen, Fälligkeit und Überfälligkeit zuverlässig aktiv                 |   50–90 |  3–4 T. |
| 10  | offen  | `10-jobs-und-benachrichtigungen`  | Outbox-Runner, Glocke, Retry und kritische Fehlerbenachrichtigung aktiv         |  70–100 |  4–5 T. |
| 11  | offen  | `11-renewals`                     | Renewal-Verwaltung und 30/14/7-Erinnerungen vollständig nutzbar                 |   40–70 |  2–3 T. |
| 12  | offen  | `12-portal-identitaet`            | Einladung, Widerruf und Mehrfirmenwechsel sicher nutzbar                        |  80–100 |  4–5 T. |
| 13  | offen  | `13-portal-dashboard`             | Portal-Dashboard mit Aufgaben und Projektdaten produktiv nutzbar                |  60–100 |  3–4 T. |
| 14  | offen  | `14-storage-und-upload`           | Storage-Adapter und sichere Upload-Pipeline unsichtbar sicher deployt           |  70–100 |  4–5 T. |
| 15  | offen  | `15-dateien-und-portal-downloads` | Datei-UI, Freigabe, Portaldownload und ZIP vollständig nutzbar                  |  70–100 |  4–5 T. |
| 16  | offen  | `16-feedbackrunden`               | Zwei Feedbackrunden plus freigabepflichtige Zusatzrunde nutzbar                 |  70–100 |  4–5 T. |
| 17  | offen  | `17-kundenchat`                   | Gemeinsamer Chat, Lesestände und gebündelte Mailhinweise aktiv                  |  80–100 |  4–5 T. |
| 18  | offen  | `18-credentials`                  | Verschlüsselte Zugangsdaten und Security-Audit vollständig nutzbar              |   50–80 |  3–4 T. |
| 19  | offen  | `19-stunden-und-history`          | Kontingente, Buchungen und konsolidierte Timeline vollständig nutzbar           |  60–100 |  3–4 T. |
| 20  | offen  | `20-datenschutz-backup-rollout`   | Export, Owner-Purge, Backup/Restore und Produktivabnahme nachgewiesen           |  60–100 |  4–5 T. |

Statuswerte: `offen` → `läuft` → `im Review` → `gemerged`. Beim Merge werden die Tabelle und der
Status in der Ordner-README gemeinsam aktualisiert.

Die Dateizahlen sind Review-Schätzungen, keine Zielvorgabe zum künstlichen Aufteilen von Dateien.
Liegt die tatsächliche Änderung unter 50 Dateien und ist fachlich vollständig, bleibt sie ein eigener
mergebarer Ordner. Zusammenlegen allein zum Erreichen des Zielkorridors ist nicht erlaubt.

## Bewusst nicht enthalten

- Mandantenfähigkeit, CSV-Kundenimport, Kundenzusammenführung.
- Rechnungen, Zahlungen, Lexware oder rechtsverbindliche Zeiterfassung.
- Freies CRM-Mailmodul, Mail-Eingang, Trackingpixel.
- Dateiordner, Versionen, Bilder, Bildannotation, Kommentare pro Datei.
- Malware-Scanner, TOTP oder Credential-Freigabe im Portal.
- Frei konfigurierbare Rollen, Workflows oder Aufgabenhierarchien.

Der frühere detaillierte Plan für freies CRM-Mail-Senden bleibt unter
`zurueckgestellt/31-mail-senden.md` erhalten. Er ist keine Version-1-Merge-Einheit und darf erst
nach einer neuen Scope-Entscheidung umgesetzt werden.

## Qualitäts-Gates

- Pro Einheit fokussierte Unit-/Integration-/E2E-Tests und dokumentierter Rollback.
- Vor Merge: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, relevante DB-Smokes und
  `pnpm --filter @invessiv/workspace build`.
- Bei Web-App-Änderungen zusätzlich `pnpm --filter @invessiv/web build`.
- Portalgrenzen, Credential-Reveal, Purge, Activity-Backfill und Restore benötigen negative Tests.
