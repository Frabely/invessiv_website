# Ordner 02 — Kundenliste

> **Merge-Einheit 2 von 16** · **Aufwand:** ~1 Tag · **Review-Umfang:** geschätzt ~45 Dateien
> **Setzt voraus:** Ordner 01
> **Migrationen:** keine

## Ziel

Der erste sichtbare Teil des CRM: eine Route `/crm` mit einer Liste aller Kunden, Sortierung und
Pagination. Bewusst **read-only** — damit ist die Einheit klein, allein deploybar und liefert die
Struktur, in die alle Folgeordner hineinbauen.

## Tasks in Umsetzungsreihenfolge

| Task | Datei               | Aufwand | Inhalt                                               |
| ---- | ------------------- | ------- | ---------------------------------------------------- |
| 03   | `03-kundenliste.md` | M       | Route, Sidebar, Dictionaries, Query-Handler, Tabelle |

## Nach dem Merge live

Neuer Sidebar-Punkt „CRM" mit funktionierender, leerer Kundenliste. Kein toter Link — die Route
existiert und rendert einen bewusst gestalteten Empty-State, der erklärt, dass Kunden aus gewonnenen
Leads entstehen.

## Warum allein

Eine reine Leseoberfläche ist der billigste Weg, Route, Dictionaries und Tabellenstruktur einmal
sauber zu reviewen. Anlegen und Detail hängen sich danach ohne Umbau daran.

## Merge-Gate

- [ ] `/de/crm` und `/en/crm` sind für berechtigte Nutzer erreichbar, für andere `404`
- [ ] Ohne Kunden erscheint der Empty-State, kein Fehler, keine leere Seite
- [ ] Sortierung und Seitenwechsel verändern die URL und sind teilbar und neu ladbar
- [ ] Sortierung nach Nummer ordnet `K2` vor `K10` (numerisch, nicht alphabetisch)
- [ ] Ein Kunde mit gesetztem `deleted_at` erscheint weder in der Liste noch im Count
- [ ] Genau zwei Datenbankabfragen pro Seitenaufruf (Liste + Count)
- [ ] Seitenquelltext enthält `noindex`; genau eine H1
- [ ] Alle Texte in DE und EN im Dictionary, keiner im Code
- [ ] Mobil ab 360 px ohne horizontales Scrollen der Seite; Dark und Light korrekt
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Anlegen, Detail, Filter. Es gibt in dieser Oberfläche **keinen** Button dafür — der
„Kunde anlegen"-Button erscheint erst in Ordner 03 zusammen mit seinem Dialog.
