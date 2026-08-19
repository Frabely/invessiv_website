// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useElementInView } from "./use-element-in-view";

function Fixture() {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const isInView = useElementInView(elementRef);

  return <div data-in-view={isInView} data-testid="target" ref={elementRef} />;
}

describe("useElementInView", () => {
  let intersectionObserverDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    intersectionObserverDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "IntersectionObserver",
    );
    Reflect.deleteProperty(window, "IntersectionObserver");
  });

  afterEach(() => {
    cleanup();

    if (intersectionObserverDescriptor) {
      Object.defineProperty(
        window,
        "IntersectionObserver",
        intersectionObserverDescriptor,
      );
    } else {
      Reflect.deleteProperty(window, "IntersectionObserver");
    }
  });

  it("keeps the content usable when IntersectionObserver is unavailable", async () => {
    render(<Fixture />);

    await waitFor(() => {
      expect(screen.getByTestId("target").dataset.inView).toBe("true");
    });
  });
});
