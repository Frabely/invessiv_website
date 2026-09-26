# Ordner 13a — Kundenchat (CRM und Portal)

> **Status:** läuft · **Abhängigkeiten:** 12b, 13 · **Aufwand:** 5–6 Tage · **Reviewziel:** 110–140 Dateien

> **Zusammenlegung (26.09.2026):** Die früheren Ordner 13a „Kundenchat intern“ und 13b „Kundenchat Portal“ sind zu
> diesem Ordner zusammengeführt. Grund: Die Mockups stehen auf beiden Seiten bereits (`ChatDock` aus `@invessiv/ui`
> im Kunden-Cockpit und im Portal-Dashboard-Widget `messages`), und eine reine CRM-Hälfte hätte einen Chat
> ausgeliefert, den kein Kunde liest. Das Reviewziel liegt über der 120-Dateien-Schwelle aus `../AGENTS.md`; der
> Scope ist geprüft: Die Portalgrenze bekommt statt eines eigenen PRs einen eigenen, abgegrenzten Abschnitt im
> PR-Testplan (Cross-Customer-Negativtests mit echten Sessions). Benachrichtigungen und Mails sind vollständig nach
> Ordner 20c ausgelagert; die harte Grenze von 200 Dateien bleibt weit entfernt.

> **Portal-Fundament:** Seiten über `requirePortalActor(locale, customerId)`, Endpunkte über `withPortalActor`, jede
> Portal-Query über `portalAccessCondition`, jede Portal-Mutation über `portalCanOn` (alles aus Task 49). Eigene
> Portal-Permissions dieses Ordners, in `portal_standard` ergänzt: `portal.messages.read`, `portal.messages.write` —
> firmenweites Modul, verlangt nach Einführung des Projektbezugs eine firmenweite Rolle. Navigation: „Nachrichten“
> (`/portal/[customerId]/messages`) in `PORTAL_NAV_ITEMS` mit `requiredPermission`. Negativtests zusätzlich für
> fehlende Portal-Permission.

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`24-nachrichten-datenmodell.md`](./24-nachrichten-datenmodell.md) — unveränderliche Nachrichten,
  Lesestände je Mitglied, interne und Portal-Handler.
- [`25-chat-im-crm.md`](./25-chat-im-crm.md) — Verlaufskomponente, Chat im Cockpit-Dock, Posteingang und
  Sidebar-Zähler.
- [`26-chat-im-portal.md`](./26-chat-im-portal.md) — Portal-Dock, Portalseite und Rate-Limit.

Pro Kunde existiert ein gemeinsamer Chat. Nach diesem Merge ist er **bidirektional** vollständig nutzbar: Mitarbeiter
schreiben im Kunden-Cockpit oder im Posteingang `/crm/nachrichten`, Kunden im Portal-Dock oder unter
`/portal/[customerId]/messages`. Beide Seiten sehen denselben Verlauf. Benachrichtigungen (Glocke, interne Bündelung,
Kundendigest, E-Mail-Schalter) werden in Ordner 20c aktiviert; bis dahin sind Sidebar-Zähler, Posteingang und
Portal-Widget die Hinweise auf neue Nachrichten.

## Einstieg für die Umsetzung (neue Session)

Reihenfolge: diese README → `../00-entscheidungen.md` (Tabelle „Wiederverwendete Muster“) → `../AGENTS.md` → scoped
`AGENTS.md` am Zielcode → Task 24 → 25 → 26. Branch: `feat/crm-13a-kundenchat-intern` (bereits angelegt). Status
beim Start in dieser README und in der Tabelle in `../00-entscheidungen.md` auf `läuft` setzen. Kein Auto-Commit.

Verifizierte Code-Anker (Stand 26.09.2026):

