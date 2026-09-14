# Task 37 — Zugriffsbereiche: Filter für Kunden und Projekte

> **Merge-Einheit:** Ordner 07b · **Branch:** `feat/crm-zugriffsfilter-kunden-und-projekte`
> **Aufwand:** L · **Abhängigkeiten:** Task 36 (Ordner 07a); nachgerüstet werden Tasks 02d, 03, 04, 05, 06, 07, 08
> (Lead-Konvertierung), 09, 10, 30
> **Migration:** keine

## Kontext

Task 36 liefert Modell, Actor und Patterns, aber keinen Leser. Dieser Task stellt alle bis Ordner 07 gebauten
CRM-Pfade auf `accessScope`/`canOn` um. Er ist der sicherheitskritische Teil und bekommt deshalb einen eigenen
Review ohne UI-Anteil.

Der Nachrüstumfang ist bewusst auf 04–07 begrenzt: Ab Ordner 08 bauen alle Einheiten von Anfang an mit dem Filter
(Pflicht aus `plans/crm/AGENTS.md`).

## Entscheidungen

| Bereich                    | Entscheidung                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filterort                  | In der Query über `crmAccessCondition`, nie im Rendering und nie als Nachfilter im Speicher (`plans/crm/AGENTS.md`)                                                                                           |
| Schreibpfade               | Handler prüft `canOn` vor dem Write in derselben Transaktion; `updateVersioned` bleibt unverändert. Ein paralleler Bindungsentzug wirkt beim nächsten Request, wie jeder andere Rechteentzug                  |
| Antwort bei Fremdzugriff   | Fehlende Sichtbarkeit ergibt immer 404 (Seite und API). Nur fehlendes Schreibrecht auf einem **sichtbaren** Datensatz ergibt 403                                                                              |
| Bereichs-Gate              | `WORKSPACE_AREA_PERMISSIONS` bleibt die einzige Bereichszuordnung. `requireWorkspaceArea` prüft für CRM-Bereiche `canAnywhere` statt `can`; alle anderen Bereiche unverändert                                 |
| Grundsichtbarkeit          | Kundenkopf-Query gibt Kunden zurück, auf denen oder auf deren Projekten irgendeine wirksame Bindung besteht. Detail-Sektionen rendern nur mit ihrer Permission am passenden Scope                             |
| Kundenliste                | Zeigt Kunden aus `accessScope(customers.read)` plus Kunden mit Grundsichtbarkeit; letztere nur mit Kopfdaten, ohne Primärkontakt und Owner                                                                    |
| Facetten                   | Facettenwerte und Zähler werden mit derselben Scope-Bedingung berechnet — sonst verraten Zähler fremde Kunden                                                                                                 |
| Personen                   | Freie Suche nur über Personen, die einem Kunden mit `customers.read` zugeordnet sind. Exakte E-Mail-Dublettenprüfung bleibt global und liefert nur Anzeigename und Personen-ID, damit keine Dublette entsteht |
| Owner-Auswahl              | Mitglieder-Picker für Kunden- oder Projekt-Owner listet nur Mitglieder mit `requiredPermission` auf dem Ziel                                                                                                  |
| Ownership-Adapter          | `OwnershipAdapter` bekommt `requiredPermission` (`customer` → `customers.read`, `project` → `projects.read`) und `scopeOf(entityId)`. Neue Entitäten in 08/11 bringen beides mit (Typecheck)                  |
| Übergabe ohne Zugriff      | 422 `HANDOVER_TARGET_WITHOUT_ACCESS` mit Anzahl je Entität, bevor irgendetwas geschrieben wird                                                                                                                |
| Bestehende Zuständigkeiten | Werden bei Rechteentzug nicht geprüft oder blockiert (Task 36). Die Markierung liefert Task 38                                                                                                                |
| Lead-Konvertierung         | Leads bleiben global. Neuer Kunde verlangt `customers.write` workspace-weit, bestehender Kunde `customers.write` am Ziel                                                                                      |
| Dashboard                  | Enthält das Dashboard bis hierhin CRM-Zahlen, laufen sie über dieselbe Scope-Bedingung wie die Listen                                                                                                         |

## Exhaustive Endpunkt-Registry

