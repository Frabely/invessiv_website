# AGENTS.md — CRM-Drizzle-Modelle

Gilt für `packages/db/src/record-configuration/crm/**`. Ergänzt `packages/db/AGENTS.md`.

Die Regeln, die für **alle** Tabellen gelten, stehen dort und werden hier nicht wiederholt:
DB-Defaults sind die Ausnahme, Migration und Modell sind deckungsgleich, CHECK-Constraints über
`sqlCheckIn`, Migrationsregeln. Diese Datei enthält nur, was am CRM anders ist.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Warum ein eigener Unterordner

`record-configuration/` war flach, wächst durch das CRM aber um rund ein Dutzend Modelle. Der
Unterordner mit eigenem Barrel ist eine bewusste Abweichung von der flachen Struktur, damit
Lead- und CRM-Modelle nicht in einem Sammelordner verschwimmen.

`activities.ts` gehört bewusst **nicht** hierunter: die Tabelle bedient Leads und Kunden gemeinsam (Ordner 02) und ist
damit keine CRM-Kindtabelle.

## Verbindlich

- Tabellennamen folgen der Präfix-Regel aus `plans/crm/00-entscheidungen.md`: Kindtabellen eines
  Aggregats tragen dessen Namen als Präfix (`customer_contact_assignments`), eigenständige und
  querschnittliche Tabellen nicht (`people`, `customers`, `workspace_members`).
- Jedes Modell wird im Barrel `crm/index.ts` re-exportiert, das `record-configuration/index.ts`
  weitergibt. Das Barrel speist automatisch die Tabellenliste des DB-Smokes (`scripts/contact-table-names.ts`) — ein
  fehlender Export fällt dort auf.
- Bearbeitbare Tabellen haben `version integer NOT NULL CHECK (version > 0)`; der anlegende
  Schreibpfad setzt `1` explizit, und nur `updateVersioned` erhöht sie danach.

## Bewusst nicht vorhanden

- Kein Unique-Index auf `customers.company_name`: zwei echte „Müller GmbH" in verschiedenen Städten
  sind ein gültiger Zustand.
- Kein Unique-Index auf `people.primary_email`: die Adresse autorisiert nie und ist kein
  Dubletten-Schutz. Dubletten verhindert die Personensuche im Dialog.
- Kein `deleted_at`. Archivierung läuft über den Status und ist reversibel.
- Kein `archived_at` an `projects`: Archivierung ist ausschließlich ein Status.
