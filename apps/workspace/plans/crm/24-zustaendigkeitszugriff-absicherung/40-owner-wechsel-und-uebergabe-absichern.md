# Task 40 — Owner-Wechsel und Übergabe absichern

> **Merge-Einheit:** Ordner 24 · **Branch:** `feat/crm-zustaendigkeitszugriff-absicherung` · **Aufwand:** M ·
> **Abhängigkeiten:** Task 08a, Task 02f und Task 38 · **Migration:** keine

## Ausgangslage

Der Owner ohne Zugriff wird in Ordner 07c erkannt und angezeigt. Die dortige Auswertung darf bestehende
Zuständigkeiten nicht nachträglich blockieren. Es fehlt aber die serverseitige Absicherung der zukünftigen
Schreibwege: Ein Owner-Wechsel oder eine Übergabe darf kein Mitglied als zuständig speichern, das die Akte nicht
öffnen kann.

## Umfang

### Kanonische Ownership-Registry

- Die bestehende Registry unter `server/workspace/access/services/responsibilities/` wird zum einzigen
  `OwnershipAdapter`-Register erweitert.
- Jeder Adapter deklariert `requiredPermission` und `scopeOf(entityId)`; neue besitzbare Entitäten brechen ohne
  vollständigen Adapter den Typecheck.
- Die parallele reine Auswertung aus `server/workspace/shared/services/` wird auf diese Registry zurückgeführt.

### Serverabsicherung

- Neuer Fehlercode `HANDOVER_TARGET_WITHOUT_ACCESS` mit HTTP 422.
- Jeder Einzel-Owner-Wechsel und die atomare Mitgliedsübergabe prüfen vor einem Write, ob das aktive Zielmitglied für
  jede betroffene Entität `canOn(requiredPermission, scopeOf(entityId))` erfüllt.
- Ein abgewiesenes Ziel erzeugt keinen Write, keine Activity und kein Security-Event. Bei einer Sammelübergabe bleibt
  der gesamte Vorgang atomar.

### Oberfläche

- Der Badge und der Zähler führen bei aktiven Zielmitgliedern weiter direkt in die Zugriffsverwaltung.
- Bei inaktiven Zuständigen wird ein Übergabeflow ergänzt; er bietet nur aktive, berechtigte Ziele an und bewahrt die
  Auswahl bei Konflikten.
- DE und EN enthalten Loading-, Empty-, 422-, 409- und sonstige Fehlerzustände.

## Tests

- a customer owner change to a member without access returns 422 with `HANDOVER_TARGET_WITHOUT_ACCESS`
- a project handover to a member without access returns 422 without a write
- a mixed handover rolls back every entity when one target permission is missing
- the badge offers access for active owners and handover for inactive owners
- the member-list counter and the badged records remain consistent after access is granted or responsibility is
  transferred

## Akzeptanz

- Eine unwirksame Zuständigkeit kann nicht neu entstehen.
- Jede sichtbare Zuständigkeit ohne Zugriff ist an ihrem Fundort behebbar.
- Ownership- und Access-Logik sind je Entität nur einmal registriert.
