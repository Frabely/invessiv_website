// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import {
  portalOnboardingBlock as block,
  portalOnboardingChoices as choices,
  portalOnboardingField as field,
  portalOnboardingForm,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";
import {
  getPortalFilesDictionary,
  getPortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { OnboardingFormView } from "./onboarding-form-view";

type QueueOptions = { onUploadedAction?: (file: PortalFileDto) => void };

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  saveAnswer: vi.fn(),
  submit: vi.fn(),
  addGroupEntry: vi.fn(),
  removeGroupEntry: vi.fn(),
  moveGroupEntry: vi.fn(),
  attachFile: vi.fn(),
  detachFile: vi.fn(),
  confirmServices: vi.fn(),
  queueOptions: [] as unknown[],
}));

const PATH = "/en/portal/customer-1/onboarding/form-1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => PATH,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/client/portal/portal-onboarding-api-service", () => ({
  portalOnboardingApiService: {
    saveAnswer: mocks.saveAnswer,
    submit: mocks.submit,
    addGroupEntry: mocks.addGroupEntry,
    removeGroupEntry: mocks.removeGroupEntry,
    moveGroupEntry: mocks.moveGroupEntry,
    attachFile: mocks.attachFile,
    detachFile: mocks.detachFile,
    confirmServices: mocks.confirmServices,
  },
}));
vi.mock("@/hooks/shared/use-upload-queue", () => ({
  useUploadQueue: (_transport: unknown, options: unknown) => {
    mocks.queueOptions.push(options);
    return {
      items: [],
      isActive: false,
      stage: vi.fn(),
      start: vi.fn(),
      cancel: vi.fn(),
      remove: vi.fn(),
      retry: vi.fn(),
    };
  },
}));

const content = getPortalOnboardingDictionary("en");
const filesContent = getPortalFilesDictionary("en");
const REQUIRED = { requirement: QuestionnaireFieldRequirement.Required };
const SAVED = {
  ok: true,
  value: { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" },
} as const;

const TEAM = field("Team", {
  type: T.Group,
  children: [
    field("Member", { parentFieldId: "Team", label: "Member name" }),
    field("Role", { parentFieldId: "Team", label: "Role" }),
  ],
});

function entry(id: string, position: number, fieldId = "Team") {
  return { id, fieldId, position };
}

function entryAnswer(
  fieldId: string,
  groupEntryId: string,
  value: string,
): QuestionnaireAnswerDto {
  return { fieldId, groupEntryId, sortOrder: 0, value, choiceId: null };
}

function link(
  id: string,
  fileId: string,
  displayName: string,
  overrides: Partial<QuestionnaireAnswerFileDto> = {},
): QuestionnaireAnswerFileDto {
  return {
    id,
    fieldId: "Logo",
    groupEntryId: null,
    position: 0,
    file: {
      id: fileId,
      displayName,
      assetKind: AssetKind.Image,
      source: FileSource.Upload,
      extension: "png",
      sizeBytes: 2_048,
      url: null,
      note: null,
      createdAt: "2026-10-01T10:00:00.000Z",
    },
    ...overrides,
  };
}

function formOf(
  fields: Parameters<typeof block>[1],
  overrides: Partial<PortalOnboardingFormDto> = {},
): PortalOnboardingFormDto {
  return portalOnboardingForm([block("Company", fields)], overrides);
}

function renderView(dto: PortalOnboardingFormDto, canUpload = true) {
  return render(
    <OnboardingFormView
      backHref="/en/portal/customer-1"
      canUpload={canUpload}
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      filesContent={filesContent}
      form={dto}
      locale="en"
    />,
  );
}

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
    await vi.advanceTimersByTimeAsync(0);
  });
}

