# Ordner 16 — Feedbackrunden

> **Status:** offen · **Abhängigkeiten:** 07, 12, 15 · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–110 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`22-portal-upload-feedback.md`](./22-portal-upload-feedback.md) — Portalabgabe, zwei Runden
  und Zusatzanfrage.
- [`23-submissions-im-crm.md`](./23-submissions-im-crm.md) — interne Bearbeitung und Statusfluss.

Kunden können je Projekt zwei reguläre Feedbackrunden mit Text und vorhandenen/neu hochgeladenen
Dokumenten einreichen. Intern werden sie bearbeitet und abgeschlossen. Weitere Runden benötigen
eine Portal-Anfrage und interne Freigabe. Der Flow ist nach Merge beidseitig vollständig.

## Ablauf

- Additive Migration und Modell für `feedback_rounds`; `files.feedback_round_id` und die
  Exactly-one-Scope-Constraint werden kompatibel um den neuen zulässigen Scope erweitert.
- Keine serverseitigen Entwürfe. Nicht abgesendete Texte dürfen lokal im Browser zwischengespeichert
  werden, enthalten aber keine dauerhaft hochgeladenen Dateien.
- Absenden erzeugt atomar eine unveränderliche Runde mit fortlaufender Rundennummer und verknüpften
  Dateien; Status `submitted`.
- Intern: `submitted` → `in_progress` → `completed`. Jeder Übergang erzeugt Activity und Notification.
- Abgeschlossene Runde wird nie zurückgesetzt oder bearbeitet. Weitere Punkte gehören zur nächsten.
- Runden 1 und 2 sind verfügbar. Danach ersetzt eine Zusatzrunden-Anfrage das Formular.
- Interne Freigabe der Anfrage erzeugt exakt eine neue erlaubte Runde; Preis/Angebot bleibt außerhalb
  des CRM, eine interne Begründung wird protokolliert.
- Keine automatische Änderung der Projektphase.

## UI

- Portal: bisherige Runden, Status, Antwort, neue Einreichung oder Zusatzanfrage.
- CRM: Ungelesen-Zähler, Sammelliste, Kundendetail, verknüpfte Dateien und Statusaktionen.
- Externe Texte ausschließlich als Text, maximal 20.000 Zeichen, keine HTML-/Markdown-Ausführung.

## Merge-Gate

- [ ] Zwei parallele Submits erzeugen nur eine Rundennummer.
- [ ] Dritte Runde bleibt ohne genehmigte Anfrage gesperrt.
- [ ] Doppelte Freigabe erzeugt nicht zwei Zusatzrunden.
- [ ] Abgeschlossene Runde und Dateiliste sind unveränderlich.
- [ ] Cross-Customer-Tests decken Runde, Datei und Anfrage ab.
- [ ] Ausfall der Notification ändert den erfolgreichen Fachwrite nicht; Outbox retried.

## Rollback

Feedbackmodule per Flag ausblenden. Bereits eingereichte Runden bleiben intern lesbar; Dateien und
Projektstatus bleiben unverändert.
