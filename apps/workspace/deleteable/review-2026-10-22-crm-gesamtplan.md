# Review: CRM-Gesamtplan im laufenden Kundenbetrieb

Stand: 22.10.2026 · Branch `master` · Commit `51b2a855` · Arbeitsbaum vor dem Review sauber.

## Auftrag und Abdeckung

Strategisches Planreview für einen allein arbeitenden internen Nutzer mit bereits aktiven Portalkunden. Geprüft wurden Funktionsumfang, verbindliche Entscheidungen, offene Einheiten sowie die abgeschlossenen und zurückgestellten Planbereiche auf fehlende oder zu spät eingeordnete Arbeit. Kein vollständiges Code-, Sicherheits- oder Produktionsaudit.

Gelesen: `core-features.md`, die fachlichen und betrieblichen Entscheidungen in `00-entscheidungen.md`, die offenen Planübersichten und relevante Detailpläne, Übersichten der abgeschlossenen Kerndomänen (Auth, Kunden, Projekte, Aufgaben, Portal, Chat, Leistungen, Dateien, Onboarding, Feedback, Credentials, Stunden, Rückfragen), die zurückgestellten Themen und relevante Betriebs-/Abnahmepassagen. Die übrigen historischen Detaildateien, insbesondere reine UI-Nacharbeiten und Kataloginhalte, wurden inventarisiert bzw. gezielt durchsucht; nicht jede historische Task-Datei wurde vollständig gelesen.

Zusätzlich vollständig gelesen: `.github/workflows/ci.yml`, Root- und Workspace-`package.json`, Workspace-Vitest-Konfiguration sowie beide Playwright-Konfigurationen. E2E-Dateien und Serverpfade wurden zur Einordnung inventarisiert, ihre Implementierung nicht vollständig geprüft. Keine Secrets gelesen, keine Dienste oder produktiven Daten abgefragt.

Geltende Regeln: Root-`AGENTS.md`, `apps/workspace/AGENTS.md` und `apps/workspace/plans/crm/AGENTS.md` samt dortigem `CLAUDE.md`-Verweis; Review nach `invessiv-workspace-review`.

## Gesamturteil

Die fachlichen Kernabläufe sind breit abgedeckt. Der wichtigste zusätzliche Arbeitsblock ist die belastbare Betriebsabsicherung der schon genutzten Funktionen: Wiederherstellung, unabhängige Ausfallerkennung und wiederholbare Release-Abnahme. Dafür braucht es überwiegend eine Präzisierung und Aufteilung von 20c und 21, keine weitere große CRM-Domäne.

Die Trennung von Workspace/Portal, rollenbasierte Kundentrennung, versionierte Writes, gemeinsame Storage-Bausteine und die geplante transaktionale Outbox sind als Architektur schlüssig. Risiken entstehen an den Übergängen: globale Identitäten gegenüber kundenbezogenem Purge, unterschiedlich lange Backupfristen, Alarmierung über die überwachte Queue und fachliche Zusagen ohne ausführbaren Folgeplan. Die Implementierung dieser Architektur wurde hier nicht zertifiziert.

## Findings

### F01 · P1 · Betriebsfreigabe ist weiterhin ein später Sammelplan

- **Fundstelle:** `apps/workspace/plans/crm/00-entscheidungen.md:737` („Vor dem ersten echten Kunden“), `21-datenschutz-backup-rollout/README.md` (Abhängigkeit 01–20), `21-datenschutz-backup-rollout/34-export-purge-backup.md:111`.
- **Problem und Auswirkung:** Restricted-Zugang, offline gesicherter Credential-Schlüsselring und nachgewiesener Restore sind ausdrücklich Voraussetzungen für echte Kunden. Nach Nutzerangabe sind diese bereits aktiv, während 21 offen ist. Die Dokumente liefern keinen aktuellen, zusammenhängenden Nachweis der bereits erfüllten Betriebsbedingungen. Das beweist keinen fehlenden Produktionsschutz, lässt dessen Stand aber offen und koppelt notwendige Betriebssicherheit an spätere Features.
- **Empfehlung:** Sofortige Bestandsabnahme für die tatsächlich produktiven Domänen. Backup, Restore und Wiederanlauf als ersten eigenständigen Teil von 21 vorziehen; noch nicht vorhandene Features dürfen diesen Teil nicht blockieren. Konfigurationen nur über sichere Nachweise bestätigen, keine Secretwerte in die Dokumentation übernehmen.