/** Finishes an upload in the newest upload queue, as the portal upload would. */
async function finishUpload(fileId: string) {
  await act(async () => {
    (mocks.queueOptions.at(-1) as QueueOptions).onUploadedAction?.({
      id: fileId,
    } as PortalFileDto);
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("OnboardingFormView field types of the full form", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    mocks.queueOptions = [];
    mocks.saveAnswer.mockResolvedValue(SAVED);
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
    window.history.replaceState(null, "", PATH);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe("group", () => {
    it("shows the stored entries in order with their own answers", () => {
      renderView(
        formOf([TEAM], {
          groupEntries: [entry("e-2", 1), entry("e-1", 0)],
          answers: [
            entryAnswer("Member", "e-1", "Ada"),
            entryAnswer("Member", "e-2", "Grace"),
          ],
        }),
      );

      const first = screen.getByRole("group", { name: "Entry 1" });
      const second = screen.getByRole("group", { name: "Entry 2" });
      expect(
        within(first).getByRole("textbox", { name: /Member name/ }),
      ).toHaveValue("Ada");
      expect(
        within(second).getByRole("textbox", { name: /Member name/ }),
      ).toHaveValue("Grace");
    });

    it("adds an entry with an id made here and moves the focus into it", async () => {
      mocks.addGroupEntry.mockImplementation(
        async (_customer, _form, request: { id: string }) => ({
          ok: true,
          value: [entry(request.id, 0)],
        }),
      );
      renderView(formOf([TEAM]));
      expect(screen.getByText(content.field.group.empty)).toBeInTheDocument();

      await click(
        screen.getByRole("button", { name: content.field.group.add }),
      );

      expect(mocks.addGroupEntry).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        { id: expect.stringMatching(/^[0-9a-f-]{36}$/), fieldId: "Team" },
      );
      const added = screen.getByRole("group", { name: "Entry 1" });
      expect(
        within(added).getByRole("textbox", { name: /Member name/ }),
      ).toHaveFocus();
      expect(screen.getByText("Entry 1 added")).toHaveAttribute(
        "aria-live",
        "polite",
      );
    });

    it("saves a sub-field answer for its entry, but only once the entry exists", async () => {
      let created: (value: unknown) => void = () => undefined;
      mocks.addGroupEntry.mockImplementation(
        (_customer, _form, request: { id: string }) =>
          new Promise((resolve) => {
            created = () =>
              resolve({ ok: true, value: [entry(request.id, 0)] });
          }),
      );
      renderView(formOf([TEAM]));
      await click(
        screen.getByRole("button", { name: content.field.group.add }),
      );
      const name = screen.getByRole("textbox", { name: /Member name/ });

      fireEvent.change(name, { target: { value: "Ada" } });
      fireEvent.blur(name);
      await settle();
      expect(mocks.saveAnswer).not.toHaveBeenCalled();

      await act(async () => {
        created(undefined);
        await vi.advanceTimersByTimeAsync(0);
      });
      const entryId = mocks.addGroupEntry.mock.calls[0][2].id;
      expect(mocks.saveAnswer).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        { fieldId: "Member", groupEntryId: entryId, values: ["Ada"] },
      );
    });

    it("takes a refused entry back and says why at the group", async () => {
      mocks.addGroupEntry.mockResolvedValue({
        ok: false,
        code: E.LimitReached,
      });
      renderView(formOf([TEAM]));

      await click(
        screen.getByRole("button", { name: content.field.group.add }),
      );

      expect(screen.queryByRole("group", { name: "Entry 1" })).toBeNull();
      expect(screen.getByRole("alert")).toHaveTextContent(
        content.errors.limit_reached,
      );
    });

    it("stops offering new entries at the field's maximum", () => {
      renderView(
        formOf([{ ...TEAM, maxItems: 1 }], { groupEntries: [entry("e-1", 0)] }),
      );

      expect(
        screen.getByRole("button", { name: content.field.group.add }),
      ).toBeDisabled();
      expect(
        screen.getByText("Maximum number of entries: 1"),
      ).toBeInTheDocument();
    });

    it("moves an entry and shows the order the server answers with", async () => {
      mocks.moveGroupEntry.mockResolvedValue({
        ok: true,
        value: [entry("e-2", 0), entry("e-1", 1)],
      });
      renderView(
        formOf([TEAM], {
          groupEntries: [entry("e-1", 0), entry("e-2", 1)],
          answers: [
            entryAnswer("Member", "e-1", "Ada"),
            entryAnswer("Member", "e-2", "Grace"),
          ],
        }),
      );
      expect(
        screen.getByRole("button", { name: "Move entry 1 up" }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Move entry 2 down" }),
      ).toBeDisabled();

      await click(screen.getByRole("button", { name: "Move entry 2 up" }));

      expect(mocks.moveGroupEntry).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        "e-2",
        -1,
      );
      expect(
        within(screen.getByRole("group", { name: "Entry 1" })).getByRole(
          "textbox",
          { name: /Member name/ },
        ),
      ).toHaveValue("Grace");
    });

    it("keeps the keyboard focus on the entry that was moved", async () => {
      mocks.moveGroupEntry.mockResolvedValue({
        ok: true,
        value: [entry("e-2", 0), entry("e-1", 1)],
      });
      renderView(
        formOf([TEAM], { groupEntries: [entry("e-1", 0), entry("e-2", 1)] }),
      );
      const up = screen.getByRole("button", { name: "Move entry 2 up" });
      up.focus();

      await click(up);

      // At the top there is no further way up, so the focus goes to the way back down.
      expect(
        screen.getByRole("button", { name: "Move entry 1 down" }),
      ).toHaveFocus();
    });

    it("does not start a second command while one is on its way", async () => {
      let finish: (value: unknown) => void = () => undefined;
      mocks.moveGroupEntry.mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      renderView(
        formOf([TEAM], { groupEntries: [entry("e-1", 0), entry("e-2", 1)] }),
      );
      const up = screen.getByRole("button", { name: "Move entry 2 up" });

      await click(up);
      expect(up).toHaveAttribute("aria-disabled", "true");
      expect(up).not.toBeDisabled();
      await click(up);
      await click(screen.getByRole("button", { name: "Remove entry 1" }));

      expect(mocks.moveGroupEntry).toHaveBeenCalledTimes(1);
      expect(mocks.removeGroupEntry).not.toHaveBeenCalled();
      await act(async () => {
        finish({ ok: true, value: [entry("e-2", 0), entry("e-1", 1)] });
        await vi.advanceTimersByTimeAsync(0);
      });
    });

    it("moves the focus to the add button once an entry is removed", async () => {
      mocks.removeGroupEntry.mockResolvedValue({ ok: true, value: [] });
      renderView(formOf([TEAM], { groupEntries: [entry("e-1", 0)] }));
      const remove = screen.getByRole("button", { name: "Remove entry 1" });
      remove.focus();

      await click(remove);

      expect(
        screen.getByRole("button", { name: content.field.group.add }),
      ).toHaveFocus();
    });

    it("asks before removing an entry that holds answers and removes an empty one at once", async () => {
      mocks.removeGroupEntry
        .mockResolvedValueOnce({ ok: true, value: [entry("e-2", 0)] })
        .mockResolvedValueOnce({ ok: true, value: [] });
      renderView(
        formOf([TEAM], {
          groupEntries: [entry("e-1", 0), entry("e-2", 1)],
          answers: [entryAnswer("Member", "e-1", "Ada")],
        }),
      );

      await click(screen.getByRole("button", { name: "Remove entry 1" }));
      expect(mocks.removeGroupEntry).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", {
          name: content.field.group.removeDialog.title,
        }),
      ).toBeInTheDocument();
      await click(
        screen.getByRole("button", {
          name: content.field.group.removeDialog.confirm,
        }),
      );

      expect(mocks.removeGroupEntry).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        "e-1",
      );
      expect(screen.queryByDisplayValue("Ada")).toBeNull();
      expect(screen.queryByRole("group", { name: "Entry 2" })).toBeNull();

      await click(screen.getByRole("button", { name: "Remove entry 1" }));
      expect(mocks.removeGroupEntry).toHaveBeenCalledTimes(2);
      expect(screen.getByText(content.field.group.empty)).toBeInTheDocument();
    });

    it("counts a required sub-field per entry and jumps to it from the review", async () => {
      renderView(
        formOf(
          [
            {
              ...TEAM,
              children: [
                field("Member", {
                  ...REQUIRED,
                  parentFieldId: "Team",
                  label: "Member name",
                }),
              ],
            },
          ],
          { groupEntries: [entry("e-1", 0)] },
        ),
      );

      await click(screen.getByRole("button", { name: content.steps.next }));
      await click(
        screen.getByRole("button", { name: "Member name in “Company”" }),
      );

      expect(
        within(screen.getByRole("group", { name: "Entry 1" })).getByRole(
          "textbox",
          { name: /Member name/ },
        ),
      ).toHaveFocus();
    });
  });

  describe("files", () => {
    const LOGO = field("Logo", { type: T.Files, label: "Logo" });

    it("lists the files of the field and attaches an uploaded one", async () => {
      mocks.attachFile.mockResolvedValue({
        ok: true,
        value: link("link-2", "file-2", "mark.png", { position: 1 }),
      });
      renderView(
        formOf([LOGO], { answerFiles: [link("link-1", "file-1", "logo.png")] }),
      );
      const files = screen.getByRole("list", { name: "Files for “Logo”" });
      expect(files).toHaveTextContent("logo.png");

      await finishUpload("file-2");

      expect(mocks.attachFile).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        { fieldId: "Logo", groupEntryId: null, fileId: "file-2" },
      );
      expect(
        screen.getByRole("list", { name: "Files for “Logo”" }),
      ).toHaveTextContent("mark.png");
      expect(screen.getByText("mark.png attached")).toHaveAttribute(
        "aria-live",
        "polite",
      );
    });

    it("says at the field why an uploaded file was not attached", async () => {
      mocks.attachFile.mockResolvedValue({ ok: false, code: E.NotAttachable });
      renderView(formOf([LOGO]));

      await finishUpload("file-2");

      expect(screen.getByRole("alert")).toHaveTextContent(
        content.errors.not_attachable,
      );
    });

    it("detaches by the id of the link, not of the file", async () => {
      mocks.detachFile.mockResolvedValue(SAVED);
      renderView(
        formOf([LOGO], { answerFiles: [link("link-1", "file-1", "logo.png")] }),
      );

      await click(screen.getByRole("button", { name: "Remove logo.png" }));

      expect(mocks.detachFile).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        "link-1",
      );
      expect(
        screen.queryByRole("list", { name: "Files for “Logo”" }),
      ).toBeNull();
    });

    it("lets a required files field count once a file is attached", async () => {
      mocks.attachFile.mockResolvedValue({
        ok: true,
        value: link("link-1", "file-1", "logo.png"),
      });
      renderView(formOf([{ ...LOGO, ...REQUIRED }]));

      await finishUpload("file-1");
      await click(screen.getByRole("button", { name: content.steps.next }));

      expect(screen.getByText(content.submit.complete)).toBeInTheDocument();
    });

    it("counts a step as started once it holds a file or a group entry", () => {
      const step = () =>
        within(screen.getByRole("list", { name: content.steps.label }))
          .getByRole("button", { name: "Company" })
          .closest("li");
      const { unmount } = renderView(formOf([LOGO, TEAM]));
      expect(step()).toHaveAttribute("data-progress", "empty");
      unmount();

      renderView(
        formOf([LOGO, TEAM], {
          answerFiles: [link("link-1", "file-1", "logo.png")],
        }),
      );
      expect(step()).toHaveAttribute("data-progress", "complete");
      cleanup();

      renderView(formOf([LOGO, TEAM], { groupEntries: [entry("e-1", 0)] }));
      expect(step()).toHaveAttribute("data-progress", "complete");
    });

    it("offers no upload without the right to upload and says so", () => {
      renderView(formOf([LOGO]), false);

      expect(
        screen.queryByRole("group", { name: content.field.files.dropLabel }),
      ).toBeNull();
      expect(
        screen.getByText(content.field.files.noUpload),
      ).toBeInTheDocument();
    });

    it("keeps the files of a group entry apart", () => {
      renderView(
        formOf(
          [
            {
              ...TEAM,
              children: [
                field("Portrait", {
                  type: T.Files,
                  parentFieldId: "Team",
                  label: "Portrait",
                }),
              ],
            },
          ],
          {
            groupEntries: [entry("e-1", 0), entry("e-2", 1)],
            answerFiles: [
              link("link-1", "file-1", "ada.png", {
                fieldId: "Portrait",
                groupEntryId: "e-1",
              }),
            ],
          },
        ),
      );

      expect(
        within(screen.getByRole("group", { name: "Entry 1" })).getByRole(
          "list",
          { name: "Files for “Portrait”" },
        ),
      ).toHaveTextContent("ada.png");
      expect(
        within(screen.getByRole("group", { name: "Entry 2" })).queryByRole(
          "list",
          { name: "Files for “Portrait”" },
        ),
      ).toBeNull();
    });
  });

  describe("project services", () => {
    const SERVICES = field("Services", {
      ...REQUIRED,
      type: T.ProjectServices,
      label: "Your booked services",
    });
    const booked = {
      services: [
        { title: "Landing page", description: "One page", position: 0 },
        { title: "Maintenance", description: null, position: 1 },
      ],
    };

    it("shows what was booked and confirms it as it is", async () => {
      mocks.confirmServices.mockResolvedValue(SAVED);
      renderView(formOf([SERVICES], booked));
      const list = screen.getByRole("list", {
        name: content.field.services.listLabel,
      });
      expect(list).toHaveTextContent("Landing page");
      expect(list).toHaveTextContent("One page");
      expect(list).toHaveTextContent("Maintenance");

      await click(
        screen.getByRole("radio", { name: content.field.services.fits }),
      );

      expect(mocks.confirmServices).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        null,
      );
      await click(screen.getByRole("button", { name: content.steps.next }));
      expect(screen.getByText(content.submit.complete)).toBeInTheDocument();
    });

    it("needs text for a remark and saves it when the field is left", async () => {
      mocks.confirmServices.mockResolvedValue(SAVED);
      renderView(formOf([SERVICES], booked));

      await click(
        screen.getByRole("radio", { name: content.field.services.remark }),
      );
      const note = screen.getByRole("textbox", {
        name: new RegExp(content.field.services.noteLabel),
      });
      fireEvent.blur(note);
      await settle();
      expect(mocks.confirmServices).not.toHaveBeenCalled();
      expect(
        screen.getByText(content.field.services.noteRequired),
      ).toBeInTheDocument();

      fireEvent.change(note, { target: { value: "Please add a blog." } });
      fireEvent.blur(note);
      await settle();

      expect(mocks.confirmServices).toHaveBeenCalledExactlyOnceWith(
        "customer-1",
        "form-1",
        "Please add a blog.",
      );
    });

    it("opens with the stored confirmation and remark", () => {
      renderView(
        formOf([SERVICES], {
          ...booked,
          servicesConfirmed: true,
          servicesNote: "Please add a blog.",
        }),
      );

      expect(
        screen.getByRole("radio", { name: content.field.services.remark }),
      ).toBeChecked();
      expect(
        screen.getByRole("textbox", {
          name: new RegExp(content.field.services.noteLabel),
        }),
      ).toHaveValue("Please add a blog.");
    });

    it("says at the field when the confirmation could not be saved", async () => {
      mocks.confirmServices.mockResolvedValue({
        ok: false,
        code: E.Unavailable,
      });
      renderView(formOf([SERVICES], booked));

      await click(
        screen.getByRole("radio", { name: content.field.services.fits }),
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        content.errors.unavailable,
      );
      await click(screen.getByRole("button", { name: content.steps.next }));
      expect(screen.queryByText(content.submit.complete)).toBeNull();
    });
  });

  describe("confirmation, colour and scale", () => {
    it("stores a ticked confirmation as true and clears it when unticked", async () => {
      renderView(
        formOf([
          field("Rights", {
            type: T.Confirmation,
            label: "We hold the rights to all images",
          }),
        ]),
      );
      const box = screen.getByRole("checkbox", {
        name: /We hold the rights to all images/,
      });

      await click(box);
      expect(mocks.saveAnswer).toHaveBeenLastCalledWith(
        "customer-1",
        "form-1",
        { fieldId: "Rights", groupEntryId: null, values: ["true"] },
      );
      expect(box).toBeChecked();

      await click(box);
      expect(mocks.saveAnswer).toHaveBeenLastCalledWith(
        "customer-1",
        "form-1",
        { fieldId: "Rights", groupEntryId: null, values: [] },
      );
    });

    it("takes a colour as hex text or from the picker and refuses anything else", async () => {
      renderView(
        formOf([field("Brand", { type: T.Color, label: "Brand colour" })]),
      );
      const hex = screen.getByRole("textbox", { name: /Brand colour/ });

      fireEvent.change(hex, { target: { value: "blue" } });
      fireEvent.blur(hex);
      await settle();
      expect(mocks.saveAnswer).not.toHaveBeenCalled();
      expect(
        screen.getByText(content.field.errors.invalid_color),
      ).toBeInTheDocument();

      // The picker is a visible button, not a bare swatch: its text leads its accessible name.
      expect(screen.getByText("Pick colour")).toBeVisible();
      fireEvent.change(
        screen.getByLabelText("Pick colour for “Brand colour”"),
        {
          target: { value: "#1a2b3c" },
        },
      );
      await settle();
      expect(hex).toHaveValue("#1a2b3c");
      expect(mocks.saveAnswer).toHaveBeenLastCalledWith(
        "customer-1",
        "form-1",
        { fieldId: "Brand", groupEntryId: null, values: ["#1a2b3c"] },
      );
    });

    it("offers five levels between the two poles of a scale", async () => {
      renderView(
        formOf(
          [
            field("Tone", {
              type: T.Scale,
              label: "How should it sound?",
              choices: choices("Tone", "Playful", "Serious"),
            }),
          ],
          {
            answers: [
              {
                fieldId: "Tone",
                groupEntryId: null,
                sortOrder: 0,
                value: "2",
                choiceId: null,
              },
            ],
          },
        ),
      );
      const scale = screen.getByRole("radiogroup", {
        name: /How should it sound\?/,
      });

      expect(within(scale).getAllByRole("radio")).toHaveLength(5);
      expect(scale).toHaveTextContent("Playful");
      expect(scale).toHaveTextContent("Serious");
      expect(
        within(scale).getByRole("radio", { name: "Level 2 of 5" }),
      ).toBeChecked();

      await click(within(scale).getByRole("radio", { name: "Level 4 of 5" }));

      expect(mocks.saveAnswer).toHaveBeenLastCalledWith(
        "customer-1",
        "form-1",
        { fieldId: "Tone", groupEntryId: null, values: ["4"] },
      );
    });
  });

  describe("read view after the submission", () => {
    it("shows entries, files, services, confirmation, colour and scale", () => {
      renderView(
        formOf(
          [
            TEAM,
            field("Logo", { type: T.Files, label: "Logo" }),
            field("Services", { type: T.ProjectServices, label: "Services" }),
            field("Rights", { type: T.Confirmation, label: "Image rights" }),
            field("Brand", { type: T.Color, label: "Brand colour" }),
            field("Tone", {
              type: T.Scale,
              label: "Tone",
              choices: choices("Tone", "Playful", "Serious"),
            }),
          ],
          {
            status: OnboardingFormStatus.Submitted,
            submittedAt: "2026-10-01T10:00:00.000Z",
            editableBlockIds: [],
            groupEntries: [entry("e-1", 0)],
            answers: [
              entryAnswer("Member", "e-1", "Ada"),
              {
                fieldId: "Rights",
                groupEntryId: null,
                sortOrder: 0,
                value: "true",
                choiceId: null,
              },
              {
                fieldId: "Brand",
                groupEntryId: null,
                sortOrder: 0,
                value: "#1A2B3C",
                choiceId: null,
              },
              {
                fieldId: "Tone",
                groupEntryId: null,
                sortOrder: 0,
                value: "4",
                choiceId: null,
              },
            ],
            answerFiles: [link("link-1", "file-1", "logo.png")],
            services: [
              { title: "Landing page", description: null, position: 0 },
            ],
            servicesConfirmed: true,
            servicesNote: "Please add a blog.",
          },
        ),
      );
      const answers = screen.getByRole("region", {
        name: content.read.heading,
      });

      expect(answers).toHaveTextContent("Entry 1");
      expect(answers).toHaveTextContent("Ada");
      expect(
        within(answers).getByRole("list", { name: "Files for “Logo”" }),
      ).toHaveTextContent("logo.png");
      expect(answers).toHaveTextContent("Landing page");
      expect(answers).toHaveTextContent(content.read.servicesConfirmed);
      expect(answers).toHaveTextContent("Please add a blog.");
      expect(answers).toHaveTextContent(content.read.confirmed);
      expect(answers).toHaveTextContent("#1A2B3C");
      expect(answers).toHaveTextContent("4 of 5");
      expect(screen.queryByRole("textbox")).toBeNull();
    });
  });
});
