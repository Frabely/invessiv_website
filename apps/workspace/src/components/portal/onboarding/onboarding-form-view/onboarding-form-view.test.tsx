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
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import {
  portalOnboardingAnswer as answer,
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

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  saveAnswer: vi.fn(),
  submit: vi.fn(),
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
  },
}));

const content = getPortalOnboardingDictionary("en");
const filesContent = getPortalFilesDictionary("en");
const REQUIRED = { requirement: QuestionnaireFieldRequirement.Required };
const SAVED = {
  ok: true,
  value: { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" },
} as const;
const AUTOSAVE_MS = 1_500;

function form(
  overrides: Partial<PortalOnboardingFormDto> = {},
): PortalOnboardingFormDto {
  return portalOnboardingForm(
    [
      block("Company", [
        field("Name", REQUIRED),
        field("Shop", { type: T.YesNo, choices: choices("Shop", "Yes", "No") }),
        field("ShopLink", {
          ...REQUIRED,
          label: "Shop link",
          type: T.Url,
          conditionFieldId: "Shop",
          conditionChoiceId: "Shop-Yes",
        }),
      ]),
      block("Brand", [field("Claim", REQUIRED)]),
    ],
    overrides,
  );
}

function renderView(
  dto: PortalOnboardingFormDto = form(),
  cockpitHref: string | null = null,
) {
  return render(
    <OnboardingFormView
      backHref="/en/portal/customer-1"
      canUpload
      cockpitHref={cockpitHref}
      content={content}
      customerId="customer-1"
      filesContent={filesContent}
      form={dto}
      locale="en"
    />,
  );
}

function open(search = "") {
  window.history.replaceState(null, "", PATH + search);
}

function stepButton(name: string) {
  return within(
    screen.getByRole("list", { name: content.steps.label }),
  ).getByRole("button", { name });
}

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("OnboardingFormView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    mocks.saveAnswer.mockResolvedValue(SAVED);
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
    open();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("opens the first block as a step with its stored answers", () => {
    renderView(form({ answers: [answer("Name", { value: "Acme" })] }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Onboarding for Website" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Company" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Acme");
    expect(screen.queryByRole("textbox", { name: /Claim/ })).toBeNull();
  });

  it("lands on the step of the URL after a reload", () => {
    open("?section=Brand");
    renderView(form({ answers: [answer("Claim", { value: "Bold" })] }));

    expect(
      screen.getByRole("heading", { level: 2, name: "Brand" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Claim/ })).toHaveValue("Bold");
  });

  it("moves between steps without blocking on missing answers and focuses the new heading", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: content.steps.next }));

    const heading = screen.getByRole("heading", { level: 2, name: "Brand" });
    expect(heading).toHaveFocus();
    expect(window.location.search).toBe("?section=Brand");
    expect(screen.getByText("Step 2 of 3: Brand")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    fireEvent.click(screen.getByRole("button", { name: content.steps.back }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Company" }),
    ).toHaveFocus();
  });

  it("shows a conditional field as soon as its trigger is chosen and hides it again", async () => {
    renderView();
    expect(screen.queryByRole("textbox", { name: /Shop link/ })).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    expect(
      screen.getByRole("textbox", { name: /Shop link/ }),
    ).toBeInTheDocument();
    await settle();
    expect(mocks.saveAnswer).toHaveBeenCalledWith("customer-1", "form-1", {
      fieldId: "Shop",
      groupEntryId: null,
      choiceIds: ["Shop-Yes"],
    });

    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    expect(screen.queryByRole("textbox", { name: /Shop link/ })).toBeNull();
  });

  it("saves typed text debounced and when the field is left", async () => {
    renderView();
    const name = screen.getByRole("textbox", { name: /Name/ });

    fireEvent.change(name, { target: { value: "Acme" } });
    expect(mocks.saveAnswer).not.toHaveBeenCalled();
    fireEvent.blur(name);
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledExactlyOnceWith(
      "customer-1",
      "form-1",
      { fieldId: "Name", groupEntryId: null, values: ["Acme"] },
    );
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "last edited by Ada",
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    });
    expect(mocks.saveAnswer).toHaveBeenCalledOnce();
  });

  it("keeps the input after a failed save and offers a retry", async () => {
    mocks.saveAnswer.mockResolvedValueOnce({ ok: false, code: E.Unavailable });
    renderView();
    const name = screen.getByRole("textbox", { name: /Name/ });

    fireEvent.change(name, { target: { value: "Acme" } });
    fireEvent.blur(name);
    await settle();

    expect(name).toHaveValue("Acme");
    expect(screen.getByText(content.errors.unavailable)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: content.draft.retry }));
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(content.errors.unavailable)).toBeNull();
  });

  it("names why a value is not saved and never sends it", async () => {
    renderView(form({ answers: [answer("Shop", { choiceId: "Shop-Yes" })] }));
    const link = screen.getByRole("textbox", { name: /Shop link/ });

    fireEvent.change(link, { target: { value: "example" } });
    fireEvent.blur(link);
    await settle();

    expect(link).toHaveValue("example");
    expect(link).toHaveAccessibleDescription(content.field.errors.invalid_url);
    expect(mocks.saveAnswer).not.toHaveBeenCalled();
  });

  it("lists every missing required answer in the review and jumps to its field", () => {
    open("?section=review");
    renderView(form({ answers: [answer("Shop", { choiceId: "Shop-Yes" })] }));

    expect(
      screen.getByRole("heading", { level: 2, name: content.submit.heading }),
    ).toBeInTheDocument();
    // The step track is a list as well; the missing answers are the entries that jump.
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(
      expect.arrayContaining([
        "Name in “Company”",
        "Shop link in “Company”",
        "Claim in “Brand”",
      ]),
    );
    expect(
      screen.getByRole("button", { name: content.submit.action }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Claim in “Brand”" }));

    expect(window.location.search).toBe("?section=Brand&field=Claim");
    expect(screen.getByRole("textbox", { name: /Claim/ })).toHaveFocus();
  });

  it("does not count a hidden required field as missing", () => {
    open("?section=review");
    renderView(
      form({
        answers: [
          answer("Name", { value: "Acme" }),
          answer("Claim", { value: "Bold" }),
        ],
      }),
    );

    expect(screen.getByText(content.submit.complete)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.submit.action }),
    ).toBeEnabled();
  });

  it("waits for pending saves before it submits, then reloads the page", async () => {
    let finish!: (value: typeof SAVED) => void;
    mocks.saveAnswer.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    mocks.submit.mockResolvedValue({ ok: true, value: { id: "form-1" } });
    renderView(form({ answers: [answer("Name", { value: "Acme" })] }));
    fireEvent.click(stepButton("Brand"));
    fireEvent.change(screen.getByRole("textbox", { name: /Claim/ }), {
      target: { value: "Bold" },
    });
    fireEvent.click(stepButton(content.steps.review));

    fireEvent.click(
      screen.getByRole("button", { name: content.submit.action }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.submitDialog.confirm }),
    );
    await settle();
    expect(mocks.saveAnswer).toHaveBeenCalledOnce();
    expect(mocks.submit).not.toHaveBeenCalled();

    finish(SAVED);
    await settle();

    expect(mocks.submit).toHaveBeenCalledExactlyOnceWith(
      "customer-1",
      "form-1",
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("does not submit when a save fails", async () => {
    mocks.saveAnswer.mockResolvedValue({ ok: false, code: E.Unavailable });
    renderView(form({ answers: [answer("Name", { value: "Acme" })] }));
    fireEvent.click(stepButton("Brand"));
    fireEvent.change(screen.getByRole("textbox", { name: /Claim/ }), {
      target: { value: "Bold" },
    });
    fireEvent.click(stepButton(content.steps.review));

    fireEvent.click(
      screen.getByRole("button", { name: content.submit.action }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.submitDialog.confirm }),
    );
    await settle();

    expect(mocks.submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      content.submit.notSaved,
    );
  });

  it("shows the answers read-only with date and contact once submitted", () => {
    renderView(
      form({
        status: OnboardingFormStatus.Submitted,
        submittedAt: "2026-10-01T10:00:00.000Z",
        submittedByName: "Ada Lovelace",
        editableBlockIds: [],
        answers: [answer("Name", { value: "Acme" })],
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: /Submitted on .*2026.*Ada Lovelace/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.states.submitted.description),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText(content.read.unanswered)).toBeInTheDocument();
  });

  it("gives the owner view the answers and the way into the CRM, never the form", () => {
    renderView(
      form({ canSubmit: false, editableBlockIds: [] }),
      "/en/crm/onboarding/form-1",
    );

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("link", { name: content.page.ownerLink }),
    ).toHaveAttribute("href", "/en/crm/onboarding/form-1");
  });

  it("names a block whose texts fell back to another language", () => {
    const dto = form();
    dto.blocks[0].fallbackLocale = "de";
    dto.blocks[0].prefilled = true;
    renderView(dto);

    expect(
      screen.getByText("This section is only available in German."),
    ).toBeInTheDocument();
    expect(screen.getByText(content.block.prefilled)).toBeInTheDocument();
  });
});
