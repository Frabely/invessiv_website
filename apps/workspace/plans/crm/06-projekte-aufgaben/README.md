# Ordner 06 — Projekte und Aufgaben

> **Merge-Einheit 6 von 16** · **Aufwand:** ~4 Tage · **Review-Umfang:** geschätzt ~120 Dateien
> **Setzt voraus:** Ordner 01, 02, 03
> **Migrationen:** `0026_create_projects`, `0027_create_tasks`

## Ziel

Die zweite Säule neben der Kundenakte: Projekte mit Phasen, Budget und nächstem Schritt, dazu
Aufgaben — und die Ansicht, die täglich benutzt wird: „was ist diese Woche fällig".

Dieser Ordner ist Voraussetzung für das Portal-Dashboard (Ordner 08), das genau diese Daten anzeigt.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                         | Aufwand | Inhalt                                                    |
| ---- | ----------------------------- | ------- | --------------------------------------------------------- |
| 09   | `09-projekte-datenmodell.md`  | S       | `projects`, Phasen-Sequenz, Fortschritts-Funktion, Mapper |
| 10   | `10-projekte-ui.md`           | M       | Phasenleiste in `packages/ui`, Projektkarte, CRUD         |
| 11   | `11-aufgaben.md`              | M       | `tasks` mit Verantwortung und Sichtbarkeit, Sektion       |
| 11a  | `11a-aufgabenuebersicht.md`   | M       | Route über alle Kunden, Dashboard-Block, Sidebar-Zähler   |
| 12   | `12-onboarding-checkliste.md` | S       | Aufgaben-Vorlagen als Code-Konstante, Anwenden-Menü       |

## Nach dem Merge live

Projekte-Sektion im Kundendetail mit Phasenleiste, Aufgaben-Sektion an Kunde und Projekt, neuer
Sidebar-Punkt „Aufgaben" mit Zähler überfälliger Aufgaben, Block „Fällig diese Woche" im Dashboard,
Menü „Vorlage anwenden".

## Warum diese Tasks zusammen

Task 09 ist reines Schema ohne Nutzen, 10 braucht es, 11 braucht 10, 11a und 12 brauchen 11. Die
Kette einzeln zu mergen ergäbe vier Merges, von denen zwei nichts Sichtbares liefern. Zusammen ist
es eine geschlossene Aussage: _Projekte und Aufgaben sind benutzbar, inklusive Tagesplanung._

Mit ~120 Dateien ist das der zweitgrößte Ordner — bewusst in Kauf genommen, weil das Aufsplitten nur
Merges ohne Wert erzeugen würde.

## Merge-Gate

- [ ] Mehrere Projekte je Kunde anlegen, bearbeiten, löschen; gelöschte erscheinen nicht mehr
- [ ] Phasenleiste zeigt den Fortschritt, Rückwärtsgehen fragt nach, Vorwärtsgehen nicht
- [ ] Phasenleiste ohne Farbwahrnehmung und per Tastatur nutzbar; Test deckt sechs **und** drei Phasen ab
- [ ] Überfälliger nächster Schritt wird hervorgehoben (Symbol plus Text)
- [ ] `scope: "customer"` liefert nachweislich nur sichtbare Aufgaben — unter keinen Umständen interne
- [ ] Verantwortung und Sichtbarkeit sind getrennt einstellbar und klar beschriftet
- [ ] Schnelleingabe per Enter funktioniert; Abhaken aktualisiert ohne vollständiges Neuladen
- [ ] `/crm/aufgaben` zeigt alle offenen Aufgaben über alle Kunden, überfällige zuerst
- [ ] Abhaken direkt aus der Übersicht wirkt und ist im Kundendetail sichtbar
- [ ] Sidebar-Zähler verschwindet, wenn nichts überfällig ist; ein Abfragefehler bricht die Seite nicht
- [ ] Aufgaben gelöschter Kunden und Projekte erscheinen nirgends
- [ ] Vorlage zweimal anwenden erzeugt keine Dubletten; Titel erscheinen dem Kunden in seiner Sprache
- [ ] Der partielle Index wird vom Abfrageplan der Dashboard-Abfrage genutzt (`EXPLAIN`)
- [ ] Alle Texte in DE und EN; Dark, Light und Mobil geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Die Kundensicht auf Phasen und Aufgaben (Ordner 08). Weil die Sichtbarkeitsfilterung im
Query-Handler sitzt und dort getestet ist, kann das Portal sie später nicht versehentlich umgehen.
Dateien am Projekt folgen in Ordner 09 — ihre Slots werden noch nicht gerendert.
