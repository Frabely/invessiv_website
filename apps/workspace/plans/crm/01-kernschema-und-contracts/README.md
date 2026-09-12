# Ordner 01 — Kernschema und Contracts

> **Status:** im Review · **Aufwand:** 3–4 Tage · **Reviewziel:** 50–80 Dateien · **Harte Grenze:** 200

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`01-datenmodell-kunden.md`](./01-datenmodell-kunden.md) — Migration, Drizzle-Modelle,
  Contracts, Invarianten und Seed.

Das additive CRM-Kernschema, gemeinsame Const-Objekte, DTOs und ein Seed-Fundament existieren.
Es wird noch keine CRM-Navigation oder UI aktiviert. Die bestehende Lead-Anwendung verhält sich
unverändert und kann mit altem wie neuem Schema deployt werden.

## Änderungen

- CRM-Ordnergrenzen und benötigte scoped `AGENTS.md` anlegen.
- Nur die unmittelbar benötigten Const-Objekte für Mitglieder, Kunden, Personen und Activities samt
  exakten Duplikat-Tests erstellen. Spätere Domänen definieren ihre Contracts in ihrem eigenen
  Ordner, damit keine ungenutzten Schnittstellen vorauseilen.
- Additive Tabellen für `workspace_members`, `customers`, `people` und
  `customer_contact_assignments` anlegen. `activities` gehört zu Ordner 02, alle anderen Tabellen
  entstehen erst in ihrer sichtbar nutzbaren Feature-Einheit.
- `workspace_members` entsteht **vollständig hier** (inklusive `active` und `credentials_access`),
  weil `customers.owner_member_id` ein Pflicht-Fremdschlüssel darauf ist. Ordner 03 baut darauf nur
  die Auth- und Permission-Schicht und bekommt für diese Tabelle keine eigene Migration.
- Fremdschlüssel, Check-Constraints und Primärkontakt-Invarianten in der DB erzwingen.
  Kundennummernsequenzen dürfen Lücken haben.
- Bearbeitbare Kerntabellen erhalten `version`, `created_at`, `updated_at`; Geheimfelder noch nicht.
- `db:seed:crm` mit ausschließlich synthetischen Beispieldaten vorbereiten.

## Schnittstellen

- Noch keine neuen HTTP-Endpunkte.
- Paketexports nur für tatsächlich verwendete Contracts und Konstanten; keine Sammel-DTOs.
- Drizzle-Modelle sind kanonisch und deckungsgleich zu Migrationen.

## Merge-Gate

- [ ] Alte Workspace-Version startet gegen das neue additive Schema.
- [ ] Kein CRM-Link, kein toter CTA und keine unfertige Route ist sichtbar.
- [ ] Alle String-Unions folgen dem Const-Objekt-Pattern und besitzen Tests.
- [ ] DB-Smoke prüft Constraints, Sequenzlücken und ungültige Cross-Customer-Bezüge.
- [ ] Fachliche Spalten tragen keinen DB-Default; ein fehlender Wert wird abgewiesen statt still
      gefüllt. DB-Defaults gibt es nur für `created_at`, `updated_at` und die Kundennummernsequenz.
- [ ] Rollback entfernt keine Tabellen; Rückbau erfolgt durch Nichtnutzung des additiven Schemas.

## Teilungsregel

Werden mehr als 120 Dateien erwartet, werden Activity-Contracts und `activities` vollständig nach
Ordner 02 verschoben. Kunden-/Personen-Invarianten bleiben zusammen; sie dürfen nicht auf zwei
inkompatible Migrationen verteilt werden.

## Rollback

Da keine neue UI und kein neuer aktiver Schreibpfad existiert, wird bei Problemen ausschließlich
die neue Nutzung deaktiviert. Additive Tabellen und Spalten bleiben bestehen; ein destruktiver
Rollback ist nicht erforderlich und die bisherige Lead-Anwendung bleibt unverändert.
