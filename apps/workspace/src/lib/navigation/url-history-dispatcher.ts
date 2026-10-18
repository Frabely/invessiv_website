type HistoryListener = (event: PopStateEvent) => void;

const listeners = new Set<HistoryListener>();
let initialized = false;

/**
 * Window is the event target for popstate, so capture does not put a late listener ahead of
 * Next's listener. Register before hydration; subscriptions can then arrive with streamed pages.
 */
export function initializeUrlHistoryDispatcher() {
  if (initialized) return;
  window.addEventListener("popstate", (event) => {
    for (const listener of listeners) {
      listener(event);
      if (event.cancelBubble) break;
    }
  });
  initialized = true;
}

/** The early listener stays idle whenever no URL view or navigation guard is mounted. */
export function subscribeUrlHistory(listener: HistoryListener) {
  initializeUrlHistoryDispatcher();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
