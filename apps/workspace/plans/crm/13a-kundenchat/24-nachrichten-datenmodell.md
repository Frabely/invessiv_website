# Task 24 — Nachrichten Datenmodell

> **Merge-Einheit:** Ordner 13a · **Branch:** `feat/crm-13a-kundenchat-intern`
> **Aufwand:** M · **Abhängigkeiten:** Task 20 (Portalnutzer, Ordner 12b), Task 02 (Rechte)
> **Migration:** nächste freie Nummer im Repository ermitteln (Stand 26.09.2026: `0040`)

- Eine Conversation je Kunde; kein Pflicht-`project_id` und keine freie Kanalverwaltung.
- Jede Conversation besitzt `owner_member_id`, initial den bei der Kundenanlage vorhandenen technischen Kunden-Owner,
  sowie eine `version` für unabhängige versionierte Neuzuweisung. Ein späterer Customer-Owner-Wechsel in Ordner 20a
  verändert bestehende Conversations nicht.
- `conversation_reads` speichert je interner Mitgliedschaft bzw. je Portalmitgliedschaft den letzten gelesenen
  Zeitpunkt. Es gibt **kein** `customer_read_at` und **kein** `internal_read_at` an der Conversation.
- Nachrichten sind nach Senden unveränderlich. Nur der Owner darf rechtswidrige Inhalte mit unveränderlicher
  Redaction-Activity ausblenden; kein Edit, kein Soft-Delete, kein Löschweg.
- Anhänge sind nicht Teil dieses Tasks (keine Dateitabelle vorhanden) — `message_files` folgt additiv in Ordner 15.

## Context

Der Kunde soll aus dem Portal heraus schreiben können, und die Nachricht soll im CRM ankommen und beantwortbar sein —
und umgekehrt. Eine durchlaufende Unterhaltung je Kunde, sichtbar auf beiden Seiten, dauerhaft in der Datenbank.

Dieser Task liefert Schema, Handler, Routen und Tests für **beide** Seiten. Die Oberflächen folgen in Task 25 (CRM)
und Task 26 (Portal) im selben Ordner und PR.

Zwei Entwurfsentscheidungen prägen alles Weitere: Der Lesestand wird **je Mitglied** geführt (nicht je Nachricht),
und es gibt einen eigenen Nachrichtentyp für Systemereignisse, damit „Phase auf Umsetzung gewechselt" im selben
Verlauf erscheinen kann wie geschriebene Nachrichten.

## Entscheidungen

| Bereich                               | Entscheidung                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Struktur                              | Eine `conversation` je Kunde, darunter n `messages`. `project_id` nullable bereits vorhanden                                                             |
| Warum nur einer                       | Keine Auswahl vor dem Schreiben, nichts geht unter. Projektbezogene Unterhaltungen docken später ohne Migration an                                       |
| Aktualisierung                        | Laden beim Öffnen, Neuladen nach dem Senden und bei `visibilitychange`. Kein Polling, keine Echtzeit-Infrastruktur                                       |
| Lesestand                             | Eine Row je internem Mitglied bzw. je Portalmitgliedschaft in `conversation_reads`                                                                       |
| Warum je Mitglied, nicht je Nachricht | Ein Lesestand je Nachricht und Person wäre eine weitere Tabelle ohne Nutzen; „bis wann gelesen" reicht                                                   |
| Nachrichtentypen                      | `text` (geschrieben) und `system` (automatisch, z. B. Phasenwechsel)                                                                                     |
| Absender                              | `sender_side` (`internal`/`customer`/`system`) plus `sender_member_id` bzw. `sender_portal_membership_id` und der zum Sendezeitpunkt gültige Anzeigename |
| Warum der Name mitgespeichert wird    | Der Verlauf soll lesbar bleiben, auch wenn ein Ansprechpartner später entfernt wird                                                                      |
| Bearbeiten und Löschen                | Gibt es nicht. Redaction nur mit `chat.redact` (nicht delegierbar, hat nur die Owner-Rolle), mit Activity                                                |
| Länge                                 | Anwendungslimit 10.000 Zeichen nach Trim, Minimum 1                                                                                                      |
| Anhänge                               | Nicht in diesem Ordner; Ordner 15 ergänzt `message_files` (Verweise auf portalöffentliche Dateien)                                                       |
| Blättern                              | Neueste 50, ältere auf Anforderung über einen Cursor (`created_at`, `id`)                                                                                |
| Rechte intern                         | Neue Permissions `chat.read`, `chat.write`, beide `scope_assignable` (bindbar am Kunden)                                                                 |
| Rechte Portal                         | Neue Permissions `portal.messages.read`, `portal.messages.write`, Realm `portal`, in `portal_standard`                                                   |

## Contract

