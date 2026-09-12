# Ordner 05 — Kontakte, Status und Tags

> **Merge-Einheit 5 von 16** · **Aufwand:** ~1,5 Tage · **Review-Umfang:** geschätzt ~65 Dateien
> **Setzt voraus:** Ordner 01, 02, 03
> **Migrationen:** `0025_create_customer_tags`

## Ziel

Ordnung in der Akte: mehrere Ansprechpartner je Kunde, direkt umschaltbarer Status und frei
vergebbare Tags. Damit entstehen die Daten, die Ordner 15 später filterbar macht — und der
Ansprechpartner, an den Ordner 08 die Portal-Einladung bindet.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                   | Aufwand | Inhalt                                                  |
| ---- | ----------------------- | ------- | ------------------------------------------------------- |
| 06   | `06-ansprechpartner.md` | S       | Kontakte-Sektion mit vollem CRUD, Primärkontakt-Wechsel |
| 07   | `07-status-und-tags.md` | M       | Statusbadge und -wechsel, Tag-Tabelle, Tag-Eingabe      |

## Nach dem Merge live

Zwei neue Sektionen im Kundendetail (Ansprechpartner, Tags), Statusbadge in Liste und Detail,
Statuswechsel direkt im Detail, Tag-Spalte in der Liste.

## Warum diese Tasks zusammen

Beide füllen Slots im Panel aus Ordner 03, beide sind reine Ergänzungen ohne Änderung an bestehenden
Handlern, und beide sind zu klein für einen eigenen Merge. Zusammen ergeben sie „die Akte ist
vollständig gepflegt".

## Merge-Gate

- [ ] Mehrere Ansprechpartner pro Kunde anlegen, bearbeiten, löschen
- [ ] Genau einer ist primär; zwei aufeinanderfolgende Wechsel hinterlassen genau einen Primärkontakt
- [ ] Löschen des Primärkontakts befördert **keinen** anderen automatisch
- [ ] Ein Kunde ohne Kontakte zeigt den leeren Zustand, nicht einen Fehler
- [ ] Der Status lässt sich im Detail in einem Schritt ändern; genau ein Activity-Eintrag pro Wechsel
- [ ] Gleicher Status erzeugt keinen Eintrag; fehlgeschlagenes Speichern stellt den alten Wert her
- [ ] Dasselbe Tag in anderer Schreibweise erzeugt keinen zweiten Eintrag
- [ ] Doppelte Tag-Zuweisung ist folgenlos, kein Fehler
- [ ] Tag-Eingabe vollständig per Tastatur bedienbar, aktiver Vorschlag über `aria-activedescendant`
- [ ] Badges in Dark und Light kontrastsicher; lange Tag-Labels brechen das Layout nicht
- [ ] Alle Texte in DE und EN
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Filtern nach Status, Kategorie und Tags (Ordner 15). Bis dahin sind alle Achsen sicht- und pflegbar,
aber nicht als Filter nutzbar — es gibt kein Bedienelement, das ins Leere führt.
