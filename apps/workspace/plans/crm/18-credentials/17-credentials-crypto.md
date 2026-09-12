# Task 17 — Credentials Crypto

> **Verbindliche Revision 2026:** Gehört zu Merge-Einheit 18.

## Verbindliche Revision

- Felder ausschließlich Titel, Login-URL, Benutzername, Passwort und verschlüsselte Notiz.
- AES-256-GCM mit zufälligem Nonce, Auth-Tag, Schlüsselversion und AAD aus Kunde, Credential-ID,
  Feldname und Formatversion.
- Master-Key aus Vercel-Environment plus offline Passwortmanager-Backup; fehlender/ungültiger Key
  schlägt geschlossen fehl.
- Keyring/Rotation ist resumierbar und idempotent; Adapter hält späteren Secret-Manager offen.
- Kein TOTP, keine frei benannten Geheimfelder, kein Portalendpunkt und kein Klartext in Listen,
  Exports, Logs oder Activities.
- Branch `feat/crm-credentials`.

> **Branch:** `feat/crm-credential-crypto`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** keine (kann parallel laufen)
> **Migration:** keine

## Context

Bevor irgendein Kundenpasswort in die Datenbank geschrieben wird, muss der Verschlüsselungsteil
stehen und geprüft sein. Deshalb ist er ein eigener Task **ohne Tabelle und ohne Oberfläche** — nur
ein Service und seine Tests. Ein Fehler an dieser Stelle fällt in der Oberfläche nicht auf, sondern
erst bei einem Leak.

Verfahren ist Envelope-Verschlüsselung mit AES-256-GCM: Jeder Datensatz bekommt einen eigenen
zufälligen Datenschlüssel, der Nutzdaten verschlüsselt. Dieser Datenschlüssel wird selbst mit einem
Hauptschlüssel aus der Umgebung verschlüsselt und zusammen mit den Daten gespeichert. Der Vorteil
gegenüber „alles mit einem Schlüssel": Der Hauptschlüssel lässt sich später wechseln, ohne jeden
Datensatz neu zu verschlüsseln, und ein kompromittierter Datensatz gibt keine anderen preis.

GCM liefert dabei Verschlüsselung und Integritätsprüfung in einem Schritt — eine manipulierte Zeile
lässt sich nicht unbemerkt entschlüsseln, sondern schlägt fehl.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verfahren              | AES-256-GCM, Envelope-Pattern                                                                                                                                                                           |
| Bibliothek             | Node `crypto` aus der Standardbibliothek. **Keine** neue Abhängigkeit                                                                                                                                   |
| Hauptschlüssel         | `CRM_CREDENTIALS_MASTER_KEY`, 32 Byte base64-kodiert, ausschließlich serverseitig                                                                                                                       |
| Schlüsselwechsel       | `keyVersion` wird je Datensatz gespeichert; mehrere Hauptschlüssel können parallel gültig sein (`…_MASTER_KEY_V2`)                                                                                      |
| Speicherform           | Ein `jsonb`-Feld mit `{ ciphertext, iv, authTag, wrappedDek, wrappedDekIv, wrappedDekAuthTag, keyVersion }`, alles base64                                                                               |
| Initialisierungsvektor | Je Verschlüsselung neu zufällig, 12 Byte (GCM-Standard) — nie wiederverwendet                                                                                                                           |
| Fehlerverhalten        | Fehler enthalten nie Klartext, nie den Schlüssel, nie Teile des Geheimnisses. Auch nicht in Stack-Traces                                                                                                |
| Protokollierung        | Der Service schreibt selbst **nichts** ins Log. Das Protokollieren von Aufdeckungen macht der aufrufende Handler (Task 18)                                                                              |
| Fehlender Schlüssel    | Verschlüsseln wirft einen klaren Konfigurationsfehler. Die Anwendung startet trotzdem — nur der Zugangsdatenbereich ist dann nicht nutzbar                                                              |
| **Schlüsselverlust**   | Der Plan kann Schlüssel rotieren, aber nicht verlieren: eine geleerte oder neu angelegte Vercel-Umgebung macht **alle** gespeicherten Zugangsdaten dauerhaft unlesbar — es gibt keine Wiederherstellung |
| Konsequenz             | Der Hauptschlüssel wird zusätzlich im eigenen Passwortmanager hinterlegt, bevor der erste Datensatz geschrieben wird. Das ist ein Betriebsschritt, kein Codeschritt                                     |

## Contract

```ts
// apps/workspace/src/common/contracts/crm/encrypted-payload.ts
export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  wrappedDek: string;
  wrappedDekIv: string;
  wrappedDekAuthTag: string;
  keyVersion: number;
}
```

```ts
// apps/workspace/src/server/crm/services/credential-crypto-service.ts
export const credentialCryptoService = {
  encrypt(plaintext: string): EncryptedPayload,
  decrypt(payload: EncryptedPayload): string,
  isConfigured(): boolean,
} as const;
```

## Verzeichnisstruktur

