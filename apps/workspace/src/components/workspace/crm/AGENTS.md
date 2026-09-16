# AGENTS.md — Workspace CRM (UI)

Gilt für `apps/workspace/src/components/workspace/crm/**`. Ergänzt die Repo-Root-`AGENTS.md` und
`apps/workspace/src/app/[locale]/(app)/crm/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Struktur

- Gruppierte Subfolder nach Verantwortung: `shell/`, `list/`, `form/`, ab Task 05 `detail/`, ab Task 06 `contacts/`.
- Pro Komponente ein Ordner `<gruppe>/<name>/<name>.tsx` mit co-located `<name>.module.css` und Test.
- App-neutrale Grundbausteine (Dialog, Formularfeld, Button, Badge, Empty-State) kommen aus `@invessiv/ui`, nicht aus
  Kopien. Domänenneutrale Workspace-Bausteine erst bei tatsächlicher Wiederverwendung nach `workspace/shared/`.

## Verbindlich

- **Keine Fachlogik im Client.** Eindeutigkeit, Owner, Status und Primärkontakt-Invariante entscheidet der Server.
  Der Dialog validiert nur Format und Pflichtfelder, damit Fehler früh sichtbar sind.
- **Mutationen nur über `src/client/crm/**`** und damit über die API-Routen; danach `router.refresh()`.
- **Versionierte Writes über `useVersionedMutation`:** Ein Konflikt übernimmt den aktuellen Stand und behält die
  Eingaben; nichts wird still verworfen.
- **Schreibaktionen erscheinen nur, wenn die Page ein Ziel übergibt.** Kein deaktivierter Platzhalter.
- **Texte ausschließlich aus `src/i18n/dictionaries/workspace/crm/**`**, DE und EN parallel. Statuswerte werden über
  den Enum-Wert im Dictionary aufgelöst.
- **Kundennummern** nur im View über `formatCustomerNumber` formatieren.
- **Keine PII in URLs, Logs oder Activity-Metadaten.** Query-Parameter tragen ausschließlich IDs und Modi.
- Farben nur über Theme-Tokens, Zustände über `data-*`; Dark und Light gleichwertig, mobil zuerst.
