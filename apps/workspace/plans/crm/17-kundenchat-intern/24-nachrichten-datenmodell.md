# Task 24 — Nachrichten Datenmodell

> **Merge-Einheit:** Ordner 17 · **Branch:** `feat/crm-kundenchat-intern`
> **Aufwand:** M · **Abhängigkeiten:** Task 20 (Portalnutzer), Task 02 (Rechte)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Eine Conversation je Kunde; kein Pflicht-`project_id` und keine freie Kanalverwaltung.
- `conversation_reads` speichert pro interner/Portal-Mitgliedschaft den letzten gelesenen Zeitpunkt
  beziehungsweise Message-Cursor. `customer_read_at` und `internal_read_at` an Conversation
  entfallen.
- Nachrichten sind nach Senden unveränderlich. Nur Owner darf rechtswidrige Inhalte mit
  unveränderlicher Redaction-Aktivität ausblenden; kein 15-Minuten-Edit und kein normaler Soft-Delete.
- Anhänge sind ausschließlich Links auf bereits vorhandene, portalöffentliche Dateien in
  `message_files`; Chat besitzt keine zweite Uploadablage.

## Context

Der Kunde soll aus dem Portal heraus schreiben können, und die Nachricht soll im CRM ankommen und
beantwortbar sein. Eine durchlaufende Unterhaltung je Kunde — sichtbar auf beiden Seiten, dauerhaft
in der Datenbank statt in einem Mail-Postfach.

Wie bei den anderen Fundament-Tasks: nur Schema, Handler und Tests. Die beiden Oberflächen folgen in
Task 25 (CRM) und Task 26 (Portal).

Zwei Entwurfsentscheidungen prägen alles Weitere: Der Lesestand wird **je Seite** geführt (nicht je
Nachricht), und es gibt einen eigenen Nachrichtentyp für Systemereignisse, damit „Phase auf Umsetzung
gewechselt" im selben Verlauf erscheinen kann wie geschriebene Nachrichten.

## Entscheidungen

| Bereich                            | Entscheidung                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Struktur                           | Eine `conversation` je Kunde, darunter n `messages`. `project_id` nullable bereits vorhanden                         |
| Warum nur einer                    | Keine Auswahl vor dem Schreiben, nichts geht unter. Projektbezogene Unterhaltungen docken später ohne Migration an   |
| Aktualisierung                     | Laden beim Öffnen, Neuladen nach dem Senden. Kein Polling, keine Echtzeit-Infrastruktur                              |
| Lesestand                          | Je internem Mitglied eine Read-Row; Kundenlesestand wird separat pro Portalidentität geführt                         |
| Warum je Seite                     | Ein Lesestand je Nachricht und Person wäre eine dritte Tabelle für einen Nutzen, den es bei zwei Parteien nicht gibt |
| Nachrichtentypen                   | `text` (geschrieben) und `system` (automatisch, zum Beispiel Phasenwechsel oder eingegangene Einreichung)            |
| Absender                           | `sender_side` (`internal`/`customer`) plus Kennung und der zum Sendezeitpunkt gültige Anzeigename                    |
| Warum der Name mitgespeichert wird | Der Verlauf soll lesbar bleiben, auch wenn ein Ansprechpartner später gelöscht wird                                  |
| Bearbeiten und Löschen             | Nachrichten sind unveränderlich; Redaction nur durch Owner mit unveränderlicher Audit-Aktivität                      |
| Länge                              | `text`, Anwendungslimit 10.000 Zeichen                                                                               |
| Anhänge                            | Nicht enthalten. Dateien laufen über den Upload-Bereich                                                              |
| Blättern                           | Neueste 50, ältere auf Anforderung über einen Cursor                                                                 |

## Contract

```ts
// packages/common/src/constants/crm/message-types.ts
export const MessageType = { Text: "text", System: "system" } as const;

// packages/common/src/contracts/crm/message.dto.ts
export interface MessageDto {
  id: string;
  conversationId: string;
  type: MessageType;
  body: string; // bei system: ein Dictionary-Key mit Parametern im metadata
  metadata: Record<string, string> | null;
  senderSide: ResponsibleSide;
  senderDisplayName: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface ConversationDto {
  id: string;
  customerId: string;
  unreadCount: number; // je nach abfragender Seite berechnet
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}
```

