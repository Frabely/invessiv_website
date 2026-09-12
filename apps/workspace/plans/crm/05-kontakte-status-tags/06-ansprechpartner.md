# Task 06 — Ansprechpartner

> **Branch:** `feat/crm-ansprechpartner`
> **Aufwand:** S (rund ein halber Tag)
> **Abhängigkeiten:** Task 05 (Detail-Panel und Slots)
> **Migration:** keine — `customer_contacts` existiert seit Task 01

## Context

Ein Kunde hat selten nur einen Ansprechpartner: Geschäftsführung entscheidet, Marketing liefert
Inhalte, IT hält die Zugänge. Dieser Task füllt den Kontakte-Slot im Detail-Panel mit vollem CRUD.

Der Primärkontakt ist derjenige, der in der Listenspalte erscheint und den das Portal später als
Standardempfänger nutzt. Die Datenbank erzwingt über einen partiellen Unique-Index, dass es höchstens
einen gibt — der Wechsel muss deshalb in einer Transaktion laufen.

## Entscheidungen

| Bereich         | Entscheidung                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Funktion/Rolle  | Freitextfeld (`role_label`), keine feste Liste — die Bezeichnungen sind je Kunde zu verschieden                           |
| Primärkontakt   | Höchstens einer, erzwungen durch partiellen Unique-Index; Wechsel in einer Transaktion (alten zurücksetzen, neuen setzen) |
| Erster Kontakt  | Wird automatisch primär                                                                                                   |
| Letzter Kontakt | Darf gelöscht werden — ein Kunde ohne Kontakt ist ein gültiger Zustand                                                    |
| E-Mail          | Nicht eindeutig — dieselbe Person kann bei zwei Kunden Ansprechpartner sein                                               |
| Anzeigename     | Wird aus Vor- und Nachname abgeleitet, fällt auf die E-Mail zurück (Muster: `lead-display-name.ts`)                       |

## Architektur

```txt
POST   /api/workspace/crm/customers/[id]/contacts        Permission CustomersWrite
PATCH  /api/workspace/crm/contacts/[contactId]
DELETE /api/workspace/crm/contacts/[contactId]
PUT    /api/workspace/crm/contacts/[contactId]/primary   setzt primär, Transaktion
```

Alle vier über `withPermission(Permission.CustomersWrite)`. Nach jeder Mutation `router.refresh()`.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/api/workspace/crm/customers/[id]/contacts/route.ts
apps/workspace/src/app/api/workspace/crm/contacts/[contactId]/route.ts
apps/workspace/src/app/api/workspace/crm/contacts/[contactId]/primary/route.ts

apps/workspace/src/server/workspace/crm/
  command-handler/{create,update,delete}-customer-contact.command-handler.ts
  command-handler/set-primary-contact.command-handler.ts
  services/customer-contact.schema.ts
  shared/customer-contact-display-name.ts

apps/workspace/src/components/workspace/crm/contacts/
  customer-contacts-section/
  customer-contact-card/
  customer-contact-form-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/contacts/{de,en}.json
```

## Tickets

### CRM-06-T1 — Schema, Handler, Anzeigename

- **Files:** `services/customer-contact.schema.ts`, vier Command-Handler,
  `shared/customer-contact-display-name.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Felder: Vorname, Nachname, E-Mail, Telefon, Funktion — alle optional, aber mindestens eines von
    Nachname oder E-Mail muss gesetzt sein
  - Anzeigename ableiten, bei leerem Ergebnis auf die E-Mail zurückfallen
  - `setPrimaryContact` in einer Transaktion: alten Primärkontakt zurücksetzen, neuen setzen
  - Erster Kontakt eines Kunden wird automatisch primär
- **Akzeptanz:**
  - Tests: zwei aufeinanderfolgende Primärwechsel hinterlassen genau einen Primärkontakt
  - Vollständig leerer Kontakt wird abgelehnt
  - Löschen des Primärkontakts befördert **keinen** anderen automatisch (bewusst: der Nutzer
    entscheidet), der Kunde zeigt danach keinen Primärkontakt

### CRM-06-T2 — Route Handler

- **Files:** die vier Routen oben + Tests, `api-endpoints.ts`, `api/workspace/crm/README.md`
- **Skills:** `best-practices`
- **Inhalt:** `withPermission` innen aufgerufen wegen `params`; Fehlercodes `ContactNotFound`,
  `CustomerNotFound`, `ValidationError`
- **Akzeptanz:** Tests für 401/404/403/201/204/422; Kontakt eines fremden Kunden lässt sich nicht
  über eine geratene ID bearbeiten (der Handler prüft die Zugehörigkeit)

### CRM-06-T3 — Sektion und Dialog

- **Files:** `components/workspace/crm/contacts/**`, `dictionaries/workspace/crm/contacts/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Kontaktkarten mit Name, Funktion, klickbarer Mail und Telefonnummer, Primär-Markierung als Badge
  - Aktionen je Karte: Bearbeiten, Als primär setzen, Löschen (mit Bestätigung)
  - Dialog für Anlegen und Bearbeiten in einer Komponente
  - Leerer Zustand mit direktem Button „Ansprechpartner hinzufügen"
- **Akzeptanz:**
  - Tastaturbedienung vollständig, Fokus nach jeder Aktion sinnvoll gesetzt
  - „Als primär setzen" ist bei der bereits primären Karte nicht anklickbar
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
4. Ein Kunde ohne Kontakte zeigt den leeren Zustand, nicht einen Fehler.
5. Alle Texte in DE und EN.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
