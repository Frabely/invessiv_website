// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileProjectSelect } from "@invessiv/ui";

afterEach(cleanup);

describe("FileProjectSelect", () => {
  it("maps the customer-wide choice to null and a project choice to its id", () => {
    const change = vi.fn();
    render(
      <FileProjectSelect
        label="Project"
        onChangeAction={change}
        options={[
          { value: "", label: "General" },
          { value: "project-1", label: "Website" },
        ]}
        value="project-1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.click(screen.getByRole("option", { name: "General" }));
    expect(change).toHaveBeenCalledWith(null);
  });
});
