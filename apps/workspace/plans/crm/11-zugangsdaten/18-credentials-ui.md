# Task 18 — Credentials UI

> **Branch:** `feat/crm-credentials`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 17 (Verschlüsselung), Task 05 (Slot), Task 02 (Permissions)
> **Migration:** `0031_create_customer_credentials.sql` (Planwert)

## Context

Zugangsdaten sind der sensibelste Teil des CRM: Hosting, FTP, CMS-Logins, Domain-Registrar,
Analytics, Mailkonten. Sie gehören fremden Personen — entsprechend vorsichtig wird gebaut.

Die Verschlüsselung steht seit Task 17. Dieser Task ergänzt Tabelle, Handler und Oberfläche. Der
Grundsatz: **Klartext verlässt den Server nur auf ausdrückliche Anforderung**, für genau einen
Datensatz, und jede solche Anforderung wird protokolliert.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Anzeige in der Liste    | Immer maskiert. Der Listen-Endpunkt entschlüsselt gar nicht erst — er kennt den Klartext nicht                    |
| Aufdecken               | Eigener Endpunkt für genau einen Datensatz, hinter `Permission.CredentialsReveal`                                 |
| Protokoll               | Jede Aufdeckung schreibt eine `activities`-Zeile mit Bezeichnung des Zugangs und Zeitpunkt — **nie** mit dem Wert |
| Automatisches Verbergen | Aufgedeckter Wert verschwindet nach 30 Sekunden oder beim Verlassen des Tabs                                      |
| Zwischenablage          | Kopieren ohne Anzeigen ist möglich und gilt ebenfalls als Aufdeckung (wird protokolliert)                         |
| Typen                   | `hosting`, `ftp_sftp`, `cms`, `domain_registrar`, `database`, `analytics`, `mail`, `other`                        |
| Felder                  | Bezeichnung, Typ, URL, Benutzername, Geheimnis, Notiz. Nur Geheimnis und Notiz werden verschlüsselt               |
| Warum die Notiz auch    | Dort landen erfahrungsgemäß Wiederherstellungscodes und zweite Faktoren                                           |
| Nicht konfiguriert      | Ohne Hauptschlüssel zeigt der Bereich einen Hinweis und ist schreibgeschützt, statt abzustürzen                   |
| Portal                  | Zugangsdaten sind **niemals** im Kundenportal sichtbar. Es gibt keinen Portal-Endpunkt dafür                      |

## Tabelle

```txt
customer_credentials
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  label text NOT NULL
  credential_type text NOT NULL     CHECK in CREDENTIAL_TYPE_VALUES
  url text NULL
  username text NULL
  secret_payload jsonb NOT NULL     EncryptedPayload
  note_payload jsonb NULL           EncryptedPayload
  last_revealed_at timestamptz NULL
  created_at / updated_at
  INDEX (customer_id, credential_type)
```

Das Geheimnis ist in der Datenbank ausschließlich als verschlüsseltes Objekt vorhanden. Ein
Datenbank-Abzug allein, ohne den Hauptschlüssel aus der Umgebung, enthält nichts Verwertbares.

## Architektur

```txt
GET    /api/workspace/crm/customers/[id]/credentials   Permission CredentialsRead
         → entschlüsselt NICHTS, liefert nur Metadaten
POST   /api/workspace/crm/customers/[id]/credentials   Permission CredentialsWrite
PATCH  /api/workspace/crm/credentials/[credentialId]   Permission CredentialsWrite
DELETE /api/workspace/crm/credentials/[credentialId]   Permission CredentialsWrite
POST   /api/workspace/crm/credentials/[credentialId]/reveal
         → Permission CredentialsReveal
         → entschlüsselt genau diesen einen Datensatz
         → schreibt activities (credential_revealed)
         → Antwort mit Cache-Control: no-store
```

## Verzeichnisstruktur

```txt
packages/db/migrations/0031_create_customer_credentials.sql
packages/db/src/record-configuration/crm/customer-credentials.ts
packages/common/src/constants/crm/credential-types.ts
packages/common/src/contracts/crm/credential.dto.ts        ohne Geheimnisfeld

apps/workspace/src/app/api/workspace/crm/customers/[id]/credentials/route.ts
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/route.ts
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/reveal/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-credentials.query-handler.ts
  command-handler/{create,update,delete,reveal}-credential.command-handler.ts
  services/credential.schema.ts

apps/workspace/src/components/workspace/crm/credentials/
  customer-credentials-section/
  credential-card/
  credential-secret-field/         Maskierung, Aufdecken, Kopieren, Countdown
  credential-form-dialog/
apps/workspace/src/hooks/workspace/crm/use-reveal-timeout.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/credentials/{de,en}.json
```

## Tickets

### CRM-18-T1 — Migration, Modell, Typen

