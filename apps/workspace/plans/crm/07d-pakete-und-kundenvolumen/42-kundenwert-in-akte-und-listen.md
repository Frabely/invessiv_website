# Task 42 — Kundenwert in Akte, Liste und Projektkarte

> **Merge-Einheit:** Ordner 07d · **Branch:** `feat/crm-pakete-und-kundenvolumen`
> **Aufwand:** M · **Abhängigkeiten:** Task 41, Task 05 (Detail-Panel), Task 03 (Kundenliste), Task 10 (Projekt-UI)
> **Migration:** keine

- Eigener Tab „Pakete" in der Kundenakte mit einmaligen und laufenden Positionen, getrennt gruppiert.
- Buchen-Dialog schlägt Katalogpakete zum Konditionsanker vor, an- und abwählbar, danach editierbar.
- Kundenwert und Projektwert erscheinen in Liste und Projektkarte aus **einer** Berechnungsquelle.
- Ohne `packages.read` liefert der Server weder Tab noch Spalten; nichts wird nur clientseitig versteckt.
- Wertspalte ist sortierbar über URL-State, nicht über React-State.

## Context

Die Daten aus Task 40 und 41 werden hier sichtbar. Zwei Fragen sollen ohne Klickpfad beantwortet
sein: „Was hat dieser Kunde gebucht?" in der Akte und „Welche Kunden tragen den Umsatz?" in der Liste.

Die Kundenliste existiert seit Task 03, das Detail-Panel seit Task 05, die Projektkarte seit Task 10.
Dieser Task ergänzt sie additiv und baut nichts davon um.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Ort                 | Eigener Tab in der Kundenakte, nicht eine weitere Sektion im Fließtext des Panels                                                     |
| Warum               | Die Akte hat bereits Stammdaten, Kontakte, Timeline und später Dateien. Beträge brauchen eine eigene Fläche mit eigener Kopfzeile     |
| Gruppierung         | Drei Blöcke: „Laufend" (wiederkehrend, nach Betrag absteigend), „Einmalig" (nach Startdatum absteigend), „Konditionen" (Stundensatz)  |
| Mengenanzeige       | `3 × 300,00 € = 900,00 €` in der Zeile; die Stückzahl steht nie nur im Titel                                                          |
| Konditionsblock     | Der Stundensatz erscheint mit „gültig seit"; er ist aus allen Summen ausgenommen und im UI entsprechend beschriftet                   |
| Beendete Positionen | Standardmäßig eingeklappt unter „Beendet (3)", nicht ausgeblendet                                                                     |
| Kopfzahlen          | Vier Kennzahlen: monatlich wiederkehrend, jährlich wiederkehrend, einmalig gesamt, offene Pipeline                                    |
| Was ansteht         | Block über den Gruppen: „2 Anfragen · 1 Angebot seit 18 Tagen · 3 beauftragt, nicht berechnet", jede Zeile filtert die Liste          |
| Warum oben          | Das ist die eigentliche Frage beim Öffnen der Akte. Eine Statusspalte allein beantwortet sie erst nach dem Durchlesen                 |
| Standanzeige        | Badge je Zeile über die bestehende `lead-badge`-Basis; `invoiced` und `paid` sichtbar als „(laut Lexware manuell gepflegt)"           |
| Stand ändern        | Direkt aus der Zeile über ein Auswahlfeld, ohne den Bearbeiten-Dialog — wie der Kundenstatus in Task 07                               |
| Filter              | Standfilter über URL-State (`stage=requested,offered`), zusätzlich zur bestehenden Sortierung                                         |
| Buchen-Dialog       | Schritt 1 Paket wählen (Katalogliste mit Preis zum Anker), Schritt 2 Menge, Stand, Inhalt und Preis anpassen                          |
| Mengenfeld          | Nur bei Paketen mit `quantifiable = true`; sonst ist das Feld nicht vorhanden, nicht nur deaktiviert                                  |
| Preisstandhinweis   | Immer sichtbar, welcher Stand gilt — „aktueller Preisstand" oder „Konditionen seit 14.03.2026" — mit Schalter in beide Richtungen     |
| Nachbuchen          | Dieselbe Paketart erneut buchen ist ausdrücklich erlaubt und erzeugt eine zweite Position — keine Dublettenwarnung                    |
| Warum               | „2 Sektionen im März, 3 weitere im Oktober zum neuen Preis" ist der Normalfall, kein Versehen                                         |
| Warum sichtbar      | Ein still vorbelegter Preis ist die häufigste Fehlerquelle beim Nachbuchen. Der Hinweis macht die Entscheidung bewusst                |
| Leistungspunkte     | Als Liste im Dialog editierbar: Zeile ergänzen, ändern, entfernen, sortieren                                                          |
| Projektzuordnung    | Optionales Auswahlfeld mit den Projekten **dieses** Kunden; leer bedeutet kundenweit                                                  |
| Preis ändern        | Eigener Menüpunkt „Preis ändern ab …" statt Feldbearbeitung; Bearbeiten ändert nur Bezeichnung, Inhalt, Notiz und Angebotsnummer      |
| Warum getrennt      | Sonst überschreibt ein versehentliches Speichern die Historie. Die beiden Absichten sehen im UI unterschiedlich aus, weil sie es sind |
| Kundenliste         | Zwei zusätzliche Spalten „laufend/Monat" und „gesamt einmalig", ab Tablet sichtbar, auf Mobil in der Zeile zusammengefasst            |
| Sortierung          | Über bestehenden URL-State der Liste (`sort=monthly_recurring`), keine neue Mechanik                                                  |
| Performance         | Werte kommen als Aggregat aus **einer** Abfrage je Seite, nicht als N+1 je Zeile                                                      |
| Projektkarte        | Zeigt den Projektwert aus denselben Positionen mit `project_id`; ohne Positionen bleibt der Block weg                                 |
| Budget am Projekt   | `projects.budget_cents` bleibt unverändert als Planwert. Der Projektwert daneben ist das **Gebuchte**; beide Zahlen sind beschriftet  |
| Rechtefall          | Ohne `packages.read` liefert der Query-Handler die Werte nicht; die Spalten existieren in der Antwort nicht                           |
| Portal              | Kein Portalpfad in dieser Einheit — auch nicht lesend                                                                                 |

