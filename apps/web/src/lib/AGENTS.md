# AGENTS.md — apps/web/src/lib

Logik-/Hilfsmodule der Web-App. Ergänzt die Root-`AGENTS.md`; bei Konflikt gilt die spezifischere Datei im Pfad.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Typen & Konstanten (verbindlich)

- Auf **Modulebene** werden in Logik-Dateien dieses Ordners **keine** Typen (`type`/`interface`) und **keine**
  benannten Konstanten/Objekt-Maps deklariert. Die UI-`XxxProps`-Ausnahme gilt **nur** in `.tsx`-Komponenten,
  hier gibt es **keine** Ausnahme.
- Sie wandern vor Fertigstellung nach `apps/web/common` (app-spezifisch) bzw. `packages/common`
  (app-übergreifend) — auch bei aktuell nur einmaliger Nutzung:
  - Datentypen/DTOs/Shapes → `common/contracts/`
  - String-Unions, Status-/Kind-/Variant-Werte, Event-Namen, Storage-Keys → `common/constants/`
    (Const-Objekt-Pattern, siehe `packages/common/AGENTS.md`)
  - Default-/Initialwerte → `common/defaults/`
- Selbstcheck: Wird der Typ/die Konstante von mehr als dieser Datei referenziert **oder** bildet sie ein
  Domänenkonzept ab (Status, Variante, DTO, Konfig)? → nach `common`.

## Checks vor Abschluss

- `pnpm -r typecheck`, `pnpm -r lint` grün.
- Keine Modulebene-Typen/-Konstanten in diesem Ordner; sie liegen in `common`.
