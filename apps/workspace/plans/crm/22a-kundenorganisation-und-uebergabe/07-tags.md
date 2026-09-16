# Task 07 — Kundentags

> **Merge-Einheit:** Ordner 22a · **Branch:** `feat/crm-kundenorganisation-und-uebergabe`
> **Aufwand:** M · **Abhängigkeiten:** Task 30 (Filter und Suche)
> **Migration:** Nummer bei Umsetzung aus dem Repository ermitteln

## Ziel

Tags bilden eine freie, kundenweite Ordnungsachse und werden gemeinsam mit ihrer tatsächlichen
Nutzung in Suche und Filter eingeführt. Dadurch entsteht vorher keine isolierte Pflegefunktion ohne
operativen Nutzen.

## Entscheidungen

| Bereich           | Entscheidung                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Modell            | `customer_tags` plus `customer_tag_assignments`; keine String- oder JSON-Liste am Kunden             |
| Normalisierung    | Eindeutig über `lower(btrim(label))`; Schreibweise der Ersterfassung bleibt für die Anzeige erhalten |
| Farbe             | Deterministisch aus dem Label; keine Farbauswahl im UI                                               |
| Verwaiste Tags    | Bleiben als Vorschlag erhalten                                                                       |
| Listenanzeige     | Höchstens drei Tags plus Restzähler                                                                  |
| Filterverknüpfung | Mehrere Tags werden als UND-Bedingung ausgewertet                                                    |

## Tabellen

```txt
customer_tags
  id uuid PK
  label text NOT NULL
  slug text NOT NULL
  created_at timestamptz NOT NULL DEFAULT now()
  UNIQUE (slug)

customer_tag_assignments
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  tag_id uuid NOT NULL → customer_tags.id ON DELETE CASCADE
  created_at timestamptz NOT NULL DEFAULT now()
  PRIMARY KEY (customer_id, tag_id)
  INDEX (tag_id)
```

## Akzeptanz

- [ ] Migration und Drizzle-Modell sind deckungsgleich und idempotent.
- [ ] Unterschiedliche Schreibweisen desselben normalisierten Labels erzeugen keinen zweiten Tag.
- [ ] Zuweisen und Entfernen sind wiederholbar und race-sicher.
- [ ] Vorschläge sind nach Nutzungshäufigkeit sortiert.
- [ ] Eingabe und Vorschlagsliste sind vollständig per Tastatur bedienbar.
- [ ] Tags erscheinen gekürzt in der Kundenliste und sind als Mehrfachfilter nutzbar.
- [ ] Alle Texte liegen parallel in DE und EN.
