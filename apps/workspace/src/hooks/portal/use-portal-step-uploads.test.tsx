// @vitest-environment jsdom

import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { StorageTransferResult } from "@/common/contracts/files/storage-transfer-result";
import type { UploadQueueTransport } from "@/common/contracts/files/upload-queue-transport";
import { PortalAttachmentField } from "@/components/portal/shared/portal-attachment-field/portal-attachment-field";
import { useActiveItems } from "@/hooks/shared/use-active-items";
import { getPortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { usePortalOnboardingStep } from "./use-portal-onboarding-step";
import { usePortalStepSearch } from "./use-portal-step-search";

const transfer = vi.hoisted(() => ({ transferToStorage: vi.fn() }));
vi.mock("@/client/shared/storage-transfer", () => ({
  transferToStorage: transfer.transferToStorage,
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const filesContent = getPortalFilesDictionary("en");
const uploadedFile = { id: "upload-1" } as PortalFileDto;
const transport: UploadQueueTransport<PortalFileDto> = {
  createTicket: async () => ({
    ok: true,
    value: {
      file: uploadedFile,
      ticket: { url: "https://store.invalid", method: "PUT", headers: {} },
    },
  }),
  complete: async () => ({ ok: true, value: uploadedFile }),
};

function UploadField({
  onActivityAction,
}: {
  onActivityAction?: (active: boolean) => void;
}) {
  return (
    <PortalAttachmentField
      attachAction={async () => ({
        ok: false,
        message: "Not used in this test",
      })}
      attachments={[]}
      canAttach
      canUpload
      customerId="customer-1"
      detachAction={async () => ({ ok: true })}
      filesContent={filesContent}
      locale="en"
      maxFiles={3}
      onActivityChangeAction={onActivityAction}
      onAttachedAction={() => undefined}
      onDetachedAction={() => undefined}
      texts={{
        listLabel: "Attachments",
        queueLabel: "Uploads",
        dropLabel: "Choose files",
        dropHint: "Screenshots",
        detach: "Remove {name}",
        detachTitle: "Remove file",
      }}
      transport={transport}
    />
  );
}

function Onboarding() {
  const step = usePortalOnboardingStep(["first", "second"]);
  return (
    <>
      <output>{step.section}</output>
      <button onClick={() => step.goTo({ section: "second" })}>
        Next step
      </button>
      <UploadField key={step.section} />
    </>
  );
}

function Feedback() {
  const { search, push } = usePortalStepSearch("round", undefined, true);
  const round = new URLSearchParams(search).get("round") ?? "1";
  const activity = useActiveItems();
  const [secondVisible, setSecondVisible] = useState(true);
  return (
    <>
      <output>{round}</output>
      <button onClick={() => push((params) => params.set("round", "2"))}>
        Next round
      </button>
      <button disabled={activity.isActive}>Submit</button>
      <button onClick={() => setSecondVisible(false)}>
        Remove second field
      </button>
      <div hidden={round !== "1"}>
        <UploadField
          onActivityAction={(active) => activity.track("first", active)}
        />
        {secondVisible ? (
          <UploadField
            onActivityAction={(active) => activity.track("second", active)}
          />
        ) : null}
      </div>
    </>
  );
}

let signals: AbortSignal[];

beforeEach(() => {
  signals = [];
  transfer.transferToStorage.mockImplementation(
    (_ticket, _file, _progress, signal: AbortSignal) =>
      new Promise<StorageTransferResult>((resolve) => {
        signals.push(signal);
        signal.addEventListener("abort", () =>
          resolve({ ok: false, aborted: true }),
        );
      }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  transfer.transferToStorage.mockReset();
  window.history.replaceState(null, "", "/");
});

function startUpload(input: HTMLInputElement) {
  fireEvent.change(input, {
    target: { files: [new File(["image"], "screen.png")] },
  });
}

describe("portal step navigation with real upload fields", () => {
  it.each([false, true])(
    "keeps an upload mounted when history is declined (forward: %s)",
    async (forward) => {
      window.history.replaceState(null, "", "/onboarding?section=first");
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const { container } = render(<Onboarding />);
      fireEvent.click(screen.getByRole("button", { name: "Next step" }));
      if (forward) {
        act(() => window.history.back());
        await waitFor(() =>
          expect(screen.getByRole("status").textContent).toBe("first"),
        );
      }
      const from = forward ? "first" : "second";
      const to = forward ? "second" : "first";
      const input =
        container.querySelector<HTMLInputElement>('input[type="file"]')!;
      startUpload(input);
      await waitFor(() => expect(signals).toHaveLength(1));
      const routerHistory = vi.fn();
      window.addEventListener("popstate", routerHistory);
      try {
        act(() => (forward ? window.history.forward() : window.history.back()));
        await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
        await waitFor(() =>
          expect(window.location.search).toBe(`?section=${from}`),
        );
        expect(confirm).toHaveBeenCalledWith(filesContent.upload.leaveWarning);
        expect(screen.getByRole("status").textContent).toBe(from);
        expect(container.querySelector('input[type="file"]')).toBe(input);
        expect(signals[0].aborted).toBe(false);
        expect(routerHistory).not.toHaveBeenCalled();

        confirm.mockReturnValue(true);
        act(() => (forward ? window.history.forward() : window.history.back()));
        await waitFor(() =>
          expect(screen.getByRole("status").textContent).toBe(to),
        );
        expect(confirm).toHaveBeenCalledTimes(2);
        expect(signals[0].aborted).toBe(true);
        expect(routerHistory).not.toHaveBeenCalled();
      } finally {
        window.removeEventListener("popstate", routerHistory);
      }
    },
  );

  it("keeps feedback uploads alive across local history and aggregates independent fields", async () => {
    window.history.replaceState(null, "", "/feedback?round=1");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { container } = render(<Feedback />);
    const inputs =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    startUpload(inputs[0]);
    startUpload(inputs[1]);
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(
      screen.getByRole("button", { name: "Submit" }).hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next round" }));
    act(() => window.history.back());
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("1"),
    );
    act(() => window.history.forward());
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("2"),
    );
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();

    // Two independently registered queues share one confirmation for the same warning.
    act(() => {
      window.history.pushState(null, "", "/feedback?round=2&project=other");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(confirm).toHaveBeenCalledOnce();
    expect(window.location.search).toBe("?round=2");
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
    confirm.mockClear();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove second field" }),
    );
    expect(signals[1].aborted).toBe(true);
    expect(signals[0].aborted).toBe(false);
    expect(
      screen.getByRole("button", { name: "Submit" }).hasAttribute("disabled"),
    ).toBe(true);

    // A server-owned query change is not a local round switch, even on the same path.
    act(() => {
      window.history.pushState(null, "", "/feedback?round=2&project=other");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(confirm).toHaveBeenCalledOnce();
    expect(window.location.search).toBe("?round=2");
    expect(signals[0].aborted).toBe(false);
  });
});
