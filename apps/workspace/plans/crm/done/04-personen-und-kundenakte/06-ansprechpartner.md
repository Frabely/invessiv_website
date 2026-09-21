# Task 06 — Ansprechpartner

> **Merge-Einheit:** Ordner 04 · **Branch:** `feat/crm-personen-und-kundenakte`
> **Aufwand:** S · **Abhängigkeiten:** Task 05 (Detail-Panel und Slots)
> **Migration:** keine

- `people`: globale Identität, Name, primäre E-Mail/Telefon, `preferred_locale`, `version`.
- `customer_contact_assignments`: Kunde, Person, Funktion/Rolle, optionale Firmen-E-Mail/-Telefon,
  `is_primary`, `version`.
- Dieselbe Person darf mehreren Firmen mit anderen Kontaktdaten und Funktionen angehören.
- Jeder Kunde hat immer genau einen Primärkontakt. Wechsel atomar; letzte Zuordnung nur mit Ersatz.
- Portalzugang bindet später die Zuordnungs-ID, nicht freien E-Mail-Abgleich.

## Context

Ein Kunde hat selten nur einen Ansprechpartner: Geschäftsführung entscheidet, Marketing liefert
Inhalte, IT hält die Zugänge. Dieser Task füllt den Kontakte-Slot im Detail-Panel mit vollem CRUD.

Der Primärkontakt ist derjenige, der in der Listenspalte erscheint und den das Portal später als
Standardempfänger nutzt. Er ist eine harte Invariante: **genau einer, immer**. Die Datenbank erzwingt
über einen partiellen Unique-Index, dass es nicht mehr als einen gibt; die Commands erzwingen, dass
es nicht weniger als einen gibt. Wechsel und Lösen laufen deshalb immer in einer Transaktion.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Funktion/Rolle   | Freitextfeld (`role_label`), keine feste Liste — die Bezeichnungen sind je Kunde zu verschieden                                                                                                                                                  |
| Primärkontakt    | **Genau einer, immer.** Höchstens einer über partiellen Unique-Index, mindestens einer über den Command; Wechsel in einer Transaktion (alten zurücksetzen, neuen setzen)                                                                         |
| Erster Kontakt   | Wird automatisch primär                                                                                                                                                                                                                          |
| Letzter Kontakt  | **Darf nicht gelöscht werden.** Ein Kunde ohne Kontakt ist kein gültiger Zustand — der Versuch ergibt einen eigenen Fehlercode, keine 500                                                                                                        |
| Warum hart       | `CustomerSummaryDto.primaryContactName` ist non-nullable (Task 01). Ein kontaktloser Kunde würde jede Listenabfrage zur Laufzeit brechen, nicht nur die Anzeige verschlechtern; die E-Mail bleibt nullable, weil Name plus Telefon gültig sind   |
| Primär lösen     | Nur durch Ersetzen: „diesen Kontakt lösen" ist bei der letzten Zuordnung nicht anwählbar, „Primärkontakt wechseln" ersetzt ihn in derselben Transaktion                                                                                          |
| Person löschen   | Eine Person mit aktiver Zuordnung wird nicht gelöscht (`ON DELETE RESTRICT`); erst die Zuordnungen lösen, dann die Person                                                                                                                        |
| E-Mail           | Nicht unique — bewusst, weil ein Identitätsanbieter Adressen ändern kann und die Adresse nie autorisiert. Sie ist **kein** Dubletten-Schutz                                                                                                      |
| Dubletten-Person | Die Personensuche im Zuordnungsdialog sucht zuerst über bestehende `people` und schlägt Treffer vor, bevor eine neue Person angelegt werden kann                                                                                                 |
| Warum            | Mit globalen `people` bedeutet eine zweite Zeile zur selben Person zwei getrennte Portalidentitäten, zwei Lesestände und zwei Digests. Es gibt bewusst keinen Merge-Flow — also muss die Dublette bei der Anlage verhindert werden, nicht danach |
| Anzeigename      | Wird aus Vor- und Nachname abgeleitet, fällt auf die E-Mail zurück (Muster: `lead-display-name.ts`)                                                                                                                                              |

## Architektur

```txt
POST  /api/workspace/crm/customers       legt Kunde und Ansprechpartner gemeinsam an
PATCH /api/workspace/crm/customers/[id]  ersetzt Kunde und vollständigen Ansprechpartnerstand
```

Beide Routen laufen über `withPermission(Permission.CustomersWrite)`. Im Kundenformular werden neue und geänderte
Ansprechpartner zunächst nur lokal übernommen. Erst das Speichern des gesamten Kundenformulars persistiert Kunde,
Personen und Zuordnungen gemeinsam in einer Transaktion. Es gibt für diesen Flow keinen separaten
Ansprechpartner-Endpunkt.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/api/workspace/crm/customers/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/route.ts

apps/workspace/src/server/workspace/crm/
  command-handler/create-customer.command-handler.ts
  command-handler/update-customer.command-handler.ts
  services/customer-contact-write-service.ts
  services/customer-schemas.ts

apps/workspace/src/components/workspace/crm/contacts/
  customer-contact-section/