| Baustein                           | Ort                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChatDock` (Mock, `children`-Slot) | `packages/ui/src/components/chat-dock/chat-dock.tsx`, Texte `ChatDockContent` in `packages/common`                                                                                                                            |
| Cockpit-Dock                       | `apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx`                                                                                                                          |
| Portal-Dock                        | `apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.tsx`                                                                                                                                        |
| Portal-Widget `messages` (`mock`)  | `apps/workspace/src/common/constants/portal/portal-widget-layout.ts`, `portal-widget-keys.ts`                                                                                                                                 |
| Portal-Navigation/Sektionen        | `common/constants/portal/portal-nav-items.ts`, `portal-sections.ts` (`PortalSection.Messages`)                                                                                                                                |
| Portal-Auth                        | `server/portal/auth/{with-portal-actor,require-portal-actor}.ts`                                                                                                                                                              |
| Portal-Sichtbarkeit                | `server/portal/shared/portal-access-condition.ts` (`portalAccessCondition`, `portalCanOn`)                                                                                                                                    |
| Muster Portal-Mutation             | `server/portal/command-handler/complete-customer-task.command-handler.ts` + Route unter `app/api/portal/[customerId]/tasks/`                                                                                                  |
| CRM-Zugriff                        | `crmAccessCondition`, `canOn` (Beispiel: `server/workspace/crm/query-handler/list-customer-tasks.query-handler.ts`)                                                                                                           |
| Endpunkt-Regeln                    | `common/constants/auth/crm-endpoint-access-rules.ts` (`CRM_ENDPOINT_ACCESS_RULES`)                                                                                                                                            |
| Permissions                        | `packages/common/src/constants/auth/{permissions,permission-definitions,system-role-definitions}.ts`; Katalog per Migration (Muster `0037_create_tasks.sql` für `tasks.read`, `0039_add_portal_dashboard.sql` für `portal.*`) |
| Besitzbare Entitäten               | `packages/common/src/constants/crm/ownable-entities.ts`, `server/workspace/access/services/responsibilities/responsibility-counter-registry.ts` (Muster `task-responsibility-counter.ts`)                                     |
| Versionierter Write                | `updateVersioned` (`server/workspace/shared/`)                                                                                                                                                                                |
| Portalmitgliedschaft               | `packages/db/src/record-configuration/crm/portal-memberships.ts` (`last_seen_at`, `customer_notified_at`, `email_notifications_enabled` existieren)                                                                           |
| Phasenwechsel                      | `server/workspace/crm/command-handler/update-project.command-handler.ts`                                                                                                                                                      |
| Seed                               | `packages/db` Script `db:seed:crm`                                                                                                                                                                                            |

Nicht vorhanden (bewusst): Dateitabelle (→ Anhänge in Ordner 15), Feedback-Einreichung (→ Systemnachricht in Ordner
16), generischer Rate-Limiter (→ Zählung direkt auf `messages`, siehe Task 26), Outbox/Mail (→ Ordner 20c).

## Daten und Verhalten

- Additive Migration und Modelle für `conversations`, `messages` und `conversation_reads` (nächste freie
  Migrationsnummer, Stand 26.09.2026: `0040`).
- Genau eine kundenweite Conversation pro Kunde. `conversations.project_id` ist nullable vorhanden;
  projektbezogene Unterhaltungen docken später ohne Migration an (Klärung 14.09.2026).
- Jede Conversation hat einen internen Verantwortlichen, initial den bei der Kundenanlage vorhandenen technischen
  Kunden-Owner. Er kann unabhängig geändert werden; Zuständigkeit gewährt keinen Zugriff und ersetzt weder
  `chat.read` noch `chat.write`. Ein späterer Customer-Owner-Wechsel in Ordner 20a verändert ihn nicht.
- Chat-Permissions (`chat.read`, `chat.write`) entstehen hier als bindbar (`scopable`). Die kundenweite Conversation
  verlangt das Recht am Kunden oder workspace-weit; eine Projektbindung allein öffnet sie nicht.
- Nachrichten speichern Absenderseite, Absenderkennung, Anzeigenamen zum Sendezeitpunkt, Plaintext, Zeitpunkt und
  optionale Ausblendung durch Owner.
- Nachrichten sind nach Senden unveränderlich; Korrekturen erfolgen als neue Nachricht. Es gibt
  keinen Bearbeiten- und keinen normalen Löschweg — weder im CRM noch im Portal.
- Owner-Ausblendung (Redaction) bewahrt Auditmetadaten, zeigt Inhalt aber keinem normalen Nutzer mehr.
- `conversation_reads` je Portalmitglied und je internem Mitglied; nie ein globales `customer_read_at` oder
  `internal_read_at`.
- **Anhänge sind nicht Teil dieses Ordners.** Es existiert noch keine Dateitabelle (Ordner 14/15 offen). Ordner 15
  ergänzt additiv `message_files` als reine Verweise auf portalöffentliche Dateien (Mutation prüft Sichtbarkeit
  erneut; Entzug einer Freigabe entfernt den späteren Downloadzugriff). Chat besitzt nie eine eigene Uploadablage.
- Laden beim Öffnen und Aktualisieren nach Senden. Kein Dauerpolling; manueller Refresh und
  Seitenfokus laden neu.
- `conversations.internal_notified_at` entsteht hier als Anker der internen Bündelung, wird aber erst in Ordner 20c
  geschrieben.
- Portal: Kundenkennung ausschließlich aus der validierten Sitzung; kein Endpunkt nimmt sie aus der Anfrage.
  Datenbankgestütztes Limit: 30 Nachrichten je Stunde und Portalmitglied.

## Portal-Widget und Cockpit-Dock (aus Ordner 12c und 13)

Der `ChatDock` aus `@invessiv/ui` existiert als Mock im Kunden-Cockpit (Ordner 12c) und im Portal-Dashboard als
Widget `messages` („Nachrichten“, `openMode: dock`, Ordner 13). Dieser Ordner stellt beide auf echte Daten um: Der
Dock bekommt den echten Verlauf als `children`, das Portal-Widget zeigt den Ungelesen-Stand und öffnet den Dock. Die
früher genannte Dashboard-Karte „Offene Nachrichten“ **ist** dieses Registry-Widget, keine zusätzliche Karte.

## Benachrichtigung

- Nicht Teil dieses Ordners. Interne Notification, interne Bündelung, Kundendigest, Mailvorlagen und die sichtbaren
  E-Mail-Schalter werden gemeinsam in Ordner 20c aktiviert.
- Chat-Schreiben, Lesestände, Zuständigkeiten, Posteingang und Zähler sind bis dahin vollständig nutzbar.

## Merge-Gate

**CRM**

- [ ] Mehrere interne Mitglieder haben unabhängige Lesestände.
- [ ] Chatverantwortung ist sichtbar, auf aktive berechtigte Mitglieder änderbar und als Activity protokolliert.
- [ ] `Conversations` ist in `OwnableEntity` und der Responsibility-Registry registriert.
- [ ] Cockpit-`ChatDock` zeigt den echten Verlauf; Mock-Kennzeichnung entfernt.
- [ ] Posteingang `/crm/nachrichten` und Sidebar-Zähler stimmen; ein Zählerfehler bricht die Seite nicht.
- [ ] Owner-Redaction ist im Verlauf gekennzeichnet und als Activity nachvollziehbar.
- [ ] Der Hinweis, dass der Kunde mitliest, ist im CRM unübersehbar — das ist kein Notizfeld.

**Portalgrenze (eigener Abschnitt im PR-Testplan)**

- [ ] Portal-Widget `messages` und `ChatDock` von Mock auf echten Thread umgestellt (Registry `mock: false` +
      `requiredPermission: portal.messages.read`); Schreiben nur mit `portal.messages.write`.
- [ ] Mehrere Kontakte derselben Firma haben unabhängige Lesestände.
- [ ] Widerrufenes Mitglied kann Verlauf und Deep-Link sofort nicht mehr laden.
- [ ] Kunde A sieht unter keinem Sitzungszustand die Unterhaltung von Kunde B (404).
- [ ] Ein Firmenwechsel lädt den Verlauf neu und zeigt keine Daten der vorherigen Firma.
- [ ] 31. Nachricht je Stunde ergibt 429 mit `Retry-After`.

**Beide Seiten**

- [ ] Fremder Kunde erhält bei Conversation und Message 404; fehlende Permission ebenso.
- [ ] Nachricht ist gegen XSS sicher und kann nicht geändert oder normal gelöscht werden.
- [ ] Nachrichten sind ohne aktivierte Benachrichtigungen vollständig les- und schreibbar.
- [ ] Empty-, Loading- und Fehlerzustände in DE/EN; Portalsprache aus `people.preferred_locale`.
- [ ] Mobile Tastatur, Fokus, Screenreader-Live-Region und lange Texte sind geprüft.
- [ ] `db:seed:crm` enthält realistische Beispielunterhaltungen.

## Rollback

`portal.messages.*` aus `portal_standard` und eigenen Portalrollen nehmen — der Kunde verliert den Zugang, der
interne Chat bleibt nutzbar. Chatmodule im CRM ausblenden. Vorhandene Nachrichten bleiben gespeichert; Portal,
Dateien und andere Systemmails funktionieren weiter.