Const-Objekte mit abgeleitetem Typ, keine `enum`. Jedes DTO-Feld bekommt einen Docstring (`packages/common/AGENTS.md`).

```ts
// packages/common/src/constants/crm/message-types.ts
export const MessageType = { Text: "text", System: "system" } as const;
export const MessageSenderSide = {
  Internal: "internal",
  Customer: "customer",
  System: "system",
} as const;

// packages/common/src/constants/crm/message-limits.ts
export const MESSAGE_BODY_MAX_LENGTH = 10_000;
export const MESSAGE_PAGE_SIZE = 50;
export const PORTAL_MESSAGES_PER_HOUR = 60;

// packages/common/src/contracts/crm/message.dto.ts
export interface MessageDto {
  id: string;
  conversationId: string;
  type: MessageType;
  body: string | null; // null wenn redacted; bei system: Dictionary-Key, Parameter in metadata
  metadata: Record<string, string> | null;
  senderSide: MessageSenderSide;
  senderDisplayName: string;
  isOwn: boolean; // aus Sicht des Abfragenden berechnet
  createdAt: string;
  redactedAt: string | null;
}

// packages/common/src/contracts/crm/conversation.dto.ts
export interface ConversationDto {
  id: string;
  customerId: string;
  unreadCount: number; // Nachrichten der Gegenseite nach eigenem Lesestand, ohne system
  lastMessageAt: string | null;
  messages: MessageDto[]; // neueste zuerst geladen, aufsteigend sortiert ausgeliefert
  nextCursor: string | null;
}

export interface InternalConversationDto extends ConversationDto {
  ownerMemberId: string;
  ownerDisplayName: string;
  version: number;
}
```

## Tabellen

```txt
conversations
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE CASCADE
  owner_member_id uuid NOT NULL → workspace_members.id
  version integer NOT NULL                 beim Anlegen explizit 1
  last_message_at      timestamptz NULL
  internal_notified_at timestamptz NULL      Anker für Ordner 20c, hier nie geschrieben
  created_at / updated_at
  INDEX (owner_member_id, customer_id)
  UNIQUE INDEX conversations_customer_uidx
    ON (customer_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'))

messages
  id uuid PK
  conversation_id uuid NOT NULL → conversations.id ON DELETE CASCADE
  client_message_id uuid NULL              bei Textnachrichten aus der App gesetzt; Unique-Index ab Migration 0041
  customer_id uuid NOT NULL     → customers.id ON DELETE CASCADE     denormalisiert
  type text NOT NULL                        CHECK (type IN ('text','system'))
  body text NULL                             NULL nur nach Redaction
  metadata jsonb NULL
  sender_side text NOT NULL                  CHECK (sender_side IN ('internal','customer','system'))
  sender_member_id uuid NULL → workspace_members.id
  sender_portal_membership_id uuid NULL → portal_memberships.id
  sender_display_name text NOT NULL
  created_at timestamptz NOT NULL DEFAULT now()
  redacted_at timestamptz NULL
  redacted_by_member_id uuid NULL → workspace_members.id
  CHECK: sender_side='internal' ⇔ sender_member_id NOT NULL;
         sender_side='customer' ⇔ sender_portal_membership_id NOT NULL
  CHECK: body IS NOT NULL OR redacted_at IS NOT NULL
  INDEX (conversation_id, created_at desc, id desc)
  INDEX (customer_id, created_at desc)
  INDEX (sender_portal_membership_id, created_at desc)   für das Rate-Limit in Task 26

conversation_reads
  id uuid PK
  conversation_id uuid NOT NULL → conversations.id ON DELETE CASCADE
  member_id uuid NULL → workspace_members.id ON DELETE CASCADE
  portal_membership_id uuid NULL → portal_memberships.id ON DELETE CASCADE
  last_read_at timestamptz NOT NULL
  CHECK (num_nonnulls(member_id, portal_membership_id) = 1)
  UNIQUE (conversation_id, member_id)             WHERE member_id IS NOT NULL
  UNIQUE (conversation_id, portal_membership_id)  WHERE portal_membership_id IS NOT NULL
```

`conversations.project_id` läuft auf `ON DELETE CASCADE`, nicht auf `SET NULL`: Der Unique-Index nutzt
`coalesce(project_id, …)`. Bei `SET NULL` würde eine projektbezogene Unterhaltung nach dem Löschen des Projekts mit
der kundenweiten kollidieren. Heute ist der Fall latent; die Regel steht trotzdem von Anfang an richtig.

`customer_id` liegt auch an der Nachricht, damit jede Sicherheitsprüfung ohne Join auskommt.

