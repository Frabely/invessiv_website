# AGENTS.md — apps/web/src/lib

Logik-/Hilfsmodule der Web-App. Ergänzt die Root-`AGENTS.md`; bei Konflikt gilt die spezifischere Datei im Pfad.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Typen & Konstanten (verbindlich)

- Auf **Modulebene** dürfen **rein lokale, nicht exportierte** Typen (`type`/`interface`) und benannte
  Konstanten/Objekt-Maps stehen, solange sie nur in derselben Datei genutzt werden. **Typen, Konstanten und Patterns
  werden aus Logik-Dateien dieses Ordners nicht exportiert** (Funktionen schon).
- Sobald ein Baustein exportiert / von einer anderen Datei genutzt werden muss, wandert er vorher nach
  `apps/web/common` (app-spezifisch) bzw. `packages/common` (app-übergreifend):
  - Datentypen/DTOs/Shapes → `common/contracts/`
  - String-Unions, Status-/Kind-/Variant-Werte, Event-Namen, Storage-Keys → `common/constants/`
    (Const-Objekt-Pattern, siehe `packages/common/AGENTS.md`)
  - Default-/Initialwerte → `common/defaults/`
- Selbstcheck: Muss der Typ/die Konstante exportiert (von einer anderen Datei genutzt) werden **oder** bildet sie ein
  Domänenkonzept ab (Status, Variante, DTO, Konfig)? → nach `common`. Sonst darf sie lokal bleiben.

## Checks vor Abschluss

- `pnpm -r typecheck`, `pnpm -r lint` grün.
- Keine Modulebene-Typen/-Konstanten in diesem Ordner; sie liegen in `common`.
