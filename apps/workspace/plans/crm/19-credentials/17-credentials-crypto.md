# Task 17 — Credentials Crypto

> **Merge-Einheit:** Ordner 19, PR 19.1 · **Branch:** `feat/crm-credentials-1-intern`
> **Aufwand:** M · **Abhängigkeiten:** keine · **Migration:** keine
> **Zuerst lesen:** [README](./README.md), `packages/db/AGENTS.md`, `apps/workspace/src/server/shared/AGENTS.md`

- Ein Baustein verschlüsselt und entschlüsselt einzelne Feldwerte mit AES-256-GCM.
- Der Schlüsselring kommt aus einer server-only Umgebungsvariable und kennt mehrere Versionen.
- Jedes Chiffrat ist an Kunde, Datensatz und Feld gebunden.
- Kein Klartext und kein Schlüsselmaterial in Fehlern oder Logs.

## Context

Bevor ein Kundenpasswort in die Datenbank geschrieben wird, muss die Verschlüsselung stehen und geprüft sein. Dieser
Task hat deshalb weder Tabelle noch Oberfläche, nur Bausteine und Tests. Ein Fehler an dieser Stelle fällt nicht in
der Oberfläche auf, sondern erst bei einem Leck.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verfahren           | AES-256-GCM je Feldwert, direkt mit dem aktiven Hauptschlüssel. Nonce 12 Byte, je Vorgang neu über `randomBytes`. Auth-Tag 16 Byte                                                                    |
| Kein Datenschlüssel | Der frühere Entwurf mit einem Datenschlüssel je Datensatz (Envelope) entfällt. Bei wenigen hundert Zeilen bringt er keinen Vorteil; ein Schlüsselwechsel muss ohnehin jede Zeile anfassen             |
| Bibliothek          | `node:crypto` (`createCipheriv`, `createDecipheriv`, `randomBytes`). Keine neue Abhängigkeit                                                                                                          |
| AAD                 | UTF-8 von `v1\n<customerId>\n<credentialId>\n<field>`. IDs sind UUIDs in Kleinbuchstaben, `field` ist `secret` oder `note`. Damit lässt sich ein Chiffrat nicht verschieben                           |
| Nicht in der AAD    | Die Projekt-ID, weil die Projektzuordnung änderbar ist                                                                                                                                                |
| Speicherform        | Ein Text mit vier durch Punkt getrennten Teilen: `v1.<keyVersion>.<nonce>.<ciphertext+tag>`. `keyVersion` dezimal, die letzten beiden Teile base64url ohne Padding. Der Tag hängt hinten am Chiffrat  |
| Schlüsselring       | `CRM_CREDENTIALS_KEYRING="1:<base64>,2:<base64>"`. Jeder Schlüssel nach dem Dekodieren exakt 32 Byte. Verschlüsselt wird mit der höchsten Version, entschlüsselt mit der im Chiffrat vermerkten       |
| Fehlender Schlüssel | Die Anwendung startet. `isConfigured()` ist `false`; Verschlüsseln und Entschlüsseln werfen `CredentialCipherError` mit Code `keyring_missing`. Task 18 macht daraus einen schreibgeschützten Bereich |
| Fehlerverhalten     | Eine Fehlerklasse mit `code`, ohne Klartext, Chiffrat oder Schlüsselanteil in der Meldung. Der ursprüngliche `crypto`-Fehler wird **nicht** als `cause` weitergereicht                                |
| Protokollierung     | Die Bausteine loggen nichts. Audit schreibt der aufrufende Handler                                                                                                                                    |

## Warum zwei Ablageorte

Zwei Skripte brauchen die Verschlüsselung außerhalb der App: der Seed (`packages/db/scripts/seed-crm-fixture.ts`) und
das Rekey-Skript. `packages/**` darf keinen App-Code importieren, und App-Services importieren `server-only`, was
außerhalb von Next.js bricht. Deshalb:

- **Reine Funktionen in `packages/db/src/credentials/`** — das Speicherformat einer Spalte ist DB-nah. Sie nehmen
  Schlüsselring-Text und Kontext als Argument, lesen kein `process.env`, importieren kein `server-only`. Importpfad
  aus der App: `@invessiv/db/credentials/credential-cipher` (das Paket exportiert `./*` → `./src/*`, es ist kein
  Eintrag in `package.json` nötig).
- **Ein dünner Service in der App** unter `apps/workspace/src/server/shared/services/credential/`, der die
  Umgebungsvariable liest und zwischenspeichert. Er liegt unter `server/shared/`, weil ihn Workspace-Handler
  (Task 18) und Portal-Handler (Task 71) aufrufen.

## Contract

```ts
// packages/common/src/constants/credentials/credential-secret-fields.ts
export const CredentialSecretField = {
  Secret: "secret",
  Note: "note",
} as const;
export type CredentialSecretField =
  (typeof CredentialSecretField)[keyof typeof CredentialSecretField];
export const CREDENTIAL_SECRET_FIELD_VALUES = [
  CredentialSecretField.Secret,
  CredentialSecretField.Note,
] as const;
```

```ts
// packages/common/src/constants/credentials/credential-cipher-error-codes.ts
export const CredentialCipherErrorCode = {
  KeyringMissing: "keyring_missing",
  KeyringInvalid: "keyring_invalid",
  UnknownKeyVersion: "unknown_key_version",
  MalformedCiphertext: "malformed_ciphertext",
  DecryptionFailed: "decryption_failed",
} as const;
// + abgeleiteter Type und _VALUES-Array nach demselben Muster
```

```ts
// packages/db/src/credentials/credential-cipher-types.ts
export type CredentialKeyring = {
  /** Highest configured version; new values are written with it. */
  activeVersion: number;
  keys: ReadonlyMap<number, Buffer>;
};
export type CredentialCipherContext = {
  customerId: string;
  credentialId: string;
  field: CredentialSecretField;
};
```

```ts
// packages/db/src/credentials/credential-keyring.ts
export function parseCredentialKeyring(raw: string | undefined): CredentialKeyring; // wirft CredentialCipherError

// packages/db/src/credentials/credential-cipher.ts
export const credentialCipher = {
  encrypt(keyring: CredentialKeyring, plaintext: string, context: CredentialCipherContext): string,
  decrypt(keyring: CredentialKeyring, ciphertext: string, context: CredentialCipherContext): string,
  /** Key version a stored value was written with; the rekey script skips current ones. */
  readKeyVersion(ciphertext: string): number,
} as const;
```

```ts
// apps/workspace/src/server/shared/services/credential/credential-crypto-service.ts
import "server-only";
export const credentialCryptoService = {
  /** False without a valid keyring; callers then answer with their "not configured" error. */
  isConfigured(): boolean,
  encrypt(plaintext: string, context: CredentialCipherContext): string,
  decrypt(ciphertext: string, context: CredentialCipherContext): string,
} as const;
```

Der Service liest `process.env.CRM_CREDENTIALS_KEYRING` und hält das geparste Ergebnis je Variablenwert im Modul-Scope.
Ändert sich der Wert (Tests setzen ihn um), wird neu geparst. `isConfigured()` fängt den Parse-Fehler und gibt
`false` zurück; `encrypt`/`decrypt` lassen ihn durch.

## Verzeichnisstruktur

