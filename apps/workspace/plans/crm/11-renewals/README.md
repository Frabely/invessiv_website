# Ordner 11 — Renewals

> **Status:** offen · **Abhängigkeiten:** 05, 10 · **Aufwand:** 2–3 Tage · **Reviewziel:** 40–70 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`28-renewal-tracking.md`](./28-renewal-tracking.md) — Modell, CRUD, Bearbeiter und
  30/14/7-/Überfällig-Erinnerungen.

Laufzeiten für Domain, Hosting, SSL, Lizenz und frei bezeichnete sonstige Positionen werden intern
verwaltet und zuverlässig in der Glocke erinnert. Das Feature ist nach Merge ohne E-Mail-Erinnerung
vollständig nutzbar.

## Regeln

- Additive Renewal-Migration, Drizzle-Modell und gemeinsame Contracts entstehen in diesem Ordner.
- Pflicht: Kunde, Typ, Bezeichnung bei `other`, Ablaufdatum, Bearbeiter, Reminderstatus und `version`.
- Bearbeiter übernimmt den Kunden-Owner und kann danach geändert werden.
- Erinnerungen bei 30, 14 und 7 Tagen sowie einmal bei Überfälligkeit; Deduplizierung pro Eintrag,
  Stufe und Datum.
- „Verlängert“ verschiebt das Datum bewusst, setzt Reminderstufen zurück und protokolliert Alt/Neu.
- Kein automatisches Verlängern und keine normale Reminder-Mail.
- Kunden-Owner-Wechsel übernimmt offene Renewals atomar.

## Merge-Gate

- [ ] `Renewals` ist in `OwnableEntity` registriert und hat einen Adapter in der Ownership-Registry (Ordner 03);
      Übergabe und Deaktivierungszählung erfassen die Entität, mit Test.
- [ ] Reminder entstehen bei wiederholtem Cronlauf nur einmal.
- [ ] Änderung des Ablaufdatums berechnet alle Stufen korrekt neu.
- [ ] `other` ohne Bezeichnung wird abgelehnt.
- [ ] Archivierte Kunden erzeugen keine neuen Reminder, bleiben aber intern prüfbar.
- [ ] Liste, Dashboard-Widget und Kundensektion besitzen Empty- und Fehlerzustände.

## Rollback

Renewal-Navigation und Jobtyp deaktivieren. Vorhandene Daten bleiben erhalten; der generische Runner
arbeitet mit anderen Jobtypen weiter.
