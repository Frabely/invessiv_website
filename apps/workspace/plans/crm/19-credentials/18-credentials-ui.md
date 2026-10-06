# Task 18 — Credentials intern

> **Merge-Einheit:** Ordner 19, PR 19.1 · **Branch:** `feat/crm-credentials-1-intern`
> **Aufwand:** L · **Abhängigkeiten:** Task 17 (Verschlüsselung), Ordner 07b (Zugriffsfilter)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins; Stand 06.10.2026 wäre das `0054`)

- Zugänge je Kunde, optional einem Projekt zugeordnet, im Cockpit anlegen, ändern, löschen.
- Listen liefern nur Metadaten und entschlüsseln nie.
- Aufdecken und Kopieren holen genau ein Feld eines Datensatzes und werden auditiert.
- Kein Portalpfad in diesem Task; er folgt mit Task 71.

## Context

Zugangsdaten sind der sensibelste Teil des CRM und gehören fremden Personen. Die Verschlüsselung steht seit Task 17.
Dieser Task ergänzt Tabelle, interne Handler und Oberfläche. Grundsatz: **Klartext verlässt den Server nur auf
ausdrückliche Anforderung**, für genau ein Feld eines Datensatzes, und jede Anforderung wird protokolliert.

Datenmodell und Rechte-Matrix stehen in der [README](./README.md) und werden hier nicht wiederholt.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liste                  | Immer maskiert. Der Listen-Handler ruft `decrypt` nie auf und selektiert die Chiffrat-Spalten gar nicht; das DTO trägt nur `hasNote`                                                  |
| Aufdecken              | Eigener Endpunkt, Body `{ field: "secret" \| "note", intent: "show" \| "copy" }`, Antwort `{ value }` mit `Cache-Control: no-store`                                                   |
| Kopieren               | Ohne vorheriges Anzeigen möglich; zählt als Aufdeckung                                                                                                                                |
| Automatisch verbergen  | Nach 30 Sekunden und beim Verlassen des Tabs (`visibilitychange`) verschwindet der Wert aus dem React-State                                                                           |
| Bearbeiten             | Leeres Geheimnisfeld heißt „unverändert“. Die Notiz ist dreiwertig: unverändert, ersetzen, entfernen. Wer die Notiz sehen will, deckt sie vorher auf                                  |
| Versionierung          | Schreiben über `updateVersioned`; 409 mit `VersionConflictDto` (Metadaten-DTO, nie Werte). Aufdecken setzt `last_revealed_at`, erhöht `version` aber nicht                            |
| Audit                  | `security_events`, Subject-Typ `credential`. Metadata: `customer_id`, `project_id`, bei Reveal `field` und `intent`, bei Update die Namen der geänderten Felder. Nie Titel, nie Werte |
| Abgewiesenes Aufdecken | Wer den Eintrag lesen, aber nicht aufdecken darf, bekommt 403 und ein Event `credential_reveal_denied`. Wer ihn nicht lesen darf, bekommt 404 ohne Event                              |
| Rate-Limit             | 20 Aufdeckungen je Minute und Mitglied, gezählt über `security_events` in der Reveal-Transaktion. Konstante in `packages/common`. Antwort 429 mit `Retry-After`                       |
| Nicht konfiguriert     | Ohne Schlüsselring zeigt die Sektion einen Hinweis; Anlegen, Ändern und Aufdecken antworten mit einem Konfigurationsfehler (503). Löschen und die Metadatenliste funktionieren weiter |
| Ort in der UI          | Sektion „Zugangsdaten“ im Kunden-Cockpit mit Projektfilter, analog zur Dateien-Sektion. Keine eigene globale Seite                                                                    |
| Projektansicht         | Der Filter „Projekt X“ zeigt die Einträge dieses Projekts **und** die kundenweiten, getrennt gruppiert                                                                                |
| URL                    | Freitext bis 2048 Zeichen. Als Link gerendert nur bei `https://` oder `http://`, immer mit `rel="noopener noreferrer"`                                                                |
| Activities             | Keine. Der vorhandene Activity-Typ `credential_revealed` bleibt ungenutzt; ein CHECK wird nie verengt                                                                                 |

## Architektur

