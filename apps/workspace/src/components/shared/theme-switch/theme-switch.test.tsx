// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeSwitch } from "./theme-switch";

describe("ThemeSwitch", () => {
  it("renders current and action copy and triggers toggles", () => {
    const onToggle = vi.fn();

    render(
      <ThemeSwitch
        copy={{ actionLabel: "Zu Light wechseln" }}
        onToggle={onToggle}
        theme="dark"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Zu Light wechseln" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