```txt
packages/common/src/constants/credentials/
  credential-secret-fields.ts
  credential-cipher-error-codes.ts
  credential-constants.test.ts                 toEqual- und Duplikat-Check je Konstantengruppe
packages/db/src/credentials/
  credential-cipher-types.ts
  credential-cipher-error.class.ts             class CredentialCipherError extends Error { code }
  credential-keyring.ts
  credential-keyring.test.ts
  credential-cipher.ts
  credential-cipher.test.ts
packages/db/scripts/rekey-credentials.ts       Ticket T3, lauffähig nach Task 18 T1
packages/db/package.json                       + "db:credentials:rekey": "tsx scripts/rekey-credentials.ts"
apps/workspace/src/server/shared/services/credential/
  credential-crypto-service.ts
apps/workspace/src/server/tests/shared/services/credential/
  credential-crypto-service.test.ts
apps/workspace/.env.example                    + CRM_CREDENTIALS_KEYRING
apps/workspace/src/server/shared/AGENTS.md     + Abschnitt „Zugangsdaten“
packages/db/AGENTS.md                          + Abschnitt zu src/credentials (warum es im DB-Paket liegt)
```

Eintrag für `.env.example` (unter den Storage-Block):

```dotenv
# Encrypted customer credentials (server-only). Format: "<version>:<base64 of 32 bytes>", comma separated.
# Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Losing this value makes every stored credential unreadable. Keep a copy in your password manager.
CRM_CREDENTIALS_KEYRING=
```

## Tickets

### CRM-17-T1 — Konstanten und Schlüsselring

- **Files:** beide Konstantendateien + Test, `credential-cipher-types.ts`, `credential-cipher-error.class.ts`,
  `credential-keyring.ts` + Test
- **Inhalt:**
  - `parseCredentialKeyring` zerlegt an Kommas, jeden Eintrag am ersten Doppelpunkt; Leerraum um Einträge wird entfernt
  - Version muss eine positive Ganzzahl sein, keine Version doppelt, Schlüssel exakt 32 Byte nach `Buffer.from(…, "base64")`
  - Weil `Buffer.from` ungültiges base64 still verkürzt: nach dem Dekodieren zurück nach base64 kodieren und mit der
    Eingabe (ohne Padding) vergleichen
- **Akzeptanz (je ein Test):**
  - `undefined` und leerer Text → `keyring_missing`
  - falsche Länge, ungültiges base64, doppelte Version, Version `0`, Version `abc`, Eintrag ohne Doppelpunkt →
    `keyring_invalid`
  - zwei Versionen → beide lesbar, die höhere ist `activeVersion`
  - Keine Fehlermeldung enthält den Schlüsseltext (Test prüft `error.message` gegen die Eingabe)

### CRM-17-T2 — Cipher und App-Service

- **Files:** `credential-cipher.ts` + Test, `credential-crypto-service.ts` + Test, `.env.example`, beide `AGENTS.md`
- **Inhalt:**
  - `encrypt`: Nonce erzeugen, `setAAD`, verschlüsseln, Tag anhängen, Format zusammensetzen
  - `decrypt`: Format streng parsen (genau vier Teile, erster Teil `v1`, Version als Ganzzahl, Nonce 12 Byte,
    Rest mindestens 16 Byte), Schlüssel der vermerkten Version holen, `setAAD`, `setAuthTag`, entschlüsseln
  - Jeder Fehler aus `node:crypto` wird zu `decryption_failed` ohne `cause`
  - Die AAD wird immer aus dem Kontext gebildet, nie vom Aufrufer übergeben
- **Akzeptanz:**
  - Rundlauf verlustfrei bei Umlauten, Emoji, Zeilenumbrüchen, 10 000 Zeichen und leerem String
  - Zweimal derselbe Wert ergibt unterschiedliche Chiffrate
  - Ein verändertes Byte in Nonce, Chiffrat oder Tag → `decryption_failed`, nie falscher Klartext
  - Entschlüsseln mit anderem Kunden, anderer Credential-ID oder anderem Feld → `decryption_failed`
  - Drei Teile, fünf Teile, `v2.…`, zu kurze Nonce → `malformed_ciphertext`
  - Chiffrat mit Version 3 bei Ring 1–2 → `unknown_key_version`
  - Mit Version 1 verschlüsselt, danach Ring um Version 2 ergänzt: alter Wert lesbar, neuer Wert trägt Version 2
  - Keine Fehlermeldung und kein `cause` enthält Klartext
  - App-Service: ohne Variable `isConfigured() === false` und `encrypt` wirft `keyring_missing`; nach Setzen der
    Variable im selben Prozess funktioniert er (Cache folgt dem Variablenwert)

