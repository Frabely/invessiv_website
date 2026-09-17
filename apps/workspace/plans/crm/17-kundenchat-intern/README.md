# Ordner 17 — Kundenchat, Datenmodell und interne Seite

> **Status:** offen · **Abhängigkeiten:** 10, 12 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–90 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`24-nachrichten-datenmodell.md`](./24-nachrichten-datenmodell.md) — unveränderliche Nachrichten,
  Dateiverweise und Lesestände je Mitglied.
- [`25-chat-im-crm.md`](./25-chat-im-crm.md) — interner Chat und Sammelbereich.

Pro Kunde existiert ein gemeinsamer Chat. Intern ist er nach diesem Merge vollständig nutzbar:
schreiben, lesen, Lesestände, Ungelesen-Zähler, Sammelbereich und Dateiverweise. Die Kundenseite
folgt in Ordner 18 — bis dahin ist der Chat ein intern sichtbarer Verlauf ohne Portalzugang.

Das ist bewusst so geschnitten: die Portalgrenze ist der sicherheitskritische Teil und bekommt
dadurch ihren eigenen, konzentrierten Review statt im großen PR mitzulaufen.

## Daten und Verhalten

- Additive Migrationen und Modelle für `conversations`, `messages`, `conversation_reads` und
  `message_files` entstehen in diesem Ordner.
- Genau eine kundenweite Conversation pro Kunde. `conversations.project_id` ist nullable vorhanden (Task 24);
  projektbezogene Unterhaltungen docken später ohne Migration an. Die frühere Aussage „`project_id` wird nicht
  vorsorglich angelegt“ ist damit ersetzt (Klärung 14.09.2026).
- Jede Conversation hat einen internen Verantwortlichen, initial den bei der Kundenanlage vorhandenen technischen
  Kunden-Owner. Er kann unabhängig geändert werden; Zuständigkeit gewährt keinen Zugriff und ersetzt weder
  `chat.read` noch `chat.write`. Ein späterer Customer-Owner-Wechsel in Ordner 20a verändert ihn nicht.
- Chat-Permissions (`chat.read`, `chat.write`) entstehen hier als bindbar (`scopable`). Die kundenweite Conversation
  verlangt das Recht am Kunden oder workspace-weit; eine Projektbindung allein öffnet sie nicht.
- Nachrichten speichern Actor-Typ/-ID, Plaintext, Zeitpunkt und optionale Ausblendung durch Owner.
- Nachrichten sind nach Senden unveränderlich; Korrekturen erfolgen als neue Nachricht. Es gibt
  keinen Bearbeiten- und keinen normalen Löschweg.
- Owner-Ausblendung bewahrt Auditmetadaten, zeigt Inhalt aber keinem normalen Nutzer mehr.
- `conversation_reads` je Portalmitglied und je internem Mitglied; nie ein globales
  `customer_read_at`.
- Anhänge sind nur Links auf bereits vorhandene, portalöffentliche Dateien. Mutation prüft die
  Sichtbarkeit erneut; Entzug einer Dateifreigabe entfernt den späteren Downloadzugriff.
- Laden beim Öffnen und Aktualisieren nach Senden. Kein Dauerpolling; manueller Refresh und
  Seitenfokus laden neu.
- `conversations.internal_notified_at` als Anker der internen Bündelung entsteht hier.

## Interne Benachrichtigung

- Eine Kundennachricht existiert in diesem Ordner noch nicht — benachrichtigt wird deshalb nur bei
  Zuweisung und internem Schreiben.
- Notification sofort, Mail höchstens eine je Empfänger/Kunde/15-Minuten-Fenster über die Outbox
  aus Ordner 10.
- Der Kundendigest und der Abmeldeschalter gehören zu Ordner 18.

## Merge-Gate

- [ ] Mehrere interne Mitglieder haben unabhängige Lesestände.
- [ ] Chatverantwortung ist sichtbar, auf aktive berechtigte Mitglieder änderbar und als Activity protokolliert.
- [ ] `Conversations` ist in `OwnableEntity` und der Responsibility-Registry registriert.
- [ ] Fremder Kunde erhält bei Conversation, Message und Datei 404.
- [ ] Nachricht ist gegen XSS sicher und kann nicht geändert oder normal gelöscht werden.
- [ ] Ein Dateiverweis auf eine nicht portalöffentliche Datei wird abgelehnt.
- [ ] Owner-Redaction ist im Verlauf gekennzeichnet und als Activity nachvollziehbar.
- [ ] Der Hinweis, dass der Kunde mitliest, ist im CRM unübersehbar — das ist kein Notizfeld.
- [ ] Kein Portalpfad zeigt auf den Chat; die Kundenseite ist noch nicht verlinkt.
- [ ] Empty-, Loading- und Fehlerzustände in DE/EN; A11y-Smoke für Verlauf und Eingabe.

## Rollback

Chatmodule im CRM ausblenden und interne Digestjobs stoppen. Vorhandene Nachrichten bleiben
gespeichert; Portal, Dateien und andere Systemmails funktionieren weiter.
