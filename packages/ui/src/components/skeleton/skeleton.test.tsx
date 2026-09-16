// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("hides its decorative placeholder from assistive technology", () => {
    render(<Skeleton data-testid="placeholder" />);

    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
