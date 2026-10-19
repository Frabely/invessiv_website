// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { UploadQueueItemStatus } from "@invessiv/common/constants/files/upload-queue-item-status";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import {
  getPortalFeedbackDictionary,
  getPortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackPageView } from "./feedback-page-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  saveDraft: vi.fn(),
  submit: vi.fn(),
  approve: vi.fn(),
  uploadActive: false,
  cancelUpload: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => "/en/portal/customer-1/projects/project-1/feedback",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/client/portal/portal-feedback-api-service", () => ({
  portalFeedbackApiService: {
    saveDraft: mocks.saveDraft,
    submit: mocks.submit,
    approve: mocks.approve,
    attachFile: vi.fn(),
    detachFile: vi.fn(),
  },
}));
vi.mock("@/hooks/shared/use-upload-queue", () => ({
  useUploadQueue: () => ({
    items: mocks.uploadActive
      ? [
          {
            id: "upload-1",
            name: "screenshot.png",
            size: 1024,
            assetKind: null,
            status: UploadQueueItemStatus.Uploading,
            progress: 0.5,
            errorCode: null,
            retryable: false,
          },
        ]
      : [],
    isActive: mocks.uploadActive,
    stage: vi.fn(),
    start: vi.fn(),
    cancel: mocks.cancelUpload,
    remove: vi.fn(),
    retry: vi.fn(),
  }),
}));

const content = getPortalFeedbackDictionary("en");
const filesContent = getPortalFilesDictionary("en");

function round(overrides: Partial<PortalFeedbackRoundDto> = {}) {
  return {
    id: "round-1",
    roundNumber: 1,
    status: FeedbackRoundStatus.Open,
    previewUrl: "https://preview.example.test",
    handoverNote: "First complete version",
    dueOn: "2026-10-14",
    areaOptions: ["Home", "Contact"],
    draftUpdatedAt: null,
    draftUpdatedByName: null,
    submittedAt: null,
    customerNotice: null,
    completedAt: null,
    approvedAt: null,
    items: [],
    version: 1,
    ...overrides,
  } satisfies PortalFeedbackRoundDto;
}

function feedback(
  overrides: Partial<PortalProjectFeedbackDto> = {},
): PortalProjectFeedbackDto {
  return {
    projectId: "project-1",
    projectTitle: "Relaunch",
    quota: {
      included: 2,
      used: 1,
      remaining: 1,
      activeRoundNumber: 1,
      approvedRoundNumber: null,
    },
    activeRound: round(),
    history: [],
    canSubmit: true,
    canAttach: false,
    contact: null,
    ...overrides,
  };
}

function renderView(
  dto: PortalProjectFeedbackDto = feedback(),
  canUpload = false,
) {
  return render(
    <FeedbackPageView
      canUpload={canUpload}
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      dashboardHref="/en/portal/customer-1"
      feedback={dto}
      filesContent={filesContent}
      locale="en"
      messagesHref="/en/portal/customer-1?chat=open"
    />,
  );
}

function textareas() {
  return screen.getAllByRole("textbox");
}

function secondRoundFeedback(canAttach = false) {
  return feedback({
    canAttach,
    activeRound: round({
      id: "round-2",
      roundNumber: 2,
      items: [
        {
          id: "item-2",
          version: 1,
          clarifications: [],
          position: 0,
          areaLabel: null,
          kind: null,
          body: "New point",
          result: null,
          resultNote: null,
          attachments: [],
        },
      ],
    }),
    history: [round({ status: FeedbackRoundStatus.Completed })],
    quota: {
      included: 2,
      used: 2,
      remaining: 0,
      activeRoundNumber: 2,
      approvedRoundNumber: null,
    },
  });
}

