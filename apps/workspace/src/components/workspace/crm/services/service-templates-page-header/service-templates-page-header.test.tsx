// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceTemplatesPageHeader } from "./service-templates-page-header";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ServiceTemplatesPageHeader", () => {
  it("navigates when the archive filter changes", () => {
    const content = getCrmServicesDictionary("en");

    render(
      <ServiceTemplatesPageHeader
        archivedToggleHref="/en/crm/services?includeArchived=true"
        content={content}
        createHref={null}
        includeArchived={false}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox"));

    expect(push).toHaveBeenCalledWith("/en/crm/services?includeArchived=true", {
      scroll: false,
    });
    expect(
      screen.queryByRole("link", { name: content.shell.createAction }),
    ).toBeNull();
  });
});
