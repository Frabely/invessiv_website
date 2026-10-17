// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileAddDialog } from "./portal-file-add-dialog";

const api = vi.hoisted(() => ({
  createTicket: vi.fn(),
  complete: vi.fn(),
  cancelPending: vi.fn(),
  createLink: vi.fn(),
}));

vi.mock("@/client/portal/portal-files-api-service", () => ({
  portalFilesApiService: {
    uploadTransport: () => ({
      createTicket: api.createTicket,
      complete: api.complete,
      cancelPending: api.cancelPending,
    }),
    createLink: api.createLink,
  },
}));

const content = getPortalFilesDictionary("en");

function openDialog() {
  const handlers = {
    onCloseAction: vi.fn(),
    onCreatedAction: vi.fn(),
    onUploadedAction: vi.fn(),
  };
  render(
    <PortalFileAddDialog
      content={content}
      customerId="customer-1"
      initialProjectId={null}
      locale="en"
      projects={[]}
      {...handlers}
    />,
  );
  return handlers;
}

function chooseFile() {
  fireEvent.change(
    screen.getByLabelText(content.upload.dropLabel, { selector: "input" }),
    { target: { files: [new File(["file"], "logo.png")] } },
  );
}

describe("PortalFileAddDialog", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts with upload and switches the single dialog to links and back", () => {
    openDialog();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(content.add.title);
    expect(
      screen.getByRole("radio", { name: content.add.upload }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(content.upload.dropLabel)).toBeVisible();

    fireEvent.click(screen.getByRole("radio", { name: content.add.link }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("textbox", { name: new RegExp(content.link.url) }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: content.link.submit }));
    expect(screen.getByText(content.link.nameRequired)).toBeVisible();
    expect(screen.getByText(content.link.urlInvalid)).toBeVisible();
    expect(api.createLink).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: content.add.upload }));
    expect(screen.getByText(content.upload.dropLabel)).toBeVisible();
  });

  it("keeps link drafts when discarding them is declined", () => {
    openDialog();
    fireEvent.click(screen.getByRole("radio", { name: content.add.link }));
    fireEvent.change(
      screen.getByRole("textbox", { name: new RegExp(content.link.name) }),
      {
        target: { value: "Brand assets" },
      },
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("radio", { name: content.add.upload }));
    expect(confirm).toHaveBeenCalledWith(content.add.switchWarning);
    expect(
      screen.getByRole("textbox", { name: new RegExp(content.link.name) }),
    ).toHaveValue("Brand assets");
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("radio", { name: content.add.upload }));
    expect(screen.getByText(content.upload.dropLabel)).toBeVisible();
  });

  it("protects picked files and locks switching during an upload, unlocking after failure", async () => {
    let refuseTicket!: () => void;
    api.createTicket.mockImplementation(
      () =>
        new Promise((resolve) => {
          refuseTicket = () =>
            resolve({ ok: false, code: "FILE_STORAGE_UNAVAILABLE" });
        }),
    );
    openDialog();
    chooseFile();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("radio", { name: content.add.link }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByText("logo.png")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: content.upload.startOne }),
    );
    await waitFor(() => expect(api.createTicket).toHaveBeenCalledOnce());
    expect(
      screen.getByRole("radio", { name: content.add.link }),
    ).toBeDisabled();
    refuseTicket();
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: content.add.link }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByText(content.errors.FILE_STORAGE_UNAVAILABLE),
    ).toBeVisible();
  });

  it("locks switching while saving a link and keeps its fields after an error", async () => {
    let refuseLink!: () => void;
    api.createLink.mockImplementation(
      () =>
        new Promise((resolve) => {
          refuseLink = () => resolve({ ok: false, code: "FILE_INTERNAL" });
        }),
    );
    const handlers = openDialog();
    fireEvent.click(screen.getByRole("radio", { name: content.add.link }));
    fireEvent.change(
      screen.getByRole("textbox", { name: new RegExp(content.link.name) }),
      {
        target: { value: "Brand assets" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: new RegExp(content.link.url) }),
      {
        target: { value: "https://example.com/assets" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: content.link.submit }));
    expect(
      screen.getByRole("radio", { name: content.add.upload }),
    ).toBeDisabled();
    refuseLink();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.FILE_INTERNAL,
    );
    expect(
      screen.getByRole("radio", { name: content.add.upload }),
    ).toBeEnabled();
    expect(
      screen.getByRole("textbox", { name: new RegExp(content.link.name) }),
    ).toHaveValue("Brand assets");
    const savedFile = { id: "saved-link", displayName: "Brand assets" };
    api.createLink.mockResolvedValueOnce({ ok: true, value: savedFile });
    fireEvent.click(screen.getByRole("button", { name: content.link.submit }));
    await waitFor(() => expect(handlers.onCloseAction).toHaveBeenCalledOnce());
    expect(handlers.onCreatedAction).toHaveBeenCalledWith(savedFile);
    expect(api.createLink).toHaveBeenLastCalledWith("customer-1", {
      displayName: "Brand assets",
      url: "https://example.com/assets",
      projectId: null,
      note: null,
    });
  });
});