Migration idempotent (`CREATE … IF NOT EXISTS`, `--> statement-breakpoint` zwischen Statements), inkl. Permission-
Katalog (`chat.read`, `chat.write`, `portal.messages.read`, `portal.messages.write`) und `role_permissions` für
Systemrollen und `portal_standard` mit `ON CONFLICT DO NOTHING` — Muster `0037_create_tasks.sql` und
`0039_add_portal_dashboard.sql`. Drizzle-Modell deckungsgleich (ausdrücklicher Review-Punkt).

## Architektur

```txt
intern (withPermission + CRM_ENDPOINT_ACCESS_RULES)        Portal (withPortalActor)
GET   /api/workspace/crm/customers/[id]/conversation       GET  /api/portal/[customerId]/conversation
POST  /api/workspace/crm/customers/[id]/conversation/messages   POST /api/portal/[customerId]/conversation/messages
POST  /api/workspace/crm/customers/[id]/conversation/read  POST /api/portal/[customerId]/conversation/read
POST  /api/workspace/crm/messages/[messageId]/redact       —
PATCH /api/workspace/crm/customers/[id]/conversation/owner —
```

Getrennte Routen und getrennte Handler für beide Welten — kein gemeinsamer Handler mit Parameter „wer fragt". Portal-
Handler liegen unter `src/server/portal/`, beziehen die Kundenkennung ausschließlich aus dem validierten Portal-Actor
und filtern über `portalAccessCondition`/`portalCanOn`. Interne Handler filtern über `crmAccessCondition`/`canOn` mit
`chat.read` bzw. `chat.write`. Gemeinsame reine Mapping-/Validierungslogik liegt in Services, die beide Welten
importieren dürfen (`src/server/shared/`, siehe dortige `AGENTS.md`).

Client-Endpunkte über `WorkspaceApiEndpoint` (keine URL-Literale); Fehlercodes als Const-Objekt unter
`…/constants/crm/`, Messages nur in co-located `*-error.ts`; Result-Unions statt Exceptions; HTTP-Status aus
`HttpResponseCode`.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_conversations.sql
packages/db/src/record-configuration/crm/{conversations,messages,conversation-reads}.ts  + Barrel index.ts
packages/common/src/constants/crm/{message-types,message-limits,message-error-codes}.ts
packages/common/src/constants/crm/ownable-entities.ts                  + Conversation
packages/common/src/constants/auth/{permissions,permission-definitions,system-role-definitions}.ts
packages/common/src/contracts/crm/{message.dto.ts,conversation.dto.ts}

apps/workspace/src/server/shared/services/message/
  conversation-reader-types.ts    ConversationReader: internes Mitglied oder Portal-Mitgliedschaft
  conversation-service.ts         Unterhaltung finden/anlegen, Lesestand, eine Definition von „ungelesen“
  conversation-mapping-service.ts Row → ConversationDto (leerer Verlauf ohne Row)
  message-mapping-service.ts      Row → MessageDto (Redaction-Platzhalter, isOwn)
  message-service.ts              Seiten, Senden (idempotent), Systemnachrichten, Portal-Limit
apps/workspace/src/server/workspace/crm/
  services/internal-conversation-service.ts          Sichtbarkeit, Inbox, Zähler, Owner-Kandidaten
  services/internal-conversation-mapping-service.ts  InternalConversationDto, Inbox-Zeile
  query-handler/get-customer-conversation.query-handler.ts
  command-handler/send-internal-message.command-handler.ts
  command-handler/mark-conversation-read.command-handler.ts
  command-handler/redact-message.command-handler.ts
  command-handler/update-conversation-owner.command-handler.ts
