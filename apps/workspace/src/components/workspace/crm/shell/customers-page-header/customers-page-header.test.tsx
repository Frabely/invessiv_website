// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getCrmShellDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomersPageHeader } from "./customers-page-header";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

const content = getCrmShellDictionary("de");

describe("CustomersPageHeader", () => {
  afterEach(() => {
    cleanup();
    mocks.push.mockReset();
  });

  it("shows archived customers through an unchecked URL-based filter", () => {
    render(
      <CustomersPageHeader
        archivedToggleHref="/de/crm?archived=true"
        content={content}
        createHref="/de/crm?mode=create"
        includeArchived={false}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: content.includeArchived,
    });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mocks.push).toHaveBeenCalledWith("/de/crm?archived=true", {
      scroll: false,
    });
  });
});