function historyRound(number: number) {
  act(() => {
    window.history.replaceState(null, "", `?round=${number}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

describe("FeedbackPageView", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.saveDraft.mockReset();
    mocks.submit.mockReset();
    mocks.approve.mockReset();
    mocks.uploadActive = false;
    mocks.cancelUpload.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it("introduces the round with its preview, what is new and the rounds still to come", () => {
    renderView();

    expect(
      screen.getByRole("heading", { level: 1, name: "Feedback on Relaunch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Feedback round 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open preview/ })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByText("First complete version")).toBeInTheDocument();
    const track = screen.getByRole("list", { name: content.steps.label });
    const [current, upcoming] = within(track).getAllByRole("listitem");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(upcoming).toHaveAttribute("data-disabled", "true");
    expect(within(upcoming).queryByRole("button")).toBeNull();
  });

  it("saves the draft debounced and keeps the new version", async () => {
    mocks.saveDraft.mockResolvedValue({
      ok: true,
      round: round({
        version: 2,
        draftUpdatedAt: new Date().toISOString(),
        draftUpdatedByName: "Anna",
      }),
    });
    renderView();

    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));
    fireEvent.change(textareas()[0]!, { target: { value: "Hero too dark" } });
    expect(mocks.saveDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_600);
    });

    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);
    const [, roundId, request] = mocks.saveDraft.mock.calls[0]!;
    expect(roundId).toBe("round-1");
    expect(request.version).toBe(1);
    expect(request.items).toEqual([
      expect.objectContaining({ body: "Hero too dark", areaLabel: null }),
    ]);
    expect(screen.getByText("Saved · just now")).toBeInTheDocument();
    expect(screen.getByText("last edited by Anna")).toBeInTheDocument();
  });

  it("reads an earlier round through the track and keeps the open draft", async () => {
    mocks.saveDraft.mockResolvedValue({
      ok: true,
      round: round({ id: "round-2", roundNumber: 2, version: 2 }),
    });
    renderView(
      feedback({
        activeRound: round({ id: "round-2", roundNumber: 2 }),
        history: [
          round({
            status: FeedbackRoundStatus.Completed,
            completedAt: "2026-09-30T09:00:00.000Z",
            items: [
              {
                id: "old-item",
                version: 1,
                clarifications: [],
                position: 0,
                areaLabel: null,
                kind: null,
                body: "Old point",
                result: "implemented",
                resultNote: null,
                attachments: [],
              },
            ],
          }),
        ],
        quota: {
          included: 2,
          used: 2,
          remaining: 0,
          activeRoundNumber: 2,
          approvedRoundNumber: null,
        },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));
    fireEvent.change(textareas()[0]!, { target: { value: "New point" } });

    fireEvent.click(screen.getByRole("button", { name: /Round 1/ }));

    expect(window.location.search).toBe("?round=1");
    expect(
      screen.getByRole("heading", { level: 2, name: "Feedback round 1" }),
    ).toHaveFocus();
    expect(screen.getByText("Old point")).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: content.actions.submit }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next: round 2" }));

    expect(textareas()[0]).toHaveValue("New point");
    expect(
      screen.queryByRole("button", { name: /save draft/i }),
    ).not.toBeInTheDocument();
  });

  it("focuses and resets the round on the first browser history change after mounting", async () => {
    vi.useRealTimers();
    window.history.replaceState(null, "", "?round=1");
    window.history.pushState(null, "", "?round=2");
    renderView(secondRoundFeedback());
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Feedback round 2",
    });
    const body = heading.closest("section")!.parentElement!;
    expect(heading).not.toHaveFocus();
    body.scrollTop = 300;

    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "Feedback round 1" }),
      ).toHaveFocus();
    });
    expect(body.scrollTop).toBe(0);
    body.scrollTop = 250;
    act(() => {
      window.history.forward();
    });
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
    expect(body.scrollTop).toBe(0);
  });

  it("keeps local history out of router restoration but allows server query and route changes", () => {
    window.history.replaceState(
      null,
      "",
      "/en/portal/customer-1/projects/project-1/feedback?round=2",
    );
    const routerHistory = vi.fn();
    window.addEventListener("popstate", routerHistory);
    try {
      renderView(secondRoundFeedback());
      historyRound(1);
      expect(routerHistory).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { level: 2, name: "Feedback round 1" }),
      ).toHaveFocus();
      act(() => {
        window.history.replaceState(null, "", "?round=1&locale=de");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(routerHistory).toHaveBeenCalledTimes(1);
      act(() => {
        window.history.replaceState(null, "", "/en/portal/customer-1");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(routerHistory).toHaveBeenCalledTimes(2);
    } finally {
      window.removeEventListener("popstate", routerHistory);
    }
  });

  it("keeps uploads mounted and submission blocked across history and track navigation", () => {
    mocks.uploadActive = true;
    window.history.replaceState(null, "", "?round=1");
    renderView(secondRoundFeedback(true), true);
    fireEvent.click(screen.getByRole("button", { name: "Next: round 2" }));
    const input = textareas()[0]!;
    expect(
      screen.getByRole("button", { name: content.actions.submit }),
    ).toBeDisabled();

    historyRound(1);
    expect(input).toBeInTheDocument();
    expect(input).not.toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(mocks.cancelUpload).not.toHaveBeenCalled();

    historyRound(2);
    expect(textareas()[0]).toBe(input);
    expect(
      screen.getByRole("button", { name: content.actions.submit }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Round 1/ }));
    expect(input).not.toBeVisible();
    expect(mocks.cancelUpload).not.toHaveBeenCalled();
  });

  it("shows and retries a failed autosave while an earlier round is read", async () => {
    mocks.saveDraft
      .mockResolvedValueOnce({
        ok: false,
        code: PortalFeedbackErrorCode.Unavailable,
      })
      .mockResolvedValueOnce({
        ok: true,
        round: round({ id: "round-2", roundNumber: 2, version: 2 }),
      });
    renderView(secondRoundFeedback());
    fireEvent.change(textareas()[0]!, { target: { value: "Unsaved change" } });
    fireEvent.click(screen.getByRole("button", { name: /Round 1/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_600);
    });

    expect(screen.getByText(content.draft.failed)).toBeVisible();
    expect(screen.getByText(content.errors.unavailable)).toBeVisible();
    expect(
      screen.getByText("Feedback round 2", { selector: "p" }),
    ).toBeVisible();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: content.draft.retry }),
      );
    });
    expect(mocks.saveDraft).toHaveBeenLastCalledWith(
      "customer-1",
      "round-2",
      expect.objectContaining({
        items: [expect.objectContaining({ body: "Unsaved change" })],
      }),
    );
    expect(screen.queryByText(content.draft.failed)).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Feedback round 1" }),
    ).toBeVisible();
  });

  it("restores a conflicting draft while an earlier round is read", async () => {
    const theirs = round({
      id: "round-2",
      roundNumber: 2,
      version: 3,
      items: [
        {
          id: "item-2",
          version: 1,
          clarifications: [],
          position: 0,
          areaLabel: null,
          kind: null,
          body: "Their change",
          result: null,
          resultNote: null,
          attachments: [],
        },
      ],
    });
    mocks.saveDraft
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: theirs,
      })
      .mockResolvedValueOnce({ ok: true, round: { ...theirs, version: 4 } });
    renderView(secondRoundFeedback());
    fireEvent.change(textareas()[0]!, { target: { value: "My change" } });
    fireEvent.click(screen.getByRole("button", { name: /Round 1/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_600);
    });

    const alert = screen.getByRole("alert");
    expect(alert).toBeVisible();
    expect(alert.parentElement).toHaveAccessibleName("Feedback round 2");
    await act(async () => {
      fireEvent.click(
        within(alert).getByRole("button", {
          name: content.draft.conflict.restore,
        }),
      );
    });
    expect(mocks.saveDraft).toHaveBeenLastCalledWith(
      "customer-1",
      "round-2",
      expect.objectContaining({
        version: 3,
        items: [expect.objectContaining({ body: "My change" })],
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next: round 2" }));
    expect(textareas()[0]).toHaveValue("My change");
  });

  it("shows the other contact's draft on conflict and restores the own text", async () => {
    const theirs = round({
      version: 3,
      draftUpdatedByName: "Ben",
      items: [
        {
          id: "their-item",
          version: 1,
          clarifications: [],
          position: 0,
          areaLabel: "Home",
          kind: FeedbackItemKind.Bug,
          body: "Their text",
          result: null,
          resultNote: null,
          attachments: [],
        },
      ],
    });
    mocks.saveDraft
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: theirs,
      })
      .mockResolvedValueOnce({ ok: true, round: round({ version: 4 }) });
    renderView();

    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));
    fireEvent.change(textareas()[0]!, { target: { value: "My text" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_600);
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(content.draft.conflict.title);
    expect(textareas()[0]).toHaveValue("Their text");

    await act(async () => {
      fireEvent.click(
        within(alert).getByRole("button", {
          name: content.draft.conflict.restore,
        }),
      );
    });

    expect(textareas()[0]).toHaveValue("My text");
    expect(mocks.saveDraft).toHaveBeenLastCalledWith(
      "customer-1",
      "round-1",
      expect.objectContaining({ version: 3 }),
    );
  });

  it("does not submit after a concurrent save conflicts and warns before leaving", async () => {
    let resolveSave!: (value: unknown) => void;
    mocks.saveDraft.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    renderView();
    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));
    fireEvent.change(textareas()[0]!, { target: { value: "My text" } });
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.submit }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.submitDialog.confirm }),
    );

    await act(async () => {
      resolveSave({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: round({ version: 2 }),
      });
    });

    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);
    expect(screen.getByText(content.draft.conflict.title)).toBeVisible();
    const leave = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(leave);
    expect(leave.defaultPrevented).toBe(true);
  });

  it("holds submission while a point has an active file upload", async () => {
    mocks.uploadActive = true;
    renderView(
      feedback({
        canAttach: true,
        activeRound: round({
          items: [
            {
              id: "item-1",
              version: 1,
              clarifications: [],
              position: 0,
              areaLabel: null,
              kind: null,
              body: "Hero too dark",
              result: null,
              resultNote: null,
              attachments: [],
            },
          ],
        }),
      }),
      true,
    );

    expect(
      screen.getByRole("button", { name: content.actions.submit }),
    ).toBeDisabled();
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("submits after saving and reloads the page into the locked state", async () => {
    mocks.saveDraft.mockResolvedValue({
      ok: true,
      round: round({ version: 2 }),
    });
    mocks.submit.mockResolvedValue({
      ok: true,
      round: round({ status: FeedbackRoundStatus.Submitted, version: 3 }),
    });
    renderView();

    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));
    fireEvent.change(textareas()[0]!, { target: { value: "Hero too dark" } });
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.submit }),
    );

    const dialog = screen.getByRole("dialog", {
      name: content.submitDialog.title,
    });
    expect(within(dialog).getAllByText("1 point")).not.toHaveLength(0);
    expect(within(dialog).getByText(content.submitDialog.final)).toBeVisible();

    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole("button", {
          name: content.submitDialog.confirm,
        }),
      );
    });

    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);
    expect(mocks.submit).toHaveBeenCalledWith("customer-1", "round-1", 2);
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("marks items the server found without text", async () => {
    mocks.saveDraft.mockResolvedValue({
      ok: true,
      round: round({ version: 2 }),
    });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_600);
    });
    const itemId = mocks.saveDraft.mock.calls[0]![2].items[0].id as string;
    mocks.submit.mockResolvedValue({
      ok: false,
      code: PortalFeedbackErrorCode.ItemTextRequired,
      itemIds: [itemId],
    });

    fireEvent.click(
      screen.getByRole("button", { name: content.actions.submit }),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: content.submitDialog.confirm }),
      );
    });

    expect(textareas()[0]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(content.editor.bodyRequired)).toBeInTheDocument();
  });

  it("approves without changes only with the confirmation ticked", async () => {
    mocks.approve.mockResolvedValue({
      ok: true,
      round: round({ status: FeedbackRoundStatus.Approved, version: 2 }),
    });
    renderView();

    fireEvent.click(
      screen.getByRole("button", { name: content.actions.approve }),
    );
    const dialog = screen.getByRole("dialog", {
      name: content.approveDialog.title,
    });
    const confirm = within(dialog).getByRole("button", {
      name: content.approveDialog.confirm,
    });
    expect(confirm).toBeDisabled();
    expect(
      within(dialog).getByText(content.approveDialog.description),
    ).toBeVisible();

    fireEvent.click(
      within(dialog).getByRole("checkbox", {
        name: content.approveDialog.checkbox,
      }),
    );
    expect(confirm).toBeEnabled();
    await act(async () => {
      fireEvent.click(confirm);
    });

    expect(mocks.approve).toHaveBeenCalledWith("customer-1", "round-1", 1);
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("offers the approval only while the round has no points", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: content.editor.add }));

    expect(
      screen.queryByRole("button", { name: content.actions.approve }),
    ).not.toBeInTheDocument();
  });

  it("shows a submitted round read-only and customer text as text", () => {
    renderView(
      feedback({
        activeRound: round({
          status: FeedbackRoundStatus.Submitted,
          items: [
            {
              id: "item-1",
              version: 1,
              clarifications: [],
              position: 0,
              areaLabel: null,
              kind: null,
              body: "<script>alert(1)</script>",
              result: null,
              resultNote: null,
              attachments: [],
            },
          ],
        }),
      }),
    );

    expect(
      screen.getByText(content.states.submitted.title),
    ).toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: content.actions.submit }),
    ).not.toBeInTheDocument();
  });

  it("tells no round yet apart from an exhausted quota", () => {
    const { unmount } = renderView(
      feedback({
        activeRound: null,
        quota: {
          included: 2,
          used: 0,
          remaining: 2,
          activeRoundNumber: null,
          approvedRoundNumber: null,
        },
      }),
    );
    expect(screen.getByText(content.states.none.title)).toBeInTheDocument();
    unmount();

    renderView(
      feedback({
        activeRound: null,
        quota: {
          included: 2,
          used: 2,
          remaining: 0,
          activeRoundNumber: null,
          approvedRoundNumber: null,
        },
      }),
    );
    expect(
      screen.getByText(content.states.exhausted.title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.states.exhausted.chatLink }),
    ).toHaveAttribute("href", "/en/portal/customer-1?chat=open");
  });

  it("only reads an open round without the submit right", () => {
    renderView(feedback({ canSubmit: false }));

    expect(screen.getByText(content.page.readOnlyHint)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.editor.add }),
    ).not.toBeInTheDocument();
  });

  it("shows the requested call with the team's note and the chat link", () => {
    renderView(
      feedback({
        activeRound: round({
          status: FeedbackRoundStatus.InDiscussion,
          submittedAt: "2026-09-29T09:00:00.000Z",
          customerNotice: "Does Thursday work?",
          items: [
            {
              id: "item-1",
              version: 1,
              clarifications: [],
              position: 0,
              areaLabel: null,
              kind: null,
              body: "Bigger logo",
              result: null,
              resultNote: null,
              attachments: [],
            },
          ],
        }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: content.states.discussion.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Does Thursday work?")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.states.discussion.chatLink }),
    ).toHaveAttribute("href", "/en/portal/customer-1?chat=open");
    expect(screen.getByText("Bigger logo")).toBeInTheDocument();
  });

  it("puts the handback note above an editable sheet", () => {
    renderView(
      feedback({
        activeRound: round({ customerNotice: "Please add the screenshot" }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: content.states.returned.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Please add the screenshot")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.editor.add }),
    ).toBeInTheDocument();
  });

  it("shows the results of the last round and approves only with the confirmation", async () => {
    const completed = round({
      status: FeedbackRoundStatus.Completed,
      submittedAt: "2026-09-29T09:00:00.000Z",
      completedAt: "2026-09-30T09:00:00.000Z",
      version: 5,
      items: [
        {
          id: "item-1",
          version: 1,
          clarifications: [],
          position: 0,
          areaLabel: null,
          kind: null,
          body: "Members area",
          result: "additional_service",
          resultNote: "Happy to send a quote",
          attachments: [],
        },
      ],
    });
    mocks.approve.mockResolvedValue({
      ok: true,
      round: { ...completed, status: FeedbackRoundStatus.Approved },
    });
    renderView(
      feedback({
        activeRound: null,
        history: [completed],
        quota: {
          included: 1,
          used: 1,
          remaining: 0,
          activeRoundNumber: null,
          approvedRoundNumber: null,
        },
      }),
    );
    expect(
      screen.getByRole("heading", { name: content.states.approvalDue.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.result.choices.additional_service),
    ).toBeInTheDocument();
    expect(screen.getByText("Happy to send a quote")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.states.exhausted.chatLink }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: content.finalApproval.action }),
    );
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", {
      name: content.finalApproveDialog.confirm,
    });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(mocks.approve).toHaveBeenCalledWith("customer-1", "round-1", 5);
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("offers an early approval between rounds as a quiet option", () => {
    renderView(
      feedback({
        activeRound: null,
        history: [
          round({
            status: FeedbackRoundStatus.Completed,
            completedAt: "2026-09-30T09:00:00.000Z",
          }),
        ],
        quota: {
          included: 2,
          used: 1,
          remaining: 1,
          activeRoundNumber: null,
          approvedRoundNumber: null,
        },
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Round 1 is implemented" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.finalApproval.earlyHintOne),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: content.states.exhausted.chatLink }),
    ).not.toBeInTheDocument();
  });
});
