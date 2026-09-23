# Ordner 18 — Kundenchat im Portal

> **Status:** offen · **Abhängigkeiten:** 17, 12, 15 · **Aufwand:** 2–3 Tage · **Reviewziel:** 50–80 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`26-chat-im-portal.md`](./26-chat-im-portal.md) — Portalchat und Abmeldeschalter; Kundendigest folgt in Ordner 20c.

Der Kunde kann aus dem Portal heraus schreiben und den Verlauf lesen. Nach diesem Merge ist der Chat
bidirektional vollständig nutzbar; Benachrichtigungen und Digests werden in Ordner 20c aktiviert.

Diese Einheit ist die **Portalgrenze** des Chats und deshalb bewusst klein: sie enthält nichts außer
der Kundenseite, damit der Fremdzugriffs-Review nicht in einem großen PR untergeht.

## Portal und Benachrichtigung

- Portalbereich `/portal/[customerId]/nachrichten` mit Ungelesen-Kennzeichnung im Dashboard; Verlaufskomponente
  aus Task 25 wiederverwendet, nicht neu gebaut.
- Kundenkennung ausschließlich aus der validierten Sitzung; kein Endpunkt nimmt sie aus der Anfrage.
- Lesestand je Portalmitglied, nie firmenweit.
- Die für Digests erforderlichen Präferenzen und Lesestände werden bereits gespeichert. Versand, Deduplizierung,
  Providerstatus und interne Hinweise werden gemeinsam in Ordner 20c aktiviert.
- Datenbankgestütztes Limit: 30 Nachrichten je Stunde und Portalmitglied.

## Merge-Gate

- [ ] Mehrere Kontakte derselben Firma haben unabhängige Lesestände.
- [ ] Widerrufenes Mitglied kann Verlauf und Deep-Link sofort nicht mehr laden.
- [ ] Kunde A sieht unter keinem Sitzungszustand die Unterhaltung von Kunde B (404).
- [ ] Ein Firmenwechsel lädt den Verlauf neu und zeigt keine Daten der vorherigen Firma.
- [ ] Nachrichten bleiben auch ohne aktivierte Benachrichtigungen vollständig les- und schreibbar.
- [ ] Es gibt auch im Portal keinen Bearbeiten- und keinen Löschweg für Nachrichten.
- [ ] Mobile Tastatur, Fokus, Screenreader-Live-Region und lange Texte sind geprüft.
- [ ] Alle Texte in DE und EN, Portalsprache aus `people.preferred_locale`.

## Rollback

Portalchat per Flag ausblenden; die späteren Kundendigestjobs stoppen. Der interne Chat aus Ordner 17 bleibt
vollständig nutzbar; vorhandene Nachrichten bleiben gespeichert.
