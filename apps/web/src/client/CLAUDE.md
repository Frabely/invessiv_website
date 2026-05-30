# CLAUDE.md - Client Layer Architektur

## Zweck

Der `client`-Layer bündelt browserseitige Services, die von UI-Komponenten aufgerufen werden.

## Struktur

- Fachliche Unterordner sind bevorzugt, z. B. `linkedin-post/services/`.
- Service-Dateien enthalten die Fetch-/Submit-Logik und die Response-Validierung.
- Exportiert wird standardmäßig ein Service-Objekt, nicht eine lose Funktionssammlung.

## Export-Konvention

- Öffentliche Methoden werden am Service-Objekt gruppiert.
- Einzelne Hilfsfunktionen bleiben intern, wenn sie nur dem Service dienen.
- Signaturen bleiben typisiert und nah am Shared DTO.

## Lokale Konventionen

- Client-Services werden mit Tests direkt neben der Implementierung abgesichert.
- Umbauten im Client-Baum sollten immer die Pfadstruktur und die Aufrufer gemeinsam aktualisieren.
- Bei neuen Services zuerst prüfen, ob ein vorhandener fachlicher Unterordner wiederverwendet werden kann.