### F02 · P1 · Alarmierung ist nicht unabhängig vom überwachten System spezifiziert

- **Fundstelle:** `20c-jobs-und-benachrichtigungen/33-outbox-und-benachrichtigungen.md:124` (insbesondere kritischer Alarm als Mailjob), `21-datenschutz-backup-rollout/README.md` („Dashboards/Alerts“), `31-portal-hinweise/README.md` (Hinweis nur im Portal-Dashboard).
- **Problem und Auswirkung:** Queue-Metriken und Runbooks sind vorgesehen. Ein unabhängiger Auslöser samt Zustellweg bei komplett ausgefallenem Runner, nicht erreichbarer DB oder gestörtem Mailprovider ist nicht konkret festgelegt. Ein Alarmjob in derselben nicht mehr abgearbeiteten Queue erreicht den alleinigen Betreiber nicht. Auch ein Portal-Hinweis ist bei einem vollständigen Portalausfall unerreichbar.
- **Empfehlung:** Einen außerhalb des Workspace-Runners ausgeführten Verfügbarkeits-/Heartbeat-Check und einen davon unabhängigen Alarmweg definieren. Abnahme: Runner abschalten bzw. DB-Zugriff kontrolliert unterbrechen und den Alarm tatsächlich empfangen. Ein kurzes Runbook ergänzt manuellen Wiederanlauf, Kontozugang bei Lockout und Kundenkontakt außerhalb des Portals. Vorhandene Plattformmöglichkeiten zuerst prüfen; kein zusätzlicher Dienst ist hiermit beschlossen.

### F03 · P1 · Backupfristen versprechen keinen einheitlich wiederherstellbaren Datenstand

- **Fundstelle:** `21-datenschutz-backup-rollout/34-export-purge-backup.md:24`, Backup-Pipeline und Restore-Drill derselben Datei.
- **Problem und Auswirkung:** Monatliche DB-Dumps bleiben zwölf Monate, Dateikopien nur 90 Tage. Wird eine Produktivdatei gelöscht und später auch ihre letzte Backupkopie entfernt, kann ein älterer, noch aufbewahrter DB-Dump auf diese fehlende Datei zeigen. Vollständiger DB-und-Datei-Restore über die gesamte DB-Aufbewahrung ist damit nicht zugesichert. Ein Manifest erkennt den Verlust, verhindert ihn aber nicht.
- **Empfehlung:** Explizit entscheiden, für welchen Zeitraum vollständige Wiederherstellung gilt. Entweder referenzierte Dateiobjekte bis zum Ablauf des letzten zugehörigen Backupstands erhalten oder ältere DB-Dumps ausdrücklich als eingeschränkte Archivstände behandeln. Einen Restore vor der Dateiretention-Grenze und einen älteren Stand als Abnahmefälle aufnehmen.

### F04 · P1 · Restore-Abnahme prüft Zugangsdaten nur als Metadaten

- **Fundstelle:** `21-datenschutz-backup-rollout/34-export-purge-backup.md:78`, `done/19-credentials/README.md:130`, `done/19-credentials/17-credentials-crypto.md:213`.
- **Problem und Auswirkung:** Offline-Schlüsselsicherung und Aufbewahrung alter Schlüssel für alte Backups sind bereits vorgesehen; sie fehlen also nicht grundsätzlich. Der Restore-Drill prüft jedoch ausdrücklich nur Credential-Metadaten. Er könnte erfolgreich sein, obwohl die separat gesicherte Schlüsselversion fehlt oder der Wiederanlauf keine Geheimwerte mehr entschlüsseln kann.
- **Empfehlung:** Eine bekannte, nicht sensible Prüf-Credential mit sichern und beim isolierten Restore mittels separat wiederbeschafftem Schlüssel tatsächlich entschlüsseln. Auch einen Backupstand vor einem Schlüsselwechsel prüfen. Schlüssel und Klartext niemals ins Protokoll schreiben. Klarstellen, welche eng begrenzten Restore-Schlüssel benötigt werden; „niemals Produktions-Keys verwenden“ darf nicht versehentlich auch das notwendige Offline-Entschlüsseln ausschließen. Produktionszugänge und externe Seiteneffekte bleiben gesperrt.

