# Zugriffs-E2E

Die Tests verwenden echte, vorab angemeldete Clerk-Sessions als Playwright-`storageState`. Benötigt werden:

- `E2E_CUSTOMER_MEMBER_STORAGE_STATE`: JSON-Datei einer kundenbezogenen Read-Session
- `E2E_PROJECT_MEMBER_STORAGE_STATE`: JSON-Datei einer projektbezogenen Read-only-Session
- `E2E_ALLOWED_CUSTOMER_ID` und `E2E_DENIED_CUSTOMER_ID`
- `E2E_ALLOWED_PROJECT_ID` und `E2E_DENIED_PROJECT_ID`

Die IDs stammen aus einem isolierten E2E-Fixture. Ohne vollständige Konfiguration werden die betroffenen Tests
explizit übersprungen; der Runner findet die Suite trotzdem und kann nicht mehr aufgrund fehlender Testdateien grün
werden. Session-Dateien enthalten Secrets und dürfen nicht committed werden.

## Aufgaben-Flow im Kunden-Cockpit

- `E2E_TASK_WRITER_STORAGE_STATE`: JSON-Datei einer Clerk-Session mit `tasks.read` und `tasks.write`
- `E2E_TASK_CUSTOMER_ID`: Kunde des isolierten Aufgaben-Fixtures
- `E2E_TASK_PROJECT_TITLE`: eindeutig lesbarer Titel des beschreibbaren Fixture-Projekts

Der Test legt eine neue Aufgabe an und ändert ihren Status. Das Fixture darf deshalb nur für E2E-Tests verwendet
werden; die Session-Datei bleibt lokal.

## Onboarding-Bogen im Kunden-Cockpit

- `E2E_ONBOARDING_WRITER_STORAGE_STATE`: JSON-Datei einer Clerk-Session mit `projects.read` und `projects.write`
- `E2E_ONBOARDING_CUSTOMER_ID`: Kunde des isolierten Onboarding-Fixtures
- `E2E_ONBOARDING_PROJECT_TITLE`: eindeutig lesbarer Titel eines geplanten oder aktiven Fixture-Projekts

Der Test startet beim ersten Lauf das Onboarding des Projekts (leer) und öffnet danach den vorhandenen Bogen, weil ein
Projekt genau einen Bogen hat und es keinen Löschpfad gibt. Er legt einen eigenen Baustein an und entfernt ihn wieder.
Das Fixture darf deshalb nur für E2E-Tests verwendet werden; der Bogen muss im Status `draft` oder `open` bleiben.
Der Test gibt den Bogen nie selbst frei. Den Kernablauf „Starten → Freigeben → Ausfüllen → Absenden“ prüft
`portal-onboarding.e2e.ts` in der Portalsuite auf einem Projekt, das jeder Lauf neu anlegt.

## Portalzugang

Die Portalsuite läuft mit echten Clerk-Development-Sitzungen gegen die Development-Datenbank. Sie
prüft Einladungsdialog, Vorschau, Einlösung, zweiten Tokenversuch, Rollenänderung,
Firmenisolation, Firmenwechsel, Widerruf, parallele Einlösung und konkrete API-Fehler, dazu Dashboard,
Dateien, Feedbackrunden und den Kernablauf des Onboardings (Freigeben, Ausfüllen mit Gruppe und Upload, Absenden).

Start aus der Repository-Wurzel:

```powershell
corepack pnpm --filter @invessiv/workspace test:e2e:portal
```

Der Befehl verlangt in Root und Workspace dieselbe Development-Datenbank sowie lesbare Preview-
und Production-Konfigurationen. Er vergleicht die tatsächlichen Datenbank-Endpunkte ohne
Zugangsdaten, Pooler-Zusatz und URL-Parameter und bricht bei fehlender oder gleicher Zuordnung ab.
Zusätzlich muss der Development-Endpunkt zur fest hinterlegten Kennung in
`e2e/allowed-development-database.json` passen. Wird die Development-Datenbank durch einen neuen
Endpunkt ersetzt, muss diese Kennung bewusst aktualisiert werden.
Danach führt er die
Migrationen aus, baut die Workspace-App mit den Development-Werten und startet Playwright. Das
Playwright-Setup legt drei synthetische Clerk-Nutzer mit `+clerk_test`-Adressen bei Bedarf an,
erzeugt zwei Kunden und ihre Kontaktzuordnungen neu und speichert frische Sitzungen unter
`apps/workspace/.playwright/`. Es werden keine echten Postfächer benötigt. Der abgelaufene
Einladungstoken liegt an einem separaten Kontakt, damit spätere Tests ihn nicht widerrufen.

Das Fixture löscht beim nächsten Lauf nur seine eigenen Kunden und Kontakte anhand des
`Invessiv Portal E2E`-Präfixes. Die drei Clerk-Testnutzer bleiben zur Wiederverwendung bestehen.
Security-Events bleiben als Audit-Historie erhalten. `.playwright/` ist ignoriert und darf nie
committet werden. Die Suite läuft über `playwright.portal.config.ts` verbindlich; ein fehlgeschlagenes
Setup führt zu roten Tests statt Skips. Das normale `test:e2e` enthält weiterhin die bestehenden
Aufgaben- und Access-Scope-Suiten.
