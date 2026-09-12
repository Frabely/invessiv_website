# Ordner 03 — Kundenakte

> **Merge-Einheit 3 von 16** · **Aufwand:** ~2 Tage · **Review-Umfang:** geschätzt ~55 Dateien
> **Setzt voraus:** Ordner 01, 02
> **Migrationen:** keine

## Ziel

Aus der Leseliste wird eine benutzbare Akte: Kunden anlegen, bearbeiten, im Detailpanel ansehen und
löschen. Ab hier ist das CRM tatsächlich verwendbar, auch wenn Kunden noch von Hand entstehen.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                            | Aufwand | Inhalt                                                        |
| ---- | -------------------------------- | ------- | ------------------------------------------------------------- |
| 04   | `04-kunde-anlegen-bearbeiten.md` | M       | Dialog, Route Handler, Command-Handler, Duplikat-Warnung      |
| 05   | `05-kundendetail-panel.md`       | M       | Detailpanel mit Slots, Stammdaten, Soft-Delete, Purge-Routine |

## Nach dem Merge live

Anlegen- und Bearbeiten-Button in der Liste, Klick auf eine Zeile öffnet das Detailpanel mit
Stammdaten. Löschen entfernt den Kunden aus Liste und Detail, behält die Daten aber; endgültiges
Löschen ist ein zweiter, bewusster Schritt und räumt dabei die Storage-Objekte mit ab.

## Warum diese Tasks zusammen

Das Detailpanel ohne Bearbeiten-Dialog wäre eine Sackgasse, der Dialog ohne Detail hätte keinen
zweiten Aufrufer. Zusammen ergeben sie die vollständige Stammdatenpflege — und das Panel legt die
benannten Slots an, in die jeder Folgeordner genau eine Sektion einhängt.

## Merge-Gate

- [ ] Ein Kunde lässt sich mit nur einem Namen anlegen und bekommt automatisch eine Nummer
- [ ] Derselbe Name ein zweites Mal zeigt einen Hinweis auf den bestehenden Kunden — und lässt sich
      trotzdem anlegen
- [ ] Ein Privatkunde lässt sich ohne Firmenname anlegen
- [ ] Neuladen der Detail-URL zeigt dieselbe Ansicht; ein unbekannter `selected`-Wert wirft nicht
- [ ] Löschen verlangt die Eingabe des Kundennamens; die Zeilen bleiben in der Datenbank
- [ ] Endgültiges Löschen geht nur bei archivierten, zuvor gelöschten Kunden, entfernt die
      Storage-Objekte und lässt Lead und Lead-Historie unversehrt
- [ ] Alle Fehlerzustände sichtbar; Tastaturbedienung vollständig, Fokus kehrt auf den Auslöser zurück
- [ ] Alle Texte in DE und EN; Dark, Light und Mobil geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Alle weiteren Sektionen des Panels. Abgesichert dadurch, dass nicht vorhandene Sektionen gar nicht
erst erscheinen — es gibt keinen Verweis auf noch nicht gebaute Funktionen.