### F05 · P1 · Kunden-Purge ist nicht gegen gemeinsam genutzte Identitäten abgegrenzt

- **Fundstelle:** `21-datenschutz-backup-rollout/34-export-purge-backup.md:55`, `00-entscheidungen.md:245`, `done/12a-portal-fundament/README.md` (Portalnutzer kann zugleich internes Mitglied sein).
- **Problem und Auswirkung:** Task 34 beschreibt das Anonymisieren des globalen Users, seine Deaktivierung und das Löschen des zugehörigen Clerk-Kontos. Das Modell erlaubt aber mehrere Kundenfirmen und eine parallele Workspace-Mitgliedschaft für denselben Menschen. Eine bedingungslose Ausführung beim Purge eines Kunden könnte auch den Zugang zu einer anderen Firma oder zum Workspace zerstören. Eine ausdrückliche Prüfung verbleibender Beziehungen fehlt im Plan. Dies ist ein Fehler im geplanten Ablauf, kein nachgewiesener produktiver Purge-Bug.
- **Empfehlung:** Kundenbeziehungen zuerst gezielt entfernen. Globale Identität und Clerk-Konto nur über einen getrennt definierten, berechtigten Ablauf behandeln, der verbleibende Portal- und Workspace-Beziehungen berücksichtigt. Abnahmefälle: derselbe User bei A und B sowie Portalnutzer mit interner Mitgliedschaft; Purge A erhält B und den Workspace-Zugang.

### F06 · P2 · Vorhandene Portal- und DB-Tests sind kein automatischer CI-Nachweis

- **Fundstelle:** `.github/workflows/ci.yml:35`, `apps/workspace/package.json:11`, `apps/workspace/package.json:16`, `apps/workspace/vitest.config.ts:6`, `apps/workspace/playwright.portal.config.ts`.
- **Problem und Auswirkung:** Der eingecheckte Workflow ruft Lint, Typecheck, Standardtests und Builds auf. Sein einziger eigener E2E-Job betrifft das Web-Kontaktformular. Die vorhandene Portal-E2E-Suite und die gesonderten DB-Smokes werden dort nicht aufgerufen; die Vitest-Integration-Flags sind ohne speziellen Modus aus. Ein grüner Lauf dieses Workflows belegt daher weder Portal-Kernabläufe noch die expliziten DB-Integrationsprüfungen. Manuelle Läufe oder externe Deployment-Gates wurden nicht geprüft.
- **Empfehlung:** Reproduzierbare Release-Prüfung mit isolierter Test-DB, Clerk-Testinstanz und den vorhandenen Portaltests verankern. Mindestens Login/Widerruf, Cross-Customer-Schutz, Onboarding mit Autosave und Upload, Feedback einschließlich Rückfrage/Abnahme und Credential-Rechte abdecken. Bestehende Tests anbinden, statt dieselben Szenarien neu zu schreiben. Ausgefallene Voraussetzungen sichtbar melden; kein stilles Grün durch übersprungene Kernprüfungen.

### F07 · P2 · Monatliche Wartungsstunden sind angekündigt, aber nicht ausführbar geplant

