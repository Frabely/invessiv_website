# Ordner 13a — Leistungsanfragen im Portal

> **Status:** offen · **Abhängigkeiten:** 07, 12b, 13 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–80 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`50-portal-leistungsanfragen.md`](./50-portal-leistungsanfragen.md) — Portal-Freigabe im Leistungskatalog,
  Anfrage durch den Kunden, interne Bearbeitung.

Kunden sehen im Portal einen freigegebenen Ausschnitt des Leistungskatalogs — **ohne Preise** — und können eine
Leistung unverbindlich anfragen. Die Anfrage landet in der Kundenakte und wird intern mit Status bearbeitet. Das
Angebot selbst entsteht weiterhin außerhalb (Lexware); die Anwendung dokumentiert nur Anfrage und Ausgang.

## Umfang

- `line_item_templates` bekommt eine Portal-Freigabe (`portal_requestable`) und einen kundentauglichen
  Beschreibungstext. Preisfelder erreichen nie ein Portal-DTO.
- Neue Tabelle `service_requests` mit Status `requested → offered → accepted | declined`, versioniert.
- Portalseite `/[locale]/portal/[customerId]/services`: Katalog, Anfrage mit optionaler Notiz, eigene Anfragen mit
  Status in Kundensprache.
- Intern: Liste der Anfragen in der Kundenakte, Statuspflege, Übernahme einer angenommenen Anfrage als Projektleistung
  (Task 41), Hinweis im Dashboard-Block.
- Portal-Permissions `portal.services.read`, `portal.services.request`; interne Permissions
  `service_requests.read`/`service_requests.write` (scopable, an Kunde bindbar). `portal_standard` wird ergänzt.
- Navigationseintrag in `PORTAL_NAV_ITEMS`.

## Merge-Gate

- [ ] Kein Portal-DTO, keine Portal-Antwort und kein Portal-Log enthält Preis, Preisart oder Intervall.
- [ ] Nur freigegebene, aktive Templates sind im Portal sichtbar; Archivieren entzieht die Freigabe sofort.
- [ ] Eine Anfrage entsteht nur mit `portal.services.request`; Firma aus dem `PortalActor`, nie aus der Anfrage.
- [ ] Kontakt A sieht die Anfragen seiner Firma, nie die einer fremden Firma (Negativtests Query und Mutation).
- [ ] Doppelklick erzeugt genau eine Anfrage (Idempotenzschlüssel).
- [ ] Interne Statuswechsel sind versioniert; Konflikt liefert 409.
- [ ] Empty-States erklären Zweck im Portal und intern; „nichts freigegeben“ und „noch nichts angefragt“ sind
      unterscheidbar.

## Rollback

Navigationseintrag über die Permission entfernen (Permission aus `portal_standard` nehmen) und Freigaben
zurücksetzen. Die Tabelle bleibt; bestehende Anfragen bleiben intern lesbar.
