# Stack Rework Folgeplan

## Ausgangslage

Das Contact-DB-MVP ist abgeschlossen:

- `record-configuration/**` ist die kanonische Modellquelle
- Contact-Persistenz laeuft ueber Drizzle
- redundante Record-Metadaten sind entfernt
- Persistenz-Inputs haengen direkt an den Drizzle-Insert-Shapes

Der naechste Teil ist kein weiteres MVP mehr, sondern ein separates Post-MVP-Folge-Rework.

## Ziel

Die verbleibenden Contact- und DB-Raender nach dem MVP gezielt bereinigen, ohne den bereits stabilisierten Persistenzpfad wieder aufzureissen.

## Schritt 1: `getDatabaseClient()` und Raw-Neon-Reste bereinigen

Ziel:

- repo-weit pruefen, wo der rohe Neon-Client noch gebraucht wird
- den verbleibenden Einsatz bewusst behalten oder gezielt abbauen

Pruefpfade:

- `src/server/db/scripts/run-migrations.ts`
- `src/server/db/scripts/smoke-test.ts`
- `src/server/tests/db/records/contact-record-shape.test.ts`
- `src/server/db/client.ts`

Done wenn:

- klar dokumentiert ist, welche Pfade bewusst raw SQL bleiben
- oder diese Pfade auf die neue Struktur umgestellt sind
- `getDatabaseClient()` entfernt wird, falls es danach keinen sinnvollen Einsatz mehr gibt

## Schritt 2: Contact-Server-Struktur nach dem DB-Rework neu schneiden

Ziel:

- die verbleibenden Contact-Helfer unter `src/server/services/contact/**` auf ihre echte Verantwortung reduzieren
- technische Altgrenzen zwischen Mapping, Persistenzvorbereitung und Handlern bereinigen

Pruefpfade:

- `src/server/services/contact/**`
- `src/server/contact/handlers/**`
- angrenzende Tests unter `src/server/tests/services/contact/**`

Done wenn:

- Mapping, Handler und DB-nahe Vorbereitung klarer getrennt sind
- verbleibende Sammelmodule oder technische Altpfade reduziert sind
- neue Grenzen in kleinen, reviewbaren Schritten testbar bleiben

## Schritt 3: Contact-Altbestand ausserhalb der DB-Schicht bereinigen

Ziel:

- die restliche Contact-Struktur zwischen Client, Route und Server konsistent in die Zielstruktur ueberfuehren

Pruefpfade:

- `src/features/contact/**`
- `src/app/api/public/contact/**`
- kontaktbezogene Tests ausserhalb von `src/server/db/**`

Done wenn:

- alte Mischgrenzen zwischen Feature-, Route- und Server-Schicht reduziert sind
- die Contact-Testlandschaft schichtbezogener geschnitten ist
- bekannte Benennungs- und Strukturaltlasten nicht mehr quer verteilt liegen

## Nicht Teil dieses Folgeplans

- neue Contact-Tabellen oder neue CRM-Felder
- UI- oder Form-UX-Umbauten
- allgemeines `src`-Struktur-Rework ausserhalb des Contact-Kontexts
- i18n- oder Marketing-Strukturthemen
