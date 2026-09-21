// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { LineItemTemplateFormDialog } from "./line-item-template-form-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

describe("LineItemTemplateFormDialog", () => {
  it("renders the create fields", () => {
    const content = getCrmLineItemTemplatesDictionary("en");

    render(
      <LineItemTemplateFormDialog
        closeHref="/en/crm/line-item-templates"
        content={content}
        locale="en"
        lineItemTemplate={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: content.form.title.create }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.fields.title),
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(content.form.fields.status)).toBeNull();
  });
});
