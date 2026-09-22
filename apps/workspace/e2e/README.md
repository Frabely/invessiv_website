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
