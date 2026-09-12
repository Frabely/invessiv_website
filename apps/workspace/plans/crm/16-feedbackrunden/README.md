# Ordner 16 — Feedbackrunden

> **Status:** offen · **Abhängigkeiten:** 07, 12, 15 · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`22-portal-upload-feedback.md`](./22-portal-upload-feedback.md) — Portalabgabe, Rundenkontingent
  und Zusatzanfrage.
- [`23-feedbackrunden-im-crm.md`](./23-feedbackrunden-im-crm.md) — interne Bearbeitung und Statusfluss.

Kunden können je Projekt Feedbackrunden mit Text und neu hochgeladenen Dokumenten einreichen,
begrenzt durch das Rundenkontingent des Projekts (Default 2). Intern werden sie bearbeitet und
abgeschlossen. Weitere Runden benötigen eine Portal-Anfrage und interne Freigabe. Der Flow ist nach
Merge beidseitig vollständig.

## Ablauf

- Additive Migrationen und Modelle für `feedback_rounds` und `feedback_round_requests`;
  `files.feedback_round_id` und die Exactly-one-Scope-Constraint werden kompatibel um den neuen
  zulässigen Scope erweitert.
- Eine Runde gehört immer zu genau einem Projekt; `project_id` ist Pflicht.
- Keine serverseitigen Entwürfe. Nicht abgesendete Texte liegen lokal im Browser; Uploads laufen
  über eine Upload-Session ohne Rundenbezug und werden erst beim Absenden atomar gebunden.
- Absenden erzeugt atomar eine unveränderliche Runde mit fortlaufender Rundennummer und verknüpften
  Dateien; Status `submitted`. Höchstens eine nicht abgeschlossene Runde je Projekt.
- Intern: `submitted` → `in_progress` → `completed`. Jeder Übergang erzeugt Activity und Notification.
- Abgeschlossene Runde wird nie zurückgesetzt oder bearbeitet. Weitere Punkte gehören zur nächsten.
- Das Kontingent liegt als `projects.included_feedback_rounds` am Projekt (Default 2, entsteht
  bereits in Task 09). Ist es erschöpft, ersetzt eine Zusatzrunden-Anfrage das Formular.
- Interne Freigabe erhöht das Kontingent um genau 1; Preis/Angebot bleibt außerhalb des CRM, eine
  interne Begründung wird protokolliert und ist nie portalöffentlich.
- Keine automatische Änderung der Projektphase.

## UI

- Portal: bisherige Runden, Status, Antwort, neue Einreichung oder Zusatzanfrage.
- CRM: Ungelesen-Zähler, Sammelliste, Kundendetail, verknüpfte Dateien und Statusaktionen.
- Externe Texte ausschließlich als Text, maximal 20.000 Zeichen, keine HTML-/Markdown-Ausführung.

## Merge-Gate

- [ ] Zwei parallele Submits erzeugen nur eine Rundennummer.
- [ ] Eine Runde über dem Kontingent bleibt ohne genehmigte Anfrage gesperrt.
- [ ] Ein Projekt mit erhöhtem Kontingent erlaubt die entsprechende Zahl Runden ohne Anfrage.
- [ ] Zweite Runde ist gesperrt, solange die erste nicht abgeschlossen ist.
- [ ] Doppelte Freigabe erzeugt nicht zwei Zusatzrunden.
- [ ] Eine Runde kann nicht auf ein Projekt eines anderen Kunden zeigen.
- [ ] Abgeschlossene Runde und Dateiliste sind unveränderlich.
- [ ] Cross-Customer-Tests decken Runde, Datei und Anfrage ab.
- [ ] Ausfall der Notification ändert den erfolgreichen Fachwrite nicht; Outbox retried.

## Rollback

Feedbackmodule per Flag ausblenden. Bereits eingereichte Runden bleiben intern lesbar; Dateien und
Projektstatus bleiben unverändert.