- **Fundstelle:** `00-entscheidungen.md` (Stunden: monatliche Zubuchung aus Wartungsverträgen), `done/20-stunden-und-history/README.md:200`, `20c-jobs-und-benachrichtigungen/33-outbox-und-benachrichtigungen.md:82`.
- **Problem und Auswirkung:** Die Stundenplanung verweist die automatische monatliche Gutschrift an 20c. Dort fehlen die fachliche Regel je Kunde, deren Pflege, Beginn/Ende, Pausieren, Nachholung und Perioden-Deduplizierung. Ein generischer Runner allein liefert diese Funktion nicht. Relevant wird die Lücke, sobald bestehende Wartungspakete regelmäßig Stunden enthalten.
- **Empfehlung:** Bei tatsächlichem Vertragsbedarf eine eigene kleine vertikale Einheit planen: Regel am Kunden/Vertrag, Buchungsperiode und genau eine Gutschrift je Regel/Periode, nachvollziehbare Korrektur und getesteter Wiederanlauf nach Ausfall. Andernfalls die Automatik ausdrücklich vertagen und den manuellen Monatsprozess festhalten. Renewals verwalten Ablauftermine und ersetzen diese Funktion nicht.

### F08 · P2 · Ablage unter done und Mastertabelle sind als Statusquelle widersprüchlich

- **Fundstelle:** `00-entscheidungen.md:786` ff., `done/15-onboarding/README.md` (direkte Commits und offene Review-Nacharbeiten), `done/18-portal-prozess-nacharbeiten/README.md:3`, `done/28-feedback-rueckfragen/README.md:3`, `done/25-portal-feedback-redesign/J-portal-feedback-layout.md` (manuelle Sichtabnahme offen).
- **Problem und Auswirkung:** Mehrere unter `done` abgelegte Einheiten führen weiter „läuft“, „offen“, „im Review“ oder Abnahmereste; zentrale Tabelle und spätere Detailentscheidungen sind teilweise überholt. Der Ordnername beweist damit weder aktuellen Deploy noch abgeschlossene Abnahme. Umgekehrt beweist eine alte offene Checkbox nicht, dass das Feature tatsächlich fehlt.
- **Empfehlung:** Einmaliger Abgleich je produktiver Kerndomäne: gemergt, produktiv deployt, relevante Tests zuletzt ausgeführt, manuelle Abnahme und echte Restpunkte. Nur belegte Restarbeit in aktive Pläne übernehmen. Erst dann weitere Arbeit anhand der Statuslisten priorisieren.

## Fachliche Ergänzungen und zurückgestellte Themen

1. **Interne Projekt-/Launch-Checklisten vorziehen:** `zurueckgestellt/12-onboarding-checkliste.md` enthält bereits Aufgaben-Vorlagen. Der strukturierte Kundenbogen ersetzt die Materialabfrage, aber keine interne Prüfung von DNS/Domain, Formularen, Weiterleitungen, Tracking, Mobile, Freigabe und Übergabe. Eine kleine manuell angewendete Vorlage aus normalen Projektaufgaben ist für einen Solo-Betreiber vor Tags, Übergaben, Activity-Cleanup und Web-UI-Abschluss sinnvoll. Keinen zusätzlichen Workflow-Editor bauen. Den alten Detailplan vor Nutzung aktualisieren: Er enthält widersprüchliche Angaben zu Migration, Title-Key-Modell und Idempotenz.
2. **Wiedervorlage für ausstehende Kundenaktionen konkretisieren:** Aufgaben mit Fälligkeit, Handlungsseite und Dashboard existieren bereits; 20c sieht Feedbackfristen teilweise vor. Zunächst diszipliniert diese Mittel nutzen. Erst wenn nötig ergänzen: nächste interne Wiedervorlage für offenen Bogen, unbeantwortete Rückfrage oder ausstehende Abnahme. Kein automatischer Maildruck und keine zusätzliche allgemeine Aufgaben-Domäne ohne Bedarf. Kundenaufgaben nicht als interne Nachfass-Erinnerung zweckentfremden.
3. **Erneute Anmeldung vor Credential-Reveal neu priorisieren, falls produktiv genutzt:** `done/19-credentials/71-credentials-portal.md` enthält dies bereits als Kann-Ticket CRM-71-T7. Das akzeptierte Risiko ist dokumentiert. Bei real hinterlegten Hosting-/Domain-/Mail-Zugängen liegt diese gezielte Verbesserung vor rein visuellen Arbeiten und Mitarbeiterorganisation. Keine unbestätigte Aussage zu aktuellem Clerk-Tarif oder Implementierung; Konfiguration und technische Optionen vor Umsetzung prüfen.
4. **Zurückgestellt lassen:** freies Mailmodul, eigener Mail-Eingang, RBAC-Prerequisites bei alleiniger Owner-Nutzung, Neon-Branch-Smoke als zusätzliches Testkomfort-Feature. Die sichere isolierte Release-Testumgebung aus F06 ist davon zu unterscheiden. Landingpage-Bogen erst bei tatsächlichem Kundenbedarf; die Teilmengen-Variante ist laut Plan bereits über den vorhandenen Editor möglich.
5. **Nicht als fehlendes CRM-Feature behandeln:** Angebote, Rechnungen und Zahlungen sind ausdrücklich Lexware zugeordnet. Kundendatenimport, Mandantenfähigkeit, ein weiterer Rollenumbau und zusätzliche UI-Redesigns schließen derzeit keine dringlichere Betriebslücke.

