# AGENTS.md — Workspace API-Routen

Gilt für `apps/workspace/src/app/api/**`. Ergänzt die projektweiten Regeln für Route Handler.

## Query-Parameter

- Namen von Query-Parametern werden immer aus einem Const-Objekt unter `src/common/constants/**` importiert. Route
  Handler schreiben keine Query-Parameter-Namen als String-Literal und legen keine lokalen Duplikate an.
- Ein Const-Objekt darf zwischen Page und API geteilt werden, wenn beide denselben URL-Vertrag verwenden. Die Route
  liest den Wert ausschließlich über den benannten Eintrag (z. B. `CustomerListQueryParam.IncludeArchived`).