```

## Tickets

### CRM-06-T1 — Schema, Handler, Anzeigename

- **Files:** `services/customer-contact.schema.ts`, vier Command-Handler,
  `shared/customer-contact-display-name.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Felder: Vorname, Nachname, E-Mail, Telefon, Funktion; Nachname ist Pflicht, E-Mail ist optional
  - Person- und Zuordnungsänderungen verwenden getrennt `personVersion` und `assignmentVersion`;
    kein Write schützt beide Tabellen mit nur einem Versionswert
  - Anzeigename ableiten, bei leerem Ergebnis auf die E-Mail zurückfallen
  - `setPrimaryContact` in einer Transaktion: alten Primärkontakt zurücksetzen, neuen setzen
  - Erster Kontakt eines Kunden wird automatisch primär
  - `deleteCustomerContactAssignment` lehnt die letzte Zuordnung eines Kunden mit eigenem
    Fehlercode `LastContactAssignment` ab, ebenso das Lösen einer primären Zuordnung ohne Ersatz
  - Personensuche über bestehende `people` vor der Neuanlage; Treffer werden vorgeschlagen
- **Akzeptanz:**
  - Tests: zwei aufeinanderfolgende Primärwechsel hinterlassen genau einen Primärkontakt
  - Vollständig leerer Kontakt wird abgelehnt
  - Test: Löschen der **letzten** Zuordnung ergibt `LastContactAssignment` (409), nicht 500
  - Test: Lösen der primären Zuordnung ohne Ersatz wird abgelehnt; mit Ersatz läuft beides in einer
    Transaktion und hinterlässt genau einen Primärkontakt
  - Test: nach jeder Mutation besitzt jeder Kunde genau eine primäre Zuordnung — als Invariante über
    alle Kunden geprüft, nicht nur für den bearbeiteten
  - Test: eine Person mit aktiver Zuordnung lässt sich nicht löschen

### CRM-06-T2 — Route Handler

- **Files:** die beiden Kundenrouten oben + Tests, `api-endpoints.ts`, `api/workspace/crm/README.md`
- **Skills:** `best-practices`
- **Inhalt:** `withPermission` innen aufgerufen wegen `params`; Fehlercodes `ContactNotFound`,
  `CustomerNotFound`, `ValidationError`
- **Akzeptanz:** Tests für 401/404/403/200/201/422; Zuordnungen eines fremden Kunden lassen sich nicht über eine
  manipulierte Kontakt-ID ändern (der Command prüft die Zugehörigkeit)

### CRM-06-T3 — Sektion und Dialog

- **Files:** `components/workspace/crm/contacts/**`, Kundenformular und CRM-Dictionaries
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Kontaktkarten mit Name, Funktion, klickbarer Mail und Telefonnummer, Primär-Markierung als Badge
  - Aktionen je Karte: Bearbeiten, Als primär setzen, Lösen (mit Bestätigung)
  - Bei genau einer Zuordnung ist „Lösen" deaktiviert, mit erklärendem Hinweis statt Fehlermeldung
  - Der Zuordnungsdialog sucht zuerst in bestehenden Personen und bietet Treffer zur Auswahl, bevor
    eine neue Person entsteht
  - Editor für Anlegen und Bearbeiten innerhalb des Kundenformulars; „Übernehmen“ ändert nur den lokalen Formularstand
  - Persistenz ausschließlich über den abschließenden Submit des gesamten Kundenformulars
  - Kein leerer Zustand — ein Kunde hat immer mindestens den Primärkontakt aus der Anlage (Task 04).
    Die Sektion zeigt stattdessen den Primärkontakt zuerst und darunter die weiteren Zuordnungen
- **Akzeptanz:**
  - Tastaturbedienung vollständig, Fokus nach jeder Aktion sinnvoll gesetzt
  - „Als primär setzen" ist bei der bereits primären Karte nicht anklickbar
  - „Lösen" ist bei der einzigen Zuordnung nicht anklickbar und erklärt, warum
  - Mail- und Telefonlinks funktionieren auf Mobil

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Ansprechpartner" im Kundendetail mit vollem CRUD.
2. **Bricht nichts:** keine Migration. Die Listenspalte „Primärkontakt" aus Task 03 liest weiterhin
   dieselbe Tabelle und zeigt jetzt gepflegte statt nur beim Anlegen erfasste Daten.
3. **Offen:** nichts innerhalb dieses Features. Die Portal-Einladung (Task 20) wird später an einen
   Kontakt anknüpfen — dafür ist hier bereits alles vorhanden.

## End-to-End-Akzeptanz

1. Mehrere Ansprechpartner pro Kunde lassen sich anlegen, bearbeiten und löschen.
2. Genau einer ist als primär markiert; ein Wechsel setzt den alten zuverlässig zurück.
3. Der Primärkontakt erscheint in der Spalte der Kundenliste.
4. Ein Kunde kann über keinen Weg kontaktlos werden — weder über Lösen, noch über Personenlöschung,
   noch über parallele Anfragen.
5. Dieselbe Person bei zwei Kunden ist **eine** Personenzeile mit zwei Zuordnungen; der Dialog
   schlägt sie beim zweiten Kunden zur Auswahl vor.
6. Alle Texte in DE und EN.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
