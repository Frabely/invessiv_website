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
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { getCrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileUploadDialog } from "./file-upload-dialog";

const api = vi.hoisted(() => ({
  createUpload: vi.fn(),
  completeUpload: vi.fn(),
  transferToStorage: vi.fn(),
}));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: {
    createUpload: api.createUpload,
    completeUpload: api.completeUpload,
  },
}));
vi.mock("@/client/shared/storage-transfer", () => ({
  transferToStorage: api.transferToStorage,
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const content = getCrmFilesDictionary("de");

function pick(files: File[]) {
  const input = screen.getByLabelText<HTMLInputElement>(
    content.upload.dropLabel,
    { selector: "input" },
  );
  Object.defineProperty(input, "files", { value: files, configurable: true });
  fireEvent.change(input);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FileUploadDialog", () => {
  it("applies project, visibility and note to the whole batch and locks them once started", async () => {
    api.createUpload.mockResolvedValue({
      ok: true,
      value: {
        file: { id: "f1" } as FileDto,
        ticket: { url: "https://store", method: "PUT", headers: {} },
      },
    });
    api.transferToStorage.mockResolvedValue({ ok: true });
    api.completeUpload.mockResolvedValue({
      ok: true,
      value: { id: "f1", displayName: "logo.png" } as FileDto,
    });
    const onUploadedAction = vi.fn();
    render(
      <FileUploadDialog
        content={content}
        customerId={CUSTOMER_ID}
        defaultTarget={null}
        locale="de"
        onCloseAction={vi.fn()}
        onUploadedAction={onUploadedAction}
        projects={[{ id: PROJECT_ID, title: "Website" }]}
        targets={[null, PROJECT_ID]}
      />,
    );
    pick([new File(["x"], "logo.png"), new File(["x"], "tool.exe")]);
    expect(
      screen.getByText(content.errors.UNSUPPORTED_EXTENSION),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: content.upload.project }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Website" }));
    fireEvent.click(screen.getByLabelText(content.upload.visible));
    fireEvent.change(screen.getByLabelText(content.upload.note), {
      target: { value: " Final " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: content.upload.startOne }),
    );
    await waitFor(() =>
      expect(onUploadedAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: "f1" }),
      ),
    );
    expect(api.createUpload).toHaveBeenCalledWith(CUSTOMER_ID, {
      displayName: "logo.png",
      sizeBytes: 1,
      projectId: PROJECT_ID,
      visibleToCustomer: true,
      note: "Final",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 von 1 Dateien hochgeladen",
    );
    expect(screen.getByLabelText(content.upload.note)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: content.upload.more }),
    ).toBeVisible();
  });

  it("stages files dropped on the section before the dialog opened", () => {
    render(
      <FileUploadDialog
        content={content}
        customerId={CUSTOMER_ID}
        defaultTarget={PROJECT_ID}
        initialFiles={[new File(["x"], "a.pdf"), new File(["x"], "b.pdf")]}
        locale="de"
        onCloseAction={vi.fn()}
        onUploadedAction={vi.fn()}
        projects={[{ id: PROJECT_ID, title: "Website" }]}
        targets={[PROJECT_ID]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "2 Dateien hochladen" }),
    ).toBeEnabled();
    expect(screen.queryByLabelText(content.upload.project)).toBeNull();
  });
});
