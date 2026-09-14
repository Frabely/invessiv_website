# CRM & Kundenportal — verbindliche Entscheidungen

> **Scope:** Planung für `apps/workspace`, `packages/db`, `packages/common`, `packages/storage`
> und `packages/mail`.
>
> **Stand:** 13. September 2026 · geprüft und entscheidungsvollständig.
>
> **Umfang:** 26 einzeln merge- und deploybare Einheiten, insgesamt **80–105 Personentage**
> inklusive Tests, Reviewkorrekturen, Migrationen und Betriebsdokumentation.

## Ziel und Lieferprinzip

Ein produktionsreifes, ausschließlich von Invessiv genutztes CRM für zunächst zwei bis fünf
interne Nutzer. Es führt Kunden, globale Personen, Projekte, Aufgaben, Dokumente, Feedback,
Portalnachrichten, Zugangsdaten, Renewals und informative Stundenkontingente zusammen.

Jeder geordnete Ordner ist ein eigenständiger PR. Nach seinem Merge muss `master` vollständig
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
- Jeder angemeldete Mensch besitzt eine persistierte `users.id`; Clerk authentifiziert, die eigene DB autorisiert.
- `workspace_members` und spätere `portal_memberships` modellieren Zugehörigkeit, nicht die globale Identität.
- `people` bleibt das fachliche CRM-Kontaktmodell und kann mit oder ohne Login existieren.
- Rollen sind persistierte, frei benennbare Bündel atomarer Permissions. Ein Mitglied kann mehrere Rollen besitzen;
  seine effektiven Rechte sind deren Vereinigung.
- Features, Commands und Bereiche verlangen Permissions und prüfen niemals einen hart codierten Rollennamen.
- Workspace- und Portalrollen liegen in getrennten Realms und sind nicht untereinander zuweisbar.
- Die geschützte Systemrolle `workspace_owner` besitzt alle Workspace-Rechte. Mindestens ein aktiver Owner bleibt
  erhalten; Vergabe und Entzug laufen über einen geschützten Flow.
- `roles.manage`, `members.manage`, `data.export`, `data.purge` und `security.audit` sind nicht delegierbar und können
  keiner benutzerdefinierten Rolle zugewiesen werden.
- `credentials.reveal` ist eine normale Permission. Sie liegt in der Owner-Rolle und in der gezielt zuweisbaren
  Systemrolle `workspace_credentials_manager`; ein separates `credentials_access`-Autorisierungsflag entfällt.
- Fehlende Permission, unvollständige Identität und DB-Fehler lehnen den Zugriff fail-closed ab.
- Es gibt kein `customers.delete`: in Version 1 existiert kein Löschbutton, nur der Owner-Purge.
- Permissions kommen ausschließlich über Rollen; direkte User-Permissions gibt es nicht. Bereiche kennen nur ihre
  Permission (`WORKSPACE_AREA_PERMISSIONS`), nie eine Rolle.
- Clerk bleibt Identitätsanbieter. MFA ist optional und wird nicht durch die App erzwungen.
- Der erste Owner entsteht atomar über `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`, nur solange kein aktiver Owner existiert.
  Es gibt keine E-Mail-Allowlist und keinen Fallback; bei DB-Fehlern bleibt der Zugang geschlossen.
- Sicherheitsrelevante Änderungen (Mitglieder, Rollen, Owner, später Credential-Reveal und Purge) landen in der
  append-only Tabelle `security_events`, nicht in `activities`.

### Zugriffsbereiche (Entscheidung des Nutzers, 14.09.2026)

Umsetzung in Ordner 07a–07c (Task 36–38), nach Projekten und vor Aufgaben.

- Rollen können zusätzlich **an einen Kunden oder ein Projekt gebunden** zugewiesen werden („Rolle X auf Kunde Y“).
  Rechte bleiben rollenbasiert: kein Deny, keine direkten User-Permissions, keine Attributregeln. Konstellationen wie
  „Projekt 1: Chat, Projekt 2: nur Aufgaben“ entstehen ausschließlich über Konfiguration in der UI.
- Effektive Rechte auf einem Datensatz = workspace-weite Rollen ∪ Rollen am Kunden ∪ (bei Projektdaten) Rollen am
  Projekt. Vererbung nur nach unten; eine Projektbindung öffnet keine kundenweiten Daten.
- Jede wirksame Bindung macht den Kundenkopf (Nummer, Anzeigename, Status) sichtbar, eine Projektbindung zusätzlich den
  Projektkopf. Darüber hinaus gilt nur, was die gebundenen Permissions erlauben.
