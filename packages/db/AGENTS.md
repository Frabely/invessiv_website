# AGENTS.md — packages/db

Gilt für das gesamte Paket: `migrations/`, `scripts/` und `src/`. Ergänzt den Abschnitt
`packages/db` in `packages/AGENTS.md`; spezifischere Dateien weiter unten im Baum (`src/record-configuration/crm/`)
haben Vorrang.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt. Code-Kommentare, Testnamen,
Entwickler-Fehlermeldungen und Konsolenausgabe von Skripten sind englisch — siehe
`apps/workspace/AGENTS.md`, Abschnitt Sprachregel.

## DB-Defaults sind die Ausnahme (verbindlich)

Fachliche Werte werden **beim Anlegen im Code gesetzt**, nicht von einem `DEFAULT` in der Tabelle.
Ein DB-Default gilt nur für die technischen Ausnahmen unten. Die Regel gilt für die SQL-Migration **und** das
Drizzle-Modell — beide müssen sie erfüllen, sonst laufen sie auseinander.

**Warum:** Ein Spalten-Default entsteht unbemerkt. Vergisst ein Command-Handler ein Feld, schreibt
Postgres schweigend einen Wert — und niemand sieht es, weil die Zeile gültig aussieht. Genau das
soll auffallen: ohne Default schlägt der Insert fehl, und der fehlende Wert wird beim Bauen sichtbar
statt Monate später in den Daten. Zusätzlich verschiebt ein Default die Fachentscheidung („ein neuer
Kunde ist `active`") aus dem Code, wo sie getestet und gelesen wird, in ein Schema, in das niemand
schaut.

**Technische Ausnahmen, die einen DB-Default behalten:**

| Spalte                      | Default      | Warum                                                                       |
| --------------------------- | ------------ | --------------------------------------------------------------------------- |
| `created_at` / `updated_at` | `now()`      | Der Zeitpunkt gehört der Datenbank; sonst schreibt ihn jeder Pfad selbst    |
| Sequenzspalten              | `nextval(…)` | Die Sequenz **ist** der Mechanismus; der Code kennt den nächsten Wert nicht |

Alles andere trägt keinen Default: Status, Typ, Rolle, Flags, Sprache, `version`. Das gilt auch für
scheinbar harmlose Booleans — sie sind Fachentscheidungen, keine technischen Vorgaben.

Auch `id` bekommt **keinen** `gen_random_uuid()`-Default: der Schreibpfad erzeugt die uuid über
`crypto.randomUUID()`, wie `leads` es bereits tut. Damit kennt der Code die Kennung schon vor dem
Insert und kann sie in derselben Transaktion weiterverwenden. Einige ältere Lead-Tabellen (`lead_categories`,
`lead_activities`, `lead_social_profiles`) haben den Default noch — sie sind
Bestand, kein Vorbild für neue Tabellen.

```sql
-- ✅ technische Ausnahme
created_at
TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- ✅ fachlicher Wert, der Code entscheidet
status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'archived')),

-- ❌ still eingetragener Fachwert
status TEXT NOT NULL DEFAULT 'active' CHECK (
…),
is_primary BOOLEAN NOT NULL DEFAULT FALSE,
```

Im Drizzle-Modell entsprechend: `.defaultNow()` nur an den Zeitstempeln, `.default(sql`nextval (…)`)`
nur an Sequenzspalten, sonst kein `.default(…)`. Die `NOT NULL`- und `CHECK`-Constraints bleiben —
sie sind die Absicherung, die ohne Default überhaupt erst greift.

**Folge für Skripte:** Seeds und Smokes setzen jedes Feld explizit. Ein Seed, der sich auf Defaults
verlassen hat, deckt einen vergessenen Wert im Produktivpfad nicht mehr auf.

**Absicherung:** Für jede neue Tabelle prüft ein Smoke, dass ein fehlender Fachwert abgewiesen wird (Muster:
`scripts/smoke-crm-constraints.ts`, Abschnitt `runMissingDefaultChecks`). Ohne diesen Test
kann eine spätere Migration einen Default still wieder einführen, ohne dass es auffällt.

## Migration und Modell sind deckungsgleich

Spaltennamen, Typen, Defaults, `NOT NULL` und Constraints stimmen 1:1 zwischen SQL-Migration und
`pgTable`-Modell überein. Das ist ein ausdrücklicher Review-Punkt im PR, kein Nebenbei — eine
Abweichung fällt sonst erst auf, wenn ein Query gegen ein Feld läuft, das anders heißt oder anders
nullable ist als angenommen.

CHECK-Constraints für String-Unions entstehen über `sqlCheckIn` aus `@invessiv/db/core` mit den
`_VALUES`-Arrays aus `packages/common/src/constants/**`. String-Literale erscheinen genau einmal, im
Const-Objekt — nicht zusätzlich im DDL-Text und nicht im Modell.

## Migrationen

- Nummer beim Schreiben im Repository ermitteln: höchste bestehende plus eins. Nie aus einem
  Plandokument übernehmen.
- Additiv: keine `DROP`, kein Umbenennen, kein `NOT NULL` auf eine bestehende befüllte Spalte,
  CHECK-Constraints nur erweitern und nie verengen. Rückbau erst, wenn der letzte Leser weg ist.
  Einzige dokumentierte Ausnahme: `0024` entfernt die leeren, von keiner App-Version gelesenen Legacy-Spalten an
  `workspace_members` hinter einem Leerheits-Preflight (Begründung: `plans/crm/03-mitglieder-und-auth/README.md`).
- Idempotent: `CREATE … IF NOT EXISTS`, `--> statement-breakpoint` zwischen den Statements, ein
  zweiter Lauf ist folgenlos.
- Eine bereits in `schema_migrations` registrierte Datei wird **niemals** verändert oder umbenannt.
  Eine Korrektur ist eine neue Migration. Ausnahme nur, solange die Migration ausschließlich lokal
  in `development` angewendet und nirgends committet ist — dann wird sie zurückgenommen und neu
  angewendet, statt eine Korrektur-Migration in die Historie zu schreiben.

## Skripte

- `db:migrate:*` und `db:smoke:*` laufen gegen jedes Ziel. Schreibende Skripte (`db:seed:*`,
  `db:smoke:crm`, `db:smoke:activities`, `db:smoke:rbac`) sind auf `development` und `preview` begrenzt und
  lehnen `production` ab.
- `db:smoke` vergleicht zusätzlich lesend Permission-Katalog und Systemrollen mit dem Code
  (`scripts/rbac-catalog-check.ts`) und ist damit auch für `production` das Katalog-Gate.
- Schreibende Skripte kennzeichnen ihre Zeilen mit einem Fixture-Präfix und räumen sie wieder ab —
  auch wenn eine Prüfung fehlschlägt.
- Seeds sind wiederholbar: jeder Lauf setzt die eigenen Zeilen zurück und legt sie neu an.
- Seeds bleiben optional aufrufbar, damit Empty-States der Anwendung weiterhin prüfbar sind.
