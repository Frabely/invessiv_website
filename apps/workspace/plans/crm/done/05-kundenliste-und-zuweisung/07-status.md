# Task 07 — Kundenstatus

> **Merge-Einheit:** Ordner 05 · **Branch:** `feat/crm-kundenliste-status`
> **Aufwand:** S · **Abhängigkeiten:** Task 03 (Kundenliste)
> **Migration:** keine

## Ziel

Der bestehende Kundenstatus `active | paused | archived` ist in der Liste als nicht interaktives Badge
sichtbar. Geändert wird er bewusst nur in den Stammdaten des Kunden über das bestehende Kundenformular.
Status, übrige Stammdaten und Ansprechpartner werden dadurch gemeinsam versioniert und atomar gespeichert.

Tags wurden aus diesem Task gelöst und nach Ordner 22a verschoben.

## Akzeptanz

- [x] Statusbadge und Formularauswahl verwenden dieselben DE-/EN-Bezeichnungen.
- [x] Die Tabelle zeigt den Status als Badge, bietet dort aber keine Änderung an.
- [x] Das Kundenformular verwendet für den Status `FormField` mit `CustomSelect`.
- [x] Der bestehende Kunden-Endpunkt verlangt `customers.write` und eine positive Version.
- [x] Veraltete Writes liefern den aktuellen Stand als Versionskonflikt.
- [x] Ein tatsächlicher Wechsel erzeugt eine `status_change`-Activity mit altem und neuem Status.
- [x] Derselbe Status erzeugt keine Activity.
- [x] Status und Ansprechpartner werden erst beim Speichern des gesamten Kundenformulars übernommen.
- [x] Archivierte Kunden sind standardmäßig ausgeblendet und über „Archivierte einblenden“ zuschaltbar.
- [x] Es gibt weder einen separaten Status-Endpunkt noch eine Bulk-Statusänderung.
