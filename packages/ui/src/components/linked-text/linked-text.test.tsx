// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LinkedText } from "./linked-text";

afterEach(cleanup);

describe("LinkedText", () => {
  it("links http(s) addresses safely and keeps the rest as text", () => {
    render(
      <p>
        <LinkedText text="Siehe https://example.com/a. <b>fett</b>" />
      </p>,
    );
    const link = screen.getByRole("link", { name: "https://example.com/a" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    expect(
      screen.getByText(". <b>fett</b>", { exact: false }),
    ).toBeInTheDocument();
  });
});
