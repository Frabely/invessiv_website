# Leads Workspace Todos

- [ ] Dialog refacoren und prüfen ob alles nötig ist:
      es gibt Fehlercodes wie clearErrors(LeadFormDialogField.LastName) -> gibt keine fehlercode für nachname mehr

- [ ] **Pitch-Kanal E-Mail nachziehen** — der Outreach-Pitch-Generator startet mit `instagram` + `linkedin`
      (siehe `apps/workspace/plans/workspace/leads/outreach-pitch-generator.md`). E-Mail soll später das LinkedIn-Template
      mitbenutzen. Zu klären: eigene Betreffzeile (die alte Betreff-Logik wurde entfernt), Template-Variante
      `email.single/team` oder Wiederverwendung der LinkedIn-Dateien, und woher die Icebreaker-Daten kommen, wenn kein
      Social-Profil am Lead hängt.

- [ ] **Websuche als zweite Icebreaker-Quelle prüfen** — für Leads ohne verwertbare Social-Daten (kaum aktive Profile,
      private Accounts). Idee: serverseitige Websuche über Firma/Website als zusätzliche
      `ProfileSnapshot`-Quelle (`source: web_search`), damit der bestehende Ablauf unverändert bleibt. Bewusst nicht in v1,
      weil Suchsnippets keine echten Profilinhalte tragen und das Halluzinationsrisiko für Icebreaker hoch ist. Vor
      Umsetzung an echten Leads gegenprüfen, ob die Trefferqualität reicht.
