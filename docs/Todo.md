# Todo

## I18n Dictionary Rework

- `src/i18n/dictionaries/marketing/home.ts` und ggf. weitere verbleibende Dictionary-`*.ts`-Dateien auf das JSON-Schema umstellen.
- Zielstruktur pro Dictionary: `<sinnvollerName>.de.json` und `<sinnvollerName>.en.json`.
- Vor einer Umstellung prüfen, welche Loader-, Typisierungs- und Importpfade in `src/i18n/get-dictionary.ts` sowie den aufrufenden Modulen angepasst werden muessen.
- Dieses Thema jetzt nicht im laufenden Contact-Form-Task umsetzen, sondern als separates Rework behandeln.
