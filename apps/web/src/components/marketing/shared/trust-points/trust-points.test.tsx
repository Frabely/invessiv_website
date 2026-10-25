// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrustPoints } from "./trust-points";

describe("TrustPoints", () => {
  it("renders each point with a decorative icon", () => {
    render(
      <TrustPoints
        ariaLabel="Highlights"
        points={[
          { iconKey: "free", label: "Kostenlos" },
          { iconKey: "noAccount", label: "Ohne Account" },
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: "Highlights" });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe("Kostenlos");
    expect(list.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
  });

  it("renders nothing without points", () => {
    const { container } = render(<TrustPoints points={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
