# Ordner 06 — Lead-Konvertierung

> **Status:** offen · **Abhängigkeiten:** 02, 04 · **Aufwand:** 2–3 Tage · **Reviewziel:** 40–70 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`08-lead-zu-kunde.md`](./08-lead-zu-kunde.md) — idempotente Konvertierung, Kontaktwahl,
  bestehender Kunde und Leadfilter.

Ein gewonnener Lead kann genau einmal zu einem neuen Kunden konvertiert oder einem bestehenden
Kunden zugeordnet werden. Lead-Historie und CRM-Historie bleiben durchgängig und die Leadliste
bleibt vollständig nutzbar.

## Regeln

- `leads.customer_id` ist der einzige Konvertierungsmarker; `lead_status` erhält keinen neuen Wert.
- Dialog verlangt beim neuen Kunden die erneute Eingabe beziehungsweise Bestätigung des
  Primärkontakts. Leadwerte sind Vorschläge, keine ungeprüfte Übernahme.
- Weitere Leadkontakte sind einzeln auswählbar und werden als globale Personen verknüpft oder neu
  angelegt, nicht kopiert.
- Beim bestehenden Kunden bleiben Stammdaten und Primärkontakt unverändert; nur fehlende Kontakte
  werden angeboten.
- Conversion-Command ist idempotent. Wiederholung liefert den bereits verknüpften Kunden und
  erzeugt weder zweite Nummer noch doppelte Kontakte.
- Nicht auf `won` stehender Lead wird in derselben Transaktion auf `won` gesetzt.

## Merge-Gate

- [ ] Neuer Kunde erfüllt dieselben Invarianten wie direkte Anlage, einschließlich Primärkontakt.
- [ ] Zuordnung zu bestehendem Kunden überschreibt keine Felder.
- [ ] Activity-Verlauf zeigt Lead- und Kundenereignisse ohne Doppelung.
- [ ] Konvertierte Leads sind standardmäßig ausgeblendet und explizit einblendbar.
- [ ] Zwei parallele Requests erzeugen genau einen Kunden.
- [ ] Vorherige Leadfilter und alle Lead-CRUD-Tests bleiben grün.

## Rollback

Konvertierungsaktion ausblenden. Bereits gesetzte `customer_id`-Verknüpfungen bleiben gültig und
werden nicht zurückgeschrieben.
