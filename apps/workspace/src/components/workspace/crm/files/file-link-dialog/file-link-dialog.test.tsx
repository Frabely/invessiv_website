// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileLinkDialog } from "./file-link-dialog";

const api = vi.hoisted(() => ({ createLink: vi.fn() }));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: { createLink: api.createLink },
}));

const content = getCrmFilesDictionary("en");

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FileLinkDialog", () => {
  it("sends visibility and trimmed note with the CRM link", async () => {
    const created = { id: "file-1", displayName: "Project brief" };
    api.createLink.mockResolvedValue({ ok: true, value: created });
    const onCreatedAction = vi.fn();
    render(
      <FileLinkDialog
        content={content}
        customerId="customer-1"
        defaultTarget={null}
        onCloseAction={vi.fn()}
        onCreatedAction={onCreatedAction}
        projects={[]}
        targets={[null]}
      />,
    );
    fireEvent.change(
      screen.getByPlaceholderText(content.link.namePlaceholder),
      {
        target: { value: "Project brief" },
      },
    );
    fireEvent.change(screen.getByPlaceholderText(content.link.urlPlaceholder), {
      target: { value: "https://example.com/brief" },
    });
    fireEvent.click(screen.getByLabelText(content.upload.visible));
    fireEvent.change(screen.getByLabelText(content.upload.note), {
      target: { value: "  Review  " },
    });
    fireEvent.click(screen.getByRole("button", { name: content.link.submit }));
    await waitFor(() => expect(api.createLink).toHaveBeenCalledOnce());
    expect(api.createLink).toHaveBeenCalledWith("customer-1", {
      displayName: "Project brief",
      url: "https://example.com/brief",
      projectId: null,
      visibleToCustomer: true,
      note: "Review",
    });
    expect(onCreatedAction).toHaveBeenCalledWith(created);
  });
});
