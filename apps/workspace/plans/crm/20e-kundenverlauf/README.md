# Ordner 20e — Kundenverlauf

> **Status:** offen · **Abhängigkeiten:** 02, 04, 07 · **Aufwand:** 2–3 Tage · **Reviewziel:** 40–60 Dateien
>
> **Ausgelagert am 08.10.2026** aus Ordner 20, der seitdem nur noch die Stundenkontingente enthält. Der Inhalt ist
> unverändert eine **Skizze** und vor Beginn mit dem Owner zu verfeinern.

## Ziel und Stand nach Merge

**Task-Plan**

- [`29-aktivitaet-und-history.md`](./29-aktivitaet-und-history.md) — Timeline, Pagination und sichere Feldänderungen.

Die Kundenakte zeigt eine konsolidierte, interne Timeline aller bisher gespeicherten CRM-Ereignisse; Änderungen an
Stammdaten erscheinen mit Vorher- und Nachher-Wert, und Notizen lassen sich direkt im Verlauf erfassen.

## Timeline

- Einheitliche chronologische Query über Activities mit stabiler Cursor-Pagination.
- Automatische Activities unveränderlich; eine manuelle Notiz darf bearbeitet werden, die Änderung bleibt als eigenes
  Ereignis erhalten.
- Credential-Inhalte, geheime Notizen, Mailtoken und unnötige PII sind ausgeschlossen.
- Das Portal erhält keine interne Timeline, sondern nur die fachlichen Portalmodule.

## Vor Beginn zu klären

- Die Skizze nennt `update-retainer` als Handler mit Feldänderungen. Diesen Handler gibt es nicht: Ordner 20 schreibt
  seine Activities für Kaufbuchungen, Zuweisungen und Zeitbuchungen selbst (`hoursActivityService`,
  `metadata.entity` = `hour_purchase` | `hour_allocation` | `time_entry`). Die Timeline muss diese drei Entitäten
  darstellen können, statt eigene Einträge zu erzeugen.
- Es gibt im Code nur eine Timeline-Komponente, `ActivityTimeline` unter
  `apps/workspace/src/components/workspace/shared/activity/activity-timeline/`, bisher nur für Leads und auf die
  sechs Legacy-Typen typisiert. Eine Komponente `lead-detail-activities`, auf die die Skizze verweist, existiert nicht.
- Das Repository hat keine Feature-Flag-Infrastruktur; ein Rollback „per Flag“ ist nicht möglich.

## Merge-Gate

- [ ] Activity-Pagination überspringt oder dupliziert keine identischen Zeitstempel.
- [ ] Reveal-Audit zeigt nur Credential-ID und Actor, nie einen Geheimwert.
- [ ] Historische Lead-Activities aus Ordner 02 bleiben vollständig sichtbar.
- [ ] Stunden-Activities aus Ordner 20 erscheinen lesbar, ohne Notiz- oder Beschreibungstext.

## Rollback

Sektion „Verlauf“ im Cockpit nicht mehr rendern. Es entsteht keine Migration; bestehende CRM-Funktionen arbeiten
unabhängig.
