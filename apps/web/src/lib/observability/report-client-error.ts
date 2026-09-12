/**
 * Single place for client-side, non-fatal errors from `try/catch` paths that
 * deliberately continue (e.g. blocked `localStorage`/`sessionStorage`). Instead of
 * swallowing the error silently, it is logged visibly so problems stay debuggable
 * later. The only chokepoint for switching to, say, Sentry without touching every
 * call site.
 */
export function reportClientError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.warn(`[invessiv:${scope}]`, error);
}
