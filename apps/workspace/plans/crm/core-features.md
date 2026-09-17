# CRM & Kundenportal — Funktionsumfang Version 1

Diese Übersicht beschreibt ausschließlich den verbindlichen Stand aus `00-entscheidungen.md`.
Details und Abnahmekriterien stehen in den aktiven geordneten Merge-Einheiten.

## Internes CRM

- Kundenakte mit stabiler Nummer, Status, Primärkontakt, globalen Personen-Zuordnungen, Kategorie,
  Tags, Owner und Aktivitätsverlauf.
- Kundenliste mit URL-Filtern, normalisierter Suche und Ansichten für aktive, pausierte und
  archivierte Kunden.
- Direkte Lead-Konvertierung über den vorhandenen Kundendialog mit bestätigtem Primärkontakt.
- Nach dem vollständigen Kundenkontext sichtbare und versioniert änderbare Kundenverantwortung; Projekte, Aufgaben,
  Renewals und Chat behalten jeweils eine eigene, unabhängig änderbare Zuständigkeit.
- Konsolidierte „Meine Kunden"-Übersicht je Mitarbeiter (Zuständigkeit, offene strukturierte Projektanfragen, später
  Kundenwert und Pipeline) — ausdrücklich ohne Lead-Daten.
- Dieselbe Übersicht zusätzlich als Kunden-Cockpit-Dialog für genau einen Kunden, aufrufbar aus Kundenliste
  (Tabellen-Action), Kundenformular (Button) und Lead-Liste (Sprung-Action bei bereits konvertiertem Lead) — eine
  gemeinsame Aggregationsfunktion für Liste und Dialog, keine doppelte Berechnung. Interne Mitarbeitersicht mit
  eigener Permission-Prüfung je Sektion (z. B. Preise), ausdrücklich keine Vorschau auf das spätere Kundenportal.
- Mehrere Projekte je Kunde mit Lebenszyklus, Workflow-Version, Owner und internen EUR-Planwerten.
- Projektleistungen als einzige Leistungsheimat: individuell je Projekt, aus pflegbaren globalen
  Templates als unveränderlicher Snapshot abgeleitet und vor dem Speichern anpassbar.
- Globaler Leistungstemplatekatalog mit Preisen, Preisarten, Intervallen und Archivstatus; archivierte
  Templates bleiben als Herkunftsnachweis erhalten und können nicht neu zugewiesen werden.
- Kundenwert und Projektwert (einmalig, monatlich, jährlich) ausschließlich aus Projektleistungen in
  Liste, Kundenakte, Projektkarte und bestehendem Cockpit; `rate` zählt nicht als Umsatz.
- Stundensatz als Projektleistung mit individueller Snapshot-Preisgestaltung; Angebote, Rechnungen
  und Zahlungen bleiben in Lexware.
- Flache Aufgaben mit einem Bearbeiter, Kontext, Handlungspflicht, Fälligkeit, Wiederholung und
  globaler Übersicht.
- Workspace-Glocke für Zuweisungen, Fälligkeiten, Portalereignisse, Renewals und Jobfehler.
- Explizite atomare Gesamtübergabe aller offenen Zuständigkeiten eines Mitglieds nach dem vollständigen CRM-Ausbau.
- Renewals für Domain, Hosting, SSL, Lizenz und sonstige Laufzeiten.
- Informative Kunden-Stundenkontingente mit vollständig kundensichtbaren Buchungen.
- Verschlüsselte Standard-Zugangsdaten mit explizitem Reveal und Security-Audit.

## Kundenportal

- Explizite Clerk-Einladung; ein Konto kann mehrere Kundenfirmen sicher wechseln.
- Dashboard mit freigegebenen Projektdaten, Aufgaben, Dokumenten und Stunden.
- Strukturierter Onboarding-Bogen: Texte direkt ins Feld, Assets am zugehörigen Feld, Zwischenstand
  serverseitig gesichert, Absenden erledigt die zugehörigen Kundenaufgaben.
