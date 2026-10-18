# AGENTS.md — apps/workspace/src/hooks

React-Hooks der Workspace-App (wiederkehrende UI-Interaktionslogik: Scroll, Pointer, Observer, Motion …).
Ergänzt die Root-`AGENTS.md`; bei Konflikt gilt die spezifischere Datei im Pfad.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Typen & Konstanten (verbindlich)

- Auf **Modulebene** dürfen **rein lokale, nicht exportierte** Typen (`type`/`interface`) und benannte
  Konstanten/Objekt-Maps stehen, solange sie nur in derselben Datei genutzt werden. **Typen, Konstanten und Patterns
  werden aus Hook-Dateien dieses Ordners nicht exportiert** (der Hook selbst schon).
- Sobald ein Baustein exportiert / von einer anderen Datei genutzt werden muss, wandert er vorher nach
  `apps/workspace/src/common` (app-spezifisch) bzw. `packages/common` (app-übergreifend):
  - Datentypen/Shapes (z. B. Options-/Return-Typen eines Hooks) → `common/contracts/`
  - String-Unions, Status-/Kind-/Variant-Werte, Event-Namen, Storage-Keys → `common/constants/`
    (Const-Objekt-Pattern, siehe `packages/common/AGENTS.md`)
  - Default-/Initialwerte → `common/defaults/`
- Selbstcheck: Muss der Typ/die Konstante exportiert (von einer anderen Datei genutzt) werden **oder** bildet sie ein
  Domänenkonzept ab (Status, Variante, DTO, Konfig)? → nach `common`. Sonst darf sie lokal bleiben.

## Lokaler URL-State (verbindlich)

- Query-Parameter ohne Server-Roundtrip schreiben und lesen ausschließlich über `useUrlSearch`
  (`shared/use-url-search.ts`) bzw. dessen Aufsätze (`usePortalStepSearch`, `useFileSelection`). Kein neuer direkter
  `history.pushState`/`replaceState` in Hooks oder Komponenten, sonst fehlen dem Eintrag die Positionsdaten.
  Bestand, beim nächsten Anfassen umstellen: `workspace/crm/use-customer-files-filter.ts`,
  `workspace/crm/use-credential-project-filter.ts`.
- Jeder Eintrag trägt `__invessivUrlSession` und `__invessivUrlIndex`. Ein Index beschreibt nur Abstände **innerhalb
  derselben Sitzung**; eine andere Seite beginnt ihre eigene Sitzung bei 0. Lehnt ein Guard
  (`useUrlHistoryGuard`) eine Navigation ab, springt der Store nur innerhalb einer Sitzung per `history.go` zurück,
  sonst stellt er die URL an Ort und Stelle wieder her. Nie Indizes verschiedener Sitzungen verrechnen.
- `popstate` läuft über den früh registrierten Dispatcher (`lib/navigation/url-history-dispatcher.ts`, gestartet in
  `instrumentation-client.ts`), damit Guards vor Next.js entscheiden.

## Checks vor Abschluss

- `pnpm -r typecheck`, `pnpm -r lint` grün.
- Keine Modulebene-Typen/-Konstanten in diesem Ordner; sie liegen in `common`.
