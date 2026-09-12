# Ordner 17 — Kundenchat

> **Status:** offen · **Abhängigkeiten:** 10, 12, 15 · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–130 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`24-nachrichten-datenmodell.md`](./24-nachrichten-datenmodell.md) — unveränderliche Nachrichten,
  Dateiverweise und Lesestände je Mitglied.
- [`25-chat-im-crm.md`](./25-chat-im-crm.md) — interner Chat und Sammelbereich.
- [`26-chat-im-portal.md`](./26-chat-im-portal.md) — Portalchat und Mail-Digest.

Pro Kunde existiert ein gemeinsamer, bidirektionaler Chat für alle aktiven Firmenkontakte und
interne Mitglieder. Lesestände, Ungelesen-Zähler, Dateiverweise und gebündelte E-Mail-Hinweise sind
vollständig nutzbar. Echtzeitinfrastruktur ist nicht erforderlich.

## Daten und Verhalten

- Additive Migrationen und Modelle für `conversations`, `messages`, `conversation_reads` und
  `message_files` entstehen in diesem Ordner.
- Genau eine Conversation pro Kunde; `project_id` wird nicht vorsorglich angelegt.
- Nachrichten speichern Actor-Typ/-ID, Plaintext, Zeitpunkt und optionale Ausblendung durch Owner.
- Nachrichten sind nach Senden unveränderlich; Korrekturen erfolgen als neue Nachricht.
- Owner-Ausblendung bewahrt Auditmetadaten, zeigt Inhalt aber keinem normalen Nutzer mehr.
- `conversation_reads` je Portalmitglied und je internem Mitglied; nie ein globales
  `customer_read_at`.
- Anhänge sind nur Links auf bereits vorhandene, portalöffentliche Dateien. Mutation prüft die
  Sichtbarkeit erneut; Entzug einer Dateifreigabe entfernt den späteren Downloadzugriff.
- Laden beim Öffnen und Aktualisieren nach Senden. Kein Dauerpolling; manueller Refresh und
  Seitenfokus laden neu.

## Mail-Digest

- Neue interne Nachricht erzeugt Outboxereignis pro betroffenem Portalmitglied.
- Höchstens eine Mail je Empfänger/Kunde/15-Minuten-Fenster; Mail verweist auf Portal und enthält
  höchstens eine kurze textliche Vorschau ohne Anhänge.
- Reply-To ist das Invessiv-Postfach; Antworten werden nicht importiert.
- Providerstatus, Versuche und permanenter Fehler bleiben sichtbar; kein Open-/Clicktracking.

## Merge-Gate

- [ ] Mehrere Kontakte derselben Firma haben unabhängige Lesestände.
- [ ] Widerrufenes Mitglied kann Verlauf oder Deep-Link sofort nicht mehr laden.
- [ ] Fremder Kunde erhält bei Conversation, Message und Datei 404.
- [ ] Nachricht ist gegen XSS sicher und kann nicht geändert/normal gelöscht werden.
- [ ] Digest-Deduplizierung hält 15 Minuten auch bei parallelen Jobs ein.
- [ ] Mobile Tastatur, Fokus, Screenreader-Live-Region und lange Texte sind geprüft.

## Rollback

Chatmodule deaktivieren und neue Digestjobs stoppen. Vorhandene Nachrichten bleiben gespeichert;
Portal, Dateien und andere Systemmails funktionieren weiter.