- Die Systemrolle `workspace_owner` sieht immer alles, weil sie alle Permissions workspace-weit besitzt.
- Zuständigkeit (`owner_member_id`, Bearbeiter) gewährt **keine** Rechte. Zuständig werden kann nur, wer am Datensatz
  das in der Ownership-Registry deklarierte Recht hat. Rechteentzug wird nie durch Zuständigkeiten blockiert;
  Zuständigkeiten ohne Zugriff werden sichtbar markiert.
- Bindbar sind nur Permissions mit `scopable = true` (Kunden-, Projekt-, Aufgaben-, Datei-, Chat-, Renewal-, Stunden-,
  Credential- und Portalverwaltungsrechte); nur Rollen mit `scope_assignable = true` sind bindbar. Die DB erzwingt das
  per zusammengesetzten Fremdschlüsseln. Leads, Dashboard, Mitglieder, Rollen, Export, Purge und Audit bleiben
  workspace-weit.
- Ab Ordner 07b filtert jede CRM-Query über `accessScope`, jeder CRM-Schreibpfad prüft `canOn`. Fehlende Sichtbarkeit
  antwortet 404. Jede neue CRM-Permission wird bei ihrer Einführung als bindbar oder workspace-weit eingeordnet.
- Zugriffe verwaltet, wer `members.manage` besitzt. Jede Vergabe und jeder Entzug erzeugt genau einen
  `security_events`-Eintrag.
- Leads bleiben global. Der Zuschnitt gilt nur für den CRM-Bereich.

### Kunden und Personen

- Ein Kunde ist die Klammer für mehrere Projekte.
- Kundenstatus: `active`, `paused`, `archived`.
- Archiv ist reversibel und der einzige UI-Zustand zum Ausblenden; kein Papierkorb und kein
  Löschbutton in Version 1.
- Kundennummer als Sequenz, Anzeige `K0001`; stabil und eindeutig, aber nicht lückenlos.
- Kundentyp `company | individual`; `display_name` ist Pflicht.
- **Der Anzeigename (`display_name`) ist eindeutig** — normalisiert über `lower(btrim(...))`, über alle Status
  einschließlich `archived`, erzwungen per Unique-Index (Migration in Ordner 04). Das ist der einzige Schutz gegen
  doppelte Kundenanlage: kein Idempotenzschlüssel, keine Ähnlichkeitssuche, keine Dublettenwarnung. Echte
  Namensgleichheit löst der Owner über einen unterscheidenden Anzeigenamen (Entscheidung des Nutzers, 13.09.2026;
  ersetzt die frühere Warn-statt-Verbot-Regel).
- Firmenname, Domain und USt-ID sind nicht unique.
- Kein Merge-Flow; seltene Dublettenbereinigung erfolgt kontrolliert über die Datenbank.
- Personen sind globale Datensätze. `customer_contact_assignments` ordnet eine Person beliebig
  vielen Kunden zu.
- Funktion, Rolle sowie abweichende geschäftliche E-Mail und Telefonnummer liegen an der Zuordnung.
- Jeder Kunde benötigt bei Anlage genau einen Primärkontakt. Kunde und Zuordnung entstehen atomar.
- Jeder Kunde besitzt genau einen internen Owner.
- Beim Owner-Wechsel gehen alle offenen Projekte, Aufgaben und Renewals atomar an den neuen Owner;
  abgeschlossene Datensätze behalten die historische Zuordnung.
- Jedes aktive interne Mitglied darf Kunden, Projekte und Aufgaben neu zuweisen; jede Änderung wird
  mit Actor, Alt- und Neuzuweisung protokolliert. Ab Ordner 07b gilt zusätzlich: Der Zuweisende braucht das
  Schreibrecht am Datensatz, der neue Zuständige das in der Registry deklarierte Recht (Abschnitt „Zugriffsbereiche“).
- Vor Deaktivierung eines Mitglieds ist die Übergabe sämtlicher aktiver Zuständigkeiten Pflicht. Ordner 03c führt die
  exhaustive Prüfung ein und sperrt die Deaktivierung, solange eine offene Zuständigkeit besteht. Die eigentliche
  Übergabe folgt nach der Kundenakte als Task 02f in Ordner 05. Der einzige aktive Owner ist geschützt.