```txt
apps/workspace/src/common/contracts/crm/encrypted-payload.ts
apps/workspace/src/common/constants/crm/errors/credential-error-codes.ts
apps/workspace/src/server/crm/services/
  credential-crypto-service.ts
  credential-master-key-service.ts        liest und validiert Schlüssel aus der Umgebung
apps/workspace/src/server/tests/crm/services/
  credential-crypto-service.test.ts
  credential-master-key-service.test.ts
apps/workspace/src/server/config/env.ts   + CRM_CREDENTIALS_MASTER_KEY
apps/workspace/.env.example               + Variable mit Erzeugungshinweis
.env.example                              dito
```

## Tickets

### CRM-17-T1 — Hauptschlüssel-Verwaltung

- **Files:** `credential-master-key-service.ts` + Test, `env.ts`, beide `.env.example`
- **Skills:** `best-practices`
- **Inhalt:**
  - Schlüssel aus der Umgebung lesen, base64 dekodieren, auf exakt 32 Byte prüfen
  - Mehrere Versionen unterstützen: `CRM_CREDENTIALS_MASTER_KEY` ist Version 1,
    `CRM_CREDENTIALS_MASTER_KEY_V2` Version 2 und so weiter. Verschlüsselt wird immer mit der höchsten,
    entschlüsselt mit der im Datensatz vermerkten
  - `.env.example` enthält den Erzeugungsbefehl als Kommentar
    (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
  - Der Schlüssel wird zwischengespeichert, aber bei Änderung der Umgebungsvariable neu gelesen (Muster:
    `allowlist.ts`)
- **Akzeptanz:**
  - Tests: fehlender Schlüssel, falsche Länge, kein gültiges base64 ergeben je einen eigenen,
    klaren Fehler
  - Keine Fehlermeldung enthält den Schlüssel oder Teile davon
  - Zwei konfigurierte Versionen werden korrekt erkannt, die höchste ist die aktive

### CRM-17-T2 — Verschlüsselungsdienst

- **Files:** `credential-crypto-service.ts`, `constants/crm/errors/credential-error-codes.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - `encrypt`: Datenschlüssel erzeugen, Nutzdaten mit ihm verschlüsseln, Datenschlüssel mit dem
    Hauptschlüssel verschlüsseln, alles als `EncryptedPayload` zurückgeben
  - `decrypt`: Datenschlüssel mit der passenden Hauptschlüsselversion entpacken, dann Nutzdaten
  - Beide werfen typisierte Fehler ohne Klartextanteil
  - Nach dem Entschlüsseln werden keine Zwischenwerte in Variablen mit längerer Lebensdauer gehalten
- **Akzeptanz:**
  - Rundlauf-Test: verschlüsseln und entschlüsseln ergibt exakt den Ausgangswert, auch bei Umlauten,
    Emoji, sehr langen Werten und leerem String
  - Zweimaliges Verschlüsseln desselben Werts ergibt **unterschiedliche** Chiffrate (neuer
    Initialisierungsvektor je Vorgang)
  - Manipulationstest: ein um ein Byte verändertes `authTag`, `ciphertext` oder `wrappedDek` führt
    zu einem Fehler, nicht zu falschem Klartext
  - Ein mit Version 1 verschlüsselter Wert bleibt nach Hinzufügen von Version 2 entschlüsselbar
  - Test prüft ausdrücklich, dass keine Fehlermeldung den Klartext enthält

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Keine Tabelle, keine Route, keine Oberfläche.
2. **Bricht nichts:** ein neuer Service ohne Aufrufer, eine erweiterte Env-Konfiguration. Ohne
   gesetzten Schlüssel startet die Anwendung unverändert — `isConfigured()` gibt dann `false` zurück,
   und in Task 18 wird der Bereich damit sauber deaktiviert statt abzustürzen.
3. **Offen:** Tabelle und Oberfläche (Task 18). Weil hier noch nichts geschrieben wird, gibt es auch
   keine Daten, die bei einem späteren Fund eines Fehlers migriert werden müssten — genau deshalb
   steht dieser Task vor der Tabelle.

**Betriebsschritt vor Task 18 (verbindlich):** Den erzeugten Hauptschlüssel in der Vercel-Umgebung
setzen **und** im eigenen Passwortmanager hinterlegen. Ohne diese Kopie ist ein Verlust der
Umgebungsvariable gleichbedeutend mit dem Totalverlust aller Kundenzugänge. Im PR wird bestätigt,
dass das erfolgt ist.

## End-to-End-Akzeptanz

1. Ein Schlüssel lässt sich mit dem dokumentierten Befehl erzeugen und wird akzeptiert.
2. Rundlauf über alle Zeichenarten funktioniert verlustfrei.
3. Gleicher Eingabewert ergibt nie dasselbe Chiffrat.
4. Jede Manipulation am gespeicherten Payload führt zum Fehlschlag.
5. Ein Schlüsselwechsel lässt alte Datensätze lesbar.
6. Kein Fehler und kein Log enthält Klartext oder Schlüsselmaterial.
7. Die Anwendung startet ohne konfigurierten Schlüssel.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
