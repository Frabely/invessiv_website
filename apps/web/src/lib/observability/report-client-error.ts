/**
 * Zentrale Stelle für client-seitige, nicht-fatale Fehler aus `try/catch`-Pfaden,
 * die den Ablauf bewusst fortsetzen (z. B. blockiertes `localStorage`/`sessionStorage`).
 * Statt den Fehler stillschweigend zu verschlucken, wird er sichtbar geloggt, damit
 * sich Probleme später debuggen lassen. Einziger Chokepoint, um später z. B. auf
 * Sentry umzustellen, ohne jede Call-Site anzufassen.
 */
export function reportClientError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.warn(`[invessiv:${scope}]`, error);
}