- **Files:** `0031_create_customer_credentials.sql`, `record-configuration/crm/customer-credentials.ts`,
  `constants/crm/credential-types.ts` + Test, `contracts/crm/credential.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Tabelle wie oben
  - Das DTO enthält **kein** Feld für das Geheimnis — der Typ allein macht es unmöglich, es
    versehentlich in eine Listenantwort zu schreiben
- **Akzeptanz:**
  - Migration idempotent
  - Typtest belegt: `CredentialDto` hat kein `secret`-Feld

### CRM-18-T2 — Handler ohne Klartext

- **Files:** `query-handler/list-credentials.query-handler.ts`,
  `command-handler/{create,update,delete}-credential.command-handler.ts`,
  `services/credential.schema.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Schreiben verschlüsselt über `credentialCryptoService` vor dem Datenbankzugriff
  - Der Listen-Handler ruft `decrypt` nie auf
  - Beim Bearbeiten bleibt ein leer gelassenes Geheimnisfeld unverändert (kein versehentliches
    Leeren durch Speichern des Formulars)
- **Akzeptanz:**
  - Test: die Antwort des Listen-Handlers enthält unter keinen Umständen Klartext (Prüfung über den
    serialisierten JSON-String)
  - Test: Bearbeiten ohne neues Geheimnis lässt das alte intakt
  - Test: ohne konfigurierten Hauptschlüssel liefert Schreiben einen klaren Konfigurationsfehler

### CRM-18-T3 — Aufdecken mit Protokoll

- **Files:** `command-handler/reveal-credential.command-handler.ts`, Reveal-Route + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `withPermission(Permission.CredentialsReveal)`
  - Entschlüsselt genau einen Datensatz, schreibt Activity und `last_revealed_at`
  - Antwort mit `Cache-Control: no-store`
  - Rate-Limit: maximal 20 Aufdeckungen pro Minute je Nutzer (Muster: das datenbankgestützte
    Limit aus `reserve-linkedin-post-generator-usage-limit.ts`)
- **Akzeptanz:**
  - Test: Rolle `member` bekommt 403, auch wenn sie die Liste sehen darf
  - Test: je Aufdeckung genau eine Activity, und diese enthält **nicht** den Wert
  - Test: Überschreiten des Limits ergibt 429 mit `Retry-After`

### CRM-18-T4 — Sektion und Geheimnisfeld

- **Files:** `components/workspace/crm/credentials/**`, `hooks/.../use-reveal-timeout.ts`,
  `dictionaries/workspace/crm/credentials/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Karten je Zugang, gruppiert nach Typ, mit Symbol, Bezeichnung, Benutzername und maskiertem Wert
  - Geheimnisfeld: Anzeigen, Kopieren, sichtbarer Countdown bis zum automatischen Verbergen
  - Verbergen beim Tab-Wechsel (`visibilitychange`)
  - Benutzername ist ohne Aufdecken kopierbar (er ist kein Geheimnis)
  - Ohne `CredentialsReveal` sind Anzeigen und Kopieren gar nicht vorhanden — nicht nur deaktiviert
  - Ohne Hauptschlüssel: Hinweisblock, Bereich schreibgeschützt
- **Akzeptanz:**
  - Tastaturbedienung vollständig; der aufgedeckte Wert wird über eine Live-Region angekündigt, ohne
    ihn vorzulesen („Zugangsdaten sichtbar, verbirgt sich in 30 Sekunden")
  - Kopieren zeigt eine Rückmeldung und funktioniert auch ohne vorheriges Anzeigen
  - Der Wert ist nicht im Seitenquelltext, bevor er angefordert wurde
  - Dark und Light korrekt

### CRM-18-T5 — Formular

- **Files:** `credential-form-dialog/**`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Anlegen und Bearbeiten in einem Dialog; beim Bearbeiten ist das Geheimnisfeld leer mit dem
    Hinweis „leer lassen, um unverändert zu übernehmen"
  - Passwortfeld mit Anzeigen-Umschalter und `autocomplete="off"`
  - Mehrzeilige Notiz für Wiederherstellungscodes
- **Akzeptanz:**
  - Der Browser bietet kein Speichern der Zugangsdaten an (korrekte `autocomplete`-Attribute)
  - Pflichtfelder und Fehlerzustände klar erkennbar
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Zugangsdaten" im Kundendetail.
2. **Bricht nichts:** eine neue Tabelle, neue Endpunkte. Kein bestehender Pfad verändert. Ohne
   gesetzten Hauptschlüssel ist der Bereich sichtbar, aber schreibgeschützt mit Hinweis — die
   Anwendung läuft unverändert weiter.
3. **Offen:** nichts. Das Portal erhält bewusst nie Zugriff auf diesen Bereich; es gibt dafür keinen
   Endpunkt, den man später versehentlich freischalten könnte.

## End-to-End-Akzeptanz

1. Ein Zugang lässt sich anlegen; in der Datenbank steht kein Klartext (per Abfrage nachgewiesen).
2. Die Liste zeigt maskierte Werte, ohne dass der Server entschlüsselt.
3. Anzeigen fordert den Wert einzeln an, zeigt ihn und verbirgt ihn nach 30 Sekunden.
4. Tab-Wechsel verbirgt sofort.
5. Kopieren funktioniert ohne Anzeigen und wird ebenfalls protokolliert.
6. Jede Aufdeckung erscheint in der Timeline — ohne den Wert.
7. Eine Rolle ohne `CredentialsReveal` sieht die Aktionen gar nicht und wird serverseitig abgewiesen.
8. Bearbeiten ohne neues Geheimnis lässt das bestehende unverändert.
9. Ohne Hauptschlüssel bleibt die Anwendung lauffähig.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