- Zuständigkeiten laufen über eine **exhaustive Registry** (`OwnableEntity` plus zunächst
  `satisfies Record<OwnableEntity, ResponsibilityCounter>` in Ordner 03c). Task 02f erweitert denselben Vertrag in
  Ordner 05 zu `satisfies Record<OwnableEntity, OwnershipAdapter>`. Eine neue besitzbare Entität in
  Ordner 07, 08 oder 11 bricht den Typecheck, bis sie registriert ist — Vergessen ist damit ein
  roter Build und kein stiller Datenfehler.

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
- Kunden erhalten gebündelte E-Mail-Hinweise, höchstens **einmal je 12 Stunden** je Mitgliedschaft.
  Das Fenster liegt als Konstante `PORTAL_DIGEST_WINDOW_HOURS` in `packages/common`; die Umstellung
  auf 24 Stunden ist eine Zeile und keine Migration.
- Kundenmails sind abschaltbar: `portal_memberships.email_notifications_enabled`, Default true. Der
  Wert wird bereits beim Einladen gesetzt und ist danach vom Portalmitglied selbst sowie intern
  änderbar. Der Outbox-Job filtert darauf in der Abfrage.
- Interne Benachrichtigungen bleiben bei einem 15-Minuten-Fenster; für die Reaktionszeit im Alltag
  ist Schnelligkeit gewünscht, und interne Mitglieder sind keine Kunden.
- Keine freien CRM-Mails und kein Mail-Eingang in Version 1.
- Systemmails nutzen eine Invessiv-Reply-To-Adresse. Versand und Fehler werden gespeichert; kein
  Öffnungs- oder Klicktracking.

### Feedbackrunden

- Eine Feedbackrunde gehört immer zu genau einem Projekt; `project_id` ist Pflicht. Kommunikation
  ohne Projektbezug läuft über den Chat.
- Jede Runde ist ein eigener, nach Absenden unveränderlicher Zeitstand. Es gibt keinen
  serverseitigen Entwurfsstatus.
- Rundennummer fortlaufend je Projekt ab 1. Höchstens eine nicht abgeschlossene Runde je Projekt.
- Status: `submitted` → `in_progress` → `completed`.
- Interner Abschluss bedeutet vollständig umgesetzt und erneut durch den Kunden prüfbar.
- Das Rundenkontingent liegt als `projects.included_feedback_rounds` am Projekt, Default 2, bei
  Anlage und danach intern änderbar. Ein größeres Projekt startet mit 3 oder 4 statt mit einem
  Sonderpfad.
- Ist das Kontingent erschöpft, ersetzt eine Zusatzrunden-Anfrage das Formular. Interne Freigabe
  erhöht das Kontingent um genau 1 und wird mit Actor, Zeitpunkt und Begründung protokolliert.
- Angebot und Abrechnung einer Zusatzrunde liegen außerhalb des CRM; das Portal nennt keinen Betrag.
- Feedbackabschluss verändert die Projektphase niemals automatisch.

### Dateien

- Vercel Blob hinter einem anbieterneutralen `StorageAdapter`.
- Erlaubt: `.pdf`, `.txt`, `.docx`, `.xlsx`, `.pptx`. Keine alten binären oder makrofähigen
  Office-Formate, Bilder, HTML oder Archive.
