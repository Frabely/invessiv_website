// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FeedbackItemText } from "./feedback-item-text";

afterEach(cleanup);

const labels = { showMore: "Ganzen Text anzeigen", showLess: "Text kürzen" };

describe("FeedbackItemText", () => {
  it("renders markup as text and offers no toggle for a short item", () => {
    render(<FeedbackItemText labels={labels} text="<script>x</script> 🙂" />);
    expect(screen.getByText("<script>x</script> 🙂")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("folds a long item and unfolds it on request", () => {
    render(<FeedbackItemText labels={labels} text={"Zeile\n".repeat(10)} />);
    const toggle = screen.getByRole("button", { name: labels.showMore });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: labels.showLess }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
