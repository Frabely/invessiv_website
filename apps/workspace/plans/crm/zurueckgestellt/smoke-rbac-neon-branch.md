# RBAC-Smoke auf einem temporären Neon-Branch der Produktion

> **Bewusst zurückgestellt (Nutzerentscheidung 18.10.2026):** Schreibende Tests gegen die Produktions-DB sind
> entfernt (`db:smoke:rbac:prod` gibt es nicht mehr). Gegen Produktion läuft nur der lesende Katalogabgleich
> `db:smoke:prod`. Dieser Plan beschreibt, wie der volle RBAC-Smoke später wieder „gegen Produktion“ laufen kann,
> ohne in sie zu schreiben.

> **Branch:** `chore/db-smoke-rbac-neon-branch`
> **Aufwand:** S (rund ein halber Tag, ein Entwurf war am 18.10.2026 schon einmal gebaut und getestet)
> **Abhängigkeiten:** Neon-API-Key mit Recht auf Branch anlegen/löschen; Projekt- und Produktions-Branch-ID
> **Migration:** keine
> **Priorität:** niedrig, solange Preview dieselben Migrationen wie Produktion fährt

## Warum

- Der RBAC-Smoke prüft Realm-Trennung, Delegierbarkeit, Actor-Constraints und Constraint-Namen, die nur Postgres
  selbst beweisen kann. Er muss dafür Fixture-Zeilen schreiben.
- Gegen Produktion verbrauchte das Sequenzwerte für Kundennummern und konnte nach einem Abbruch Fixtures
  hinterlassen. Preview zeigt Migrationen, aber nicht den echten Datenstand der Produktion.
- Ein Neon-Branch ist eine sofortige Kopie der Produktion (Schema **und** Daten) mit eigener Compute. Schreiben dort
  berührt Produktion nicht.

## Ablauf

1. Lokal gesetzte Variablen (nie deployt, in `.env.example` dokumentieren): `NEON_API_KEY`, `NEON_PROJECT_ID`,
   `NEON_PRODUCTION_BRANCH_ID`. Fehlen sie, bricht das Skript ab und nennt nur die Namen, nie Werte.
2. `POST https://console.neon.tech/api/v2/projects/{project_id}/branches` mit
   `{ branch: { parent_id, name: "smoke-rbac-<zeitstempel>", expires_at: jetzt + 1 h }, endpoints: [{ type: "read_write" }] }`.
   `expires_at` (RFC 3339, ohne Millisekunden) ist das Sicherheitsnetz, falls das Löschen nie läuft.
3. Die `operations` der Antwort abwarten: `GET /projects/{project_id}/operations/{id}` bis `finished`/`skipped`;
   `failed`/`cancelling`/`cancelled` oder Zeitüberschreitung (2 min) löschen den Branch und brechen ab.
4. `DATABASE_URL` auf `connection_uris[0].connection_uri` setzen (der DB-Client lädt `.env`-Dateien ohne Override,
   die Branch-URL bleibt also stehen) und dieselben Prüfungen wie `db:smoke:rbac` ausführen.
5. In `finally` `DELETE /projects/{project_id}/branches/{branch_id}`. Scheitert das Löschen, wird es geloggt (Name
   und ID, nie die Verbindungs-URL) und das Smoke-Ergebnis bleibt maßgeblich.

## Schnitt

- `packages/db/scripts/smoke-rbac.ts` aufteilen: Prüfungen und Cleanup als `runRbacSmoke()` in
  `rbac-smoke-checks.ts`, `smoke-rbac.ts` bleibt die CLI für `development`/`preview`.
- `packages/db/scripts/neon-branch.ts`: Service-Objekt `neonBranch.create(name)` mit `remove()` am Ergebnis;
  Konfiguration aus der Umgebung, sonst `.env.production.local` über `readTargetEnvValue`.
- `packages/db/scripts/smoke-rbac-prod-branch.ts` als `db:smoke:rbac:prod`.
- HTTP-Konstanten aus `@invessiv/common/constants/http/`: `HttpHeaderName` um `Accept` und `Authorization` ergänzen
  (samt Test); Fehlermeldungen nennen nur Methode, Pfad und Status, nie den Antworttext.

## Tests

- `neon-branch.test.ts` mit gestubbtem `fetch`: Request-Body (Parent, Name, `expires_at`), Polling bis `finished`,
  Löschen bei fehlgeschlagener Operation, fehlende Variablen ohne API-Aufruf, API-Fehler nur mit Status.
- `smoke-rbac-prod-branch.test.ts`: Smoke läuft mit der Branch-URL, nie mit der Produktions-URL; Branch wird auch
  bei fehlgeschlagener Prüfung gelöscht; ein Löschfehler überdeckt das Ergebnis nicht; ohne Branch kein Smoke.
- Einmal echt laufen lassen und danach in der Neon-Konsole prüfen, dass kein `smoke-rbac-*`-Branch übrig ist.

## Doku

- `packages/db/AGENTS.md`, Abschnitt „Skripte“: Produktion bleibt schreibfrei, der RBAC-Smoke erreicht sie nur
  über den Branch.
- Release-Checklisten (z. B. Plan 29.2) nennen `db:smoke:rbac:prod` dann wieder neben `db:smoke:prod`.