## Architektur

```txt
getCustomerPackagesTab(actor, customerId)        packages.read + accessScope
  ├─ Positionen mit Items
  ├─ Kennzahlen ueber calculateEngagementValue(..., heute)
  └─ Historienkette ueber replaces_package_id aufgeloest

listCustomers(...)  (Task 03, erweitert)
  └─ LEFT JOIN LATERAL Aggregat je Kunde, nur wenn actor packages.read hat
     → CustomerSummaryDto.value?: EngagementValue
```

`EngagementValue` ist optional im DTO: fehlt das Recht, fehlt das Feld. Die Tabelle rendert die
Spalten dann nicht — es gibt keinen clientseitigen Sichtbarkeitsschalter für Beträge.

## Verzeichnisstruktur

```txt
apps/workspace/src/components/workspace/crm/packages/
  customer-packages-tab/
  package-value-summary/
  package-open-items/             "Was ansteht", filtert die Liste
  package-group-list/
  package-row/
  package-stage-badge/
  package-stage-select/
  package-form-dialog/            buchen und bearbeiten in einer Komponente
  package-catalog-picker/
  package-replace-dialog/
  package-history-chain/
apps/workspace/src/components/workspace/crm/customers/table/
  customer-value-cell/            neue Spalten
apps/workspace/src/components/workspace/crm/projects/project-card/
  project-value-block/
apps/workspace/src/common/constants/crm/packages/package-tab-query-params.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/packages/{de,en}.json   (erweitert)
```

## Tickets

### CRM-42-T1 — Tab, Kennzahlen und Listen

- **Files:** `customer-packages-tab`, `package-value-summary`, `package-open-items`,
  `package-group-list`, `package-row`, `package-stage-badge`, `package-stage-select`,
  Query-Handler, Dictionary, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Tabfläche mit vier Kennzahlen, „Was ansteht"-Block, drei Gruppen, Standbadge und
  Standwechsel aus der Zeile; beendete Positionen einklappbar
- **Akzeptanz:**
  - Empty-State erklärt, wofür der Bereich gedacht ist, und bietet „Paket buchen" an
  - „Was ansteht" nennt Anfragen, offene Angebote mit Liegedauer und beauftragt-nicht-berechnet;
    ein Klick setzt den Standfilter im URL-State
  - Beendete Position ist sichtbar als beendet markiert und zählt in keiner Kennzahl
  - `invoiced` und `paid` sind als manuell gepflegte Vermerke beschriftet, nicht als Buchhaltung
  - Standwechsel aus der Zeile aktualisiert Kennzahlen ohne vollen Seitenneuaufbau
  - Tastaturbedienung: Gruppe auf- und zuklappen, Standfeld bedienbar, Fokus bleibt am Auslöser
  - Mobil ohne horizontales Scrollen; Dark und Light geprüft

### CRM-42-T2 — Buchen-, Bearbeiten- und Preiswechsel-Dialog

- **Files:** `package-form-dialog`, `package-catalog-picker`, `package-replace-dialog`,
  `package-history-chain`, Client-Service-Anbindung, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Katalogauswahl mit Preisstandhinweis, editierbare Leistungspunkte, Preiswechsel mit
  Stichtag
- **Akzeptanz:**
  - Dialogmodus läuft über Query-Parameter, nicht über React-State
  - Abwählen eines Katalogpakets und freie Position sind beide möglich
  - Preiswechsel zeigt vorher/nachher und den Stichtag; 422 bei Überlappung erscheint als Feldfehler
  - Serverfehler, Validierungsfehler und 409 haben unterscheidbare Zustände

### CRM-42-T3 — Werte in Kundenliste und Projektkarte

- **Files:** `customer-value-cell`, Erweiterung `list-customers.query-handler.ts`,
  `project-value-block`, Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:** Aggregat je Seite, Sortierung über URL-State, Projektwert neben dem Planbudget
- **Akzeptanz:**
  - Eine Abfrage je Listenseite, nachgewiesen im Test (kein N+1)
  - Actor ohne `packages.read` bekommt ein DTO ohne Wertfeld; die Spalte fehlt vollständig
  - Sortierung bleibt über Seitenwechsel und Reload erhalten
  - Summe der Kundenliste und Kennzahl in der Akte stimmen für denselben Kunden überein