apps/workspace/src/server/workspace/access/services/responsibilities/responsibility-counter-registry.ts
apps/workspace/src/server/portal/
  query-handler/get-portal-conversation.query-handler.ts
  command-handler/send-customer-message.command-handler.ts
  command-handler/mark-portal-conversation-read.command-handler.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/conversation/**
apps/workspace/src/app/api/workspace/crm/messages/[messageId]/redact/route.ts
apps/workspace/src/app/api/portal/[customerId]/conversation/**
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts   + neue Endpunkte
```

## Tickets

### CRM-24-T1 — Migration, Modelle, Konstanten, Permissions

- **Inhalt:** Tabellen wie oben; Permissions im Katalog und in Const-Objekten; `OwnableEntity.Conversation` inkl.
  `requiredPermission: chat.read` und Counter in `responsibility-counter-registry.ts`; Backfill ist nicht nötig
  (Conversation entsteht lazy).
- **Akzeptanz:** Migration idempotent (zweiter Lauf folgenlos); zweite Unterhaltung für denselben Kunden wird
  abgelehnt; CHECK-Constraints greifen; Modell deckungsgleich zur Migration.

### CRM-24-T2 — Unterhaltung holen und Ungelesen-Zählung

- **Inhalt:**
  - Anlegen nur beim Schreiben (erste Text- oder Systemnachricht) mit `INSERT … ON CONFLICT DO NOTHING` + erneutem
    Lesen; Owner = Kunden-Owner zu diesem Zeitpunkt. Lesen (CRM wie Portal) legt nie an und liefert ohne Row einen
    leeren Verlauf (`id: null`, intern `ownership: null`).
  - Nachrichten: neueste 50, Cursor für ältere, stabil sortiert über `(created_at, id)`
  - Lesebestätigungen tragen die ID der zuletzt tatsächlich angezeigten Textnachricht der Gegenseite; der Server
    prüft die Absenderseite und übernimmt deren DB-Zeitstempel, damit zwischen Laden und Bestätigen eingetroffene
    Nachrichten auch nach einem eigenen Senden ungelesen bleiben.
  - Ungelesen = Nachrichten der **anderen** Seite (ohne `system`) nach dem eigenen `last_read_at`
  - Redacted-Nachrichten: `body = null`, `redactedAt` gesetzt
- **Akzeptanz (Tests):** eigene Nachrichten zählen nie als ungelesen; Systemnachrichten zählen nicht; Cursor
  überspringt und wiederholt keine Nachricht; zwei parallele Aufrufe erzeugen genau eine Unterhaltung.

### CRM-24-T3 — Senden, Redaction, Owner-Wechsel

- **Inhalt:**
  - Senden (beide Seiten): Trim, 1–10.000 Zeichen, Anzeigename ermitteln und mitspeichern, `last_message_at`
    aktualisieren und Activity schreiben (ohne Nachrichteninhalt) — alles in einer Transaktion. Eine stabile
    `clientMessageId` mit Unique-Index verhindert doppelte Nachrichten nach einem verlorenen Response und Retry.
    Der Lesestand wird nur für tatsächlich angezeigte Nachrichten gesetzt.
  - Intern nur mit `chat.write` am Kunden; Portal nur mit `portal.messages.write`
  - Redaction: nur mit `chat.redact`; setzt `body = null`, `redacted_at`, `redacted_by_member_id`; Activity ohne Inhalt;
    `system`-Nachrichten und bereits redigierte Nachrichten sind nicht redigierbar. Die Antwort enthält die
    redigierte Nachricht, damit auch bereits geladene ältere Seiten ihren Text sofort ersetzen.
  - Owner-Wechsel über `updateVersioned`; Ziel muss aktives Mitglied mit wirksamem `chat.read` am Kunden sein; 409 mit
    `VersionConflictDto`; Activity
- **Akzeptanz (Tests):** kein Endpunkt/Handler ändert `body` außer Redaction; leerer oder Whitespace-Text abgelehnt;
  nach Redaction liefert keine Query den Inhalt, die Activity bleibt; Nicht-Owner erhält 403/404; inaktives Mitglied
  als Owner abgelehnt; veraltete Version → 409.

### CRM-24-T4 — Lesestand, Systemnachrichten, Routen

- **Inhalt:**
  - Lesestand je Mitglied als Upsert; nie rückwärts (`GREATEST`)
  - `messageService.appendSystemMessage(executor, customerId, key, params)` — nur bereitgestellt; Verdrahtung in Task 25
  - Alle Routen; interne in `CRM_ENDPOINT_ACCESS_RULES`
- **Akzeptanz (Tests):** Lesestand wird nicht zurückgesetzt; Systemnachricht erscheint in beiden Sichten und erhöht
  keinen Zähler; **Cross-Customer-Negativtests mit echten Sessions**: fremde Unterhaltung/Nachricht → 404 in allen
  internen und Portal-Routen, fehlende Permission → 404/403 gemäß bestehendem Muster; Portal-Route ignoriert jede
  Kunden-/Unterhaltungskennung, die nicht aus dem Actor stammt.

## Deploy-Sicherheit

Innerhalb des gemeinsamen PRs mit Task 25/26. Für sich betrachtet: neue Tabellen und Endpunkte ohne Aufrufer, durch
ihre Wrapper geschützt. Keine bestehende Tabelle wird verändert.

## End-to-End-Akzeptanz

1. Migration läuft zweimal folgenlos, je Kunde entsteht höchstens eine Unterhaltung.
2. Nachrichten lassen sich über beide Handler senden und ownerseitig redigieren — jeweils mit korrekten Grenzen.
3. Der Ungelesen-Zähler stimmt aus Sicht jedes Mitglieds beider Seiten.
4. Blättern über den Cursor ist lückenlos.
5. Ein Portalnutzer erreicht keine fremde Unterhaltung.
6. Redigierte Inhalte sind in der Datenbank nicht mehr vorhanden, die Activity schon.
