# Task 17 — Credentials Crypto

> **Merge-Einheit:** Ordner 19, PR 19.1 · **Branch:** `feat/crm-credentials-1-intern`
> **Aufwand:** M · **Abhängigkeiten:** keine
> **Migration:** keine

- Ein Service verschlüsselt und entschlüsselt einzelne Feldwerte mit AES-256-GCM.
- Der Schlüsselring kommt aus einer server-only Umgebungsvariable und kennt mehrere Versionen.
- Jedes Chiffrat ist an Kunde, Datensatz und Feld gebunden.
- Kein Klartext und kein Schlüsselmaterial in Fehlern oder Logs.

## Context

Bevor ein Kundenpasswort in die Datenbank geschrieben wird, muss die Verschlüsselung stehen und geprüft sein. Der Task
hat deshalb weder Tabelle noch Oberfläche, nur zwei Services und ihre Tests. Ein Fehler an dieser Stelle fällt nicht in
der Oberfläche auf, sondern erst bei einem Leck.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verfahren           | AES-256-GCM je Feldwert, direkt mit dem aktiven Hauptschlüssel. Nonce 12 Byte, je Vorgang neu zufällig. Auth-Tag 16 Byte                                                                       |
| Kein Datenschlüssel | Der frühere Entwurf mit einem Datenschlüssel je Datensatz entfällt. Bei wenigen hundert Zeilen bringt er keinen Vorteil; ein Schlüsselwechsel muss ohnehin jede Zeile anfassen                 |
| Bibliothek          | `node:crypto`. Keine neue Abhängigkeit                                                                                                                                                         |
| AAD                 | `v1` + Kunden-ID + Credential-ID + Feldname (`secret` \| `note`), eindeutig getrennt. Ein Chiffrat lässt sich damit nicht in ein anderes Feld, einen anderen Datensatz oder Kunden verschieben |
| Nicht in der AAD    | Die Projekt-ID, weil die Projektzuordnung änderbar ist                                                                                                                                         |
| Speicherform        | Ein Text: `v1.<keyVersion>.<nonce>.<ciphertext+tag>`, die letzten beiden Teile base64url. Kein `jsonb`                                                                                         |
| Schlüsselring       | `CRM_CREDENTIALS_KEYRING="1:<base64>,2:<base64>"`. Jeder Schlüssel exakt 32 Byte. Verschlüsselt wird mit der höchsten Version, entschlüsselt mit der im Chiffrat vermerkten                    |
| Fehlender Schlüssel | Die Anwendung startet. `isConfigured()` ist `false`, jeder Verschlüsselungs- oder Entschlüsselungsversuch liefert einen Konfigurationsfehler. Der Bereich ist dann schreibgeschützt (Task 18)  |
| Fehlerverhalten     | Typisierte Fehler mit Code, ohne Klartext, Chiffrat oder Schlüsselanteil. Der ursprüngliche `crypto`-Fehler wird nicht als `cause` weitergereicht                                              |
| Protokollierung     | Die Services loggen nichts. Audit schreibt der aufrufende Handler                                                                                                                              |
| Ablage              | `server/shared/services/credential/`, weil Workspace- und Portal-Handler (Task 71) denselben Dienst brauchen                                                                                   |
| Schlüsselverlust    | Nicht behebbar. Der Schlüsselring wird vor dem ersten Datensatz offline gesichert (Betriebsschritt)                                                                                            |

## Contract

```ts
// apps/workspace/src/server/shared/services/credential/credential-crypto-types.ts
export type CredentialCryptoContext = {
  customerId: string;
  credentialId: string;
  field: CredentialSecretField; // "secret" | "note"
};
```

```ts
// apps/workspace/src/server/shared/services/credential/credential-crypto-service.ts
export const credentialCryptoService = {
  isConfigured(): boolean,
  encrypt(plaintext: string, context: CredentialCryptoContext): string,
  decrypt(ciphertext: string, context: CredentialCryptoContext): string,
  /** Key version a stored value was written with; the rekey script skips current ones. */
  readKeyVersion(ciphertext: string): number,
  activeKeyVersion(): number,
} as const;
```

## Verzeichnisstruktur

```txt
packages/common/src/constants/crm/credentials/
  credential-secret-fields.ts               CredentialSecretField + _VALUES, mit Test
  errors/credential-crypto-error-codes.ts   KeyringMissing, KeyringInvalid, UnknownKeyVersion,
                                            MalformedCiphertext, DecryptionFailed
apps/workspace/src/server/shared/services/credential/
  credential-keyring-service.ts             liest und prüft den Schlüsselring
  credential-crypto-service.ts
  credential-crypto-types.ts
  credential-crypto-error.class.ts
apps/workspace/src/server/tests/shared/services/credential/
  credential-keyring-service.test.ts
  credential-crypto-service.test.ts
apps/workspace/scripts/rekey-credentials.ts  ab Task 18 lauffähig (braucht die Tabelle)
apps/workspace/.env.example                 + CRM_CREDENTIALS_KEYRING mit Erzeugungsbefehl
```

Der genaue Ort des Skripts wird bei der Umsetzung geprüft: `apps/workspace` hat bisher keinen `scripts/`-Ordner, und
der Krypto-Dienst darf nicht nach `packages/db` wandern. Das Skript importiert den Dienst und das Drizzle-Modell.

## Tickets

