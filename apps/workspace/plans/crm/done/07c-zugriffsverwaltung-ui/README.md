# Ordner 07c — Zugriffsbereiche: Verwaltung in der UI

> **Status:** läuft · **Branch:** `feat/crm-zugriffsverwaltung-ui` · **Abhängigkeit:** Ordner 07b gemerged
> **Aufwand:** 2–3 Tage · **Reviewziel:** 50–80 Dateien · **Folgeeinheit:** Ordner 08 (Aufgaben)

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`../07-projekte/38-zugriffsverwaltung-ui.md`](../07-projekte/38-zugriffsverwaltung-ui.md) — Zugriffs-Dialog in
  Settings, Abschnitt „Zugriff“
  in der Kundenakte, bindbare Rollen im Rollen-Dialog, Markierung „Zuständig ohne Zugriff“, NOT-NULL-Cleanup.

Der Owner konfiguriert in der App, wer bei welchem Kunden oder Projekt was darf: „Rolle X auf Kunde Y“ oder „Rolle X
auf Projekt Z“, mit Vorschau der effektiven Rechte. Ab hier ist die Funktion vollständig nutzbar.

## Umfang

- Settings → Mitglieder → Dialog „Zugriffe“: Liste, Hinzufügen (Kunde, optional Projekt, bindbare Rolle), Entfernen,
  Vorschau der effektiven Rechte am gewählten Kunden/Projekt.
- Kundenakte → Abschnitt „Zugriff“ (nur mit `members.manage`): wer hat hier welche Rolle, Hinzufügen und Entfernen;
  Projektbindungen dieses Kunden gruppiert.
- Rollen-Dialog: Schalter „An Kunden und Projekte vergebbar“; nicht bindbare Permissions dann sichtbar gesperrt mit
  Erklärung; Zurücksetzen bei bestehenden Zuweisungen zeigt den 409-Grund.
- Mitgliederliste: Anzahl gebundener Zuweisungen; Markierung „Keine wirksame Rolle“ berücksichtigt beide Arten.
- Markierung „Zuständig ohne Zugriff“ in Kundenakte, Projekt und Mitgliederliste.
- Cleanup-Migration: `permissions.scopable`, `roles.scope_assignable` und die zwei Spalten in `role_permissions`
  auf `NOT NULL`, nach Nachweis, dass keine `NULL`-Zeile existiert.

## Merge-Gate

- [ ] E2E: Owner gibt Mitglied „Kundenbetreuer“ auf Kunde 1 → Mitglied sieht nur Kunde 1 samt Projekten.
- [ ] E2E: Owner gibt Mitglied „Projekte lesen“ auf Kunde 1 / Projekt 2 → Mitglied sieht Kopf von Kunde 1 und nur
      Projekt 2, keine Ansprechpartner.
- [ ] Nicht bindbare Rollen erscheinen im Zugriffs-Picker sichtbar gesperrt mit Erklärung, nicht versteckt.
- [ ] Die konfliktfeste Entwurfsübernahme bei 409 folgt bewusst erst mit
      [`Task 41`](../24-zustaendigkeitszugriff-absicherung/41-zugriffsbereich-konflikte.md) am Ende des CRM-Plans;
      Entzüge wirken weiterhin beim nächsten Request des Mitglieds.
- [ ] Empty-States erklären, wofür Zugriffe gedacht sind; „noch keine Zuweisung“ und „keine Treffer“ unterscheidbar.
- [ ] Cleanup-Migration bricht mit eindeutiger Meldung ab, falls noch `NULL`-Zeilen existieren.
- [ ] DE/EN vollständig; A11y-Smoke (Tastatur, Fokusfalle, Fokus-Rückgabe), Mobil, Dark und Light.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und Workspace-Build grün.

## Rollback

App-Revert auf Ordner 07b. Zuweisungen bleiben wirksam, sind aber nur noch per API verwaltbar. Die NOT-NULL-Constraints
bleiben stehen; 07b schreibt die Spalten bereits vollständig und ist damit kompatibel.
