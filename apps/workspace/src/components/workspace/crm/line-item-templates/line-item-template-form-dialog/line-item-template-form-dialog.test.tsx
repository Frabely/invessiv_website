// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getCrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { LineItemTemplateFormDialog } from "./line-item-template-form-dialog";

const api = vi.hoisted(() => ({
  createLineItemTemplate: vi.fn(),
  updateLineItemTemplate: vi.fn(),
}));

vi.mock("@/client/crm/line-item-templates-api-service", () => ({
  lineItemTemplatesApiService: api,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

describe("LineItemTemplateFormDialog", () => {
  afterEach(() => {
    cleanup();
    api.createLineItemTemplate.mockReset();
  });

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

  it("does not send a released template without its customer description", () => {
    const content = getCrmLineItemTemplatesDictionary("en");
    render(
      <LineItemTemplateFormDialog
        closeHref="/en/crm/line-item-templates"
        content={content}
        locale="en"
        lineItemTemplate={null}
      />,
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.fields.title),
      }),
      { target: { value: "Subpage" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.fields.priceCents),
      }),
      { target: { value: "750" } },
    );
    // The customer text can be prepared before the release; it only becomes required with it.
    expect(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.fields.portalDescription),
      }),
    ).not.toBeRequired();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: content.form.fields.portalRequestable,
      }),
    );
    expect(screen.getByText(content.form.hints.portal)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: content.form.buttons.submitCreate }),
    );

    expect(api.createLineItemTemplate).not.toHaveBeenCalled();
    expect(
      screen.getByText(content.form.validation.PORTAL_DESCRIPTION_REQUIRED),
    ).toBeInTheDocument();
  });
});