### CRM-17-T1 — Schlüsselring

- **Files:** `credential-keyring-service.ts` + Test, `credential-crypto-error-codes.ts`, `.env.example`
- **Inhalt:**
  - `CRM_CREDENTIALS_KEYRING` parsen: Einträge `version:base64`, Version positive Ganzzahl, keine doppelte Version,
    jeder Schlüssel nach dem Dekodieren exakt 32 Byte
  - Höchste Version ist die aktive
  - Ergebnis wird je Variablenwert zwischengespeichert; ändert sich der Wert, wird neu gelesen
  - `.env.example` nennt den Erzeugungsbefehl
    (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) und den Hinweis auf die
    Offline-Sicherung
- **Akzeptanz:**
  - Fehlende Variable, leerer Wert, falsche Länge, ungültiges base64, doppelte Version und Version ≤ 0 ergeben je einen
    klaren Fehlercode
  - Keine Fehlermeldung enthält den Schlüssel oder Teile davon
  - Zwei Versionen werden erkannt, die höhere ist aktiv

### CRM-17-T2 — Verschlüsselungsdienst

- **Files:** `credential-crypto-service.ts`, `credential-crypto-types.ts`, `credential-crypto-error.class.ts`,
  `credential-secret-fields.ts` + Tests
- **Inhalt:**
  - `encrypt` und `decrypt` wie im Contract; AAD wird aus dem Kontext gebildet, nie vom Aufrufer übergeben
  - Strenges Parsen des Speicherformats: genau vier Teile, bekannte Formatversion, Nonce 12 Byte
  - Unbekannte Schlüsselversion ist ein eigener Fehlercode (Hinweis auf einen fehlenden alten Schlüssel im Ring)
- **Akzeptanz:**
  - Rundlauf verlustfrei bei Umlauten, Emoji, Zeilenumbrüchen, 10 000 Zeichen und leerem String
  - Zweimal derselbe Wert ergibt unterschiedliche Chiffrate
  - Ein verändertes Byte in Nonce, Chiffrat oder Tag führt zu `DecryptionFailed`, nie zu falschem Klartext
  - Entschlüsseln mit anderem Kunden, anderer Credential-ID oder anderem Feld schlägt fehl
  - Ein mit Version 1 verschlüsselter Wert bleibt lesbar, nachdem Version 2 ergänzt wurde; neue Werte tragen Version 2
  - Test prüft ausdrücklich, dass keine Fehlermeldung und kein `cause` Klartext enthält

### CRM-17-T3 — Rekey-Skript

Wird im selben PR nach Task 18 T1 fertig, weil es die Tabelle braucht.

- **Files:** `rekey-credentials.ts` + Test der Kernfunktion
- **Inhalt:**
  - Liest alle Zeilen, deren `secret_ciphertext` oder `note_ciphertext` nicht die aktive Version trägt
  - Je Zeile eine Transaktion: entschlüsseln, neu verschlüsseln, schreiben. `version` und `secret_changed_at` bleiben
    unverändert (technischer Vorgang, keine fachliche Änderung)
  - Gibt nur Zahlen aus (geprüft, umgeschrieben, fehlgeschlagen), nie IDs mit Werten
  - Läuft gegen jedes Ziel, verlangt für `production` ein ausdrückliches Argument
- **Akzeptanz:**
  - Zweiter Lauf schreibt nichts
  - Abbruch nach der Hälfte, danach erneuter Lauf: alle Zeilen tragen die aktive Version
  - Eine nicht entschlüsselbare Zeile bricht den Lauf nicht ab, wird gezählt und führt zu Exit-Code ≠ 0

## Schlüsselwechsel (Betrieb)

1. Neuen Schlüssel erzeugen, als nächste Version **anhängen**, alten behalten. Offline-Sicherung aktualisieren.
2. Deployen. Neue Werte tragen die neue Version.
3. Rekey-Skript ausführen, bis es null Zeilen meldet.
4. Alten Schlüssel frühestens entfernen, wenn kein Backup mit alten Chiffraten mehr wiederhergestellt werden soll
   (Aufbewahrung aus Ordner 21). Im Zweifel bleibt er im Ring.

## Deploy-Sicherheit

1. **Live sichtbar:** nichts.
2. **Bricht nichts:** zwei Services ohne Aufrufer, eine dokumentierte Variable. Ohne Schlüsselring startet die
   Anwendung unverändert.
3. **Betriebsschritt vor dem ersten Eintrag (verbindlich):** Schlüsselring in allen Vercel-Umgebungen setzen (je
   Umgebung ein eigener Schlüssel) **und** im Passwortmanager hinterlegen. Im PR wird das bestätigt.

## End-to-End-Akzeptanz

1. Ein Schlüssel lässt sich mit dem dokumentierten Befehl erzeugen und wird akzeptiert.
2. Rundlauf über alle Zeichenarten ist verlustfrei.
3. Gleicher Eingabewert ergibt nie dasselbe Chiffrat.
4. Jede Manipulation und jede Vertauschung von Kunde, Datensatz oder Feld schlägt fehl.
5. Ein Schlüsselwechsel lässt alte Datensätze lesbar; Rekey ist fortsetzbar.
6. Kein Fehler und kein Log enthält Klartext oder Schlüsselmaterial.
7. Die Anwendung startet ohne konfigurierten Schlüsselring.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
