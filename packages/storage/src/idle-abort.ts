/**
 * An AbortSignal that fires after `timeoutMs` of inactivity, not after a
 * fixed wall-clock duration. Call `keepAlive()` on every unit of progress
 * (e.g. every chunk read from a response body) to postpone the abort, so a
 * large object that is slowly but actively downloading is not cut off for
 * taking longer than the timeout in total. Call `dispose()` once the
 * operation is done — success, failure, or cancellation — so the pending
 * timer does not leak or fire late.
 */
export function createIdleAbort(timeoutMs: number) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const keepAlive = () => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), timeoutMs);
  };
  keepAlive();
  return {
    signal: controller.signal,
    keepAlive,
    dispose: () => clearTimeout(timer),
  };
}
