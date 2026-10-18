// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  initializeUrlHistoryDispatcher,
  subscribeUrlHistory,
} from "./url-history-dispatcher";

afterEach(() => vi.restoreAllMocks());

describe("URL history dispatcher", () => {
  it("registers once before a router and intercepts events for later subscribers", () => {
    const add = vi.spyOn(window, "addEventListener");
    initializeUrlHistoryDispatcher();
    initializeUrlHistoryDispatcher();
    expect(add).toHaveBeenCalledTimes(1);

    const router = vi.fn();
    window.addEventListener("popstate", router);
    const guard = vi.fn((event: PopStateEvent) => {
      event.stopImmediatePropagation();
    });
    const unsubscribe = subscribeUrlHistory(guard);
    try {
      window.dispatchEvent(new PopStateEvent("popstate"));
      expect(guard).toHaveBeenCalledOnce();
      expect(router).not.toHaveBeenCalled();

      unsubscribe();
      window.dispatchEvent(new PopStateEvent("popstate"));
      expect(guard).toHaveBeenCalledOnce();
      expect(router).toHaveBeenCalledOnce();
    } finally {
      unsubscribe();
      window.removeEventListener("popstate", router);
    }
  });

  it("allows ordinary navigation to reach the router", () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeUrlHistory(subscriber);
    const router = vi.fn();
    window.addEventListener("popstate", router);
    try {
      window.dispatchEvent(new PopStateEvent("popstate"));
      expect(subscriber).toHaveBeenCalledOnce();
      expect(router).toHaveBeenCalledOnce();
    } finally {
      unsubscribe();
      window.removeEventListener("popstate", router);
    }
  });
});