```txt
GET    /api/workspace/crm/customers/[id]/credentials?projectId=   credentials.read   scope project
POST   /api/workspace/crm/customers/[id]/credentials              credentials.write  scope project
PATCH  /api/workspace/crm/credentials/[credentialId]              credentials.write  scope project
DELETE /api/workspace/crm/credentials/[credentialId]              credentials.write  scope project
POST   /api/workspace/crm/credentials/[credentialId]/reveal       credentials.reveal scope project
```

Jede Route steht in `CRM_ENDPOINT_ACCESS_RULES` (`CredentialsList`, `CredentialCreate`, `CredentialUpdate`,
`CredentialDelete`, `CredentialReveal`). Der Zugriffsfilter folgt `fileAccessService`: kundenweite Einträge verlangen
das Recht am Kunden, Projekteinträge am Kunden oder am Projekt. Lesen filtert in der `WHERE`-Klausel über
`crmAccessCondition`, Schreiben prüft `canOn` unter der Zeilensperre.

Der Reveal-Handler in einer Transaktion: Zeile mit Lese-Zugriffsbedingung sperren (sonst 404) → `canOn` für
`credentials.reveal` (sonst Event `credential_reveal_denied`, 403) → Rate-Limit zählen (sonst 429) → entschlüsseln →
`last_revealed_at` setzen → Event `credential_revealed`. Schlägt das Schreiben des Events fehl, verlässt kein Klartext
den Server.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_customer_credentials.sql
packages/db/src/record-configuration/crm/customer-credentials.ts        + Barrel
packages/db/src/constraint-names/crm/customer-credentials-constraint-names.ts
packages/db/scripts/crm-smoke/credential-checks.ts                      + Aufruf in smoke-crm-constraints.ts
packages/db/scripts/seed-crm-fixture.ts                                 + Beispielzugänge (Fixture-Schlüssel)

packages/common/src/constants/crm/credentials/
  credential-types.ts                    CredentialType + _VALUES
  credential-reveal-intents.ts           show | copy
  credential-limits.ts                   Längen, Reveal-Fenster und -Anzahl, Auto-Hide-Sekunden
  errors/credential-error-codes.ts
packages/common/src/constants/auth/security-event-types.ts              + sechs Credential-Typen
packages/common/src/constants/auth/security-subject-types.ts            + Credential
packages/common/src/contracts/crm/credentials/
  credential.dto.ts                      Metadaten, kein Geheimfeld
  credential-create-request.dto.ts
  credential-update-request.dto.ts
  credential-reveal-request.dto.ts
  credential-reveal-response.dto.ts

apps/workspace/src/common/constants/api-endpoints.ts                    + Credential-Endpunkte
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts   + fünf Regeln
apps/workspace/src/app/api/workspace/crm/customers/[id]/credentials/route.ts
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/route.ts
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/reveal/route.ts
apps/workspace/src/lib/workspace/crm/credential-api-error.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-credentials.query-handler.ts
  command-handler/{create,update,delete,reveal}-credential.command-handler.ts
  services/credentials/
    credential-access-service.ts         readableCondition, lockWritable, canReveal
    credential-mapping-service.ts
    credential-schemas.ts
apps/workspace/src/server/shared/services/credential/
  credential-reveal-limit-service.ts     Zählung je Actor; Task 71 nutzt ihn mit dem Portal-Limit
apps/workspace/src/server/tests/workspace/crm/…                         spiegelt die Struktur

apps/workspace/src/client/crm/credential-api-service.ts
apps/workspace/src/components/workspace/crm/credentials/
  customer-credentials-section/
  credential-row/
  credential-secret-field/               Maskierung, Anzeigen, Kopieren, Countdown
  credential-form-dialog/
  credential-delete-dialog/
