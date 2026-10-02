// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadQueueItemStatus } from "@invessiv/common/constants/files/upload-queue-item-status";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { UploadQueueItem } from "@invessiv/common/contracts/files/upload-queue-item";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { UploadQueueTransport } from "@/common/contracts/files/upload-queue-transport";
import { getPortalFilesDictionary } from "@/i18n/dictionaries/portal";
import {
  PortalAttachmentField,
  type PortalAttachmentFieldProps,
} from "./portal-attachment-field";

type QueueOptions = {
  onUploadedAction?: (file: PortalFileDto) => void;
  maxFiles?: number;
  leaveWarning?: string;
};

const mocks = vi.hoisted(() => ({
  queueItems: [] as unknown[],
  queueActive: false,
  queueOptions: null as unknown,
  queueTransport: null as unknown,
  stage: vi.fn(),
  start: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock("@/hooks/shared/use-upload-queue", () => ({
  useUploadQueue: (transport: unknown, options: unknown) => {
    mocks.queueTransport = transport;
    mocks.queueOptions = options;
    return {
      items: mocks.queueItems,
      isActive: mocks.queueActive,
      stage: mocks.stage,
      start: mocks.start,
      cancel: mocks.cancel,
      remove: vi.fn(),
      retry: vi.fn(),
    };
  },
}));

const filesContent = getPortalFilesDictionary("en");
const TEXTS = {
  listLabel: "Attachments of point 1",
  queueLabel: "Uploads for point 1",
  dropLabel: "Attach file",
  dropHint: "Screenshot, PDF or image",
  detach: "Detach {name} from the point",
  detachTitle: "Detach from the point",
};
const TRANSPORT = {
  createTicket: vi.fn(),
  complete: vi.fn(),
} satisfies UploadQueueTransport<PortalFileDto>;

function attachment(id: string, displayName = `${id}.png`): FileAttachmentDto {
  return {
    id,
    displayName,
    assetKind: AssetKind.Image,
    source: FileSource.Upload,
    extension: "png",
    sizeBytes: 1_024,
    url: null,
    note: null,
    createdAt: "2026-10-01T10:00:00.000Z",
  };
}

function queueItem(status: UploadQueueItemStatus): UploadQueueItem {
  return {
    id: `upload-${status}`,
    name: `${status}.png`,
    size: 1_024,
    assetKind: AssetKind.Image,
    status,
    progress: 0,
    errorCode: null,
    retryable: false,
  };
}

function props(
  overrides: Partial<PortalAttachmentFieldProps> = {},
): PortalAttachmentFieldProps {
  return {
    attachAction: vi.fn(),
    attachments: [],
    canAttach: true,
    canUpload: true,
    customerId: "customer-1",
    detachAction: vi.fn(),
    filesContent,
    locale: "en",
    maxFiles: 3,
    onAttachedAction: vi.fn(),
    onDetachedAction: vi.fn(),
    texts: TEXTS,
    transport: TRANSPORT,
    ...overrides,
  };
}

function fileInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("The file input is not rendered");
  return input;
}

async function selectFiles(files: File[]) {
  await act(async () => {
    fireEvent.change(fileInput(), { target: { files } });
  });
}

async function finishUpload(file: Pick<PortalFileDto, "id">) {
  await act(async () => {
    (mocks.queueOptions as QueueOptions).onUploadedAction?.(
      file as PortalFileDto,
    );
  });
}

describe("PortalAttachmentField", () => {
  beforeEach(() => {
    mocks.queueItems = [];
    mocks.queueActive = false;
    mocks.queueOptions = null;
    mocks.queueTransport = null;
    mocks.stage.mockReset();
    mocks.start.mockReset();
    mocks.cancel.mockReset();
  });
  afterEach(cleanup);

  it("lists the attachments and offers detaching only to those who may attach", () => {
    const { rerender } = render(
      <PortalAttachmentField
        {...props({ attachments: [attachment("file-1")], canAttach: false })}
      />,
    );

    expect(
      screen.getByRole("list", { name: TEXTS.listLabel }),
    ).toHaveTextContent("file-1.png");
    expect(
      screen.queryByRole("button", {
        name: "Detach file-1.png from the point",
      }),
    ).not.toBeInTheDocument();

    rerender(
      <PortalAttachmentField
        {...props({ attachments: [attachment("file-1")] })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Detach file-1.png from the point" }),
    ).toBeInTheDocument();
  });

  it("hands the transport, the remaining slots and the leave warning to the upload queue", () => {
    render(
      <PortalAttachmentField
        {...props({ attachments: [attachment("file-1")], maxFiles: 3 })}
      />,
    );

    expect(mocks.queueTransport).toBe(TRANSPORT);
    expect(mocks.queueOptions).toMatchObject({
      maxFiles: 2,
      leaveWarning: filesContent.upload.leaveWarning,
    });
  });

  it("shows the upload zone only with both rights and while a slot is free", () => {
    const { rerender } = render(
      <PortalAttachmentField {...props({ accept: "image/*" })} />,
    );
    expect(screen.getByRole("group", { name: TEXTS.dropLabel })).toBeVisible();
    expect(fileInput()).toHaveAttribute("accept", "image/*");

    rerender(<PortalAttachmentField {...props({ canUpload: false })} />);
    expect(screen.queryByRole("group", { name: TEXTS.dropLabel })).toBeNull();

    rerender(<PortalAttachmentField {...props({ canAttach: false })} />);
    expect(screen.queryByRole("group", { name: TEXTS.dropLabel })).toBeNull();

    rerender(
      <PortalAttachmentField
        {...props({ attachments: [attachment("file-1")], maxFiles: 1 })}
      />,
    );
    expect(screen.queryByRole("group", { name: TEXTS.dropLabel })).toBeNull();
  });

  it("prepares the target before the upload starts", async () => {
    const prepareAction = vi.fn().mockResolvedValue(true);
    const file = new File(["x"], "shot.png", { type: "image/png" });
    render(<PortalAttachmentField {...props({ prepareAction })} />);

    await selectFiles([file]);

    expect(prepareAction).toHaveBeenCalledTimes(1);
    expect(mocks.stage).toHaveBeenCalledWith([file]);
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });

  it("keeps the files out of the queue when the preparation fails", async () => {
    const prepareAction = vi.fn().mockResolvedValue(false);
    render(<PortalAttachmentField {...props({ prepareAction })} />);

    await selectFiles([new File(["x"], "shot.png", { type: "image/png" })]);

    expect(mocks.stage).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("uploads straight away without a preparation step", async () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    render(<PortalAttachmentField {...props()} />);

    await selectFiles([file]);

    expect(mocks.stage).toHaveBeenCalledWith([file]);
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });

  it("attaches an uploaded file and reports the attachment", async () => {
    const attached = attachment("file-9");
    const attachAction = vi
      .fn()
      .mockResolvedValue({ ok: true, attachment: attached });
    const onAttachedAction = vi.fn();
    render(
      <PortalAttachmentField {...props({ attachAction, onAttachedAction })} />,
    );

    await finishUpload({ id: "file-9" });

    expect(attachAction).toHaveBeenCalledWith({ id: "file-9" });
    expect(onAttachedAction).toHaveBeenCalledWith(attached);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows why an uploaded file could not be attached", async () => {
    const attachAction = vi
      .fn()
      .mockResolvedValue({ ok: false, message: "The limit is reached." });
    const onAttachedAction = vi.fn();
    render(
      <PortalAttachmentField {...props({ attachAction, onAttachedAction })} />,
    );

    await finishUpload({ id: "file-9" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The limit is reached.",
    );
    expect(onAttachedAction).not.toHaveBeenCalled();
  });

  it("detaches a file and reports it", async () => {
    const file = attachment("file-1");
    const detachAction = vi.fn().mockResolvedValue({ ok: true });
    const onDetachedAction = vi.fn();
    render(
      <PortalAttachmentField
        {...props({ attachments: [file], detachAction, onDetachedAction })}
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Detach file-1.png from the point",
        }),
      );
    });

    expect(detachAction).toHaveBeenCalledWith(file);
    expect(onDetachedAction).toHaveBeenCalledWith(file);
  });

  it("keeps the file and shows the reason when detaching is refused", async () => {
    const detachAction = vi
      .fn()
      .mockResolvedValue({ ok: false, message: "The round is locked." });
    const onDetachedAction = vi.fn();
    render(
      <PortalAttachmentField
        {...props({
          attachments: [attachment("file-1")],
          detachAction,
          onDetachedAction,
        })}
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Detach file-1.png from the point",
        }),
      );
    });

    expect(screen.getByRole("alert")).toHaveTextContent("The round is locked.");
    expect(onDetachedAction).not.toHaveBeenCalled();
  });

  it("lists running uploads and drops finished ones", () => {
    mocks.queueItems = [
      queueItem(UploadQueueItemStatus.Uploading),
      queueItem(UploadQueueItemStatus.Done),
    ];
    render(<PortalAttachmentField {...props()} />);

    const queue = screen.getByRole("list", { name: TEXTS.queueLabel });
    expect(queue).toHaveTextContent("uploading.png");
    expect(queue).not.toHaveTextContent("done.png");
  });

  it("reports activity while an upload runs and clears it on unmount", () => {
    mocks.queueActive = true;
    const onActivityChangeAction = vi.fn();
    const { unmount } = render(
      <PortalAttachmentField {...props({ onActivityChangeAction })} />,
    );

    expect(onActivityChangeAction).toHaveBeenLastCalledWith(true);

    unmount();

    expect(onActivityChangeAction).toHaveBeenLastCalledWith(false);
  });

  it("cancels every upload still on its way when it unmounts", () => {
    mocks.queueActive = true;
    mocks.queueItems = [
      queueItem(UploadQueueItemStatus.Queued),
      queueItem(UploadQueueItemStatus.Uploading),
      queueItem(UploadQueueItemStatus.Done),
    ];
    const { unmount } = render(<PortalAttachmentField {...props()} />);

    unmount();

    expect(mocks.cancel.mock.calls).toEqual([
      ["upload-queued"],
      ["upload-uploading"],
    ]);
  });

  it("does not attach a file whose upload finished after the unmount", async () => {
    const attachAction = vi.fn();
    const { unmount } = render(
      <PortalAttachmentField {...props({ attachAction })} />,
    );

    unmount();
    await finishUpload({ id: "file-9" });

    expect(attachAction).not.toHaveBeenCalled();
  });

  it("reports activity while an uploaded file is being attached", async () => {
    let resolveAttach: (value: { ok: false; message: string }) => void = () =>
      undefined;
    const attachAction = vi.fn(
      () =>
        new Promise<{ ok: false; message: string }>((resolve) => {
          resolveAttach = resolve;
        }),
    );
    const onActivityChangeAction = vi.fn();
    render(
      <PortalAttachmentField
        {...props({ attachAction, onActivityChangeAction })}
      />,
    );
    expect(onActivityChangeAction).toHaveBeenLastCalledWith(false);

    await finishUpload({ id: "file-9" });
    expect(onActivityChangeAction).toHaveBeenLastCalledWith(true);

    await act(async () => resolveAttach({ ok: false, message: "No." }));
    expect(onActivityChangeAction).toHaveBeenLastCalledWith(false);
  });
});