```ts
// apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts
CRM_ENDPOINT_ACCESS_RULES = {
  [WorkspaceApiEndpoint.Customers]: {
    read: Permission.CustomersRead,
    scope: "list",
  },
  [WorkspaceApiEndpoint.CustomerDetail]: {
    read: Permission.CustomersRead,
    scope: "customer",
  },
  [WorkspaceApiEndpoint.CustomerContacts]: {
    read: Permission.CustomersRead,
    scope: "customer",
  },
  [WorkspaceApiEndpoint.ProjectDetail]: {
    read: Permission.ProjectsRead,
    scope: "project",
  },
  // …
} satisfies Record<CrmWorkspaceApiEndpoint, CrmEndpointAccessRule>;
```

- `CrmWorkspaceApiEndpoint` ist die Teilmenge aller Endpunkte unter `/api/workspace/customers|projects|people`.
- Ein parametrisierter Integrationstest läuft über die Registry: gebundenes Mitglied, fremder Kunde, fremdes Projekt →
  404; eigener Kunde → 200. Ein neuer Endpunkt ohne Eintrag bricht den Typecheck, ein Eintrag ohne echte Prüfung den
  Test.
- Die Namen oben sind Richtwerte; maßgeblich sind die tatsächlichen `WorkspaceApiEndpoint`-Werte aus 04–07.

## Nachzurüstende Pfade (Checkliste zu Beginn gegen den Code abgleichen)

- [ ] Kundenübersicht und Kundenliste, Count, Pagination, Sortierung, Suche (Task 03, 30)
- [ ] `CUSTOMER_LIST_FACETS` inklusive Projektphase (Task 30, 09)
- [ ] Kundenakte: Kopf, Stammdaten, Kategorie/Tags/Status, Archiv/Reaktivieren, Activities (Task 04, 05, 07)
- [ ] Ansprechpartner: Liste, Anlage, Bearbeitung, Primärwechsel, Personensuche (Task 06)
- [ ] Owner-Wechsel mit Vorschau und atomarer Übernahme (Ordner 05)
- [ ] Lead-Konvertierung neu/bestehend inklusive Kundenauswahl (Task 08)
- [ ] Projekte: Liste, Karten in der Akte, Detail, Anlage, Bearbeitung, Status, Phase, Owner (Task 09, 10)
- [ ] Ownership-Registry, Deaktivierungszählung, Übergabe (Task 02d)
- [ ] Sidebar-Eintrag und Page-Gates der CRM-Routen
- [ ] Dashboard-Zahlen mit CRM-Bezug, falls vorhanden

## Tickets

### CRM-07b-T1 — Registry und Negativtest-Gerüst

- `CRM_ENDPOINT_ACCESS_RULES`, parametrisierter Integrationstest, Seeds aus Task 36 als Fixture.
- **Akzeptanz:** Test ist zunächst rot für jeden noch ungefilterten Endpunkt — er ist die Arbeitsliste der folgenden
  Tickets.

### CRM-07b-T2 — Kunden, Personen, Konvertierung

- Query- und Command-Handler der Checkliste oben auf `crmAccessCondition`/`canOn`; Facetten und Count mit identischer
  Bedingung; Personen-Suche eingeschränkt.
- **Akzeptanz:** Registry-Test für alle Kunden- und Personen-Endpunkte grün; Count = Listenlänge für gebundene
  Mitglieder.

### CRM-07b-T3 — Projekte und Vererbung

- Projekt-Handler; Projektbindung ohne Kundenbindung zeigt nur Köpfe.
- **Akzeptanz:** Kundenbindung sieht ein nach der Zuweisung angelegtes Projekt; Projektbindung sieht das Nachbarprojekt
  nicht.

### CRM-07b-T4 — Zuständigkeit und Bereichs-Gate

- `requiredPermission` und `scopeOf` an allen Adaptern; Prüfung in Zuweisung, Owner-Wechsel, Übergabe; Owner-Picker.
- `requireWorkspaceArea` mit `canAnywhere` für CRM-Bereiche; Sidebar.
- **Akzeptanz:** Übergabe an Mitglied ohne Zugriff 422 ohne Teilzustand; Mitglied mit nur einer Projektbindung sieht
  den CRM-Bereich, Mitglied ohne jede CRM-Bindung nicht.

### CRM-07b-T5 — Scoped Regeln am Zielcode

- `AGENTS.md` in `src/server/workspace/crm/` und `src/server/workspace/shared/`: Filterpflicht, Registry-Eintrag,
  404-Regel, Grundsichtbarkeit.

## Nicht Teil dieses Tasks

- UI für Zuweisungen, Rollen-Dialog, Markierung „Zuständig ohne Zugriff“ → Task 38
- Aufgaben, Renewals, Dateien, Chat, Zugangsdaten, Stunden → bauen ab Ordner 08 selbst mit Filter