apps/workspace/src/hooks/workspace/crm/use-revealed-secret.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/credentials/{de,en}.json
apps/workspace/src/server/workspace/crm/AGENTS.md                       + Abschnitt Zugangsdaten
apps/workspace/src/server/shared/AGENTS.md                              + Abschnitt Zugangsdaten
```

`credential-reveal-limit-service` liegt in diesem PR bereits unter `server/shared/`, obwohl der zweite Aufrufer erst
mit 19.2 kommt. Das ist eine bewusste Planvorgabe, wie beim Bogen-Read-Service in Task 65.

## Tickets

### CRM-18-T1 — Migration, Modell, Konstanten, Contracts

- **Files:** Migration, `customer-credentials.ts`, Constraint-Namen, Konstanten und DTOs wie oben, Smoke, Seed
- **Inhalt:**
  - Tabelle laut README, additiv und idempotent, SQL-Formatierung laut `packages/db/AGENTS.md`
  - `security_events_type_check` und `security_events_subject_type_check` um die neuen Werte erweitert (Muster
    Migration `0050` bzw. `0039`: DROP IF EXISTS, dann ADD mit der vollständigen Liste)
  - `CredentialDto` enthält kein Feld für Geheimnis oder Notiztext; jedes Feld hat einen Docstring
  - Seed legt je Beispielkunde zwei kundenweite und einen Projektzugang an, verschlüsselt mit einem festen
    Fixture-Schlüssel, der nur im Seed existiert und in `.env.example` als Entwicklungswert dokumentiert ist
- **Akzeptanz:**
  - Zweiter Migrationslauf ist folgenlos; Modell und Migration deckungsgleich (Review-Punkt)
  - Smoke: fehlender Fachwert wird abgewiesen (`runMissingDefaultChecks`), Projekt eines anderen Kunden wird
    abgewiesen, Kundeneintrag mit `visible_to_customer = false` wird abgewiesen, zwei Herkünfte werden abgewiesen
  - `db:smoke:rbac` bleibt grün (Katalog unverändert in diesem Task)

### CRM-18-T2 — Liste, Anlegen, Ändern, Löschen

- **Files:** Query-Handler, drei Command-Handler, `services/credentials/**`, Routen, API-Error-Helper, Tests
- **Inhalt:**
  - Anlegen erzeugt die ID vor dem Verschlüsseln (die ID ist Teil der AAD) und schreibt `version = 1`,
    `visible_to_customer = false`, `created_by_side = internal`
  - Ändern: Projektwechsel verlangt `credentials.write` am alten **und** am neuen Ziel; ein neues Geheimnis setzt
    `secret_changed_at`
  - Jeder erfolgreiche Schreibvorgang erzeugt genau ein Security-Event in derselben Transaktion
  - Löschen sperrt die Zeile, schreibt das Event und entfernt sie
- **Akzeptanz:**
  - Die serialisierte Listenantwort enthält weder Klartext noch Chiffrat (Test über den JSON-String)
  - Ändern ohne neues Geheimnis lässt Chiffrat und `secret_changed_at` unverändert
  - Veraltete Version → 409 mit aktuellem Metadaten-DTO
  - Negativtests: fremder Kunde, fremdes Projekt, projektgebundene Rolle gegen kundenweiten Eintrag → 404
  - Ohne Schlüsselring: Anlegen und Ändern 503 mit eigenem Fehlercode, Liste und Löschen funktionieren

### CRM-18-T3 — Aufdecken mit Audit und Limit

- **Files:** `reveal-credential.command-handler.ts`, Reveal-Route, `credential-reveal-limit-service.ts`, Tests
- **Inhalt:** Ablauf wie unter „Architektur“
- **Akzeptanz:**
  - Mitglied mit `credentials.read`, ohne `credentials.reveal`: 403 und genau ein `credential_reveal_denied`
  - Je Aufdeckung genau ein Event; die serialisierten Event-Metadaten enthalten den Wert nicht
  - Aufdecken einer nicht vorhandenen Notiz antwortet 404 ohne Event
  - 21. Aufdeckung in einer Minute → 429 mit `Retry-After`, kein Klartext
  - Antwort trägt `Cache-Control: no-store`
  - Rollenentzug wirkt beim nächsten Request

### CRM-18-T4 — Sektion und Geheimnisfeld

- **Files:** `components/workspace/crm/credentials/**`, `use-revealed-secret.ts`, Client-Service, Dictionaries,
  Einhängen in `customer-cockpit-view`
- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:**
  - Liste gruppiert nach „Kundenweit“ und je Projekt, innerhalb nach Typ; Zeile mit Symbol, Titel, Benutzername,
    maskiertem Wert, „Passwort geändert am“, „zuletzt aufgedeckt am“
  - Projektfilter über URL-State (wie die Dateien-Sektion)
  - Geheimnisfeld: Anzeigen, Kopieren, sichtbarer Countdown, Verbergen beim Tab-Wechsel
  - Benutzername und URL sind ohne Aufdecken kopierbar
  - Ohne `credentials.reveal` fehlen Anzeigen und Kopieren vollständig; ohne `credentials.write` fehlen Anlegen,
    Bearbeiten und Löschen; ohne `credentials.read` fehlt die Sektion
  - Empty-State erklärt, wofür der Bereich gedacht ist; „keine Treffer im Projektfilter“ ist ein eigener Zustand
  - Ohne Schlüsselring: Hinweisblock, Schreibaktionen deaktiviert
- **Akzeptanz:**
  - Vollständig per Tastatur bedienbar, sichtbare Fokus-Styles
  - Live-Region meldet „Zugangsdaten sichtbar, werden in 30 Sekunden verborgen“, ohne den Wert vorzulesen
  - Der Wert steht nicht im Seitenquelltext oder in einer Server-Komponenten-Payload, bevor er angefordert wurde
  - Dark und Light korrekt; co-located `*.module.css`, keine Überschreibung von `@invessiv/ui`-Komponenten

### CRM-18-T5 — Formular und Löschdialog

- **Files:** `credential-form-dialog/**`, `credential-delete-dialog/**`
- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:**
  - Anlegen und Bearbeiten in einem Dialog: Titel, Typ, Projekt (leer = kundenweit), URL, Benutzername, Geheimnis,
    Notiz
  - Beim Bearbeiten ist das Geheimnisfeld leer mit dem Hinweis „leer lassen, um es unverändert zu übernehmen“
  - Notiz beim Bearbeiten: „Notiz aufdecken und bearbeiten“ (nur mit `credentials.reveal`), „Notiz ersetzen“,
    „Notiz entfernen“
  - Geheimnisfeld mit Anzeigen-Umschalter, `autocomplete="new-password"`; Benutzername `autocomplete="off"`
  - Löschdialog nennt den Titel und dass der Vorgang endgültig ist
- **Akzeptanz:**
  - Der Browser bietet kein Speichern der Zugangsdaten an
  - Pflichtfelder, Längenfehler, Versionskonflikt und Submit-Fehler haben eigene, erkennbare Zustände
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Zugangsdaten“ im Kunden-Cockpit, für Mitglieder mit `credentials.read`.
2. **Bricht nichts:** eine neue Tabelle, zwei erweiterte CHECKs, neue Endpunkte. Kein bestehender Pfad verändert.
   Ohne Schlüsselring ist die Sektion sichtbar und schreibgeschützt.
3. **Offen bis 19.2:** Freigabe und Portal. `visible_to_customer` ist bis dahin überall `false`; es gibt keinen
   Portalendpunkt, den man versehentlich erreichen könnte.

## End-to-End-Akzeptanz

1. Ein Zugang lässt sich kundenweit und am Projekt anlegen; in der Datenbank steht kein Klartext (per Abfrage belegt).
2. Die Liste zeigt maskierte Werte, ohne dass der Server entschlüsselt.
3. Anzeigen fordert genau ein Feld an, zeigt es und verbirgt es nach 30 Sekunden; Tab-Wechsel verbirgt sofort.
4. Kopieren funktioniert ohne Anzeigen und wird ebenso protokolliert.
5. Jede Aufdeckung steht in `security_events`, ohne Wert.
6. Ohne `credentials.reveal` fehlen Anzeigen und Kopieren, der Server weist ab und protokolliert den Versuch.
7. Bearbeiten ohne neues Geheimnis lässt das bestehende unverändert.
8. Projektwechsel und „zurück auf kundenweit“ funktionieren; das Chiffrat bleibt lesbar.
9. Fremder Kunde und fremdes Projekt antworten 404.
10. Ohne Schlüsselring bleibt die Anwendung lauffähig.
11. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `db:smoke:crm`, `db:smoke:rbac`,
    `pnpm --filter @invessiv/workspace build` grün.
