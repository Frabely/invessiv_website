// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { LineItemTemplatesPageHeader } from "./line-item-templates-page-header";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("LineItemTemplatesPageHeader", () => {
  it("navigates when the archive filter changes", () => {
    const content = getCrmLineItemTemplatesDictionary("en");

    render(
      <LineItemTemplatesPageHeader
        archivedToggleHref="/en/crm/line-item-templates?includeArchived=true"
        content={content}
        createHref={null}
        includeArchived={false}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox"));

    expect(push).toHaveBeenCalledWith(
      "/en/crm/line-item-templates?includeArchived=true",
      {
        scroll: false,
      },
    );
    expect(
      screen.queryByRole("link", { name: content.shell.createAction }),
    ).toBeNull();
  });
});