## Tabellen

```txt
conversations
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE CASCADE
  internal_read_at timestamptz NULL
  last_message_at  timestamptz NULL
  created_at / updated_at
  UNIQUE INDEX conversations_customer_uidx
    ON (customer_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'))

messages
  id uuid PK
  conversation_id uuid NOT NULL → conversations.id ON DELETE CASCADE
  customer_id uuid NOT NULL     → customers.id ON DELETE CASCADE    denormalisiert
  type text NOT NULL DEFAULT 'text'   CHECK in MESSAGE_TYPE_VALUES
  body text NOT NULL
  metadata jsonb NULL
  sender_side text NOT NULL           CHECK in MESSAGE_SENDER_SIDE_VALUES
  sender_id text NULL
  sender_display_name text NOT NULL
  created_at timestamptz NOT NULL DEFAULT now()
  edited_at  timestamptz NULL
  INDEX (conversation_id, created_at desc)
  INDEX (customer_id, created_at desc)
```

`conversations.project_id` läuft auf `ON DELETE CASCADE`, nicht auf `SET NULL`. Grund ist derselbe
wie bei den Einreichungen in Task 22: Der Unique-Index nutzt `coalesce(project_id, …)`. Bei
`SET NULL` würde eine projektbezogene Unterhaltung nach dem Löschen des Projekts mit der kundenweiten
kollidieren, den Index verletzen und das Löschen mit einem rohen Datenbankfehler blockieren. Heute
existiert je Kunde nur eine Unterhaltung, der Fall ist also noch latent — aber die Regel steht von
Anfang an richtig, damit projektbezogene Threads später wirklich ohne Migration andocken können.

`customer_id` liegt auch an der Nachricht — dieselbe Begründung wie bei den Dateien: Jede
Sicherheitsprüfung soll ohne Join auskommen.

## Architektur

```txt
intern                                     Portal
GET   /api/workspace/crm/conversations/... GET  /api/portal/conversation
POST  .../messages                         POST /api/portal/conversation/messages
PATCH .../messages/[messageId]             PATCH /api/portal/conversation/messages/[id]
DELETE .../messages/[messageId]            DELETE /api/portal/conversation/messages/[id]
POST  .../read                             POST /api/portal/conversation/read
```

Getrennte Routen und getrennte Handler für beide Welten — kein gemeinsamer Handler, der über einen
Parameter entscheidet, wer gerade schreibt. Die Portal-Handler beziehen die Kundenkennung wie immer
aus der Sitzung.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_conversations.sql
packages/db/src/record-configuration/crm/{conversations,messages}.ts
packages/common/src/constants/crm/message-types.ts
packages/common/src/constants/crm/message-limits.ts
packages/common/src/contracts/crm/{message.dto.ts,conversation.dto.ts}

apps/workspace/src/server/workspace/crm/
  query-handler/get-conversation.query-handler.ts
  command-handler/{send,edit,delete}-internal-message.command-handler.ts
  command-handler/mark-conversation-read.command-handler.ts
apps/workspace/src/server/portal/
  query-handler/get-portal-conversation.query-handler.ts
  command-handler/{send,edit,delete}-customer-message.command-handler.ts
  command-handler/mark-portal-conversation-read.command-handler.ts
apps/workspace/src/server/workspace/crm/services/
  conversation-service.ts        holt oder legt die Unterhaltung an
  message-validation-service.ts
  system-message-service.ts      schreibt Systemnachrichten
