// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { customerDetailFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerCockpitView } from "./customer-cockpit-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("CustomerCockpitView", () => {
  afterEach(cleanup);

  it("renders the empty projects state without a dialog shell", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");

    render(
      <CustomerCockpitView
        content={content}
        customer={customer}
        projects={[]}
      />,
    );

    expect(screen.getAllByText(content.projects.empty)).toHaveLength(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