- 50 MB je Datei; 20 Dateien und 300 MB je Sammelupload.
- Die ZIP-Grenzen (`MAX_ARCHIVE_FILES`, `MAX_ARCHIVE_BYTES`) werden in Ordner 15 **gemessen**, nicht
  geschätzt. Startwerte 100 Dateien und 300 MB gelten als unbestätigt, bis der Durchsatz des
  Blob-Stores gegen das Zeitbudget der Function belegt ist. Passt es nicht, sinkt die Grenze.
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
- **Digests sammeln, sie verwerfen nicht.** Eine Digest-Mail nennt alle Ereignisse seit dem letzten
  Versand an diesen Empfänger („drei neue Nachrichten in zwei Projekten"), nie nur das erste. Der
  Idempotenzschlüssel schützt gegen doppelten **Versand**, nicht gegen das Sammeln.
- Neon bleibt im vorhandenen kostenlosen, über Vercel angebundenen Tarif.
- Täglicher verschlüsselter DB-Dump über GitHub Actions in einen getrennten Vercel-Blob-Store.
- Tägliche Dumps 30 Tage, monatliche 12 Monate, Dateikopien 90 Tage.
- Getrennte Store-Tokens; gemeinsames Vercel-Kontorisiko wird als akzeptiert dokumentiert.
- Ziel: RPO 24 Stunden, RTO 4 Stunden. Quartalsweiser isolierter Restore mit Manifest- und
  SHA-256-Prüfung.

### Infrastruktur-Prämissen (verbindlich)

Diese Werte tragen das gesamte asynchrone Design. Wer sie ändert, ändert die Abnahmekriterien von
Ordner 10, 11, 16, 18 und 21 mit.

**Laufende Kosten bleiben bei Vercel Pro. Kein zusätzlicher Dienst, kein Neon-Upgrade.** Das ist
eine Randbedingung des Designs, keine Nebenbemerkung: der Cron-Takt ist so gewählt, dass er in das
kostenlose Neon-Kontingent passt.

- **Vercel-Plan: Pro** (vorhanden). Erlaubt minutengenaue Cron-Ausdrücke und mehrere Cron-Einträge.
- **Kein Hobby-Plan.** Dort wäre nur ein Lauf pro Tag möglich; Reminder, Digests, Retry, Lease-Ablauf
  und Purge-Schritte hätten je Schritt bis zu 24 Stunden Latenz. Der Plan ist so nicht umsetzbar.
- **Neon Free bleibt.** 100 CU-Stunden je Projekt und Monat, Scale-to-Zero nach 5 Minuten Inaktivität
  und nicht abschaltbar, Autoscaling bis 2 CU, 0,5 GB Storage. Wird das Kontingent überschritten, **suspendiert Neon die
  Compute bis zum Monatswechsel** — bestehende Verbindungen brechen ab, neue
  kommen nicht zustande. Es gibt keine Overage-Rechnung und kein Throttling, sondern einen
  Komplettausfall. Das Cron-Budget ist damit eine Verfügbarkeitsfrage, keine Kostenfrage.

### Cron-Takt (zweigeteilt, verbindlich)

Jedes Aufwecken einer schlafenden Neon-Compute kostet Cold Start plus Query plus die 5 Minuten Idle
bis zum nächsten Suspend — rund **5,5 Minuten Wachzeit je Lauf**, fast unabhängig davon, wie wenig
der Lauf zu tun hat. Entscheidend ist die Zahl der Weckvorgänge, nicht die Arbeit. Tagsüber ist die
Datenbank durch die interne Nutzung ohnehin wach; dort ist ein zusätzlicher Lauf praktisch gratis.
Nachts und am Wochenende ist der Cron der einzige Kostenträger.

Deshalb zwei Cron-Einträge statt einem:

| Fenster                        | Intervall      | Weckvorgänge     | Wachzeit/Monat |
| ------------------------------ | -------------- | ---------------- | -------------: |
| Werktags, Geschäftszeit        | **15 Minuten** | 48/Tag × 22 Tage |          ~97 h |
| Nächte, Wochenenden, Feiertage | **2 Stunden**  | 12/Tag           |          ~25 h |
| **Summe**                      |                |                  |     **~122 h** |

Bei 0,25 CU sind das rund **31 CU-Stunden** — und zwar als Obergrenze, weil die Rechnung annimmt,
dass kein Mensch die App benutzt. Es bleiben etwa **69 CU-Stunden** für den Alltagsbetrieb, also
grob 275 Wachstunden oder 12 Stunden je Werktag. Das ist für zwei bis fünf interne Nutzer reichlich.

Zum Vergleich, warum es nicht ein flaches Intervall ist: ein Cron alle fünf Minuten unterläuft das
Suspend dauerhaft und kostet ~182 CU-Stunden — das **1,8-fache** des gesamten Kontingents, und das
Kontingent wäre um den 17. des Monats leer.

### Was der Takt fachlich bedeutet

- Interner Digest: 15-Minuten-Fenster, in der Geschäftszeit exakt getroffen.
- Aufgabenreminder: ±15 Minuten in der Geschäftszeit, außerhalb bis zum nächsten Lauf. Ein Reminder
  für 03:00 erscheint am Morgen — das ist gewollt und kein Mangel.
- Kundendigest (12 h), Uploadbereinigung (24 h), Renewal-Erinnerungen (30/14/7 Tage): unberührt.
- Überfälligkeitsmarker: rein aus Querydaten, braucht keinen Cron (Ordner 09).
- Retry mit exponentiellem Backoff: profitiert vom Abstand, statt zu leiden.
- Purge-Saga: 15 Minuten je Schritt in der Geschäftszeit; bei einem owner-ausgelösten Vorgang
  irrelevant.

### Betriebspflichten daraus

- **Intervalle als Konstanten**, nicht als Zahlen in `vercel.json` verstreut. Eine Änderung ist ein
  bewusster Schritt mit neuer Budgetrechnung.
- **Monatliche Sichtprüfung** der CU-Stunden im Neon-Dashboard, dokumentiert im Runbook aus
  Ordner 10. Schwelle: liegt der Verbrauch am 20. des Monats über 75 CU-Stunden, wird das
  Nachtintervall gestreckt oder auf ein bezahltes Neon-Paket gewechselt — bevor die Suspendierung
  eintritt, nicht danach.
- **Storage im Blick behalten:** 0,5 GB ist die zweite Decke mit derselben Folge. Dokumente liegen
  in Vercel Blob, aber `activities`, `messages` und `outbox_jobs` wachsen dauerhaft.
- **Erledigte Outbox-Jobs werden abgeräumt** (Erfolgreiche nach 30 Tagen, dauerhaft fehlgeschlagene
  nach 180 Tagen) — sonst wächst die Queue-Tabelle ohne Grenze in ein 0,5-GB-Limit.
- **Eskalationspfad, falls es doch nicht reicht:** Neon Launch mit abschaltbarem Scale-to-Zero
  kostet bei 0,25 CU dauerhaft wach rund 19 $ im Monat. Dann geht der Takt auf fünf Minuten und die
  Zweiteilung entfällt. Das ist eine Konstantenänderung, kein Umbau.

### Function-Laufzeit

- Der konkrete `maxDuration`-Wert der ZIP-Route wird vor Ordner 15 gemessen und dort eingetragen.
  Das serverseitige Zeitbudget leitet sich daraus ab und liegt darunter, damit ein Überschreiten eine
  Meldung erzeugt und keinen Abbruch mitten im Download.
- `maxDuration`, die beiden Cron-Intervalle und die Neon-Tarifentscheidung werden im PR der
  jeweiligen Einheit ausdrücklich benannt.

## Datenmodell auf Domänenebene

```text
users
  └── kanonische menschliche Identität und Stammdaten

workspace_members
  ├── user_id, active
  ├── workspace_member_roles ── roles ── role_permissions ── permissions
  ├── workspace_member_scoped_roles ── roles · customers · projects   (Ordner 07a)
  └── fachliche Zuständigkeiten / notifications / job ownership

people
  ├── preferred_locale
  └── customer_contact_assignments ── customers
                                      ├── projects ──┬── tasks / task_series
                                      │              └── feedback_rounds
                                      │                  └── feedback_round_requests
                                      ├── portal_memberships ── conversation_reads
                                      ├── conversations ── messages ── message_files
                                      ├── customer_credentials
                                      ├── customer_renewals
                                      ├── customer_tags
                                      └── retainers ── time_entries

files ── genau ein Scope: customer | project | feedback_round
activities ── Lead- und CRM-Historie
security_events ── append-only Sicherheitsprotokoll (Mitglieder, Rollen, Owner, Reveal, Purge)
outbox_jobs ── zuverlässige asynchrone Seiteneffekte
```

### Tabellennamen (verbindlich)

Kindtabellen eines Aggregats tragen den Aggregatnamen als Präfix — wie die bestehenden
`lead_activities`, `lead_categories`, `lead_submissions` und `lead_email_contacts` in
`packages/db/src/record-configuration/`. Verbindlich sind damit `customer_contact_assignments`,
`customer_credentials`, `customer_renewals` und `customer_tags`.

Präfixfrei bleiben eigenständige und querschnittliche Tabellen: `users`, `workspace_members`, `permissions`, `roles`,
`role_permissions`, `workspace_member_roles`, `workspace_member_scoped_roles`, `people`,
`customers`, `projects`, `tasks`, `task_series`, `portal_memberships`, `portal_invitations`,
`conversations`, `messages`, `message_files`, `conversation_reads`, `feedback_rounds`,
`feedback_round_requests`, `retainers`, `time_entries`, `files`, `activities`, `security_events`, `outbox_jobs`,
`notifications`.

`portal_memberships` und `feedback_rounds` sind bewusst präfixfrei: sie ersetzen die früheren
`customer_portal_users` und `customer_submissions` nicht nur im Namen, sondern im Modell —
Mehrfirmen-Mitgliedschaft statt 1:1-Bindung, unveränderliche Runde statt Einreichung mit Entwurf.

## Contracts und Fehlerverhalten

- Exportierte String-Unions als Const-Objekt plus abgeleitetem Typ.
- Bearbeitbare DTOs tragen `version`; veraltete Writes liefern 409 mit aktuellem Stand.
- Commands liefern Result-Unions. Routes mappen zentral auf 400/401/403/404/409/422/500.
- Fremde Portalressourcen antworten 404.
- Mutationen verlangen einen Idempotenzschlüssel, wenn Wiederholung realistisch ist.
- Keine Business-Logik in Route- oder UI-Dateien.

## Wiederverwendete Muster

Nichts davon wird neu erfunden. Vor jedem neuen Baustein wird hier geprüft, ob es die Sache schon
fertig und getestet gibt — der Leads-Bereich deckt den Großteil ab.

| Baustein              | Quelle                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Tabellendefinition    | `packages/db/src/record-configuration/leads.ts`                                                                                 |
| Migrationen           | `packages/db/migrations/0020_*.sql` + `packages/db/scripts/run-migrations.ts`                                                   |
| Enums / Const-Objekte | `packages/common/src/constants/contact/contact-lead-statuses.ts`                                                                |
| Fehlercodes           | `packages/common/src/constants/leads/errors/lead-error-codes.ts`                                                                |
| Kategorien-Tabelle    | `packages/db/src/record-configuration/lead-categories.ts` (wird **mitgenutzt**, nicht kopiert)                                  |
| Activity-Service      | `apps/workspace/src/server/workspace/shared/services/activity-service.ts`                                                       |
| Schreibpfad           | `apps/workspace/src/server/workspace/leads/command-handler/update-lead.command-handler.ts` + `app/api/workspace/leads/route.ts` |
| Ausblenden per Filter | `apps/workspace/src/server/workspace/leads/query-handler/lead-filter.query-handler.ts`                                          |
| Listen-UI             | `apps/workspace/src/components/workspace/leads/table/**`                                                                        |
| URL-State             | `apps/workspace/src/common/constants/leads/list/lead-list-query-params.ts`                                                      |
| Create/Edit-Dialog    | `apps/workspace/src/components/workspace/leads/form/lead-form-dialog/**`                                                        |
| Detail-Panel          | `apps/workspace/src/components/workspace/leads/detail/lead-detail-panel/**`                                                     |
| Badges                | `apps/workspace/src/components/workspace/leads/shared/{lead-category-badge,lead-source-badge}/**`                               |
| Empty-State           | `apps/workspace/src/components/workspace/leads/table/leads-empty-state/**`                                                      |
| Upload-Route          | `apps/workspace/src/app/api/workspace/leads/import/route.ts`                                                                    |
| Bulk-Aktionen         | `apps/workspace/src/app/api/workspace/leads/bulk/route.ts` + `components/.../table/bulk/**`                                     |
| Seed-Skript           | `packages/db/scripts/seed-leads-fixture.ts` (Vorlage für `db:seed:crm`)                                                         |
| Smoke-Test            | `packages/db/scripts/smoke-test.ts`                                                                                             |
| ZIP                   | `apps/web/src/client/linkedin-post/services/linkedin-post-zip-download-service.ts`                                              |
| HMAC / Token          | `apps/web/src/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-key-service.ts`                           |
| DB-Rate-Limit         | `packages/db/src/linkedin-post/reserve-linkedin-post-generator-usage-limit.ts`                                                  |
| Mail                  | `apps/web/src/server/services/mail/**`                                                                                          |

Geteilte Listenbausteine wandern erst bei **tatsächlicher** Wiederverwendung nach
`components/workspace/shared/` — nicht vorsorglich. Der Umzug ist risikoarm, solange es genau einen
Aufrufer gibt; der Nachweis sind unveränderte, grüne Bestandstests.

**Ablage geteilter UI-Bausteine (13.09.2026, mit dem Nutzer abgestimmt):** Hybrid. App-neutrale Grundbausteine (Dialog,
Bestätigungsdialog, Seitenpanel, Detail-Sektion, Definitionsliste, Empty-State, Badge, Formularfeld) gehören
nach `packages/ui`; URL- oder Dictionary-gebundene Teile (Pagination, Sortierung, Selection, Suche, Facettenfilter,
Timeline) nach `components/workspace/shared/`. Der Umzug erfolgt als eigener Refactoring-Ordner 03d vor Ordner 04 und
ersetzt die Zielentscheidung „nicht `packages/ui`" aus Task 02a. **Ergänzt 14.09.2026 (mit dem Nutzer abgestimmt):**
Button und Formularbausteine ziehen aus beiden Apps ebenfalls nach `packages/ui`; Task 02e (Ordner 03d) übernimmt auch
den Listenumzug aus Task 02a und liefert alles in kleinen Review-Schritten mit je höchstens zwei Bausteinen.

## Vor dem ersten echten Kunden (verbindlich)

Kein Code, aber blockierend, sobald ein Kunde Ordner 12 erreicht:

- **Clerk auf „Restricted"** stellen. `proxy.ts` lässt `/sign-up(.*)` öffentlich durch — offen
  gelassen kann jeder ein Konto anlegen. Danach entstehen **alle** Konten über eine Einladung:
  Portalkontakte über den Token-Flow aus Ordner 12, interne Mitglieder über eine Einladung im
  Clerk-Dashboard.
- **Master-Key für die Zugangsdaten** zusätzlich offline im eigenen Passwortmanager sichern, **bevor**
  der erste Datensatz entsteht. Der Plan kann Schlüssel rotieren, aber nicht verlieren: eine geleerte
  Vercel-Env macht alle Zugangsdaten dauerhaft unlesbar.
- **`PORTAL_DIGEST_WINDOW_HOURS`** und die Absenderadresse für Systemmails in allen
  Deployment-Umgebungen gesetzt und in `.env.example` dokumentiert.
- **`apps/workspace/vercel.json`** liegt am Root Directory des Vercel-Projekts — sonst läuft der
  Outbox-Cron aus Ordner 10 nie an, und Reminder, Digests und Aufräumjobs bleiben stumm.
- **DSGVO-Grundlagen**: Auskunfts- und Löschkonzept, Löschfristen, Datenexport. Das passiert **in**
  diesem Plan (Ordner 21), nicht danach.
- **Backup nachgewiesen wiederhergestellt** (Ordner 21), nicht nur eingerichtet.

## Migrationen

- Nummer zur Umsetzung als höchste vorhandene Nummer plus eins bestimmen.
- Standardablauf für Datenumzüge: Expand → Dual-Write → Backfill → Read-Cutover → späterer Cleanup.
- **Ausnahme Activity-Umzug (Ordner 02):** direkter Umzug. Die Migration legt `activities` an,
  übernimmt `lead_activities` mit derselben ID und bricht bei Abweichung ab; ab dem Deploy lesen und
  schreiben alle Pfade nur `activities`. Begründung: geringer Wert der Bestandsdaten und betrieblich
  zugesichert keine Activity-Writes zwischen Migration und Deploy. Folge: Einträge zwischen Deploy und
  einem Revert sieht die alte Version nicht — bewusst akzeptiert.
- **Ausnahme Legacy-Spalten `workspace_members` (Ordner 03):** `clerk_user_id`, `email`, `role` und
  `credentials_access` werden direkt entfernt. Begründung: Die Tabelle ist leer, keine App-Version liest sie, und ein
  Preflight bricht die Migration bei vorhandenen Daten vor der ersten Änderung ab. Ordner 03a entfällt dadurch.
- Ein Backfill erhält eine neue registrierte Migration oder einen separat versionierten Job. Eine
  bereits in `schema_migrations` gespeicherte Datei wird niemals verändert.
- Jede Merge-Einheit bleibt kompatibel zur unmittelbar vorherigen App-Version.
- Denormalisierte Kundenbezüge erhalten zusammengesetzte Constraints oder werden abgeleitet.
- Blob-Löschungen sind nie Teil einer DB-Transaktion. Purges laufen als idempotente Saga und
  entfernen DB-Zuordnungen erst nach erfolgreicher Storage-Bereinigung.

## Merge-Einheiten

| #   | Status   | Ordner                                   | Nach dem Merge vollständig nutzbar                                              | Dateien | Aufwand |
| --- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------- | ------: | ------: |
| 01  | gemerged | `01-kernschema-und-contracts`            | Additives Kunden-/Personen-Kernschema ist unsichtbar deployt; Leads unverändert |   50–80 |  3–4 T. |
| 02  | gemerged | `02-activity-migration`                  | Bestehende Lead-Timeline arbeitet verlustfrei auf dem neuen Modell              |   40–70 |  3–4 T. |
| 03  | gemerged | `03-mitglieder-und-auth`                 | Persistierte User, Permission-Katalog, Bereichs-Gates und fail-closed Auth      |  80–120 |  4–5 T. |
| 03b | gemerged | `03b-mitglieder-und-rollenverwaltung`    | Mitglieder, Rollen und Owner-Flow verwaltbar; Aktionen permissionabhängig       | 100–120 |  3–4 T. |
| 03c | läuft    | `03c-uebergabe-und-deaktivierung`        | Mitglieder-Lifecycle mit Owner- und Zuständigkeitssperre                        |   30–50 |  1–2 T. |
| 03d | offen    | `03d-geteilte-ui-bausteine`              | Dialog-, Panel- und Listenbausteine geteilt (`packages/ui` + workspace/shared)  | 170–195 |  4–5 T. |
| 04  | offen    | `04-personen-und-kundenakte`             | Kunden samt Pflichtkontakt, Owner, Archiv und Detail vollständig nutzbar        |  80–100 |  4–5 T. |
| 05  | offen    | `05-kundenliste-und-zuweisung`           | Liste, Suche, Filter, Übergabe und Aufbewahrungshinweise nutzbar                |  60–100 |  3–4 T. |
| 06  | offen    | `06-lead-konvertierung`                  | Leads können sicher neu oder zu bestehenden Kunden konvertiert werden           |   40–70 |  2–3 T. |
| 07  | offen    | `07-projekte`                            | Projektanlage, Status, Workflow und Owner-Zuweisung vollständig nutzbar         |  60–100 |  3–4 T. |
| 07a | offen    | `07a-zugriffsbereiche-fundament`         | Gebundene Rollen in DB, Actor und API unsichtbar und wirkungslos deployt        |   60–90 |    3 T. |
| 07b | offen    | `07b-zugriffsfilter-kunden-und-projekte` | Alle Kunden- und Projektpfade filtern über `accessScope`; Negativtests          |  60–100 |  3–4 T. |
| 07c | offen    | `07c-zugriffsverwaltung-ui`              | Zugriffe je Kunde/Projekt in Settings und Kundenakte konfigurierbar             |   50–80 |  2–3 T. |
| 08  | offen    | `08-aufgaben`                            | Flache Aufgaben, Kundenpflicht und globale Übersicht nutzbar                    |  80–100 |  4–5 T. |
| 09  | offen    | `09-aufgabenserien-und-reminder`         | Wiederholungen, Fälligkeit und Überfälligkeit zuverlässig aktiv                 |   50–90 |  3–4 T. |
| 10  | offen    | `10-jobs-und-benachrichtigungen`         | Outbox-Runner, Glocke, Retry und kritische Fehlerbenachrichtigung aktiv         |  70–100 |  4–5 T. |
| 11  | offen    | `11-renewals`                            | Renewal-Verwaltung und 30/14/7-Erinnerungen vollständig nutzbar                 |   40–70 |  2–3 T. |
| 12  | offen    | `12-portal-identitaet`                   | Einladung, Widerruf und Mehrfirmenwechsel sicher nutzbar                        |  80–100 |  4–5 T. |
| 13  | offen    | `13-portal-dashboard`                    | Portal-Dashboard mit Aufgaben und Projektdaten produktiv nutzbar                |  60–100 |  3–4 T. |
| 14  | offen    | `14-storage-und-upload`                  | Storage-Adapter und sichere Upload-Pipeline unsichtbar sicher deployt           |  70–100 |  4–5 T. |
| 15  | offen    | `15-dateien-und-portal-downloads`        | Datei-UI, Freigabe, Portaldownload und ZIP vollständig nutzbar                  |  70–100 |  4–5 T. |
| 16  | offen    | `16-feedbackrunden`                      | Feedbackrunden im Kontingent plus freigabepflichtige Zusatzrunde nutzbar        |  70–100 |  4–5 T. |
| 17  | offen    | `17-kundenchat-intern`                   | Chat-Datenmodell und interne Chatseite vollständig nutzbar                      |   60–90 |  3–4 T. |
| 18  | offen    | `18-kundenchat-portal`                   | Portalchat, Kundendigest und Abmeldeschalter aktiv                              |   50–80 |  2–3 T. |
| 19  | offen    | `19-credentials`                         | Verschlüsselte Zugangsdaten und Security-Audit vollständig nutzbar              |   50–80 |  3–4 T. |
| 20  | offen    | `20-stunden-und-history`                 | Kontingente, Buchungen und konsolidierte Timeline vollständig nutzbar           |  60–100 |  3–4 T. |
| 21  | offen    | `21-datenschutz-backup-rollout`          | Export, Owner-Purge, Backup/Restore und Produktivabnahme nachgewiesen           |  60–100 |  4–5 T. |
| 22  | offen    | `22-activity-cleanup`                    | `lead_activities` abgebaut, genau eine Activity-Tabelle                         |    5–15 |    1 T. |

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
- Frei konfigurierbare Workflows oder Aufgabenhierarchien.
- Attributbasierte Regeln, explizite Deny-Regeln und Enterprise-IdP-/SCIM-Synchronisation. Die Zugriffsbereiche aus
  Ordner 07a–07c sind keine Attributregeln, sondern gebundene Rollenzuweisungen.

Der frühere detaillierte Plan für freies CRM-Mail-Senden bleibt unter
`zurueckgestellt/31-mail-senden.md` erhalten. Er ist keine Version-1-Merge-Einheit und darf erst
nach einer neuen Scope-Entscheidung umgesetzt werden.

## Qualitäts-Gates

- Pro Einheit fokussierte Unit-/Integration-/E2E-Tests und dokumentierter Rollback.
- Vor Merge: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, relevante DB-Smokes und
  `pnpm --filter @invessiv/workspace build`.
- Bei Web-App-Änderungen zusätzlich `pnpm --filter @invessiv/web build`.
- Portalgrenzen, Credential-Reveal, Purge, Activity-Übernahme und Restore benötigen negative Tests.
