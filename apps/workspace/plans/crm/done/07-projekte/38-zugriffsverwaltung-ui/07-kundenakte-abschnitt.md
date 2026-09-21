# 07 — Abschnitt „Zugriff“ in der Kundenakte

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** 05 · **Blockiert:** 08

## Warum

Die zweite Blickrichtung auf dieselben Daten. Im Settings-Dialog fragt man „was darf diese Person?", in der
Kundenakte „wer darf bei diesem Kunden etwas?". Es bleibt **ein Datenmodell und ein Command** — wie
Dateirechte, die man je Benutzer oder je Ordner ansehen kann. Ohne diese Sicht müsste man bei einer Frage zum
Kunden alle Mitglieder durchgehen.

## Umfang

```txt
src/components/workspace/crm/detail/customer-access-section/…    (Ordner liegt leer bereit)
src/i18n/dictionaries/workspace/crm/access/{de,en}.json          (Namespace liegt leer bereit)
```

Einbindung in `customer-cockpit-view`, Muster aus `customer-contact-section` und
`customer-projects-section`: `"use client"`, lokaler Editor-State, Mutation über den Client-Service, danach
`router.refresh()`.

## Darstellung

Gruppiert, nicht als flache Liste:

```txt
Zugriff
──────────────────────────────────────────────
Ganzer Kunde
  Max Mustermann        Kundenbetreuer   [Entfernen]
  Lena Schmidt          Aufgaben         [Entfernen]

Projekt Website-Relaunch
  Jonas Weber           Nur lesen        [Entfernen]

Projekt Onlineshop
  — niemand zusätzlich —

                                  [Zugriff geben]
```

- Die Gruppen kommen aus `listCustomerAccessScopes` (Task 02 liefert Mitglieds- und Rollennamen).
- Projekte ohne eigene Zuweisung werden trotzdem genannt, damit sichtbar ist, dass dort nur die
  Kundenbindung gilt.
- Die über den Kunden geerbten Zugriffe werden bei den Projekten **nicht** wiederholt; stattdessen ein Satz
  je Gruppe: „Zusätzlich gilt hier alles aus ‚Ganzer Kunde‘."
- „Zugriff geben" öffnet denselben Baustein aus Task 05, auf diesen Kunden vorbelegt und ohne Kundensuche.

## Sichtbarkeit

Ohne `members.manage` **fehlt der Abschnitt vollständig** — nicht deaktiviert, nicht leer. Das Flag kommt
serverseitig als Prop; die Page lädt die Zugriffsdaten in dem Fall gar nicht erst.

## Regeln

- Keine Fachlogik im Client; die Gruppierung ist Darstellung über die gelieferten Daten.
- Texte nur aus dem neuen CRM-Dictionary-Namespace, DE und EN.
- Kundennummern nur über `formatCustomerNumber` im View.
- Keine PII in Query-Parametern, Logs oder Activity-Metadaten.
- Der Abschnitt hat keinen eigenen URL-State (Entscheidung aus Task 38).

## Tests

- groups assignments into the customer scope and one group per project
- a project without its own assignment states that the customer scope applies
- the section is absent without `members.manage`
- adding from here pre-selects the customer and hides the customer search
- removing an assignment refreshes the section

## Akzeptanz

- Die Frage „wer hat hier Zugriff?" ist in der Kundenakte ohne Umweg beantwortbar.
- Der Abschnitt nutzt denselben Baustein wie der Settings-Dialog; keine zweite Implementierung.
