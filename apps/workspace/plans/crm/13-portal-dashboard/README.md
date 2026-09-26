# Ordner 13 — Portal-Dashboard

> **Status:** läuft · **Branch:** `feat/portal-dashboard` · **Abhängigkeiten:** 07, 08, 12a, 12b, 12c · **Aufwand:**
> 5–7 Tage · **Reviewziel:** ≈ 130 Dateien in einem PR (bewusst über 120, Begründung im PR; harte Grenze 200)

> **Neufassung 26.09.2026:** Ersetzt den Zuschnitt vom 23.09.2026. Alle Entscheidungen E1–E24 sind mit dem Owner
> geklärt und stehen in [`21-portal-dashboard.md`](./21-portal-dashboard.md), Abschnitt 3. Auth, Zugriffsfilter,
> Shell und Navigation kommen aus Ordner 12a; Portalrollen sind je Kontakt konfigurierbar. Das Dashboard prüft
> deshalb Portal-Permissions statt „jeder Kontakt darf alles“.

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`21-portal-dashboard.md`](./21-portal-dashboard.md) — Portal-Permissions, Widget-Registry, Dashboard-Query,
  Abhaken von Kundenaufgaben, Owner-Portalsicht, Extraktion geteilter Bausteine nach `packages/ui` und Portal-UI.

Das Kundenportal startet mit einem rein widget-basierten Dashboard. Es zeigt alles, was für den Kunden relevant **und
freigegeben** ist, und passt optisch zum bestehenden Workspace-/Cockpit-Design. Jedes Widget öffnet sich je
nach Art als Dialog, klappt auf oder öffnet den Chat-Dock.

Nach dem Merge sind echt: Projekt (Phasenleiste, nächster Schritt, Vorschau-Link, Projektleitung), „Von Ihnen
benötigt“ (abhakbar), „Daran arbeiten wir“, Ansprechpartner und abgeschlossene Projekte. Alle übrigen
kundensichtbaren Core-Features stehen als klar gekennzeichnete Mock-Widgets bereit und werden von ihren Folge-Ordnern
auf echte Daten umgestellt.

## Inhalte und Regeln

- **Widget-Registry** (`PORTAL_WIDGET_LAYOUT`) ist der einzige Einhängepunkt für Portal-Karten: stabiler Key,
  `order` in Zehnerschritten, Spans je Breakpoint, `openMode` (`dialog` | `expand` | `dock` | `none`), Scope
  (Kunde/Projekt). Nicht-Mocks tragen zwingend ihre `requiredPermission`; ohne Permission fehlt das Widget vollständig.
- **Mock-Widgets** (Onboarding, Feedback, Stunden, Nachrichten, Dateien, Leistung anfragen) tragen ein sichtbares
  „Bald verfügbar“-Badge und zeigen **keine erfundenen Werte**, nur Skeleton-/Illustrationsinhalt. Zulässig, weil
  Kunden erst nach dem letzten kundensichtbaren Feature-Ordner eingeladen werden (organisatorisches Rollout-Gate, kein
  Feature-Flag).
- **Neue Portal-Permissions:** `portal.projects.read`, `portal.tasks.read`, `portal.tasks.complete`; `portal_standard`
  wird ergänzt, eigene Portalrollen nicht automatisch.
- **Projekte:** aktive und pausierte im Projekt-Widget (mehrere als Tabs über `?project=`), geplante mit Hinweis
  „startet bald“, abgeschlossene im eigenen Widget. Archivierte und abgebrochene nie. Phasenleiste zeigt denselben
  Stand wie das CRM. Keine Budgets, Stundensätze, Preise oder gebuchten Leistungen.
- **Beide Aufgabenseiten:** „Von Ihnen benötigt“ (`action_side = customer`, projektübergreifend, abhakbar mit
  `portal.tasks.complete`) und „Daran arbeiten wir“ (`action_side = internal AND visible_to_customer`, nur lesen).
  Kein Bearbeitername, kein Status außer offen/erledigt. Filter und Firmenkontext zwingend in der Query über
  `portalAccessCondition`.
- **Abhaken** speichert die Portalmitgliedschaft als Herkunft (additive Spalte, CHECK „genau eine Herkunft“) und
  erzeugt eine Activity; das CRM zeigt „vom Kunden erledigt“. Wiederöffnen nur intern. Die interne Benachrichtigung
  folgt mit Ordner 20c.
- **Ansprechpartner:** Kunden-Owner mit Name, Initialen und E-Mail (`mailto:`); abweichende Projektleitung im
  Projekt-Widget. Name und Mail sind bewusst portalöffentlich; keine Mitarbeiter-IDs, Rollen oder Historie.
- **Owner-Portalsicht:** Der Workspace-Owner öffnet jedes Kundenportal lesend über „Portal ansehen“ im Cockpit.
  Banner „Portalansicht von …“, Schreibaktionen deaktiviert mit Link zurück ins CRM, Security-Event je Aufruf.
  Nicht-Owner erhalten 404. Die Owner-Sicht ersetzt die frühere Idee einer separaten Portalvorschau.
- Der Firmenkontext steht im Pfad; clientseitige Zustände sind nach `customerId` geschlüsselt, damit ein
  Firmenwechsel nie Daten der vorherigen Firma zeigt.
- **Geteilte Bausteine** wandern nach `packages/ui` (Widget-Raster, Widget-Rahmen, Phasenleiste, Chat-Dock) bzw.
  `common/patterns` (Fälligkeit); Cockpit und internes Dashboard bleiben sichtbar unverändert.
- Kein Neuigkeiten-Feed (folgt mit 20c), kein Verschieben von Widgets (eigener späterer Ordner), Renewals bleiben
  intern.

## Merge-Gate

- [ ] Portal-DTO und HTML enthalten keinerlei Finanz-, Leistungs-, Notiz-, Mitarbeiter-ID- oder Rollendaten.
- [ ] Unsichtbare oder interne Aufgaben sind auch über direkte ID nicht abhakbar (404).
- [ ] Ohne `portal.tasks.complete` kein Abhaken (Endpunkt 404, Checkbox fehlt bzw. read-only); fremde Firma 404.
- [ ] Ohne `portal.projects.read` bzw. `portal.tasks.read` fehlt das jeweilige Widget vollständig.
- [ ] Doppelklick/Retry schließt genau einmal ab.
- [ ] Zwei Firmen in zwei Tabs zeigen nie gemischte Daten.
- [ ] Owner-Sicht: nur Owner, nur lesend, Banner, Security-Event je Aufruf; Nicht-Owner 404.
- [ ] Mock-Widgets sind eindeutig als „Bald verfügbar“ gekennzeichnet und zeigen keine erfundenen Werte.
- [ ] Extraktionen ändern Cockpit und internes Dashboard nicht sichtbar (Screenshot-Vergleich).
- [ ] Responsive (360 px ohne horizontales Scrollen), Keyboard, Fokus, DE/EN sowie Dark/Light sind geprüft.
- [ ] Drizzle-Modell deckungsgleich zur Migration (expliziter Review-Punkt).

## Rollback

Die drei Portal-Permissions aus `portal_standard` und eigenen Portalrollen entfernen: Widgets und Endpunkt
verschwinden. Die Owner-Sicht wird über den Revert des Layout-Guards (`requirePortalActor` statt
`requirePortalReader`) abgeschaltet. Spalte und CHECK bleiben (additiv, rückwärtskompatibel). Sichere
Portalidentität und Minimalportal aus Ordner 12a/12b bleiben nutzbar.