- Upload von Bildern, Logos und kurzen Videos ohne Feedbackrunde; große Videos über einen Medienlink.
- Onboarding-Termin beim zuständigen Mitarbeiter über dessen Buchungslink, erst nach aktivem Klick geladen.
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
Ebenso kein Angebotsobjekt im CRM, keine Rabatt-Regel-Engine, keine eigene Terminverwaltung und im
ersten Ausbau kein Copy-Flow aus bestehenden Projektleistungen oder frei erstellte Leistung ohne Template.

Der frühere Detailplan für freies Mail-Senden bleibt als ausdrücklich zurückgestellte Option unter
`zurueckgestellt/31-mail-senden.md` erhalten.

## Abschluss nach dem CRM-Umbau

- Nach allen fachlichen CRM-, Portal-, Rollout- und Cleanup-Einheiten folgt als letzter Ordner 23 ein eigenständiger
  Web-PR. Er stellt die Website technisch auf alle in Ordner 03d zentralisierten Button- und Formularbausteine um und
  entwickelt deren Web-Darstellung weiter, ohne die Workspace-Optik oder CRM-Funktionalität zu verändern.

## Architektur-Nacharbeit nach dem CRM-Umbau

- Die serverseitigen Fachoperationen werden schrittweise nach Aggregaten gebündelt: beispielsweise `leadService`,
  `customerService`, `contactService` und weitere fachlich passende Kontext-Services. Die öffentlichen Methoden
  heißen nach ihrer Operation (`create`, `read`, `update`, `delete`) statt nach einzelnen Use-Case-Service-Dateien.
- Im Lead-zu-Kunde-Branch wurden bewusst nur `leadService.delete` und `customerService.create` auf dieses Muster
  umgestellt. Die übrigen bestehenden Lead- und CRM-Services bleiben unverändert, bis ihr jeweiliger fachlicher
  Bereich ohnehin bearbeitet wird.
- Als Nacharbeit sind insbesondere Kundenlesen, Kundenkontakte, Kategorien, Constraint-Auswertung, Lead-Anlage,
  Lead-Aktualisierung, Filterung, Mapping und Import auf sinnvolle Aggregate beziehungsweise klar abgegrenzte
  Kontext-Services zu prüfen. Validierung, Schemas und reine Mapper werden nur dann in einen Aggregate-Service
  aufgenommen, wenn dadurch Verantwortlichkeiten nicht vermischt werden.
- Die Umstellung erfolgt inkrementell mit aktualisierten Imports und Tests; kein Big-Bang-Refactoring und keine
  Verhaltensänderung allein durch die strukturelle Konsolidierung.
- **Kundenliste-Suche ohne Eingabefeld.** Server (`customerReadService.getListCondition`), Query-String
  (`buildCustomerListQueryString`) und Client-Service (`customersApiService.searchCustomers`) unterstützen bereits
  einen `search`-Parameter inklusive ILIKE-Escaping und sind vollständig getestet. Es fehlt lediglich das
  Sucheingabefeld in der Kundenliste-UI (`customers-basic-list.tsx`) — bewusst als unsichtbares Fundament belassen,
  bis eine UI dafür gebraucht wird.
- **`GET /api/workspace/crm/customers/[id]` wird beim Öffnen des Kundenformulars nicht aufgerufen.**
  `CustomerFormDialog` erhält `customer: CustomerDetailDto | null` weiterhin als Prop von der aufrufenden Stelle (z. B.
  der bereits geladenen Zeile aus der Kundenliste) und liest nicht selbst über
  `customersApiService.getCustomer` nach. Route und Client-Methode existieren bereits und sind vorgesehen für den
  Kunden-Cockpit-Dialog (Task 08c, `06b-mitarbeiter-cockpit`) — dort werden sie zum ersten Mal tatsächlich
  aufgerufen. Bis dahin bleiben sie ungenutzte, aber fertige Grundlage.