### CRM-17-T3 — Rekey-Skript

Wird im selben PR fertig, sobald Task 18 T1 die Tabelle angelegt hat.

- **Files:** `packages/db/scripts/rekey-credentials.ts`, `packages/db/package.json`
- **Vorlage für Zielauswahl und Verbindungsaufbau:** `packages/db/scripts/smoke-crm-constraints.ts` zusammen mit
  `packages/db/scripts/database-target.ts` (Argument `development | preview | production`).
- **Inhalt:**
  - Liest `CRM_CREDENTIALS_KEYRING` aus der Umgebung des Aufrufs und bricht ohne gültigen Ring ab
  - Lädt die IDs aller Zeilen aus `customer_credentials` und verarbeitet sie einzeln
  - Je Zeile eine Transaktion: Zeile `FOR UPDATE` lesen; für `secret_ciphertext` und `note_ciphertext` jeweils, falls
    `readKeyVersion` ≠ `activeVersion`: entschlüsseln, neu verschlüsseln; nur geänderte Spalten schreiben
  - `version`, `updated_at` und `secret_changed_at` bleiben unverändert (technischer Vorgang, keine fachliche
    Änderung; deshalb bewusst nicht über `updateVersioned`)
  - Ausgabe auf Englisch und nur als Zahlen: geprüft, umgeschrieben, bereits aktuell, fehlgeschlagen. Keine IDs
    zusammen mit Werten, keine Chiffrate
  - Eine nicht entschlüsselbare Zeile wird gezählt, der Lauf geht weiter, Exit-Code am Ende ≠ 0
- **Akzeptanz (manuell gegen `development`, im PR dokumentiert):**
  - Seed ausführen, Ring um Version 2 ergänzen, Skript ausführen: alle Zeilen umgeschrieben; Aufdecken im Cockpit
    liefert weiter die Seed-Werte
  - Zweiter Lauf: null Zeilen umgeschrieben
  - Abbruch mit Strg+C mitten im Lauf, danach erneuter Lauf: alle Zeilen tragen die aktive Version

## Schlüsselwechsel (Betrieb)

1. Neuen Schlüssel erzeugen und als nächste Version **anhängen**; den alten behalten. Offline-Sicherung aktualisieren.
2. Deployen. Neue und geänderte Werte tragen ab jetzt die neue Version.
3. `pnpm --filter @invessiv/db db:credentials:rekey production` mit dem neuen Ring in der Umgebung ausführen, bis es
   null umgeschriebene Zeilen meldet.
4. Den alten Schlüssel frühestens entfernen, wenn kein Backup mit alten Chiffraten mehr wiederhergestellt werden
   soll (Aufbewahrung aus Ordner 21). Im Zweifel bleibt er im Ring.

## Deploy-Sicherheit

1. **Live sichtbar:** nichts.
2. **Bricht nichts:** reine Funktionen und ein Service ohne Aufrufer, eine dokumentierte Variable. Ohne Schlüsselring
   startet die Anwendung unverändert.
3. **Betriebsschritt:** siehe README, Abschnitt „Betriebsschritt Schlüsselring“.

## End-to-End-Akzeptanz

1. Ein Schlüssel lässt sich mit dem dokumentierten Befehl erzeugen und wird akzeptiert.
2. Rundlauf über alle Zeichenarten ist verlustfrei.
3. Gleicher Eingabewert ergibt nie dasselbe Chiffrat.
4. Jede Manipulation und jede Vertauschung von Kunde, Datensatz oder Feld schlägt fehl.
5. Ein Schlüsselwechsel lässt alte Datensätze lesbar; Rekey ist fortsetzbar.
6. Kein Fehler und kein Log enthält Klartext oder Schlüsselmaterial.
7. Die Anwendung startet ohne konfigurierten Schlüsselring.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
