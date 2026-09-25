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

## Portalzugang

Die Portalsuite läuft mit echten Clerk-Development-Sitzungen gegen die Development-Datenbank. Sie
prüft Einladungsdialog, Vorschau, Einlösung, zweiten Tokenversuch, Rollenänderung,
Firmenisolation, Firmenwechsel, Widerruf, parallele Einlösung und konkrete API-Fehler.

Start aus der Repository-Wurzel:

```powershell
corepack pnpm --filter @invessiv/workspace test:e2e:portal
```

Der Befehl prüft, dass Development-Datenbank und Clerk-Development-Schlüssel konfiguriert sind
und dass die Datenbank-URL sich von Preview und Production unterscheidet. Danach führt er die
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
