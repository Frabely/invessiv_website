# Ordner 18 — Kundenchat im Portal

> **Status:** offen · **Abhängigkeiten:** 17, 12, 15 · **Aufwand:** 2–3 Tage · **Reviewziel:** 50–80 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`26-chat-im-portal.md`](./26-chat-im-portal.md) — Portalchat, Kundendigest und Abmeldeschalter.

Der Kunde kann aus dem Portal heraus schreiben und den Verlauf lesen. Beide Seiten werden
benachrichtigt. Nach diesem Merge ist der Chat bidirektional vollständig nutzbar.

Diese Einheit ist die **Portalgrenze** des Chats und deshalb bewusst klein: sie enthält nichts außer
der Kundenseite, damit der Fremdzugriffs-Review nicht in einem großen PR untergeht.

## Portal und Benachrichtigung

- Portalbereich `/portal/[customerId]/nachrichten` mit Ungelesen-Kennzeichnung im Dashboard; Verlaufskomponente
  aus Task 25 wiederverwendet, nicht neu gebaut.
- Kundenkennung ausschließlich aus der validierten Sitzung; kein Endpunkt nimmt sie aus der Anfrage.
- Lesestand je Portalmitglied, nie firmenweit.
- Kundenmails höchstens eine je Mitgliedschaft und `PORTAL_DIGEST_WINDOW_HOURS` (12 Stunden), und
  nur bei `email_notifications_enabled` — gefiltert in der Abfrage, nicht erst beim Versand.
- Zusätzliche Bedingung: keine Kundenmail, wenn die Mitgliedschaft in den letzten 30 Minuten aktiv
  war (`last_seen_at`).
- Interne Mails bleiben beim 15-Minuten-Fenster aus Ordner 17.
- Die Mail nennt alle Ereignisse des Fensters („drei neue Nachrichten"), verweist aufs Portal und
  enthält höchstens eine kurze Textvorschau, keine Anhänge.
- Reply-To ist das Invessiv-Postfach; Antworten werden nicht importiert.
- Providerstatus, Versuche und permanenter Fehler bleiben sichtbar; kein Open- oder Clicktracking.
- Datenbankgestütztes Limit: 30 Nachrichten je Stunde und Portalmitglied.

## Merge-Gate

- [ ] Mehrere Kontakte derselben Firma haben unabhängige Lesestände.
- [ ] Widerrufenes Mitglied kann Verlauf und Deep-Link sofort nicht mehr laden.
- [ ] Kunde A sieht unter keinem Sitzungszustand die Unterhaltung von Kunde B (404).
- [ ] Ein Firmenwechsel lädt den Verlauf neu und zeigt keine Daten der vorherigen Firma.
- [ ] Digest-Deduplizierung hält ihr Fenster (intern 15 Minuten, Kunde 12 Stunden) auch bei
      parallelen Jobs ein.
- [ ] Eine Digest-Mail nennt alle Ereignisse des Fensters, nicht nur das erste.
- [ ] Eine abgeschaltete Kundenmitgliedschaft wird in der Abfrage ausgeschlossen.
- [ ] Es gibt auch im Portal keinen Bearbeiten- und keinen Löschweg für Nachrichten.
- [ ] Mobile Tastatur, Fokus, Screenreader-Live-Region und lange Texte sind geprüft.
- [ ] Alle Texte in DE und EN, Portalsprache aus `people.preferred_locale`.

## Rollback

Portalchat per Flag ausblenden und Kundendigestjobs stoppen. Der interne Chat aus Ordner 17 bleibt
vollständig nutzbar; vorhandene Nachrichten bleiben gespeichert.