## Empfohlene Anpassung der Prioritäten

1. Aktuellen Betriebs-/Abnahmestand bestätigen; Backup/Restore aus 21 vorziehen, inklusive vollständiger Wiederherstellbarkeit und Credential-Probe (F01, F03, F04).
2. Unabhängige Ausfallerkennung und Wiederanlauf festlegen (F02), vorhandene Kernablauftests als Release-Nachweis verankern (F06).
3. 20c mit dem kleinsten konsistenten Abhängigkeitsschnitt liefern. Bei unverändertem Plan muss 20b vorher kommen; ein früherer Kommunikations-/Outbox-Teil braucht eine ausdrückliche Neuaufteilung.
4. Export/Purge aus 21 mit dem korrigierten Identitätsmodell fertigstellen (F05). Bis zur tatsächlichen Purge-Umsetzung ist F05 eine Planungskorrektur, kein laufender Vorfall.
5. Kleine interne Projekt-/Launch-Vorlage; bei verkauften monatlichen Stunden zusätzlich F07. Falls echte Secrets im Portal liegen, CRM-71-T7 vor Komfortarbeit prüfen.
6. Danach Renewals entsprechend tatsächlicher Terminverantwortung, Text-Hinweise, Kundenverlauf und weitere tägliche Komfortfunktionen. Teamorganisation und kosmetische Abschlüsse bleiben spät.

## Prüfungen, Grenzen und offene Fragen

- Nur lesende Repository-Prüfung und Erstellung dieses Berichts; kein Code geändert, keine Tests oder produktiven Aktionen ausgeführt. Lint/Build nicht ausgeführt, da keine Codeänderung.
- Produktionsstand von Backups, Offline-Schlüsselring, Clerk Restricted/MFA, Benachrichtigungskanälen, Tarifgrenzen, Deployments und manuellen Freigaben ist offen. Vorhandene Konfigurationen könnten einzelne Empfehlungen bereits erfüllen.
- Aktuelle Anbieterpreise/-limits und rechtliche Aufbewahrungspflichten wurden nicht geprüft; die genannten Fristen sind Planwerte, keine externe oder rechtliche Bestätigung.
- Die vorhandenen E2E-/Integrationstests wurden nicht inhaltlich vollständig auditiert. F06 betrifft ihre fehlende Einbindung in den eingecheckten CI-Workflow.
- Priorität der Wartungsstunden-Automatik hängt davon ab, ob entsprechende Pakete tatsächlich verkauft sind. Priorität von zusätzlichem Reveal-Schutz hängt von tatsächlicher Credential-Nutzung ab.

## Vorschläge zur Skill-Verbesserung

Keine Änderung vorgeschlagen. Die vorhandenen Vorgaben zu Scope, belegten Findings und Abdeckungslücken reichen für dieses strategische Planreview aus. Der globale Skill bleibt unverändert.
