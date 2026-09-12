# Ordner 01 — Fundament

> **Merge-Einheit 1 von 16** · **Aufwand:** ~4 Tage · **Review-Umfang:** geschätzt ~90 Dateien
> **Setzt voraus:** nichts
> **Migrationen:** `0021_create_customers`, `0022_create_activities`, `0023_create_workspace_members`

## Ziel

Schema, Rechteschicht und geteilte Bausteine anlegen — **ohne eine einzige sichtbare Änderung**.
Alles Folgende setzt darauf auf, deshalb steht es allein und wird als Ganzes reviewt.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                                | Aufwand | Inhalt                                                       |
| ---- | ------------------------------------ | ------- | ------------------------------------------------------------ |
| 01   | `01-datenmodell-kunden.md`           | M       | `customers`, `customer_contacts`, Konstanten, DTOs, Mapper   |
| 01a  | `01a-aktivitaeten-tabelle.md`        | M       | Gemeinsame `activities`-Tabelle, `lead_activities` zieht um  |
| 02   | `02-rechtesystem.md`                 | M       | Rollen in der DB, Permissions im Code, `can()`               |
| 02a  | `02a-geteilte-listen-komponenten.md` | M       | Leads-Listen-Komponenten nach `components/workspace/shared/` |

## Nach dem Merge live

**Nichts.** Keine Route, kein Menüpunkt, keine geänderte Oberfläche. Die Anwendung verhält sich für
dich exakt wie vorher.

## Warum diese Tasks zusammen

Alle vier sind unsichtbar und teilen dasselbe Review-Kriterium: _die App verhält sich identisch_.
Zwei davon (01a, 02a) fassen bestehenden Code an — genau deshalb stehen sie hier am Anfang und nicht
verteilt: Danach wird nichts mehr doppelt gebaut, und der Refactoring-Durchlauf über sechs Handler,
den der ursprüngliche Plan für Task 29 vorsah, entfällt.

Einzeln zu mergen wäre möglich, bringt aber nichts: keiner der vier hat für sich einen Nutzen, und
Ordner 02 braucht alle vier.

## Merge-Gate

- [ ] `pnpm db:migrate:dev` läuft, zweiter Lauf ist folgenlos, `pnpm db:smoke:dev` grün
- [ ] **Alle bestehenden Tests inhaltlich unverändert und grün** — angepasst sind nur Importpfade
- [ ] Die Dashboard-Funnel-Kennzahlen liefern vor und nach dem Deploy dieselben Werte
- [ ] Die Leads-Liste sortiert, blättert, filtert, sucht und wählt aus wie vorher (Screenshot im PR)
- [ ] Die Lead-Detailansicht zeigt dieselbe Timeline
- [ ] Kein Codepfad verweist mehr auf `leadActivities` oder die alten Komponentenpfade
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Alles. Abgesichert dadurch, dass es keinen Einstiegspunkt gibt — der Sidebar-Eintrag kommt erst mit
Ordner 02. `lead_activities` bleibt stehen und wird erst entfernt, wenn ein Deploy-Zyklus ohne
Auffälligkeiten gelaufen ist.
