# Ordner 06 — Lead-Konvertierung

> **Status:** im Review · **Abhängigkeiten:** 02, 04 · **Branch:** `feat/crm-lead-konvertierung`

## Ziel und Stand nach Merge

Ein Lead kann direkt aus seinem Detailpanel über den bestehenden Kundendialog als neuer
CRM-Kunde angelegt werden. Kunde, Person, Primärkontakt, Lead-Verknüpfung und Activity-Historie
entstehen atomar. Wiederholte und parallele Requests liefern idempotent denselben Kunden.

Der verbindliche Taskplan steht in [`08-lead-zu-kunde.md`](./08-lead-zu-kunde.md).

## Regeln

- `leads.customer_id` ist der einzige Konvertierungsmarker; der bestehende Status wird bei Bedarf
  auf `won` gesetzt.
- Es gibt weder `customer_type` noch einen Modus für bestehende Kunden, eine Personensuche oder
  einen separaten Konvertierungsdialog.
- Der bestehende Kundendialog wird im Lead-Bereich geöffnet und mit Lead-Stammdaten sowie dem
  Hauptansprechpartner vorbelegt. Fehlende Pflichtangaben werden dort ergänzt.
- Weitere Kontakte, Submissions und Social-Profile bleiben am Lead und werden nicht übernommen.
- Konvertierte Leads sind standardmäßig ausgeblendet und explizit einblendbar.
- Lead und Kunde verlinken nach der Konvertierung gegenseitig aufeinander.

## Merge-Gate

- [ ] Neuer Kunde erfüllt dieselben Invarianten wie die direkte Anlage.
- [ ] Ein gemeinsamer Activity-Eintrag und die übernommene Historie tragen Lead- und Kundenbezug.
- [ ] Retry und parallele Requests erzeugen keine Dubletten.
- [ ] Konvertierte Leads sind standardmäßig ausgeblendet und explizit einblendbar.
- [ ] Route, Mapping, Dialog, Rückverlinkung und Filter sind getestet.
- [ ] Lint, Typecheck, Tests, DB-/CRM-Smokes und Workspace-Build sind grün.

## Folgetask

Das noch fehlende authentifizierte Workspace-E2E-Gerüst bleibt dokumentierter Folgetask. Die
Einheit deckt den Flow bis dahin durch Route-, Komponenten- und DB-Integrationstests ab.

## Rollback

Konvertierungsaktion ausblenden. Bereits gesetzte `customer_id`-Verknüpfungen bleiben gültig und
werden nicht zurückgeschrieben.
