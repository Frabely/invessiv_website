# Ordner 14 — Stundenkontingent und Verlauf

> **Merge-Einheit 14 von 16** · **Aufwand:** ~2 Tage · **Review-Umfang:** geschätzt ~80 Dateien
> **Setzt voraus:** Ordner 03 (Detail-Slot), 08 (Portal-Dashboard), 13 (Renewals)
> **Migrationen:** `0035_create_retainers_and_time_entries`

## Ziel

Zwei Ergänzungen, die beide in das Detailpanel hängen: Wartungsverträge mit Stundenkontingent und
nachvollziehbarem Verbrauch, und die sichtbare Timeline mit automatisch erfassten Feldänderungen.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                          | Aufwand | Inhalt                                                |
| ---- | ------------------------------ | ------- | ----------------------------------------------------- |
| 27   | `27-stundenbuchungen.md`       | M       | `retainers`, `time_entries`, Saldo, Anzeige im Portal |
| 29   | `29-aktivitaet-und-history.md` | M       | Timeline-Sektion, Feldvergleich, manuelle Notizen     |

## Nach dem Merge live

Sektionen „Stundenkontingent" und „Verlauf" im Kundendetail, Block „Stundenkontingent" im
Portal-Dashboard (sobald ein Retainer läuft), ab jetzt Timeline-Einträge zu Feldänderungen.

## Warum diese Tasks zusammen

Beide sind Slot-Füller im Panel, beide ohne Abhängigkeit zueinander — außer einer: Task 29 verdrahtet
`recordFieldChanges` unter anderem in `update-retainer` aus Task 27. In einem Merge sind das zwei
Dateien im selben Diff statt eine Änderung an einem bereits gemergten Handler.

Die Timeline steht bewusst spät: sie ist erst dann wertvoll, wenn es etwas zu erzählen gibt. Nach
Ordner 13 haben alle Schreibpfade monatelang Aktivitäten gesammelt.

## Merge-Gate

- [ ] Saldo bei 100 Buchungen erzeugt genau **eine** Abfrage
- [ ] `1:30`, `1,5` und `1.5` ergeben alle 90 Minuten
- [ ] Überziehung ergibt einen negativen Rest, keinen Fehler
- [ ] Löschen einer Buchung korrigiert den Saldo sofort
- [ ] **Als unsichtbar markierte Buchungen erscheinen im Portal nicht, zählen aber in die Summe** —
      sonst geht die Rechnung für den Kunden nicht auf
- [ ] Ohne laufenden Retainer fehlt der Portal-Block vollständig (kein leerer Kasten)
- [ ] Saldo-Balken ohne Farbwahrnehmung lesbar (Zahlen stehen dabei)
- [ ] Eine Änderung an einem nicht überwachten Feld erzeugt keinen Timeline-Eintrag
- [ ] Drei geänderte Felder ergeben **einen** Eintrag mit drei Feldern, nicht drei Einträge
- [ ] **Der Wert eines sensiblen Feldes taucht nirgends im Eintrag auf** — protokolliert wird nur
      die Tatsache einer Änderung
- [ ] Gleiche Werte erzeugen keinen Eintrag
- [ ] Ein Fehler beim Protokollieren bricht die eigentliche Änderung **nicht** ab
- [ ] Eine automatische Aktivität lässt sich nicht bearbeiten (404); fremde Notiz ebenfalls nicht
- [ ] Unerwartete Metadaten führen zu einer verständlichen Zeile, nicht zu einem Absturz
- [ ] Keine N+1-Abfrage; Nachladen über Cursor lückenlos
- [ ] **Bestehende Handler-Tests bleiben unverändert gültig**
- [ ] Alle Texte in DE und EN; Dark, Light und Mobil geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Automatische Zeiterfassung und Abrechnung sind nicht enthalten — die Abrechnung läuft perspektivisch
über Lexware. Die Timeline bleibt rein intern und hat keinen Portal-Endpunkt.