```

## Tickets

### CRM-24-T1 — Migration, Modelle, Konstanten

- **Files:** `<nr>_create_conversations.sql`, zwei `pgTable`-Dateien,
  `constants/crm/{message-types,message-limits}.ts` + Tests, beide DTOs
- **Skills:** `best-practices`
- **Inhalt:** Tabellen wie oben; Unique-Index erzwingt eine Unterhaltung je Kunde und Projekt
- **Akzeptanz:** Migration idempotent; eine zweite Unterhaltung für denselben Kunden wird abgelehnt

### CRM-24-T2 — Unterhaltung holen und Ungelesen-Zählung

- **Files:** `services/conversation-service.ts`, beide `get-conversation`-Query-Handler + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Unterhaltung holen oder anlegen, mit `ON CONFLICT DO NOTHING` gegen parallele Aufrufe
  - Nachrichten absteigend, Standard 50, Cursor für ältere
  - Ungelesen-Zählung je nach abfragender Seite: Nachrichten der **anderen** Seite nach dem eigenen
    Lesestand
  - Redacted-Nachrichten kommen mit neutralem Platzhalter und erhalten ihre Audit-Referenz
- **Akzeptanz:**
  - Test: eigene Nachrichten zählen nie als ungelesen
  - Test: Systemnachrichten zählen nicht als ungelesen
  - Test: Blättern über den Cursor überspringt und wiederholt keine Nachricht
  - Test: zwei parallele Aufrufe erzeugen genau eine Unterhaltung

### CRM-24-T3 — Senden und Owner-Redaction

- **Files:** je drei Command-Handler für beide Seiten, `services/message-validation-service.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Senden: Länge prüfen (1 bis 10.000 Zeichen nach Trim), Anzeigename des Absenders ermitteln und
    mitspeichern, `last_message_at` aktualisieren, eigenen Lesestand mitziehen
  - Senden: nur berechtigte Mitglieder; Nachrichten werden unveränderlich gespeichert
  - Redaction: ausschließlich Owner, ersetzt Anzeigeinhalt ohne Secret-/PII-Wert in Logs
  - Portal-Handler prüfen zusätzlich die Zugehörigkeit der Unterhaltung zur Sitzung
- **Akzeptanz:**
  - Test: Bearbeiten/Ändern einer Nachricht ist nicht möglich
  - Test: nach 16 Minuten ergibt Bearbeiten 409
  - Test: Systemnachricht lässt sich nicht redigieren
  - Test: leerer oder nur aus Leerzeichen bestehender Text wird abgelehnt
  - Test: nach dem Löschen ist der Inhalt in der Datenbank nicht mehr vorhanden

### CRM-24-T4 — Lesestand und Systemnachrichten

- **Files:** beide `mark-conversation-read`-Handler, `services/system-message-service.ts`, alle
  Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Lesestand je Seite setzen; nie rückwärts (ein älterer Zeitstempel überschreibt keinen neueren)
  - `appendSystemMessage(customerId, key, params)` für Phasenwechsel und eingegangene Einreichungen
  - Interne Routen über `withPermission(Permission.CustomersWrite)`, Portal-Routen über
    `withPortalApiAuth`
- **Akzeptanz:**
  - Test: Lesestand wird nicht zurückgesetzt
  - Test: Systemnachricht erscheint im Verlauf beider Seiten und erhöht keinen Ungelesen-Zähler
  - Test: alle Portal-Routen weisen fremde Unterhaltungen mit 404 ab

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Keine Oberfläche auf beiden Seiten.
2. **Bricht nichts:** zwei neue Tabellen, neue Endpunkte ohne Aufrufer. Der `system-message-service`
   wird hier nur bereitgestellt und noch **nirgends** aufgerufen — Phasenwechsel und Einreichungen
   erzeugen erst mit Task 25 Systemnachrichten, damit sie auch jemand sehen kann.
3. **Offen:** beide Oberflächen. Ohne Aufrufer sind die Endpunkte durch ihre Wrapper geschützt und
   nicht öffentlich erreichbar.

## End-to-End-Akzeptanz

1. Migration läuft, je Kunde entsteht höchstens eine Unterhaltung.
2. Nachrichten lassen sich über den Handler senden und ownerseitig redigieren — jeweils mit korrekten
   Grenzen.
3. Der Ungelesen-Zähler stimmt aus Sicht beider Seiten.
4. Blättern über den Cursor ist lückenlos.
5. Ein Portalnutzer erreicht keine fremde Unterhaltung.
6. Gelöschte Nachrichteninhalte sind in der Datenbank nicht mehr vorhanden.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
