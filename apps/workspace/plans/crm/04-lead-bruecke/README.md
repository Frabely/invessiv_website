# Ordner 04 — Lead-Brücke

> **Merge-Einheit 4 von 16** · **Aufwand:** ~2 Tage · **Review-Umfang:** geschätzt ~30 Dateien
> **Setzt voraus:** Ordner 01, 02, 03
> **Migrationen:** `0024_link_leads_to_customers`

## Ziel

Der erste Moment mit echtem Alltagsnutzen: ein gewonnener Lead wird per Dialog zum Kunden, und die
komplette Akquise-Historie wandert mit in die Kundenakte. Ab hier speist dein bestehender
Lead-Trichter das CRM, statt dass Kunden von Hand entstehen.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                 | Aufwand | Inhalt                                                     |
| ---- | --------------------- | ------- | ---------------------------------------------------------- |
| 08   | `08-lead-zu-kunde.md` | L       | Verknüpfung, Mapping, Dialog, Ausblenden in der Lead-Liste |

## Nach dem Merge live

Aktion „Zu Kunde machen" im Lead-Detail, Rückverlinkung in beide Richtungen, Umschalter
„Konvertierte einblenden" und Hinweiszeile in der Lead-Liste.

## Warum allein

Das ist der **einzige** Ordner, der bestehende Leads-Fachlogik anfasst: den Filterzweig in
`lead-filter.query-handler.ts`, das Mapping und das Lead-Detail-Panel. Isoliert reviewbar zu halten
ist hier mehr wert als ein Merge zu sparen — geht etwas schief, ist der Revert eindeutig und trifft
nichts anderes.

## Merge-Gate

- [ ] `lead_status` und dessen CHECK-Constraint sind **unverändert** (Review-Punkt im PR)
- [ ] `contact-lead-statuses.ts` ist unverändert
- [ ] **Alle bestehenden Lead-Tests grün, ohne dass eine Erwartung angepasst wurde**
- [ ] Ein gewonnener Lead wird zum Kunden; Felder sind vorbefüllt, Kategorie wird übernommen
- [ ] Ein firmenloser Lead wird ein Privatkunde, nicht ein Kunde mit Personenname als Firma
- [ ] Die Kunden-Timeline enthält danach die komplette Akquise-Historie des Leads
- [ ] Ein Lead, dessen Firmenname bereits einem anderen Kunden gehört, konvertiert erfolgreich
- [ ] Zweiter Konvertierungsversuch ist nicht möglich und erzeugt keinen Datenmüll
- [ ] Zuordnung zu einem bestehenden Kunden funktioniert und legt keinen neuen an
- [ ] Konvertierte Leads sind standardmäßig ausgeblendet und über den Umschalter erreichbar
- [ ] Die bestehende Ausblendung von `archived` funktioniert unverändert
- [ ] Löschen des Kunden lässt den Lead bestehen (`customer_id` wird `NULL`)
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Nichts innerhalb dieses Features. Zusatzkontakte und Social-Profile bleiben bewusst am Lead und sind
von der Kundenakte aus verlinkt.
