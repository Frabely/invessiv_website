# Leads Workspace Todos

- [ ] Email nicht mehr required -> anderes Identifizierungsmerkmal finden
- [ ] Kategorien "Vereine" und "Andere" zur category-Tabelle hinzufuegen
- [ ] Loading-Spinner in Tabelle fuer Operationen (Pagination, Filterung)
- [ ] Allgemeines Namensfeld statt Name/Vorname/Firma (Kennung/Name: TBD)
- [ ] Lead Import: `email` in `ValidatedLeadImportRow` und Folge-Typen konsistent nachziehen, falls der Import einmal
      ohne E-Mail erlaubt werden soll
- [ ] Lead Dialog: Button fuer Social Profile (LinkedIn, Twitter, etc.) -> Link oeffnet Profil wenn vorhanden
- [ ] Lead Dialog: Button fuer Website Link -> oeffnet Website wenn vorhanden
- [ ] Dialog refacoren und prüfen ob alles nötig ist:
      es gibt Fehlercodes wie clearErrors(LeadFormDialogField.LastName) -> gibt keine fehlercode für nachname mehr
- [ ] Import hat als required spalten firstname,lastname, comapny -> import-leads-dialog.tsx das ist nicht korrekt ->
      nur display name required
